// DeepLinkService.ts - 딥링크 및 알림 클릭 처리
// 알림 클릭 시 특정 화면으로 이동

import { Linking, Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Notifications from 'expo-notifications';

// 딥링크 스키마
const DEEP_LINK_SCHEME = 'orbit://';

// 딥링크 타입 정의
type DeepLinkRoute =
    | 'home'
    | 'log'
    | 'profile'
    | 'settings'
    | 'mission'
    | 'journal'
    | 'connections'
    | 'couples';

interface DeepLinkData {
    route: DeepLinkRoute;
    params?: Record<string, any>;
}

class DeepLinkService {
    private static instance: DeepLinkService;
    private navigationRef: any = null;
    private pendingDeepLink: DeepLinkData | null = null;

    static getInstance(): DeepLinkService {
        if (!DeepLinkService.instance) {
            DeepLinkService.instance = new DeepLinkService();
        }
        return DeepLinkService.instance;
    }

    // 네비게이션 레퍼런스 설정
    setNavigationRef(ref: any): void {
        this.navigationRef = ref;

        // 대기 중인 딥링크 처리
        if (this.pendingDeepLink && ref) {
            this.navigateToRoute(this.pendingDeepLink.route, this.pendingDeepLink.params);
            this.pendingDeepLink = null;
        }
    }

    // 초기화 및 리스너 설정
    async initialize(): Promise<void> {
        console.log('[DeepLink] 초기화 시작');

        // 앱이 종료 상태에서 열린 경우 초기 URL 처리
        const initialUrl = await Linking.getInitialURL();
        if (initialUrl) {
            this.handleDeepLink(initialUrl);
        }

        // 앱 실행 중 딥링크 수신 리스너
        Linking.addEventListener('url', (event) => {
            this.handleDeepLink(event.url);
        });

        // 알림 응답 리스너 (알림 클릭)
        Notifications.addNotificationResponseReceivedListener((response) => {
            this.handleNotificationResponse(response);
        });

        console.log('[DeepLink] 초기화 완료');
    }

    // 딥링크 URL 파싱 및 처리
    handleDeepLink(url: string): void {
        console.log('[DeepLink] URL 수신:', url);

        if (!url.startsWith(DEEP_LINK_SCHEME) && !url.includes('theinnercircle.app')) {
            return;
        }

        try {
            // URL 파싱
            // 형식: orbit://route?param1=value1&param2=value2
            // 또는: https://theinnercircle.app/route?param1=value1

            let path = url;
            if (url.startsWith(DEEP_LINK_SCHEME)) {
                path = url.replace(DEEP_LINK_SCHEME, '');
            } else if (url.includes('theinnercircle.app/')) {
                path = url.split('theinnercircle.app/')[1];
            }

            const [routePart, queryString] = path.split('?');
            const route = routePart.split('/')[0] as DeepLinkRoute;

            // 쿼리 파라미터 파싱
            const params: Record<string, any> = {};
            if (queryString) {
                queryString.split('&').forEach(pair => {
                    const [key, value] = pair.split('=');
                    params[decodeURIComponent(key)] = decodeURIComponent(value);
                });
            }

            this.navigateToRoute(route, params);
        } catch (e) {
            console.log('[DeepLink] URL 파싱 실패:', e);
        }
    }

    // 알림 응답 처리 (알림 클릭)
    handleNotificationResponse(response: Notifications.NotificationResponse): void {
        console.log('[DeepLink] 알림 응답:', response);

        const data = response.notification.request.content.data;

        if (data?.route) {
            this.navigateToRoute(data.route as DeepLinkRoute, data.params);
        } else if (data?.type) {
            // 알림 타입에 따른 기본 라우팅
            switch (data.type) {
                case 'mission':
                case 'mission_reminder':
                    this.navigateToRoute('home');
                    break;
                case 'advice':
                    this.navigateToRoute('home');
                    break;
                case 'match':
                case 'letter':
                    this.navigateToRoute('connections');
                    break;
                default:
                    this.navigateToRoute('home');
            }
        }
    }

    // 라우트로 이동
    navigateToRoute(route: DeepLinkRoute, params?: Record<string, any>): void {
        console.log(`[DeepLink] 이동: ${route}`, params);

        if (!this.navigationRef) {
            // 네비게이션이 준비되지 않았으면 대기
            this.pendingDeepLink = { route, params };
            console.log('[DeepLink] 네비게이션 대기 중...');
            return;
        }

        try {
            switch (route) {
                case 'home':
                    this.navigationRef.navigate('MainTabs', { screen: 'Home' });
                    break;
                case 'log':
                    this.navigationRef.navigate('MainTabs', { screen: 'Log' });
                    break;
                case 'profile':
                    this.navigationRef.navigate('MainTabs', { screen: 'Profile' });
                    break;
                case 'settings':
                    this.navigationRef.navigate('Settings');
                    break;
                case 'connections':
                    this.navigationRef.navigate('Connections');
                    break;
                case 'couples':
                    this.navigationRef.navigate('CouplesMission');
                    break;
                case 'mission':
                case 'journal':
                    this.navigationRef.navigate('MainTabs', { screen: 'Home' });
                    break;
                default:
                    this.navigationRef.navigate('MainTabs', { screen: 'Home' });
            }
        } catch (e) {
            console.log('[DeepLink] 네비게이션 실패:', e);
        }
    }

    // 딥링크 URL 생성 (공유용)
    createDeepLink(route: DeepLinkRoute, params?: Record<string, any>): string {
        let url = `${DEEP_LINK_SCHEME}${route}`;

        if (params && Object.keys(params).length > 0) {
            const queryString = Object.entries(params)
                .map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(String(value))}`)
                .join('&');
            url += `?${queryString}`;
        }

        return url;
    }

    // 유니버설 링크 URL 생성
    createUniversalLink(route: DeepLinkRoute, params?: Record<string, any>): string {
        let url = `https://theinnercircle.app/${route}`;

        if (params && Object.keys(params).length > 0) {
            const queryString = Object.entries(params)
                .map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(String(value))}`)
                .join('&');
            url += `?${queryString}`;
        }

        return url;
    }
}

export const deepLinkService = DeepLinkService.getInstance();
export default deepLinkService;
