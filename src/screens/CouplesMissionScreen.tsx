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
import notificationService from '../services/NotificationService';
import MatchingService from '../services/MatchingService';
import HeaderSpline from '../components/HeaderSpline';
import { WebView } from 'react-native-webview';
import { LinearGradient } from 'expo-linear-gradient';
import { MISSION_PACKS, getTodaysMission, MissionPack } from '../data/MissionPacks';
import { getTodaysQuestion, CATEGORY_NAMES, DailyQuestion } from '../data/DailyQuestions';
import anniversaryService from '../services/AnniversaryService';

// Couple placeholder image - 솔로모드와 유사한 스타일
const couplePlaceholder = require('../../assets/couple_placeholder.png');
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
    const [countdown, setCountdown] = useState('00:00:00');

    // 아침/점심/저녁 맞춤 조언 상태 (커플 모드)
    const [personalizedAdvice, setPersonalizedAdvice] = useState<{
        advice: string;
        focusPrompt: string;
        timeOfDay: 'morning' | 'noon' | 'evening';
    } | null>(null);

    // 🆕 테마별 미션팩
    const [selectedMissionPack, setSelectedMissionPack] = useState<string>('newlywed');
    const [missionPackModalVisible, setMissionPackModalVisible] = useState(false);

    // 🆕 데일리 질문
    const [todaysQuestion, setTodaysQuestion] = useState<DailyQuestion | null>(null);

    // 🆕 다가오는 기념일
    const [upcomingAnniversaries, setUpcomingAnniversaries] = useState<Array<{ name: string; emoji: string; dDay: number }>>([]);


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
                const unlockHour = 9;

                // "바로 돌아오는 오전 9시" 계산
                const next9AM = new Date(now);
                if (now.getHours() >= unlockHour) {
                    // 오전 9시 이후면 다음날 오전 9시
                    next9AM.setDate(next9AM.getDate() + 1);
                }
                next9AM.setHours(unlockHour, 0, 0, 0);

                // 아직 다음 9시가 안 왔으면 대기
                if (now < next9AM) {
                    setNextMissionUnlockTime(next9AM.toLocaleString());
                    // Notification already scheduled during onboarding
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

            // ============================================
            try {
                // OrbitAdmin API URL (로컬 또는 프로덕션)
                const adminApiUrl = Platform.OS === 'web' && window.location.hostname === 'localhost'
                    ? 'http://localhost:3001'
                    : 'https://orbit-adminfinalfight.onrender.com';
                const userId = await AsyncStorage.getItem('userId') || storedName || '';
                if (userId) {
                    const res = await fetch(`${adminApiUrl}/api/users/${encodeURIComponent(userId)}`);
                    const data = await res.json();
                    if (data.success && data.user?.assignedMission) {
                        // 만료 시간 체크 - 만료되었으면 무시
                        const expiresAt = data.user.missionExpiresAt;
                        const isExpired = expiresAt && new Date(expiresAt._seconds ? expiresAt._seconds * 1000 : expiresAt) < new Date();

                        if (!isExpired) {
                            const adminMission = data.user.assignedMission;
                            console.log(`[ORBIT Couple] 🎯 관리자 미션 발견: ${adminMission}`);
                            setCurrentMissionText(adminMission);
                            await AsyncStorage.setItem(`couple_mission_day_${currentDay}`, adminMission);
                            await AsyncStorage.setItem('hasCoupleAdminMission', 'true'); // 관리자 미션 플래그
                            setAiAnalysis('관리자가 특별히 부여한 리추얼입니다.');
                        } else {
                            console.log('[ORBIT Couple] ⏰ 관리자 미션 만료됨 - AI 미션 사용');
                        }
                    }
                }
            } catch (adminErr) {
                console.log('[ORBIT Couple] 관리자 서버 연결 실패 (정상 - 로컬 미션 사용)');
            }

            // Load Current Mission (로컬 저장소)
            const storedMission = await AsyncStorage.getItem(`couple_mission_day_${currentDay}`);
            const storedAnalysis = await AsyncStorage.getItem(`couple_analysis_day_${currentDay}`);
            const storedFeedback = await AsyncStorage.getItem(`couple_feedback_day_${currentDay}`);

            // "(연결 실패)" 포함된 오래된 에러 메시지는 표시하지 않음
            if (storedAnalysis && !storedAnalysis.includes('연결 실패')) {
                setAiAnalysis(storedAnalysis);
            }
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

        // 7시~24시에 맞춤 조언 로드 (커플 모드 - 아침/점심/저녁)
        try {
            const currentHour = new Date().getHours();
            if (currentHour >= 7 && currentHour < 24) {
                // 시간대 결정: 7시~12시 아침, 12시~18시 점심, 18시~ 저녁
                let timeOfDay: 'morning' | 'noon' | 'evening';
                if (currentHour < 12) {
                    timeOfDay = 'morning';
                } else if (currentHour < 18) {
                    timeOfDay = 'noon';
                } else {
                    timeOfDay = 'evening';
                }

                const userDeficit = await AsyncStorage.getItem('userDeficit') || '';
                const userName = await AsyncStorage.getItem('userName') || '';
                const userId = await AsyncStorage.getItem('currentUserId') || '';
                const growthLevel = parseInt(await AsyncStorage.getItem('relationshipLevel') || '1', 10);
                const currentMission = await AsyncStorage.getItem('couple_mission_day_' + (await AsyncStorage.getItem('coupleDayCount') || '1')) || currentMissionText;
                const historyString = await AsyncStorage.getItem('coupleMissionHistory') || '[]';
                const historyArr = JSON.parse(historyString);
                const recentJournals = historyArr.slice(-3).map((j: any) => j.reflection || j.content || '');

                console.log('[CouplesMissionScreen] 맞춤 조언 API 호출...');
                const adviceResponse = await api.getPersonalizedAdvice({
                    userId,
                    name: userName,
                    deficit: userDeficit,
                    currentMission,
                    recentJournals,
                    timeOfDay,
                    dayCount: parseInt(await AsyncStorage.getItem('coupleDayCount') || '1', 10),
                    growthLevel
                });

                if (adviceResponse && adviceResponse.advice) {
                    setPersonalizedAdvice({
                        advice: adviceResponse.advice,
                        focusPrompt: adviceResponse.focusPrompt || '',
                        timeOfDay: adviceResponse.timeOfDay as 'morning' | 'noon' | 'evening' || timeOfDay
                    });
                    console.log('[CouplesMissionScreen] 맞춤 조언 로드 완료');
                }
            }
        } catch (adviceError) {
            console.log('[CouplesMissionScreen] 맞춤 조언 로드 실패 (무시):', adviceError);
        }

        // 🆕 데일리 질문 로드
        try {
            const question = getTodaysQuestion();
            setTodaysQuestion(question);
            console.log('[CouplesMissionScreen] 오늘의 질문:', question.question);
        } catch (e) {
            console.log('[CouplesMissionScreen] 데일리 질문 로드 실패:', e);
        }

        // 🆕 기념일 서비스 초기화 및 다가오는 기념일 로드
        try {
            await anniversaryService.initialize();
            const upcoming = anniversaryService.getUpcoming(7);
            setUpcomingAnniversaries(upcoming.map(a => ({
                name: a.name,
                emoji: a.emoji,
                dDay: a.dDay
            })));
        } catch (e) {
            console.log('[CouplesMissionScreen] 기념일 로드 실패:', e);
        }

        // 🆕 선택된 미션팩 로드
        try {
            const savedPack = await AsyncStorage.getItem('selectedMissionPack');
            if (savedPack) {
                setSelectedMissionPack(savedPack);
            }
        } catch (e) {
            console.log('[CouplesMissionScreen] 미션팩 설정 로드 실패:', e);
        }
    };


    useFocusEffect(
        useCallback(() => {
            loadData();
        }, [])
    );

    // Countdown timer (same as HomeScreen - fixed)
    const calculateCountdown = () => {
        const now = new Date();
        const next9AM = new Date(now);

        // 오전 9시 이전이면 오늘 9시, 이후면 내일 9시
        if (now.getHours() >= 9) {
            next9AM.setDate(next9AM.getDate() + 1);
        }
        next9AM.setHours(9, 0, 0, 0);

        const diff = next9AM.getTime() - now.getTime();
        if (diff <= 0) {
            setCountdown('00:00:00');
            return;
        }

        const hours = Math.floor(diff / (1000 * 60 * 60));
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((diff % (1000 * 60)) / 1000);

        setCountdown(`${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`);
    };

    useEffect(() => {
        if (nextMissionUnlockTime) {
            calculateCountdown();
            const interval = setInterval(calculateCountdown, 1000);
            return () => clearInterval(interval);
        }
    }, [nextMissionUnlockTime]);

    // [개발자용] 타이머 넘기기 - 테스트용
    const skipTimer = async () => {
        await AsyncStorage.removeItem('coupleLastCompletedDate');
        setNextMissionUnlockTime(null);
        Alert.alert('✅ 개발자 모드', '타이머가 리셋되었습니다. 페이지를 새로고침합니다.', [
            { text: '확인', onPress: () => window.location?.reload?.() }
        ]);
    };

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
                            const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
                            if (status !== 'granted') {
                                Alert.alert('권한 필요', '앨범 접근 권한이 필요합니다.');
                                return;
                            }
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

                // Firebase에도 커플 수행기록 저장 (비동기, 실패해도 앱 동작에 영향 없음)
                try {
                    const storedUserId = await AsyncStorage.getItem('userId');
                    await MatchingService.saveJournalRecord({
                        id: `couple_journal_${Date.now()}`,
                        uid: storedUserId || '',
                        type: 'couple',
                        day: daysTogether,
                        date: new Date().toLocaleDateString(),
                        content: reflection,
                        mission: currentMissionText,
                        analysis: data.analysis,
                        feedback: data.feedback,
                        createdAt: new Date().toISOString()
                    });
                    console.log('[ORBIT Couple] ✅ Firebase 수행기록 저장 완료');
                } catch (firebaseError) {
                    console.log('[ORBIT Couple] Firebase 수행기록 저장 실패 (무시):', firebaseError);
                }

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

                // ============================================
                // 🎯 관리자 미션 완료 후 삭제 (다음엔 AI 미션 사용)
                // ============================================
                const hadAdminMission = await AsyncStorage.getItem('hasCoupleAdminMission');
                if (hadAdminMission === 'true') {
                    try {
                        const adminApiUrl = Platform.OS === 'web' && (window as any).location?.hostname === 'localhost'
                            ? 'http://localhost:3001'
                            : 'https://orbit-adminfinalfight.onrender.com';
                        const storedUserId = await AsyncStorage.getItem('userId');
                        const storedName = await AsyncStorage.getItem('userName');
                        const userId = storedUserId || storedName || '';

                        if (userId) {
                            // 서버에서 assignedMission 삭제
                            await fetch(`${adminApiUrl}/api/users/${encodeURIComponent(userId)}`, {
                                method: 'PUT',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({ assignedMission: null })
                            });
                            console.log('[ORBIT Couple] ✅ 관리자 미션 완료 → 서버에서 삭제됨 (다음엔 AI 미션)');
                        }
                        // 로컬 플래그도 삭제
                        await AsyncStorage.removeItem('hasCoupleAdminMission');
                    } catch (adminErr) {
                        console.log('[ORBIT Couple] 관리자 미션 삭제 실패 (무시):', adminErr);
                        await AsyncStorage.removeItem('hasCoupleAdminMission');
                    }
                }

                // "바로 돌아오는 오전 9시" 설정
                const now = new Date();
                const next9AM = new Date(now);
                if (now.getHours() >= 9) {
                    next9AM.setDate(next9AM.getDate() + 1);
                }
                next9AM.setHours(9, 0, 0, 0);
                setNextMissionUnlockTime(next9AM.toLocaleString());

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
            {/* Background Gradient - Same as HomeScreen */}
            <LinearGradient
                colors={['#0f0a1e', '#1a0a2e', '#0f0a1e']}
                style={StyleSheet.absoluteFillObject}
            />
            {/* Cosmic Background Image - Same as HomeScreen */}
            <Image
                source={cosmicBackground}
                style={styles.cosmicBackground}
                resizeMode="cover"
            />
            {/* Spline Visualizer */}
            <View style={styles.visualizerBackground}>
                <MysticVisualizer isActive={true} mode={visualizerMode} sceneUrl="https://prod.spline.design/gjz7s8UmZl4fmUa7/scene.splinecode" />
            </View>

            <SafeAreaView style={styles.safeArea}>
                {/* Header - Same as HomeScreen */}
                <View style={styles.header}>
                    {/* HeaderSpline - ORBIT 로고 뒤 애니메이션 */}
                    <View style={styles.headerOrbitAnimation}>
                        <HeaderSpline width={300} height={300} />
                    </View>
                    {/* ORBIT Text - On Top */}
                    <Text style={styles.headerTitle}>ORBIT</Text>
                </View>

                <ScrollView
                    contentContainerStyle={styles.scrollContent}
                    showsVerticalScrollIndicator={false}
                    showsHorizontalScrollIndicator={false}
                >
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
                                    <Text style={styles.analysisLabel}>ORBIT의 조언</Text>
                                    <Text style={styles.analysisText}>{aiAnalysis}</Text>
                                </GlassCard>
                            </View>
                        )}

                        {/* 아침/점심/저녁 맞춤 조언 카드 */}
                        {personalizedAdvice && (
                            <View style={styles.missionContainer}>
                                <GlassCard style={styles.analysisCard}>
                                    <Text style={styles.analysisLabel}>
                                        ORBIT의 조언
                                    </Text>
                                    <Text style={styles.analysisText}>
                                        {personalizedAdvice.advice}
                                    </Text>
                                    {personalizedAdvice.focusPrompt ? (
                                        <Text style={{ color: 'rgba(255,255,255,0.6)', fontSize: 13, marginTop: 8, fontStyle: 'italic' }}>
                                            {personalizedAdvice.focusPrompt}
                                        </Text>
                                    ) : null}
                                </GlassCard>
                            </View>
                        )}

                        {/* 🆕 다가오는 기념일 알림 */}
                        {upcomingAnniversaries.length > 0 && (
                            <View style={styles.missionContainer}>
                                <GlassCard style={[styles.analysisCard, { backgroundColor: 'rgba(251, 113, 133, 0.15)' }]}>
                                    <Text style={[styles.analysisLabel, { color: '#FB7185' }]}>📅 다가오는 기념일</Text>
                                    {upcomingAnniversaries.slice(0, 2).map((a, i) => (
                                        <Text key={i} style={{ color: '#fff', fontSize: 15, marginTop: 6 }}>
                                            {a.emoji} {a.name} - {a.dDay === 0 ? '오늘!' : `D-${a.dDay}`}
                                        </Text>
                                    ))}
                                </GlassCard>
                            </View>
                        )}

                        {/* 🆕 데일리 질문 카드 */}
                        {todaysQuestion && (
                            <View style={styles.missionContainer}>
                                <GlassCard style={[styles.analysisCard, { backgroundColor: 'rgba(34, 211, 238, 0.1)' }]}>
                                    <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
                                        <Text style={{ fontSize: 18, marginRight: 8 }}>
                                            {CATEGORY_NAMES[todaysQuestion.category].emoji}
                                        </Text>
                                        <Text style={[styles.analysisLabel, { color: '#22D3EE', marginBottom: 0 }]}>
                                            오늘의 질문
                                        </Text>
                                    </View>
                                    <Text style={[styles.analysisText, { fontSize: 17, lineHeight: 26 }]}>
                                        "{todaysQuestion.question}"
                                    </Text>
                                    <Text style={{ color: 'rgba(255,255,255,0.5)', fontSize: 12, marginTop: 8, textAlign: 'right' }}>
                                        #{CATEGORY_NAMES[todaysQuestion.category].name}
                                    </Text>
                                </GlassCard>
                            </View>
                        )}

                        {/* 🆕 미션팩 선택 버튼 */}
                        <View style={styles.missionContainer}>
                            <TouchableOpacity
                                style={{
                                    flexDirection: 'row',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    backgroundColor: 'rgba(255, 255, 255, 0.1)',
                                    borderRadius: 12,
                                    paddingVertical: 12,
                                    paddingHorizontal: 20,
                                    borderWidth: 1,
                                    borderColor: 'rgba(255, 255, 255, 0.2)',
                                }}
                                onPress={() => setMissionPackModalVisible(true)}
                            >
                                <Text style={{ color: '#fff', fontSize: 14, marginRight: 8 }}>
                                    {MISSION_PACKS.find(p => p.id === selectedMissionPack)?.emoji || '🎯'}
                                </Text>
                                <Text style={{ color: '#fff', fontSize: 14 }}>
                                    미션팩: {MISSION_PACKS.find(p => p.id === selectedMissionPack)?.name || '신혼 부부'}
                                </Text>
                                <Text style={{ color: 'rgba(255,255,255,0.5)', fontSize: 12, marginLeft: 8 }}>
                                    변경하기 →
                                </Text>
                            </TouchableOpacity>
                        </View>


                        {/* Ritual Card - Same style as HomeScreen */}
                        <View style={styles.missionContainer}>
                            <GlassCard style={[styles.missionCard, isSpecialMission && styles.specialCard, nextMissionUnlockTime && styles.lockedCard]}>
                                <Text style={[styles.missionLabel, isSpecialMission && styles.specialLabel]}>
                                    {isSpecialMission ? "✨ 특별 리추얼" : "오늘의 리추얼"}
                                </Text>
                                {nextMissionUnlockTime ? (
                                    <View style={styles.lockedMissionContainer}>
                                        <Text style={styles.countdownTimer}>{countdown}</Text>
                                        <Text style={styles.lockedText}>오전 9시에 돌아오겠습니다.</Text>
                                        {missionHistory.length > 0 && (
                                            <Text style={{ color: 'rgba(255,255,255,0.5)', fontSize: 14, marginTop: 20, textAlign: 'center' }}>
                                                최근 완수한 미션{'\n'}{missionHistory[0]?.mission || currentMissionText}
                                            </Text>
                                        )}
                                    </View>
                                ) : (
                                    <Text style={styles.missionText}>
                                        {currentMissionText || "리추얼을 불러오는 중..."}
                                    </Text>
                                )}
                            </GlassCard>
                        </View>


                        {/* Action Button - Hidden when locked */}
                        {!nextMissionUnlockTime && (
                            <HolyButton
                                title={currentMissionText ? "추억 기록하기" : "여정 시작하기"}
                                onPress={() => setJournalModalVisible(true)}
                                style={styles.actionButton}
                            />
                        )}
                    </View>
                </ScrollView>
            </SafeAreaView>

            {/* Journal Modal - Same style as HomeScreen */}
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

            {/* 🆕 미션팩 선택 모달 */}
            <Modal visible={missionPackModalVisible} animationType="slide" transparent={true}>
                <View style={styles.modalOverlay}>
                    <GlassCard style={[styles.modalContent, { maxHeight: '80%' }]}>
                        <Text style={styles.modalTitle}>🎯 미션팩 선택</Text>
                        <Text style={styles.modalSubtitle}>당신의 상황에 맞는 미션팩을 선택하세요</Text>

                        <ScrollView style={{ marginVertical: 20 }} showsVerticalScrollIndicator={false}>
                            {MISSION_PACKS.map((pack) => (
                                <TouchableOpacity
                                    key={pack.id}
                                    style={{
                                        flexDirection: 'row',
                                        alignItems: 'center',
                                        padding: 16,
                                        marginBottom: 12,
                                        borderRadius: 12,
                                        borderWidth: selectedMissionPack === pack.id ? 2 : 1,
                                        borderColor: selectedMissionPack === pack.id ? pack.color : 'rgba(255,255,255,0.2)',
                                        backgroundColor: selectedMissionPack === pack.id ? `${pack.color}20` : 'transparent',
                                    }}
                                    onPress={async () => {
                                        setSelectedMissionPack(pack.id);
                                        await AsyncStorage.setItem('selectedMissionPack', pack.id);
                                    }}
                                >
                                    <Text style={{ fontSize: 32, marginRight: 16 }}>{pack.emoji}</Text>
                                    <View style={{ flex: 1 }}>
                                        <Text style={{ color: '#fff', fontSize: 18, fontWeight: 'bold' }}>
                                            {pack.name}
                                        </Text>
                                        <Text style={{ color: 'rgba(255,255,255,0.6)', fontSize: 13, marginTop: 4 }}>
                                            {pack.description}
                                        </Text>
                                        <Text style={{ color: pack.color, fontSize: 12, marginTop: 4 }}>
                                            {pack.missions.length}개의 미션
                                        </Text>
                                    </View>
                                    {selectedMissionPack === pack.id && (
                                        <Text style={{ fontSize: 20 }}>✓</Text>
                                    )}
                                </TouchableOpacity>
                            ))}
                        </ScrollView>

                        <HolyButton
                            title="확인"
                            onPress={() => setMissionPackModalVisible(false)}
                            style={{ marginTop: 10 }}
                        />
                    </GlassCard>
                </View>
            </Modal>
        </View >
    );
};

