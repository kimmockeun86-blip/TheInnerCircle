// ORBIT Sound Service
// 웹: Web Audio API 합성 사운드
// 네이티브: expo-audio로 오디오 파일 재생

import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Audio } from 'expo-av';

// Sound files for native playback
const SOUND_FILES: { [key: string]: any } = {
    click: require('../../assets/sounds/click.mp3'),
    softClick: require('../../assets/sounds/click.mp3'), // 같은 파일 재사용
    transition: require('../../assets/sounds/modal_open.wav'),
    modalOpen: require('../../assets/sounds/modal_open.wav'),
    modalClose: require('../../assets/sounds/click.mp3'),
    success: require('../../assets/sounds/success.wav'),
    notification: require('../../assets/sounds/notification.wav'),
    startup: require('../../assets/sounds/success.wav'), // 성공음 재사용
    unlock: require('../../assets/sounds/unlock.wav'),
    cosmic: require('../../assets/sounds/unlock.wav'), // 해금음 재사용
};

type SoundType =
    | 'click'
    | 'softClick'
    | 'transition'
    | 'modalOpen'
    | 'modalClose'
    | 'success'
    | 'notification'
    | 'startup'
    | 'unlock'
    | 'cosmic';

class SoundService {
    private isEnabled: boolean = true;
    private isInitialized: boolean = false;
    private nativePlayerLoaded: boolean = false;

    async initialize(): Promise<void> {
        if (this.isInitialized) return;

        try {
            const savedEnabled = await AsyncStorage.getItem('soundEnabled');
            this.isEnabled = savedEnabled !== 'false';
            this.isInitialized = true;
            console.log('[SoundService] 초기화 완료, 사운드 활성화:', this.isEnabled);
        } catch (error) {
            console.log('[SoundService] 초기화 실패:', error);
        }
    }

    async setEnabled(enabled: boolean): Promise<void> {
        this.isEnabled = enabled;
        await AsyncStorage.setItem('soundEnabled', enabled ? 'true' : 'false');
        console.log('[SoundService] 사운드 설정:', enabled ? '활성화' : '비활성화');
    }

    getEnabled(): boolean {
        return this.isEnabled;
    }

    // 공개 메서드
    async playClick(): Promise<void> { await this.play('click'); }
    async playSoftClick(): Promise<void> { await this.play('softClick'); }
    async playTransition(): Promise<void> { await this.play('transition'); }
    async playModalOpen(): Promise<void> { await this.play('modalOpen'); }
    async playModalClose(): Promise<void> { await this.play('modalClose'); }
    async playSuccess(): Promise<void> { await this.play('success'); }
    async playNotification(): Promise<void> { await this.play('notification'); }
    async playStartup(): Promise<void> { await this.play('startup'); }
    async playUnlock(): Promise<void> { await this.play('unlock'); }
    async playCosmic(): Promise<void> { await this.play('cosmic'); }

    private async play(type: SoundType): Promise<void> {
        if (!this.isEnabled) return;

        try {
            if (Platform.OS === 'web') {
                await this.playWebAudio(type);
            } else {
                // 네이티브: 사운드 파일이 있으면 재생
                await this.playNativeAudio(type);
            }
        } catch (error) {
            // 사운드 재생 실패 무시
        }
    }

    // 네이티브 오디오 재생 (expo-av Audio.Sound 사용)
    private async playNativeAudio(type: SoundType): Promise<void> {
        const soundFile = SOUND_FILES[type];
        if (!soundFile) {
            console.log('[SoundService] 사운드 파일 없음:', type);
            return;
        }

        try {
            const { sound } = await Audio.Sound.createAsync(soundFile, {
                shouldPlay: true,
                volume: 0.7,
            });

            // 재생이 끝나면 리소스 해제
            sound.setOnPlaybackStatusUpdate((status) => {
                if (status.isLoaded && status.didJustFinish) {
                    sound.unloadAsync();
                }
            });

            console.log('[SoundService] 네이티브 사운드 재생:', type);
        } catch (error) {
            console.log('[SoundService] 네이티브 오디오 재생 실패:', error);
        }
    }

