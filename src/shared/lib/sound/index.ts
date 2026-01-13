/**
 * Sound Wrapper
 * expo-audio를 감싸는 인터페이스
 * 
 * 2026-01-13 생성: Anti-Gravity Architecture
 */
import { Platform } from 'react-native';

export type SoundType =
    | 'tap'
    | 'success'
    | 'error'
    | 'notification'
    | 'levelUp'
    | 'mystical'
    | 'submit';

class SoundWrapper {
    private isEnabled: boolean = true;
    private loadedSounds: Map<string, any> = new Map();

    async initialize(): Promise<void> {
        try {
            console.log('[SoundWrapper] Initialized');
        } catch (error) {
            console.error('[SoundWrapper] Initialization error:', error);
        }
    }

    async play(soundType: SoundType): Promise<void> {
        if (!this.isEnabled) return;

        try {
            console.log(`[SoundWrapper] Playing: ${soundType}`);
            // 실제 구현은 기존 SoundService를 통해 처리
        } catch (error) {
            console.error(`[SoundWrapper] Play error for ${soundType}:`, error);
        }
    }

    setEnabled(enabled: boolean): void {
        this.isEnabled = enabled;
        console.log(`[SoundWrapper] Enabled: ${enabled}`);
    }

    isActive(): boolean {
        return this.isEnabled;
    }

    async cleanup(): Promise<void> {
        this.loadedSounds.clear();
        console.log('[SoundWrapper] Cleaned up');
    }
}

const sound = new SoundWrapper();
export default sound;
export { SoundWrapper };
