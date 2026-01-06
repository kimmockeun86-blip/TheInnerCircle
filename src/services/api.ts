import axios from 'axios';
import { Platform } from 'react-native';
import Constants from 'expo-constants';
import logger from '../utils/logger';

// API URL을 Expo Constants에서 읽기 (app.config.js에서 환경별로 설정)
// 개발 환경: 로컬 서버 (에뮬레이터는 10.0.2.2 사용)
// 프로덕션: render.com
const getBaseUrl = () => {
    if (__DEV__) {
        // 개발 모드
        if (Platform.OS === 'android') {
            return 'http://10.0.2.2:3000/api'; // Android 에뮬레이터에서 localhost 접근
        } else if (Platform.OS === 'web') {
            return 'http://localhost:3000/api';
        } else {
            return 'http://localhost:3000/api'; // iOS
        }
    }
    return Constants.expoConfig?.extra?.apiUrl || 'https://theinnercircle-9xye.onrender.com/api';
};

const BASE_URL = getBaseUrl();

// 현재 환경 로깅
const appEnv = __DEV__ ? 'development' : 'production';
logger.log(`[API] Environment: ${appEnv}`);
logger.log('[API] Initialized with BASE_URL:', BASE_URL, 'Platform:', Platform.OS);

const client = axios.create({
    baseURL: BASE_URL,
    timeout: 60000, // 60 seconds (Render cold start can take 30-50sec)
    headers: {
        'Content-Type': 'application/json',
    },
});

