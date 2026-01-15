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

    // 🆕 현재 저장된 미션 내용 조회
    private async getCurrentMissionContent(): Promise<string> {
        try {
            const mission = await AsyncStorage.getItem('currentMission');
            if (mission) return mission;

            // 백업: AI 분석 결과에서 미션 조회
            const aiAnalysis = await AsyncStorage.getItem('aiAnalysis');
            if (aiAnalysis) {
                const parsed = JSON.parse(aiAnalysis);
                if (parsed.recommendedMission) return parsed.recommendedMission;
            }

            return '오늘의 리추얼을 확인하세요';
        } catch (error) {
            console.log('[Notification] 미션 조회 실패:', error);
            return '오늘의 리추얼을 확인하세요';
        }
    }

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

    // 🆕 동적 미션 내용을 포함한 즉시 알림
    async showMissionNotificationNow(): Promise<void> {
        const mission = await this.getCurrentMissionContent();
        await this.showNotification({
            title: '🌅 오늘의 리추얼',
            body: mission,
            data: { type: 'mission' },
        });
        console.log(`[Notification] 동적 미션 알림 표시: ${mission}`);
    }

    // 🌅 아침 미션 알림 (자정에서 아침 9시로 변경 - 사용자 수면 방해 방지)
    async scheduleMissionNotification(): Promise<void> {
        // ⭐ 중복 방지: 기존 예약된 모든 알림 취소
        if (Platform.OS !== 'web') {
            await Notifications.cancelAllScheduledNotificationsAsync();
            console.log('[Notification] 기존 알림 모두 취소됨');
        }

        const now = new Date();
        const next9AM = new Date();
        next9AM.setHours(9, 0, 0, 0);

        // 현재 시간이 9시 이후면 다음 날로
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
            // 모바일 스케줄 알림 (아침 9시에 알림)
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
            console.log(`[Notification] 모바일 알림 예약: 매일 아침 9시`);
        }
    }

    // 🔔 미션 미완료 리마인더 (저녁 8시) - 동적 미션 내용 포함
    async scheduleMissionReminderNotification(): Promise<void> {
        // 🆕 현재 미션 내용 조회
        const currentMission = await this.getCurrentMissionContent();
        const reminderBody = `오늘의 미션: "${currentMission}" - 잠들기 전에 기록해보세요.`;

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
                    title: '🌟 ORBIT 리마인더',
                    body: reminderBody,
                });
            }, msUntil8PM);
        } else {
            // 모바일 저녁 리마인더 - 고정 메시지 (스케줄 알림은 동적 조회 불가)
            await Notifications.scheduleNotificationAsync({
                content: {
                    title: '🌟 ORBIT 리마인더',
                    body: '오늘의 미션을 아직 완료하지 않으셨네요. 앱을 열어 확인하세요!',
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

    // 🌟 맞춤 조언 알림 (정오 12시, 저녁 6시)
    // 사용자의 deficit 기반 맞춤 조언
    getAdviceByDeficit(deficit: string, timeOfDay: 'noon' | 'evening'): string {
        const adviceMap: Record<string, { noon: string; evening: string }> = {
            '외로움': {
                noon: '점심시간, 누군가에게 먼저 인사해보세요. 작은 연결이 큰 위로가 됩니다.',
                evening: '오늘 하루 수고했어요. 당신은 혼자가 아닙니다.'
            },
            '불안': {
                noon: '깊은 호흡을 3번 해보세요. 지금 이 순간에 집중하면 불안은 사라집니다.',
                evening: '오늘 불안했던 순간도 잘 버텼네요. 내일은 더 나아질 거예요.'
            },
            '자존감': {
                noon: '거울을 보며 자신에게 "잘하고 있어"라고 말해보세요.',
                evening: '오늘 당신이 해낸 작은 것들을 기억하세요. 당신은 충분합니다.'
            },
            '무기력': {
                noon: '5분만 몸을 움직여보세요. 작은 에너지가 큰 변화를 만듭니다.',
                evening: '오늘 행동하지 못한 것보다 시도한 것을 기억하세요.'
            },
            '스트레스': {
                noon: '잠깐 창밖을 바라보세요. 자연은 마음을 회복시킵니다.',
                evening: '긴장을 풀어보세요. 내일의 도전은 내일 걱정해도 됩니다.'
            },
            '우울': {
                noon: '햇빛을 5분만 쬐어보세요. 빛은 마음을 밝게 합니다.',
                evening: '오늘도 하루를 살아낸 당신, 대단해요.'
            },
            '성장': {
                noon: '오늘 배울 수 있는 하나를 찾아보세요.',
                evening: '오늘 성장한 점을 기록해두세요. 작은 변화가 모여 큰 성장이 됩니다.'
            },
        };

        const defaultAdvice = {
            noon: '잠시 멈추고 깊은 숨을 쉬어보세요. 지금 이 순간이 가장 중요합니다.',
            evening: '오늘도 고생했습니다. 편안한 밤 되세요.'
        };

        return adviceMap[deficit]?.[timeOfDay] || defaultAdvice[timeOfDay];
    }

    // 🌟 현재 시간에 맞는 조언 가져오기 (홈 화면 표시용)
    getCurrentAdvice(deficit: string): { advice: string; timeOfDay: 'noon' | 'evening' | null; icon: string } | null {
        const now = new Date();
        const hour = now.getHours();

        // 12시~18시: 점심 조언 표시
        if (hour >= 12 && hour < 18) {
            return {
                advice: this.getAdviceByDeficit(deficit, 'noon'),
                timeOfDay: 'noon',
                icon: '🌞'
            };
        }
        // 18시~24시: 저녁 조언 표시
        else if (hour >= 18 && hour < 24) {
            return {
                advice: this.getAdviceByDeficit(deficit, 'evening'),
                timeOfDay: 'evening',
                icon: '🌙'
            };
        }
        // 0시~12시: 조언 표시 안함 (또는 전날 저녁 조언)
        return null;
    }

    async scheduleAdviceNotifications(deficit: string = '성장'): Promise<void> {
        // 중복 스케줄 방지: 이미 스케줄된 경우 스킵
        const alreadyScheduled = await AsyncStorage.getItem('adviceNotificationsScheduled');
        if (alreadyScheduled === 'true') {
            console.log('[Notification] 조언 알림 이미 스케줄됨 - 스킵');
            return;
        }

        // 기존 조언 알림 취소 (모바일)
        if (Platform.OS !== 'web') {
            const scheduled = await Notifications.getAllScheduledNotificationsAsync();
            for (const notif of scheduled) {
                // 조언 알림만 취소 (제목으로 구분)
                if (notif.content.title?.includes('점심 조언') ||
                    notif.content.title?.includes('저녁 조언')) {
                    await Notifications.cancelScheduledNotificationAsync(notif.identifier);
                }
            }
        }

        const now = new Date();

        // 정오 12시 알림
        const noon = new Date();
        noon.setHours(12, 0, 0, 0);
        if (now.getHours() >= 12) {
            noon.setDate(noon.getDate() + 1);
        }

        // 저녁 6시 알림
        const evening = new Date();
        evening.setHours(18, 0, 0, 0);
        if (now.getHours() >= 18) {
            evening.setDate(evening.getDate() + 1);
        }

        if (Platform.OS === 'web') {
            // 웹 - setTimeout 사용
            const msUntilNoon = noon.getTime() - now.getTime();
            const msUntilEvening = evening.getTime() - now.getTime();

            setTimeout(() => {
                this.showNotification({
                    title: '🌞 ORBIT 점심 조언',
                    body: this.getAdviceByDeficit(deficit, 'noon'),
                });
            }, msUntilNoon);

            setTimeout(() => {
                this.showNotification({
                    title: '🌙 ORBIT 저녁 조언',
                    body: this.getAdviceByDeficit(deficit, 'evening'),
                });
            }, msUntilEvening);

            console.log(`[Notification] 웹 조언 알림 예약: 정오 ${noon.toLocaleString()}, 저녁 ${evening.toLocaleString()}`);
        } else {
            // 모바일 - 매일 반복 알림 (각각 1개씩만)
            await Notifications.scheduleNotificationAsync({
                content: {
                    title: '🌞 ORBIT 점심 조언',
                    body: this.getAdviceByDeficit(deficit, 'noon'),
                    sound: true,
                },
                trigger: {
                    type: Notifications.SchedulableTriggerInputTypes.DAILY,
                    hour: 12,
                    minute: 0,
                },
            });

            await Notifications.scheduleNotificationAsync({
                content: {
                    title: '🌙 ORBIT 저녁 조언',
                    body: this.getAdviceByDeficit(deficit, 'evening'),
                    sound: true,
                },
                trigger: {
                    type: Notifications.SchedulableTriggerInputTypes.DAILY,
                    hour: 18,
                    minute: 0,
                },
            });

            console.log(`[Notification] 모바일 조언 알림 예약: 매일 정오 12시 & 저녁 6시`);
        }

        // 스케줄 완료 플래그 저장
        await AsyncStorage.setItem('adviceNotificationsScheduled', 'true');
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

    // Check if it's time to show unlock animation (자정 기준)
    isUnlockTime(): boolean {
        // 자정 기준이므로 항상 true (미션 완료 여부는 별도 체크)
        return true;
    }

    // Get time until next unlock (자정 기준)
    getTimeUntilUnlock(): { hours: number; minutes: number; seconds: number } {
        const now = new Date();
        const nextMidnight = new Date();
        nextMidnight.setDate(nextMidnight.getDate() + 1);
        nextMidnight.setHours(0, 0, 0, 0);

        const diff = nextMidnight.getTime() - now.getTime();
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
