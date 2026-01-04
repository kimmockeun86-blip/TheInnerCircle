// i18n/index.ts - 다국어 지원 (i18n)
// 한국어, 영어, 일본어 지원

import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform, NativeModules } from 'react-native';

// 지원 언어
export type SupportedLanguage = 'ko' | 'en' | 'ja';

// 번역 키 타입
type TranslationKey = keyof typeof translations.ko;

// 번역 데이터
const translations = {
    ko: {
        // 공통
        app_name: 'ORBIT',
        confirm: '확인',
        cancel: '취소',
        save: '저장',
        delete: '삭제',
        close: '닫기',
        next: '다음',
        prev: '이전',
        done: '완료',
        loading: '로딩 중...',
        error: '오류',
        retry: '다시 시도',

        // 탭
        tab_home: '홈',
        tab_log: '기록',
        tab_profile: '프로필',

        // 홈 화면
        home_greeting: '안녕하세요, {name}님',
        home_day_count: 'Day {count}',
        home_today_mission: '오늘의 리추얼',
        home_mission_locked: '미션 잠김',
        home_unlock_time: '{hours}시간 {minutes}분 후 잠금 해제',
        home_start_reflection: '수행기록 남기기',
        home_orbit_signal: 'ORBIT의 조언',

        // 저널
        journal_title: '오늘의 기록',
        journal_placeholder: '오늘의 수행 기록을 남겨주세요...',
        journal_add_photo: '사진 추가',
        journal_submit: '기록 완료',
        journal_success: '기록이 저장되었습니다!',

        // AI 분석
        ai_analyzing: 'AI 분석 중...',
        ai_analysis_complete: 'AI 분석 완료',
        ai_analysis_failed: 'AI 분석 실패. 나중에 다시 시도해주세요.',

        // 온보딩
        onboarding_welcome: 'ORBIT에 오신 것을 환영합니다',
        onboarding_name: '이름을 입력해주세요',
        onboarding_deficit: '당신이 원하는 성장 영역은?',
        onboarding_complete: '시작하기',

        // 설정
        settings_title: '설정',
        settings_language: '언어',
        settings_notification: '알림',
        settings_remove_ads: '광고 제거',
        settings_restore_purchase: '구매 복원',
        settings_logout: '로그아웃',
        settings_delete_account: '계정 삭제',

        // 알림
        notification_morning: '좋은 아침! 오늘의 리추얼이 기다리고 있어요 🌅',
        notification_reminder: '오늘 리추얼을 완료하지 않았어요. 잊지 말고 기록을 남겨주세요!',
        notification_advice_noon: '점심시간이에요. 잠시 쉬면서 자신을 돌아보세요.',
        notification_advice_evening: '하루가 지나가고 있어요. 오늘 하루는 어땠나요?',

        // 에러
        error_network: '네트워크 연결을 확인해주세요.',
        error_server: '서버 오류가 발생했습니다.',
        error_unknown: '알 수 없는 오류가 발생했습니다.',
    },

    en: {
        // Common
        app_name: 'ORBIT',
        confirm: 'OK',
        cancel: 'Cancel',
        save: 'Save',
        delete: 'Delete',
        close: 'Close',
        next: 'Next',
        prev: 'Previous',
        done: 'Done',
        loading: 'Loading...',
        error: 'Error',
        retry: 'Retry',

        // Tabs
        tab_home: 'Home',
        tab_log: 'Log',
        tab_profile: 'Profile',

        // Home
        home_greeting: 'Hello, {name}',
        home_day_count: 'Day {count}',
        home_today_mission: "Today's Ritual",
        home_mission_locked: 'Mission Locked',
        home_unlock_time: 'Unlocks in {hours}h {minutes}m',
        home_start_reflection: 'Record Reflection',
        home_orbit_signal: "ORBIT's Signal",

        // Journal
        journal_title: "Today's Record",
        journal_placeholder: 'Write about your ritual experience...',
        journal_add_photo: 'Add Photo',
        journal_submit: 'Complete',
        journal_success: 'Your record has been saved!',

        // AI Analysis
        ai_analyzing: 'AI is analyzing...',
        ai_analysis_complete: 'AI Analysis Complete',
        ai_analysis_failed: 'AI analysis failed. Please try again later.',

        // Onboarding
        onboarding_welcome: 'Welcome to ORBIT',
        onboarding_name: 'Enter your name',
        onboarding_deficit: 'What area would you like to grow?',
        onboarding_complete: 'Get Started',

        // Settings
        settings_title: 'Settings',
        settings_language: 'Language',
        settings_notification: 'Notifications',
        settings_remove_ads: 'Remove Ads',
        settings_restore_purchase: 'Restore Purchase',
        settings_logout: 'Log Out',
        settings_delete_account: 'Delete Account',

        // Notifications
        notification_morning: "Good morning! Today's ritual awaits you 🌅",
        notification_reminder: "You haven't completed today's ritual. Don't forget to record!",
        notification_advice_noon: "It's lunchtime. Take a moment to reflect.",
        notification_advice_evening: 'The day is ending. How was your day?',

        // Errors
        error_network: 'Please check your network connection.',
        error_server: 'Server error occurred.',
        error_unknown: 'An unknown error occurred.',
    },

    ja: {
        // 共通
        app_name: 'ORBIT',
        confirm: '確認',
        cancel: 'キャンセル',
        save: '保存',
        delete: '削除',
        close: '閉じる',
        next: '次へ',
        prev: '前へ',
        done: '完了',
        loading: '読み込み中...',
        error: 'エラー',
        retry: '再試行',

        // タブ
        tab_home: 'ホーム',
        tab_log: '記録',
        tab_profile: 'プロフィール',

        // ホーム
        home_greeting: 'こんにちは、{name}さん',
        home_day_count: 'Day {count}',
        home_today_mission: '今日のリチュアル',
        home_mission_locked: 'ミッションロック中',
        home_unlock_time: 'あと{hours}時間{minutes}分でロック解除',
        home_start_reflection: '記録を残す',
        home_orbit_signal: 'ORBITのアドバイス',

        // ジャーナル
        journal_title: '今日の記録',
        journal_placeholder: '今日の体験を記録してください...',
        journal_add_photo: '写真を追加',
        journal_submit: '記録完了',
        journal_success: '記録が保存されました！',

        // AI分析
        ai_analyzing: 'AI分析中...',
        ai_analysis_complete: 'AI分析完了',
        ai_analysis_failed: 'AI分析に失敗しました。後でもう一度お試しください。',

        // オンボーディング
        onboarding_welcome: 'ORBITへようこそ',
        onboarding_name: 'お名前を入力してください',
        onboarding_deficit: 'どの分野で成長したいですか？',
        onboarding_complete: '始める',

        // 設定
        settings_title: '設定',
        settings_language: '言語',
        settings_notification: '通知',
        settings_remove_ads: '広告削除',
        settings_restore_purchase: '購入を復元',
        settings_logout: 'ログアウト',
        settings_delete_account: 'アカウント削除',

        // 通知
        notification_morning: 'おはようございます！今日のリチュアルがお待ちしています 🌅',
        notification_reminder: '今日のリチュアルがまだ完了していません。記録をお忘れなく！',
        notification_advice_noon: 'お昼の時間です。少し休んで自分を振り返りましょう。',
        notification_advice_evening: '一日が終わろうとしています。今日はどうでしたか？',

        // エラー
        error_network: 'ネットワーク接続を確認してください。',
        error_server: 'サーバーエラーが発生しました。',
        error_unknown: '不明なエラーが発生しました。',
    },
};

