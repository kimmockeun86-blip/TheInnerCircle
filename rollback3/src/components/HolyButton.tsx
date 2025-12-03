import React from 'react';
import { TouchableOpacity, Text, StyleSheet, ActivityIndicator, ViewStyle, TextStyle, StyleProp } from 'react-native';
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

    // Variants
    primary: {
        backgroundColor: COLORS.gold,
        shadowColor: COLORS.gold,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.5,
        shadowRadius: 10,
        elevation: 8,
    },
    textPrimary: {
        color: COLORS.textDark,
        fontWeight: 'bold' as any,
    },

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
        borderColor: COLORS.gold,
    },
    textOutline: {
        color: COLORS.gold,
    },

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