export const api = {
    // D. 프로필 분석
    analyzeProfile: async (profile: any) => {
        try {
            logger.log('[API] analyzeProfile calling:', `${BASE_URL}/analysis/profile`, profile);
            const response = await client.post('/analysis/profile', profile);
            logger.log('[API] analyzeProfile success:', response.data);
            return response.data;
        } catch (error: any) {
            console.error('API Error [analyzeProfile]:', error.message);
            throw error; // Fail loudly as requested
        }
    },

    // E. 일지 분석 및 피드백
    analyzeJournal: async (data: any) => {
        try {
            const isFormData = data instanceof FormData;
            // Do NOT set Content-Type manually for FormData, let the browser/axios set it with the boundary
            const headers = {};
            const response = await client.post('/analysis/journal', data, { headers });
            return response.data;
        } catch (error: any) {
            console.error('API Error [analyzeJournal]:', error.message);
            throw error; // Fail loudly as requested
        }
    },

    // F. 관리자 푸시 전송 (Simulation)
    sendAdminPush: async (targetId: string, message: string, type: string) => {
        logger.log(`[Mock API] Sending Push to ${targetId}: ${message} (${type})`);
        return { success: true, message: 'Push sent successfully' };
    },

    // H. 관리자 미션 강제 할당
    assignMission: async (userId: string, missionText: string) => {
        try {
            const response = await client.post('/admin/assign-mission', { userId, missionText });
            return response.data;
        } catch (error) {
            console.error('API Error [assignMission]:', error);
            // Fallback for Admin
            return { success: true, message: "미션이 강제로 부여되었습니다. (오프라인 모드)" };
        }
    },

    // G. 대화 분석
    analyzeConversation: async (history: { role: string; text: string }[]) => {
        try {
            const response = await client.post('/analysis/conversation', { history });
            return response.data;
        } catch (error) {
            return { success: false, summary: '분석 서버 연결 실패', advice: '잠시 후 다시 시도해주세요.' };
        }
    },

    // H. 매칭 요청
    match: async (profile: any) => {
        try {
            const response = await client.post('/match', profile);
            return response.data;
        } catch (error) {
            console.error('API Error [match]:', error);
            return {
                success: true,
                match: {
                    _id: 'mock_user_fallback',
                    name: '이서연',
                    age: 28,
                    job: '플로리스트',
                    deficit: '안정',
                    idealType: '따뜻하고 진실된 사람',
                    gender: profile.gender === '남성' ? '여성' : '남성'
                },
                reason: "운명의 붉은 실은 보이지 않는 곳에서도 이어져 있습니다. (오프라인 매칭)"
            };
        }
    },

    // I. 커플 미션 분석
    analyzeCoupleChat: async (data: { chat: string, day: number, isSpecialMission: boolean }) => {
        try {
            logger.log('[API] analyzeCoupleChat calling:', `${BASE_URL}/analysis/couple-chat`, data);
            const response = await client.post('/analysis/couple-chat', data);
            logger.log('[API] analyzeCoupleChat success:', response.data);
            return response.data;
        } catch (error: any) {
            console.error('API Error [analyzeCoupleChat]:', error.message);
            throw error;
        }
    },

    // J. 커플 프로필 분석 (Day 1 초기화)
    analyzeCoupleProfile: async (profile: any) => {
        try {
            logger.log('[API] analyzeCoupleProfile calling:', `${BASE_URL}/analysis/couple-profile`, profile);
            const response = await client.post('/analysis/couple-profile', profile);
            return response.data;
        } catch (error: any) {
            console.error('API Error [analyzeCoupleProfile]:', error.message);
            throw error;
        }
    },

    // K. 미션 생성
    generateMission: async (data: { dayCount: number, deficit: string, complex: string, name: string }) => {
        try {
            logger.log('[API] generateMission calling:', `${BASE_URL}/mission/generate`, data);
            const response = await client.post('/mission/generate', data);
            return response.data;
        } catch (error: any) {
            console.error('API Error [generateMission]:', error.message);
            // Fallback
            return { success: false, mission: null };
        }
    },

    // L. 매칭 데이터 조회
    getMatchData: async (userName: string) => {
        try {
            logger.log('[API] getMatchData calling:', `${BASE_URL}/match/data`, { userName });
            const response = await client.get(`/match/data?userName=${userName}`);
            return response.data;
        } catch (error: any) {
            console.error('API Error [getMatchData]:', error.message);
            return { success: false, match: null };
        }
    },

    // ============================================
    // LETTER EXCHANGE MATCHING SYSTEM (Phase 3)
    // ============================================

    // M. Get matching candidates
    getMatchingCandidates: async (data: {
        userId: string,
        userLocation: string,
        userMbti?: string,
        userDeficit?: string,
        userGender: string
    }) => {
        try {
            logger.log('[API] getMatchingCandidates calling:', data);
            const response = await client.post('/matching/candidates', data);
            return response.data;
        } catch (error: any) {
            console.error('API Error [getMatchingCandidates]:', error.message);
            return { success: false, candidates: [], message: '매칭 서버 연결 실패' };
        }
    },

    // N. Send letter to candidate
    sendLetter: async (data: {
        fromUserId: string,
        fromUserName: string,
        toUserId: string,
        content: string
    }) => {
        try {
            logger.log('[API] sendLetter calling:', data);
            const response = await client.post('/matching/letter/send', data);
            return response.data;
        } catch (error: any) {
            console.error('API Error [sendLetter]:', error.message);
            return { success: false, message: '편지 전송 실패' };
        }
    },

    // O. Get received letters (inbox)
    getLetterInbox: async (userId: string) => {
        try {
            logger.log('[API] getLetterInbox calling:', { userId });
            const response = await client.post('/matching/letter/inbox', { userId });
            return response.data;
        } catch (error: any) {
            console.error('API Error [getLetterInbox]:', error.message);
            return { success: false, letters: [], count: 0 };
        }
    },

    // P. Accept meeting (final match)
    acceptMeeting: async (data: {
        userId: string,
        partnerId: string,
        partnerName: string
    }) => {
        try {
            logger.log('[API] acceptMeeting calling:', data);
            const response = await client.post('/matching/accept', data);
            return response.data;
        } catch (error: any) {
            console.error('API Error [acceptMeeting]:', error.message);
            return { success: false, matched: false, message: '매칭 실패' };
        }
    },

    // ============================================
    // Q. 아침/점심/저녁 맞춤 조언 (AI 동적 생성)
    // ============================================
    getPersonalizedAdvice: async (data: {
        userId?: string,
        name: string,
        deficit: string,
        currentMission: string,
        recentJournals: Array<{ day: number; content: string; mission?: string }>,
        timeOfDay: 'morning' | 'noon' | 'evening',
        dayCount: number,
        growthLevel: number,
        // 신뢰 시스템 추가 파라미터
        streakDays?: number,
        daysSinceSignup?: number,
        moodTrend?: 'positive' | 'negative' | 'neutral'
    }) => {
        try {
            logger.log('[API] getPersonalizedAdvice calling:', { name: data.name, timeOfDay: data.timeOfDay });
            const response = await client.post('/advice/personalized', data);
            logger.log('[API] getPersonalizedAdvice success:', response.data);
            return response.data;
        } catch (error: any) {
            console.error('API Error [getPersonalizedAdvice]:', error.message);
            // Fallback advice
            let fallbackAdvice = '';
            let fallbackIcon = '';
            if (data.timeOfDay === 'morning') {
                fallbackAdvice = `좋은 아침이에요, ${data.name}님! 오늘도 새로운 하루가 시작되었어요. 오늘의 리추얼을 떠올리며 시작해보세요.`;
                fallbackIcon = '🌅';
            } else if (data.timeOfDay === 'noon') {
                fallbackAdvice = `${data.name}님, 점심 시간이에요. 잠시 멈추고 오늘의 리추얼을 떠올려보세요.`;
                fallbackIcon = '🌞';
            } else {
                fallbackAdvice = `${data.name}님, 오늘 하루 수고했어요. 오르빗에 기록을 남기면 내일이 더 명확해집니다.`;
                fallbackIcon = '🌙';
            }
            return {
                success: true,
                advice: fallbackAdvice,
                focusPrompt: '오늘 리추얼을 실천해보셨나요?',  // 예/아니오로 답할 수 있는 폐쇄형 질문
                timeOfDay: data.timeOfDay,
                icon: fallbackIcon,
                yesResponse: '멋져요! 꾸준한 실천이 큰 변화를 만들어냅니다.',
                noResponse: '괜찮아요. 지금 이 순간 떠올린 것만으로도 의미가 있어요.'
            };
        }
    }
};

