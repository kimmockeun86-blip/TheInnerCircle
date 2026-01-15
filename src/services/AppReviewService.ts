import { Platform, Linking } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
// In-App Review 사용 시: import * as StoreReview from 'expo-store-review';

// App Review Service - 7일 후 앱스토어 리뷰 요청

const REVIEW_CONFIG = {
    MINIMUM_DAYS: 7,           // 최소 7일 사용
    MINIMUM_SESSIONS: 5,       // 최소 5회 세션
    MINIMUM_MISSIONS: 3,       // 최소 3개 미션 완료
    MAX_PROMPTS: 2,            // 최대 2번 요청
    DAYS_BETWEEN_PROMPTS: 30,  // 재요청 간격 30일
};

const STORAGE_KEYS = {
    INSTALL_DATE: 'appReview_installDate',
    SESSION_COUNT: 'appReview_sessionCount',
    MISSION_COUNT: 'appReview_missionCount',
    REVIEW_PROMPTED: 'appReview_promptedAt',
    REVIEW_COMPLETED: 'appReview_completed',
    PROMPT_COUNT: 'appReview_promptCount',
};

class AppReviewService {
    private storeReview: any = null;

    // 앱 시작 시 호출 - 설치 날짜 및 세션 카운트
    async trackAppOpen(): Promise<void> {
        try {
            // 설치 날짜 기록 (첫 실행 시)
            const installDate = await AsyncStorage.getItem(STORAGE_KEYS.INSTALL_DATE);
            if (!installDate) {
                await AsyncStorage.setItem(STORAGE_KEYS.INSTALL_DATE, new Date().toISOString());
                console.log('[AppReview] Install date recorded');
            }

            // 세션 카운트 증가
            const sessionCount = await AsyncStorage.getItem(STORAGE_KEYS.SESSION_COUNT);
            const newCount = (parseInt(sessionCount || '0', 10) + 1).toString();
            await AsyncStorage.setItem(STORAGE_KEYS.SESSION_COUNT, newCount);
            console.log(`[AppReview] Session count: ${newCount}`);
        } catch (error) {
            console.log('[AppReview] Track error:', error);
        }
    }

    // 미션 완료 시 호출
    async trackMissionComplete(): Promise<void> {
        try {
            const missionCount = await AsyncStorage.getItem(STORAGE_KEYS.MISSION_COUNT);
            const newCount = (parseInt(missionCount || '0', 10) + 1).toString();
            await AsyncStorage.setItem(STORAGE_KEYS.MISSION_COUNT, newCount);
            console.log(`[AppReview] Mission count: ${newCount}`);
        } catch (error) {
            console.log('[AppReview] Track mission error:', error);
        }
    }

    // 리뷰 요청 조건 체크
    async canRequestReview(): Promise<boolean> {
        try {
            // 이미 리뷰 완료했으면 패스
            const completed = await AsyncStorage.getItem(STORAGE_KEYS.REVIEW_COMPLETED);
            if (completed === 'true') {
                return false;
            }

            // 최대 요청 횟수 초과했으면 패스
            const promptCount = parseInt(await AsyncStorage.getItem(STORAGE_KEYS.PROMPT_COUNT) || '0', 10);
            if (promptCount >= REVIEW_CONFIG.MAX_PROMPTS) {
                return false;
            }

            // 최근 요청 후 30일이 안 지났으면 패스
            const lastPrompt = await AsyncStorage.getItem(STORAGE_KEYS.REVIEW_PROMPTED);
            if (lastPrompt) {
                const daysSincePrompt = Math.floor((Date.now() - new Date(lastPrompt).getTime()) / (1000 * 60 * 60 * 24));
                if (daysSincePrompt < REVIEW_CONFIG.DAYS_BETWEEN_PROMPTS) {
                    return false;
                }
            }

            // 설치 후 7일 지났는지 체크
            const installDate = await AsyncStorage.getItem(STORAGE_KEYS.INSTALL_DATE);
            if (installDate) {
                const daysSinceInstall = Math.floor((Date.now() - new Date(installDate).getTime()) / (1000 * 60 * 60 * 24));
                if (daysSinceInstall < REVIEW_CONFIG.MINIMUM_DAYS) {
                    console.log(`[AppReview] Not enough days: ${daysSinceInstall}/${REVIEW_CONFIG.MINIMUM_DAYS}`);
                    return false;
                }
            } else {
                return false;
            }

            // 세션 수 체크
            const sessionCount = parseInt(await AsyncStorage.getItem(STORAGE_KEYS.SESSION_COUNT) || '0', 10);
            if (sessionCount < REVIEW_CONFIG.MINIMUM_SESSIONS) {
                console.log(`[AppReview] Not enough sessions: ${sessionCount}/${REVIEW_CONFIG.MINIMUM_SESSIONS}`);
                return false;
            }

            // 미션 완료 수 체크
            const missionCount = parseInt(await AsyncStorage.getItem(STORAGE_KEYS.MISSION_COUNT) || '0', 10);
            if (missionCount < REVIEW_CONFIG.MINIMUM_MISSIONS) {
                console.log(`[AppReview] Not enough missions: ${missionCount}/${REVIEW_CONFIG.MINIMUM_MISSIONS}`);
                return false;
            }

            console.log('[AppReview] ✅ All conditions met, can request review');
            return true;

        } catch (error) {
            console.log('[AppReview] Check error:', error);
            return false;
        }
    }

    // 리뷰 요청 (네이티브 In-App Review 또는 스토어 링크)
    async requestReview(): Promise<boolean> {
        try {
            const canRequest = await this.canRequestReview();
            if (!canRequest) {
                return false;
            }

            // 요청 기록
            await AsyncStorage.setItem(STORAGE_KEYS.REVIEW_PROMPTED, new Date().toISOString());
            const promptCount = parseInt(await AsyncStorage.getItem(STORAGE_KEYS.PROMPT_COUNT) || '0', 10);
            await AsyncStorage.setItem(STORAGE_KEYS.PROMPT_COUNT, (promptCount + 1).toString());

            // In-App Review 사용 (expo-store-review)
            try {
                const StoreReview = require('expo-store-review');
                if (await StoreReview.isAvailableAsync()) {
                    await StoreReview.requestReview();
                    console.log('[AppReview] In-app review requested');
                    return true;
                }
            } catch (storeError) {
                console.log('[AppReview] StoreReview not available:', storeError);
            }

            // In-App Review 불가능하면 스토어 링크로 이동
            this.openStoreLink();
            return true;

        } catch (error) {
            console.log('[AppReview] Request error:', error);
            return false;
        }
    }

    // 스토어 링크 열기
    openStoreLink(): void {
        const iosAppId = '6740606490';  // 실제 App Store ID
        const androidPackage = 'com.holyheart.orbit';  // 실제 패키지명

        if (Platform.OS === 'ios') {
            Linking.openURL(`https://apps.apple.com/app/id${iosAppId}?action=write-review`);
        } else if (Platform.OS === 'android') {
            Linking.openURL(`market://details?id=${androidPackage}`);
        }
    }

    // 사용자가 "다시 묻지 않기" 선택 시
    async markReviewCompleted(): Promise<void> {
        await AsyncStorage.setItem(STORAGE_KEYS.REVIEW_COMPLETED, 'true');
        console.log('[AppReview] Marked as completed');
    }

    // 디버깅용 - 상태 리셋
    async resetReviewState(): Promise<void> {
        await AsyncStorage.multiRemove(Object.values(STORAGE_KEYS));
        console.log('[AppReview] State reset');
    }
}

export const appReviewService = new AppReviewService();
export default appReviewService;
