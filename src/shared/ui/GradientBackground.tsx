// GradientBackground - Web-compatible wrapper for LinearGradient
import React from 'react';
import { View, StyleSheet, Platform, ViewStyle, StyleProp } from 'react-native';
import { COLORS } from '../theme/theme';

// Conditionally import LinearGradient for native only
let LinearGradient: any = null;
if (Platform.OS !== 'web') {
    LinearGradient = require('expo-linear-gradient').LinearGradient;
}

interface GradientBackgroundProps {
    children: React.ReactNode;
    colors?: string[];
    style?: StyleProp<ViewStyle>;
}

const GradientBackground: React.FC<GradientBackgroundProps> = ({
    children,
    colors = COLORS.backgroundGradient,
    style
}) => {
    // Web: Use regular View with CSS gradient to avoid pointerEvents warning
    if (Platform.OS === 'web') {
        const gradientColors = colors as string[];
        const cssGradient = `linear-gradient(180deg, ${gradientColors[0]}, ${gradientColors[1] || gradientColors[0]})`;

        return (
            <View style={[styles.container, style, { background: cssGradient }] as any}>
                {children}
            </View>
        );
    }

    // Native: Use LinearGradient
    return (
        <LinearGradient
            colors={colors as any}
            style={[styles.container, style]}
        >
            {children}
        </LinearGradient>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
});

export default GradientBackground;
