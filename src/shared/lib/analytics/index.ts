/**
 * Analytics Wrapper
 * Firebase Analytics를 감싸는 인터페이스
 * 
 * 2026-01-13 생성: Anti-Gravity Architecture
 */
import { Platform } from 'react-native';

export interface AnalyticsEvent {
    name: string;
    params?: Record<string, any>;
}

class AnalyticsWrapper {
    private isInitialized: boolean = false;
    private analytics: any = null;

    async initialize(): Promise<void> {
        if (this.isInitialized) return;

        try {
            if (Platform.OS !== 'web') {
                // Firebase Analytics는 현재 initializeApp이 별도로 필요
                // 실제 구현은 Firebase 초기화 후 사용
                console.log('[AnalyticsWrapper] Mobile analytics ready');
            }
            this.isInitialized = true;
        } catch (error) {
            console.error('[AnalyticsWrapper] Initialization error:', error);
        }
    }

    async logEvent(eventName: string, params?: Record<string, any>): Promise<void> {
        try {
            console.log(`[Analytics] Event: ${eventName}`, params);
            // 실제 Firebase 로깅은 기존 AnalyticsService를 통해 처리
        } catch (error) {
            console.error('[AnalyticsWrapper] logEvent error:', error);
        }
    }

    async setUserId(userId: string): Promise<void> {
        try {
            console.log(`[Analytics] User ID set: ${userId}`);
        } catch (error) {
            console.error('[AnalyticsWrapper] setUserId error:', error);
        }
    }

    async setUserProperty(name: string, value: string): Promise<void> {
        try {
            console.log(`[Analytics] User property: ${name} = ${value}`);
        } catch (error) {
            console.error('[AnalyticsWrapper] setUserProperty error:', error);
        }
    }
}

const analytics = new AnalyticsWrapper();
export default analytics;
export { AnalyticsWrapper };
