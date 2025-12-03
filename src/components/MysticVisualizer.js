// Spline Animation with improved WebView configuration
import React, { useRef, useEffect } from 'react';
import { View, StyleSheet, Animated, Platform } from 'react-native';
// import { WebView } from 'react-native-webview';
let WebView;
if (Platform.OS !== 'web') {
  WebView = require('react-native-webview').WebView;
}
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS } from '../theme/theme';

const MysticVisualizer = ({ isActive = true, mode = 'listening', sceneUrl, style = {} }) => {
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 3000,
      useNativeDriver: true,
    }).start();
  }, []);

  const SPLINE_SCENE_URL = sceneUrl || 'https://prod.spline.design/jYIOKYyzTpgISC0I/scene.splinecode';

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
        <script type="module" src="https://unpkg.com/@splinetool/viewer@1.9.59/build/spline-viewer.js"></script>
      </head>
      <body>
        <spline-viewer url="${SPLINE_SCENE_URL}"></spline-viewer>
      </body>
    </html>
  `;

  if (Platform.OS === 'web') {
    return (
      <LinearGradient
        colors={COLORS.backgroundGradient}
        style={[styles.container, style]}
        pointerEvents="none"
      >
        <Animated.View style={[styles.webViewContainer, { opacity: fadeAnim }]} pointerEvents="none">
          <iframe
            srcDoc={htmlContent}
            style={{ width: '100%', height: '100%', border: 'none', pointerEvents: 'none' }}
            title="Mystic Visualizer"
          />
        </Animated.View>
      </LinearGradient>
    );
  }

  return (
    <LinearGradient
      colors={COLORS.backgroundGradient}
      style={[styles.container, style]}
      pointerEvents="none"
    >
      <Animated.View style={[styles.webViewContainer, { opacity: fadeAnim }]} pointerEvents="none">
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
          onError={(syntheticEvent) => {
            const { nativeEvent } = syntheticEvent;
            console.warn('WebView error:', nativeEvent);
          }}
          onLoad={() => console.log('Spline scene loaded successfully')}
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
});

export default MysticVisualizer;