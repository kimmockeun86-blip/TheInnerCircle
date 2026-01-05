import AsyncStorage from '@react-native-async-storage/async-storage';

// ================================================
// ORBIT Trust System - 스트릭, 기념일, 위기감지
// ================================================

interface StreakData {
    currentStreak: number;
    longestStreak: number;
    lastRecordDate: string;
    totalRecords: number;
}

interface MilestoneData {
    signupDate: string;
    firstMatchDate?: string;
    coupleStartDate?: string;
}

const STORAGE_KEYS = {
    STREAK: 'orbit_streak_data',
    MILESTONES: 'orbit_milestones',
    LAST_CHECKIN_RESPONSE: 'orbit_last_checkin',
    CRISIS_DETECTED: 'orbit_crisis_detected',
};

// ===== 스트릭 시스템 =====

export const StreakService = {
    // 스트릭 데이터 가져오기
    async getStreakData(): Promise<StreakData> {
        try {
            const stored = await AsyncStorage.getItem(STORAGE_KEYS.STREAK);
            if (stored) {
                return JSON.parse(stored);
            }
        } catch (e) {
            console.log('[Streak] Error loading:', e);
        }
        return {
            currentStreak: 0,
            longestStreak: 0,
            lastRecordDate: '',
            totalRecords: 0,
        };
    },

    // 기록 완료 시 호출 - 스트릭 업데이트
    async recordCompleted(): Promise<{ streak: number; milestone?: string; message?: string }> {
        const data = await this.getStreakData();
        const today = new Date().toISOString().split('T')[0];
        const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];

        let milestone: string | undefined;
        let message: string | undefined;

        if (data.lastRecordDate === today) {
            // 오늘 이미 기록함
            return { streak: data.currentStreak };
        }

        if (data.lastRecordDate === yesterday) {
            // 연속 기록!
            data.currentStreak += 1;
        } else if (data.lastRecordDate && data.lastRecordDate !== today) {
            // 끊어짐 - 리셋
            console.log(`[Streak] 🔴 끊어짐! ${data.currentStreak}일 → 1일`);
            data.currentStreak = 1;
        } else {
            // 첫 기록
            data.currentStreak = 1;
        }

        data.lastRecordDate = today;
        data.totalRecords += 1;

        // 최장 기록 갱신
        if (data.currentStreak > data.longestStreak) {
            data.longestStreak = data.currentStreak;
        }

        // 마일스톤 체크
        const milestones: Record<number, string> = {
            3: '🔥 3일 연속! 꾸준히 하고 계시네요',
            7: '✨ 일주일이나! 변화가 시작됐어요',
            14: '💫 2주 연속! 습관이 되어가고 있어요',
            30: '🌟 한 달 동안 함께했어요. 당신은 정말 대단합니다',
            50: '💎 50일! 당신의 꾸준함에 감탄합니다',
            100: '👑 100일! 당신은 이미 변화했습니다',
        };

        if (milestones[data.currentStreak]) {
            milestone = `${data.currentStreak}일`;
            message = milestones[data.currentStreak];
        }

        await AsyncStorage.setItem(STORAGE_KEYS.STREAK, JSON.stringify(data));
        console.log(`[Streak] ✅ ${data.currentStreak}일 연속!`);

        return { streak: data.currentStreak, milestone, message };
    },

    // 스트릭 끊김 확인 (앱 시작 시)
    async checkStreakBroken(): Promise<{ broken: boolean; previousStreak: number; message?: string }> {
        const data = await this.getStreakData();
        const today = new Date().toISOString().split('T')[0];
        const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];

        if (data.lastRecordDate && data.lastRecordDate !== today && data.lastRecordDate !== yesterday) {
            // 끊어짐
            const previousStreak = data.currentStreak;
            const message = previousStreak >= 7
                ? `${previousStreak}일 연속 기록이 끊어졌어요. 하지만 괜찮아요, 다시 시작하면 됩니다.`
                : previousStreak >= 3
                    ? '며칠 쉬셨군요. 다시 함께 걸어가요.'
                    : undefined;

            return { broken: true, previousStreak, message };
        }
        return { broken: false, previousStreak: 0 };
    },
};

// ===== 기념일 서비스 =====