    // Web Audio API 합성 사운드
    private async playWebAudio(type: SoundType): Promise<void> {
        if (typeof window === 'undefined') return;

        const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
        if (!AudioContextClass) return;

        try {
            const ctx = new AudioContextClass();

            switch (type) {
                case 'click': this.synthClick(ctx); break;
                case 'softClick': this.synthSoftClick(ctx); break;
                case 'transition': this.synthTransition(ctx); break;
                case 'modalOpen': this.synthModalOpen(ctx); break;
                case 'modalClose': this.synthModalClose(ctx); break;
                case 'success': this.synthSuccess(ctx); break;
                case 'notification': this.synthNotification(ctx); break;
                case 'startup': this.synthStartup(ctx); break;
                case 'unlock': this.synthUnlock(ctx); break;
                case 'cosmic': this.synthCosmic(ctx); break;
            }

            setTimeout(() => ctx.close(), 2000);
        } catch (error) {
            console.log('[SoundService] 사운드 합성 실패:', error);
        }
    }

    // 버튼 클릭 - 크리스탈 톤
    private synthClick(ctx: AudioContext): void {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.frequency.setValueAtTime(880, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(440, ctx.currentTime + 0.08);
        osc.type = 'sine';
        gain.gain.setValueAtTime(0.08, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.1);
        osc.start(ctx.currentTime);
        osc.stop(ctx.currentTime + 0.1);
    }

    // 부드러운 클릭
    private synthSoftClick(ctx: AudioContext): void {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.frequency.setValueAtTime(660, ctx.currentTime);
        osc.type = 'sine';
        gain.gain.setValueAtTime(0.05, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.05);
        osc.start(ctx.currentTime);
        osc.stop(ctx.currentTime + 0.05);
    }

    // 화면 전환
    private synthTransition(ctx: AudioContext): void {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        const filter = ctx.createBiquadFilter();
        osc.connect(filter);
        filter.connect(gain);
        gain.connect(ctx.destination);
        osc.frequency.setValueAtTime(200, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(800, ctx.currentTime + 0.15);
        osc.type = 'triangle';
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(1000, ctx.currentTime);
        gain.gain.setValueAtTime(0.06, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.2);
        osc.start(ctx.currentTime);
        osc.stop(ctx.currentTime + 0.2);
    }

    // 모달 열림
    private synthModalOpen(ctx: AudioContext): void {
        const osc1 = ctx.createOscillator();
        const osc2 = ctx.createOscillator();
        const gain = ctx.createGain();
        osc1.connect(gain);
        osc2.connect(gain);
        gain.connect(ctx.destination);
        osc1.frequency.setValueAtTime(300, ctx.currentTime);
        osc1.frequency.exponentialRampToValueAtTime(600, ctx.currentTime + 0.2);
        osc1.type = 'sine';
        osc2.frequency.setValueAtTime(450, ctx.currentTime);
        osc2.frequency.exponentialRampToValueAtTime(900, ctx.currentTime + 0.2);
        osc2.type = 'sine';
        gain.gain.setValueAtTime(0.04, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.25);
        osc1.start(ctx.currentTime);
        osc2.start(ctx.currentTime);
        osc1.stop(ctx.currentTime + 0.25);
        osc2.stop(ctx.currentTime + 0.25);
    }

    // 모달 닫힘
    private synthModalClose(ctx: AudioContext): void {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.frequency.setValueAtTime(600, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(300, ctx.currentTime + 0.15);
        osc.type = 'sine';
        gain.gain.setValueAtTime(0.05, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.18);
        osc.start(ctx.currentTime);
        osc.stop(ctx.currentTime + 0.18);
    }

    // 성공 - 천상의 화음
    private synthSuccess(ctx: AudioContext): void {
        const frequencies = [523.25, 659.25, 783.99]; // C Major chord
        frequencies.forEach((freq, i) => {
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.connect(gain);
            gain.connect(ctx.destination);
            osc.frequency.setValueAtTime(freq, ctx.currentTime + i * 0.05);
            osc.type = 'sine';
            gain.gain.setValueAtTime(0, ctx.currentTime);
            gain.gain.linearRampToValueAtTime(0.06, ctx.currentTime + i * 0.05 + 0.05);
            gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.5);
            osc.start(ctx.currentTime + i * 0.05);
            osc.stop(ctx.currentTime + 0.5);
        });
    }

    // 알림
    private synthNotification(ctx: AudioContext): void {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.frequency.setValueAtTime(830, ctx.currentTime);
        osc.type = 'sine';
        gain.gain.setValueAtTime(0.08, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.3);
        osc.start(ctx.currentTime);
        osc.stop(ctx.currentTime + 0.3);
    }

    // 앱 시작
    private synthStartup(ctx: AudioContext): void {
        const osc1 = ctx.createOscillator();
        const osc2 = ctx.createOscillator();
        const gain = ctx.createGain();
        const filter = ctx.createBiquadFilter();
        osc1.connect(filter);
        osc2.connect(filter);
        filter.connect(gain);
        gain.connect(ctx.destination);
        osc1.frequency.setValueAtTime(110, ctx.currentTime);
        osc1.frequency.exponentialRampToValueAtTime(220, ctx.currentTime + 0.8);
        osc1.type = 'triangle';
        osc2.frequency.setValueAtTime(165, ctx.currentTime);
        osc2.frequency.exponentialRampToValueAtTime(330, ctx.currentTime + 0.8);
        osc2.type = 'sine';
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(500, ctx.currentTime);
        filter.frequency.exponentialRampToValueAtTime(2000, ctx.currentTime + 0.6);
        gain.gain.setValueAtTime(0, ctx.currentTime);
        gain.gain.linearRampToValueAtTime(0.08, ctx.currentTime + 0.3);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 1);
        osc1.start(ctx.currentTime);
        osc2.start(ctx.currentTime);
        osc1.stop(ctx.currentTime + 1);
        osc2.stop(ctx.currentTime + 1);
    }

    // 미션 해금
    private synthUnlock(ctx: AudioContext): void {
        const notes = [523.25, 659.25, 783.99, 1046.5];
        notes.forEach((freq, i) => {
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.connect(gain);
            gain.connect(ctx.destination);
            osc.frequency.setValueAtTime(freq, ctx.currentTime);
            osc.type = 'sine';
            const startTime = ctx.currentTime + i * 0.08;
            gain.gain.setValueAtTime(0, startTime);
            gain.gain.linearRampToValueAtTime(0.07, startTime + 0.02);
            gain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.15);
            osc.start(startTime);
            osc.stop(startTime + 0.15);
        });
    }

