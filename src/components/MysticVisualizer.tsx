// MysticVisualizer - Spline 배경 애니메이션 (개선 버전)
import React, { useRef, useEffect, useState } from 'react';
import { View, StyleSheet, Animated, Platform, ActivityIndicator, Text } from 'react-native';
import { COLORS } from '../theme/theme';
import { SPLINE_URLS, SPLINE_CONFIG } from '../config/splineConfig';

// Conditional imports for native only
let WebView: any;
let LinearGradient: any;
if (Platform.OS !== 'web') {
    WebView = require('react-native-webview').WebView;
    LinearGradient = require('expo-linear-gradient').LinearGradient;
}

interface MysticVisualizerProps {
    isActive?: boolean;
    mode?: 'listening' | 'speaking' | 'thinking';
    sceneUrl?: string;
    style?: object;
    showLoading?: boolean;
}

const MysticVisualizer: React.FC<MysticVisualizerProps> = ({
    isActive = true,
    mode = 'listening',
    sceneUrl,
    style = {},
    showLoading = false,
}) => {
    const fadeAnim = useRef(new Animated.Value(0)).current;
    const [isLoading, setIsLoading] = useState(true);
    const [hasError, setHasError] = useState(false);

    useEffect(() => {
        Animated.timing(fadeAnim, {
            toValue: 1,
            duration: SPLINE_CONFIG.FADE_DURATION,
            useNativeDriver: Platform.OS !== 'web',
        }).start();
    }, []);

    // Timeout for loading
    useEffect(() => {
        const timeout = setTimeout(() => {
            if (isLoading) {
                setIsLoading(false);
            }
        }, SPLINE_CONFIG.LOADING_TIMEOUT);
        return () => clearTimeout(timeout);
    }, [isLoading]);

    const SCENE_URL = sceneUrl || SPLINE_URLS.MAIN_BACKGROUND;

    const htmlContent = `
        <!DOCTYPE html>
        <html>
        <head>
            <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
            <style>
                * { margin: 0; padding: 0; box-sizing: border-box; }
                html, body { 
                    width: 100%; 
                    height: 100%; 
                    overflow: hidden; 
                    background: transparent !important;
                }
                spline-viewer { 
                    width: 100% !important; 
                    height: 100% !important; 
                    display: block !important;
                    background: transparent !important;
                }
            </style>
            <script type="module" src="${SPLINE_URLS.VIEWER_SCRIPT}"></script>
        </head>
        <body>
            <spline-viewer url="${SCENE_URL}"></spline-viewer>
        </body>
        </html>
    `;

    // 로딩 인디케이터
    const LoadingIndicator = () => (
        showLoading && isLoading ? (
            <View style={styles.loadingOverlay}>
                <ActivityIndicator size="large" color="#FF00FF" />
                <Text style={styles.loadingText}>애니메이션 로딩 중...</Text>
            </View>
        ) : null
    );

    // 에러 시 대체 배경
    if (hasError) {
        return (
            <View style={[styles.container, style, { backgroundColor: COLORS.background }]}>
                <View style={styles.errorFallback} />
            </View>
        );
    }

    // Web: Use regular View instead of LinearGradient
    if (Platform.OS === 'web') {
        return (
            <View
                style={[
                    styles.container,
                    style,
                    {
                        pointerEvents: 'none',
                        background: `linear-gradient(180deg, ${COLORS.backgroundGradient[0]}, ${COLORS.backgroundGradient[1] || COLORS.backgroundGradient[0]})`
                    }
                ]}
            >
                <LoadingIndicator />
                <Animated.View style={[styles.webViewContainer, { opacity: fadeAnim, pointerEvents: 'none' }]}>
                    <iframe
                        srcDoc={htmlContent}
                        style={{ width: '100%', height: '100%', border: 'none', pointerEvents: 'none' }}
                        title="Mystic Visualizer"
                        onLoad={() => setIsLoading(false)}
                    />
                </Animated.View>
            </View>
        );
    }

    // Native: Use LinearGradient
    return (
        <LinearGradient
            colors={COLORS.backgroundGradient}
            style={[styles.container, style, { pointerEvents: 'none' }]}
        >
            <LoadingIndicator />
            <Animated.View style={[styles.webViewContainer, { opacity: fadeAnim, pointerEvents: 'none' }]}>
                <WebView
                    originWhitelist={['*']}
                    source={{ html: htmlContent }}
                    style={styles.webView}
                    javaScriptEnabled={true}
                    domStorageEnabled={true}
                    scrollEnabled={false}
                    scalesPageToFit={true}
                    showsHorizontalScrollIndicator={false}
                    showsVerticalScrollIndicator={false}
                    bounces={false}
                    mixedContentMode="always"
                    allowsInlineMediaPlayback={true}
                    mediaPlaybackRequiresUserAction={false}
                    androidHardwareAccelerationDisabled={false}
                    androidLayerType="hardware"
                    cacheEnabled={true}
                    incognito={false}
                    thirdPartyCookiesEnabled={true}
                    sharedCookiesEnabled={true}
                    onError={(syntheticEvent: any) => {
                        const { nativeEvent } = syntheticEvent;
                        console.warn('[MysticVisualizer] WebView error:', nativeEvent);
                        setHasError(true);
                        setIsLoading(false);
                    }}
                    onLoad={() => {
                        console.log('[MysticVisualizer] Spline scene loaded successfully');
                        setIsLoading(false);
                    }}
                />
            </Animated.View>
        </LinearGradient>
    );
};

const styles = StyleSheet.create({
    container: {
        ...StyleSheet.absoluteFillObject,
    },
    webViewContainer: {
        flex: 1,
    },
    webView: {
        flex: 1,
        backgroundColor: 'transparent',
    },
    loadingOverlay: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 10,
    },
    loadingText: {
        color: '#fff',
        fontSize: 12,
        marginTop: 10,
        opacity: 0.7,
    },
    errorFallback: {
        flex: 1,
    },
});

export default MysticVisualizer;