export const MilestoneService = {
    // 가입일 저장
    async setSignupDate(): Promise<void> {
        try {
            const existing = await AsyncStorage.getItem(STORAGE_KEYS.MILESTONES);
            if (existing) {
                const data = JSON.parse(existing);
                if (data.signupDate) return; // 이미 있음
            }
            const data: MilestoneData = {
                signupDate: new Date().toISOString(),
            };
            await AsyncStorage.setItem(STORAGE_KEYS.MILESTONES, JSON.stringify(data));
            console.log('[Milestone] 가입일 저장됨');
        } catch (e) {
            console.log('[Milestone] Error:', e);
        }
    },

    // 매칭일 저장
    async setFirstMatchDate(): Promise<void> {
        try {
            const existing = await AsyncStorage.getItem(STORAGE_KEYS.MILESTONES);
            const data: MilestoneData = existing ? JSON.parse(existing) : { signupDate: new Date().toISOString() };
            if (!data.firstMatchDate) {
                data.firstMatchDate = new Date().toISOString();
                await AsyncStorage.setItem(STORAGE_KEYS.MILESTONES, JSON.stringify(data));
                console.log('[Milestone] 첫 매칭일 저장됨');
            }
        } catch (e) {
            console.log('[Milestone] Error:', e);
        }
    },

    // 기념일 체크
    async checkMilestones(): Promise<{ type: string; days: number; message: string } | null> {
        try {
            const stored = await AsyncStorage.getItem(STORAGE_KEYS.MILESTONES);
            if (!stored) return null;

            const data: MilestoneData = JSON.parse(stored);
            const now = new Date();
            const today = now.toISOString().split('T')[0];

            // 가입일 기준 체크
            if (data.signupDate) {
                const signupDate = new Date(data.signupDate);
                const daysSinceSignup = Math.floor((now.getTime() - signupDate.getTime()) / 86400000);

                const signupMilestones: Record<number, string> = {
                    100: '🎉 오늘은 당신이 ORBIT과 함께한 지 100일이 되는 날이에요!',
                    365: '🎊 1년! 당신과 함께한 365일, 정말 뜻깊은 여정이었어요.',
                    30: '💫 한 달! ORBIT과 함께한 30일을 축하해요.',
                    7: '✨ 일주일! 벌써 7일이나 함께했네요.',
                };

                if (signupMilestones[daysSinceSignup]) {
                    return {
                        type: 'signup',
                        days: daysSinceSignup,
                        message: signupMilestones[daysSinceSignup],
                    };
                }
            }

            // 매칭일 기준 체크
            if (data.firstMatchDate) {
                const matchDate = new Date(data.firstMatchDate);
                const daysSinceMatch = Math.floor((now.getTime() - matchDate.getTime()) / 86400000);

                const matchMilestones: Record<number, string> = {
                    100: '💕 첫 인연과 연결된 지 100일이 되었어요!',
                    30: '💝 인연과 함께한 한 달을 축하해요.',
                    7: '💗 인연을 만난 지 일주일! 어떠세요?',
                };

                if (matchMilestones[daysSinceMatch]) {
                    return {
                        type: 'match',
                        days: daysSinceMatch,
                        message: matchMilestones[daysSinceMatch],
                    };
                }
            }

            return null;
        } catch (e) {
            console.log('[Milestone] Check error:', e);
            return null;
        }
    },
};

// ===== 위기 감지 서비스 =====

const CRISIS_KEYWORDS = [
    '힘들', '포기', '지치', '우울', '불안', '외로', '슬프', '괴로',
    '죽고싶', '자해', '끝내고싶', '의미없', '무기력', '절망',
];

