// ID: C-01, C-02, C-03, C-04, C-05, C-06
import React, { useState, useEffect, useRef } from 'react';
import {
    View,
    Text,
    StyleSheet,
    Image,
    TouchableOpacity,
    Modal,
    Animated,
    Easing,
    Alert,
    SafeAreaView,
    TextInput,
    ScrollView,
    Linking,
    StatusBar,
    Platform,
} from 'react-native';
// import { WebView } from 'react-native-webview';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Haptics from 'expo-haptics';
import MysticVisualizer from '../components/MysticVisualizer';
import { api } from '../services/api';
import { MatchScreenNavigationProp, MatchScreenRouteProp } from '../types/navigation';
import { COLORS, FONTS, SPACING, LAYOUT } from '../theme/theme';
import GlassCard from '../components/GlassCard';
import HolyButton from '../components/HolyButton';

interface MatchScreenProps {
    navigation: MatchScreenNavigationProp;
    route: MatchScreenRouteProp;
}

const MatchScreen: React.FC<MatchScreenProps> = ({ navigation, route }) => {
    console.log('🚀 MatchScreen Component Rendered');
    const [step, setStep] = useState('searching');
    const [missionModalVisible, setMissionModalVisible] = useState(false);
    const [reviewModalVisible, setReviewModalVisible] = useState(false);
    const [mapModalVisible, setMapModalVisible] = useState(false);
    const [currentMapUrl, setCurrentMapUrl] = useState('');
    const [activeOptionIndex, setActiveOptionIndex] = useState<number | null>(null);

    // const webViewRef = useRef<WebView>(null);

    const [meetingReview, setMeetingReview] = useState('');
    const [loadingText, setLoadingText] = useState('당신과 공명하는 영혼을\n찾고 있습니다...');
    const [visualizerMode, setVisualizerMode] = useState<'listening' | 'thinking' | 'speaking'>('thinking');

    const [userOptions, setUserOptions] = useState([
        { date: '', time: '', location: '' },
        { date: '', time: '', location: '' },
        { date: '', time: '', location: '' },
    ]);

    const searchFadeAnim = useRef(new Animated.Value(1)).current;
    const profileFadeAnim = useRef(new Animated.Value(0)).current;
    const profileSlideAnim = useRef(new Animated.Value(50)).current;
    const ceremonyOpacity = useRef(new Animated.Value(0)).current;
    const [showCeremony, setShowCeremony] = useState(false);

    const matchProfile = {
        name: '서지수',
        age: 29,
        keyword: '루틴 유지력',
        blurredImage: 'https://picsum.photos/250/250?blur=6',
        realImage: 'https://picsum.photos/250/250',
    };

    const partnerOptions = [
        { date: '11월 24일 목요일', time: '저녁 8시', location: '서울 마포구 독막로 123, 비밀 와인바' },
        { date: '11월 25일 금요일', time: '저녁 7시', location: '서울 성동구 연무장길 45, 커피 아카이브' },
        { date: '11월 26일 토요일', time: '낮 2시', location: '서울 종로구 세종대로 123, 시청 박물관' },
    ];

    const agreedOption = partnerOptions[1];
    const secretMission = "만남 도중 상대방에게 '가장 좋아하는 색깔'을 묻고, 그 색깔이 자신에게 미친 영향을 30초간 설명하기.";

    useEffect(() => {
        console.log('MatchScreen Mounted');
        if (route.params?.reviewMode) {
            setStep('postMeeting');
            setReviewModalVisible(true);
            return;
        }

        const checkLocationAndSearch = async () => {
            // J_LocCheck: Location Filtering
            const userLocation = await AsyncStorage.getItem('userLocation');
            if (userLocation === 'Other') {
                Alert.alert(
                    '매칭 제한',
                    '현재 매칭 파동은 서울과 경기 지역에만 닿고 있습니다.\n내면의 수련을 계속하며 파동이 넓어지기를 기다려주세요.',
                    [
                        {
                            text: '확인',
                            onPress: () => navigation.navigate('Home')
                        }
                    ]
                );
                return;
            }

            // Soul Search Sequence
            setVisualizerMode('thinking');
            setLoadingText('당신과 공명하는 영혼을\n찾고 있습니다...');

            // 3 seconds searching
            await new Promise(resolve => setTimeout(resolve, 3000));

            // Success Haptic
            if (Platform.OS !== 'web') {
                await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            }

            // Transition to Matched
            Animated.timing(searchFadeAnim, {
                toValue: 0,
                duration: 1000,
                useNativeDriver: Platform.OS !== 'web',
            }).start(() => {
                setStep('matched');
                setVisualizerMode('listening'); // Idle mode

                Animated.parallel([
                    Animated.timing(profileFadeAnim, {
                        toValue: 1,
                        duration: 1500,
                        easing: Easing.out(Easing.ease),
                        useNativeDriver: Platform.OS !== 'web',
                    }),
                    Animated.timing(profileSlideAnim, {
                        toValue: 0,
                        duration: 1500,
                        easing: Easing.out(Easing.back(1.3)),
                        useNativeDriver: Platform.OS !== 'web',
                    }),
                ]).start();
            });
        };

        checkLocationAndSearch();
    }, [route.params]);

    const updateUserOption = (index: number, field: string, value: string) => {
        const newOptions = [...userOptions];
        // @ts-ignore
        newOptions[index][field] = value;
        setUserOptions(newOptions);
    };

    const handleScheduleMeeting = () => setStep('inputOptions');

    const handleSubmitOptions = () => {
        const hasAtLeastOne = userOptions.some(opt => opt.date.trim() && opt.time.trim() && opt.location.trim());
        if (!hasAtLeastOne) {
            Alert.alert('알림', '최소 1개 이상의 만남 옵션을 입력해주세요.');
            return;
        }
        setStep('coordination');
    };

    const handleAgreeOption = () => setStep('profileReveal');
    const handleRevealComplete = () => setMissionModalVisible(true);

    const handleAcceptDirective = async () => {
        setMissionModalVisible(false);
        try {
            await AsyncStorage.setItem('missionStatus', 'secret_mission_active');
            Alert.alert('지령 수락 완료', '비밀 지령이 수락되었습니다.\n홈 화면에서 수행을 시작하십시오.', [
                { text: '확인', onPress: () => navigation.navigate('Home') }
            ]);
        } catch (e) {
            console.error('지령 수락 저장 실패:', e);
        }
    };

    // 영혼의 결합 (만남 지속)
    const handleContinueTogether = async () => {
        if (meetingReview.trim() === '') {
            Alert.alert('알림', '만남의 파동을 기록해주세요.');
            return;
        }

        try {
            await AsyncStorage.setItem('isCoupled', 'coupled');
            await AsyncStorage.setItem('coupleDayCount', '1');
            await AsyncStorage.setItem('meetingReview', meetingReview);

            setReviewModalVisible(false);
            setShowCeremony(true);

            Animated.sequence([
                Animated.timing(ceremonyOpacity, {
                    toValue: 1,
                    duration: 2000,
                    useNativeDriver: Platform.OS !== 'web',
                }),
                Animated.delay(2000),
                Animated.timing(ceremonyOpacity, {
                    toValue: 0,
                    duration: 1500,
                    useNativeDriver: Platform.OS !== 'web',
                })
            ]).start(() => {
                setShowCeremony(false);
                navigation.navigate('CouplesMission');
            });

        } catch (e) {
            console.error('저장 실패:', e);
        }
    };

    // 새로운 파동 탐색 (새로운 만남 희망)
    const handleSeekingNew = async () => {
        if (meetingReview.trim() === '') {
            Alert.alert('알림', '만남의 파동을 기록해주세요.');
            return;
        }

        try {
            await AsyncStorage.setItem('isCoupled', 'seeking');
            await AsyncStorage.setItem('dayCount', '1');
            await AsyncStorage.setItem('missionStatus', 'active');
            await AsyncStorage.removeItem('savedJournal');
            await AsyncStorage.setItem('meetingReview', meetingReview);

            setReviewModalVisible(false);
            Alert.alert('🔮 새로운 탐색', '내면을 성장시킨 후, 다시 만남을 기대하세요.', [
                { text: '확인', onPress: () => navigation.navigate('Home') },
            ]);
        } catch (e) {
            console.error('저장 실패:', e);
        }
    };

    // 오직 내면의 성장 (매칭 중단)
    const handleSoloFocus = async () => {
        if (meetingReview.trim() === '') {
            Alert.alert('알림', '만남의 파동을 기록해주세요.');
            return;
        }

        try {
            await AsyncStorage.setItem('isCoupled', 'solo_focus');
            await AsyncStorage.setItem('dayCount', '1');
            await AsyncStorage.setItem('missionStatus', 'active');
            await AsyncStorage.removeItem('savedJournal');
            await AsyncStorage.setItem('meetingReview', meetingReview);

            setReviewModalVisible(false);
            Alert.alert('🧘 자아 성장', '오직 내면의 성장에 집중하는 여정을 시작합니다.', [
                { text: '확인', onPress: () => navigation.navigate('Home') },
            ]);
        } catch (e) {
            console.error('저장 실패:', e);
        }
    };

    // Conversation Analysis State
    const [analysisModalVisible, setAnalysisModalVisible] = useState(false);
    const [analysisResult, setAnalysisResult] = useState({ summary: '', advice: '' });
    const [isAnalyzing, setIsAnalyzing] = useState(false);

    // Mock Chat History (In a real app, this would be passed or managed in state)
    // For now, we simulate a history for the analysis
    const mockChatHistory = [
        { role: 'user', text: '요즘 너무 지치고 힘들어. 내가 잘하고 있는지 모르겠어.' },
        { role: 'model', text: '그대여, 잠시 멈추어 숨을 고르세요. 지금의 불안은 더 높이 날아오르기 위한 준비 과정일 뿐입니다.' },
        { role: 'user', text: '정말 그럴까? 자꾸만 남들과 비교하게 돼.' },
        { role: 'model', text: '타인의 속도에 맞추려 하지 마세요. 그대만의 고유한 리듬이 있습니다. 그 리듬을 찾을 때 진정한 평온이 찾아옵니다.' }
    ];

    const handleAnalyzeConversation = async () => {
        setIsAnalyzing(true);
        setAnalysisModalVisible(true);

        try {
            // Use mock history or actual history if available
            const result = await api.analyzeConversation(mockChatHistory);

            if (result.success) {
                setAnalysisResult({ summary: result.summary, advice: result.advice });
            } else {
                setAnalysisResult({ summary: '분석에 실패했습니다.', advice: '잠시 후 다시 시도해주세요.' });
            }
        } catch (e) {
            console.error('Analysis Error:', e);
            setAnalysisResult({ summary: '오류가 발생했습니다.', advice: '네트워크 상태를 확인해주세요.' });
        } finally {
            setIsAnalyzing(false);
        }
    };

    const handleOpenMap = (index: number, location: string) => {
        setActiveOptionIndex(index);
        const query = encodeURIComponent(location || '서울');
        const url = `https://www.google.com/maps/search/?api=1&query=${query}`;
        setCurrentMapUrl(url);
        setMapModalVisible(true);
    };

    const handleSelectLocation = () => {
        const injectScript = `
            (function() {
                try {
                    let candidates = [];

                    // Helper to check if text looks like a Korean address
                    function isAddress(text) {
                        return (text.includes('구') || text.includes('시') || text.includes('군')) && 
                               (text.includes('로') || text.includes('길') || text.includes('동')) &&
                               /\d+/.test(text); // Must contain a number
                    }

                    // Strategy 1: Look for elements with specific class names used for addresses
                    const infoLines = document.querySelectorAll('.Io6YTe, .kR99db, .AeaXub'); 
                    infoLines.forEach(line => {
                        if (line.innerText && isAddress(line.innerText)) {
                            candidates.push(line.innerText);
                        }
                    });

                    // Strategy 2: Look for "Copy address" button aria-labels
                    const buttons = document.querySelectorAll('button[aria-label*="주소"]');
                    buttons.forEach(btn => {
                        const label = btn.getAttribute('aria-label');
                        if (label) candidates.push(label.replace('주소 복사: ', '').trim());
                    });

                    // Strategy 3: Meta tags
                    const metaDesc = document.querySelector('meta[name="description"]');
                    if (metaDesc && isAddress(metaDesc.content)) {
                        candidates.push(metaDesc.content);
                    }

                    // Strategy 4: Page Title (often "Place Name - Address - Google Maps")
                    const title = document.title;
                    if (title) {
                        const parts = title.split(' - ');
                        if (parts.length > 1) {
                            // Check the middle part or the part that looks like an address
                            parts.forEach(part => {
                                if (isAddress(part)) candidates.push(part);
                            });
                        }
                    }

                    // Pick the best candidate (longest one usually has most detail)
                    let bestAddress = '';
                    if (candidates.length > 0) {
                        bestAddress = candidates.reduce((a, b) => a.length > b.length ? a : b);
                    } else {
                        // Fallback: just take the title if nothing else matches strict criteria
                        bestAddress = document.title.replace(' - Google Maps', '').replace(' - Google 지도', '');
                    }

                    window.ReactNativeWebView.postMessage(bestAddress);
                } catch (e) {
                    window.ReactNativeWebView.postMessage(document.title);
                }
            })();
        `;
        // webViewRef.current?.injectJavaScript(injectScript);
        Alert.alert('장소 선택', '선택한 장소 정보를 가져옵니다.');
    };

    const handleWebViewMessage = (event: any) => {
        const title = event.nativeEvent.data;
        if (title && activeOptionIndex !== null) {
            // Remove "- Google Maps" and Korean suffix if present
            const cleanTitle = title
                .replace(' - Google Maps', '')
                .replace(' - Google 지도에서 탐색하기', '')
                .trim();

            updateUserOption(activeOptionIndex, 'location', cleanTitle);
            setMapModalVisible(false);
            setActiveOptionIndex(null);
        }
    };

    return (
        <View style={styles.container}>
            <StatusBar barStyle="light-content" backgroundColor={COLORS.background} />
            {/* Background Visualizer - Always present but mode changes */}
            <View style={styles.visualizerBackground}>
                {Platform.OS !== 'web' && <MysticVisualizer isActive={true} mode={visualizerMode} sceneUrl="https://prod.spline.design/jYIOKYyzTpgISC0I/scene.splinecode" />}
            </View>

            <SafeAreaView style={styles.safeArea}>
                {step === 'searching' && (
                    <Animated.View style={[styles.searchingContainer, { opacity: searchFadeAnim }]}>
                        <Text style={styles.searchingText}>{loadingText}</Text>
                    </Animated.View>
                )}

                {step === 'matched' && (
                    <Animated.View style={[styles.matchedContainer, { opacity: profileFadeAnim, transform: [{ translateY: profileSlideAnim }] }]}>
                        <Text style={styles.matchedTitle}>✨ 매칭이 완료되었습니다</Text>
                        <GlassCard style={styles.profileCard}>
                            <View style={styles.imageContainer}>
                                <Image source={{ uri: matchProfile.blurredImage }} style={styles.profileImage} resizeMode="cover" />
                                <View style={styles.imageOverlay}>
                                    <Text style={styles.mysteryText}>?</Text>
                                </View>
                            </View>
                            <View style={styles.profileInfo}>
                                <Text style={styles.profileName}>{matchProfile.name}</Text>
                                <Text style={styles.profileAge}>{matchProfile.age}세</Text>
                                <View style={styles.divider} />
                                <Text style={styles.profileKeyword}>당신처럼 '{matchProfile.keyword}'이{'\n'}강점인 영혼입니다</Text>
                            </View>
                        </GlassCard>
                        <Text style={styles.infoText}>당신의 내면이 당신을 이끌 것입니다</Text>
                        <HolyButton title="🤝 만남 일정 제안하기" onPress={handleScheduleMeeting} />
                    </Animated.View>
                )}

                {step === 'inputOptions' && (
                    <ScrollView contentContainerStyle={styles.optionInputContainer}>
                        <Text style={styles.optionTitle}>만남 옵션을 제안해주세요{'\n'}<Text style={styles.optionSubtitle}>(최소 1개 이상)</Text></Text>
                        {userOptions.map((option, index) => (
                            <GlassCard key={index} style={styles.optionCard}>
                                <Text style={styles.optionLabel}>옵션 {String.fromCharCode(65 + index)}</Text>
                                <TextInput style={styles.optionInput} placeholder="날짜 (예: 11월 25일 금요일)" placeholderTextColor="#666" value={option.date} onChangeText={(text) => updateUserOption(index, 'date', text)} />
                                <TextInput style={styles.optionInput} placeholder="시간 (예: 저녁 7시)" placeholderTextColor="#666" value={option.time} onChangeText={(text) => updateUserOption(index, 'time', text)} />
                                <TextInput style={[styles.optionInput, styles.locationInput]} placeholder="정확한 만남 장소의 주소 (혹은 상호명)" placeholderTextColor="#666" value={option.location} onChangeText={(text) => updateUserOption(index, 'location', text)} multiline />
                                <HolyButton title="🗺️ 지도에서 장소 찾기" onPress={() => handleOpenMap(index, option.location)} variant="outline" style={{ marginTop: 10 }} />
                            </GlassCard>
                        ))}
                        <HolyButton title="제안 전송하기" onPress={handleSubmitOptions} style={{ marginTop: 20 }} />
                    </ScrollView>
                )}

                {step === 'coordination' && (
                    <ScrollView contentContainerStyle={styles.coordinationContainer}>
                        <Text style={styles.coordinationTitle}>📨 제안이 전송되었습니다</Text>
                        <Text style={styles.coordinationSubtitle}>
                            상대방에게 약속 제안을 하였습니다.{'\n'}
                            상대방이 수락하거나 다른 제안을 하면{'\n'}
                            알림으로 알려드리겠습니다.
                        </Text>

                        <View style={{ marginTop: 30, marginBottom: 30 }}>
                            <Text style={{ color: '#666', textAlign: 'center', fontSize: 14 }}>
                                (개발용 시뮬레이션: 상대방이 수락했다고 가정합니다)
                            </Text>
                        </View>

                        <HolyButton title="✅ [시뮬레이션] 상대방 수락 확인" onPress={handleAgreeOption} style={{ marginTop: 20 }} />
                    </ScrollView>
                )}

                {step === 'profileReveal' && (
                    <ScrollView contentContainerStyle={styles.revealContainer}>
                        <Text style={styles.revealTitle}>✨ 상대방의 프로필이 공개됩니다</Text>
                        <GlassCard style={styles.profileCard}>
                            <View style={styles.imageContainer}>
                                <Image source={{ uri: matchProfile.realImage }} style={styles.profileImage} resizeMode="cover" />
                            </View>
                            <View style={styles.profileInfo}>
                                <Text style={styles.profileName}>{matchProfile.name}</Text>
                                <Text style={styles.profileAge}>{matchProfile.age}세</Text>
                                <View style={styles.divider} />
                                <Text style={styles.profileKeyword}>당신처럼 '{matchProfile.keyword}'이{'\n'}강점인 영혼입니다</Text>
                            </View>
                        </GlassCard>

                        <GlassCard style={styles.meetingReminder}>
                            <Text style={styles.reminderTitle}>📅 만남 일정</Text>
                            <Text style={styles.reminderText}>
                                {agreedOption.date} {agreedOption.time}{'\n'}
                                {agreedOption.location}
                            </Text>
                        </GlassCard>

                        <HolyButton title="📜 비밀 지령 확인하기" onPress={handleRevealComplete} style={{ marginTop: 20 }} />
                    </ScrollView>
                )}

                {/* Mission Modal */}
                <Modal visible={missionModalVisible} transparent={true} animationType="fade">
                    <View style={styles.missionModalOverlay}>
                        <GlassCard style={styles.missionEnvelope}>
                            <View style={styles.envelopeHeader}>
                                <Text style={styles.envelopeIcon}>📩</Text>
                                <Text style={styles.envelopeTitle}>비밀 지령 도착</Text>
                            </View>
                            <View style={styles.dividerGold} />
                            <Text style={styles.secretWarning}>
                                이 지령은 오직 당신에게만 보입니다.{'\n'}
                                상대방에게 들키지 않고 수행해야 합니다.
                            </Text>
                            <GlassCard style={styles.missionBox} variant="light">
                                <Text style={styles.missionLabel}>MISSION</Text>
                                <Text style={styles.missionContent}>{secretMission}</Text>
                            </GlassCard>
                            <Text style={styles.missionNote}>수행 완료 후, 앱에 기록을 남기면{'\n'}관계의 운명이 결정됩니다.</Text>
                            <HolyButton title="지령 수락하기" onPress={handleAcceptDirective} style={{ width: '100%' }} />
                        </GlassCard>
                    </View>
                </Modal>

                {/* Post-Meeting Review Modal */}
                <Modal visible={reviewModalVisible} animationType="slide" transparent={true}>
                    <View style={styles.reviewModalOverlay}>
                        <ScrollView contentContainerStyle={styles.reviewScrollContent}>
                            <GlassCard style={styles.reviewModal}>
                                <Text style={styles.reviewTitle}>만남의 파동 기록</Text>
                                <Text style={styles.reviewSubtitle}>
                                    그 사람과의 만남은 어떠셨나요?{'\n'}
                                    솔직한 감정을 기록해주세요.
                                </Text>

                                <TextInput
                                    style={styles.reviewInput}
                                    placeholder="당신의 느낌, 대화의 흐름, 그리고 상대방에게서 느낀 에너지를 자유롭게 적어주세요..."
                                    placeholderTextColor="#666"
                                    multiline
                                    value={meetingReview}
                                    onChangeText={setMeetingReview}
                                />

                                {/* AI Analysis Button */}
                                <HolyButton
                                    title="🧠 대화 패턴 AI 분석"
                                    onPress={handleAnalyzeConversation}
                                    variant="secondary"
                                    style={{ marginBottom: 20, width: '100%' }}
                                />

                                {/* Analysis Result Display */}
                                {analysisResult.summary !== '' && (
                                    <View style={styles.analysisSection}>
                                        <Text style={styles.analysisLabel}>📊 분석 요약</Text>
                                        <Text style={styles.analysisContent}>{analysisResult.summary}</Text>
                                        <View style={{ height: 10 }} />
                                        <Text style={styles.analysisLabel}>💡 조언</Text>
                                        <Text style={styles.analysisContent}>{analysisResult.advice}</Text>
                                    </View>
                                )}

                                <Text style={styles.decisionTitle}>이 인연을 어떻게 하시겠습니까?</Text>

                                <HolyButton title="💞 영혼의 결합 (만남 지속)" onPress={handleContinueTogether} style={{ marginBottom: 15, width: '100%' }} />
                                <HolyButton title="🔮 새로운 파동 탐색" onPress={handleSeekingNew} variant="outline" style={{ marginBottom: 12, width: '100%' }} />
                                <HolyButton title="🧘 오직 내면의 성장" onPress={handleSoloFocus} variant="ghost" style={{ width: '100%' }} />
                            </GlassCard>
                        </ScrollView>
                    </View>
                </Modal>

                {/* Map Modal */}
                <Modal visible={mapModalVisible} animationType="slide">
                    <SafeAreaView style={{ flex: 1, backgroundColor: '#000' }}>
                        <View style={{ flexDirection: 'row', justifyContent: 'space-between', padding: 15, backgroundColor: '#111', alignItems: 'center' }}>
                            <Text style={{ color: COLORS.gold, fontSize: 18, fontWeight: 'bold' }}>지도 검색</Text>
                            <TouchableOpacity onPress={() => setMapModalVisible(false)}>
                                <Text style={{ color: '#fff', fontSize: 16 }}>닫기</Text>
                            </TouchableOpacity>
                        </View>
                        {Platform.OS === 'web' ? (
                            <iframe
                                src={currentMapUrl}
                                style={{ flex: 1, border: 'none' }}
                                title="Map"
                            />
                        ) : (
                            <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                                <Text style={{ color: '#fff' }}>WebView Not Available</Text>
                            </View>
                        )}
                        <View style={{ padding: 15, backgroundColor: '#111' }}>
                            <HolyButton title="📍 이 장소 선택하기" onPress={handleSelectLocation} />
                        </View>
                    </SafeAreaView>
                </Modal>

                {/* Ceremony Overlay */}
                {showCeremony && (
                    <Animated.View style={[styles.ceremonyOverlay, { opacity: ceremonyOpacity }]}>
                        <Text style={styles.ceremonyText}>두 영혼의 파동이{'\n'}하나로 이어졌습니다.</Text>
                        <Text style={styles.ceremonySubText}>The Inner Circle</Text>
                    </Animated.View>
                )}
            </SafeAreaView>
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: COLORS.background },
    visualizerBackground: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: 0,
    },
    safeArea: { flex: 1, paddingTop: LAYOUT.safeAreaTop, zIndex: 10 },

    searchingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    searchingText: { color: COLORS.gold, fontSize: 22, textAlign: 'center', lineHeight: 32, fontWeight: '500' },

    matchedContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 20 },
    matchedTitle: { color: COLORS.gold, fontSize: 24, fontWeight: 'bold', marginBottom: 40, textAlign: 'center' },
    profileCard: { width: '100%', maxWidth: 340, padding: 0, marginBottom: 25 },
    imageContainer: { width: '100%', height: 300, position: 'relative' },
    profileImage: { width: '100%', height: '100%' },
    imageOverlay: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0, 0, 0, 0.5)', justifyContent: 'center', alignItems: 'center' },
    mysteryText: { color: COLORS.gold, fontSize: 90, fontWeight: 'bold', opacity: 0.9 },
    profileInfo: { padding: 25, alignItems: 'center' },
    profileName: { color: COLORS.gold, fontSize: 30, fontWeight: 'bold', marginBottom: 8 },
    profileAge: { color: '#999', fontSize: 16, marginBottom: 15 },
    divider: { width: 60, height: 1, backgroundColor: COLORS.gold, opacity: 0.5, marginBottom: 15 },
    profileKeyword: { color: '#ccc', fontSize: 17, textAlign: 'center', lineHeight: 26, fontStyle: 'italic' },
    infoText: { color: '#888', fontSize: 13, textAlign: 'center', marginBottom: 30, fontStyle: 'italic' },

    optionInputContainer: { flexGrow: 1, paddingHorizontal: 20, paddingVertical: 40 },
    optionTitle: { color: COLORS.gold, fontSize: 24, fontWeight: 'bold', textAlign: 'center', marginBottom: 10 },
    optionSubtitle: { color: '#999', fontSize: 14 },
    optionCard: { marginTop: 20 },
    optionLabel: { color: COLORS.gold, fontSize: 16, fontWeight: 'bold', marginBottom: 15 },
    optionInput: { backgroundColor: 'rgba(255,255,255,0.05)', color: '#fff', borderRadius: 10, padding: 12, fontSize: 15, marginBottom: 10, borderWidth: 1, borderColor: '#333' },
    locationInput: { height: 60, textAlignVertical: 'top' },

    coordinationContainer: { flexGrow: 1, paddingHorizontal: 20, paddingVertical: 40 },
    coordinationTitle: { color: COLORS.gold, fontSize: 26, fontWeight: 'bold', textAlign: 'center', marginBottom: 15 },
    coordinationSubtitle: { color: '#999', fontSize: 15, textAlign: 'center', marginBottom: 30, lineHeight: 22 },
    agreedCard: { backgroundColor: COLORS.gold, marginBottom: 30 },
    agreedLabel: { color: '#000', fontSize: 18, fontWeight: 'bold', marginBottom: 15, textAlign: 'center' },
    agreedDetails: { alignItems: 'center' },
    agreedDate: { color: '#000', fontSize: 20, fontWeight: 'bold', marginBottom: 5 },
    agreedTime: { color: '#000', fontSize: 18, marginBottom: 10 },
    agreedLocation: { color: '#000', fontSize: 16, textAlign: 'center', lineHeight: 22 },
    partnerOptionsTitle: { color: '#999', fontSize: 14, marginBottom: 15 },
    partnerOptionCard: { marginBottom: 10 },
    partnerOptionLabel: { color: COLORS.gold, fontSize: 14, fontWeight: 'bold', marginBottom: 8 },
    partnerOptionText: { color: '#ccc', fontSize: 14, marginBottom: 5 },
    partnerOptionLocation: { color: '#999', fontSize: 13 },

    revealContainer: { flexGrow: 1, paddingHorizontal: 20, paddingVertical: 40, alignItems: 'center' },
    revealTitle: { color: COLORS.gold, fontSize: 24, fontWeight: 'bold', marginBottom: 30, textAlign: 'center' },
    meetingReminder: { width: '100%', marginBottom: 25 },
    reminderTitle: { color: COLORS.gold, fontSize: 16, fontWeight: 'bold', marginBottom: 12, textAlign: 'center' },
    reminderText: { color: '#fff', fontSize: 15, textAlign: 'center', lineHeight: 24 },

    missionModalOverlay: { flex: 1, backgroundColor: 'rgba(0, 0, 0, 0.95)', justifyContent: 'center', alignItems: 'center', paddingHorizontal: 20 },
    missionEnvelope: { width: '100%', maxWidth: 400, padding: 30 },
    envelopeHeader: { alignItems: 'center', marginBottom: 20 },
    envelopeIcon: { fontSize: 50, marginBottom: 10 },
    envelopeTitle: { color: COLORS.gold, fontSize: 22, fontWeight: 'bold', letterSpacing: 1, textAlign: 'center' },
    dividerGold: { width: '100%', height: 1, backgroundColor: COLORS.gold, opacity: 0.4, marginBottom: 25 },
    secretWarning: { color: '#ff6b6b', fontSize: 14, textAlign: 'center', lineHeight: 22, marginBottom: 25 },
    missionBox: { padding: 20, marginBottom: 20 },
    missionLabel: { color: COLORS.gold, fontSize: 14, fontWeight: 'bold', marginBottom: 12, letterSpacing: 1 },
    missionContent: { color: '#fff', fontSize: 17, lineHeight: 26, fontStyle: 'italic' },
    missionNote: { color: '#888', fontSize: 13, textAlign: 'center', fontStyle: 'italic', marginBottom: 25 },

    reviewModalOverlay: { flex: 1, backgroundColor: 'rgba(0, 0, 0, 0.95)' },
    reviewScrollContent: { flexGrow: 1, justifyContent: 'center', paddingVertical: 40, paddingHorizontal: 20 },
    reviewModal: { padding: 30 },
    reviewTitle: { color: COLORS.gold, fontSize: 26, fontWeight: 'bold', textAlign: 'center', marginBottom: 15 },
    reviewSubtitle: { color: '#999', fontSize: 15, textAlign: 'center', lineHeight: 22, marginBottom: 25 },
    reviewInput: { width: '100%', height: 140, backgroundColor: 'rgba(255,255,255,0.05)', color: '#fff', borderRadius: 15, padding: 18, fontSize: 16, textAlignVertical: 'top', marginBottom: 25, borderWidth: 1, borderColor: COLORS.gold },
    decisionTitle: { color: COLORS.gold, fontSize: 18, fontWeight: 'bold', textAlign: 'center', marginBottom: 20 },

    ceremonyOverlay: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'black', justifyContent: 'center', alignItems: 'center', zIndex: 100 },
    ceremonyText: { color: COLORS.gold, fontSize: 28, fontWeight: 'bold', textAlign: 'center', lineHeight: 40, marginBottom: 20 },
    ceremonySubText: { color: '#888', fontSize: 16, letterSpacing: 3, textTransform: 'uppercase' },

    analysisSection: { marginBottom: 20 },
    analysisLabel: { color: COLORS.gold, fontSize: 16, fontWeight: 'bold', marginBottom: 8 },
    analysisContent: { color: '#ccc', fontSize: 15, lineHeight: 24 },
});

export default MatchScreen;
