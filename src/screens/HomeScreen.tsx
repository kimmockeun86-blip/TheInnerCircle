import React, { useState, useEffect, useRef, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal, TextInput, ScrollView, SafeAreaView, Alert, Animated, useWindowDimensions, Image, ActivityIndicator, Platform, ImageStyle } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import MysticVisualizer from '../components/MysticVisualizer';
import { HomeScreenNavigationProp, HomeScreenRouteProp } from '../types/navigation';
import { api } from '../services/api';
import * as ImagePicker from 'expo-image-picker';
import { useNavigation, useRoute, useFocusEffect } from '@react-navigation/native';
import GlassCard from '../components/GlassCard';
import HolyButton from '../components/HolyButton';
import { COLORS, LAYOUT, FONTS } from '../theme/theme';
import { LinearGradient } from 'expo-linear-gradient';
import notificationService from '../services/NotificationService';

// Placeholder images
const malePlaceholder = require('../../assets/male_placeholder.png');
const femalePlaceholder = require('../../assets/female_placeholder.png');


interface HomeScreenProps {
    route: HomeScreenRouteProp;
    navigation: HomeScreenNavigationProp;
}

interface JournalEntry {
    day: number;
    content: string;
    date: string;
    imageUri?: string;
    mission?: string;
    feedback?: string;
    signal?: string;
}