export const CrisisDetectionService = {
    // 기록 분석
    analyzeRecord(text: string): { crisis: boolean; level: 'low' | 'medium' | 'high'; keywords: string[] } {
        const foundKeywords: string[] = [];
        let highRisk = false;

        for (const keyword of CRISIS_KEYWORDS) {
            if (text.includes(keyword)) {
                foundKeywords.push(keyword);
                if (['죽고싶', '자해', '끝내고싶'].includes(keyword)) {
                    highRisk = true;
                }
            }
        }

        if (foundKeywords.length === 0) {
            return { crisis: false, level: 'low', keywords: [] };
        }

        return {
            crisis: true,
            level: highRisk ? 'high' : foundKeywords.length >= 3 ? 'medium' : 'low',
            keywords: foundKeywords,
        };
    },

    // 연속 부정 기록 체크
    async trackNegativeRecords(isNegative: boolean): Promise<{ showCare: boolean; message?: string }> {
        const key = 'crisis_negative_count';
        const stored = await AsyncStorage.getItem(key);
        let count = stored ? parseInt(stored, 10) : 0;

        if (isNegative) {
            count += 1;
            await AsyncStorage.setItem(key, count.toString());

            if (count >= 3) {
                // 3일 연속 부정적
                await AsyncStorage.setItem(key, '0'); // 리셋
                return {
                    showCare: true,
                    message: '요즘 힘든 일이 많으신 것 같아요. 괜찮으세요? 당신의 마음이 걱정됩니다.',
                };
            }
        } else {
            // 긍정적 기록 → 리셋
            await AsyncStorage.setItem(key, '0');
        }

        return { showCare: false };
    },

    // 케어 메시지 생성
    getCareMessage(level: 'low' | 'medium' | 'high'): string {
        const messages = {
            low: '오늘 하루가 조금 힘들었던 것 같아요. 괜찮아요, 내일은 더 나을 거예요.',
            medium: '요즘 많이 지치셨나요? 잠시 쉬어가도 됩니다. 당신은 충분히 잘하고 있어요.',
            high: '많이 힘드시죠. 혼자 감당하지 않으셔도 돼요. 주변에 마음을 나눌 수 있는 분께 연락해보세요.',
        };
        return messages[level];
    },
};

// ===== 아침/저녁 체크인 서비스 =====

export const CheckInService = {
    // 체크인 질문 생성
    getCheckInQuestion(timeOfDay: 'morning' | 'evening'): { question: string; yesResponse: string; noResponse: string } {
        if (timeOfDay === 'morning') {
            const morningQuestions = [
                {
                    question: '오늘 하루, 좋은 일이 있을 것 같은 예감이 드시나요?',
                    yesResponse: '그 예감을 믿어보세요. 좋은 일이 찾아올 거예요.',
                    noResponse: '괜찮아요. 때로는 그런 날도 있죠. 하지만 하루가 어떻게 흘러갈지는 아무도 몰라요.',
                },
                {
                    question: '오늘 누군가에게 따뜻한 말을 건네볼 준비가 되셨나요?',
                    yesResponse: '좋아요! 작은 말 한마디가 하루를 바꿀 수 있어요.',
                    noResponse: '괜찮아요. 먼저 자신에게 따뜻한 말을 해주는 것도 좋아요.',
                },
            ];
            return morningQuestions[Math.floor(Math.random() * morningQuestions.length)];
        } else {
            const eveningQuestions = [
                {
                    question: '오늘 하루, 만족스러운 하루였나요?',
                    yesResponse: '다행이에요. 오늘의 좋은 기운이 내일까지 이어지길 바랍니다.',
                    noResponse: '그래도 하루를 무사히 마쳤잖아요. 그것만으로도 충분해요.',
                },
                {
                    question: '오늘 당신에게 특별히 고마웠던 순간이 있었나요?',
                    yesResponse: '그 순간을 기억해두세요. 힘들 때 힘이 될 거예요.',
                    noResponse: '내일은 작은 것에서도 감사를 느껴보세요. 삶이 달라 보일 거예요.',
                },
            ];
            return eveningQuestions[Math.floor(Math.random() * eveningQuestions.length)];
        }
    },

    // 마지막 체크인 응답 저장
    async saveCheckInResponse(timeOfDay: string, response: 'yes' | 'no'): Promise<void> {
        const data = {
            date: new Date().toISOString().split('T')[0],
            timeOfDay,
            response,
        };
        await AsyncStorage.setItem(STORAGE_KEYS.LAST_CHECKIN_RESPONSE, JSON.stringify(data));
    },
};

// ===== 메인 서비스 =====

export const OrbitTrustService = {
    StreakService,
    MilestoneService,
    CrisisDetectionService,
    CheckInService,

    // 앱 시작 시 초기화
    async initialize(): Promise<void> {
        await MilestoneService.setSignupDate();
        console.log('[OrbitTrust] Initialized');
    },

    // 일일 체크 (앱 시작 시 호출)
    async dailyCheck(): Promise<{
        streakBroken?: { message: string };
        milestone?: { message: string };
        careNeeded?: boolean;
    }> {
        const result: any = {};

        // 스트릭 끊김 체크
        const streakCheck = await StreakService.checkStreakBroken();
        if (streakCheck.broken && streakCheck.message) {
            result.streakBroken = { message: streakCheck.message };
        }

        // 기념일 체크
        const milestoneCheck = await MilestoneService.checkMilestones();
        if (milestoneCheck) {
            result.milestone = { message: milestoneCheck.message };
        }

        return result;
    },
};

export default OrbitTrustService;
