// SpecialMissionIntroScreen.tsx - 오르빗 안내 연출 (매칭 시작)
import React, { useState, useEffect, useRef } from 'react';
import {
    View,
    Text,
    StyleSheet,
    Animated,
    SafeAreaView,
    StatusBar,
    Platform,
    TouchableWithoutFeedback,
    Image,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS } from '../theme/theme';
import MysticVisualizer from '../components/MysticVisualizer';
import HolyButton from '../components/HolyButton';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../types/navigation';

const cosmicBackground = require('../../assets/cosmic_background.png');

type SpecialMissionIntroScreenNavigationProp = StackNavigationProp<RootStackParamList>;

// 오르빗 안내 스크립트
const introScripts = [
    {
        text: "지난 시간동안의\n당신의 데이터를 분석했습니다",
        autoAdvance: true,
    },
    {
        text: "많은 사용자 중\n당신의 파장과\n98.7% 일치하는\n단 한 사람을 발견했습니다.",
        autoAdvance: true,
    },
    {
        text: "상대방에게 편지를 써보세요.\n편지는 단 한번만\n보낼 수 있습니다",
        autoAdvance: true,
    },
    {
        text: "저는 항상 당신과 함께합니다",
        buttonText: "편지 쓰기",
        autoAdvance: false,
    },
];

const SpecialMissionIntroScreen: React.FC = () => {
    const navigation = useNavigation<SpecialMissionIntroScreenNavigationProp>();
    const [currentIndex, setCurrentIndex] = useState(0);
    const [displayedText, setDisplayedText] = useState('');
    const [isTyping, setIsTyping] = useState(false);
    const [visualizerKey, setVisualizerKey] = useState(0);

    const textFadeAnim = useRef(new Animated.Value(0)).current;
    const typingTimerRef = useRef<NodeJS.Timeout | null>(null);
    const autoAdvanceTimerRef = useRef<NodeJS.Timeout | null>(null);

    const currentScript = introScripts[currentIndex];

    useEffect(() => {
        // 스크립트 전환 시 초기화
        setDisplayedText('');
        setIsTyping(true);
        textFadeAnim.setValue(0);

        // 페이드 인 애니메이션
        Animated.timing(textFadeAnim, {
            toValue: 1,
            duration: 1000,
            useNativeDriver: Platform.OS !== 'web',
        }).start();

        // 타이핑 효과
        const fullText = currentScript.text;
        let charIndex = 0;

        const typeNextChar = () => {
            if (charIndex < fullText.length) {
                setDisplayedText(fullText.substring(0, charIndex + 1));
                charIndex++;
                typingTimerRef.current = setTimeout(typeNextChar, 80); // 80ms 간격
            } else {
                setIsTyping(false);
                // 자동 진행이면 읽는 시간 후 다음으로
                if (currentScript.autoAdvance) {
                    const readTime = 1500 + (fullText.length * 50);
                    autoAdvanceTimerRef.current = setTimeout(() => {
                        handleNext();
                    }, readTime);
                }
            }
        };

        typingTimerRef.current = setTimeout(typeNextChar, 500);

        return () => {
            if (typingTimerRef.current) clearTimeout(typingTimerRef.current);
            if (autoAdvanceTimerRef.current) clearTimeout(autoAdvanceTimerRef.current);
        };
    }, [currentIndex]);

    const handleNext = async () => {
        if (typingTimerRef.current) clearTimeout(typingTimerRef.current);
        if (autoAdvanceTimerRef.current) clearTimeout(autoAdvanceTimerRef.current);
        setIsTyping(false);

        if (currentIndex < introScripts.length - 1) {
            setCurrentIndex(prev => prev + 1);
            setVisualizerKey(prev => prev + 1);
        } else {
            // 마지막 스크립트 완료 - 편지 모달 열기 플래그 설정 후 홈으로 이동
            await AsyncStorage.setItem('specialMissionIntroSeen', 'true');
            await AsyncStorage.setItem('openLetterModal', 'true'); // 편지 모달 자동 열림 플래그
            navigation.navigate('MainTabs' as any); // 홈으로 이동
        }
    };

    const handleScreenTap = () => {
        // 타이핑 중이면 즉시 완료
        if (isTyping) {
            if (typingTimerRef.current) clearTimeout(typingTimerRef.current);
            setDisplayedText(currentScript.text);
            setIsTyping(false);

            // 자동 진행이면 타이머 설정
            if (currentScript.autoAdvance) {
                autoAdvanceTimerRef.current = setTimeout(() => {
                    handleNext();
                }, 1500);
            }
        } else if (currentScript.autoAdvance) {
            // 버튼 없는 화면이면 다음으로
            handleNext();
        }
    };

    return (
        <TouchableWithoutFeedback onPress={handleScreenTap}>
            <View style={styles.container}>
                <StatusBar barStyle="light-content" backgroundColor={COLORS.background} />
                <LinearGradient
                    colors={['#0f0a1e', '#1a0a2e', '#0f0a1e']}
                    style={StyleSheet.absoluteFillObject}
                />
                {/* Cosmic Background Image (나노바나나 제작) */}
                <Image
                    source={cosmicBackground}
                    style={styles.cosmicBackground}
                    resizeMode="cover"
                />
                <View style={styles.visualizerBackground}>
                    <MysticVisualizer
                        isActive={true}
                        mode="speaking"
                        sceneUrl="https://prod.spline.design/gjz7s8UmZl4fmUa7/scene.splinecode"
                    />
                </View>

                <SafeAreaView style={styles.safeArea}>
                    <View style={styles.contentContainer}>
                        <Animated.View style={{ opacity: textFadeAnim, width: '100%', alignItems: 'center', paddingHorizontal: 30 }}>
                            <Text style={styles.orbitText}>
                                {displayedText}
                            </Text>
                        </Animated.View>

                        {/* 버튼 (마지막 스크립트에서만) */}
                        {currentScript.buttonText && !isTyping && (
                            <View style={styles.buttonContainer}>
                                <HolyButton
                                    title={currentScript.buttonText}
                                    onPress={handleNext}
                                    style={{ marginTop: 30, width: '80%' }}
                                />
                            </View>
                        )}
                    </View>
                </SafeAreaView>
            </View>
        </TouchableWithoutFeedback>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: COLORS.background,
    },
    cosmicBackground: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        width: '100%',
        height: '100%',
        zIndex: 0,
    },
    visualizerBackground: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: 1,
        opacity: 0.6,
    },
    safeArea: {
        flex: 1,
        zIndex: 10,
    },
    contentContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        width: '100%',
    },
    orbitText: {
        color: '#FFF',
        fontSize: 22,
        fontWeight: '600',
        textAlign: 'center',
        lineHeight: 34,
        letterSpacing: 0.5,
        ...(Platform.OS === 'web'
            ? { textShadow: '0 0 15px rgba(255, 255, 255, 0.8)' }
            : {
                textShadowColor: 'rgba(255, 255, 255, 0.8)',
                textShadowOffset: { width: 0, height: 0 },
                textShadowRadius: 15,
            }
        ),
    } as any,
    buttonContainer: {
        position: 'absolute',
        bottom: 100,
        width: '100%',
        alignItems: 'center',
    },
});

export default SpecialMissionIntroScreen;
