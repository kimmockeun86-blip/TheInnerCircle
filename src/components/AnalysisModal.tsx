import React from 'react';
import { View, Modal, Text, ScrollView, StyleSheet } from 'react-native';
import GlassCard from './GlassCard';
import HolyButton from './HolyButton';
import { COLORS } from '../theme/theme';

interface AnalysisModalProps {
    visible: boolean;
    onClose: () => void;
    feedback: string | null;
    title?: string;
}

/**
 * AnalysisModal 컴포넌트
 * AI 분석 결과(오르빗의 시그널)를 표시하는 모달
 */
const AnalysisModal: React.FC<AnalysisModalProps> = ({
    visible,
    onClose,
    feedback,
    title = "오르빗의 시그널"
}) => {
    return (
        <Modal visible={visible} animationType="fade" transparent={true}>
            <View style={styles.modalOverlay}>
                <GlassCard style={styles.modalContent}>
                    <Text style={styles.modalTitle}>{title}</Text>
                    <ScrollView style={{ maxHeight: 300 }}>
                        <Text style={styles.feedbackText}>
                            {feedback || "분석 결과를 불러오는 중..."}
                        </Text>
                    </ScrollView>

                    <HolyButton
                        title="확인"
                        onPress={onClose}
                        style={{ marginTop: 20, width: '100%' }}
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
        padding: 25,
        alignItems: 'center',
    },
    modalTitle: {
        color: COLORS.gold,
        fontSize: 24,
        fontWeight: 'bold',
        marginBottom: 20,
        textAlign: 'center',
    },
    feedbackText: {
        color: '#fff',
        fontSize: 16,
        lineHeight: 26,
        textAlign: 'center',
    },
});

export default AnalysisModal;
