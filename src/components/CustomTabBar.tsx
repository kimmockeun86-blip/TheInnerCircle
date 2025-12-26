import React from 'react';
import { View, Text, Pressable, StyleSheet, Dimensions, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { COLORS, FONTS } from '../theme/theme';
import logger from '../utils/logger';

const { width } = Dimensions.get('window');

// Tab configuration matching reference image
const TAB_CONFIG: { [key: string]: { icon: keyof typeof Ionicons.glyphMap; iconFocused: keyof typeof Ionicons.glyphMap; label: string } } = {
    'Home': { icon: 'home-outline', iconFocused: 'home', label: 'HOME' },
    'Log': { icon: 'document-text-outline', iconFocused: 'document-text', label: 'LOG' },
    'Profile': { icon: 'settings-outline', iconFocused: 'settings', label: 'SETTINGS' },
};

const CustomTabBar = ({ state, descriptors, navigation }: any) => {
    const insets = useSafeAreaInsets();
    // 기본 20 + SafeArea bottom inset (최소 15)
    const bottomOffset = 20 + Math.max(insets.bottom, 15);

    return (
        <View style={[styles.container, { bottom: bottomOffset }]}>
            <View style={styles.blurContainer}>
                <View style={styles.tabBar}>
                    {state.routes.map((route: any, index: number) => {
                        const { options } = descriptors[route.key];
                        const isFocused = state.index === index;
                        const config = TAB_CONFIG[route.name] || { icon: 'ellipse-outline', iconFocused: 'ellipse', label: route.name };

                        const onPress = () => {
                            logger.log('[CustomTabBar] Tab pressed:', route.name);
                            const event = navigation.emit({
                                type: 'tabPress',
                                target: route.key,
                                canPreventDefault: true,
                            });

                            if (!isFocused && !event.defaultPrevented) {
                                logger.log('[CustomTabBar] Navigating to:', route.name);
                                // Use jumpTo for tab navigation (more reliable for tabs)
                                if (navigation.jumpTo) {
                                    navigation.jumpTo(route.name);
                                } else {
                                    navigation.navigate(route.name);
                                }
                            }
                        };

                        return (
                            <Pressable
                                key={index}
                                accessibilityRole="button"
                                accessibilityState={isFocused ? { selected: true } : {}}
                                accessibilityLabel={options.tabBarAccessibilityLabel}
                                testID={options.tabBarTestID}
                                onPress={onPress}
                                style={({ pressed }) => [
                                    styles.tabItem,
                                    Platform.OS === 'web' && { cursor: 'pointer' },
                                    pressed && { opacity: 0.7 }
                                ]}
                            >
                                <View style={[styles.iconContainer, isFocused && styles.focusedIconContainer, { pointerEvents: 'none' }]}>
                                    <Ionicons
                                        name={isFocused ? config.iconFocused : config.icon}
                                        size={22}
                                        color={isFocused ? '#A78BFA' : 'rgba(167, 139, 250, 0.5)'}
                                    />
                                    <Text style={[styles.label, isFocused && styles.focusedLabel]}>
                                        {config.label}
                                    </Text>
                                </View>
                            </Pressable>
                        );
                    })}
                </View>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        position: 'absolute',
        // bottom은 동적으로 계산됨 (useSafeAreaInsets)
        left: 20,
        right: 20,
        borderRadius: 25,
        overflow: 'hidden',
        height: 65,
        zIndex: 9999,
        // Web-compatible box shadow
        boxShadow: '0px 10px 15px rgba(0, 0, 0, 0.5)',
        elevation: 10,
        borderWidth: 1,
        borderColor: 'rgba(139, 92, 246, 0.4)',
    },
    blurContainer: {
        flex: 1,
        backgroundColor: 'rgba(26, 10, 46, 0.95)', // Cosmic purple background
        borderRadius: 25,
    },
    tabBar: {
        flexDirection: 'row',
        height: '100%',
        alignItems: 'center',
        justifyContent: 'space-around',
        paddingHorizontal: 20,
    },
    tabItem: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        height: '100%',
    },
    iconContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 8,
        paddingHorizontal: 16,
        borderRadius: 20,
    },
    focusedIconContainer: {
        backgroundColor: 'rgba(139, 92, 246, 0.2)',
    },
    label: {
        color: 'rgba(167, 139, 250, 0.6)',
        fontSize: 10,
        marginTop: 4,
        letterSpacing: 0.5,
        fontWeight: '500',
    },
    focusedLabel: {
        color: '#A78BFA',
    },
});

export default CustomTabBar;

