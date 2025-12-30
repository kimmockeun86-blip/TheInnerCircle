import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, SafeAreaView, Image, Alert, Linking, Platform, ActivityIndicator, Animated, TextInput, Modal } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import GradientBackground from '../components/GradientBackground';
import GlassCard from '../components/GlassCard';
import HolyButton from '../components/HolyButton';
import MysticVisualizer from '../components/MysticVisualizer';
import { COLORS, FONTS, LAYOUT } from '../theme/theme';
import { api } from '../services/api';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { WebView } from 'react-native-webview';

type MatchPhase = 'searching' | 'reveal' | 'proposal' | 'mission' | 'post_meeting' | 'decision';

const MatchScreen = () => {
    const navigation = useNavigation();
    const route = useRoute();
    const [loading, setLoading] = useState(true);
    const [matchData, setMatchData] = useState<any>(null);
    const [showMap, setShowMap] = useState(false);
    const [mapUrl, setMapUrl] = useState('');

    // Phase state
    const [phase, setPhase] = useState<MatchPhase>('searching');

    // Meeting Proposal state
    const [meetingDate, setMeetingDate] = useState('');
    const [meetingTime, setMeetingTime] = useState('');
    const [meetingPlace, setMeetingPlace] = useState('');

    // Post-Meeting Review state
    const [postMeetingReview, setPostMeetingReview] = useState('');
    const [reviewModalVisible, setReviewModalVisible] = useState(false);

    // Animation refs
    const blurAnim = useRef(new Animated.Value(10)).current;
    const fadeAnim = useRef(new Animated.Value(0)).current;
    const scaleAnim = useRef(new Animated.Value(0.8)).current;

    useEffect(() => {
        loadMatchData();
    }, []);

    useEffect(() => {
        // Start searching animation, then reveal after 3 seconds
        if (phase === 'searching' && !loading) {
            const timer = setTimeout(() => {
                startRevealAnimation();
            }, 3000);
            return () => clearTimeout(timer);
        }
    }, [phase, loading]);

    const startRevealAnimation = () => {
        setPhase('reveal');
        Animated.parallel([
            Animated.timing(blurAnim, {
                toValue: 0,
                duration: 2000,
                useNativeDriver: false,
            }),
            Animated.timing(fadeAnim, {
                toValue: 1,
                duration: 1500,
                useNativeDriver: Platform.OS !== 'web',
            }),
            Animated.spring(scaleAnim, {
                toValue: 1,
                friction: 8,
                useNativeDriver: Platform.OS !== 'web',
            }),
        ]).start(() => {
            setTimeout(() => setPhase('proposal'), 1000);
        });
    };

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
                // Fallback Mock Data - 개인정보 보호 정책에 따라 이상형만 표시
                setMatchData({
                    name: '비밀의 상대',
                    age: '??',
                    gender: 'female',
                    location: '비공개',
                    mbti: 'INFJ',
                    idealType: '서로의 침묵도 편안한 관계를 꿈꾸는 사람',
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

    const handleConfirmMeeting = async () => {
        if (!meetingDate || !meetingTime) {
            Alert.alert('알림', '날짜와 시간을 입력해주세요.');
            return;
        }
        await AsyncStorage.setItem('meetingDate', meetingDate);
        await AsyncStorage.setItem('meetingTime', meetingTime);
        await AsyncStorage.setItem('meetingPlace', meetingPlace || matchData?.place || '');
        setPhase('mission');
    };

    const handleConfirmMission = async () => {
        await AsyncStorage.setItem('secret_mission_active', 'true');
        await AsyncStorage.setItem('missionStatus', 'secret_mission_active');
        setPhase('post_meeting');
    };

    const handleSubmitReview = async () => {
        if (!postMeetingReview.trim()) {
            Alert.alert('알림', '만남 후기를 작성해주세요.');
            return;
        }
        await AsyncStorage.setItem('postMeetingReview', postMeetingReview);
        setReviewModalVisible(false);
        setPhase('decision');
    };

    const handleDecision = async (decision: 'continue' | 'new' | 'solo') => {
        await AsyncStorage.setItem('matchDecision', decision);
        if (decision === 'continue') {
            await AsyncStorage.setItem('matchResult', 'success');
            await AsyncStorage.setItem('isCoupled', 'coupled');
            Alert.alert('축하합니다!', '두 분의 인연이 시작됩니다.', [
                { text: '확인', onPress: () => navigation.navigate('CouplesMission' as never) }
            ]);
        } else if (decision === 'new') {
            await AsyncStorage.setItem('matchResult', 'retry');
            Alert.alert('알림', '새로운 인연을 찾습니다.', [
                { text: '확인', onPress: () => navigation.navigate('MainTabs' as never) }
            ]);
        } else {
            await AsyncStorage.setItem('matchResult', 'solo');
            Alert.alert('알림', '홀로 집중 모드로 전환합니다.', [
                { text: '확인', onPress: () => navigation.navigate('MainTabs' as never) }
            ]);
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

    // Phase: Searching
    if (phase === 'searching') {
        return (
            <GradientBackground colors={COLORS.backgroundGradient as any} style={styles.container}>
                <SafeAreaView style={styles.safeArea}>
                    <View style={styles.searchingContainer}>
                        <View style={styles.visualizerContainer}>
                            {/* @ts-ignore */}
                            <MysticVisualizer
                                isActive={true}
                                mode="speaking"
                                sceneUrl="https://prod.spline.design/gjz7s8UmZl4fmUa7/scene.splinecode"
                            />
                        </View>
                        <Text style={styles.searchingTitle}>영혼 탐색 중...</Text>
                        <Text style={styles.searchingText}>
                            당신과 공명하는 영혼을 찾고 있습니다
                        </Text>
                        <ActivityIndicator size="large" color={COLORS.gold} style={{ marginTop: 20 }} />
                    </View>
                </SafeAreaView>
            </GradientBackground>
        );
    }

    return (
        <GradientBackground
            colors={COLORS.backgroundGradient as any}
            style={styles.container}
        >
            <SafeAreaView style={styles.safeArea}>
                <ScrollView contentContainerStyle={styles.content}>
                    <Text style={styles.title}>
                        {phase === 'reveal' ? 'SOUL FOUND' :
                            phase === 'proposal' ? '만남 제안' :
                                phase === 'mission' ? 'SECRET MISSION' :
                                    phase === 'post_meeting' ? '만남 후기' :
                                        'DECISION'}
                    </Text>

                    {/* Profile Card with Reveal Animation */}
                    <Animated.View style={{
                        opacity: phase === 'reveal' ? fadeAnim : 1,
                        transform: [{ scale: phase === 'reveal' ? scaleAnim : 1 }],
                    }}>
                        <GlassCard style={styles.profileCard}>
                            <View style={styles.profileHeader}>
                                <Image
                                    source={matchData?.gender === 'female' ? require('../../assets/female_placeholder.png') : require('../../assets/male_placeholder.png')}
                                    style={[styles.profileImage, { opacity: phase === 'reveal' ? 0.7 : 1 }]}
                                    blurRadius={phase === 'reveal' ? 5 : 0}
                                />
                                <View style={styles.profileInfo}>
                                    <Text style={styles.name}>비밀의 상대</Text>
                                    <Text style={styles.detail}>{matchData?.mbti || 'MBTI 비공개'}</Text>
                                </View>
                            </View>

                            {/* 이상형만 공개 - 개인정보 보호 정책 */}
                            {matchData?.idealType && (
                                <View style={styles.section}>
                                    <Text style={styles.sectionTitle}>이상형</Text>
                                    <Text style={styles.sectionText}>{matchData.idealType}</Text>
                                </View>
                            )}
                        </GlassCard>
                    </Animated.View>

                    {/* Meeting Proposal Phase */}
                    {phase === 'proposal' && (
                        <GlassCard style={styles.proposalCard}>
                            <Text style={styles.proposalTitle}>만남을 제안하세요</Text>

                            <Text style={styles.inputLabel}>날짜</Text>
                            <TextInput
                                style={styles.input}
                                placeholder="예: 2024-01-15"
                                placeholderTextColor="#666"
                                value={meetingDate}
                                onChangeText={setMeetingDate}
                            />

                            <Text style={styles.inputLabel}>시간</Text>
                            <TextInput
                                style={styles.input}
                                placeholder="예: 오후 3시"
                                placeholderTextColor="#666"
                                value={meetingTime}
                                onChangeText={setMeetingTime}
                            />

                            <Text style={styles.inputLabel}>장소 (선택)</Text>
                            <TextInput
                                style={styles.input}
                                placeholder={matchData?.place || '장소를 입력하세요'}
                                placeholderTextColor="#666"
                                value={meetingPlace}
                                onChangeText={setMeetingPlace}
                            />

                            <TouchableOpacity onPress={handleOpenMap} style={styles.mapSearchButton}>
                                <Text style={styles.mapSearchText}>📍 장소 검색</Text>
                            </TouchableOpacity>

                            <HolyButton
                                title="만남 확정"
                                onPress={handleConfirmMeeting}
                                style={{ marginTop: 20 }}
                            />
                        </GlassCard>
                    )}

                    {/* Secret Mission Phase */}
                    {phase === 'mission' && (
                        <GlassCard style={styles.missionCard}>
                            <Text style={styles.missionTitle}>🤫 SECRET MISSION</Text>
                            <Text style={styles.missionContent}>{matchData?.mission}</Text>

                            <View style={styles.placeContainer}>
                                <Text style={styles.placeLabel}>만남 장소:</Text>
                                <Text style={styles.placeName}>{meetingPlace || matchData?.place}</Text>
                                <Text style={styles.placeLabel}>날짜/시간:</Text>
                                <Text style={styles.placeName}>{meetingDate} {meetingTime}</Text>
                            </View>

                            <HolyButton
                                title="비밀 지령 수락"
                                onPress={handleConfirmMission}
                                style={{ marginTop: 20 }}
                            />
                        </GlassCard>
                    )}

                    {/* Post-Meeting Phase */}
                    {phase === 'post_meeting' && (
                        <GlassCard style={styles.postMeetingCard}>
                            <Text style={styles.postMeetingTitle}>만남은 어떠셨나요?</Text>
                            <Text style={styles.postMeetingSubtitle}>
                                만남 후기를 작성하고 결정해주세요
                            </Text>

                            <HolyButton
                                title="📝 만남 후기 작성"
                                onPress={() => setReviewModalVisible(true)}
                                style={{ marginTop: 20 }}
                            />

                            <HolyButton
                                title="➡️ 결정으로 넘어가기"
                                onPress={() => setPhase('decision')}
                                variant="ghost"
                                style={{ marginTop: 10 }}
                            />
                        </GlassCard>
                    )}

                    {/* Decision Phase */}
                    {phase === 'decision' && (
                        <GlassCard style={styles.decisionCard}>
                            <Text style={styles.decisionTitle}>결정의 순간</Text>
                            <Text style={styles.decisionSubtitle}>
                                {matchData?.name}님과의 인연을 어떻게 하시겠습니까?
                            </Text>

                            <HolyButton
                                title="💕 계속하기"
                                onPress={() => handleDecision('continue')}
                                style={{ marginTop: 20, backgroundColor: '#4CAF50' }}
                            />

                            <HolyButton
                                title="🔍 새로운 사람 찾기"
                                onPress={() => handleDecision('new')}
                                variant="secondary"
                                style={{ marginTop: 10 }}
                            />

                            <HolyButton
                                title="🧘 나에게 집중"
                                onPress={() => handleDecision('solo')}
                                variant="ghost"
                                style={{ marginTop: 10 }}
                            />
                        </GlassCard>
                    )}

                </ScrollView>
            </SafeAreaView>

            {/* Review Modal */}
            <Modal
                animationType="slide"
                transparent={true}
                visible={reviewModalVisible}
                onRequestClose={() => setReviewModalVisible(false)}
            >
                <View style={styles.modalOverlay}>
                    <GlassCard style={styles.reviewModalContent}>
                        <Text style={styles.reviewModalTitle}>만남 후기</Text>
                        <TextInput
                            style={styles.reviewInput}
                            placeholder="만남은 어떠셨나요? 느낀 점을 자유롭게 적어주세요."
                            placeholderTextColor="#666"
                            value={postMeetingReview}
                            onChangeText={setPostMeetingReview}
                            multiline
                            numberOfLines={6}
                        />
                        <View style={{ flexDirection: 'row', marginTop: 20 }}>
                            <HolyButton
                                title="취소"
                                onPress={() => setReviewModalVisible(false)}
                                variant="ghost"
                                style={{ flex: 1, marginRight: 10 }}
                            />
                            <HolyButton
                                title="제출"
                                onPress={handleSubmitReview}
                                style={{ flex: 1 }}
                            />
                        </View>
                    </GlassCard>
                </View>
            </Modal>

            {/* Map Modal/WebView */}
            {
                showMap && (
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
                )
            }
        </GradientBackground>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    safeArea: {
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
        fontFamily: FONTS.serif,
    },
    searchingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    searchingTitle: {
        color: COLORS.gold,
        fontSize: 28,
        fontWeight: 'bold',
        marginTop: 30,
        fontFamily: FONTS.serif,
    },
    searchingText: {
        color: '#aaa',
        fontSize: 16,
        marginTop: 10,
        textAlign: 'center',
        fontFamily: FONTS.serif,
    },
    content: {
        padding: 20,
        paddingBottom: 100,
    },
    title: {
        color: COLORS.gold,
        fontSize: 24,
        fontWeight: 'bold',
        textAlign: 'center',
        marginBottom: 20,
        fontFamily: FONTS.serif,
    },
    visualizerContainer: {
        width: 280,
        height: 280,
        alignItems: 'center',
        justifyContent: 'center',
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
        marginRight: 15,
        borderWidth: 2,
        borderColor: COLORS.gold,
    },
    profileInfo: {
        flex: 1,
    },
    name: {
        color: '#fff',
        fontSize: 22,
        fontWeight: 'bold',
        fontFamily: FONTS.serif,
    },
    detail: {
        color: '#aaa',
        fontSize: 14,
        marginTop: 5,
        fontFamily: FONTS.serif,
    },
    section: {
        marginTop: 15,
    },
    sectionTitle: {
        color: COLORS.gold,
        fontSize: 14,
        fontWeight: 'bold',
        marginBottom: 5,
        fontFamily: FONTS.serif,
    },
    sectionText: {
        color: '#ddd',
        fontSize: 15,
        lineHeight: 22,
        fontFamily: FONTS.serif,
    },
    proposalCard: {
        padding: 20,
        marginBottom: 20,
    },
    proposalTitle: {
        color: COLORS.gold,
        fontSize: 18,
        fontWeight: 'bold',
        marginBottom: 20,
        textAlign: 'center',
        fontFamily: FONTS.serif,
    },
    inputLabel: {
        color: '#aaa',
        fontSize: 14,
        marginBottom: 5,
        marginTop: 15,
        fontFamily: FONTS.serif,
    },
    input: {
        backgroundColor: 'rgba(255,255,255,0.1)',
        borderRadius: 10,
        padding: 15,
        color: '#fff',
        fontSize: 16,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.2)',
    },
    mapSearchButton: {
        marginTop: 15,
        alignItems: 'center',
    },
    mapSearchText: {
        color: COLORS.gold,
        fontSize: 14,
    },
    missionCard: {
        padding: 20,
        marginBottom: 20,
        alignItems: 'center',
    },
    missionTitle: {
        color: COLORS.gold,
        fontSize: 20,
        fontWeight: 'bold',
        marginBottom: 15,
        fontFamily: FONTS.serif,
    },
    missionContent: {
        color: '#fff',
        fontSize: 18,
        textAlign: 'center',
        lineHeight: 26,
        fontFamily: FONTS.serif,
    },
    placeContainer: {
        marginTop: 20,
        width: '100%',
    },
    placeLabel: {
        color: '#888',
        fontSize: 12,
        marginTop: 10,
    },
    placeName: {
        color: '#fff',
        fontSize: 16,
        fontFamily: FONTS.serif,
    },
    postMeetingCard: {
        padding: 20,
        alignItems: 'center',
    },
    postMeetingTitle: {
        color: COLORS.gold,
        fontSize: 20,
        fontWeight: 'bold',
        fontFamily: FONTS.serif,
    },
    postMeetingSubtitle: {
        color: '#aaa',
        fontSize: 14,
        marginTop: 10,
        textAlign: 'center',
    },
    decisionCard: {
        padding: 20,
        alignItems: 'center',
    },
    decisionTitle: {
        color: COLORS.gold,
        fontSize: 22,
        fontWeight: 'bold',
        fontFamily: FONTS.serif,
    },
    decisionSubtitle: {
        color: '#ddd',
        fontSize: 16,
        marginTop: 10,
        textAlign: 'center',
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.8)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    reviewModalContent: {
        width: '100%',
        maxWidth: 400,
        padding: 20,
    },
    reviewModalTitle: {
        color: COLORS.gold,
        fontSize: 20,
        fontWeight: 'bold',
        textAlign: 'center',
        marginBottom: 20,
        fontFamily: FONTS.serif,
    },
    reviewInput: {
        backgroundColor: 'rgba(255,255,255,0.1)',
        borderRadius: 10,
        padding: 15,
        color: '#fff',
        fontSize: 16,
        minHeight: 150,
        textAlignVertical: 'top',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.2)',
    },
    mapOverlay: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: '#fff',
    },
    mapHeader: {
        padding: 10,
        backgroundColor: '#000',
        alignItems: 'flex-end',
    },
    closeButton: {
        padding: 10,
    },
    closeButtonText: {
        color: COLORS.gold,
        fontSize: 16,
    },
});

export default MatchScreen;
