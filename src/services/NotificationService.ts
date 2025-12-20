import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';

// Notification Service - 웹 + 모바일 푸시 알림 지원

// 알림 수신 시 동작 설정
Notifications.setNotificationHandler({
    handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: true,
        shouldSetBadge: true,
        shouldShowBanner: true,
        shouldShowList: true,
    }),
});

interface NotificationData {
    title: string;
    body: string;
    data?: any;
}

class NotificationService {
    private hasPermission: boolean = false;
    private expoPushToken: string | null = null;

    // 푸시 토큰 가져오기 (모바일용)
    async registerForPushNotifications(userId?: string): Promise<string | null> {
        if (Platform.OS === 'web') {
            return null;
        }

        if (!Device.isDevice) {
            console.log('[Notification] 에뮬레이터에서는 푸시 알림이 지원되지 않습니다.');
            return null;
        }

        const { status: existingStatus } = await Notifications.getPermissionsAsync();
        let finalStatus = existingStatus;

        if (existingStatus !== 'granted') {
            const { status } = await Notifications.requestPermissionsAsync();
            finalStatus = status;
        }

        if (finalStatus !== 'granted') {
            console.log('[Notification] 푸시 알림 권한이 거부되었습니다.');
            return null;
        }

        try {
            const tokenData = await Notifications.getExpoPushTokenAsync({
                projectId: '6994a27e-c819-4dfb-899a-32297b065c1c'
            });
            this.expoPushToken = tokenData.data;
            await AsyncStorage.setItem('expoPushToken', this.expoPushToken);
            console.log('[Notification] 푸시 토큰:', this.expoPushToken);

            // 서버로 토큰 전송
            if (userId && this.expoPushToken) {
                await this.registerTokenWithServer(userId, this.expoPushToken);
            }

            return this.expoPushToken;
        } catch (error) {
            console.log('[Notification] 푸시 토큰 가져오기 실패:', error);
            return null;
        }
    }

