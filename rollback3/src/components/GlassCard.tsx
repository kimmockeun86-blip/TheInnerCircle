import React from 'react';
import { View, StyleSheet, ViewStyle, StyleProp } from 'react-native';
import { COLORS, LAYOUT, SPACING } from '../theme/theme';

interface GlassCardProps {
    children: React.ReactNode;
    style?: StyleProp<ViewStyle>;
    variant?: 'default' | 'dark' | 'light';
}

const GlassCard: React.FC<GlassCardProps> = ({ children, style, variant = 'default' }) => {
    let backgroundColor = COLORS.glass;

    if (variant === 'dark') backgroundColor = 'rgba(0, 0, 0, 0.4)';
    if (variant === 'light') backgroundColor = 'rgba(255, 255, 255, 0.08)';

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
        borderColor: COLORS.glassBorder,
        padding: SPACING.l,
        overflow: 'hidden',
        // Backdrop filter is not supported natively in RN without Expo BlurView, 
        // but we simulate the look with semi-transparent bg and border.
        // For real blur, we would wrap this in <BlurView> from expo-blur.
    },
});

export default GlassCard;
