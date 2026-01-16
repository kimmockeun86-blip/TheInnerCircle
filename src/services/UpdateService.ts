/**
 * UpdateService - 앱 업데이트 체크 서비스
 * 앱 시작 시 최신 버전을 확인하고 업데이트가 필요한 경우 사용자에게 알림
 */

import { Alert, Linking, Platform } from 'react-native';
import Constants from 'expo-constants';
import logger from '../utils/logger';
import { API_URL } from '../config';

// 스토어 URL
const STORE_URLS = {
    ios: 'https://apps.apple.com/app/id6740548498',
    android: 'https://play.google.com/store/apps/details?id=com.theinnercircle.app',
};

interface VersionInfo {
    latestVersion: string;
    minVersion: string;
    forceUpdate: boolean;
    message?: string;
    storeUrls?: {
        ios: string;
        android: string;
    };
}

class UpdateService {
    private currentVersion: string;

    constructor() {
        // app.json의 version 가져오기
        this.currentVersion = Constants.expoConfig?.version || '1.0.0';
        logger.log(`[UpdateService] 현재 버전: ${this.currentVersion}`);
    }

    /**
     * 버전 비교 (semantic versioning)
     * @returns -1: a < b, 0: a == b, 1: a > b
     */
    private compareVersions(a: string, b: string): number {
        const partsA = a.split('.').map(Number);
        const partsB = b.split('.').map(Number);

        for (let i = 0; i < Math.max(partsA.length, partsB.length); i++) {
            const partA = partsA[i] || 0;
            const partB = partsB[i] || 0;

            if (partA < partB) return -1;
            if (partA > partB) return 1;
        }

        return 0;
    }

    /**
     * 서버에서 최신 버전 정보 가져오기
     */
    private async fetchVersionInfo(): Promise<VersionInfo | null> {
        try {
            const response = await fetch(`${API_URL}/version`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                },
            });

            if (!response.ok) {
                throw new Error(`HTTP Error: ${response.status}`);
            }

            const data = await response.json();
            return data;
        } catch (error) {
            logger.error('[UpdateService] 버전 정보 가져오기 실패:', error);
            return null;
        }
    }

    /**
     * 스토어로 이동
     */
    private openStore(): void {
        const storeUrl = Platform.OS === 'ios' ? STORE_URLS.ios : STORE_URLS.android;

        Linking.canOpenURL(storeUrl)
            .then((supported) => {
                if (supported) {
                    Linking.openURL(storeUrl);
                } else {
                    logger.error('[UpdateService] 스토어 URL을 열 수 없습니다');
                }
            })
            .catch((err) => {
                logger.error('[UpdateService] 스토어 열기 실패:', err);
            });
    }

    /**
     * 강제 업데이트 알림 (닫기 불가)
     */
    private showForceUpdateAlert(message?: string): void {
        Alert.alert(
            '🚀 업데이트 필요',
            message || '새로운 버전이 출시되었습니다. 업데이트 후 이용해주세요.',
            [
                {
                    text: '업데이트',
                    onPress: () => this.openStore(),
                },
            ],
            { cancelable: false }
        );
    }

    /**
     * 선택적 업데이트 알림 (나중에 가능)
     */
    private showOptionalUpdateAlert(message?: string): void {
        Alert.alert(
            '🆕 새 버전 알림',
            message || '새로운 버전이 있습니다. 업데이트하시겠습니까?',
            [
                {
                    text: '나중에',
                    style: 'cancel',
                },
                {
                    text: '업데이트',
                    onPress: () => this.openStore(),
                },
            ]
        );
    }

    /**
     * 업데이트 체크 (앱 시작 시 호출)
     */
    async checkForUpdate(): Promise<void> {
        // 웹에서는 스킵
        if (Platform.OS === 'web') {
            logger.log('[UpdateService] 웹 환경 - 업데이트 체크 스킵');
            return;
        }

        logger.log('[UpdateService] 업데이트 체크 시작...');

        const versionInfo = await this.fetchVersionInfo();

        if (!versionInfo) {
            logger.log('[UpdateService] 버전 정보를 가져올 수 없음 - 스킵');
            return;
        }

        const { latestVersion, minVersion, forceUpdate, message } = versionInfo;

        logger.log(`[UpdateService] 서버 버전: ${latestVersion}, 최소 버전: ${minVersion}`);

        // 최소 버전보다 낮으면 강제 업데이트
        if (this.compareVersions(this.currentVersion, minVersion) < 0) {
            logger.log('[UpdateService] 강제 업데이트 필요');
            this.showForceUpdateAlert(message);
            return;
        }

        // 최신 버전보다 낮으면 선택적 업데이트
        if (this.compareVersions(this.currentVersion, latestVersion) < 0) {
            logger.log('[UpdateService] 선택적 업데이트 가능');

            if (forceUpdate) {
                this.showForceUpdateAlert(message);
            } else {
                this.showOptionalUpdateAlert(message);
            }
            return;
        }

        logger.log('[UpdateService] 최신 버전 사용 중');
    }
}

export const updateService = new UpdateService();
