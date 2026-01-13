/**
 * API Client Wrapper
 * 외부 API 호출을 중앙화하여 관리
 * 
 * 2026-01-13 생성: Anti-Gravity Architecture
 */
import { Platform } from 'react-native';

const API_BASE_URL = Platform.OS === 'web' &&
    typeof window !== 'undefined' &&
    window.location.hostname === 'localhost'
    ? 'http://localhost:3000/api'
    : 'https://theinnercircle-9xye.onrender.com/api';

export interface ApiResponse<T = any> {
    success: boolean;
    data?: T;
    error?: string;
}

class ApiClient {
    private baseUrl: string;

    constructor(baseUrl: string = API_BASE_URL) {
        this.baseUrl = baseUrl;
    }

    async get<T>(endpoint: string): Promise<ApiResponse<T>> {
        try {
            const response = await fetch(`${this.baseUrl}${endpoint}`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                },
            });
            const data = await response.json();
            return { success: true, data };
        } catch (error: any) {
            console.error(`[ApiClient] GET ${endpoint} error:`, error);
            return { success: false, error: error.message };
        }
    }

    async post<T>(endpoint: string, body: any): Promise<ApiResponse<T>> {
        try {
            const response = await fetch(`${this.baseUrl}${endpoint}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(body),
            });
            const data = await response.json();
            return { success: true, data };
        } catch (error: any) {
            console.error(`[ApiClient] POST ${endpoint} error:`, error);
            return { success: false, error: error.message };
        }
    }

    async put<T>(endpoint: string, body: any): Promise<ApiResponse<T>> {
        try {
            const response = await fetch(`${this.baseUrl}${endpoint}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(body),
            });
            const data = await response.json();
            return { success: true, data };
        } catch (error: any) {
            console.error(`[ApiClient] PUT ${endpoint} error:`, error);
            return { success: false, error: error.message };
        }
    }

    async delete<T>(endpoint: string): Promise<ApiResponse<T>> {
        try {
            const response = await fetch(`${this.baseUrl}${endpoint}`, {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json',
                },
            });
            const data = await response.json();
            return { success: true, data };
        } catch (error: any) {
            console.error(`[ApiClient] DELETE ${endpoint} error:`, error);
            return { success: false, error: error.message };
        }
    }
}

// 싱글톤 인스턴스
const apiClient = new ApiClient();

export default apiClient;
export { ApiClient, API_BASE_URL };
