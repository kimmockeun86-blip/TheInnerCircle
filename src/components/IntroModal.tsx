import React, { useState, useEffect } from 'react';
import { View, Modal, Text, StyleSheet, ActivityIndicator } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import GlassCard from './GlassCard';
import HolyButton from './HolyButton';
import { COLORS } from '../theme/theme';
import { api } from '../services/api';

interface IntroModalProps {
    visible: boolean;
    onClose: () => void;
    userName: string;
    userDeficit: string;
}

/**
 * IntroModal 컴포넌트
 * 사용자의 첫 방문 시 AI가 생성한 개인화된 환영 메시지를 표시하는 모달
 */
const IntroModal: React.FC<IntroModalProps> = ({
    visible,
    onClose,
    userName,
    userDeficit
}) => {
    const [aiWelcomeMessage, setAiWelcomeMessage] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        if (visible) {
            loadAiWelcomeMessage();
        }
    }, [visible]);

    const loadAiWelcomeMessage = async () => {
        setIsLoading(true);
        try {
            // 먼저 저장된 AI 분석 메시지 확인
            const savedAnalysis = await AsyncStorage.getItem('aiAnalysis');
            if (savedAnalysis) {
                setAiWelcomeMessage(savedAnalysis);
                setIsLoading(false);
                return;
            }

            // 저장된 메시지 없으면 API 호출로 생성
            const userAge = await AsyncStorage.getItem('userAge');
            const userJob = await AsyncStorage.getItem('userJob');
            const userGrowth = await AsyncStorage.getItem('userGrowth');
            const userComplex = await AsyncStorage.getItem('userComplex');
            const userIdealType = await AsyncStorage.getItem('userIdealType');
            const userHobbies = await AsyncStorage.getItem('userHobbies');
            const userGender = await AsyncStorage.getItem('userGender');

            const fullProfile = {
                name: userName,
                deficit: userDeficit,
                age: userAge || '',
                job: userJob || '',
                growth: userGrowth || '',
                complex: userComplex || '',
                idealType: userIdealType || '',
                hobbies: userHobbies || '',
                gender: userGender || ''
            };

            const result = await api.analyzeProfile(fullProfile);
            if (result.success && result.analysis) {
                setAiWelcomeMessage(result.analysis);
                await AsyncStorage.setItem('aiAnalysis', result.analysis);
            } else {
                // API 실패 시 기본 메시지 사용
                setAiWelcomeMessage(null);
            }
        } catch (e) {
            console.log('[IntroModal] AI 메시지 로드 실패:', e);
            setAiWelcomeMessage(null);
        } finally {
            setIsLoading(false);
        }
    };

    // 기본 메시지 (AI 실패 시 fallback) - 사용자 정보 활용
    const defaultMessage = `${userName}님, 당신의 결핍인 '${userDeficit}'을(를) 성장의 씨앗으로 삼아\n내면의 여행을 시작합니다.\n\n매일 주어지는 미션을 수행하고\n기록을 남겨주세요.\n\n당신의 영혼을 돌보는 멘토 '오르빗'이\n함께합니다.`;

    return (
        <Modal visible={visible} animationType="fade" transparent={true}>
            <View style={styles.modalOverlay}>
                <GlassCard style={styles.modalContent}>
                    <Text style={styles.introTitle}>환영합니다, {userName}님.</Text>

                    {isLoading ? (
                        <View style={styles.loadingContainer}>
                            <ActivityIndicator size="small" color={COLORS.gold} />
                            <Text style={styles.loadingText}>오르빗이 당신을 분석하고 있습니다...</Text>
                        </View>
                    ) : (
                        <Text style={styles.introText}>
                            {aiWelcomeMessage || defaultMessage}
                        </Text>
                    )}

                    <HolyButton
                        title="여정 시작하기"
                        onPress={onClose}
                        style={{ marginTop: 30, width: '100%' }}
                        disabled={isLoading}
                    />
                </GlassCard>
            </View>
        </Modal>
    );
};

const styles = StyleSheet.create({
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.85)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    modalContent: {
        width: '100%',
        maxWidth: 400,
        padding: 30,
        alignItems: 'center',
    },
    introTitle: {
        color: COLORS.gold,
        fontSize: 24,
        fontWeight: 'bold',
        marginBottom: 20,
        textAlign: 'center',
    },
    introText: {
        color: '#ccc',
        fontSize: 16,
        lineHeight: 26,
        textAlign: 'center',
    },
    loadingContainer: {
        alignItems: 'center',
        paddingVertical: 20,
    },
    loadingText: {
        color: '#888',
        fontSize: 14,
        marginTop: 15,
        fontStyle: 'italic',
    },
});

export default IntroModal;
