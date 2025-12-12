// Loading Overlay Component
import React from 'react';
import { View, Text, ActivityIndicator, StyleSheet, Modal } from 'react-native';
import { COLORS } from '../theme/theme';

interface LoadingOverlayProps {
    visible: boolean;
    message?: string;
    subMessage?: string;
}

const LoadingOverlay: React.FC<LoadingOverlayProps> = ({
    visible,
    message = '잠시만 기다려주세요...',
    subMessage
}) => {
    if (!visible) return null;

    return (
        <Modal transparent animationType="fade" visible={visible}>
            <View style={styles.overlay}>
                <View style={styles.container}>
                    <ActivityIndicator size="large" color={COLORS.gold} />
                    <Text style={styles.message}>{message}</Text>
                    {subMessage && <Text style={styles.subMessage}>{subMessage}</Text>}
                </View>
            </View>
        </Modal>
    );
};

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 32, 0.9)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    container: {
        padding: 30,
        borderRadius: 20,
        backgroundColor: 'rgba(255, 255, 255, 0.05)',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: 'rgba(255, 215, 0, 0.2)',
    },
    message: {
        color: COLORS.gold,
        fontSize: 16,
        fontWeight: '600',
        marginTop: 20,
        textAlign: 'center',
    },
    subMessage: {
        color: 'rgba(255, 255, 255, 0.6)',
        fontSize: 14,
        marginTop: 10,
        textAlign: 'center',
    },
});

export default LoadingOverlay;
