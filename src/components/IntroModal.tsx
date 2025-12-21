import React from 'react';
import { View, Modal, Text, StyleSheet } from 'react-native';
import GlassCard from './GlassCard';
import HolyButton from './HolyButton';
import { COLORS } from '../theme/theme';

interface IntroModalProps {
    visible: boolean;
    onClose: () => void;
    userName: string;
    userDeficit: string;
}

/**
 * IntroModal 컴포넌트
 * 사용자의 첫 방문 시 환영 메시지를 표시하는 모달
 */
const IntroModal: React.FC<IntroModalProps> = ({
    visible,
    onClose,
    userName,
    userDeficit
}) => {
    return (
        <Modal visible={visible} animationType="fade" transparent={true}>
            <View style={styles.modalOverlay}>
                <GlassCard style={styles.modalContent}>
                    <Text style={styles.introTitle}>환영합니다, {userName}님.</Text>
                    <Text style={styles.introText}>
                        당신의 결핍인 '{userDeficit}'을(를) 성장의 씨앗으로 삼아,{'\n'}
                        내면의 여행을 시작합니다.{'\n\n'}
                        매일 주어지는 미션을 수행하고{'\n'}
                        기록을 남겨주세요.{'\n\n'}
                        당신의 영혼을 돌보는 멘토 '오르빗'이 함께합니다.
                    </Text>
                    <HolyButton
                        title="여정 시작하기"
                        onPress={onClose}
                        style={{ marginTop: 30, width: '100%' }}
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
        color: '#aaa',
        fontSize: 16,
        lineHeight: 26,
        textAlign: 'center',
    },
});

export default IntroModal;