class I18nService {
    private static instance: I18nService;
    private currentLanguage: SupportedLanguage = 'ko';
    private listeners: Set<() => void> = new Set();

    static getInstance(): I18nService {
        if (!I18nService.instance) {
            I18nService.instance = new I18nService();
        }
        return I18nService.instance;
    }

    // 초기화
    async initialize(): Promise<void> {
        try {
            // 저장된 언어 설정 확인
            const savedLang = await AsyncStorage.getItem('appLanguage');
            if (savedLang && this.isValidLanguage(savedLang)) {
                this.currentLanguage = savedLang as SupportedLanguage;
            } else {
                // 기기 언어 감지
                this.currentLanguage = this.getDeviceLanguage();
            }
            console.log('[i18n] 현재 언어:', this.currentLanguage);
        } catch (e) {
            console.log('[i18n] 초기화 실패:', e);
        }
    }

    // 기기 언어 감지
    private getDeviceLanguage(): SupportedLanguage {
        let deviceLang = 'ko';

        if (Platform.OS === 'ios') {
            deviceLang = NativeModules.SettingsManager?.settings?.AppleLocale ||
                NativeModules.SettingsManager?.settings?.AppleLanguages?.[0] || 'ko';
        } else if (Platform.OS === 'android') {
            deviceLang = NativeModules.I18nManager?.localeIdentifier || 'ko';
        } else {
            // 웹
            deviceLang = navigator.language || 'ko';
        }

        // 언어 코드 추출 (ko-KR -> ko)
        const langCode = deviceLang.split('-')[0].toLowerCase();

        if (langCode === 'ko') return 'ko';
        if (langCode === 'ja') return 'ja';
        return 'en'; // 기본값
    }

    // 언어 유효성 검사
    private isValidLanguage(lang: string): boolean {
        return ['ko', 'en', 'ja'].includes(lang);
    }

    // 현재 언어 가져오기
    getLanguage(): SupportedLanguage {
        return this.currentLanguage;
    }

    // 언어 변경
    async setLanguage(lang: SupportedLanguage): Promise<void> {
        this.currentLanguage = lang;
        await AsyncStorage.setItem('appLanguage', lang);

        // 리스너에게 알림
        this.listeners.forEach(listener => listener());

        console.log('[i18n] 언어 변경됨:', lang);
    }

    // 번역 가져오기
    t(key: TranslationKey, params?: Record<string, string | number>): string {
        let text = translations[this.currentLanguage][key] || translations.ko[key] || key;

        // 파라미터 치환
        if (params) {
            Object.entries(params).forEach(([paramKey, value]) => {
                text = text.replace(`{${paramKey}}`, String(value));
            });
        }

        return text;
    }

    // 언어 변경 리스너 등록
    addListener(listener: () => void): () => void {
        this.listeners.add(listener);
        return () => this.listeners.delete(listener);
    }

    // 지원 언어 목록
    getSupportedLanguages(): { code: SupportedLanguage; name: string; nativeName: string }[] {
        return [
            { code: 'ko', name: 'Korean', nativeName: '한국어' },
            { code: 'en', name: 'English', nativeName: 'English' },
            { code: 'ja', name: 'Japanese', nativeName: '日本語' },
        ];
    }
}

export const i18n = I18nService.getInstance();
export const t = (key: TranslationKey, params?: Record<string, string | number>) => i18n.t(key, params);
export default i18n;
