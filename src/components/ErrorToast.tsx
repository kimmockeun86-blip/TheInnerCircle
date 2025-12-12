// Error Toast Component
import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated, TouchableOpacity, Platform } from 'react-native';
import { COLORS } from '../theme/theme';

interface ErrorToastProps {
    visible: boolean;
    message: string;
    onDismiss?: () => void;
    onRetry?: () => void;
    autoHide?: boolean;
    duration?: number;
}

const ErrorToast: React.FC<ErrorToastProps> = ({
    visible,
    message,
    onDismiss,
    onRetry,
    autoHide = true,
    duration = 4000,
}) => {
    const slideAnim = useRef(new Animated.Value(-100)).current;

    useEffect(() => {
        if (visible) {
            Animated.spring(slideAnim, {
                toValue: 0,
                useNativeDriver: Platform.OS !== 'web',
                tension: 50,
                friction: 8,
            }).start();

            if (autoHide && onDismiss) {
                const timer = setTimeout(() => {
                    hideToast();
                }, duration);
                return () => clearTimeout(timer);
            }
        } else {
            slideAnim.setValue(-100);
        }
    }, [visible]);

    const hideToast = () => {
        Animated.timing(slideAnim, {
            toValue: -100,
            duration: 300,
            useNativeDriver: Platform.OS !== 'web',
        }).start(() => {
            if (onDismiss) onDismiss();
        });
    };

    if (!visible) return null;

    return (
        <Animated.View
            style={[
                styles.container,
                { transform: [{ translateY: slideAnim }] }
            ]}
        >
            <View style={styles.content}>
                <Text style={styles.icon}>⚠️</Text>
                <Text style={styles.message}>{message}</Text>
            </View>
            <View style={styles.actions}>
                {onRetry && (
                    <TouchableOpacity onPress={onRetry} style={styles.retryButton}>
                        <Text style={styles.retryText}>재시도</Text>
                    </TouchableOpacity>
                )}
                <TouchableOpacity onPress={hideToast} style={styles.dismissButton}>
                    <Text style={styles.dismissText}>✕</Text>
                </TouchableOpacity>
            </View>
        </Animated.View>
    );
};

const styles = StyleSheet.create({
    container: {
        position: 'absolute',
        top: 50,
        left: 20,
        right: 20,
        backgroundColor: 'rgba(255, 80, 80, 0.95)',
        borderRadius: 12,
        padding: 15,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        zIndex: 1000,
        ...Platform.select({
            web: {
                boxShadow: '0 4px 15px rgba(0,0,0,0.3)',
            },
            default: {
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.3,
                shadowRadius: 15,
                elevation: 8,
            },
        }),
    },
    content: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
    },
    icon: {
        fontSize: 18,
        marginRight: 10,
    },
    message: {
        color: '#fff',
        fontSize: 14,
        fontWeight: '600',
        flex: 1,
    },
    actions: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    retryButton: {
        backgroundColor: 'rgba(255,255,255,0.2)',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 6,
        marginRight: 8,
    },
    retryText: {
        color: '#fff',
        fontSize: 12,
        fontWeight: '600',
    },
    dismissButton: {
        padding: 5,
    },
    dismissText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: 'bold',
    },
});

export default ErrorToast;
