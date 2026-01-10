// AdService.ts - 광고 관리 서비스
// 사용자가 앱에 의존하는 단계에서 광고 표시
// 광고 제거 인앱 구매 지원

import { Platform, Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

// 광고 설정 상수
const AD_CONFIG = {
    // 광고 표시 시작 조건 (dayCount 기준)
    MIN_DAY_FOR_ADS: 7,

    // 광고 제거 가격 (KRW)
    AD_REMOVAL_PRICE: 7900,
    AD_REMOVAL_PRICE_USD: 6.99,

    // AdMob Unit IDs
    // TODO: 실제 배포 시 아래 PRODUCTION_* 값을 실제 광고 Unit ID로 교체하세요!
    // 테스트 ID (개발용)
    TEST_BANNER_IOS: 'ca-app-pub-3940256099942544/2934735716',
    TEST_BANNER_ANDROID: 'ca-app-pub-3940256099942544/6300978111',
    TEST_INTERSTITIAL_IOS: 'ca-app-pub-3940256099942544/4411468910',
    TEST_INTERSTITIAL_ANDROID: 'ca-app-pub-3940256099942544/1033173712',
    TEST_REWARDED_IOS: 'ca-app-pub-3940256099942544/1712485313',
    TEST_REWARDED_ANDROID: 'ca-app-pub-3940256099942544/5224354917',

    // 프로덕션 ID (실제 배포 시 교체 필요)
    // 아래 ID들을 AdMob 콘솔에서 발급받은 실제 ID로 교체하세요
    PRODUCTION_BANNER_IOS: 'ca-app-pub-7689737888273944/4546550326',
    PRODUCTION_BANNER_ANDROID: 'ca-app-pub-7689737888273944/8645577438',
    PRODUCTION_INTERSTITIAL_IOS: 'ca-app-pub-7689737888273944/2576677311',
    PRODUCTION_INTERSTITIAL_ANDROID: 'ca-app-pub-7689737888273944/1710495810',
    PRODUCTION_REWARDED_IOS: 'ca-app-pub-7689737888273944/8275904168',
    PRODUCTION_REWARDED_ANDROID: 'ca-app-pub-7689737888273944/8294223645'

    // 현재 사용할 ID (프로덕션 ID가 없으면 테스트 ID 사용)
    BANNER_AD_UNIT_ID: Platform.select({
        ios: '', // 아래 getBannerAdUnitId()에서 동적으로 결정
        android: '',
        default: '',
    }),
    INTERSTITIAL_AD_UNIT_ID: Platform.select({
        ios: '',
        android: '',
        default: '',
    }),
    REWARDED_AD_UNIT_ID: Platform.select({
        ios: '',
        android: '',
        default: '',
    }),
};

// 인앱 구매 상품 ID
const IAP_PRODUCT_IDS = {
    AD_REMOVAL: Platform.select({
        ios: 'com.theinnercircle.app.adremoval',
        android: 'ad_removal_7900',
        default: 'ad_removal',
    }),
};

class AdService {
    private static instance: AdService;
    private isAdRemovalPurchased: boolean = false;
    private interstitialLoaded: boolean = false;
    private lastInterstitialTime: number = 0;

    // 전면 광고 최소 간격 (밀리초) - 3분
    private readonly MIN_INTERSTITIAL_INTERVAL = 3 * 60 * 1000;

    static getInstance(): AdService {
        if (!AdService.instance) {
            AdService.instance = new AdService();
        }
        return AdService.instance;
    }

    // 초기화
    async initialize(): Promise<void> {
        try {
            // 광고 제거 구매 상태 확인
            const purchased = await AsyncStorage.getItem('adRemovalPurchased');
            this.isAdRemovalPurchased = purchased === 'true';
            console.log('[AdService] 초기화 완료. 광고 제거:', this.isAdRemovalPurchased);
        } catch (e) {
            console.log('[AdService] 초기화 실패:', e);
        }
    }

    // 광고 표시 여부 확인
    async shouldShowAds(): Promise<boolean> {
        // 광고 제거 구매한 경우 표시 안함
        if (this.isAdRemovalPurchased) {
            return false;
        }

        // 웹에서는 광고 미지원
        if (Platform.OS === 'web') {
            return false;
        }

        // dayCount 체크 (최소 7일 이상 사용 시 광고 표시)
        try {
            const dayCount = await AsyncStorage.getItem('dayCount');
            const day = dayCount ? parseInt(dayCount, 10) : 1;
            return day >= AD_CONFIG.MIN_DAY_FOR_ADS;
        } catch (e) {
            return false;
        }
    }

    // 사용자 의존도 레벨 확인 (0-100)
    async getUserEngagementLevel(): Promise<number> {
        try {
            const dayCount = await AsyncStorage.getItem('dayCount');
            const missionCount = await AsyncStorage.getItem('missionCompletedCount');
            const journalHistory = await AsyncStorage.getItem('journalHistory');

            const day = dayCount ? parseInt(dayCount, 10) : 0;
            const missions = missionCount ? parseInt(missionCount, 10) : 0;
            const journals = journalHistory ? JSON.parse(journalHistory).length : 0;

            // 간단한 점수 계산
            let score = 0;
            score += Math.min(day * 5, 35);  // 최대 35점 (7일)
            score += Math.min(missions * 3, 30);  // 최대 30점 (10개)
            score += Math.min(journals * 5, 35);  // 최대 35점 (7개)

            return Math.min(score, 100);
        } catch (e) {
            return 0;
        }
    }

    // 배너 광고 Unit ID 가져오기 (프로덕션 ID가 있으면 사용, 없으면 테스트 ID)
    getBannerAdUnitId(): string {
        if (Platform.OS === 'ios') {
            return AD_CONFIG.PRODUCTION_BANNER_IOS || AD_CONFIG.TEST_BANNER_IOS;
        } else if (Platform.OS === 'android') {
            return AD_CONFIG.PRODUCTION_BANNER_ANDROID || AD_CONFIG.TEST_BANNER_ANDROID;
        }
        return '';
    }

    // 전면 광고 Unit ID 가져오기
    getInterstitialAdUnitId(): string {
        if (Platform.OS === 'ios') {
            return AD_CONFIG.PRODUCTION_INTERSTITIAL_IOS || AD_CONFIG.TEST_INTERSTITIAL_IOS;
        } else if (Platform.OS === 'android') {
            return AD_CONFIG.PRODUCTION_INTERSTITIAL_ANDROID || AD_CONFIG.TEST_INTERSTITIAL_ANDROID;
        }
        return '';
    }

    // 보상형 광고 Unit ID 가져오기
    getRewardedAdUnitId(): string {
        if (Platform.OS === 'ios') {
            return AD_CONFIG.PRODUCTION_REWARDED_IOS || AD_CONFIG.TEST_REWARDED_IOS;
        } else if (Platform.OS === 'android') {
            return AD_CONFIG.PRODUCTION_REWARDED_ANDROID || AD_CONFIG.TEST_REWARDED_ANDROID;
        }
        return '';
    }

    // 프로덕션 모드 여부 확인
    isProductionMode(): boolean {
        return !!(AD_CONFIG.PRODUCTION_BANNER_IOS || AD_CONFIG.PRODUCTION_BANNER_ANDROID);
    }

    // 전면 광고 표시 가능 여부 (쿨다운 체크)
    canShowInterstitial(): boolean {
        const now = Date.now();
        return now - this.lastInterstitialTime >= this.MIN_INTERSTITIAL_INTERVAL;
    }

    // 전면 광고 표시 후 시간 기록
    recordInterstitialShown(): void {
        this.lastInterstitialTime = Date.now();
    }

    // 광고 제거 구매 처리
    async purchaseAdRemoval(): Promise<boolean> {
        try {
            // TODO: 실제 인앱 구매 로직 구현
            // expo-in-app-purchases 또는 react-native-iap 사용

            // 테스트용: 바로 구매 완료 처리
            Alert.alert(
                '광고 제거',
                `광고 제거 기능을 ₩${AD_CONFIG.AD_REMOVAL_PRICE.toLocaleString()}에 구매하시겠습니까?`,
                [
                    { text: '취소', style: 'cancel' },
                    {
                        text: '구매',
                        onPress: async () => {
                            // 구매 성공 시뮬레이션
                            await AsyncStorage.setItem('adRemovalPurchased', 'true');
                            this.isAdRemovalPurchased = true;
                            Alert.alert('구매 완료', '광고가 제거되었습니다. 감사합니다!');
                        }
                    }
                ]
            );

            return true;
        } catch (e) {
            console.log('[AdService] 광고 제거 구매 실패:', e);
            Alert.alert('구매 실패', '잠시 후 다시 시도해주세요.');
            return false;
        }
    }

    // 구매 상태 복원
    async restorePurchases(): Promise<boolean> {
        try {
            // TODO: 실제 구매 복원 로직 구현
            const purchased = await AsyncStorage.getItem('adRemovalPurchased');
            if (purchased === 'true') {
                this.isAdRemovalPurchased = true;
                Alert.alert('복원 완료', '광고 제거가 복원되었습니다.');
                return true;
            } else {
                Alert.alert('복원 결과', '복원할 구매 내역이 없습니다.');
                return false;
            }
        } catch (e) {
            console.log('[AdService] 구매 복원 실패:', e);
            return false;
        }
    }

    // 광고 제거 구매 여부 확인
    isAdFree(): boolean {
        return this.isAdRemovalPurchased;
    }

    // 광고 제거 가격 가져오기
    getAdRemovalPrice(): string {
        return `₩${AD_CONFIG.AD_REMOVAL_PRICE.toLocaleString()}`;
    }

    // 인앱 구매 상품 ID 가져오기
    getAdRemovalProductId(): string {
        return IAP_PRODUCT_IDS.AD_REMOVAL || '';
    }
}

export default AdService.getInstance();
export { AD_CONFIG, IAP_PRODUCT_IDS };