const HomeScreen: React.FC<HomeScreenProps> = () => {
    const navigation = useNavigation<HomeScreenNavigationProp>();
    const route = useRoute<HomeScreenRouteProp>();
    const { width: SCREEN_WIDTH } = useWindowDimensions();

    const [name, setName] = useState(route.params?.name || '구도자');
    const [deficit, setDeficit] = useState(route.params?.deficit || '성장');

    const [dayCount, setDayCount] = useState(1);
    const [savedJournal, setSavedJournal] = useState('');
    const [journalModalVisible, setJournalModalVisible] = useState(false);
    const [journalInput, setJournalInput] = useState('');
    const [selectedImage, setSelectedImage] = useState<string | null>(null);
    const [historyModalVisible, setHistoryModalVisible] = useState(false);
    const [introModalVisible, setIntroModalVisible] = useState(false);
    const [analysisModalVisible, setAnalysisModalVisible] = useState(false);

    const [currentAnalysis, setCurrentAnalysis] = useState<{ result: string; feedback: string } | null>(null);

    const [journalHistory, setJournalHistory] = useState<JournalEntry[]>([]);
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [missionStatus, setMissionStatus] = useState<string | null>(null);
    const [aiAnalysis, setAiAnalysis] = useState<string | null>(null);
    const [userGender, setUserGender] = useState<string>('알 수 없음');
    const [userPhoto, setUserPhoto] = useState<string | null>(null);
    const [currentMissionText, setCurrentMissionText] = useState<string>('');
    const [nextMissionUnlockTime, setNextMissionUnlockTime] = useState<string | null>(null);
    const [day10Done, setDay10Done] = useState(false);
    const [matchDecision, setMatchDecision] = useState<'continue' | 'stop' | null>(null);
    const [matchResult, setMatchResult] = useState<'success' | 'fail' | null>(null);
    const [isWaitingForPartner, setIsWaitingForPartner] = useState(false);
    const [growthLevel, setGrowthLevel] = useState(1);
    const [growthPhase, setGrowthPhase] = useState('각성');
    const [progressReason, setProgressReason] = useState<string | null>(null);
    const [inboxCount, setInboxCount] = useState(0);
    const [countdown, setCountdown] = useState<string>('');

    // Background Matching System
    const [matchCandidate, setMatchCandidate] = useState<any>(null);
    const [matchCandidateModalVisible, setMatchCandidateModalVisible] = useState(false);
    const [letterContent, setLetterContent] = useState('');
    const [photoModalVisible, setPhotoModalVisible] = useState(false);


    const sparkleAnim1 = useRef(new Animated.Value(0)).current;
    const sparkleAnim2 = useRef(new Animated.Value(0)).current;
    const sparkleAnim3 = useRef(new Animated.Value(0)).current;

    const visualizerMode = isAnalyzing ? 'thinking' : (dayCount === 10 ? 'speaking' : 'listening');

    const missions = [
        "오늘 하루 당신이 느낀 가장 강렬한 감정을 기록하십시오.",
        "당신이 가장 회피하고 싶은 질문을 스스로에게 던지십시오.",
        "오늘 만난 사람 중 한 명의 눈빛을 기억하고 그 의미를 성찰하십시오.",
        "당신의 결핍이 준 가장 큰 선물이 무엇인지 기록하십시오.",
        "오늘 하루 중 가장 고요했던 순간을 포착하여 그 감각을 기록하십시오.",
        "당신이 가장 사랑하는 사람에게 전하지 못한 말을 적으십시오.",
        "오늘의 실패를 하나 선택하고 그것이 가르쳐준 교훈을 기록하십시오.",
        "당신의 내면에서 가장 큰 소리를 내는 두려움을 직면하십시오.",
        "오늘 당신이 누군가에게 베푼 사소한 친절을 기억하십시오.",
    ];

    const sparkles = [
        { anim: sparkleAnim1, style: { top: '20%', left: '15%' } },
        { anim: sparkleAnim2, style: { top: '25%', right: '20%' } },
        { anim: sparkleAnim3, style: { top: '35%', left: '25%' } },
    ];

    const loadJournalHistory = async () => {
        try {
            const allJournals = await AsyncStorage.getItem('journalHistory');
            if (allJournals) {
                setJournalHistory(JSON.parse(allJournals));
            }
        } catch (e) {
            console.error('기록 로드 실패:', e);
        }
    };

    // Background Matching - Silently check for compatible matches
    const checkBackgroundMatching = async () => {
        try {
            const storedLocation = await AsyncStorage.getItem('userLocation') || 'Seoul';
            const storedGender = await AsyncStorage.getItem('userGender') || 'male';
            const storedMbti = await AsyncStorage.getItem('userMBTI') || '';
            const storedDeficit = await AsyncStorage.getItem('userDeficit') || '';

            const result = await api.getMatchingCandidates({
                userId: `user_${name}`,
                userLocation: storedLocation,
                userGender: storedGender,
                userMbti: storedMbti,
                userDeficit: storedDeficit
            });

            if (result.success && result.candidates.length > 0) {
                // Found a match candidate! Show as special mission
                setMatchCandidate(result.candidates[0]);
                console.log('[ORBIT] 🎯 Match candidate found:', result.candidates[0].name);
            }
        } catch (error) {
            console.error('Background matching error:', error);
        }
    };

    // Send letter to match candidate
    const handleSendLetter = async () => {
        if (letterContent.trim().length < 10) {
            Alert.alert('알림', '편지를 10자 이상 작성해주세요.');
            return;
        }

        const result = await api.sendLetter({
            fromUserId: `user_${name}`,
            fromUserName: name,
            toUserId: matchCandidate.id,
            content: letterContent
        });

        if (result.success) {
            Alert.alert('성공', '편지가 전송되었습니다. 상대방의 답장을 기다려주세요.');
            setMatchCandidateModalVisible(false);
            setLetterContent('');
            // After sending, simulate receiving reply and accepting
            setTimeout(async () => {
                setMatchResult('success');
                await AsyncStorage.setItem('matchResult', 'success');
                await AsyncStorage.setItem('matchedPartner', JSON.stringify(matchCandidate));
                Alert.alert('🎉 축하합니다!', `${matchCandidate.name}님도 만남을 원했습니다!\n커플 미션이 시작됩니다.`, [
                    { text: '시작하기', onPress: () => navigation.replace('CouplesMission', {} as any) }
                ]);
            }, 3000);
        } else {
            Alert.alert('알림', result.message);
        }
    };

    const checkDayProgression = async () => {
        const lastCompletedDate = await AsyncStorage.getItem('lastCompletedDate');
        if (!lastCompletedDate) return true;

        const now = new Date();
        const lastDate = new Date(lastCompletedDate);
        const isSameDay = now.getDate() === lastDate.getDate() &&
            now.getMonth() === lastDate.getMonth() &&
            now.getFullYear() === lastDate.getFullYear();

        // Unlock at 9:00 AM
        const unlockHour = 9;
        const currentHour = now.getHours();

        if (isSameDay) {
            const tomorrow = new Date(now);
            tomorrow.setDate(tomorrow.getDate() + 1);
            tomorrow.setHours(unlockHour, 0, 0, 0);
            setNextMissionUnlockTime(tomorrow.toLocaleString());
            return false; // Still same day, wait for tomorrow
        }

        if (currentHour < unlockHour) {
            const todayUnlock = new Date(now);
            todayUnlock.setHours(unlockHour, 0, 0, 0);
            setNextMissionUnlockTime(todayUnlock.toLocaleString());
            return false; // Wait until 9 AM today
        }

        setNextMissionUnlockTime(null);
        return true;
    };

    useFocusEffect(
        useCallback(() => {
            const loadData = async () => {
                try {
                    const storedDay = await AsyncStorage.getItem('dayCount');
                    const currentDayCount = storedDay ? parseInt(storedDay, 10) : 1;
                    setDayCount(currentDayCount);

                    // Calculate Growth Level (10일 단위 심화 시스템)
                    const level = Math.min(Math.ceil(currentDayCount / 10), 6);
                    setGrowthLevel(level);
                    const phases = ['각성', '직면', '파괴', '재구축', '통합', '초월'];
                    setGrowthPhase(phases[level - 1] || '각성');

                    const storedStatus = await AsyncStorage.getItem('missionStatus');
                    setMissionStatus(storedStatus);

                    const storedMission = await AsyncStorage.getItem(`mission_day_${currentDayCount}`);
                    if (storedMission) {
                        setCurrentMissionText(storedMission);
                    } else {
                        const defaultMission = currentDayCount <= 9 ? missions[currentDayCount - 1] : "당신의 영혼이 준비되었습니다.";
                        setCurrentMissionText(defaultMission);
                    }

                    const storedDay10Done = await AsyncStorage.getItem('day10Done');
                    if (storedDay10Done === 'true') {
                        setDay10Done(true);
                    }

                    const storedMatchDecision = await AsyncStorage.getItem('matchDecision');
                    if (storedMatchDecision) setMatchDecision(storedMatchDecision as any);

                    const storedMatchResult = await AsyncStorage.getItem('matchResult');
                    if (storedMatchResult) setMatchResult(storedMatchResult as any);

                    await loadJournalHistory();

                    // Background Matching Check (Day 10+)
                    if (currentDayCount >= 10 && !storedMatchResult) {
                        checkBackgroundMatching();
                        // Check inbox for new letters
                        try {
                            const storedName = await AsyncStorage.getItem('userName');
                            const inbox = await api.getLetterInbox(`user_${storedName}`);
                            if (inbox.success) {
                                setInboxCount(inbox.letters?.length || 0);
                            }
                        } catch (e) {
                            console.log('Inbox check failed silently');
                        }
                    }

                    const canUnlock = await checkDayProgression();
                    if (!canUnlock) {
                        // Locked state - schedule notification for 9 AM
                        await notificationService.requestPermission();
                        await notificationService.scheduleMissionNotification();
                    }

                } catch (e) {
                    console.error('Failed to load data:', e);
                }
            };

            loadData();
        }, [])
    );

    useEffect(() => {
        const initializeData = async () => {
            try {
                const isCoupled = await AsyncStorage.getItem('isCoupled');
                if (isCoupled === 'coupled') {
                    navigation.replace('CouplesMission', {} as any);
                    return;
                }

                const storedDay = await AsyncStorage.getItem('dayCount');
                const currentDayCount = storedDay ? parseInt(storedDay, 10) : 1;
                setDayCount(currentDayCount);

                const storedJournal = await AsyncStorage.getItem('savedJournal');
                const storedMissionStatus = await AsyncStorage.getItem('missionStatus');
                const storedGender = await AsyncStorage.getItem('userGender');
                const storedPhoto = await AsyncStorage.getItem('userPhoto');
                const hasSeenIntro = await AsyncStorage.getItem('hasSeenIntro');

                const storedName = await AsyncStorage.getItem('userName');
                const storedDeficit = await AsyncStorage.getItem('userDeficit');

                if (storedJournal) setSavedJournal(storedJournal);
                if (storedMissionStatus) setMissionStatus(storedMissionStatus);
                if (storedGender) setUserGender(storedGender);
                if (storedPhoto) setUserPhoto(storedPhoto);

                if (!route.params?.name && storedName) setName(storedName);
                if (!route.params?.deficit && storedDeficit) setDeficit(storedDeficit);

                if (!hasSeenIntro) {
                    setIntroModalVisible(true);
                }

                const storedMission = await AsyncStorage.getItem(`mission_day_${currentDayCount}`);
                if (storedMission) {
                    setCurrentMissionText(storedMission);
                } else {
                    const defaultMission = currentDayCount <= 9 ? missions[currentDayCount - 1] : "당신의 영혼이 준비되었습니다.";
                    setCurrentMissionText(defaultMission);
                }

                const storedDay10Done = await AsyncStorage.getItem('day10Done');
                if (storedDay10Done === 'true') {
                    setDay10Done(true);
                }

                const storedMatchDecision = await AsyncStorage.getItem('matchDecision');
                if (storedMatchDecision) setMatchDecision(storedMatchDecision as any);

                const storedMatchResult = await AsyncStorage.getItem('matchResult');
                if (storedMatchResult) setMatchResult(storedMatchResult as any);

                await loadJournalHistory();

                const genderForAnalysis = storedGender || '알 수 없음';
                const fullProfile = {
                    name: name,
                    gender: genderForAnalysis,
                    age: await AsyncStorage.getItem('userAge') || '알 수 없음',
                    location: await AsyncStorage.getItem('userLocation') || '',
                    idealType: await AsyncStorage.getItem('userIdealType') || '',
                    hobbies: await AsyncStorage.getItem('userHobbies') || '',
                    job: await AsyncStorage.getItem('userJob') || '',
                    growth: await AsyncStorage.getItem('userGrowth') || '',
                    complex: await AsyncStorage.getItem('userComplex') || '',
                    deficit: deficit
                };

                try {
                    const analysisResult = await api.analyzeProfile(fullProfile);
                    if (analysisResult.success) {
                        setAiAnalysis(analysisResult.analysis);
                        if (analysisResult.matchRecommendation) {
                            await AsyncStorage.setItem('matchRecommendation', analysisResult.matchRecommendation);
                        }
                    }
                } catch (e) {
                    console.log('Profile analysis failed silently:', e);
                }
            } catch (e) {
                console.error('데이터 로드 실패:', e);
            }
        };
        initializeData();
    }, []);

    // Countdown timer effect
    useEffect(() => {
        if (!nextMissionUnlockTime) {
            setCountdown('');
            return;
        }

        const calculateCountdown = () => {
            const now = new Date();
            const tomorrow = new Date(now);
            tomorrow.setDate(tomorrow.getDate() + 1);
            tomorrow.setHours(9, 0, 0, 0);

            const diff = tomorrow.getTime() - now.getTime();
            if (diff <= 0) {
                setCountdown('00:00:00');
                return;
            }

            const hours = Math.floor(diff / (1000 * 60 * 60));
            const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
            const seconds = Math.floor((diff % (1000 * 60)) / 1000);

            setCountdown(`${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`);
        };

        calculateCountdown();
        const interval = setInterval(calculateCountdown, 1000);

        return () => clearInterval(interval);
    }, [nextMissionUnlockTime]);

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

    const handleCompleteReflection = async () => {
        if (journalInput.trim().length < 1) {
            Alert.alert('알림', '내용을 입력해주세요.');
            return;
        }

        const canProceed = await checkDayProgression();
        if (!canProceed && nextMissionUnlockTime) {
            Alert.alert('알림', `다음 미션은 ${nextMissionUnlockTime}에 열립니다.`);
            return;
        }

        setIsAnalyzing(true);

        try {
            // Build context-aware payload (GEMS V3.0)
            const userProfile = {
                name,
                deficit,
                job: '', // Will be loaded from AsyncStorage if available
                habit: '',
                hobby: ''
            };

            // Try to load additional profile data
            try {
                const storedJob = await AsyncStorage.getItem('userJob');
                const storedHabit = await AsyncStorage.getItem('userHabit');
                const storedHobby = await AsyncStorage.getItem('userHobby');
                if (storedJob) userProfile.job = storedJob;
                if (storedHabit) userProfile.habit = storedHabit;
                if (storedHobby) userProfile.hobby = storedHobby;
            } catch (e) {
                console.log('Failed to load additional profile data');
            }

            // Build history array from journalHistory
            const history = journalHistory.map(entry => ({
                day: entry.day,
                journal: entry.content,
                mission: entry.mission || currentMissionText,
                feedback: entry.feedback || ''
            }));

            const formData = new FormData();
            // Context-aware data
            formData.append('userProfile', JSON.stringify(userProfile));
            formData.append('history', JSON.stringify(history));
            formData.append('currentJournal', journalInput);
            formData.append('dayCount', dayCount.toString());
            // Legacy fields for backward compatibility
            formData.append('journalText', journalInput);
            formData.append('name', name);
            formData.append('deficit', deficit);

            if (selectedImage) {
                const filename = selectedImage.split('/').pop();
                const match = /(\\.\\w+)$/.exec(filename || '');
                const type = match ? `image/${match[1]}` : `image`;
                formData.append('image', { uri: selectedImage, name: filename, type } as any);
            }

            const timeoutPromise = new Promise((_, reject) =>
                setTimeout(() => reject(new Error('TIMEOUT')), 45000)
            );

            const response: any = await Promise.race([
                api.analyzeJournal(formData),
                timeoutPromise
            ]);

            if (response.success) {
                setCurrentAnalysis({ result: response.result, feedback: response.feedback });

                // Create new entry with feedback and nextMission from server
                const newEntry: JournalEntry = {
                    day: dayCount,
                    content: journalInput,
                    date: new Date().toLocaleDateString(),
                    imageUri: selectedImage || undefined,
                    mission: currentMissionText,
                    feedback: response.feedback,
                    signal: response.feedback
                };

                const updatedHistory = [newEntry, ...journalHistory];
                setJournalHistory(updatedHistory);
                await AsyncStorage.setItem('journalHistory', JSON.stringify(updatedHistory));

                // Store next mission if provided
                if (response.nextMission || response.recommendedMission) {
                    const nextRitual = response.nextMission || response.recommendedMission;
                    await AsyncStorage.setItem('currentMission', nextRitual);
                }



                // Adaptive Progression - AI decides if user is ready for next level
                const shouldProgress = response.shouldProgress !== false; // default true
                setProgressReason(response.progressReason || null);

                if (shouldProgress) {
                    // User is ready for next level - increase day
                    const newDay = dayCount + 1;
                    setDayCount(newDay);
                    await AsyncStorage.setItem('dayCount', newDay.toString());
                    console.log(`[ORBIT] ✅ Progress to Day ${newDay} - ${response.progressReason || 'Ready'}`);

                    // Update growth level
                    const newLevel = Math.min(Math.ceil(newDay / 10), 6);
                    setGrowthLevel(newLevel);
                    const phases = ['각성', '직면', '파괴', '재구축', '통합', '초월'];
                    setGrowthPhase(phases[newLevel - 1] || '각성');

                    if (response.recommendedMission) {
                        await AsyncStorage.setItem(`mission_day_${newDay}`, response.recommendedMission);
                    }
                } else {
                    // User needs more practice - stay at same level with new mission
                    console.log(`[ORBIT] ⏸️ Stay at Day ${dayCount} - ${response.progressReason || 'More practice needed'}`);

                    // Save new mission for same day
                    if (response.recommendedMission) {
                        await AsyncStorage.setItem(`mission_day_${dayCount}`, response.recommendedMission);
                        setCurrentMissionText(response.recommendedMission);
                    }
                }

                setMissionStatus(null);
                await AsyncStorage.removeItem('missionStatus');
                await AsyncStorage.setItem('lastCompletedDate', new Date().toISOString());

                setJournalModalVisible(false);
                setJournalInput('');
                setSelectedImage(null);

                const fullProfile = {
                    name: name,
                    deficit: deficit,
                    recentJournal: journalInput,
                    previousAnalysis: aiAnalysis
                };
                api.analyzeProfile(fullProfile).then(reAnalysis => {
                    if (reAnalysis.success) {
                        setAiAnalysis(reAnalysis.analysis);
                    }
                });

                setAnalysisModalVisible(true);

            } else {
                Alert.alert('오류', '분석 실패: ' + (response.message || '알 수 없는 오류'));
            }
        } catch (e: any) {
            console.error('Analysis Error:', e);
            if (e.message === 'TIMEOUT') {
                Alert.alert('오류', '서버 응답 시간이 초과되었습니다. (45초)\n서버 상태를 확인해주세요.');
            } else {
                Alert.alert('오류', '네트워크 오류가 발생했습니다.\n' + (e.message || ''));
            }
        } finally {
            setIsAnalyzing(false);
        }
    };

    return (
        <View style={styles.container}>
            <View style={styles.visualizerBackground}>
                <MysticVisualizer isActive={true} mode={visualizerMode} sceneUrl="https://prod.spline.design/gjz7s8UmZl4fmUa7/scene.splinecode" />
            </View>

            <SafeAreaView style={styles.safeArea}>
                <View style={styles.header}>
                    {/* Spline Animation - Behind Text */}
                    {Platform.OS === 'web' && (
                        <View style={styles.headerOrbitAnimation}>
                            <iframe
                                srcDoc={`<!DOCTYPE html><html><head><style>*{margin:0;padding:0;}html,body{width:100%;height:100%;overflow:hidden;background:transparent;}spline-viewer{width:100%;height:100%;display:block;transform:scale(0.175);transform-origin:center center;}</style><script type="module" src="https://unpkg.com/@splinetool/viewer@1.9.59/build/spline-viewer.js"></script></head><body><spline-viewer url="https://prod.spline.design/cecqF9q8Ct3dtFcA/scene.splinecode"></spline-viewer></body></html>`}

                                style={{ width: '100%', height: '100%', border: 'none', background: 'transparent' }}
                                title="Orbit Animation"
                            />
                        </View>
                    )}

                    {/* ORBIT Text - On Top */}
                    <Text style={styles.headerTitle}>ORBIT</Text>
                </View>


                <ScrollView
                    contentContainerStyle={styles.scrollContent}
                    showsVerticalScrollIndicator={false}
                    showsHorizontalScrollIndicator={false}
                >

                    <View style={styles.mainContent}>
                        <Text style={styles.dayText}>Day {dayCount}</Text>
                        <Text style={styles.greetingText}>
                            내면 여정 {dayCount}일째
                        </Text>


                        {/* User Profile Photo - Clickable */}
                        <TouchableOpacity
                            style={styles.userPhotoContainer}
                            onPress={() => setPhotoModalVisible(true)}
                            activeOpacity={0.8}
                        >
                            {(() => {
                                // 1순위: 오르빗 인터뷰 사진
                                if (userPhoto) {
                                    return <Image source={{ uri: userPhoto }} style={styles.userPhoto} />;
                                }
                                // 2순위: 수행기록 최근 사진
                                const recentJournalPhoto = journalHistory.find(j => j.imageUri)?.imageUri;
                                if (recentJournalPhoto) {
                                    return <Image source={{ uri: recentJournalPhoto }} style={styles.userPhoto} />;
                                }
                                // 3순위: 성별에 따른 플레이스홀더 이미지
                                const placeholder = userGender === '여성' ? femalePlaceholder : malePlaceholder;
                                return <Image source={placeholder} style={styles.userPhoto} />;
                            })()}
                        </TouchableOpacity>




                        {/* ORBIT'S SIGNAL - AI Analysis */}
                        {aiAnalysis && (
                            <View style={styles.missionContainer}>
                                <GlassCard style={styles.signalCard}>
                                    <Text style={styles.signalLabel}>ORBIT'S SIGNAL</Text>
                                    <Text style={styles.signalText}>{aiAnalysis}</Text>
                                </GlassCard>
                            </View>
                        )}

                        {/* Today's Ritual */}
                        <View style={styles.missionContainer}>
                            <GlassCard style={[styles.missionCard, nextMissionUnlockTime && styles.lockedCard]}>
                                <Text style={styles.missionTitle}>오늘의 리추얼</Text>
                                {nextMissionUnlockTime ? (
                                    <View style={styles.lockedMissionContainer}>
                                        <Text style={styles.countdownTimer}>{countdown}</Text>
                                        <Text style={styles.lockedText}>오전 9시에 돌아오겠습니다.</Text>
                                    </View>

                                ) : (
                                    <Text style={styles.missionText}>{currentMissionText}</Text>
                                )}
                            </GlassCard>
                        </View>

                        {/* Action Button - Hidden when locked */}
                        {!nextMissionUnlockTime && (
                            <HolyButton
                                title="수행 기록 남기기"
                                onPress={() => setJournalModalVisible(true)}
                                style={{ marginTop: 20, marginBottom: 20 }}
                            />
                        )}

                    </View>

                </ScrollView>

                {/* Photo View/Change Modal */}
                <Modal visible={photoModalVisible} animationType="fade" transparent={true}>
                    <View style={styles.photoModalOverlay}>
                        <TouchableOpacity
                            style={styles.photoModalClose}
                            onPress={() => setPhotoModalVisible(false)}
                        >
                            <Text style={{ color: '#fff', fontSize: 20 }}>✕</Text>
                        </TouchableOpacity>

                        <View style={styles.photoModalContent}>
                            {(() => {
                                if (userPhoto) {
                                    return <Image source={{ uri: userPhoto }} style={styles.photoModalImage} />;
                                }
                                const recentJournalPhoto = journalHistory.find(j => j.imageUri)?.imageUri;
                                if (recentJournalPhoto) {
                                    return <Image source={{ uri: recentJournalPhoto }} style={styles.photoModalImage} />;
                                }
                                const placeholder = userGender === '여성' ? femalePlaceholder : malePlaceholder;
                                return <Image source={placeholder} style={styles.photoModalImage} />;
                            })()}
                        </View>

                        <TouchableOpacity
                            style={styles.photoChangeButton}
                            onPress={() => {
                                setPhotoModalVisible(false);
                                Alert.alert(
                                    "프로필 사진 변경",
                                    "사진을 가져올 방법을 선택하세요.",
                                    [
                                        {
                                            text: "카메라로 촬영",
                                            onPress: async () => {
                                                const result = await ImagePicker.launchCameraAsync({
                                                    mediaTypes: ImagePicker.MediaTypeOptions.Images,
                                                    allowsEditing: true,
                                                    aspect: [1, 1],
                                                    quality: 0.8,
                                                });
                                                if (!result.canceled) {
                                                    setUserPhoto(result.assets[0].uri);
                                                    await AsyncStorage.setItem('userPhoto', result.assets[0].uri);
                                                }
                                            }
                                        },
                                        {
                                            text: "앨범에서 선택",
                                            onPress: async () => {
                                                const result = await ImagePicker.launchImageLibraryAsync({
                                                    mediaTypes: ImagePicker.MediaTypeOptions.Images,
                                                    allowsEditing: true,
                                                    aspect: [1, 1],
                                                    quality: 0.8,
                                                });
                                                if (!result.canceled) {
                                                    setUserPhoto(result.assets[0].uri);
                                                    await AsyncStorage.setItem('userPhoto', result.assets[0].uri);
                                                }
                                            }
                                        },
                                        { text: "취소", style: "cancel" }
                                    ]
                                );
                            }}
                        >
                            <Text style={styles.photoChangeButtonText}>사진 변경</Text>

                        </TouchableOpacity>
                    </View>
                </Modal>

                {/* Match Candidate Modal - Special Mission */}
                <Modal visible={matchCandidateModalVisible} animationType="slide" transparent={true}>
                    <View style={styles.modalOverlay}>
                        <GlassCard style={styles.matchCandidateModal}>
                            <Text style={styles.matchModalBadge}>✨ 특별 미션</Text>
                            <Text style={styles.matchModalTitle}>운명의 신호</Text>

                            {matchCandidate && (
                                <View style={styles.matchCandidateProfile}>
                                    <Image
                                        source={{ uri: matchCandidate.photo }}
                                        style={styles.matchCandidatePhoto}
                                    />
                                    <Text style={styles.matchCandidateName}>
                                        {matchCandidate.name}, {matchCandidate.age}
                                    </Text>
                                    <Text style={styles.matchCandidateDetail}>
                                        {matchCandidate.location} · {matchCandidate.mbti}
                                    </Text>
                                    <View style={styles.matchCandidateDeficit}>
                                        <Text style={styles.matchCandidateDeficitText}>
                                            💫 {matchCandidate.deficit}
                                        </Text>
                                    </View>
                                    <Text style={styles.matchCandidateBio}>{matchCandidate.bio}</Text>
                                </View>
                            )}

                            <Text style={styles.matchModalInstruction}>
                                이 분에게 첫 편지를 보내보세요
                            </Text>
                            <TextInput
                                style={styles.letterInput}
                                multiline
                                placeholder="진심을 담아 편지를 작성해주세요... (500자 이내)"
                                placeholderTextColor="rgba(255,255,255,0.5)"
                                value={letterContent}
                                onChangeText={setLetterContent}
                                maxLength={500}
                            />
                            <Text style={styles.letterCharCount}>{letterContent.length}/500</Text>

                            <View style={styles.matchModalButtons}>
                                <HolyButton
                                    title="나중에"
                                    variant="outline"
                                    onPress={() => setMatchCandidateModalVisible(false)}
                                    style={{ flex: 1, marginRight: 10 }}
                                />
                                <HolyButton
                                    title="편지 보내기"
                                    onPress={handleSendLetter}
                                    style={{ flex: 1 }}
                                />
                            </View>
                        </GlassCard>
                    </View>
                </Modal>

                {/* Journal Modal */}
                <Modal visible={journalModalVisible} animationType="slide" transparent={true}>
                    <View style={styles.modalOverlay}>
                        <GlassCard style={styles.modalContent}>
                            <Text style={styles.modalTitle}>
                                {dayCount === 10 && missionStatus === 'secret_mission_active' ? "비밀 지령 수행 기록" : "오늘의 수행 기록"}
                            </Text>
                            <Text style={styles.modalSubtitle}>
                                {dayCount === 10 && missionStatus === 'secret_mission_active'
                                    ? "상대방과의 만남, 그리고 당신의 감정을 솔직하게 기록하세요."
                                    : "오늘의 미션을 수행하며 느낀 점을 기록해주세요."}
                            </Text>

                            <TextInput
                                style={styles.journalInput}
                                placeholder="내면의 목소리를 이곳에 담아주세요..."
                                placeholderTextColor="#666"
                                multiline
                                value={journalInput}
                                onChangeText={setJournalInput}
                            />

                            <TouchableOpacity onPress={pickImage} style={styles.imagePickerButton}>
                                <Text style={styles.imagePickerText}>
                                    {selectedImage ? "사진 변경하기" : "사진 추가하기 (선택)"}
                                </Text>
                            </TouchableOpacity>


                            {selectedImage && (
                                <Image source={{ uri: selectedImage }} style={styles.previewImage as ImageStyle} />
                            )}

                            {isAnalyzing && (
                                <Text style={{ color: COLORS.gold, textAlign: 'center', marginBottom: 15, fontSize: 14 }}>
                                    상대방에게 메시지를 전하고 있습니다.
                                </Text>
                            )}

                            <View style={styles.modalButtons}>
                                <HolyButton
                                    title="취소"
                                    onPress={() => setJournalModalVisible(false)}
                                    variant="ghost"
                                    style={{ flex: 1, marginRight: 10 }}
                                />
                                <HolyButton
                                    title={isAnalyzing ? "전송 중..." : "기록 완료"}
                                    onPress={handleCompleteReflection}
                                    disabled={isAnalyzing}
                                    style={{ flex: 1 }}
                                />
                            </View>
                        </GlassCard>
                    </View>
                </Modal>

                {/* Analysis Result Modal */}
                <Modal visible={analysisModalVisible} animationType="fade" transparent={true}>
                    <View style={styles.modalOverlay}>
                        <GlassCard style={styles.analysisModalContent}>
                            <Text style={styles.analysisTitle}>오르빗의 시그널</Text>
                            <ScrollView style={{ maxHeight: 300 }}>
                                <Text style={styles.analysisText}>
                                    {currentAnalysis?.feedback}
                                </Text>
                            </ScrollView>

                            <HolyButton
                                title="확인"
                                onPress={() => setAnalysisModalVisible(false)}
                                style={{ marginTop: 20, width: '100%' }}
                            />
                        </GlassCard>
                    </View>
                </Modal>

                {/* History Modal */}
                <Modal visible={historyModalVisible} animationType="slide">
                    <SafeAreaView style={styles.historyContainer}>
                        <View style={styles.historyHeader}>
                            <Text style={styles.historyTitle}>지난 여정의 기록</Text>
                            <TouchableOpacity onPress={() => setHistoryModalVisible(false)}>
                                <Text style={styles.closeButton}>닫기</Text>
                            </TouchableOpacity>
                        </View>
                        <ScrollView contentContainerStyle={styles.historyList}>
                            {journalHistory.map((entry, index) => (
                                <GlassCard key={index} style={styles.historyCard}>
                                    <Text style={styles.historyDay}>Day {entry.day}</Text>
                                    <Text style={styles.historyDate}>{entry.date}</Text>
                                    <Text style={styles.historyContent}>{entry.content}</Text>
                                    {entry.imageUri && (
                                        <Image source={{ uri: entry.imageUri }} style={styles.historyImage as ImageStyle} />
                                    )}
                                </GlassCard>
                            ))}
                        </ScrollView>
                    </SafeAreaView>
                </Modal>

                {/* Intro Modal */}
                <Modal visible={introModalVisible} animationType="fade" transparent={true}>
                    <View style={styles.modalOverlay}>
                        <GlassCard style={styles.introContent}>
                            <Text style={styles.introTitle}>환영합니다, {name}님.</Text>
                            <Text style={styles.introText}>
                                당신의 결핍인 '{deficit}'을(를) 성장의 씨앗으로 삼아,{'\n'}
                                10일간의 내면 여행을 시작합니다.{'\n\n'}
                                매일 주어지는 미션을 수행하고 기록을 남겨주세요.{'\n'}
                                당신의 영혼을 돌보는 멘토 '파라'가 함께합니다.
                            </Text>
                            <HolyButton
                                title="여정 시작하기"
                                onPress={async () => {
                                    setIntroModalVisible(false);
                                    await AsyncStorage.setItem('hasSeenIntro', 'true');
                                }}
                                style={{ marginTop: 30, width: '100%' }}
                            />
                        </GlassCard>
                    </View>
                </Modal>

            </SafeAreaView>
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#000' },
    visualizerBackground: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: 0,
    },
    safeArea: { flex: 1, zIndex: 10 },

    // Header styles
    header: {
        width: '100%',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 20,
        paddingTop: 40,
        position: 'relative',
    },
    headerTitle: {
        color: '#FFFFFF',
        fontSize: 18,
        fontWeight: 'bold',
        letterSpacing: 3,
        zIndex: 10,
        ...(Platform.OS === 'web'
            ? { textShadow: '0 0 15px rgba(255, 255, 255, 0.7), 0 0 30px rgba(255, 255, 255, 0.4)' }
            : {
                textShadowColor: 'rgba(255, 255, 255, 0.7)',
                textShadowOffset: { width: 0, height: 0 },
                textShadowRadius: 15,
            }
        ),
    } as any,

    headerOrbitAnimation: {
        position: 'absolute',
        width: 400,
        height: 400,
        zIndex: 1,
        top: -150,
        left: '50%',
        marginLeft: -200,
        opacity: 0.6,

    },

    // Profile Photo Styles
    profilePhotoContainer: {

        zIndex: 15,
    },
    profilePhoto: {
        width: 40,
        height: 40,
        borderRadius: 20,
        borderWidth: 2,
        borderColor: 'rgba(255, 215, 0, 0.5)',
    },
    profilePhotoPlaceholder: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: 'rgba(255, 255, 255, 0.15)',
        borderWidth: 2,
        borderColor: 'rgba(255, 215, 0, 0.3)',
        alignItems: 'center',
        justifyContent: 'center',
    },
    profilePhotoPlaceholderText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: 'bold',
    },

    // User Photo in Main Content
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

    userPhotoPlaceholder: {
        width: 120,
        height: 120,
        borderRadius: 60,
        backgroundColor: 'rgba(255, 255, 255, 0.1)',
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.2)',
        alignItems: 'center',
        justifyContent: 'center',
    },
    userPhotoPlaceholderText: {
        fontSize: 40,
        opacity: 0.5,
    },

    // Photo Modal Styles
    photoModalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.9)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    photoModalClose: {
        position: 'absolute',
        top: 50,
        right: 20,
        zIndex: 10,
        padding: 10,
    },
    photoModalContent: {
        width: 280,
        height: 280,
        borderRadius: 140,
        overflow: 'hidden',
        borderWidth: 2,
        borderColor: 'rgba(255, 255, 255, 0.3)',
    },
    photoModalImage: {
        width: '100%',
        height: '100%',
    },
    photoChangeButton: {
        marginTop: 30,
        paddingHorizontal: 25,
        paddingVertical: 12,
        backgroundColor: 'rgba(255, 255, 255, 0.1)',
        borderRadius: 25,
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.3)',
    },
    photoChangeButtonText: {
        color: '#FFFFFF',
        fontSize: 16,
    },

    scrollContent: {
        flexGrow: 1,
        paddingBottom: 120,
        alignItems: 'center',
    },

    // ORBIT Header
    orbitHeader: {
        alignItems: 'center',
        marginTop: 20,
        marginBottom: 20,
    },
    orbitLogoContainer: {
        width: 50,
        height: 50,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 5,
    },
    orbitIcon: {
        width: 36,
        height: 36,
        tintColor: '#FFFFFF',
    },
    orbitTitle: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: 'bold',
        letterSpacing: 3,
        marginBottom: 10,
        ...(Platform.OS === 'web'
            ? { textShadow: '0 0 20px rgba(255, 255, 255, 0.8), 0 0 40px rgba(255, 255, 255, 0.4)' }
            : {
                textShadowColor: 'rgba(255, 255, 255, 0.8)',
                textShadowOffset: { width: 0, height: 0 },
                textShadowRadius: 20,
            }
        ),
    } as any,

    // Growth Level Badge
    growthLevelBadge: {
        paddingHorizontal: 18,
        paddingVertical: 10,
        borderRadius: 25,
        borderWidth: 2,
        borderColor: 'rgba(150, 100, 255, 0.6)',
        backgroundColor: 'rgba(80, 40, 120, 0.25)',
        marginBottom: 15,
        ...(Platform.OS === 'web'
            ? { boxShadow: '0 0 10px rgba(153, 102, 255, 0.4)' }
            : {
                shadowColor: '#9966FF',
                shadowOffset: { width: 0, height: 0 },
                shadowOpacity: 0.4,
                shadowRadius: 10,
            }
        ),
        elevation: 5,
    } as any,
    growthLevelBadgeText: {
        color: '#E0CFFF',
        fontSize: 13,
        fontWeight: 'bold',
        letterSpacing: 1.5,
    },
    dayText: {
        color: '#FFFFFF',
        fontSize: 36,
        fontWeight: 'bold',
        marginBottom: 5,
        ...(Platform.OS === 'web'
            ? { textShadow: '0 0 20px rgba(255, 255, 255, 0.6), 0 0 40px rgba(255, 255, 255, 0.3)' }
            : {
                textShadowColor: 'rgba(255, 255, 255, 0.6)',
                textShadowOffset: { width: 0, height: 0 },
                textShadowRadius: 20
            }
        ),
    } as any,



    // Face Icon
    faceContainer: {
        alignItems: 'center',
        marginVertical: 20,
    },
    faceCircle: {
        width: 100,
        height: 100,
        borderRadius: 50,
        borderWidth: 1,
        borderColor: 'rgba(100, 100, 255, 0.5)',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'rgba(255, 255, 255, 0.03)',
    },
    faceIcon: {
        width: 50,
        height: 50,
        tintColor: 'rgba(255, 255, 255, 0.8)',
    },

    // ORBIT'S INSIGHT
    insightContainer: {
        width: '100%',
        paddingHorizontal: 20,
        paddingVertical: 25,
        marginBottom: 30,
    },
    insightTitle: {
        color: '#FFFFFF',
        fontSize: 13,
        fontWeight: 'bold',
        letterSpacing: 1.5,
        marginBottom: 15,
    },
    insightText: {
        color: 'rgba(255, 255, 255, 0.7)',
        fontSize: 13,
        lineHeight: 22,
        textAlign: 'justify',
    },

    // Signal Card (ORBIT's Analysis) - Same style as mission card
    signalCard: {
        marginBottom: 15,
        backgroundColor: 'rgba(255, 255, 255, 0.03)',
        borderColor: 'rgba(255, 255, 255, 0.15)',
    },
    signalLabel: {
        color: '#FFFFFF',
        fontSize: 12,
        fontWeight: 'bold',
        letterSpacing: 2,
        marginBottom: 10,
        ...(Platform.OS === 'web'
            ? { textShadow: '0 0 10px rgba(255, 255, 255, 0.5)' }
            : {
                textShadowColor: 'rgba(255, 255, 255, 0.5)',
                textShadowOffset: { width: 0, height: 0 },
                textShadowRadius: 10,
            }
        ),
    } as any,
    signalText: {
        color: 'rgba(255, 255, 255, 0.85)',
        fontSize: 14,

        lineHeight: 22,
    },

    // Locked Mission Styles
    lockedCard: {
        borderColor: 'rgba(255, 255, 255, 0.2)',
        backgroundColor: 'rgba(0, 0, 0, 0.4)',
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



    lockedText: {
        color: 'rgba(255, 255, 255, 0.7)',
        fontSize: 13,
        fontWeight: 'normal',
    },
    unlockTimeText: {
        color: '#FFFFFF',
        fontSize: 14,
        marginBottom: 5,
        ...(Platform.OS === 'web'
            ? { textShadow: '0 0 10px rgba(255, 255, 255, 0.4)' }
            : {
                textShadowColor: 'rgba(255, 255, 255, 0.4)',
                textShadowOffset: { width: 0, height: 0 },
                textShadowRadius: 10,
            }
        ),
    } as any,
    unlockHint: {
        color: 'rgba(255, 255, 255, 0.6)',
        fontSize: 12,

        textAlign: 'center',
    },

    // Ritual Bar
    ritualContainer: {
        width: '100%',
        marginBottom: 30,
    },
    ritualGradient: {
        width: '100%',
        paddingVertical: 25,
        paddingHorizontal: 30,
        borderTopWidth: 1,
        borderBottomWidth: 1,
        borderColor: 'rgba(100, 50, 150, 0.4)',
        alignItems: 'center',
    },
    ritualLabel: {
        color: 'rgba(255, 255, 255, 0.5)',
        fontSize: 12,
        marginBottom: 8,
    },
    ritualText: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: 'bold',
        ...(Platform.OS === 'web'
            ? { textShadow: '0 0 10px rgba(150, 100, 255, 0.8)' }
            : {
                textShadowColor: 'rgba(150, 100, 255, 0.8)',
                textShadowOffset: { width: 0, height: 0 },
                textShadowRadius: 10,
            }
        ),
    } as any,

    // Connection Button
    actionContainer: {
        width: '100%',
        alignItems: 'center',
        marginBottom: 20,
    },
    connectionButton: {
        width: '100%',
        height: 55,
        borderRadius: 30,
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.25)',
        backgroundColor: 'rgba(0, 0, 0, 0.4)',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 20,
    },
    connectionButtonText: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: 'bold',
        letterSpacing: 1,
    },

    // Debug
    debugButton: {
        marginTop: 30,
        opacity: 0.2,
    },
    debugText: {
        color: 'red',
        fontSize: 12,
    },

    // Special Mission States
    specialMissionTitle: { color: COLORS.gold, fontSize: 20, fontWeight: 'bold', marginBottom: 10, textAlign: 'center' },
    specialMissionText: { color: '#fff', fontSize: 14, textAlign: 'center', lineHeight: 22, marginBottom: 15 },

    // Modals
    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.85)', justifyContent: 'center', alignItems: 'center', padding: 20 },
    modalContent: { width: '100%', padding: 25 },
    modalTitle: { color: COLORS.gold, fontSize: 20, fontWeight: 'bold', marginBottom: 10, textAlign: 'center' },
    modalSubtitle: { color: '#aaa', fontSize: 13, marginBottom: 20, textAlign: 'center' },
    journalInput: { backgroundColor: 'rgba(255,255,255,0.08)', borderRadius: 12, padding: 15, color: '#fff', height: 140, textAlignVertical: 'top', marginBottom: 20, fontSize: 15 },
    imagePickerButton: { marginBottom: 20, alignItems: 'center' },
    imagePickerText: { color: COLORS.gold, fontSize: 13 },
    previewImage: { width: '100%', height: 180, borderRadius: 12, marginBottom: 20, overflow: 'hidden' as const },
    modalButtons: { flexDirection: 'row', justifyContent: 'space-between' },

    analysisModalContent: { width: '90%', padding: 25, alignItems: 'center' },
    analysisTitle: { color: COLORS.gold, fontSize: 22, fontWeight: 'bold', marginBottom: 20 },
    analysisText: { color: '#fff', fontSize: 15, lineHeight: 24, textAlign: 'center' },

    historyContainer: { flex: 1, backgroundColor: '#000' },
    historyHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, borderBottomWidth: 1, borderBottomColor: '#222' },
    historyTitle: { color: COLORS.gold, fontSize: 18, fontWeight: 'bold' },
    closeButton: { color: '#fff', fontSize: 15 },
    historyList: { padding: 20 },
    historyCard: { marginBottom: 20, padding: 20 },
    historyDay: { color: COLORS.gold, fontSize: 16, fontWeight: 'bold', marginBottom: 5 },
    historyDate: { color: '#555', fontSize: 11, marginBottom: 10 },
    historyContent: { color: '#ccc', fontSize: 14, lineHeight: 20 },
    historyImage: { width: '100%', height: 180, borderRadius: 12, marginTop: 15, overflow: 'hidden' as const },

    introContent: { padding: 30, alignItems: 'center' },
    introTitle: { color: COLORS.gold, fontSize: 22, fontWeight: 'bold', marginBottom: 20 },
    introText: { color: '#ccc', fontSize: 15, lineHeight: 24, textAlign: 'center', marginBottom: 20 },

    // Legacy styles for compatibility
    settingsIcon: { fontSize: 24 },
    mainContent: { paddingHorizontal: 20, alignItems: 'center', paddingTop: 20 },
    greetingText: { color: '#fff', fontSize: 18, marginBottom: 10, opacity: 0.8 },
    missionContainer: { width: '100%', marginBottom: 20 },
    missionCard: { padding: 20, alignItems: 'center' },
    missionTitle: { color: COLORS.gold, fontSize: 18, fontWeight: 'bold', marginBottom: 10 },

    missionText: { color: '#fff', fontSize: 18, textAlign: 'center', lineHeight: 28 },
    historyLink: { color: '#888', fontSize: 14, textDecorationLine: 'underline' },

    // Special Mission Event Card Styles
    matchingEventCard: { width: '100%', marginBottom: 20, borderRadius: 16, overflow: 'hidden' },
    matchingEventGradient: { padding: 20, borderRadius: 16, borderWidth: 1, borderColor: 'rgba(255,215,0,0.3)', alignItems: 'center' },
    matchingEventBadge: { color: COLORS.gold, fontSize: 14, fontWeight: 'bold', marginBottom: 8 },
    matchingEventTitle: { color: '#fff', fontSize: 20, fontWeight: 'bold', marginBottom: 8, textAlign: 'center' },
    matchingEventSubtitle: { color: '#aaa', fontSize: 14, textAlign: 'center', marginBottom: 15 },
    matchingEventAction: { backgroundColor: 'rgba(255,255,255,0.1)', paddingHorizontal: 20, paddingVertical: 10, borderRadius: 20 },
    matchingEventActionText: { color: COLORS.gold, fontSize: 14, fontWeight: 'bold' },

    // Match Candidate Modal Styles
    matchCandidateModal: { width: '100%', padding: 25, maxHeight: '90%' },
    matchModalBadge: { color: COLORS.gold, fontSize: 14, fontWeight: 'bold', textAlign: 'center', marginBottom: 5 },
    matchModalTitle: { color: '#fff', fontSize: 24, fontWeight: 'bold', textAlign: 'center', marginBottom: 20 },
    matchCandidateProfile: { alignItems: 'center', marginBottom: 20 },
    matchCandidatePhoto: { width: 100, height: 100, borderRadius: 50, marginBottom: 15, borderWidth: 2, borderColor: COLORS.gold },
    matchCandidateName: { color: '#fff', fontSize: 20, fontWeight: 'bold' },
    matchCandidateDetail: { color: '#aaa', fontSize: 14, marginTop: 5 },
    matchCandidateDeficit: { backgroundColor: 'rgba(255,255,255,0.1)', paddingHorizontal: 15, paddingVertical: 8, borderRadius: 20, marginTop: 10 },
    matchCandidateDeficitText: { color: COLORS.gold, fontSize: 13 },
    matchCandidateBio: { color: '#ccc', fontSize: 14, marginTop: 10, textAlign: 'center' },
    matchModalInstruction: { color: '#888', fontSize: 13, textAlign: 'center', marginBottom: 15 },
    letterInput: { backgroundColor: 'rgba(255,255,255,0.08)', borderRadius: 12, padding: 15, color: '#fff', height: 120, textAlignVertical: 'top', fontSize: 14 },
    letterCharCount: { color: '#666', textAlign: 'right', marginTop: 5, marginBottom: 15, fontSize: 12 },
    matchModalButtons: { flexDirection: 'row' },

    // Matching Entry Button Styles
    matchingEntryButton: { marginTop: 20, borderRadius: 16, overflow: 'hidden' },
    matchingEntryGradient: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 20,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: 'rgba(255, 215, 0, 0.3)',
    },
    matchingEntryIcon: { fontSize: 28, marginRight: 15 },
    matchingEntryContent: { flex: 1 },
    matchingEntryTitle: { color: COLORS.gold, fontSize: 18, fontWeight: 'bold', marginBottom: 5 },
    matchingEntrySubtitle: { color: '#888', fontSize: 13 },
    inboxBadge: {
        backgroundColor: '#FF3B30',
        width: 24,
        height: 24,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
    },
    inboxBadgeText: { color: '#fff', fontSize: 12, fontWeight: 'bold' },

    // Analysis Modal - Level & Progress Reason
    levelIndicator: {
        backgroundColor: 'rgba(150, 100, 255, 0.2)',
        paddingHorizontal: 15,
        paddingVertical: 6,
        borderRadius: 15,
        alignSelf: 'center',
        marginBottom: 15,
        borderWidth: 1,
        borderColor: 'rgba(150, 100, 255, 0.4)',
    },
    levelIndicatorText: {
        color: '#E0CFFF',
        fontSize: 12,
        fontWeight: 'bold',
        letterSpacing: 1,
    },
    progressReasonBox: {
        backgroundColor: 'rgba(255, 215, 0, 0.1)',
        padding: 15,
        borderRadius: 12,
        marginTop: 15,
        borderWidth: 1,
        borderColor: 'rgba(255, 215, 0, 0.3)',
    },
    progressReasonText: {
        color: COLORS.gold,
        fontSize: 14,
        lineHeight: 20,
    },

    // Growth Stats Section
    statsSection: {
        marginTop: 30,
        width: '100%',
    },
    statsCard: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(255, 255, 255, 0.05)',
        padding: 16,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.1)',
    },
    statsIcon: { fontSize: 24, marginRight: 12 },
    statsContent: { flex: 1 },
    statsLabel: { color: '#888', fontSize: 12, marginBottom: 2 },
    statsValue: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
    statsArrow: { color: '#666', fontSize: 18 },

    // Progress Bar
    progressBarContainer: { marginTop: 12 },
    progressBarBackground: {
        height: 6,
        backgroundColor: 'rgba(255, 255, 255, 0.1)',
        borderRadius: 3,
        overflow: 'hidden',
    },
    progressBarFill: {
        height: '100%',
        backgroundColor: COLORS.gold,
        borderRadius: 3,
    },
    progressText: {
        color: '#666',
        fontSize: 11,
        marginTop: 6,
        textAlign: 'center',
    },
});




export default HomeScreen;
