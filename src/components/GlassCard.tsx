import React from 'react';
import { View, StyleSheet, ViewStyle, StyleProp, Platform } from 'react-native';
import { COLORS, LAYOUT, SPACING } from '../theme/theme';

interface GlassCardProps {
    children: React.ReactNode;
    style?: StyleProp<ViewStyle>;
    variant?: 'default' | 'dark' | 'light' | 'cosmic';
}

const GlassCard: React.FC<GlassCardProps> = ({ children, style, variant = 'cosmic' }) => {
    // 70% 불투명 검정 배경
    let backgroundColor = 'rgba(0, 0, 0, 0.7)';

    if (variant === 'dark') backgroundColor = 'rgba(0, 0, 0, 0.8)';
    if (variant === 'light') backgroundColor = 'rgba(0, 0, 0, 0.5)';
    if (variant === 'default') backgroundColor = 'rgba(0, 0, 0, 0.7)';

    return (
        <View style={[styles.card, { backgroundColor }, style]}>
            {children}
        </View>
    );
};

const styles = StyleSheet.create({
    card: {
        borderRadius: LAYOUT.borderRadius.m,
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.25)', // 흰색 테두리
        padding: SPACING.l,
        overflow: 'hidden',
        ...(Platform.OS === 'web'
            ? { boxShadow: '0 0 8px rgba(255, 255, 255, 0.1)' }
            : {
                // Android에서 elevation을 쓰면 투명 배경이 안 됨
                // iOS만 shadow 사용
                ...(Platform.OS === 'ios' && {
                    shadowColor: '#FFFFFF',
                    shadowOffset: { width: 0, height: 0 },
                    shadowOpacity: 0.15,
                    shadowRadius: 10,
                }),
            }
        ),
        // elevation 제거 - Android에서 투명 배경과 충돌
    } as any,
});

export default GlassCard;

