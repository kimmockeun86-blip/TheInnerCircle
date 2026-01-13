/**
 * Storage Wrapper
 * AsyncStorage를 감싸는 인터페이스로, 외부 라이브러리 직접 의존 방지
 * 
 * 2026-01-13 생성: Anti-Gravity Architecture
 */
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface StorageInterface {
    getItem(key: string): Promise<string | null>;
    setItem(key: string, value: string): Promise<void>;
    removeItem(key: string): Promise<void>;
    clear(): Promise<void>;
    getAllKeys(): Promise<readonly string[]>;
    multiGet(keys: readonly string[]): Promise<readonly [string, string | null][]>;
    multiSet(keyValuePairs: readonly [string, string][]): Promise<void>;
    multiRemove(keys: readonly string[]): Promise<void>;
}

class StorageWrapper implements StorageInterface {
    async getItem(key: string): Promise<string | null> {
        try {
            return await AsyncStorage.getItem(key);
        } catch (error) {
            console.error(`[StorageWrapper] getItem error for key "${key}":`, error);
            return null;
        }
    }

    async setItem(key: string, value: string): Promise<void> {
        try {
            await AsyncStorage.setItem(key, value);
        } catch (error) {
            console.error(`[StorageWrapper] setItem error for key "${key}":`, error);
        }
    }

    async removeItem(key: string): Promise<void> {
        try {
            await AsyncStorage.removeItem(key);
        } catch (error) {
            console.error(`[StorageWrapper] removeItem error for key "${key}":`, error);
        }
    }

    async clear(): Promise<void> {
        try {
            await AsyncStorage.clear();
        } catch (error) {
            console.error('[StorageWrapper] clear error:', error);
        }
    }

    async getAllKeys(): Promise<readonly string[]> {
        try {
            return await AsyncStorage.getAllKeys();
        } catch (error) {
            console.error('[StorageWrapper] getAllKeys error:', error);
            return [];
        }
    }

    async multiGet(keys: readonly string[]): Promise<readonly [string, string | null][]> {
        try {
            return await AsyncStorage.multiGet(keys as string[]);
        } catch (error) {
            console.error('[StorageWrapper] multiGet error:', error);
            return [];
        }
    }

    async multiSet(keyValuePairs: readonly [string, string][]): Promise<void> {
        try {
            await AsyncStorage.multiSet(keyValuePairs as [string, string][]);
        } catch (error) {
            console.error('[StorageWrapper] multiSet error:', error);
        }
    }

    async multiRemove(keys: readonly string[]): Promise<void> {
        try {
            await AsyncStorage.multiRemove(keys as string[]);
        } catch (error) {
            console.error('[StorageWrapper] multiRemove error:', error);
        }
    }
}

// 싱글톤 인스턴스
const storage = new StorageWrapper();

export default storage;
export { StorageWrapper };
