import React from 'react';
import { TouchableOpacity, Text, StyleSheet, ActivityIndicator, ViewStyle, TextStyle, StyleProp, Platform } from 'react-native';
import { COLORS, FONTS, LAYOUT, SPACING } from '../theme/theme';

interface HolyButtonProps {
    title: string;
    onPress: () => void;
    variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
    isLoading?: boolean;
    style?: StyleProp<ViewStyle>;
    textStyle?: StyleProp<TextStyle>;
    disabled?: boolean;
}

const HolyButton: React.FC<HolyButtonProps> = ({
    title,
    onPress,
    variant = 'primary',
    isLoading = false,
    style,
    textStyle,
    disabled = false
}) => {

    const getButtonStyle = () => {
        switch (variant) {
            case 'primary':
                return styles.primary;
            case 'secondary':
                return styles.secondary;
            case 'outline':
                return styles.outline;
            case 'ghost':
                return styles.ghost;
            default:
                return styles.primary;
        }
    };

    const getTextStyle = () => {
        switch (variant) {
            case 'primary':
                return styles.textPrimary;
            case 'secondary':
                return styles.textSecondary;
            case 'outline':
                return styles.textOutline;
            case 'ghost':
                return styles.textGhost;
            default:
                return styles.textPrimary;
        }
    };

    return (
        <TouchableOpacity
            style={[
                styles.base,
                getButtonStyle(),
                disabled && styles.disabled,
                style
            ]}
            onPress={onPress}
            disabled={disabled || isLoading}
            activeOpacity={0.8}
        >
            {isLoading ? (
                <ActivityIndicator color={variant === 'primary' ? COLORS.textDark : COLORS.gold} />
            ) : (
                <Text style={[styles.textBase, getTextStyle(), textStyle]}>{title}</Text>
            )}
        </TouchableOpacity>
    );
};

const styles = StyleSheet.create({
    base: {
        paddingVertical: SPACING.m,
        paddingHorizontal: SPACING.xl,
        borderRadius: LAYOUT.borderRadius.l,
        alignItems: 'center',
        justifyContent: 'center',
        minWidth: 120,
    },
    disabled: {
        opacity: 0.5,
    },
    textBase: {
        fontSize: FONTS.size.body,
        fontWeight: '600' as any, // Type assertion for RN font weight
        letterSpacing: 1,
    },

    // Variants - Using web-compatible boxShadow for web, native shadow for mobile
    primary: {
        backgroundColor: 'transparent',
        borderWidth: 1.5,
        borderColor: 'rgba(255, 255, 255, 0.6)',
        ...(Platform.OS === 'web'
            ? { boxShadow: '0 0 15px rgba(255, 255, 255, 0.4)' }
            : {
                shadowColor: '#FFFFFF',
                shadowOffset: { width: 0, height: 0 },
                shadowOpacity: 0.4,
                shadowRadius: 15,
            }
        ),
        elevation: 8,
    } as any,
    textPrimary: {
        color: '#FFFFFF',
        fontWeight: 'bold' as any,
        ...(Platform.OS === 'web'
            ? { textShadow: '0 0 8px rgba(255, 255, 255, 0.5)' }
            : {
                textShadowColor: 'rgba(255, 255, 255, 0.5)',
                textShadowOffset: { width: 0, height: 0 },
                textShadowRadius: 8,
            }
        ),
    } as any,

    secondary: {
        backgroundColor: 'rgba(255, 255, 255, 0.1)',
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.2)',
    },
    textSecondary: {
        color: COLORS.textMain,
    },

    outline: {
        backgroundColor: 'transparent',
        borderWidth: 1.5,
        borderColor: 'rgba(255, 255, 255, 0.7)',
        ...(Platform.OS === 'web'
            ? { boxShadow: '0 0 12px rgba(255, 255, 255, 0.5)' }
            : {
                shadowColor: '#FFFFFF',
                shadowOffset: { width: 0, height: 0 },
                shadowOpacity: 0.5,
                shadowRadius: 12,
            }
        ),
        elevation: 6,
    } as any,
    textOutline: {
        color: '#FFFFFF',
        ...(Platform.OS === 'web'
            ? { textShadow: '0 0 8px rgba(255, 255, 255, 0.6)' }
            : {
                textShadowColor: 'rgba(255, 255, 255, 0.6)',
                textShadowOffset: { width: 0, height: 0 },
                textShadowRadius: 8,
            }
        ),
    } as any,

    ghost: {
        backgroundColor: 'transparent',
    },
    textGhost: {
        color: COLORS.textDim,
        textDecorationLine: 'underline',
        fontSize: FONTS.size.caption,
    },
});

export default HolyButton;
