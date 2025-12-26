import React from 'react';
import { View, StyleSheet, ViewStyle, StyleProp, ImageBackground, Platform } from 'react-native';
import { COLORS, LAYOUT, SPACING } from '../theme/theme';

// Cosmic card background image
const cosmicCardBg = require('../../assets/cosmic_card_bg_1766534124763.png');

interface GlassCardProps {
    children: React.ReactNode;
    style?: StyleProp<ViewStyle>;
    variant?: 'default' | 'dark' | 'light' | 'cosmic';
}

const GlassCard: React.FC<GlassCardProps> = ({ children, style, variant = 'cosmic' }) => {
    // Use cosmic image background by default
    if (variant === 'cosmic') {
        return (
            <ImageBackground
                source={cosmicCardBg}
                style={[styles.card, style]}
                imageStyle={styles.cardImage}
                resizeMode="cover"
            >
                <View style={styles.overlay}>
                    {children}
                </View>
            </ImageBackground>
        );
    }

    // Fallback for other variants
    let backgroundColor = COLORS.glass;
    if (variant === 'dark') backgroundColor = 'rgba(15, 10, 30, 0.6)'; // Darker cosmic purple
    if (variant === 'light') backgroundColor = 'rgba(15, 10, 30, 0.4)'; // Slight cosmic purple

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
    cardImage: {
        borderRadius: LAYOUT.borderRadius.m,
        opacity: 0.8,
    },
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(26, 10, 46, 0.4)', // More transparent for background visibility
        borderRadius: LAYOUT.borderRadius.m - 2,
        padding: SPACING.m,
        margin: -SPACING.l,
        paddingVertical: SPACING.l,
        paddingHorizontal: SPACING.l,
    },
});

export default GlassCard;