    // 우주적 효과
    private synthCosmic(ctx: AudioContext): void {
        // 저음 드론
        const drone = ctx.createOscillator();
        const droneGain = ctx.createGain();
        drone.connect(droneGain);
        droneGain.connect(ctx.destination);
        drone.frequency.setValueAtTime(55, ctx.currentTime);
        drone.type = 'sine';
        droneGain.gain.setValueAtTime(0, ctx.currentTime);
        droneGain.gain.linearRampToValueAtTime(0.06, ctx.currentTime + 0.3);
        droneGain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 1.2);
        drone.start(ctx.currentTime);
        drone.stop(ctx.currentTime + 1.2);

        // 고음 스파클
        const sparkle = ctx.createOscillator();
        const sparkleGain = ctx.createGain();
        sparkle.connect(sparkleGain);
        sparkleGain.connect(ctx.destination);
        sparkle.frequency.setValueAtTime(1760, ctx.currentTime + 0.2);
        sparkle.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.8);
        sparkle.type = 'sine';
        sparkleGain.gain.setValueAtTime(0, ctx.currentTime + 0.2);
        sparkleGain.gain.linearRampToValueAtTime(0.03, ctx.currentTime + 0.25);
        sparkleGain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 1);
        sparkle.start(ctx.currentTime + 0.2);
        sparkle.stop(ctx.currentTime + 1);
    }

    async cleanup(): Promise<void> {
        // 리소스 정리 (필요 시)
    }
}

export const soundService = new SoundService();
export default soundService;