    // 서버로 FCM 토큰 등록
    async registerTokenWithServer(userId: string, token: string): Promise<boolean> {
        try {
            const API_URL = 'https://theinnercircle-9xye.onrender.com/api';
            const response = await fetch(`${API_URL}/fcm/register`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    userId,
                    token,
                    platform: Platform.OS,
                }),
            });

            const data = await response.json();
            if (data.success) {
                console.log('[Notification] 서버에 토큰 등록 성공');
                return true;
            } else {
                console.log('[Notification] 서버 토큰 등록 실패:', data.error);
                return false;
            }
        } catch (error) {
            console.log('[Notification] 서버 토큰 등록 오류:', error);
            return false;
        }
    }

    async requestPermission(): Promise<boolean> {
        if (Platform.OS === 'web') {
            if ('Notification' in window) {
                const permission = await Notification.requestPermission();
                this.hasPermission = permission === 'granted';
                return this.hasPermission;
            }
            return false;
        }

        // 모바일
        const { status } = await Notifications.requestPermissionsAsync();
        this.hasPermission = status === 'granted';
        return this.hasPermission;
    }

    async showNotification(data: NotificationData): Promise<void> {
        if (Platform.OS === 'web') {
            if ('Notification' in window && Notification.permission === 'granted') {
                new Notification(data.title, {
                    body: data.body,
                    icon: '/favicon.ico',
                    badge: '/favicon.ico',
                });
            }
        } else {
            // 모바일 즉시 알림
            await Notifications.scheduleNotificationAsync({
                content: {
                    title: data.title,
                    body: data.body,
                    data: data.data || {},
                    sound: true,
                },
                trigger: null, // 즉시 표시
            });
        }
    }

    // 🌅 오전 9시 미션 해금 알림
    async scheduleMissionNotification(): Promise<void> {
        const now = new Date();
        const next9AM = new Date();
        next9AM.setHours(9, 0, 0, 0);

        if (now.getHours() >= 9) {
            next9AM.setDate(next9AM.getDate() + 1);
        }

        await AsyncStorage.setItem('scheduledNotification', next9AM.toISOString());

        if (Platform.OS === 'web') {
            const msUntil9AM = next9AM.getTime() - now.getTime();
            setTimeout(() => {
                this.showNotification({
                    title: '🌅 새로운 미션이 공개되었습니다!',
                    body: '오르빗이 오늘의 리추얼을 준비했습니다. 지금 확인하세요.',
                });
            }, msUntil9AM);
            console.log(`[Notification] 웹 알림 예약: ${next9AM.toLocaleString()}`);
        } else {
            // 모바일 스케줄 알림
            await Notifications.scheduleNotificationAsync({
                content: {
                    title: '🌅 새로운 미션이 공개되었습니다!',
                    body: '오르빗이 오늘의 리추얼을 준비했습니다. 지금 확인하세요.',
                    sound: true,
                },
                trigger: {
                    type: Notifications.SchedulableTriggerInputTypes.DAILY,
                    hour: 9,
                    minute: 0,
                },
            });
            console.log(`[Notification] 모바일 알림 예약: 매일 오전 9시`);
        }
    }

    // 🔔 미션 미완료 리마인더 (저녁 8시)
    async scheduleMissionReminderNotification(): Promise<void> {
        if (Platform.OS === 'web') {
            const now = new Date();
            const next8PM = new Date();
            next8PM.setHours(20, 0, 0, 0);

            if (now.getHours() >= 20) {
                next8PM.setDate(next8PM.getDate() + 1);
            }

            const msUntil8PM = next8PM.getTime() - now.getTime();
            setTimeout(() => {
                this.showNotification({
                    title: '🌟 ORBIT',
                    body: '오늘의 미션을 아직 완료하지 않으셨네요. 잠들기 전에 기록해보세요.',
                });
            }, msUntil8PM);
        } else {
            // 모바일 저녁 리마인더
            await Notifications.scheduleNotificationAsync({
                content: {
                    title: '🌟 ORBIT',
                    body: '오늘의 미션을 아직 완료하지 않으셨네요. 잠들기 전에 기록해보세요.',
                    sound: true,
                },
                trigger: {
                    type: Notifications.SchedulableTriggerInputTypes.DAILY,
                    hour: 20,
                    minute: 0,
                },
            });
            console.log(`[Notification] 저녁 리마인더 예약: 매일 저녁 8시`);
        }
    }

    // 💌 매칭/편지 수신 알림
    async showMatchNotification(partnerName: string): Promise<void> {
        await this.showNotification({
            title: '💕 새로운 인연이 발견되었습니다!',
            body: `${partnerName}님이 당신에게 관심을 보였습니다. 확인해보세요.`,
            data: { type: 'match' },
        });
    }

    // 📬 편지 수신 알림
    async showLetterNotification(fromName: string): Promise<void> {
        await this.showNotification({
            title: '📬 새로운 편지가 도착했습니다!',
            body: `${fromName}님으로부터 편지가 왔어요. 지금 확인해보세요.`,
            data: { type: 'letter' },
        });
    }

    async cancelAllNotifications(): Promise<void> {
        await AsyncStorage.removeItem('scheduledNotification');
        if (Platform.OS !== 'web') {
            await Notifications.cancelAllScheduledNotificationsAsync();
        }
    }

    // Check if it's time to show unlock animation
    isUnlockTime(): boolean {
        const now = new Date();
        return now.getHours() >= 9;
    }

    // Get time until next unlock
    getTimeUntilUnlock(): { hours: number; minutes: number; seconds: number } {
        const now = new Date();
        const next9AM = new Date();
        next9AM.setHours(9, 0, 0, 0);

        if (now.getHours() >= 9) {
            next9AM.setDate(next9AM.getDate() + 1);
        }

        const diff = next9AM.getTime() - now.getTime();
        const hours = Math.floor(diff / (1000 * 60 * 60));
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((diff % (1000 * 60)) / 1000);

        return { hours, minutes, seconds };
    }

    // 알림 리스너 설정 (앱 시작 시 호출)
    setupNotificationListeners(
        onNotificationReceived?: (notification: Notifications.Notification) => void,
        onNotificationResponse?: (response: Notifications.NotificationResponse) => void
    ): () => void {
        if (Platform.OS === 'web') {
            return () => { };
        }

        const receivedSubscription = Notifications.addNotificationReceivedListener(notification => {
            console.log('[Notification] 알림 수신:', notification);
            onNotificationReceived?.(notification);
        });

        const responseSubscription = Notifications.addNotificationResponseReceivedListener(response => {
            console.log('[Notification] 알림 탭:', response);
            onNotificationResponse?.(response);
        });

        // 클린업 함수 반환
        return () => {
            receivedSubscription.remove();
            responseSubscription.remove();
        };
    }
}

export const notificationService = new NotificationService();
export default notificationService;
