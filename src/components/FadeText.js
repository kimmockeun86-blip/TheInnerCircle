import React, { useEffect } from 'react';
import { Text, StyleSheet } from 'react-native';
import Animated, {
    useSharedValue,
    useAnimatedStyle,
    withTiming,
    withDelay
} from 'react-native-reanimated';

const FadeText = ({ children, delay = 0, style }) => {
    const opacity = useSharedValue(0);

    useEffect(() => {
        opacity.value = withDelay(delay, withTiming(1, { duration: 1000 }));
    }, [delay]);

    const animatedStyle = useAnimatedStyle(() => {
        return {
            opacity: opacity.value,
        };
    });

    return (
        <Animated.Text style={[styles.text, style, animatedStyle]}>
            {children}
        </Animated.Text>
    );
};

const styles = StyleSheet.create({
    text: {
        fontSize: 18,
        color: '#F0F0F0', // Off-white default
        textAlign: 'center',
        marginVertical: 10,
    },
});

export default FadeText;
