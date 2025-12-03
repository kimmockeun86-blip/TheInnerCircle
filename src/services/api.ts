import axios from 'axios';
import { Platform } from 'react-native';
import { API_URL } from '../config'; // 설정 파일에서 주소 가져오기

const BASE_URL = API_URL;

console.log('[API] Initialized with BASE_URL:', BASE_URL, 'Platform:', Platform.OS);

const client = axios.create({
    baseURL: BASE_URL,
    timeout: 60000,
    headers: {
        'Content-Type': 'application/json',
    },
});
export const api = {
    // D. 프로필 분석
    analyzeProfile: async (profile: any) => {
        try {
            console.log('[API] analyzeProfile calling:', `${BASE_URL}/analysis/profile`, profile);
            const response = await client.post('/analysis/profile', profile);
            console.log('[API] analyzeProfile success:', response.data);
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
        console.log(`[Mock API] Sending Push to ${targetId}: ${message} (${type})`);
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
                    gender: profile.gender === '남성' ? '여성' : '남성'
                },
                reason: "운명의 붉은 실은 보이지 않는 곳에서도 이어져 있습니다. (오프라인 매칭)"
            };
        }
    },

    // I. 커플 미션 분석
    analyzeCoupleChat: async (data: { chat: string, day: number, isSpecialMission: boolean }) => {
        try {
            console.log('[API] analyzeCoupleChat calling:', `${BASE_URL}/analysis/couple-chat`, data);
            const response = await client.post('/analysis/couple-chat', data);
            console.log('[API] analyzeCoupleChat success:', response.data);
            return response.data;
        } catch (error: any) {
            console.error('API Error [analyzeCoupleChat]:', error.message);
            throw error;
        }
    },

    // K. 연결 테스트 (디버깅용)
    checkConnection: async () => {
        try {
            console.log('[API] Checking connection to:', BASE_URL);
            const response = await client.get('/health');
            return { success: true, url: BASE_URL, data: response.data };
        } catch (error: any) {
            return { success: false, url: BASE_URL, error: error.message };
        }
    },

    // J. 커플 프로필 분석 (Day 1 초기화)
    analyzeCoupleProfile: async (profile: any) => {
        try {
            console.log('[API] analyzeCoupleProfile calling:', `${BASE_URL}/analysis/couple-profile`, profile);
            const response = await client.post('/analysis/couple-profile', profile);
            return response.data;
        } catch (error: any) {
            console.error('API Error [analyzeCoupleProfile]:', error.message);
            throw error;
        }
    }
};

