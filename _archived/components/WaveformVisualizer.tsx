import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated, Easing, Platform } from 'react-native';
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
    const useNativeDriverValue = Platform.OS !== 'web';

    useEffect(() => {
        if (!isActive) return;

        // Continuous phase animation for wave movement
        const phaseAnim = Animated.loop(
            Animated.timing(phase, {
                toValue: 1,
                duration: 2000,
                easing: Easing.linear,
                useNativeDriver: useNativeDriverValue,
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
                useNativeDriver: useNativeDriverValue,
            }).start();
            return;
        }

        switch (mode) {
            case 'thinking':
                // Rapid, small, jittery waves
                ampAnim = Animated.loop(
                    Animated.sequence([
                        Animated.timing(amplitude, { toValue: 0.3, duration: 100, useNativeDriver: useNativeDriverValue }),
                        Animated.timing(amplitude, { toValue: 0.5, duration: 150, useNativeDriver: useNativeDriverValue }),
                        Animated.timing(amplitude, { toValue: 0.2, duration: 100, useNativeDriver: useNativeDriverValue }),
                        Animated.timing(amplitude, { toValue: 0.4, duration: 120, useNativeDriver: useNativeDriverValue }),
                    ])
                );
                break;
            case 'speaking':
                // Large, smooth, breathing waves
                ampAnim = Animated.loop(
                    Animated.sequence([
                        Animated.timing(amplitude, { toValue: 1.2, duration: 800, easing: Easing.inOut(Easing.sin), useNativeDriver: useNativeDriverValue }),
                        Animated.timing(amplitude, { toValue: 0.6, duration: 800, easing: Easing.inOut(Easing.sin), useNativeDriver: useNativeDriverValue }),
                    ])
                );
                break;
            case 'listening':
            default:
                // Gentle, idle waves - Increased amplitude to be more visible
                ampAnim = Animated.loop(
                    Animated.sequence([
                        Animated.timing(amplitude, { toValue: 0.8, duration: 1500, easing: Easing.inOut(Easing.sin), useNativeDriver: useNativeDriverValue }),
                        Animated.timing(amplitude, { toValue: 0.5, duration: 1500, easing: Easing.inOut(Easing.sin), useNativeDriver: useNativeDriverValue }),
                    ])
                );
                break;
        }

        ampAnim.start();

        return () => ampAnim.stop();
    }, [mode, isActive]);

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
            const y = midY + Math.sin(normalizedX * Math.PI * 2) * (height * 0.3);
            points.push(`${x},${y}`);
        }
        // Smooth curve
        return `M ${points[0]} L ${points.join(' ')}`;
    };

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
        ...(Platform.OS === 'web'
            ? { boxShadow: '0 0 20px rgba(255, 215, 0, 0.5)' }
            : {
                shadowColor: '#FFD700',
                shadowRadius: 20,
                shadowOpacity: 0.5,
            }
        ),
        elevation: 10
    } as any
});

export default WaveformVisualizer;
