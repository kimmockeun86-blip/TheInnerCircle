/**
 * 테마 커스터마이징 서비스
 * 앱 색상 및 프로필 배경 설정
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import logger from '../utils/logger';

export interface ThemeColors {
    primary: string;
    secondary: string;
    accent: string;
    background: string;
    card: string;
}

export interface Theme {
    id: string;
    name: string;
    emoji: string;
    colors: ThemeColors;
    isDefault?: boolean;
}

export interface UserThemeSettings {
    selectedThemeId: string;
    profileBackgroundImage?: string;
    coupleAvatarFrame?: string;
}

// 기본 테마들
export const THEMES: Theme[] = [
    {
        id: 'cosmic',
        name: '우주',
        emoji: '🌌',
        isDefault: true,
        colors: {
            primary: '#A78BFA',
            secondary: '#8B5CF6',
            accent: '#FFD700',
            background: '#1A0B2E',
            card: 'rgba(255, 255, 255, 0.1)',
        },
    },
    {
        id: 'sunset',
        name: '노을',
        emoji: '🌅',
        colors: {
            primary: '#F87171',
            secondary: '#FB923C',
            accent: '#FCD34D',
            background: '#1F1512',
            card: 'rgba(251, 146, 60, 0.15)',
        },
    },
    {
        id: 'ocean',
        name: '바다',
        emoji: '🌊',
        colors: {
            primary: '#22D3EE',
            secondary: '#06B6D4',
            accent: '#A5F3FC',
            background: '#0C1929',
            card: 'rgba(34, 211, 238, 0.1)',
        },
    },
    {
        id: 'forest',
        name: '숲',
        emoji: '🌲',
        colors: {
            primary: '#4ADE80',
            secondary: '#22C55E',
            accent: '#86EFAC',
            background: '#0F1F13',
            card: 'rgba(74, 222, 128, 0.1)',
        },
    },
    {
        id: 'rose',
        name: '로맨틱',
        emoji: '🌹',
        colors: {
            primary: '#FB7185',
            secondary: '#F43F5E',
            accent: '#FDA4AF',
            background: '#1F0F14',
            card: 'rgba(251, 113, 133, 0.1)',
        },
    },
];

// 프로필 배경 옵션
export const PROFILE_BACKGROUNDS = [
    { id: 'default', name: '기본', preview: null },
    { id: 'hearts', name: '하트', preview: '💕' },
    { id: 'stars', name: '별', preview: '✨' },
    { id: 'flowers', name: '꽃', preview: '🌸' },
    { id: 'custom', name: '커스텀', preview: '📷' },
];

const STORAGE_KEY = 'themeSettings';

class ThemeService {
    private settings: UserThemeSettings = {
        selectedThemeId: 'cosmic',
    };

    private currentTheme: Theme = THEMES[0];

    /**
     * 서비스 초기화
     */
    async initialize(): Promise<void> {
        try {
            const stored = await AsyncStorage.getItem(STORAGE_KEY);
            if (stored) {
                this.settings = JSON.parse(stored);
                const theme = THEMES.find(t => t.id === this.settings.selectedThemeId);
                if (theme) {
                    this.currentTheme = theme;
                }
                logger.log(`[Theme] 테마 로드: ${this.currentTheme.name}`);
            }
        } catch (error) {
            logger.error('[Theme] 초기화 실패:', error);
        }
    }

    /**
     * 현재 테마 가져오기
     */
    getCurrentTheme(): Theme {
        return this.currentTheme;
    }

    /**
     * 테마 변경
     */
    async setTheme(themeId: string): Promise<boolean> {
        const theme = THEMES.find(t => t.id === themeId);
        if (!theme) return false;

        this.currentTheme = theme;
        this.settings.selectedThemeId = themeId;
        await this.save();

        logger.log(`[Theme] 테마 변경: ${theme.name}`);
        return true;
    }

    /**
     * 프로필 배경 설정
     */
    async setProfileBackground(backgroundId: string, customImage?: string): Promise<void> {
        if (backgroundId === 'custom' && customImage) {
            this.settings.profileBackgroundImage = customImage;
        } else {
            this.settings.profileBackgroundImage = backgroundId;
        }
        await this.save();
    }

    /**
     * 설정 가져오기
     */
    getSettings(): UserThemeSettings {
        return { ...this.settings };
    }

    /**
     * 모든 테마 목록
     */
    getAllThemes(): Theme[] {
        return THEMES;
    }

    /**
     * 색상 가져오기
     */
    getColors(): ThemeColors {
        return this.currentTheme.colors;
    }

    /**
     * 저장
     */
    private async save(): Promise<void> {
        try {
            await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(this.settings));
        } catch (error) {
            logger.error('[Theme] 저장 실패:', error);
        }
    }
}

export const themeService = new ThemeService();
export default themeService;
