// AnalyticsService.ts - Firebase Analytics 이벤트 추적
// 사용자 행동 분석 및 앱 사용 패턴 추적

import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

// 이벤트 타입 정의
type AnalyticsEvent =
    | 'app_open'
    | 'onboarding_start'
    | 'onboarding_complete'
    | 'mission_view'
    | 'mission_complete'
    | 'journal_start'
    | 'journal_complete'
    | 'ai_analysis_request'
    | 'ai_analysis_success'
    | 'ai_analysis_fail'
    | 'advice_view'
    | 'notification_received'
    | 'notification_click'
    | 'ad_view'
    | 'ad_click'
    | 'purchase_start'
    | 'purchase_complete'
    | 'screen_view'
    | 'button_click'
    | 'error_occurred';

interface EventParams {
    [key: string]: string | number | boolean | undefined;
}

// 로컬 저장용 이벤트 로그
const EVENT_LOG_KEY = 'analyticsEvents';
const MAX_EVENT_LOGS = 500;

class AnalyticsService {
    private static instance: AnalyticsService;
    private analytics: any = null;
    private userId: string | null = null;

    static getInstance(): AnalyticsService {
        if (!AnalyticsService.instance) {
            AnalyticsService.instance = new AnalyticsService();
        }
        return AnalyticsService.instance;
    }

    // 초기화
    async initialize(): Promise<void> {
        try {
            if (Platform.OS !== 'web') {
                try {
                    // @ts-ignore - 동적 import, 모듈 미설치 시 catch에서 처리
                    const analyticsModule = await import('@react-native-firebase/analytics');
                    this.analytics = analyticsModule.default();
                    console.log('[Analytics] Firebase Analytics 초기화됨');
                } catch (e) {
                    console.log('[Analytics] Firebase Analytics 미설치, 로컬 로깅 사용');
                }
            }

            // 사용자 ID 로드
            const userId = await AsyncStorage.getItem('userId');
            if (userId) {
                this.setUserId(userId);
            }

            // 앱 시작 이벤트
            this.logEvent('app_open');
        } catch (e) {
            console.log('[Analytics] 초기화 실패:', e);
        }
    }

    // 사용자 ID 설정
    async setUserId(userId: string): Promise<void> {
        this.userId = userId;
        if (this.analytics) {
            await this.analytics.setUserId(userId);
        }
    }

    // 사용자 속성 설정
    async setUserProperty(name: string, value: string): Promise<void> {
        if (this.analytics) {
            await this.analytics.setUserProperty(name, value);
        }
    }

    // 이벤트 로깅
    async logEvent(event: AnalyticsEvent, params?: EventParams): Promise<void> {
        const eventData = {
            event,
            params: params || {},
            timestamp: Date.now(),
            userId: this.userId,
        };

        console.log(`[Analytics] 이벤트: ${event}`, params);

        if (this.analytics) {
            await this.analytics.logEvent(event, params);
        } else {
            // 로컬 저장
            await this.saveEventLog(eventData);
        }
    }

    // 화면 조회 이벤트
    async logScreenView(screenName: string, screenClass?: string): Promise<void> {
        if (this.analytics) {
            await this.analytics.logScreenView({
                screen_name: screenName,
                screen_class: screenClass || screenName,
            });
        }

        await this.logEvent('screen_view', {
            screen_name: screenName,
            screen_class: screenClass || screenName,
        });
    }

    // === 미션 관련 이벤트 ===
    async logMissionView(dayCount: number, missionText: string): Promise<void> {
        await this.logEvent('mission_view', {
            day_count: dayCount,
            mission_text: missionText.substring(0, 100),
        });
    }

    async logMissionComplete(dayCount: number, journalLength: number): Promise<void> {
        await this.logEvent('mission_complete', {
            day_count: dayCount,
            journal_length: journalLength,
        });
    }

    // === 온보딩 이벤트 ===
    async logOnboardingStart(): Promise<void> {
        await this.logEvent('onboarding_start');
    }

    async logOnboardingComplete(deficit: string): Promise<void> {
        await this.logEvent('onboarding_complete', { deficit });
    }

    // === AI 분석 이벤트 ===
    async logAIAnalysisRequest(type: 'profile' | 'journal' | 'advice'): Promise<void> {
        await this.logEvent('ai_analysis_request', { type });
    }

    async logAIAnalysisSuccess(type: 'profile' | 'journal' | 'advice'): Promise<void> {
        await this.logEvent('ai_analysis_success', { type });
    }

    async logAIAnalysisFail(type: 'profile' | 'journal' | 'advice', error: string): Promise<void> {
        await this.logEvent('ai_analysis_fail', {
            type,
            error: error.substring(0, 100),
        });
    }

    // === 광고 이벤트 ===
    async logAdView(adType: 'banner' | 'interstitial' | 'rewarded'): Promise<void> {
        await this.logEvent('ad_view', { ad_type: adType });
    }

    async logAdClick(adType: 'banner' | 'interstitial' | 'rewarded'): Promise<void> {
        await this.logEvent('ad_click', { ad_type: adType });
    }

    // === 구매 이벤트 ===
    async logPurchaseStart(productId: string, price: number): Promise<void> {
        await this.logEvent('purchase_start', {
            product_id: productId,
            price,
        });
    }

    async logPurchaseComplete(productId: string, price: number): Promise<void> {
        await this.logEvent('purchase_complete', {
            product_id: productId,
            price,
        });
    }

    // === 알림 이벤트 ===
    async logNotificationReceived(type: string): Promise<void> {
        await this.logEvent('notification_received', { type });
    }

    async logNotificationClick(type: string): Promise<void> {
        await this.logEvent('notification_click', { type });
    }

    // 로컬 이벤트 저장
    private async saveEventLog(eventData: any): Promise<void> {
        try {
            const logsStr = await AsyncStorage.getItem(EVENT_LOG_KEY);
            let logs = logsStr ? JSON.parse(logsStr) : [];

            logs.unshift(eventData);

            if (logs.length > MAX_EVENT_LOGS) {
                logs = logs.slice(0, MAX_EVENT_LOGS);
            }

            await AsyncStorage.setItem(EVENT_LOG_KEY, JSON.stringify(logs));
        } catch (e) {
            console.log('[Analytics] 로컬 저장 실패:', e);
        }
    }

    // 로컬 이벤트 가져오기
    async getEventLogs(): Promise<any[]> {
        try {
            const logsStr = await AsyncStorage.getItem(EVENT_LOG_KEY);
            return logsStr ? JSON.parse(logsStr) : [];
        } catch (e) {
            return [];
        }
    }
}

export const analyticsService = AnalyticsService.getInstance();
export default analyticsService;
