import React from 'react';
import { View, StyleSheet, ViewStyle, StyleProp, Platform } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS, LAYOUT, SPACING } from '../theme/theme';

interface GlassCardProps {
    children: React.ReactNode;
    style?: StyleProp<ViewStyle>;
    variant?: 'default' | 'dark' | 'light' | 'cosmic';
}

const GlassCard: React.FC<GlassCardProps> = ({ children, style, variant = 'cosmic' }) => {
    // Use cosmic gradient background by default
    if (variant === 'cosmic') {
        return (
            <View style={[styles.card, style]}>
                <LinearGradient
                    colors={['rgba(26, 10, 46, 0.9)', 'rgba(15, 10, 30, 0.95)']}
                    style={StyleSheet.absoluteFillObject}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                />
                <View style={styles.overlay}>
                    {children}
                </View>
            </View>
        );
    }

    // Fallback for other variants
    let backgroundColor = COLORS.glass;
    if (variant === 'dark') backgroundColor = 'rgba(15, 10, 30, 0.6)';
    if (variant === 'light') backgroundColor = 'rgba(15, 10, 30, 0.4)';

    return (
        <View style={[styles.card, { backgroundColor }, style]}>
            {children}
        </View>
    );
};

const styles = StyleSheet.create({
    card: {
        borderRadius: LAYOUT.borderRadius.m,
        borderWidth: 1.5,
        borderColor: 'rgba(139, 92, 246, 0.4)',
        padding: SPACING.l,
        overflow: 'hidden',
        ...(Platform.OS === 'web'
            ? { boxShadow: '0 0 20px rgba(139, 92, 246, 0.3)' }
            : {
                shadowColor: '#8B5CF6',
                shadowOffset: { width: 0, height: 0 },
                shadowOpacity: 0.3,
                shadowRadius: 20,
            }
        ),
        elevation: 10,
    } as any,
    overlay: {
        flex: 1,
        padding: SPACING.m,
    },
});

export default GlassCard;
