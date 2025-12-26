import { Audio } from 'expo-av';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

/**
 * ORBIT Sound Service
 * 신비롭고 우주적인 앰비언트 사운드 효과
 * 버튼 클릭, 화면 전환, 분석 완료, 미션 해금 등
 */

// 사운드 타입 정의
type SoundType =
    | 'click'           // 버튼 클릭
    | 'softClick'       // 부드러운 클릭 (토글, 작은 버튼)
    | 'transition'      // 화면 전환
    | 'modalOpen'       // 모달 열림
    | 'modalClose'      // 모달 닫힘
    | 'success'         // 성공 (미션 완료, 분석 완료)
    | 'notification'    // 알림
    | 'startup'         // 앱 시작
    | 'unlock'          // 미션 해금
    | 'cosmic';         // 우주적 효과 (특별한 순간)

class SoundService {
    private isEnabled: boolean = true;
    private isInitialized: boolean = false;
    private audioContext: AudioContext | null = null;

    // 초기화 - 앱 시작 시 호출
    async initialize(): Promise<void> {
        if (this.isInitialized) return;

        try {
            // 저장된 설정 로드
            const savedEnabled = await AsyncStorage.getItem('soundEnabled');
            this.isEnabled = savedEnabled !== 'false'; // 기본값 true

            // 오디오 모드 설정
            if (Platform.OS !== 'web') {
                await Audio.setAudioModeAsync({
                    allowsRecordingIOS: false,
                    playsInSilentModeIOS: true,
                    staysActiveInBackground: false,
                    shouldDuckAndroid: true,
                });
            }

            this.isInitialized = true;
            console.log('[SoundService] 초기화 완료, 사운드 활성화:', this.isEnabled);
        } catch (error) {
            console.log('[SoundService] 초기화 실패:', error);
        }
    }

    // 사운드 활성화/비활성화 토글
    async setEnabled(enabled: boolean): Promise<void> {
        this.isEnabled = enabled;
        await AsyncStorage.setItem('soundEnabled', enabled ? 'true' : 'false');
        console.log('[SoundService] 사운드 설정:', enabled ? '활성화' : '비활성화');
    }

    // 현재 상태 확인
    getEnabled(): boolean {
        return this.isEnabled;
    }

    // ============================================
    // 공개 메서드 - 각 상황에 맞는 사운드 재생
    // ============================================

    // 버튼 클릭 (일반)
    async playClick(): Promise<void> {
        await this.play('click');
    }

    // 부드러운 클릭 (토글, 작은 버튼)
    async playSoftClick(): Promise<void> {
        await this.play('softClick');
    }

    // 화면 전환
    async playTransition(): Promise<void> {
        await this.play('transition');
    }

    // 모달 열림
    async playModalOpen(): Promise<void> {
        await this.play('modalOpen');
    }

    // 모달 닫힘
    async playModalClose(): Promise<void> {
        await this.play('modalClose');
    }

    // 성공 (미션 완료, 분석 완료)
    async playSuccess(): Promise<void> {
        await this.play('success');
    }

    // 알림
    async playNotification(): Promise<void> {
        await this.play('notification');
    }

    // 앱 시작
    async playStartup(): Promise<void> {
        await this.play('startup');
    }

    // 미션 해금
    async playUnlock(): Promise<void> {
        await this.play('unlock');
    }

    // 우주적 효과 (특별한 순간)
    async playCosmic(): Promise<void> {
        await this.play('cosmic');
    }

    // ============================================
    // 내부 메서드
    // ============================================

    private async play(type: SoundType): Promise<void> {
        if (!this.isEnabled) return;

        try {
            if (Platform.OS === 'web') {
                await this.playWebAudio(type);
            } else {
                // 모바일에서도 Web Audio 스타일로 합성
                await this.playWebAudio(type);
            }
        } catch (error) {
            // 사운드 재생 실패는 무시 (UX에 영향 주지 않음)
        }
    }

    // ORBIT 스타일의 신비로운 앰비언트 사운드 합성
    private async playWebAudio(type: SoundType): Promise<void> {
        if (typeof window === 'undefined') return;

        const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
        if (!AudioContextClass) return;

        try {
            const ctx = new AudioContextClass();

            switch (type) {
                case 'click':
                    await this.synthClick(ctx);
                    break;
                case 'softClick':
                    await this.synthSoftClick(ctx);
                    break;
                case 'transition':
                    await this.synthTransition(ctx);
                    break;
                case 'modalOpen':
                    await this.synthModalOpen(ctx);
                    break;
                case 'modalClose':
                    await this.synthModalClose(ctx);
                    break;
                case 'success':
                    await this.synthSuccess(ctx);
                    break;
                case 'notification':
                    await this.synthNotification(ctx);
                    break;
                case 'startup':
                    await this.synthStartup(ctx);
                    break;
                case 'unlock':
                    await this.synthUnlock(ctx);
                    break;
                case 'cosmic':
                    await this.synthCosmic(ctx);
                    break;
            }

            // 컨텍스트 정리 (지연 후)
            setTimeout(() => ctx.close(), 2000);
        } catch (error) {
            console.log('[SoundService] 사운드 합성 실패:', error);
        }
    }

    // 버튼 클릭 - 부드러운 크리스탈 톤
    private synthClick(ctx: AudioContext): void {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.frequency.setValueAtTime(880, ctx.currentTime); // A5
        osc.frequency.exponentialRampToValueAtTime(440, ctx.currentTime + 0.08);
        osc.type = 'sine';

        gain.gain.setValueAtTime(0.08, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.1);

        osc.start(ctx.currentTime);
        osc.stop(ctx.currentTime + 0.1);
    }

    // 부드러운 클릭 - 미세한 탭
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

    // 화면 전환 - 우주적 스위프
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

    // 모달 열림 - 상승하는 신비로운 톤
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

    // 모달 닫힘 - 하강하는 부드러운 톤
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
        const frequencies = [523.25, 659.25, 783.99]; // C5, E5, G5 (C Major chord)

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

    // 알림 - 부드러운 종소리
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

    // 앱 시작 - 우주적 기상
    private synthStartup(ctx: AudioContext): void {
        // 저음에서 시작해서 상승하는 패드 사운드
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

    // 미션 해금 - 마법 같은 반짝임
    private synthUnlock(ctx: AudioContext): void {
        // 반짝이는 연속 톤
        const notes = [523.25, 659.25, 783.99, 1046.5]; // C5, E5, G5, C6

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

    // 우주적 효과 - 깊은 앰비언트
    private synthCosmic(ctx: AudioContext): void {
        // 1. 저음 드론
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

        // 2. 고음 스파클
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

    // 리소스 정리
    async cleanup(): Promise<void> {
        if (this.audioContext) {
            await this.audioContext.close();
            this.audioContext = null;
        }
    }
}

// 싱글톤 인스턴스
export const soundService = new SoundService();
export default soundService;
