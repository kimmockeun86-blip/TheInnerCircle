/**
 * 기념일 리마인더 서비스
 * 중요한 날짜 저장 및 알림 관리
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import notificationService from './NotificationService';
import logger from '../utils/logger';

export interface Anniversary {
    id: string;
    name: string;
    date: string; // YYYY-MM-DD
    type: 'birthday' | 'firstMeet' | 'anniversary' | 'wedding' | 'custom';
    repeatYearly: boolean;
    notifyDaysBefore: number; // D-day 며칠 전 알림
    emoji: string;
}

const STORAGE_KEY = 'anniversaries';

// 기본 기념일 타입
export const ANNIVERSARY_TYPES: Record<Anniversary['type'], { name: string; emoji: string }> = {
    birthday: { name: '생일', emoji: '🎂' },
    firstMeet: { name: '첫만남', emoji: '💕' },
    anniversary: { name: '기념일', emoji: '💝' },
    wedding: { name: '결혼기념일', emoji: '💒' },
    custom: { name: '기타', emoji: '📅' },
};

class AnniversaryService {
    private anniversaries: Anniversary[] = [];

    /**
     * 서비스 초기화 - 저장된 기념일 로드
     */
    async initialize(): Promise<void> {
        try {
            const stored = await AsyncStorage.getItem(STORAGE_KEY);
            if (stored) {
                this.anniversaries = JSON.parse(stored);
                logger.log(`[Anniversary] ${this.anniversaries.length}개 기념일 로드됨`);

                // 알림 스케줄 갱신
                await this.scheduleAllNotifications();
            }
        } catch (error) {
            logger.error('[Anniversary] 초기화 실패:', error);
        }
    }

    /**
     * 기념일 추가
     */
    async addAnniversary(anniversary: Omit<Anniversary, 'id'>): Promise<Anniversary> {
        const newAnniversary: Anniversary = {
            ...anniversary,
            id: `anniversary_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        };

        this.anniversaries.push(newAnniversary);
        await this.save();
        await this.scheduleNotification(newAnniversary);

        logger.log(`[Anniversary] 추가됨: ${newAnniversary.name}`);
        return newAnniversary;
    }

    /**
     * 기념일 수정
     */
    async updateAnniversary(id: string, updates: Partial<Anniversary>): Promise<boolean> {
        const index = this.anniversaries.findIndex(a => a.id === id);
        if (index === -1) return false;

        this.anniversaries[index] = { ...this.anniversaries[index], ...updates };
        await this.save();
        await this.scheduleNotification(this.anniversaries[index]);

        return true;
    }

    /**
     * 기념일 삭제
     */
    async deleteAnniversary(id: string): Promise<boolean> {
        const index = this.anniversaries.findIndex(a => a.id === id);
        if (index === -1) return false;

        this.anniversaries.splice(index, 1);
        await this.save();

        return true;
    }

    /**
     * 모든 기념일 가져오기
     */
    getAll(): Anniversary[] {
        return [...this.anniversaries];
    }

    /**
     * 다가오는 기념일 가져오기 (30일 이내)
     */
    getUpcoming(days: number = 30): Array<Anniversary & { dDay: number; nextDate: Date }> {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        return this.anniversaries
            .map(a => {
                const nextDate = this.getNextOccurrence(a);
                const dDay = Math.ceil((nextDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
                return { ...a, dDay, nextDate };
            })
            .filter(a => a.dDay >= 0 && a.dDay <= days)
            .sort((a, b) => a.dDay - b.dDay);
    }

    /**
     * 오늘인 기념일 가져오기
     */
    getTodaysAnniversaries(): Anniversary[] {
        const today = new Date();
        const todayStr = `${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;

        return this.anniversaries.filter(a => {
            const [, month, day] = a.date.split('-');
            return `${month}-${day}` === todayStr;
        });
    }

    /**
     * D-Day 계산
     */
    getDDay(anniversary: Anniversary): number {
        const nextDate = this.getNextOccurrence(anniversary);
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        return Math.ceil((nextDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    }

    /**
     * 다음 발생일 계산
     */
    private getNextOccurrence(anniversary: Anniversary): Date {
        const [year, month, day] = anniversary.date.split('-').map(Number);
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        let nextDate = new Date(today.getFullYear(), month - 1, day);

        if (anniversary.repeatYearly) {
            // 올해 날짜가 지났으면 내년으로
            if (nextDate < today) {
                nextDate = new Date(today.getFullYear() + 1, month - 1, day);
            }
        } else {
            // 반복 안 함 - 원래 날짜 그대로
            nextDate = new Date(year, month - 1, day);
        }

        return nextDate;
    }

    /**
     * 알림 스케줄링 (NotificationService의 기존 메서드 활용)
     */
    private async scheduleNotification(anniversary: Anniversary): Promise<void> {
        try {
            // 기념일 당일 알림을 위한 로깅
            // 실제 스케줄링은 앱 시작 시 getTodaysAnniversaries로 확인 후 showNotification 호출
            logger.log(`[Anniversary] 알림 등록: ${anniversary.name} (${anniversary.date})`);

            // D-day에 즉시 알림 표시 (앱 실행 시점이 D-day인 경우)
            const today = new Date();
            const nextDate = this.getNextOccurrence(anniversary);
            const dDay = Math.ceil((nextDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

            if (dDay === 0) {
                // 오늘이 기념일!
                await notificationService.showNotification({
                    title: `${anniversary.emoji} ${anniversary.name}`,
                    body: '오늘은 특별한 날이에요!'
                });
            } else if (dDay === anniversary.notifyDaysBefore && anniversary.notifyDaysBefore > 0) {
                // D-N 리마인더
                await notificationService.showNotification({
                    title: `${anniversary.emoji} ${anniversary.name} D-${dDay}`,
                    body: `${anniversary.name}까지 ${dDay}일 남았어요!`
                });
            }
        } catch (error) {
            logger.error('[Anniversary] 알림 스케줄 실패:', error);
        }
    }

    /**
     * 모든 기념일 알림 스케줄
     */
    private async scheduleAllNotifications(): Promise<void> {
        for (const anniversary of this.anniversaries) {
            await this.scheduleNotification(anniversary);
        }
    }

    /**
     * 저장
     */
    private async save(): Promise<void> {
        try {
            await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(this.anniversaries));
        } catch (error) {
            logger.error('[Anniversary] 저장 실패:', error);
        }
    }
}

export const anniversaryService = new AnniversaryService();
export default anniversaryService;
