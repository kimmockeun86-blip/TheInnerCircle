import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal, TextInput, ScrollView, SafeAreaView, Alert, Image, Platform, useWindowDimensions, ActivityIndicator } from 'react-native';
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
import notificationService from '../services/NotificationService';

// Couple placeholder image - 솔로모드와 유사한 스타일
const couplePlaceholder = require('../../assets/couple_placeholder.png');


interface MissionHistoryEntry {
    day: number;
    date: string;
    reflection: string;
    mission: string;
    analysis: string;
    feedback: string;
    imageUri?: string;
}

const CouplesMissionScreen = () => {
    const navigation = useNavigation<StackNavigationProp<RootStackParamList>>();
    const { width: SCREEN_WIDTH } = useWindowDimensions();

    // Core States
    const [name, setName] = useState('');
    const [partnerName, setPartnerName] = useState('연인');
    const [daysTogether, setDaysTogether] = useState(1);
    const [missionHistory, setMissionHistory] = useState<MissionHistoryEntry[]>([]);
    const [isSpecialMission, setIsSpecialMission] = useState(false);

    // UI States
    const [journalModalVisible, setJournalModalVisible] = useState(false);
    const [historyModalVisible, setHistoryModalVisible] = useState(false);
    const [analysisModalVisible, setAnalysisModalVisible] = useState(false);

    const [reflection, setReflection] = useState('');
    const [selectedImage, setSelectedImage] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [aiAnalysis, setAiAnalysis] = useState<string | null>(null);
    const [aiFeedback, setAiFeedback] = useState<string | null>(null);
    const [currentMissionText, setCurrentMissionText] = useState<string>('');
    const [couplePhoto, setCouplePhoto] = useState<string | null>(null);

    // Relationship Level System
    const [relationshipLevel, setRelationshipLevel] = useState(1);
    const [relationshipPhase, setRelationshipPhase] = useState('탐색기');
    const [nextMissionUnlockTime, setNextMissionUnlockTime] = useState<string | null>(null);


    // Visualizer Mode
    const visualizerMode = isLoading ? 'thinking' : (analysisModalVisible ? 'speaking' : 'listening');

    // Load Data
    const loadData = async () => {
        try {
            const storedName = await AsyncStorage.getItem('userName');
            if (storedName) setName(storedName);

            const storedDay = await AsyncStorage.getItem('coupleDayCount');
            let currentDay = storedDay ? parseInt(storedDay, 10) : 1;

            // Check if mission is unlocked (9 AM system)
            const lastCompletedDate = await AsyncStorage.getItem('coupleLastCompletedDate');
            let canUnlock = true;

            if (lastCompletedDate) {
                const now = new Date();
                const lastDate = new Date(lastCompletedDate);
                const isSameDay = now.getDate() === lastDate.getDate() &&
                    now.getMonth() === lastDate.getMonth() &&
                    now.getFullYear() === lastDate.getFullYear();

                const unlockHour = 9;
                const currentHour = now.getHours();

                if (isSameDay) {
                    const tomorrow = new Date(now);
                    tomorrow.setDate(tomorrow.getDate() + 1);
                    tomorrow.setHours(unlockHour, 0, 0, 0);
                    setNextMissionUnlockTime(tomorrow.toLocaleString());
                    await notificationService.scheduleMissionNotification();
                    canUnlock = false;
                } else if (currentHour < unlockHour) {
                    const todayUnlock = new Date(now);
                    todayUnlock.setHours(unlockHour, 0, 0, 0);
                    setNextMissionUnlockTime(todayUnlock.toLocaleString());
                    await notificationService.scheduleMissionNotification();
                    canUnlock = false;
                } else {
                    setNextMissionUnlockTime(null);
                    canUnlock = true;
                }
            }

            // If unlocked (new day after 9 AM), increase day count
            if (canUnlock && lastCompletedDate) {
                currentDay = currentDay + 1;
                await AsyncStorage.setItem('coupleDayCount', currentDay.toString());
                console.log(`[ORBIT Couple] 🌅 새로운 날! Day ${currentDay} 시작`);

                // Load next mission that was saved yesterday
                const savedNextMission = await AsyncStorage.getItem('coupleNextMission');
                if (savedNextMission) {
                    await AsyncStorage.setItem(`couple_mission_day_${currentDay}`, savedNextMission);
                    await AsyncStorage.removeItem('coupleNextMission');
                }

                // Clear last completed date to prevent repeated increases
                await AsyncStorage.removeItem('coupleLastCompletedDate');
            }

            setDaysTogether(currentDay);
            setIsSpecialMission(currentDay % 10 === 0);

            // Load Relationship Level from separate storage (not calculated from dayCount)
            const storedRelLevel = await AsyncStorage.getItem('coupleRelationshipLevel');
            const level = storedRelLevel ? parseInt(storedRelLevel, 10) : 1;
            setRelationshipLevel(level);
            const phases = ['탐색기', '친밀기', '교감기', '몰입기', '심화기', '융합기', '영혼의 결합'];
            setRelationshipPhase(phases[level - 1] || '탐색기');

            // Load History
            const storedHistory = await AsyncStorage.getItem('coupleMissionHistory');
            if (storedHistory) {
                setMissionHistory(JSON.parse(storedHistory));
            }

            // Load Couple Photo
            const storedCouplePhoto = await AsyncStorage.getItem('couplePhoto');
            if (storedCouplePhoto) setCouplePhoto(storedCouplePhoto);

            // Load Current Mission
            const storedMission = await AsyncStorage.getItem(`couple_mission_day_${currentDay}`);
            const storedAnalysis = await AsyncStorage.getItem(`couple_analysis_day_${currentDay}`);
            const storedFeedback = await AsyncStorage.getItem(`couple_feedback_day_${currentDay}`);

            if (storedAnalysis) setAiAnalysis(storedAnalysis);
            if (storedFeedback) setAiFeedback(storedFeedback);

            if (storedMission) {
                setCurrentMissionText(storedMission);
            } else {
                if (currentDay === 1) {
                    const coupleProfileStr = await AsyncStorage.getItem('coupleProfile');
                    if (coupleProfileStr) {
                        setIsLoading(true);
                        try {
                            const coupleProfile = JSON.parse(coupleProfileStr);
                            const result = await api.analyzeCoupleProfile(coupleProfile);
                            if (result.success) {
                                setCurrentMissionText(result.recommendedMission);
                                setAiAnalysis(result.analysis);
                                await AsyncStorage.setItem(`couple_mission_day_1`, result.recommendedMission);
                                await AsyncStorage.setItem(`couple_analysis_day_1`, result.analysis);
                                setAnalysisModalVisible(true);
                            }
                        } catch (e) {
                            console.error('Initial analysis failed:', e);
                        } finally {
                            setIsLoading(false);
                        }
                    }
                } else {
                    setCurrentMissionText(currentDay % 10 === 0
                        ? "오늘은 특별한 날입니다. 서로의 영혼을 깊이 들여다보십시오."
                        : "서로의 눈을 1분간 바라보며 침묵 속의 대화를 나누십시오.");
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
    };

    // Pick Couple Photo
    const pickCouplePhoto = async () => {
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
                setAiAnalysis(data.analysis);
                setAiFeedback(data.feedback);

                // Update Relationship Level if provided
                if (data.relationshipLevel) {
                    setRelationshipLevel(data.relationshipLevel);
                }
                if (data.relationshipPhase) {
                    setRelationshipPhase(data.relationshipPhase);
                }

                await AsyncStorage.setItem(`couple_analysis_day_${daysTogether}`, data.analysis);
                if (data.feedback) {
                    await AsyncStorage.setItem(`couple_feedback_day_${daysTogether}`, data.feedback);
                }

                if (data.nextMission) {
                    if (daysTogether === 1 && !currentMissionText) {
                        await AsyncStorage.setItem(`couple_mission_day_1`, data.nextMission);
                        setCurrentMissionText(data.nextMission);

                        const today = new Date().toLocaleDateString();
                        const newEntry = {
                            day: 1,
                            date: today,
                            reflection: reflection,
                            mission: "첫 만남의 기록",
                            analysis: data.analysis,
                            feedback: data.feedback || "피드백 없음",
                            imageUri: selectedImage || undefined
                        };
                        const updatedHistory = [newEntry, ...missionHistory];
                        setMissionHistory(updatedHistory);
                        await AsyncStorage.setItem('coupleMissionHistory', JSON.stringify(updatedHistory));

                        setReflection('');
                        setSelectedImage(null);
                        setJournalModalVisible(false);
                        setAnalysisModalVisible(true);
                        return;
                    }

                    const nextDay = daysTogether + 1;
                    await AsyncStorage.setItem(`couple_mission_day_${nextDay}`, data.nextMission);
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

                // Relationship Level progression (separate from Day)
                // Day는 날짜 기반 (loadData에서 처리), 여기서는 레벨만 결정
                const storedRelLevel = await AsyncStorage.getItem('coupleRelationshipLevel');
                let currentRelLevel = storedRelLevel ? parseInt(storedRelLevel, 10) : 1;

                // Check if relationship should progress (from AI response if available)
                const shouldProgress = data.shouldProgress !== false;
                if (shouldProgress) {
                    const newLevel = Math.min(currentRelLevel + 1, 7);
                    setRelationshipLevel(newLevel);
                    await AsyncStorage.setItem('coupleRelationshipLevel', newLevel.toString());
                    const phases = ['탐색기', '친밀기', '교감기', '몰입기', '심화기', '융합기', '영혼의 결합'];
                    setRelationshipPhase(phases[newLevel - 1] || '탐색기');
                    console.log(`[ORBIT Couple] ✅ Level Up to ${newLevel}`);
                } else {
                    console.log(`[ORBIT Couple] ⏸️ Stay at Level ${currentRelLevel}`);
                }

                // Save next mission for tomorrow (don't increment day now)
                if (data.nextMission) {
                    await AsyncStorage.setItem('coupleNextMission', data.nextMission);
                }

                // Mark today as completed (Day will increase on next 9 AM unlock)
                await AsyncStorage.setItem('coupleLastCompletedDate', new Date().toISOString());

                // Set lock time for tomorrow 9 AM
                const tomorrow = new Date();
                tomorrow.setDate(tomorrow.getDate() + 1);
                tomorrow.setHours(9, 0, 0, 0);
                setNextMissionUnlockTime(tomorrow.toLocaleString());

                setReflection('');
                setSelectedImage(null);
                setJournalModalVisible(false);
                setAnalysisModalVisible(true);

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
            {/* Background - Same as HomeScreen */}
            <View style={styles.visualizerBackground}>
                <MysticVisualizer
                    isActive={true}
                    mode={visualizerMode}
                    sceneUrl="https://prod.spline.design/gjz7s8UmZl4fmUa7/scene.splinecode"
                />
            </View>

            <SafeAreaView style={styles.safeArea}>
                {/* Header - Same as HomeScreen */}
                <View style={styles.header}>
                    <Text style={styles.headerTitle}>ORBIT</Text>
                </View>


                <ScrollView contentContainerStyle={styles.scrollContent}>
                    <View style={styles.mainContent}>
                        {/* Day Counter */}
                        <Text style={styles.dayText}>Day {daysTogether}</Text>
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
                                <Image source={couplePlaceholder} style={styles.userPhoto} />
                            )}
                        </TouchableOpacity>


                        {/* AI Signal Display */}
                        {aiAnalysis && (
                            <View style={styles.missionContainer}>
                                <GlassCard style={styles.analysisCard}>
                                    <Text style={styles.analysisLabel}>ORBIT'S SIGNAL</Text>
                                    <Text style={styles.analysisText}>{aiAnalysis}</Text>
                                </GlassCard>
                            </View>
                        )}

                        {/* Ritual Card - Same style as HomeScreen */}
                        <View style={styles.missionContainer}>
                            <GlassCard style={[styles.missionCard, isSpecialMission && styles.specialCard, nextMissionUnlockTime && styles.lockedCard]}>
                                <Text style={[styles.missionLabel, isSpecialMission && styles.specialLabel]}>
                                    {isSpecialMission ? "✨ SPECIAL RITUAL" : "TODAY'S CONNECTION"}
                                </Text>
                                {nextMissionUnlockTime ? (
                                    <View style={styles.lockedMissionContainer}>
                                        <Text style={styles.lockedIcon}>◯</Text>
                                        <Text style={styles.lockedText}>미션이 잠겨 있습니다</Text>
                                        <Text style={styles.unlockTimeText}>
                                            공개 예정: {nextMissionUnlockTime}
                                        </Text>
                                        <Text style={styles.unlockHint}>
                                            다음날 오전 9시에 새로운 미션이 공개됩니다
                                        </Text>
                                    </View>
                                ) : (
                                    <Text style={styles.missionText}>
                                        {currentMissionText || "리추얼을 불러오는 중..."}
                                    </Text>
                                )}
                            </GlassCard>
                        </View>


                        {/* Action Button */}
                        <HolyButton
                            title={currentMissionText ? "나의 수행 기록하기" : "여정 시작하기"}
                            onPress={() => setJournalModalVisible(true)}
                            style={styles.actionButton}
                        />
                    </View>
                </ScrollView>
            </SafeAreaView>

            {/* Journal Modal - Same style as HomeScreen */}
            <Modal visible={journalModalVisible} animationType="slide" transparent={true}>
                <View style={styles.modalOverlay}>
                    <GlassCard style={styles.modalContent}>
                        <Text style={styles.modalTitle}>
                            {currentMissionText ? "커플 리추얼 기록" : "여정의 시작"}
                        </Text>
                        <Text style={styles.modalSubtitle}>
                            {currentMissionText
                                ? "함께 나눈 대화나 감정을 기록해주세요"
                                : "서로에게 하고 싶은 말이나 현재의 마음을 적어주세요"}
                        </Text>

                        <TextInput
                            style={styles.journalInput}
                            placeholder="오늘의 수행을 기록하세요..."
                            placeholderTextColor="#666"
                            multiline
                            value={reflection}
                            onChangeText={setReflection}
                            editable={!isLoading}
                        />

                        <TouchableOpacity onPress={pickImage} style={styles.imagePickerButton}>
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
                                onPress={() => setJournalModalVisible(false)}
                                variant="ghost"
                                style={{ flex: 1, marginRight: 10 }}
                            />
                            <HolyButton
                                title={isLoading ? "분석 중..." : "기록 완료"}
                                onPress={handleAnalyze}
                                disabled={isLoading}
                                style={{ flex: 1 }}
                            />
                        </View>
                    </GlassCard>
                </View>
            </Modal>

            {/* Analysis Result Modal - Same style as HomeScreen */}
            <Modal visible={analysisModalVisible} animationType="fade" transparent={true}>
                <View style={styles.modalOverlay}>
                    <GlassCard style={styles.analysisModalContent}>
                        <Text style={styles.analysisModalTitle}>오르빗의 시그널</Text>
                        <ScrollView style={{ maxHeight: 300 }}>
                            <Text style={styles.analysisModalLabel}>[시그널]</Text>
                            <Text style={styles.analysisModalText}>
                                {aiAnalysis}
                            </Text>
                            {aiFeedback && (
                                <>
                                    <Text style={[styles.analysisModalLabel, { marginTop: 20 }]}>[피드백]</Text>
                                    <Text style={styles.analysisModalText}>
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

            {/* History Modal - Same style as HomeScreen */}
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
                                    <Text style={styles.historyDay}>D + {entry.day} ({entry.date})</Text>
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

const styles = StyleSheet.create({
    // Container - Same as HomeScreen
    container: {
        flex: 1,
        backgroundColor: '#000',
    },
    visualizerBackground: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: 0,
    },
    safeArea: {
        flex: 1,
        zIndex: 10,
    },

    // Header - Same as HomeScreen
    header: {
        width: '100%',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 20,
        paddingTop: Platform.OS === 'android' ? 40 : 20,
        position: 'relative',
    },
    headerTitle: {
        color: '#FFFFFF',
        fontSize: 18,
        fontWeight: 'bold',
        letterSpacing: 3,
        fontFamily: FONTS.title,
    },

    settingsIcon: {
        fontSize: 24,
    },

    // Content - Same as HomeScreen
    scrollContent: {
        flexGrow: 1,
        paddingBottom: 120,
        alignItems: 'center',
    },
    mainContent: {
        paddingHorizontal: 20,
        alignItems: 'center',
        width: '100%',
        maxWidth: 600,
    },

    // Day Display - Modified for Connection
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
        fontFamily: FONTS.title,
    } as any,
    greetingText: {
        color: '#fff',
        fontSize: 24,
        fontWeight: 'bold',
        marginTop: 10,
        marginBottom: 5,
        textAlign: 'center',
        fontFamily: FONTS.serif,
    },
    subText: {
        color: '#888',
        fontSize: 14,
        marginBottom: 30,
        textAlign: 'center',
        fontFamily: FONTS.serif,
    },

    // User Photo - Same as HomeScreen
    userPhotoContainer: {
        marginTop: 35,
        marginBottom: 35,
        alignItems: 'center',
    },
    userPhoto: {
        width: 120,
        height: 120,
        borderRadius: 60,
        borderWidth: 2,
        borderColor: 'rgba(255, 255, 255, 0.6)',
        overflow: 'hidden',
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

    // Mission Card - Same as HomeScreen
    missionContainer: {
        width: '100%',
        marginBottom: 20,
    },
    missionCard: {
        padding: 25,
        alignItems: 'center',
        borderColor: 'rgba(200, 100, 255, 0.3)',
    },
    specialCard: {
        borderColor: '#FF4500',
        backgroundColor: 'rgba(255, 69, 0, 0.1)',
    },
    missionLabel: {
        color: 'rgba(255, 255, 255, 0.6)',
        fontSize: 12,
        fontWeight: 'bold',
        letterSpacing: 2,
        marginBottom: 15,
        fontFamily: FONTS.title,
    },
    specialLabel: {
        color: '#FFFFFF',
    },
    missionText: {
        color: '#fff',
        fontSize: 18,
        textAlign: 'center',
        lineHeight: 28,
        fontFamily: FONTS.serif,
    },

    // Locked Mission Styles
    lockedCard: {
        borderColor: 'rgba(100, 100, 100, 0.4)',
        backgroundColor: 'rgba(50, 50, 50, 0.3)',
    },
    lockedMissionContainer: {
        alignItems: 'center',
        paddingVertical: 15,
    },
    lockedIcon: {
        fontSize: 40,
        marginBottom: 10,
    },
    lockedText: {
        color: '#888',
        fontSize: 16,
        fontWeight: 'bold',
        marginBottom: 8,
    },
    unlockTimeText: {
        color: COLORS.gold,
        fontSize: 14,
        marginBottom: 5,
    },
    unlockHint: {
        color: '#666',
        fontSize: 12,
        textAlign: 'center',
    },


    // Analysis Card
    analysisCard: {
        padding: 20,
        backgroundColor: 'rgba(200, 100, 255, 0.05)',
        borderColor: 'rgba(200, 100, 255, 0.3)',
    },
    analysisLabel: {
        color: COLORS.gold,
        fontSize: 12,
        fontWeight: 'bold',
        letterSpacing: 2,
        marginBottom: 10,
        fontFamily: FONTS.title,
    },
    analysisText: {
        color: '#ddd',
        fontSize: 15,
        lineHeight: 24,
        fontFamily: FONTS.serif,
    },

    // Buttons
    actionButton: {
        width: '100%',
        marginTop: 20,
    },
    historyButton: {
        marginTop: 15,
        padding: 10,
    },
    historyButtonText: {
        color: 'rgba(255, 255, 255, 0.6)',
        fontSize: 14,
        fontFamily: FONTS.serif,
    },

    // Modal - Same as HomeScreen
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.85)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
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
    analysisModalTitle: {
        color: COLORS.gold,
        fontSize: 20,
        fontWeight: 'bold',
        marginBottom: 15,
        textAlign: 'center',
        fontFamily: FONTS.serif,
    },
    analysisModalLabel: {
        color: '#aaa',
        fontSize: 12,
        fontWeight: 'bold',
        marginBottom: 5,
        fontFamily: FONTS.serif,
    },
    analysisModalText: {
        color: '#ddd',
        fontSize: 15,
        lineHeight: 24,
        fontFamily: FONTS.serif,
    },

    // History Modal - Same as HomeScreen
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

    // Level Badge
    levelBadge: {
        paddingHorizontal: 18,
        paddingVertical: 10,
        borderRadius: 25,
        borderWidth: 2,
        borderColor: 'rgba(255, 100, 150, 0.6)',
        backgroundColor: 'rgba(150, 40, 80, 0.25)',
        marginBottom: 20,
        ...(Platform.OS === 'web'
            ? { boxShadow: '0 0 10px rgba(255, 100, 150, 0.4)' }
            : {
                shadowColor: '#FF6496',
                shadowOffset: { width: 0, height: 0 },
                shadowOpacity: 0.4,
                shadowRadius: 10,
            }
        ),
        elevation: 5,
    } as any,
    levelBadgeText: {
        color: '#FFCCE0',
        fontSize: 13,
        fontWeight: 'bold',
        letterSpacing: 1.5,
        fontFamily: FONTS.title,
    },
});


export default CouplesMissionScreen;
