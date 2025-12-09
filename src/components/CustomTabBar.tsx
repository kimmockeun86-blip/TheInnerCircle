import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Platform, Dimensions } from 'react-native';
import { BlurView } from 'expo-blur';
import { COLORS, FONTS } from '../theme/theme';

const { width } = Dimensions.get('window');

const CustomTabBar = ({ state, descriptors, navigation }) => {
    return (
        <View style={styles.container}>
            <BlurView intensity={30} tint="dark" style={styles.blurContainer}>
                <View style={styles.tabBar}>
                    {state.routes.map((route, index) => {
                        const { options } = descriptors[route.key];
                        const label =
                            options.tabBarLabel !== undefined
                                ? options.tabBarLabel
                                : options.title !== undefined
                                    ? options.title
                                    : route.name;

                        const isFocused = state.index === index;

                        const onPress = () => {
                            const event = navigation.emit({
                                type: 'tabPress',
                                target: route.key,
                                canPreventDefault: true,
                            });

                            if (!isFocused && !event.defaultPrevented) {
                                navigation.navigate(route.name);
                            }
                        };

                        return (
                            <TouchableOpacity
                                key={index}
                                accessibilityRole="button"
                                accessibilityState={isFocused ? { selected: true } : {}}
                                accessibilityLabel={options.tabBarAccessibilityLabel}
                                testID={options.tabBarTestID}
                                onPress={onPress}
                                style={styles.tabItem}
                            >
                                <View style={[styles.iconContainer, isFocused && styles.focusedIconContainer]}>
                                    <Text style={[styles.label, isFocused && styles.focusedLabel]}>
                                        {label}
                                    </Text>
                                    {isFocused && <View style={styles.indicator} />}
                                </View>
                            </TouchableOpacity>
                        );
                    })}
                </View>
            </BlurView>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        position: 'absolute',
        bottom: 30,
        left: 20,
        right: 20,
        borderRadius: 30,
        overflow: 'hidden',
        height: 70,
        shadowColor: "#000",
        shadowOffset: {
            width: 0,
            height: 10,
        },
        shadowOpacity: 0.5,
        shadowRadius: 10,
        elevation: 10,
    },
    blurContainer: {
        flex: 1,
        backgroundColor: 'rgba(20, 10, 40, 0.6)',
    },
    tabBar: {
        flexDirection: 'row',
        height: '100%',
        alignItems: 'center',
        justifyContent: 'space-around',
        paddingHorizontal: 10,
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
        height: 40,
        paddingHorizontal: 15,
        borderRadius: 20,
    },
    focusedIconContainer: {
        backgroundColor: 'rgba(255, 255, 255, 0.1)',
    },
    label: {
        color: 'rgba(255, 255, 255, 0.5)',
        fontSize: 14,
        fontFamily: FONTS.title,
        letterSpacing: 1,
    },
    focusedLabel: {
        color: COLORS.gold,
        fontWeight: 'bold',
        textShadowColor: COLORS.gold,
        textShadowOffset: { width: 0, height: 0 },
        textShadowRadius: 10,
    },
    indicator: {
        position: 'absolute',
        bottom: 5,
        width: 4,
        height: 4,
        borderRadius: 2,
        backgroundColor: COLORS.gold,
    }
});

export default CustomTabBar;
