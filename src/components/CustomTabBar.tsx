import React from 'react';
import { View, Text, Pressable, StyleSheet, Dimensions, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
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
    return (
        <View style={styles.container}>
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
                                        color={isFocused ? '#FFFFFF' : 'rgba(255, 255, 255, 0.5)'}
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
        bottom: 20,
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
        borderColor: 'rgba(255, 255, 255, 0.1)',
    },
    blurContainer: {
        flex: 1,
        backgroundColor: 'rgba(10, 5, 25, 0.95)',
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
        backgroundColor: 'rgba(255, 255, 255, 0.08)',
    },
    label: {
        color: 'rgba(255, 255, 255, 0.5)',
        fontSize: 10,
        marginTop: 4,
        letterSpacing: 0.5,
        fontWeight: '500',
    },
    focusedLabel: {
        color: '#FFFFFF',
    },
});

export default CustomTabBar;

