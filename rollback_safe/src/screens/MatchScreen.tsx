import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, SafeAreaView, Image, Alert, Linking, Platform, ActivityIndicator } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import GlassCard from '../components/GlassCard';
import HolyButton from '../components/HolyButton';
import MysticVisualizer from '../components/MysticVisualizer';
import { COLORS, FONTS, LAYOUT } from '../theme/theme';
import { api } from '../services/api';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { WebView } from 'react-native-webview';

const MatchScreen = () => {
    const navigation = useNavigation();
    const route = useRoute();
    const [loading, setLoading] = useState(true);
    const [matchData, setMatchData] = useState<any>(null);
    const [showMap, setShowMap] = useState(false);
    const [mapUrl, setMapUrl] = useState('');

    useEffect(() => {
        loadMatchData();
    }, []);

    const loadMatchData = async () => {
        try {
            setLoading(true);
            // 1. Try to get from params
            const params = route.params as any;
            if (params?.matchData) {
                setMatchData(params.matchData);
                setLoading(false);
                return;
            }

            // 2. Try to get from API
            const name = await AsyncStorage.getItem('userName');
            const response = await api.getMatchData(name || '');

            if (response.success && response.match) {
                setMatchData(response.match);
            } else {
                // Fallback Mock Data
                setMatchData({
                    name: '서연',
                    age: 28,
                    gender: 'female',
                    location: '서울시 마포구',
                    mbti: 'INFJ',
                    deficit: '외로움',
                    complex: '완벽주의',
                    bio: '조용한 카페에서 책 읽는 것을 좋아해요. 서로의 침묵도 편안한 관계를 꿈꿉니다.',
                    mission: '서로의 눈을 1분간 바라보며 아무 말도 하지 않기',
                    place: '합정동 앤트러사이트',
                    placeUrl: 'https://place.map.kakao.com/26379943'
                });
            }
        } catch (e) {
            console.error(e);
            Alert.alert('오류', '매칭 정보를 불러오는데 실패했습니다.');
        } finally {
            setLoading(false);
        }
    };

    const handleOpenMap = () => {
        if (matchData?.placeUrl) {
            // Check if it's a web URL or intent
            if (Platform.OS === 'web') {
                window.open(matchData.placeUrl, '_blank');
            } else {
                setShowMap(true);
                setMapUrl(matchData.placeUrl);
            }
        } else {
            Alert.alert('알림', '장소 정보가 없습니다.');
        }
    };

    if (loading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={COLORS.gold} />
                <Text style={styles.loadingText}>운명의 상대를 불러오는 중...</Text>
            </View>
        );
    }

    return (
        <LinearGradient
            colors={COLORS.backgroundGradient as any}
            style={styles.container}
        >
            <SafeAreaView style={styles.safeArea}>
                <ScrollView contentContainerStyle={styles.content}>
                    <Text style={styles.title}>MATCH FOUND</Text>

                    <View style={styles.visualizerContainer}>
                        {/* @ts-ignore */}
                        <MysticVisualizer
                            isActive={true}
                            mode="speaking"
                            sceneUrl="https://prod.spline.design/gjz7s8UmZl4fmUa7/scene.splinecode"
                        />
                    </View>

                    <GlassCard style={styles.profileCard}>
                        <View style={styles.profileHeader}>
                            <Image
                                source={matchData?.gender === 'female' ? require('../../assets/default_profile_female.png') : require('../../assets/default_profile_male.png')}
                                style={styles.profileImage}
                            />
                            <View style={styles.profileInfo}>
                                <Text style={styles.name}>{matchData?.name} ({matchData?.age})</Text>
                                <Text style={styles.detail}>{matchData?.location} · {matchData?.mbti}</Text>
                            </View>
                        </View>

                        <View style={styles.section}>
                            <Text style={styles.sectionTitle}>결핍과 콤플렉스</Text>
                            <Text style={styles.sectionText}>"{matchData?.deficit}" 속에서 "{matchData?.complex}"를 마주하며 성장중</Text>
                        </View>

                        <View style={styles.section}>
                            <Text style={styles.sectionTitle}>자기소개</Text>
                            <Text style={styles.sectionText}>{matchData?.bio}</Text>
                        </View>
                    </GlassCard>

                    <GlassCard style={styles.missionCard}>
                        <Text style={styles.missionTitle}>SECRET MISSION</Text>
                        <Text style={styles.missionContent}>{matchData?.mission}</Text>

                        <View style={styles.placeContainer}>
                            <Text style={styles.placeLabel}>만남 장소:</Text>
                            <Text style={styles.placeName}>{matchData?.place}</Text>
                            <TouchableOpacity onPress={handleOpenMap} style={styles.mapButton}>
                                <Text style={styles.mapButtonText}>지도 보기</Text>
                            </TouchableOpacity>
                        </View>
                    </GlassCard>

                    <HolyButton
                        title="대화 시작하기"
                        onPress={() => Alert.alert('알림', '채팅 기능은 준비중입니다.')}
                        style={styles.chatButton}
                    />

                </ScrollView>
            </SafeAreaView>

            {/* Map Modal/WebView */}
            {showMap && (
                <View style={styles.mapOverlay}>
                    <SafeAreaView style={{ flex: 1 }}>
                        <View style={styles.mapHeader}>
                            <TouchableOpacity onPress={() => setShowMap(false)} style={styles.closeButton}>
                                <Text style={styles.closeButtonText}>닫기</Text>
                            </TouchableOpacity>
                        </View>
                        <WebView
                            source={{ uri: mapUrl }}
                            style={{ flex: 1 }}
                            onShouldStartLoadWithRequest={(request) => {
                                // Handle intent:// URLs for Android
                                if (request.url.startsWith('intent://')) {
                                    Linking.openURL(request.url).catch(err => {
                                        console.log('Failed to open intent:', err);
                                        Alert.alert('알림', '지도 앱을 열 수 없습니다.');
                                    });
                                    return false;
                                }
                                return true;
                            }}
                        />
                    </SafeAreaView>
                </View>
            )}
        </LinearGradient>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: COLORS.background,
    },
    loadingText: {
        color: COLORS.gold,
        marginTop: 20,
        fontSize: 16,
        fontFamily: FONTS.body,
    },
    safeArea: {
        flex: 1,
    },
    content: {
        padding: 20,
        paddingBottom: 50,
    },
    title: {
        fontSize: 32,
        color: COLORS.gold,
        fontWeight: 'bold',
        textAlign: 'center',
        marginBottom: 20,
        fontFamily: FONTS.title,
        letterSpacing: 2,
    },
    visualizerContainer: {
        height: 200,
        marginBottom: 20,
        borderRadius: 20,
        overflow: 'hidden',
    },
    profileCard: {
        padding: 20,
        marginBottom: 20,
    },
    profileHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 20,
    },
    profileImage: {
        width: 80,
        height: 80,
        borderRadius: 40,
        borderWidth: 2,
        borderColor: COLORS.gold,
    },
    profileInfo: {
        marginLeft: 20,
        flex: 1,
    },
    name: {
        color: '#fff',
        fontSize: 24,
        fontWeight: 'bold',
        fontFamily: FONTS.title,
    },
    detail: {
        color: '#ccc',
        fontSize: 14,
        marginTop: 5,
        fontFamily: FONTS.body,
    },
    section: {
        marginTop: 15,
        borderTopWidth: 1,
        borderTopColor: 'rgba(255,255,255,0.1)',
        paddingTop: 15,
    },
    sectionTitle: {
        color: COLORS.gold,
        fontSize: 14,
        marginBottom: 5,
        fontWeight: 'bold',
    },
    sectionText: {
        color: '#fff',
        fontSize: 16,
        lineHeight: 24,
        fontFamily: FONTS.body,
    },
    missionCard: {
        padding: 20,
        marginBottom: 30,
        borderColor: COLORS.gold,
        borderWidth: 1,
    },
    missionTitle: {
        color: COLORS.gold,
        fontSize: 20,
        fontWeight: 'bold',
        textAlign: 'center',
        marginBottom: 15,
        fontFamily: FONTS.title,
    },
    missionContent: {
        color: '#fff',
        fontSize: 18,
        textAlign: 'center',
        lineHeight: 28,
        marginBottom: 20,
        fontFamily: FONTS.body,
    },
    placeContainer: {
        backgroundColor: 'rgba(0,0,0,0.3)',
        padding: 15,
        borderRadius: 10,
        alignItems: 'center',
    },
    placeLabel: {
        color: '#aaa',
        fontSize: 12,
        marginBottom: 5,
    },
    placeName: {
        color: '#fff',
        fontSize: 16,
        fontWeight: 'bold',
        marginBottom: 10,
    },
    mapButton: {
        backgroundColor: 'rgba(255,255,255,0.1)',
        paddingHorizontal: 15,
        paddingVertical: 8,
        borderRadius: 20,
    },
    mapButtonText: {
        color: COLORS.gold,
        fontSize: 12,
    },
    chatButton: {
        width: '100%',
    },
    mapOverlay: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: '#000',
        zIndex: 1000,
    },
    mapHeader: {
        height: 50,
        backgroundColor: '#111',
        justifyContent: 'center',
        alignItems: 'flex-end',
        paddingHorizontal: 20,
    },
    closeButton: {
        padding: 10,
    },
    closeButtonText: {
        color: '#fff',
        fontSize: 16,
    },
});

export default MatchScreen;
