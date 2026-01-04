// OfflineQueueService.ts - 오프라인 재시도 로직
// 네트워크 실패 시 요청을 큐에 저장하고 복구 시 자동 재시도

import AsyncStorage from '@react-native-async-storage/async-storage';
import NetInfo from '@react-native-community/netinfo';

interface QueuedRequest {
    id: string;
    type: 'journal' | 'profile' | 'advice';
    data: any;
    timestamp: number;
    retryCount: number;
}

const QUEUE_KEY = 'offlineRequestQueue';
const MAX_RETRIES = 3;

class OfflineQueueService {
    private static instance: OfflineQueueService;
    private isProcessing: boolean = false;
    private unsubscribe: (() => void) | null = null;

    static getInstance(): OfflineQueueService {
        if (!OfflineQueueService.instance) {
            OfflineQueueService.instance = new OfflineQueueService();
        }
        return OfflineQueueService.instance;
    }

    // 서비스 초기화 및 네트워크 상태 감시
    async initialize(): Promise<void> {
        console.log('[OfflineQueue] 초기화 시작');

        // 네트워크 상태 변화 감시
        this.unsubscribe = NetInfo.addEventListener(state => {
            if (state.isConnected && state.isInternetReachable) {
                console.log('[OfflineQueue] 네트워크 연결됨, 큐 처리 시작');
                this.processQueue();
            }
        });

        // 앱 시작 시 대기 중인 요청 처리
        const state = await NetInfo.fetch();
        if (state.isConnected && state.isInternetReachable) {
            this.processQueue();
        }
    }

    // 리소스 정리
    cleanup(): void {
        if (this.unsubscribe) {
            this.unsubscribe();
            this.unsubscribe = null;
        }
    }

    // 요청을 큐에 추가
    async addToQueue(type: QueuedRequest['type'], data: any): Promise<string> {
        const request: QueuedRequest = {
            id: `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            type,
            data,
            timestamp: Date.now(),
            retryCount: 0,
        };

        const queue = await this.getQueue();
        queue.push(request);
        await AsyncStorage.setItem(QUEUE_KEY, JSON.stringify(queue));

        console.log(`[OfflineQueue] 요청 추가됨: ${request.id} (${type})`);
        return request.id;
    }

    // 큐 가져오기
    private async getQueue(): Promise<QueuedRequest[]> {
        try {
            const queueStr = await AsyncStorage.getItem(QUEUE_KEY);
            return queueStr ? JSON.parse(queueStr) : [];
        } catch (e) {
            console.log('[OfflineQueue] 큐 로드 실패:', e);
            return [];
        }
    }

    // 큐 저장
    private async saveQueue(queue: QueuedRequest[]): Promise<void> {
        await AsyncStorage.setItem(QUEUE_KEY, JSON.stringify(queue));
    }

    // 큐 처리
    async processQueue(): Promise<void> {
        if (this.isProcessing) {
            console.log('[OfflineQueue] 이미 처리 중...');
            return;
        }

        this.isProcessing = true;
        const queue = await this.getQueue();

        if (queue.length === 0) {
            console.log('[OfflineQueue] 처리할 요청 없음');
            this.isProcessing = false;
            return;
        }

        console.log(`[OfflineQueue] ${queue.length}개 요청 처리 시작`);

        const { api } = require('./api');
        const remainingQueue: QueuedRequest[] = [];

        for (const request of queue) {
            try {
                let success = false;

                switch (request.type) {
                    case 'journal':
                        const journalResult = await api.analyzeJournal(request.data);
                        success = journalResult.success;
                        break;
                    case 'profile':
                        const profileResult = await api.analyzeProfile(request.data);
                        success = profileResult.success;
                        break;
                    case 'advice':
                        const adviceResult = await api.getPersonalizedAdvice(request.data);
                        success = !!adviceResult?.advice;
                        break;
                }

                if (success) {
                    console.log(`[OfflineQueue] 요청 성공: ${request.id}`);
                } else {
                    throw new Error('API 실패');
                }
            } catch (e) {
                request.retryCount++;
                if (request.retryCount < MAX_RETRIES) {
                    console.log(`[OfflineQueue] 재시도 예정 (${request.retryCount}/${MAX_RETRIES}): ${request.id}`);
                    remainingQueue.push(request);
                } else {
                    console.log(`[OfflineQueue] 최대 재시도 초과, 삭제: ${request.id}`);
                }
            }
        }

        await this.saveQueue(remainingQueue);
        this.isProcessing = false;

        console.log(`[OfflineQueue] 처리 완료. 남은 요청: ${remainingQueue.length}개`);
    }

    // 큐 상태 확인
    async getQueueStatus(): Promise<{ count: number; items: QueuedRequest[] }> {
        const queue = await this.getQueue();
        return { count: queue.length, items: queue };
    }

    // 큐 비우기
    async clearQueue(): Promise<void> {
        await AsyncStorage.removeItem(QUEUE_KEY);
        console.log('[OfflineQueue] 큐 비워짐');
    }
}

export const offlineQueueService = OfflineQueueService.getInstance();
export default offlineQueueService;