const styles = StyleSheet.create({
    // Container - Same as HomeScreen
    container: { flex: 1, backgroundColor: '#000' },
    visualizerBackground: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: 1, // Above background image
        opacity: 0.6, // Allow cosmic background to show through
    },
    cosmicBackground: {
        ...StyleSheet.absoluteFillObject,
        zIndex: 0, // Behind spline
    },
    safeArea: { flex: 1, zIndex: 10 },

    // Header - Same as HomeScreen
    header: {
        width: '100%',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 20,
        paddingTop: Platform.OS === 'android' ? 40 : 20,
        position: 'relative',
    },
    headerOrbitAnimation: {
        position: 'absolute',
        width: 300,
        height: 300,
        zIndex: 1,
        top: -100,
        opacity: 0.7,
        ...(Platform.OS === 'web' ? {
            left: 'calc(50% - 150px)',
        } : {
            left: '50%',
            marginLeft: -150,
        }),
    } as any,
    headerTitle: {
        color: '#FFFFFF',
        fontSize: 18,
        fontWeight: 'bold',
        letterSpacing: 3,
        fontFamily: FONTS.title,
        zIndex: 10,
        marginTop: 20,
        ...(Platform.OS === 'web'
            ? { textShadow: '0 0 15px rgba(255, 255, 255, 0.8), 0 0 30px rgba(255, 255, 255, 0.5), 0 0 45px rgba(255, 255, 255, 0.3)' }
            : {
                textShadowColor: 'rgba(255, 255, 255, 0.8)',
                textShadowOffset: { width: 0, height: 0 },
                textShadowRadius: 15,
            }
        ),
    } as any,

    settingsIcon: {
        fontSize: 24,
    },

    // Content - Same as HomeScreen
    scrollContent: {
        flexGrow: 1,
        paddingBottom: 250,
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
        fontSize: 36,
        fontWeight: 'bold',
        marginTop: 20,
        marginBottom: 5,
        ...(Platform.OS === 'web'
            ? { textShadow: '0 0 20px rgba(255, 255, 255, 0.6), 0 0 40px rgba(255, 255, 255, 0.3)' }
            : {
                textShadowColor: 'rgba(255, 255, 255, 0.6)',
                textShadowOffset: { width: 0, height: 0 },
                textShadowRadius: 20,
            }
        ),
        fontFamily: FONTS.title,
    } as any,
    greetingText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: 'bold',
        marginTop: 5,
        marginBottom: 5,
        textAlign: 'center',
        fontFamily: FONTS.serif,
    },
    subText: {
        color: '#888',
        fontSize: 12,
        marginBottom: 20,
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
        color: COLORS.gold,
        fontSize: 18,
        fontWeight: 'bold',
        marginBottom: 10,
        fontFamily: FONTS.title,
    },
    specialLabel: {
        color: '#FFFFFF',
    },
    missionText: {
        color: '#fff',
        fontSize: 14,
        textAlign: 'center',
        lineHeight: 22,
        fontFamily: FONTS.serif,
    },

    // Locked Mission Styles
    lockedCard: {
        borderColor: 'rgba(255, 255, 255, 0.2)',
        backgroundColor: 'rgba(0, 0, 0, 0.2)',
    },
    lockedMissionContainer: {
        alignItems: 'center',
        paddingVertical: 10,
    },
    countdownTimer: {
        fontSize: 42,
        fontWeight: '400',
        color: '#FFFFFF',
        letterSpacing: 4,
        marginBottom: 15,
        fontFamily: 'Orbitron_400Regular',
        ...(Platform.OS === 'web'
            ? { textShadow: '0 0 20px rgba(255, 255, 255, 0.5), 0 0 40px rgba(255, 255, 255, 0.2)' }
            : {
                textShadowColor: 'rgba(255, 255, 255, 0.5)',
                textShadowOffset: { width: 0, height: 0 },
                textShadowRadius: 20,
            }
        ),
    } as any,
    lockedIcon: {
        fontSize: 40,
        marginBottom: 10,
    },
    lockedText: {
        color: 'rgba(255, 255, 255, 0.7)',
        fontSize: 13,
        fontWeight: 'normal',
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
        backgroundColor: 'rgba(0, 0, 0, 0.2)',
        borderColor: 'rgba(200, 100, 255, 0.3)',
    },
    analysisLabel: {
        color: '#A78BFA',
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
