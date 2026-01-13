import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal, TextInput, ScrollView, SafeAreaView, Alert, Image, Platform, useWindowDimensions, ActivityIndicator, KeyboardAvoidingView, TouchableWithoutFeedback, Keyboard } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import MysticVisualizer from '../components/MysticVisualizer';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../types/navigation';
import GlassCard from '../components/GlassCard';
import HolyButton from '../components/HolyButton';
import { COLORS, FONTS } from '../theme/theme';
import * as ImagePicker from 'expo-image-picker';
import { api } from '../services/api';
import { LinearGradient } from 'expo-linear-gradient';

const cosmicBackground = require('../../assets/cosmic_background.png');

interface MissionHistoryEntry {
    day: number;
    date: string;
    reflection: string;
    mission: string;
    analysis: string;
    feedback: string;
    imageUri?: string;
}

const ConnectionsScreen = () => {
    const navigation = useNavigation<StackNavigationProp<RootStackParamList>>();
    const { width: SCREEN_WIDTH } = useWindowDimensions();

    const [daysTogether, setDaysTogether] = useState(1);
    const [missionHistory, setMissionHistory] = useState<MissionHistoryEntry[]>([]);
    const [isSpecialMission, setIsSpecialMission] = useState(false);
    const [relationshipLevel, setRelationshipLevel] = useState(1);
    const [relationshipPhase, setRelationshipPhase] = useState('탐색기');

    // UI States matching HomeScreen
    const [journalModalVisible, setJournalModalVisible] = useState(false);
    const [historyModalVisible, setHistoryModalVisible] = useState(false);
    const [analysisModalVisible, setAnalysisModalVisible] = useState(false);

    const [reflection, setReflection] = useState('');
    const [selectedImage, setSelectedImage] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [aiAnalysis, setAiAnalysis] = useState<string | null>(null); // Insight
    const [aiFeedback, setAiFeedback] = useState<string | null>(null); // Feedback
    const [currentMissionText, setCurrentMissionText] = useState<string>('');
    const [couplePhoto, setCouplePhoto] = useState<string | null>(null);

    // Visualizer Mode Logic
    const visualizerMode = isLoading ? 'thinking' : (analysisModalVisible ? 'speaking' : 'listening');

    // Load Data
    const loadData = async () => {
        try {
            const storedDay = await AsyncStorage.getItem('coupleDayCount');
            const currentDay = storedDay ? parseInt(storedDay, 10) : 1;
            setDaysTogether(currentDay);
            setIsSpecialMission(currentDay % 10 === 0);

            // Calculate relationship level
            const level = Math.min(Math.ceil(currentDay / 10), 7);
            setRelationshipLevel(level);
            const phases = ['탐색기', '친밀기', '교감기', '몰입기', '심화기', '융합기', '완전체'];
            setRelationshipPhase(phases[level - 1] || '탐색기');

            // Load History
            const storedHistory = await AsyncStorage.getItem('coupleMissionHistory');
            if (storedHistory) {
                setMissionHistory(JSON.parse(storedHistory));
            }

            // Load Couple Photo
            const storedCouplePhoto = await AsyncStorage.getItem('couplePhoto');
            if (storedCouplePhoto) setCouplePhoto(storedCouplePhoto);


            // Load Current Mission Text
            const storedMission = await AsyncStorage.getItem(`couple_mission_day_${currentDay}`);

            // Load Previous Analysis if exists for this day
            const storedAnalysis = await AsyncStorage.getItem(`couple_analysis_day_${currentDay}`);
            if (storedAnalysis) {
                setAiAnalysis(storedAnalysis);
            }

            const storedFeedback = await AsyncStorage.getItem(`couple_feedback_day_${currentDay}`);
            if (storedFeedback) {
                setAiFeedback(storedFeedback);
            }

            if (storedMission) {
                setCurrentMissionText(storedMission);
            } else {
                // For Day 1, if no mission exists, we try to generate it from profile
                if (currentDay === 1) {
                    const coupleProfileStr = await AsyncStorage.getItem('coupleProfile');
                    if (coupleProfileStr) {
                        setIsLoading(true);
                        try {
                            const coupleProfile = JSON.parse(coupleProfileStr);
                            // Check if we already tried and failed or if we should generate
                            // For now, always try if mission is empty
                            const result = await api.analyzeCoupleProfile(coupleProfile);

                            if (result.success) {
                                setCurrentMissionText(result.recommendedMission);
                                setAiAnalysis(result.analysis);
                                await AsyncStorage.setItem(`couple_mission_day_1`, result.recommendedMission);
                                await AsyncStorage.setItem(`couple_analysis_day_1`, result.analysis);

                                // Show analysis modal immediately to welcome them
                                setAnalysisModalVisible(true);
                            } else {
                                setCurrentMissionText(''); // Fallback to manual start
                            }
                        } catch (e) {
                            console.error('Initial analysis failed:', e);
                            setCurrentMissionText('');
                        } finally {
                            setIsLoading(false);
                        }
                    } else {
                        setCurrentMissionText(''); // No profile, manual start
                    }
                } else {
                    setCurrentMissionText(currentDay % 10 === 0
                        ? "오늘은 특별한 날입니다. 서로의 영혼을 깊이 들여다보고, 지금까지의 여정을 기념하십시오."
                        : "오늘 하루, 서로의 눈을 1분간 바라보며 침묵 속의 대화를 나누십시오.");
                }
            }

        } catch (e) {
            console.error('Failed to load couple data:', e);
        }
    };

    useFocusEffect(
        useCallback(() => {
            loadData();
        }, [])
    );

    const pickImage = async () => {
        // 웹에서는 직접 file input 사용
        if (Platform.OS === 'web') {
            const input = document.createElement('input');
            input.type = 'file';
            input.accept = 'image/*';
            input.onchange = (e: any) => {
                const file = e.target.files[0];
                if (file) {
                    const reader = new FileReader();
                    reader.onload = (event: any) => {
                        setSelectedImage(event.target.result);
                    };
                    reader.readAsDataURL(file);
                }
            };
            input.click();
        } else {
            // 모바일에서는 기존 Alert 사용
            Alert.alert(
                "사진 추가",
                "사진을 가져올 방법을 선택하세요.",
                [
                    {
                        text: "카메라로 촬영",
                        onPress: async () => {
                            const { status } = await ImagePicker.requestCameraPermissionsAsync();
                            if (status !== 'granted') {
                                Alert.alert('권한 필요', '카메라 접근 권한이 필요합니다.');
                                return;
                            }
                            const result = await ImagePicker.launchCameraAsync({
                                mediaTypes: ImagePicker.MediaTypeOptions.Images,
                                allowsEditing: false,
                                aspect: [4, 3],
                                quality: 0.8,
                            });
                            if (!result.canceled) {
                                setSelectedImage(result.assets[0].uri);
                            }
                        }
                    },
                    {
                        text: "앨범에서 선택",
                        onPress: async () => {
                            const result = await ImagePicker.launchImageLibraryAsync({
                                mediaTypes: ImagePicker.MediaTypeOptions.Images,
                                allowsEditing: false,
                                aspect: [4, 3],
                                quality: 0.8,
                            });
                            if (!result.canceled) {
                                setSelectedImage(result.assets[0].uri);
                            }
                        }
                    },
                    { text: "취소", style: "cancel" }
                ]
            );
        }
    };

    // Pick Couple Photo
    const pickCouplePhoto = async () => {
        // 웹에서는 직접 file input 사용
        if (Platform.OS === 'web') {
            const input = document.createElement('input');
            input.type = 'file';
            input.accept = 'image/*';
            input.onchange = async (e: any) => {
                const file = e.target.files[0];
                if (file) {
                    const reader = new FileReader();
                    reader.onload = async (event: any) => {
                        const photoUri = event.target.result;
                        setCouplePhoto(photoUri);
                        await AsyncStorage.setItem('couplePhoto', photoUri);
                    };
                    reader.readAsDataURL(file);
                }
            };
            input.click();
        } else {
            // 모바일에서는 기존 Alert 사용
            Alert.alert(
                "커플 사진",
                "둘만의 사진을 추가하세요",
                [
                    {
                        text: "카메라",
                        onPress: async () => {
                            const { status } = await ImagePicker.requestCameraPermissionsAsync();
                            if (status !== 'granted') {
                                Alert.alert('권한 필요', '카메라 접근 권한이 필요합니다.');
                                return;
                            }
                            const result = await ImagePicker.launchCameraAsync({
                                mediaTypes: ImagePicker.MediaTypeOptions.Images,
                                allowsEditing: true,
                                aspect: [1, 1],
                                quality: 0.8,
                            });
                            if (!result.canceled) {
                                const photoUri = result.assets[0].uri;
                                setCouplePhoto(photoUri);
                                await AsyncStorage.setItem('couplePhoto', photoUri);
                            }
                        }
                    },
                    {
                        text: "앨범",
                        onPress: async () => {
                            const result = await ImagePicker.launchImageLibraryAsync({
                                mediaTypes: ImagePicker.MediaTypeOptions.Images,
                                allowsEditing: true,
                                aspect: [1, 1],
                                quality: 0.8,
                            });
                            if (!result.canceled) {
                                const photoUri = result.assets[0].uri;
                                setCouplePhoto(photoUri);
                                await AsyncStorage.setItem('couplePhoto', photoUri);
                            }
                        }
                    },
                    { text: "취소", style: "cancel" }
                ]
            );
        }
    };

    const handleAnalyze = async () => {

        if (reflection.trim().length < 5) {
            Alert.alert('알림', '대화 내용을 조금 더 자세히 적어주세요.');
            return;
        }

        setIsLoading(true);
        try {
            const data = await api.analyzeCoupleChat({
                chat: reflection,
                day: daysTogether,
                isSpecialMission: isSpecialMission
            });

            if (data.success) {
                // Update UI with Analysis immediately
                setAiAnalysis(data.analysis);
                setAiFeedback(data.feedback);

                await AsyncStorage.setItem(`couple_analysis_day_${daysTogether}`, data.analysis);
                if (data.feedback) {
                    await AsyncStorage.setItem(`couple_feedback_day_${daysTogether}`, data.feedback);
                }

                // Save Next Mission
                if (data.nextMission) {
                    // Special Logic for Day 1 Initialization
                    if (daysTogether === 1 && !currentMissionText) {
                        await AsyncStorage.setItem(`couple_mission_day_1`, data.nextMission);
                        setCurrentMissionText(data.nextMission);

                        // Save History (Initial Record)
                        const today = new Date().toLocaleDateString();
                        const newEntry = {
                            day: 1,
                            date: today,
                            reflection: reflection,
                            mission: "첫 만남의 기록", // Placeholder for initial record
                            analysis: data.analysis,
                            feedback: data.feedback || "피드백 없음",
                            imageUri: selectedImage || undefined
                        };
                        const updatedHistory = [newEntry, ...missionHistory];
                        setMissionHistory(updatedHistory);
                        await AsyncStorage.setItem('coupleMissionHistory', JSON.stringify(updatedHistory));

                        // Do NOT increment day. User must now perform the Day 1 mission.
                        setReflection('');
                        setSelectedImage(null);
                        setJournalModalVisible(false);
                        setAnalysisModalVisible(true);
                        await AsyncStorage.setItem('needsReload', 'true');
                        return; // Exit function here
                    }

                    const nextDay = daysTogether + 1;
                    await AsyncStorage.setItem(`couple_mission_day_${nextDay}`, data.nextMission);
                    // Update UI immediately for the next day
                    setCurrentMissionText(data.nextMission);
                }

                // Save History
                const today = new Date().toLocaleDateString();
                const newEntry = {
                    day: daysTogether,
                    date: today,
                    reflection: reflection,
                    mission: currentMissionText,
                    analysis: data.analysis,
                    feedback: data.feedback || "피드백 없음",
                    imageUri: selectedImage || undefined
                };

                const updatedHistory = [newEntry, ...missionHistory];
                setMissionHistory(updatedHistory);
                await AsyncStorage.setItem('coupleMissionHistory', JSON.stringify(updatedHistory));

                // Increment Day
                const nextDay = daysTogether + 1;
                await AsyncStorage.setItem('coupleDayCount', nextDay.toString());
                setDaysTogether(nextDay);
                setIsSpecialMission(nextDay % 10 === 0);

                // Reset Input
                setReflection('');
                setSelectedImage(null);
                setJournalModalVisible(false); // Close Input Modal

                // Show Analysis Modal
                setAnalysisModalVisible(true);

                // Notify Home to reload if needed
                await AsyncStorage.setItem('needsReload', 'true');

            } else {
                Alert.alert('오류', '분석에 실패했습니다.');
            }
        } catch (error: any) {
            console.error('[CouplesMission] Analysis error:', error);
            Alert.alert('오류', '서버 연결에 실패했습니다.\n' + (error.message || ''));
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <View style={styles.container}>
            {/* Background Gradient */}
            <LinearGradient
                colors={['#0f0a1e', '#1a0a2e', '#0f0a1e']}
                style={StyleSheet.absoluteFillObject}
            />
            {/* Cosmic Background Image (나노바나나 제작) */}
            <Image
                source={cosmicBackground}
                style={styles.cosmicBackground}
                resizeMode="cover"
            />
            <View style={styles.visualizerBackground}>
                <MysticVisualizer
                    isActive={true}
                    mode={visualizerMode}
                    sceneUrl="https://prod.spline.design/gjz7s8UmZl4fmUa7/scene.splinecode"
                    style={{ width: '100%', height: '100%' }}
                />
            </View>

            <SafeAreaView style={styles.safeArea}>
                <View style={styles.header}>
                    <TouchableOpacity onPress={() => setHistoryModalVisible(true)} style={styles.iconButton}>
                        <Text style={styles.iconButtonText}>기록</Text>
                    </TouchableOpacity>
                    <Text style={[styles.headerTitle, { flex: 1, textAlign: 'center' }]}>커플 미션</Text>
                    <TouchableOpacity onPress={() => navigation.navigate('Settings')} style={styles.iconButton}>
                        <Text style={styles.iconButtonText}>설정</Text>
                    </TouchableOpacity>
                </View>

                <ScrollView contentContainerStyle={styles.scrollContent}>
                    <View style={styles.mainContent}>
                        {/* Level badge hidden - backend logic preserved */}

                        <Text style={styles.dayText}>
                            Day {daysTogether}
                        </Text>
                        <Text style={styles.greetingText}>
                            인연이 시작된 지 {daysTogether}일째
                        </Text>


                        {/* User Profile Photo - Clickable for upload */}
                        <TouchableOpacity
                            style={styles.userPhotoContainer}
                            onPress={pickCouplePhoto}
                            activeOpacity={0.8}
                        >
                            {couplePhoto ? (
                                <Image source={{ uri: couplePhoto }} style={styles.userPhoto} />
                            ) : (
                                <View style={styles.userPhoto}>
                                    <Text style={{ fontSize: 40, opacity: 0.5 }}>💑</Text>
                                </View>
                            )}
                        </TouchableOpacity>


                        {/* AI Analysis Display (Same as HomeScreen) */}
                        {aiAnalysis && (
                            <View style={styles.missionContainer}>
                                <GlassCard style={styles.analysisCard}>
                                    <Text style={styles.analysisTitle}>오르빗의 시그널</Text>
                                    <ScrollView style={{ maxHeight: 200 }} nestedScrollEnabled={true}>
                                        <Text style={[styles.analysisText, { flexWrap: 'wrap' }]}>{aiAnalysis}</Text>
                                    </ScrollView>
                                </GlassCard>
                            </View>
                        )}

                        <View style={styles.missionContainer}>
                            <GlassCard style={[styles.missionCard, isSpecialMission && styles.specialCard]}>
                                <Text style={[styles.missionTitle, isSpecialMission && styles.specialText]}>
                                    {isSpecialMission ? "특별 지령" : "오늘의 리추얼"}
                                </Text>
                                <Text style={styles.missionText}>
                                    {currentMissionText}
                                </Text>
                            </GlassCard>
                        </View>

                        <HolyButton
                            title={currentMissionText ? "리추얼 수행 완료" : "여정 시작하기"}
                            onPress={() => setJournalModalVisible(true)}
                            style={{ width: '100%', marginTop: 20 }}
                        />
                    </View>
                </ScrollView>
            </SafeAreaView>

            {/* Input Modal - Identical to HomeScreen Journal Modal */}
            <Modal visible={journalModalVisible} animationType="slide" transparent={true}>
                <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
                    <KeyboardAvoidingView
                        style={styles.modalOverlay}
                        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
                        keyboardVerticalOffset={Platform.OS === 'ios' ? 60 : 0}
                    >
                        <ScrollView
                            contentContainerStyle={styles.modalScrollContent}
                            keyboardShouldPersistTaps="handled"
                            showsVerticalScrollIndicator={false}
                            bounces={false}
                        >
                            <GlassCard style={styles.modalContent}>
                                <Text style={styles.modalTitle}>
                                    {currentMissionText ? "커플 미션 기록" : "여정의 시작"}
                                </Text>
                                <Text style={styles.modalSubtitle}>
                                    {currentMissionText
                                        ? "미션을 수행하고 느낌점을 적어주세요. 오늘의 미소도 기록하세요"
                                        : "서로에게 하고 싶은 말이나 현재의 마음을 적어주세요"}
                                </Text>

                                <TextInput
                                    style={styles.journalInput}
                                    placeholder={currentMissionText
                                        ? "예: 오늘 서로 눈을 보며 이런 이야기를 나눠어..."
                                        : "예: 우리가 함께할 이 여정이 기대돼..."}
                                    placeholderTextColor="#666"
                                    multiline
                                    value={reflection}
                                    onChangeText={setReflection}
                                    editable={!isLoading}
                                    returnKeyType="done"
                                    blurOnSubmit={true}
                                />

                                <TouchableOpacity onPress={() => { Keyboard.dismiss(); pickImage(); }} style={styles.imagePickerButton}>
                                    <Text style={styles.imagePickerText}>
                                        {selectedImage ? "사진 변경하기" : "추억을 사진으로 남기세요"}
                                    </Text>
                                </TouchableOpacity>

                                {selectedImage && (
                                    <Image source={{ uri: selectedImage }} style={styles.previewImage} />
                                )}

                                <View style={styles.modalButtons}>
                                    <HolyButton
                                        title="취소"
                                        onPress={() => { Keyboard.dismiss(); setJournalModalVisible(false); }}
                                        variant="ghost"
                                        style={{ flex: 1, marginRight: 10 }}
                                    />
                                    <HolyButton
                                        title={isLoading ? "분석 중..." : "기록 완료"}
                                        onPress={() => { Keyboard.dismiss(); handleAnalyze(); }}
                                        disabled={isLoading}
                                        style={{ flex: 1 }}
                                    />
                                </View>
                            </GlassCard>
                        </ScrollView>
                    </KeyboardAvoidingView>
                </TouchableWithoutFeedback>
            </Modal>

            {/* Analysis Result Modal - Identical to HomeScreen Analysis Modal */}
            <Modal visible={analysisModalVisible} animationType="fade" transparent={true}>
                <View style={styles.modalOverlay}>
                    <GlassCard style={styles.analysisModalContent}>
                        <Text style={styles.analysisTitle}>오르빗의 시그널</Text>
                        <ScrollView style={{ maxHeight: 300 }}>
                            <Text style={styles.analysisSubtitle}>[시그널]</Text>
                            <Text style={styles.analysisText}>
                                {aiAnalysis}
                            </Text>
                            {aiFeedback && (
                                <>
                                    <Text style={[styles.analysisSubtitle, { marginTop: 20 }]}>[피드백]</Text>
                                    <Text style={styles.analysisText}>
                                        {aiFeedback}
                                    </Text>
                                </>
                            )}
                        </ScrollView>

                        <HolyButton
                            title="확인"
                            onPress={() => setAnalysisModalVisible(false)}
                            style={{ marginTop: 20, width: '100%' }}
                        />
                    </GlassCard>
                </View>
            </Modal>

            {/* History Modal - Identical to HomeScreen History Modal */}
            <Modal visible={historyModalVisible} animationType="slide">
                <SafeAreaView style={styles.historyContainer}>
                    <View style={styles.historyHeader}>
                        <Text style={styles.historyTitle}>지난 사랑의 기록</Text>
                        <TouchableOpacity onPress={() => setHistoryModalVisible(false)}>
                            <Text style={styles.closeButton}>닫기</Text>
                        </TouchableOpacity>
                    </View>
                    <ScrollView contentContainerStyle={styles.historyList}>
                        {missionHistory.length === 0 ? (
                            <Text style={styles.emptyHistoryText}>아직 기록된 여정이 없습니다.</Text>
                        ) : (
                            missionHistory.map((entry, index) => (
                                <GlassCard key={index} style={styles.historyCard}>
                                    <Text style={styles.historyDay}>Day {entry.day} ({entry.date})</Text>
                                    <Text style={styles.historyMission}>리추얼: {entry.mission}</Text>
                                    <Text style={styles.historyContent}>"{entry.reflection}"</Text>
                                    {entry.imageUri && (
                                        <Image source={{ uri: entry.imageUri }} style={styles.historyImage} />
                                    )}
                                    <Text style={styles.historyAnalysis}>오르빗: {entry.analysis}</Text>
                                    {entry.feedback && (
                                        <Text style={styles.historyFeedback}>피드백: {entry.feedback}</Text>
                                    )}
                                </GlassCard>
                            ))
                        )}
                    </ScrollView>
                </SafeAreaView>
            </Modal>
        </View>
    );
};

// Styles copied and adapted from HomeScreen to ensure identical layout
const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: COLORS.background,
    },
    cosmicBackground: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        width: '100%',
        height: '100%',
        zIndex: 0,
    },
    visualizerBackground: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: 1,
        opacity: 0.6, // Allow cosmic background to show through
    },
    safeArea: {
        flex: 1,
        zIndex: 10,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingTop: Platform.OS === 'android' ? 40 : 10,
        paddingBottom: 10,
        width: '100%',
        maxWidth: 600,
        alignSelf: 'center',
    },
    headerTitle: {
        color: COLORS.gold,
        fontSize: 18,
        fontWeight: 'bold',
        letterSpacing: 2,
        fontFamily: FONTS.serif,
        flex: 1,
        textAlign: 'center',
    },
    iconButton: { padding: 10 },
    iconButtonText: { fontSize: 24 },

    scrollContent: {
        flexGrow: 1,
        paddingBottom: 40,
        justifyContent: 'center',
    },
    mainContent: {
        paddingHorizontal: 20,
        alignItems: 'center',
        width: '100%',
        maxWidth: 600,
        alignSelf: 'center',
    },
    levelBadge: {
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: 'rgba(150, 100, 255, 0.6)',
        backgroundColor: 'rgba(100, 50, 150, 0.3)',
        marginBottom: 10,
    },
    levelBadgeText: {
        color: '#E0CFFF',
        fontSize: 12,
        fontWeight: 'bold',
        letterSpacing: 1,
        fontFamily: FONTS.serif,
    },
    dayText: {
        color: '#FFFFFF',
        fontSize: 48,
        fontWeight: 'bold',
        marginTop: 30,
        ...(Platform.OS === 'web'
            ? { textShadow: '0 0 15px rgba(255, 255, 255, 0.3)' }
            : {
                textShadowColor: 'rgba(255, 255, 255, 0.3)',
                textShadowOffset: { width: 0, height: 0 },
                textShadowRadius: 15,
            }
        ),
        fontFamily: FONTS.serif,
    } as any,

    greetingText: {
        color: '#fff',
        fontSize: 28,
        fontWeight: 'bold',
        marginBottom: 10,
        textAlign: 'center',
        fontFamily: FONTS.serif,
    },

    // User Photo - Same as HomeScreen
    userPhotoContainer: {
        marginTop: 10,
        marginBottom: 35,
        alignItems: 'center',
    },
    userPhoto: {
        width: 120,
        height: 120,
        borderRadius: 60,
        borderWidth: 2,
        borderColor: 'rgba(255, 255, 255, 0.6)',
        backgroundColor: 'rgba(0, 0, 0, 0.3)',
        justifyContent: 'center',
        alignItems: 'center',
        ...(Platform.OS === 'web'
            ? { boxShadow: '0 0 15px rgba(255, 255, 255, 0.4), 0 0 30px rgba(255, 255, 255, 0.2)' }
            : {
                shadowColor: '#FFFFFF',
                shadowOffset: { width: 0, height: 0 },
                shadowOpacity: 0.4,
                shadowRadius: 15,
            }
        ),
    } as any,

    missionContainer: {
        width: '100%',
        marginBottom: 20,
    },

    missionCard: {
        padding: 25,
        alignItems: 'center',
    },
    specialCard: {
        borderColor: '#FF4500',
        backgroundColor: 'rgba(255, 69, 0, 0.1)',
    },
    missionTitle: {
        color: COLORS.gold,
        fontSize: 20,
        fontWeight: 'bold',
        marginBottom: 15,
        fontFamily: FONTS.serif,
    },
    missionText: {
        color: '#fff',
        fontSize: 18,
        textAlign: 'center',
        lineHeight: 28,
        fontFamily: FONTS.serif,
    },
    specialText: {
        color: '#FFD700',
    },

    // Analysis Card (on main screen)
    analysisCard: {
        padding: 20,
        marginBottom: 20,
        backgroundColor: 'rgba(255, 215, 0, 0.05)',
        borderColor: 'rgba(255, 215, 0, 0.3)',
    },
    analysisTitle: {
        color: COLORS.gold,
        fontSize: 18,
        fontWeight: 'bold',
        marginBottom: 10,
        fontFamily: FONTS.serif,
    },
    analysisSubtitle: {
        color: '#aaa',
        fontSize: 14,
        fontWeight: 'bold',
        marginBottom: 5,
        fontFamily: FONTS.serif,
    },
    analysisText: {
        color: '#ddd',
        fontSize: 15,
        lineHeight: 24,
        fontFamily: FONTS.serif,
    },

    // Modal Styles
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.8)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    modalScrollContent: {
        flexGrow: 1,
        justifyContent: 'center',
        alignItems: 'center',
        width: '100%',
    },
    modalContent: {
        width: '100%',
        maxWidth: 600,
        padding: 25,
    },
    modalTitle: {
        color: COLORS.gold,
        fontSize: 22,
        fontWeight: 'bold',
        marginBottom: 10,
        textAlign: 'center',
        fontFamily: FONTS.serif,
    },
    modalSubtitle: {
        color: '#ccc',
        fontSize: 14,
        marginBottom: 20,
        textAlign: 'center',
        fontFamily: FONTS.serif,
    },
    journalInput: {
        backgroundColor: 'rgba(255,255,255,0.1)',
        borderRadius: 10,
        padding: 15,
        color: '#fff',
        fontSize: 16,
        height: 150,
        textAlignVertical: 'top',
        marginBottom: 20,
        fontFamily: FONTS.serif,
    },
    imagePickerButton: {
        alignItems: 'center',
        padding: 10,
        marginBottom: 15,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.3)',
        borderRadius: 10,
        borderStyle: 'dashed',
    },
    imagePickerText: {
        color: '#aaa',
        fontSize: 14,
        fontFamily: FONTS.serif,
    },
    previewImage: {
        width: '100%',
        height: 200,
        borderRadius: 10,
        marginBottom: 20,
    },
    modalButtons: {
        flexDirection: 'row',
        justifyContent: 'space-between',
    },

    // Analysis Modal
    analysisModalContent: {
        width: '100%',
        maxWidth: 600,
        padding: 25,
        maxHeight: '80%',
    },

    // History Modal
    historyContainer: {
        flex: 1,
        backgroundColor: COLORS.background,
    },
    historyHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 20,
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(255,255,255,0.1)',
        maxWidth: 600,
        width: '100%',
        alignSelf: 'center',
    },
    historyTitle: {
        color: COLORS.gold,
        fontSize: 20,
        fontWeight: 'bold',
        fontFamily: FONTS.serif,
    },
    closeButton: {
        color: '#fff',
        fontSize: 16,
        fontFamily: FONTS.serif,
    },
    historyList: {
        padding: 20,
        maxWidth: 600,
        width: '100%',
        alignSelf: 'center',
    },
    historyCard: {
        padding: 20,
        marginBottom: 15,
    },
    historyDay: {
        color: COLORS.gold,
        fontSize: 16,
        fontWeight: 'bold',
        marginBottom: 5,
        fontFamily: FONTS.serif,
    },
    historyMission: {
        color: '#fff',
        fontSize: 14,
        marginBottom: 5,
        fontFamily: FONTS.serif,
    },
    historyContent: {
        color: '#fff',
        fontSize: 15,
        lineHeight: 22,
        fontFamily: FONTS.serif,
    },
    historyImage: {
        width: '100%',
        height: 200,
        borderRadius: 10,
        marginTop: 15,
    },
    historyAnalysis: {
        color: '#aaa',
        fontSize: 13,
        lineHeight: 20,
        marginTop: 10,
        fontFamily: FONTS.serif,
    },
    historyFeedback: {
        color: '#888',
        fontSize: 13,
        lineHeight: 20,
        marginTop: 5,
        fontFamily: FONTS.serif,
        fontStyle: 'italic',
    },
    emptyHistoryText: {
        color: '#aaa',
        textAlign: 'center',
        marginTop: 50,
        fontFamily: FONTS.serif,
    },
});

export default ConnectionsScreen;
