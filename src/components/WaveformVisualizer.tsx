import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated, Easing } from 'react-native';
import Svg, { Path, Defs, LinearGradient, Stop } from 'react-native-svg';

const AnimatedPath = Animated.createAnimatedComponent(Path);

interface WaveformVisualizerProps {
    isActive?: boolean;
    mode?: 'listening' | 'thinking' | 'speaking';
    height?: number;
    width?: number;
}

const WaveformVisualizer: React.FC<WaveformVisualizerProps> = ({
    isActive = true,
    mode = 'listening',
    height = 300,
    width = 400
}) => {
    const phase = useRef(new Animated.Value(0)).current;
    const amplitude = useRef(new Animated.Value(0.5)).current;

    useEffect(() => {
        if (!isActive) return;

        // Continuous phase animation for wave movement
        const phaseAnim = Animated.loop(
            Animated.timing(phase, {
                toValue: 1,
                duration: 2000,
                easing: Easing.linear,
                useNativeDriver: true,
            })
        );
        phaseAnim.start();

        return () => phaseAnim.stop();
    }, [isActive]);

    useEffect(() => {
        // Amplitude animation based on mode
        let ampAnim;

        if (!isActive) {
            Animated.timing(amplitude, {
                toValue: 0.1,
                duration: 500,
                useNativeDriver: true,
            }).start();
            return;
        }

        switch (mode) {
            case 'thinking':
                // Rapid, small, jittery waves
                ampAnim = Animated.loop(
                    Animated.sequence([
                        Animated.timing(amplitude, { toValue: 0.3, duration: 100, useNativeDriver: true }),
                        Animated.timing(amplitude, { toValue: 0.5, duration: 150, useNativeDriver: true }),
                        Animated.timing(amplitude, { toValue: 0.2, duration: 100, useNativeDriver: true }),
                        Animated.timing(amplitude, { toValue: 0.4, duration: 120, useNativeDriver: true }),
                    ])
                );
                break;
            case 'speaking':
                // Large, smooth, breathing waves
                ampAnim = Animated.loop(
                    Animated.sequence([
                        Animated.timing(amplitude, { toValue: 1.2, duration: 800, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
                        Animated.timing(amplitude, { toValue: 0.6, duration: 800, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
                    ])
                );
                break;
            case 'listening':
            default:
                // Gentle, idle waves - Increased amplitude to be more visible
                ampAnim = Animated.loop(
                    Animated.sequence([
                        Animated.timing(amplitude, { toValue: 0.8, duration: 1500, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
                        Animated.timing(amplitude, { toValue: 0.5, duration: 1500, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
                    ])
                );
                break;
        }

        ampAnim.start();

        return () => ampAnim.stop();
    }, [mode, isActive]);

    // We need to use a functional component for the path data to animate it via props if possible,
    // but since SVG Path d is a string, we usually animate a value and interpolate it.
    // However, complex wave math in JS thread + setNativeProps is better for performance, 
    // or just simple interpolation of a few control points.
    // For simplicity and "Her" look (smooth sine), we can try a simple scaling approach or a pre-calculated path interpolation.

    // A better approach for "Her" style is a single line that looks like a voice wave.
    // Since we can't easily animate the `d` string with native driver, we will use a trick:
    // Animate the scaleY of the view containing the wave, or use a Lottie file.
    // But here we will use a static path that looks good and animate its container or stroke width/opacity?
    // No, the user wants the wave to MOVE.

    // Let's try animating the `d` prop using a listener if performance allows, or just use a simple transform.
    // Actually, for a "Her" wave, it's often just a few sine waves.
    // Let's use a simpler approach: Animate the ScaleY of a static sine wave for amplitude, 
    // and TranslateX for phase? No, TranslateX works for moving wave.

    // Let's create a wider wave and translate it.

    const translateX = phase.interpolate({
        inputRange: [0, 1],
        outputRange: [0, -width] // Move by one width
    });

    // Create a long sine wave path (2x width)
    const createStaticWavePath = () => {
        const points = [];
        const segments = 100;
        const waveWidth = width;
        const midY = height / 2;

        // We create 2 cycles so we can loop
        for (let i = 0; i <= segments * 2; i++) {
            const x = (waveWidth / segments) * i;
            const normalizedX = (i % segments) / segments; // 0 to 1
            // Envelope to taper ends? No, "Her" wave is often continuous or tapered at edges.
            // Let's make it continuous.
            const y = midY + Math.sin(normalizedX * Math.PI * 2) * (height * 0.3);
            points.push(`${x},${y}`);
        }
        // Smooth curve
        return `M ${points[0]} L ${points.join(' ')}`;
    };

    // To truly match "Her", it's often a single line that modulates.
    // Let's use a simple path and animate ScaleY.

    return (
        <View style={[styles.container, { height, width }]}>
            <Svg height={height} width={width * 2} style={{ position: 'absolute', left: 0 }}>
                <Defs>
                    <LinearGradient id="goldGrad" x1="0" y1="0" x2="0" y2="1">
                        <Stop offset="0" stopColor="#FFD700" stopOpacity="0.1" />
                        <Stop offset="0.5" stopColor="#FFD700" stopOpacity="1" />
                        <Stop offset="1" stopColor="#FFD700" stopOpacity="0.1" />
                    </LinearGradient>
                </Defs>

                <Animated.View style={{
                    transform: [
                        { translateX },
                        { scaleY: amplitude } // Animate amplitude
                    ],
                    width: width * 2,
                    height: height
                }}>
                    <Svg height={height} width={width * 2}>
                        <Path
                            d={createStaticWavePath()}
                            stroke="url(#goldGrad)"
                            strokeWidth="3"
                            fill="none"
                            strokeLinecap="round"
                        />
                    </Svg>
                </Animated.View>
            </Svg>

            {/* Center Glow */}
            <Animated.View style={[styles.glow, {
                opacity: amplitude,
                transform: [{ scale: amplitude }]
            }]} />
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        justifyContent: 'center',
        alignItems: 'center',
        overflow: 'hidden',
    },
    glow: {
        position: 'absolute',
        width: 50,
        height: 50,
        borderRadius: 25,
        backgroundColor: '#FFD700',
        opacity: 0.3,
        shadowColor: '#FFD700',
        shadowRadius: 20,
        shadowOpacity: 0.5,
        elevation: 10
    }
});

export default WaveformVisualizer;
