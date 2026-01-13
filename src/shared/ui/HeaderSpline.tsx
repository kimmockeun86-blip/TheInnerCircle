// HeaderSpline - ORBIT 로고 뒤 Spline 애니메이션
import React, { useState } from 'react';
import { View, StyleSheet, Platform, ActivityIndicator, Text } from 'react-native';
import { SPLINE_URLS, SPLINE_CONFIG } from '../config/splineConfig';

// Conditional import for native
let WebView: any;
if (Platform.OS !== 'web') {
    WebView = require('react-native-webview').WebView;
}

interface HeaderSplineProps {
    width?: number;
    height?: number;
    scale?: number;
}

const HeaderSpline: React.FC<HeaderSplineProps> = ({
    width = 200,
    height = 80,
    scale = SPLINE_CONFIG.HEADER_SCALE
}) => {
    const [isLoading, setIsLoading] = useState(true);
    const [hasError, setHasError] = useState(false);

    const htmlContent = `
        <!DOCTYPE html>
        <html>
        <head>
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <style>
                * { margin: 0; padding: 0; }
                html, body { 
                    width: 100%; 
                    height: 100%; 
                    overflow: hidden; 
                    background: transparent; 
                }
                spline-viewer { 
                    width: 100%; 
                    height: 100%; 
                    display: block; 
                    transform: scale(${scale}); 
                    transform-origin: center center; 
                }
            </style>
            <script type="module" src="${SPLINE_URLS.VIEWER_SCRIPT}"></script>
        </head>
        <body>
            <spline-viewer url="${SPLINE_URLS.HEADER_LOGO}"></spline-viewer>
        </body>
        </html>
    `;

    // 에러 시 대체 UI (빈 뷰)
    if (hasError) {
        return <View style={[styles.container, { width, height }]} />;
    }

    if (Platform.OS === 'web') {
        return (
            <View style={[styles.container, { width, height }]}>
                {isLoading && (
                    <View style={styles.loadingContainer}>
                        <ActivityIndicator size="small" color="#FF00FF" />
                    </View>
                )}
                <iframe
                    srcDoc={htmlContent}
                    style={{
                        width: '100%',
                        height: '100%',
                        border: 'none',
                        pointerEvents: 'none',
                        opacity: isLoading ? 0 : 1,
                    }}
                    title="Header Spline"
                    onLoad={() => setIsLoading(false)}
                />
            </View>
        );
    }

    // Native - WebView로 Spline 로드 (실제 빌드에서 작동)
    return (
        <View style={[styles.container, { width, height }]}>
            {isLoading && (
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="small" color="#FF00FF" />
                </View>
            )}
            <WebView
                originWhitelist={['*']}
                source={{ html: htmlContent }}
                style={[styles.webView, { opacity: isLoading ? 0 : 1 }]}
                javaScriptEnabled={true}
                domStorageEnabled={true}
                scrollEnabled={false}
                showsHorizontalScrollIndicator={false}
                showsVerticalScrollIndicator={false}
                bounces={false}
                allowsInlineMediaPlayback={true}
                onLoad={() => setIsLoading(false)}
                onError={() => {
                    setHasError(true);
                    setIsLoading(false);
                }}
            />
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        position: 'absolute',
        zIndex: 0,
        justifyContent: 'center',
        alignItems: 'center',
        overflow: 'hidden',
    },
    loadingContainer: {
        position: 'absolute',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 1,
    },
    webView: {
        width: '100%',
        height: '100%',
        backgroundColor: 'transparent',
    },
});

export default HeaderSpline;
