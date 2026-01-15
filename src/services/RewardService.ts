/**
 * Reward Service - Variable Reward 시스템
 * 
 * Hook Model의 "Variable Reward" 단계 구현
 * 예측 불가능한 보상으로 도파민 시스템 활성화
 * 
 * 2026-01-15 생성
 */

import AsyncStorage from '@react-native-async-storage/async-storage';

const REWARD_KEYS = {
    LAST_SPECIAL_DATE: 'reward_lastSpecialDate',
    SPECIAL_COUNT: 'reward_specialCount',
};

// 특별 칭찬 메시지 (랜덤으로 표시)
const SPECIAL_PRAISES = [
    "✨ 오늘따라 유난히 빛나는 당신이에요!",
    "💫 우주가 당신의 노력을 알아보고 있어요.",
    "🌟 작은 실천이 모여 큰 변화가 됩니다. 바로 당신처럼요.",
    "🦋 오늘 당신의 기록이 누군가에게 영감이 될 거예요.",
    "🌈 어제보다 성장한 오늘의 당신, 정말 멋져요!",
    "💎 당신은 이미 충분히 가치 있는 사람이에요.",
    "🔮 오르빗이 당신의 성장을 지켜보고 있어요.",
    "🌙 오늘 밤, 당신은 더 나은 내일을 위한 씨앗을 심었어요.",
];

// 레벨업 메시지 (7일, 14일, 21일, 30일...)
const LEVEL_UP_MESSAGES: Record<number, string> = {
    7: "🎖️ 7일 달성! 습관이 형성되기 시작했어요!",
    14: "🏅 2주 연속! 당신은 이미 다른 사람이에요!",
    21: "🏆 21일! 습관이 완전히 자리잡았어요!",
    30: "👑 한 달 달성! 당신은 진정한 마스터예요!",
    50: "⭐ 50일! 믿기 어려운 성과예요!",
    100: "🌟 100일! 당신은 전설이에요!",
};

// 격려 메시지 (연속 기록 끊겼을 때)
const COMEBACK_MESSAGES = [
    "💪 괜찮아요. 다시 시작하는 용기가 더 대단해요!",
    "🌱 새로운 시작은 언제나 가능해요. 오늘부터!",
    "🔄 넘어져도 다시 일어나는 당신이 멋져요.",
    "☀️ 어제는 어제일 뿐, 오늘 다시 시작해요!",
];

export interface RewardResult {
    type: 'normal' | 'special' | 'levelup' | 'comeback';
    message: string;
    emoji: string;
}

class RewardService {

    // 기록 완료 시 보상 결정
    async getRecordReward(currentStreak: number, wasStreakBroken: boolean): Promise<RewardResult> {
        // 스트릭 끊겼다가 돌아온 경우
        if (wasStreakBroken && currentStreak === 1) {
            return this.getComebackReward();
        }

        // 레벨업 체크 (7일, 14일, 21일...)
        if (LEVEL_UP_MESSAGES[currentStreak]) {
            return {
                type: 'levelup',
                message: LEVEL_UP_MESSAGES[currentStreak],
                emoji: this.getStreakEmoji(currentStreak),
            };
        }

        // Variable Reward: 20% 확률로 특별 메시지
        if (await this.shouldShowSpecialReward()) {
            return this.getSpecialReward();
        }

        // 일반 보상
        return {
            type: 'normal',
            message: this.getNormalMessage(currentStreak),
            emoji: '✅',
        };
    }

    // 특별 보상 확률 체크 (Variable Reward)
    private async shouldShowSpecialReward(): Promise<boolean> {
        const today = new Date().toISOString().split('T')[0];
        const lastSpecialDate = await AsyncStorage.getItem(REWARD_KEYS.LAST_SPECIAL_DATE);

        // 오늘 이미 특별 보상을 받았으면 안 줌
        if (lastSpecialDate === today) {
            return false;
        }

        // 20% 확률
        const random = Math.random();
        const shouldShow = random < 0.20;

        if (shouldShow) {
            await AsyncStorage.setItem(REWARD_KEYS.LAST_SPECIAL_DATE, today);
            const count = parseInt(await AsyncStorage.getItem(REWARD_KEYS.SPECIAL_COUNT) || '0', 10);
            await AsyncStorage.setItem(REWARD_KEYS.SPECIAL_COUNT, (count + 1).toString());
            console.log('[Reward] 🎉 특별 보상 활성화!');
        }

        return shouldShow;
    }

    // 특별 칭찬 메시지 (랜덤)
    private getSpecialReward(): RewardResult {
        const randomIndex = Math.floor(Math.random() * SPECIAL_PRAISES.length);
        return {
            type: 'special',
            message: SPECIAL_PRAISES[randomIndex],
            emoji: '🎁',
        };
    }

    // 컴백 메시지 (랜덤)
    private getComebackReward(): RewardResult {
        const randomIndex = Math.floor(Math.random() * COMEBACK_MESSAGES.length);
        return {
            type: 'comeback',
            message: COMEBACK_MESSAGES[randomIndex],
            emoji: '💪',
        };
    }

    // 일반 완료 메시지
    private getNormalMessage(streak: number): string {
        if (streak >= 7) {
            return `🔥 ${streak}일 연속! 오늘도 성장했어요!`;
        }
        if (streak >= 3) {
            return `✨ ${streak}일 연속 기록 완료!`;
        }
        if (streak > 1) {
            return `👏 ${streak}일째 연속 기록!`;
        }
        return '오늘의 기록이 완료되었어요!';
    }

    // 스트릭별 이모지
    private getStreakEmoji(streak: number): string {
        if (streak >= 100) return '🌟';
        if (streak >= 50) return '⭐';
        if (streak >= 30) return '👑';
        if (streak >= 21) return '🏆';
        if (streak >= 14) return '🏅';
        if (streak >= 7) return '🎖️';
        return '🔥';
    }

    // 알림용 FOMO 메시지 생성
    getFOMOMessage(streak: number): string | null {
        if (streak >= 7) {
            return `⚠️ ${streak}일 연속 기록이 오늘 끊어질 수 있어요!`;
        }
        if (streak >= 3) {
            return `🔥 ${streak}일 연속 중! 오늘도 이어가세요!`;
        }
        return null;
    }
}

export const rewardService = new RewardService();
export default rewardService;
