import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Notification Service
// Uses Browser Notification API for web, expo-notifications for mobile

interface NotificationData {
    title: string;
    body: string;
    data?: any;
}

class NotificationService {
    private hasPermission: boolean = false;

    async requestPermission(): Promise<boolean> {
        if (Platform.OS === 'web') {
            if ('Notification' in window) {
                const permission = await Notification.requestPermission();
                this.hasPermission = permission === 'granted';
                return this.hasPermission;
            }
            return false;
        }
        // For mobile, would use expo-notifications
        // const { status } = await Notifications.requestPermissionsAsync();
        // this.hasPermission = status === 'granted';
        return true;
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
        }
        // For mobile, would use expo-notifications
        // await Notifications.scheduleNotificationAsync({...})
    }

    async scheduleMissionNotification(): Promise<void> {
        // Calculate next 9 AM
        const now = new Date();
        const next9AM = new Date();
        next9AM.setHours(9, 0, 0, 0);

        if (now.getHours() >= 9) {
            // Already past 9 AM today, schedule for tomorrow
            next9AM.setDate(next9AM.getDate() + 1);
        }

        const msUntil9AM = next9AM.getTime() - now.getTime();

        // Store scheduled notification time
        await AsyncStorage.setItem('scheduledNotification', next9AM.toISOString());

        if (Platform.OS === 'web') {
            // Use setTimeout for web (only works while page is open)
            setTimeout(() => {
                this.showNotification({
                    title: '🌅 새로운 미션이 공개되었습니다!',
                    body: '오르빗이 오늘의 리추얼을 준비했습니다. 지금 확인하세요.',
                });
            }, msUntil9AM);

            console.log(`[Notification] Scheduled for ${next9AM.toLocaleString()} (in ${Math.round(msUntil9AM / 1000 / 60)} minutes)`);
        }
        // For mobile, would use expo-notifications scheduleNotificationAsync
    }

    async cancelAllNotifications(): Promise<void> {
        await AsyncStorage.removeItem('scheduledNotification');
        // For mobile: await Notifications.cancelAllScheduledNotificationsAsync();
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
}

export const notificationService = new NotificationService();
export default notificationService;
