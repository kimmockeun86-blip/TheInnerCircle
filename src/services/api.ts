import axios from 'axios';
import { Platform } from 'react-native';

// Force 127.0.0.1 for local debugging
const BASE_URL = Platform.OS === 'web'
    ? 'http://localhost:3000/api'
    : Platform.OS === 'android'
        ? 'http://10.0.2.2:3000/api'
        : 'http://localhost:3000/api';

console.log('[API] Initialized with BASE_URL:', BASE_URL, 'Platform:', Platform.OS);

const client = axios.create({
    baseURL: BASE_URL,
    timeout: 15000,
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
    }
};

