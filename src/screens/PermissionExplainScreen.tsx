// PermissionExplainScreen.tsx
// 앱 처음 설치 시 권한 요청 전 설명 화면

import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    SafeAreaView,
    Platform,
    Animated,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import PermissionService from '../services/PermissionService';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface PermissionExplainScreenProps {
    navigation: any;
}

const PermissionExplainScreen: React.FC<PermissionExplainScreenProps> = ({ navigation }) => {
    const [isRequesting, setIsRequesting] = useState(false);

    const handleStart = async () => {
        setIsRequesting(true);

        try {
            // 권한 요청
            await PermissionService.requestAllPermissions();

            // 설명 화면 봤음을 저장
            await AsyncStorage.setItem('permissionExplainSeen', 'true');

            // 온보딩으로 이동
            navigation.replace('Onboarding');
        } catch (error) {
            console.log('[PermissionExplain] Error:', error);
            // 오류 발생해도 온보딩으로 진행
            await AsyncStorage.setItem('permissionExplainSeen', 'true');
            navigation.replace('Onboarding');
        } finally {
            setIsRequesting(false);
        }
    };

    const PermissionItem = ({
        icon,
        title,
        description,
        color
    }: {
        icon: string;
        title: string;
        description: string;
        color: string;
    }) => (
        <View style={styles.permissionItem}>
            <View style={[styles.iconContainer, { backgroundColor: color + '20' }]}>
                <Ionicons name={icon as any} size={28} color={color} />
            </View>
            <View style={styles.permissionText}>
                <Text style={styles.permissionTitle}>{title}</Text>
                <Text style={styles.permissionDescription}>{description}</Text>
            </View>
        </View>
    );

    return (
        <LinearGradient
            colors={['#1A0B2E', '#2D1B4E', '#1A0B2E']}
            style={styles.container}
        >
            <SafeAreaView style={styles.safeArea}>
                {/* 로고 영역 */}
                <View style={styles.logoContainer}>
                    <Text style={styles.logoEmoji}>🌙</Text>
                    <Text style={styles.logoText}>ORBIT</Text>
                    <Text style={styles.subtitle}>시작하기 전에</Text>
                </View>

                {/* 설명 카드 */}
                <View style={styles.card}>
                    <Text style={styles.cardTitle}>
                        더 나은 경험을 위해{'\n'}권한이 필요해요
                    </Text>

                    <View style={styles.permissionList}>
                        <PermissionItem
                            icon="notifications-outline"
                            title="알림"
                            description="매일 리추얼 시간을 알려드릴게요. 놓치지 않도록요!"
                            color="#FFD93D"
                        />

                        <PermissionItem
                            icon="location-outline"
                            title="위치"
                            description="가까운 곳에 있는 인연을 찾아드릴게요."
                            color="#6BCB77"
                        />
                    </View>

                    <Text style={styles.note}>
                        💡 나중에 설정에서 언제든 변경할 수 있어요
                    </Text>
                </View>

                {/* 시작 버튼 */}
                <TouchableOpacity
                    style={[styles.startButton, isRequesting && styles.startButtonDisabled]}
                    onPress={handleStart}
                    disabled={isRequesting}
                    activeOpacity={0.8}
                >
                    <LinearGradient
                        colors={['#8B5CF6', '#A855F7', '#C084FC']}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 0 }}
                        style={styles.buttonGradient}
                    >
                        <Text style={styles.buttonText}>
                            {isRequesting ? '확인 중...' : '시작하기'}
                        </Text>
                        {!isRequesting && (
                            <Ionicons name="arrow-forward" size={20} color="#fff" />
                        )}
                    </LinearGradient>
                </TouchableOpacity>

                {/* 스킵 옵션 */}
                <TouchableOpacity
                    style={styles.skipButton}
                    onPress={async () => {
                        await AsyncStorage.setItem('permissionExplainSeen', 'true');
                        navigation.replace('Onboarding');
                    }}
                >
                    <Text style={styles.skipText}>나중에 할게요</Text>
                </TouchableOpacity>
            </SafeAreaView>
        </LinearGradient>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    safeArea: {
        flex: 1,
        paddingHorizontal: 24,
        justifyContent: 'center',
        alignItems: 'center',
    },
    logoContainer: {
        alignItems: 'center',
        marginBottom: 32,
    },
    logoEmoji: {
        fontSize: 48,
        marginBottom: 8,
    },
    logoText: {
        fontSize: 32,
        fontWeight: '700',
        color: '#fff',
        letterSpacing: 4,
    },
    subtitle: {
        fontSize: 16,
        color: 'rgba(255, 255, 255, 0.6)',
        marginTop: 8,
    },
    card: {
        backgroundColor: 'rgba(255, 255, 255, 0.08)',
        borderRadius: 24,
        padding: 28,
        width: '100%',
        maxWidth: 400,
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.1)',
    },
    cardTitle: {
        fontSize: 22,
        fontWeight: '600',
        color: '#fff',
        textAlign: 'center',
        marginBottom: 28,
        lineHeight: 32,
    },
    permissionList: {
        gap: 20,
    },
    permissionItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 16,
    },
    iconContainer: {
        width: 52,
        height: 52,
        borderRadius: 16,
        justifyContent: 'center',
        alignItems: 'center',
    },
    permissionText: {
        flex: 1,
    },
    permissionTitle: {
        fontSize: 17,
        fontWeight: '600',
        color: '#fff',
        marginBottom: 4,
    },
    permissionDescription: {
        fontSize: 14,
        color: 'rgba(255, 255, 255, 0.7)',
        lineHeight: 20,
    },
    note: {
        fontSize: 13,
        color: 'rgba(255, 255, 255, 0.5)',
        textAlign: 'center',
        marginTop: 24,
    },
    startButton: {
        marginTop: 32,
        width: '100%',
        maxWidth: 400,
        borderRadius: 16,
        overflow: 'hidden',
    },
    startButtonDisabled: {
        opacity: 0.7,
    },
    buttonGradient: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        paddingVertical: 18,
        gap: 8,
    },
    buttonText: {
        fontSize: 18,
        fontWeight: '600',
        color: '#fff',
    },
    skipButton: {
        marginTop: 16,
        padding: 12,
    },
    skipText: {
        fontSize: 14,
        color: 'rgba(255, 255, 255, 0.5)',
    },
});

export default PermissionExplainScreen;
