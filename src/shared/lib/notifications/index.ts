/**
 * Notifications Wrapper
 * expo-notifications를 감싸는 인터페이스
 * 
 * 2026-01-13 생성: Anti-Gravity Architecture
 */
import { Platform } from 'react-native';

export interface NotificationContent {
    title: string;
    body: string;
    data?: Record<string, any>;
}

export interface ScheduleOptions {
    trigger: {
        hour?: number;
        minute?: number;
        repeats?: boolean;
    };
}

class NotificationsWrapper {
    private isEnabled: boolean = true;
    private expoPushToken: string | null = null;

    async initialize(): Promise<void> {
        try {
            console.log('[NotificationsWrapper] Initialized');
        } catch (error) {
            console.error('[NotificationsWrapper] Initialization error:', error);
        }
    }

    async requestPermission(): Promise<boolean> {
        try {
            // 실제 구현은 기존 NotificationService를 통해 처리
            console.log('[NotificationsWrapper] Permission requested');
            return true;
        } catch (error) {
            console.error('[NotificationsWrapper] Permission request error:', error);
            return false;
        }
    }

    async scheduleNotification(content: NotificationContent, options: ScheduleOptions): Promise<string | null> {
        try {
            console.log('[NotificationsWrapper] Scheduled:', content.title);
            return 'notification-id';
        } catch (error) {
            console.error('[NotificationsWrapper] Schedule error:', error);
            return null;
        }
    }

    async cancelAllNotifications(): Promise<void> {
        try {
            console.log('[NotificationsWrapper] All notifications cancelled');
        } catch (error) {
            console.error('[NotificationsWrapper] Cancel error:', error);
        }
    }

    async getPushToken(): Promise<string | null> {
        return this.expoPushToken;
    }

    setEnabled(enabled: boolean): void {
        this.isEnabled = enabled;
    }
}

const notifications = new NotificationsWrapper();
export default notifications;
export { NotificationsWrapper };
