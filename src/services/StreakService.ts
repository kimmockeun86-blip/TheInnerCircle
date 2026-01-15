/**
 * Streak Service - 연속 기록 시스템
 * 
 * Hook Model의 "Investment" 단계 구현
 * 손실 회피(Loss Aversion) 심리 활용
 * 
 * 2026-01-15 생성
 */

import AsyncStorage from '@react-native-async-storage/async-storage';

const STREAK_KEYS = {
    CURRENT_STREAK: 'streak_current',
    LONGEST_STREAK: 'streak_longest',
    LAST_RECORD_DATE: 'streak_lastRecordDate',
    TOTAL_RECORDS: 'streak_totalRecords',
};

export interface StreakData {
    currentStreak: number;
    longestStreak: number;
    lastRecordDate: string | null;
    totalRecords: number;
    isAtRisk: boolean;  // 오늘 기록 안 하면 스트릭 끊김
}

class StreakService {

    // 스트릭 데이터 로드
    async getStreakData(): Promise<StreakData> {
        try {
            const currentStreak = parseInt(await AsyncStorage.getItem(STREAK_KEYS.CURRENT_STREAK) || '0', 10);
            const longestStreak = parseInt(await AsyncStorage.getItem(STREAK_KEYS.LONGEST_STREAK) || '0', 10);
            const lastRecordDate = await AsyncStorage.getItem(STREAK_KEYS.LAST_RECORD_DATE);
            const totalRecords = parseInt(await AsyncStorage.getItem(STREAK_KEYS.TOTAL_RECORDS) || '0', 10);

            const isAtRisk = this.checkIfAtRisk(lastRecordDate, currentStreak);

            return {
                currentStreak: this.calculateCurrentStreak(lastRecordDate, currentStreak),
                longestStreak,
                lastRecordDate,
                totalRecords,
                isAtRisk,
            };
        } catch (error) {
            console.log('[Streak] Load error:', error);
            return { currentStreak: 0, longestStreak: 0, lastRecordDate: null, totalRecords: 0, isAtRisk: false };
        }
    }

    // 오늘 기록 완료 시 호출
    async recordCompleted(): Promise<StreakData> {
        try {
            const today = this.getDateString(new Date());
            const lastRecordDate = await AsyncStorage.getItem(STREAK_KEYS.LAST_RECORD_DATE);
            const currentStreak = parseInt(await AsyncStorage.getItem(STREAK_KEYS.CURRENT_STREAK) || '0', 10);
            const longestStreak = parseInt(await AsyncStorage.getItem(STREAK_KEYS.LONGEST_STREAK) || '0', 10);
            const totalRecords = parseInt(await AsyncStorage.getItem(STREAK_KEYS.TOTAL_RECORDS) || '0', 10);

            // 이미 오늘 기록했으면 무시
            if (lastRecordDate === today) {
                console.log('[Streak] Already recorded today');
                return this.getStreakData();
            }

            let newStreak = 1;

            if (lastRecordDate) {
                const yesterday = this.getDateString(new Date(Date.now() - 24 * 60 * 60 * 1000));
                if (lastRecordDate === yesterday) {
                    // 연속 기록!
                    newStreak = currentStreak + 1;
                    console.log(`[Streak] 🔥 연속 ${newStreak}일!`);
                } else {
                    // 스트릭 끊김 :(
                    console.log(`[Streak] 스트릭 리셋 (마지막: ${lastRecordDate})`);
                }
            }

            // 최장 기록 갱신
            const newLongest = Math.max(longestStreak, newStreak);

            // 저장
            await AsyncStorage.setItem(STREAK_KEYS.CURRENT_STREAK, newStreak.toString());
            await AsyncStorage.setItem(STREAK_KEYS.LONGEST_STREAK, newLongest.toString());
            await AsyncStorage.setItem(STREAK_KEYS.LAST_RECORD_DATE, today);
            await AsyncStorage.setItem(STREAK_KEYS.TOTAL_RECORDS, (totalRecords + 1).toString());

            return {
                currentStreak: newStreak,
                longestStreak: newLongest,
                lastRecordDate: today,
                totalRecords: totalRecords + 1,
                isAtRisk: false,
            };
        } catch (error) {
            console.log('[Streak] Record error:', error);
            return this.getStreakData();
        }
    }

    // 스트릭 위험 체크 (오늘 안 하면 끊김)
    private checkIfAtRisk(lastRecordDate: string | null, currentStreak: number): boolean {
        if (!lastRecordDate || currentStreak === 0) return false;

        const today = this.getDateString(new Date());
        const yesterday = this.getDateString(new Date(Date.now() - 24 * 60 * 60 * 1000));

        // 어제 기록했고 오늘 아직 안 했으면 위험
        return lastRecordDate === yesterday;
    }

    // 실제 현재 스트릭 계산 (스트릭 끊겼는지 확인)
    private calculateCurrentStreak(lastRecordDate: string | null, savedStreak: number): number {
        if (!lastRecordDate) return 0;

        const today = this.getDateString(new Date());
        const yesterday = this.getDateString(new Date(Date.now() - 24 * 60 * 60 * 1000));

        // 오늘 또는 어제 기록했으면 현재 스트릭 유지
        if (lastRecordDate === today || lastRecordDate === yesterday) {
            return savedStreak;
        }

        // 그 외에는 스트릭 끊김
        return 0;
    }

    // 날짜 문자열 (YYYY-MM-DD)
    private getDateString(date: Date): string {
        return date.toISOString().split('T')[0];
    }

    // 스트릭 메시지 생성
    getStreakMessage(streakData: StreakData): string {
        const { currentStreak, isAtRisk, longestStreak } = streakData;

        if (currentStreak === 0) {
            return '오늘부터 새로운 연속 기록을 시작해보세요!';
        }

        if (isAtRisk) {
            return `⚠️ ${currentStreak}일 연속 기록이 오늘 끊길 수 있어요!`;
        }

        if (currentStreak >= longestStreak && currentStreak > 1) {
            return `🏆 최장 기록 갱신 중! ${currentStreak}일 연속!`;
        }

        if (currentStreak >= 7) {
            return `🔥 대단해요! ${currentStreak}일 연속 기록 중!`;
        }

        if (currentStreak >= 3) {
            return `🌟 ${currentStreak}일 연속! 좋은 습관이 만들어지고 있어요!`;
        }

        return `✨ ${currentStreak}일 연속 기록 중!`;
    }

    // 디버깅용 리셋
    async resetStreak(): Promise<void> {
        await AsyncStorage.multiRemove(Object.values(STREAK_KEYS));
        console.log('[Streak] Reset complete');
    }
}

export const streakService = new StreakService();
export default streakService;
