// CrashlyticsService.ts - 에러 트래킹 서비스
// Firebase Crashlytics 연동

import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

// 에러 로그 저장용 (Crashlytics 미설치 시 로컬 저장)
const ERROR_LOG_KEY = 'errorLogs';
const MAX_ERROR_LOGS = 100;

interface ErrorLog {
    id: string;
    message: string;
    stack?: string;
    context?: Record<string, any>;
    timestamp: number;
    userId?: string;
    screenName?: string;
}

class CrashlyticsService {
    private static instance: CrashlyticsService;
    private userId: string | null = null;
    private crashlytics: any = null;

    static getInstance(): CrashlyticsService {
        if (!CrashlyticsService.instance) {
            CrashlyticsService.instance = new CrashlyticsService();
        }
        return CrashlyticsService.instance;
    }

    // 초기화
    async initialize(): Promise<void> {
        try {
            // Firebase Crashlytics 동적 임포트 시도
            // 설치되지 않은 경우 로컬 로깅으로 폴백
            if (Platform.OS !== 'web') {
                try {
                    // @ts-ignore - 동적 import, 모듈 미설치 시 catch에서 처리
                    const crashlyticsModule = await import('@react-native-firebase/crashlytics');
                    this.crashlytics = crashlyticsModule.default();
                    console.log('[Crashlytics] Firebase Crashlytics 초기화됨');
                } catch (e) {
                    console.log('[Crashlytics] Firebase Crashlytics 미설치, 로컬 로깅 사용');
                }
            }

            // 사용자 ID 로드
            const userId = await AsyncStorage.getItem('userId');
            if (userId) {
                this.setUserId(userId);
            }
        } catch (e) {
            console.log('[Crashlytics] 초기화 실패:', e);
        }
    }

    // 사용자 ID 설정
    setUserId(userId: string): void {
        this.userId = userId;
        if (this.crashlytics) {
            this.crashlytics.setUserId(userId);
        }
    }

    // 사용자 속성 설정
    setUserAttribute(key: string, value: string): void {
        if (this.crashlytics) {
            this.crashlytics.setAttribute(key, value);
        }
    }

    // 에러 로깅
    async logError(error: Error, context?: Record<string, any>): Promise<void> {
        const errorLog: ErrorLog = {
            id: `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            message: error.message,
            stack: error.stack,
            context,
            timestamp: Date.now(),
            userId: this.userId || undefined,
        };

        console.error('[Crashlytics] 에러 로그:', error.message);

        if (this.crashlytics) {
            // Firebase Crashlytics로 전송
            if (context) {
                Object.entries(context).forEach(([key, value]) => {
                    this.crashlytics.setAttribute(key, String(value));
                });
            }
            this.crashlytics.recordError(error);
        } else {
            // 로컬 저장
            await this.saveErrorLog(errorLog);
        }
    }

    // 비치명적 에러 로깅
    async logNonFatalError(message: string, context?: Record<string, any>): Promise<void> {
        const error = new Error(message);
        await this.logError(error, { ...context, fatal: false });
    }

    // 커스텀 로그
    log(message: string): void {
        console.log(`[App] ${message}`);
        if (this.crashlytics) {
            this.crashlytics.log(message);
        }
    }

    // 화면 이름 설정
    setCurrentScreen(screenName: string): void {
        if (this.crashlytics) {
            this.crashlytics.setAttribute('current_screen', screenName);
        }
    }

    // 로컬 에러 로그 저장
    private async saveErrorLog(log: ErrorLog): Promise<void> {
        try {
            const logsStr = await AsyncStorage.getItem(ERROR_LOG_KEY);
            let logs: ErrorLog[] = logsStr ? JSON.parse(logsStr) : [];

            logs.unshift(log);

            // 최대 개수 제한
            if (logs.length > MAX_ERROR_LOGS) {
                logs = logs.slice(0, MAX_ERROR_LOGS);
            }

            await AsyncStorage.setItem(ERROR_LOG_KEY, JSON.stringify(logs));
        } catch (e) {
            console.log('[Crashlytics] 로컬 저장 실패:', e);
        }
    }

    // 로컬 에러 로그 가져오기
    async getErrorLogs(): Promise<ErrorLog[]> {
        try {
            const logsStr = await AsyncStorage.getItem(ERROR_LOG_KEY);
            return logsStr ? JSON.parse(logsStr) : [];
        } catch (e) {
            return [];
        }
    }

    // 로컬 에러 로그 삭제
    async clearErrorLogs(): Promise<void> {
        await AsyncStorage.removeItem(ERROR_LOG_KEY);
    }

    // 글로벌 에러 핸들러 설정
    setupGlobalErrorHandler(): void {
        const originalHandler = ErrorUtils.getGlobalHandler();

        ErrorUtils.setGlobalHandler((error: Error, isFatal?: boolean) => {
            this.logError(error, { fatal: isFatal });
            originalHandler(error, isFatal);
        });

        console.log('[Crashlytics] 글로벌 에러 핸들러 설정됨');
    }
}

export const crashlyticsService = CrashlyticsService.getInstance();
export default crashlyticsService;
