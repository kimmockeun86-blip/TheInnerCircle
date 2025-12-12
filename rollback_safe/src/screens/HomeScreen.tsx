// ID: B-01, B-02, B-03, B-04
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal, TextInput, ScrollView, SafeAreaView, Alert, Animated, useWindowDimensions, Image, ActivityIndicator, Platform, TouchableWithoutFeedback } from 'react-native';
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

interface HomeScreenProps {
    route: HomeScreenRouteProp;
    navigation: HomeScreenNavigationProp;
}

interface JournalEntry {
    day: number;
    content: string;
    date: string;
    imageUri?: string;
}

const day10IntroMessagesFemale = [
    "당신의 10일을 되돌아봅니다.",
    "이번 미션은 당신처럼 성장중인 사람과의 만남입니다.",
    "꼭 이성이 매칭되지 않습니다.",
    "수천개의 데이터 중 당신과 가장 완벽하게 공명하는 한 사람입니다.",
    "행운을 빕니다.",
    "저는 당신과 항상 함께입니다."
];

const day10IntroMessagesMale = [
    "당신의 10일을 되돌아봅니다.",
    "당신은 아직 스스로의 성장을 원하지 않습니다.",
    "지난날을 되돌아보고 성장하세요.",
    "다시 10일간의 여정을 시작합니다."
];

const HomeScreen: React.FC<HomeScreenProps> = ({ navigation, route }) => {
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
    const [currentMissionTitle, setCurrentMissionTitle] = useState<string>('오늘의 리추얼');
    const [nextMissionUnlockTime, setNextMissionUnlockTime] = useState<string | null>(null);
    const [day10Done, setDay10Done] = useState(false);
    const [matchDecision, setMatchDecision] = useState<'continue' | 'stop' | null>(null);
    const [matchResult, setMatchResult] = useState<'success' | 'fail' | null>(null);
    const [isWaitingForPartner, setIsWaitingForPartner] = useState(false);
    const [adminMission, setAdminMission] = useState<string | null>(null);
    const [isJudging, setIsJudging] = useState(false);
    const [judgmentModalVisible, setJudgmentModalVisible] = useState(false);
    const [confirmationModalVisible, setConfirmationModalVisible] = useState(false);
    const [matchDecisionModalVisible, setMatchDecisionModalVisible] = useState(false);
    const [judgmentResult, setJudgmentResult] = useState<{ title: string; message: string; type: 'reset' | 'match' } | null>(null);

    const [day10IntroVisible, setDay10IntroVisible] = useState(false);
    const [day10IntroStep, setDay10IntroStep] = useState(0);
    const [displayedText, setDisplayedText] = useState('');
    const [isTyping, setIsTyping] = useState(false);
    const fadeAnim = useRef(new Animated.Value(0)).current;
    const [isMatchDeclined, setIsMatchDeclined] = useState(false);
    const [isMatching, setIsMatching] = useState(false);
    const [matchFound, setMatchFound] = useState(false);
    const [matchRequestConfirmed, setMatchRequestConfirmed] = useState(false);

    const sparkleAnim1 = useRef(new Animated.Value(0)).current;
    const sparkleAnim2 = useRef(new Animated.Value(0)).current;
    const sparkleAnim3 = useRef(new Animated.Value(0)).current;

    const visualizerMode = isAnalyzing || isJudging ? 'thinking' : (dayCount === 10 ? 'speaking' : 'listening');

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
        "당신의 영혼이 준비되었습니다."
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

    useFocusEffect(
        useCallback(() => {
            const loadData = async () => {
                try {
                    const savedDay = await AsyncStorage.getItem('currentDay');
                    if (savedDay) {
                        setDayCount(parseInt(savedDay, 10));
                    }
                    loadJournalHistory();
                    // Check for reload flag
                    const needsReload = await AsyncStorage.getItem('needsReload');
                    if (needsReload === 'true') {
                        await AsyncStorage.removeItem('needsReload');
                        // Perform any additional reload logic if needed
                    }
                } catch (e) {
                    console.error('Failed to load data on focus:', e);
                }
            };
            loadData();
        }, [])
    );

    useEffect(() => {
        if (dayCount === 10 && !day10Done) {
            AsyncStorage.getItem('hasSeenDay10Intro').then(hasSeen => {
                if (hasSeen !== 'true') {
                    // Start with Judging ("Looking back...")
                    setIsJudging(true);

                    // After 3 seconds, switch to Intro Chat
                    setTimeout(() => {
                        setIsJudging(false);
                        setDay10IntroVisible(true);
                        setDay10IntroStep(0);
                    }, 3000);
                }
            });
        }
    }, [dayCount, day10Done]);



    useEffect(() => {
        if (day10IntroVisible) {
            setIsTyping(true);
            setDisplayedText('');
            const messages = (userGender === 'female' || userGender === '여성') ? day10IntroMessagesFemale : day10IntroMessagesMale;

            if (day10IntroStep >= messages.length) return;

            const fullText = messages[day10IntroStep];
            let i = 0;

            const interval = setInterval(() => {
                setDisplayedText(fullText.substring(0, i + 1));
                i++;
                if (i === fullText.length) {
                    clearInterval(interval);
                    setIsTyping(false);

                    // Auto-advance logic
                    let delay = 3000;
                    if (day10IntroStep === 0) {
                        delay = 10000; // 10s for first message
                    } else {
                        delay = Math.max(2000, fullText.length * 150);
                    }

                    setTimeout(() => {
                        // Check if we are still on the same step (to avoid race conditions if user tapped)
                        setDay10IntroStep(prev => {
                            if (prev === day10IntroStep) {
                                if (prev < messages.length - 1) {
                                    return prev + 1;
                                } else {
                                    handleDay10IntroNext(); // Finish
                                    return prev;
                                }
                            }
                            return prev;
                        });
                    }, delay);
                }
            }, 50);
            return () => clearInterval(interval);
        }
    }, [day10IntroVisible, day10IntroStep, userGender]);

    const checkDayProgression = async () => {
        return true; // TEMPORARY: Disable time lock for testing
    };

    const loadUserData = async () => {
        try {
            // Check for user data to determine if we should redirect to Onboarding
            const userName = await AsyncStorage.getItem('userName');
            if (!userName) {
                console.log('HomeScreen: No user data found. Redirecting to Onboarding.');
                navigation.replace('Onboarding');
                return;
            }

            const storedGender = await AsyncStorage.getItem('userGender');
            if (storedGender) setUserGender(storedGender);

            const storedDay = await AsyncStorage.getItem('dayCount');
            let currentDayCount = storedDay ? parseInt(storedDay, 10) : 1;
            if (isNaN(currentDayCount) || currentDayCount < 1) currentDayCount = 1;
            setDayCount(currentDayCount);

            const storedStatus = await AsyncStorage.getItem('missionStatus');
            setMissionStatus(storedStatus);

            const storedMission = await AsyncStorage.getItem(`mission_day_${currentDayCount}`);
            let missionData = null;

            if (storedMission) {
                try {
                    missionData = JSON.parse(storedMission);
                } catch (e) {
                    // Legacy string support
                    missionData = { title: "오늘의 리추얼", content: storedMission };
                }
            }

            // A. Admin Mission Priority Check
            const storedAdminMission = await AsyncStorage.getItem('adminMission');
            if (storedAdminMission) {
                setAdminMission(storedAdminMission);
                setCurrentMissionText(storedAdminMission);
                setCurrentMissionTitle("관리자 지령");
            } else if (missionData) {
                setCurrentMissionText(missionData.content);
                setCurrentMissionTitle(missionData.title || "오늘의 리추얼");
            } else {
                // Skip generic mission generation for Day 1 as it will be handled by analyzeProfile
                if (currentDayCount === 1) {
                    console.log("HomeScreen: Skipping generic mission generation for Day 1 (waiting for profile analysis)");
                } else {
                    // Call API to generate mission
                    const name = await AsyncStorage.getItem('userName') || '탐험가';
                    const deficit = await AsyncStorage.getItem('userDeficit') || '미지';
                    const complex = await AsyncStorage.getItem('userComplex') || '불확실성';

                    console.log("HomeScreen: Generating Daily Ritual...");
                    // Don't await here to prevent blocking UI, but for now we want to see it load
                    api.generateMission({ dayCount: currentDayCount, deficit, complex, name }).then(async (response) => {
                        if (response.success && response.mission) {
                            missionData = response.mission;
                            await AsyncStorage.setItem(`mission_day_${currentDayCount}`, JSON.stringify(missionData));
                            setCurrentMissionText(missionData.content);
                            setCurrentMissionTitle("오늘의 미션");
                        } else {
                            const defaultMission = currentDayCount <= 9 ? missions[currentDayCount - 1] : "당신의 영혼이 준비되었습니다.";
                            setCurrentMissionText(defaultMission);
                            setCurrentMissionTitle("오늘의 미션");
                        }
                    });
                }
            }

            const storedDay10Done = await AsyncStorage.getItem('day10Done');
            if (storedDay10Done === 'true') {
                setDay10Done(true);
            }

            const storedMatchDecision = await AsyncStorage.getItem('matchDecision');
            setMatchDecision(storedMatchDecision as any);

            const storedMatchResult = await AsyncStorage.getItem('matchResult');
            setMatchResult(storedMatchResult as any);

            const storedWaiting = await AsyncStorage.getItem('isWaitingForPartner');
            setIsWaitingForPartner(storedWaiting === 'true');

            // Load AI Analysis
            let storedAnalysis = await AsyncStorage.getItem(`ai_analysis_day_${currentDayCount}`);
            if (storedAnalysis) {
                try {
                    const parsed = JSON.parse(storedAnalysis);
                    let analysisContent = '';
                    if (typeof parsed === 'string') {
                        analysisContent = parsed;
                    } else if (typeof parsed === 'object' && parsed !== null && parsed.analysis) {
                        analysisContent = parsed.analysis;
                    }

                    // Check for error/fallback markers in cached data
                    if (analysisContent.includes('AI 분석 서버 연결 실패') ||
                        analysisContent.includes('자동 분석') ||
                        analysisContent.includes('예비 메시지')) {
                        console.log('HomeScreen: Found stale/fallback data in cache. Clearing to force re-fetch.');
                        storedAnalysis = null; // Force re-fetch
                        setAiAnalysis(null);
                    } else {
                        setAiAnalysis(analysisContent);
                    }
                } catch (e) {
                    console.error('Failed to parse analysis:', e);
                    storedAnalysis = null;
                }
            } else {
                setAiAnalysis(null);
            }

            // Load User Photo
            const storedPhoto = await AsyncStorage.getItem('userPhoto');
            if (storedPhoto) setUserPhoto(storedPhoto);

            // API Call for Day 1 if needed
            if (currentDayCount === 1 && !storedAnalysis) {
                const name = await AsyncStorage.getItem('userName') || '구도자';
                const age = await AsyncStorage.getItem('userAge') || 'Unknown';
                const gender = await AsyncStorage.getItem('userGender') || 'Unknown';
                const deficit = await AsyncStorage.getItem('userDeficit') || 'Unknown';

                console.log("HomeScreen: Requesting Profile Analysis...");
                const analysis = await api.analyzeProfile({ name, age, gender, deficit });

                if (analysis && (analysis.success || analysis.analysis)) {
                    let analysisText = null;
                    if (typeof analysis === 'string') {
                        analysisText = analysis;
                    } else if (analysis.analysis && typeof analysis.analysis === 'string') {
                        analysisText = analysis.analysis;
                    }

                    // Check for "Connection Failed" message from stale api.ts and override it
                    if (analysisText === 'AI 분석 서버 연결 실패') {
                        analysisText = `${name}님, 당신의 '${deficit}'은(는) 사실 깊은 내면의 울림입니다. 별들이 어둠 속에서 더 밝게 빛나듯, 당신의 결핍은 고유한 빛을 내기 위한 준비 과정입니다. (AI 연결 불안정으로 인한 자동 분석)`;
                    }

                    if (analysisText) {
                        setAiAnalysis(analysisText);
                    }

                    await AsyncStorage.setItem(`ai_analysis_day_${currentDayCount}`, JSON.stringify(analysis));

                    if (analysis.recommendedMission) {
                        setCurrentMissionText(analysis.recommendedMission);
                        await AsyncStorage.setItem(`mission_day_${currentDayCount}`, analysis.recommendedMission);
                    }
                } else {
                    // Fallback if API returns null/false
                    const fallbackText = `${name}님, 당신의 '${deficit}'은(는) 사실 깊은 내면의 울림입니다. 별들이 어둠 속에서 더 밝게 빛나듯, 당신의 결핍은 고유한 빛을 내기 위한 준비 과정입니다. (AI 연결 불안정으로 인한 자동 분석)`;
                    setAiAnalysis(fallbackText);
                    setCurrentMissionText("오늘 하루, 가장 조용한 시간을 찾아 5분간 침묵하며 내면의 소리를 들어보세요.");
                }
            }
        } catch (e) {
            console.error('Failed to load user data:', e);
        }
    };

    useFocusEffect(
        useCallback(() => {
            loadUserData();
            loadJournalHistory();
        }, [])
    );

    useEffect(() => {
        // Initial load
        loadUserData();
    }, []);

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
            Alert.alert('알림', '오늘의 깨달음을 한 줄이라도 남겨주세요.\n당신의 기록이 성장의 밑거름이 됩니다.');
            return;
        }

        const canProceed = await checkDayProgression();
        if (!canProceed && nextMissionUnlockTime) {
            Alert.alert('알림', `다음 미션은 ${nextMissionUnlockTime}에 열립니다.`);
            return;
        }

        setIsAnalyzing(true);

        try {
            const formData = new FormData();
            formData.append('journalText', journalInput);
            formData.append('name', name);
            formData.append('deficit', deficit);
            formData.append('dayCount', dayCount.toString());

            if (selectedImage) {
                const filename = selectedImage.split('/').pop();
                const match = /(\.\w+)$/.exec(filename || '');
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
                // Update both Insight and Mission immediately
                setCurrentAnalysis({ result: response.result, feedback: response.feedback });
                setAiAnalysis(response.feedback); // Update Insight UI

                if (response.recommendedMission) {
                    setCurrentMissionText(response.recommendedMission); // Update Mission UI
                    const nextDay = dayCount + 1;
                    await AsyncStorage.setItem(`mission_day_${nextDay}`, response.recommendedMission);
                }

                // Update User Photo if new image provided
                if (selectedImage) {
                    setUserPhoto(selectedImage);
                    await AsyncStorage.setItem('userPhoto', selectedImage);
                }

                const newEntry: JournalEntry = {
                    day: dayCount,
                    content: journalInput,
                    date: new Date().toLocaleDateString(),
                    imageUri: selectedImage || undefined
                };

                const updatedHistory = [newEntry, ...journalHistory];
                setJournalHistory(updatedHistory);
                await AsyncStorage.setItem('journalHistory', JSON.stringify(updatedHistory));

                if (dayCount === 9) {
                    // [Day 9 -> 10 Transition]
                    // 1. Trigger Brightening Effect
                    Animated.timing(fadeAnim, {
                        toValue: 1,
                        duration: 7000, // [FIX] 7 seconds duration
                        useNativeDriver: true
                    }).start(async () => {
                        // 2. Update State while white
                        const newDay = 10;
                        setDayCount(newDay);
                        setMissionStatus(null);
                        await AsyncStorage.setItem('dayCount', newDay.toString());
                        await AsyncStorage.removeItem('missionStatus');
                        await AsyncStorage.setItem('lastCompletedDate', new Date().toISOString());

                        // 3. Prepare Day 10 Intro
                        setDay10IntroVisible(true);
                        setDay10IntroStep(0);
                        setDisplayedText('');
                        setIsTyping(false);

                        // 4. Fade In to Intro
                        Animated.timing(fadeAnim, {
                            toValue: 0,
                            duration: 1000,
                            useNativeDriver: true
                        }).start();
                    });

                    setJournalModalVisible(false);
                    setJournalInput('');
                    setSelectedImage(null);
                    return; // Stop here, let the animation handle the rest
                }

                if (dayCount === 10) {
                    if (missionStatus === 'secret_mission_active') {
                        // Secret Mission Done -> Ask for Decision
                        // Skip Analysis Modal, Open Decision Modal
                        setJournalModalVisible(false);
                    }
                }

                const newDay = dayCount + 1;
                setDayCount(newDay);
                setMissionStatus(null);

                // Update AI Analysis on Home Screen to show the feedback from this journal
                if (response.feedback) {
                    setAiAnalysis(response.feedback);
                    await AsyncStorage.setItem(`ai_analysis_day_${newDay}`, JSON.stringify({ analysis: response.feedback }));
                } else {
                    setAiAnalysis(null);
                }

                await AsyncStorage.setItem('dayCount', newDay.toString());
                await AsyncStorage.removeItem('missionStatus');
                await AsyncStorage.setItem('lastCompletedDate', new Date().toISOString());

                if (response.recommendedMission) {
                    setCurrentMissionText(response.recommendedMission); // Update UI immediately
                    await AsyncStorage.setItem(`mission_day_${newDay}`, response.recommendedMission);
                }

                setJournalModalVisible(false);
                setJournalInput('');
                setSelectedImage(null);

                const fullProfile = {
                    name: name,
                    deficit: deficit,
                    recentJournal: journalInput,
                    previousAnalysis: aiAnalysis
                };

                // Background update - don't await
                api.analyzeProfile(fullProfile).then(reAnalysis => {
                    if (reAnalysis.success) {
                        setAiAnalysis(reAnalysis.analysis);
                    }
                }).catch(e => {
                    console.error('[HomeScreen] Profile Analysis Error:', e);
                });

                setAnalysisModalVisible(true);

            } else {
                Alert.alert('오류', '분석 실패: ' + (response.message || '알 수 없는 오류'));
            }
        } catch (e: any) {
            console.error('[HomeScreen] Analysis Error:', e);
            if (e.message === 'TIMEOUT') {
                Alert.alert('오류', '서버 응답 시간이 초과되었습니다. (45초)\n서버 상태를 확인해주세요.');
            } else {
                Alert.alert('오류', '네트워크 오류가 발생했습니다.\n' + (e.message || ''));
            }
        } finally {
            setIsAnalyzing(false);
        }
    };

    const handleDay10IntroNext = () => {
        const messages = (userGender === 'female' || userGender === '여성') ? day10IntroMessagesFemale : day10IntroMessagesMale;

        if (isTyping) {
            setDisplayedText(messages[day10IntroStep]);
            setIsTyping(false);
            return;
        }

        if (day10IntroStep < messages.length - 1) {
            setDay10IntroStep(prev => prev + 1);
        } else {
            // Intro Finished -> Brightening Effect
            Animated.timing(fadeAnim, {
                toValue: 1,
                duration: 2000,
                useNativeDriver: true,
            }).start(() => {
                setDay10IntroVisible(false);
                setDay10IntroStep(0);

                // Fade out to normal
                Animated.timing(fadeAnim, {
                    toValue: 0,
                    duration: 2000,
                    useNativeDriver: true,
                }).start(async () => {
                    await AsyncStorage.setItem('hasSeenDay10Intro', 'true');
                    // Event Complete
                });
            });
        }
    };

    const handleSkip9Days = async (gender: 'male' | 'female') => {
        try {
            const maleEntries = [
                "오늘 하루, 나를 가장 힘들게 했던 건 타인의 시선이었다. 하지만 그 시선 속에서 자유로워지는 순간, 나는 진정한 나를 마주할 수 있었다. 고요함 속에서 내면의 목소리가 들려왔다.",
                "회피하고 싶었던 질문은 '나는 정말 행복한가?'였다. 겉으로는 웃고 있었지만, 속으로는 울고 있었던 나를 발견했다. 이제는 그 슬픔조차 안아주고 싶다.",
                "오늘 만난 친구의 눈빛에서 깊은 외로움을 보았다. 그 외로움은 나의 외로움과 닮아 있었다. 우리는 서로의 거울이었다.",
                "나의 결핍인 '인정 욕구'는 사실 나를 더 높은 곳으로 이끄는 원동력이었다. 결핍은 채워야 할 구멍이 아니라, 나를 성장시키는 날개였다.",
                "새벽 2시, 도시의 소음이 잦아든 순간 찾아온 고요함. 그 속에서 나는 비로소 숨을 쉴 수 있었다. 고요함은 공허가 아니라 충만이었다.",
                "어머니에게 '사랑한다'는 말을 전하지 못했다. 입 밖으로 내뱉는 순간 눈물이 터질 것 같아서. 하지만 침묵 속에서도 마음은 전해졌으리라 믿는다.",
                "오늘의 실패는 '거절'이었다. 하지만 거절당함으로써 나는 타인의 기대가 아닌 나의 길을 갈 자유를 얻었다. 실패는 자유의 다른 이름이었다.",
                "내 안의 두려움은 '버림받는 것'이었다. 하지만 혼자가 되는 것을 두려워하지 않을 때, 나는 진정으로 누군가와 함께할 수 있음을 깨달았다.",
                "편의점 알바생에게 건넨 따뜻한 인사 한마디. 그 작은 친절이 그의 하루를, 그리고 나의 하루를 밝혔다. 친절은 메아리처럼 돌아온다.",
                "준비되었다. 나의 영혼은 이제 더 깊은 곳으로 나아갈 준비가 되었다. 어둠을 지나 빛으로, 고독을 지나 연대로."
            ];

            const femaleEntries = [
                "오늘 느낀 가장 강렬한 감정은 '해방감'이었다. 꽉 끼는 구두를 벗어던지듯, 타인의 기대라는 코르셋을 벗어던졌다. 나는 나로서 충분하다.",
                "스스로에게 묻고 싶지 않았던 질문, '나는 지금 사랑하고 있는가?'. 그 질문을 마주하자, 내 안의 사랑이 깨어났다. 나 자신을 먼저 사랑하기로 했다.",
                "지하철에서 마주친 노인의 눈빛. 그 깊은 주름 속에 담긴 세월의 무게를 보았다. 삶은 견디는 것이 아니라, 살아내는 것임을 배웠다.",
                "나의 결핍인 '애정 결핍'은 사실 사랑을 줄 수 있는 거대한 그릇이었다. 나는 사랑받기 위해 태어난 것이 아니라, 사랑하기 위해 태어난 존재다.",
                "비 오는 창밖을 바라보며 느낀 고요함. 빗소리가 내 마음의 먼지를 씻어내렸다. 고요함 속에서 나는 다시 태어났다.",
                "아버지에게 전하지 못한 말, '고맙습니다'. 그 투박한 등 뒤에 숨겨진 사랑을 이제야 알 것 같다. 마음속으로나마 감사를 전한다.",
                "오늘의 실패는 '완벽하지 못한 것'. 하지만 완벽하지 않기에 나는 더 성장할 수 있다. 나의 불완전함이 나를 완성시킨다.",
                "내면의 두려움은 '늙어가는 것'. 하지만 시간의 흐름은 쇠퇴가 아니라 성숙임을 깨달았다. 나는 늙어가는 것이 아니라 익어가는 것이다.",
                "길 잃은 고양이에게 건넨 물 한 모금. 그 작은 생명과의 교감이 나를 치유했다. 우리는 모두 연결되어 있다.",
                "준비되었다. 나의 영혼은 이제 껍질을 깨고 날아오를 준비가 되었다. 더 넓은 세상으로, 더 깊은 사랑으로."
            ];

            const entries = gender === 'male' ? maleEntries : femaleEntries;
            const dummyHistory: JournalEntry[] = [];

            for (let i = 0; i < 8; i++) {
                const date = new Date();
                date.setDate(date.getDate() - (8 - i)); // Past 9 days

                dummyHistory.push({
                    day: i + 1,
                    content: entries[i],
                    date: date.toLocaleDateString(),
                });
            }

            await AsyncStorage.setItem('journalHistory', JSON.stringify(dummyHistory));
            setJournalHistory(dummyHistory);

            setDayCount(9);
            await AsyncStorage.setItem('dayCount', '9');
            setIsMatchDeclined(false); // [FIX] Reset match decline state
            Alert.alert('Debug', `Day 9로 이동했습니다. (${gender === 'male' ? '남성' : '여성'} 데이터)`);

        } catch (e) {
            console.error(e);
            Alert.alert('Error', 'Failed to skip days');
        }
    };

    return (
        <LinearGradient
            colors={COLORS.backgroundGradient as any}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.container}
        >
            <View style={styles.visualizerBackground}>
                <MysticVisualizer
                    isActive={true}
                    mode={visualizerMode}
                    sceneUrl="https://prod.spline.design/gjz7s8UmZl4fmUa7/scene.splinecode"
                />
                {
                    isJudging && (
                        <View style={styles.judgingOverlay}>
                            <Text style={styles.judgingText}>당신의 지난날을{'\n'}되돌아보고 있습니다...</Text>
                        </View>
                    )
                }
            </View >

            <SafeAreaView style={styles.safeArea}>
                <View style={styles.header}>
                    <View style={{ position: 'relative', justifyContent: 'center', alignItems: 'center' }}>
                        <View style={{ position: 'absolute', width: 300, height: 300, zIndex: 0, transform: [{ scale: 0.2 }], opacity: 0.6 }}>
                            {/* @ts-ignore */}
                            <MysticVisualizer
                                isActive={true}
                                mode="listening"
                                sceneUrl="https://prod.spline.design/cecqF9q8Ct3dtFcA/scene.splinecode"
                                style={{ width: '100%', height: '100%' }}
                            />
                        </View>
                        <Text style={styles.headerTitle}>ORBIT</Text>
                    </View>
                </View>

                {/* Debug Buttons */}
                <View style={styles.debugButtonContainer}>
                    <TouchableOpacity style={styles.debugButton} onPress={() => handleSkip9Days('male')}>
                        <Text style={styles.debugButtonText}>Skip 9 (M)</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.debugButton} onPress={() => handleSkip9Days('female')}>
                        <Text style={styles.debugButtonText}>Skip 9 (F)</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={[styles.debugButton, { backgroundColor: '#FF00FF' }]} onPress={() => {
                        setDayCount(30);
                        AsyncStorage.setItem('dayCount', '30');
                        setIsMatchDeclined(false); // [FIX] Reset match decline state
                        Alert.alert('Debug', 'Day 30으로 이동했습니다.');
                    }}>
                        <Text style={styles.debugButtonText}>Skip 30</Text>
                    </TouchableOpacity>
                </View>

                <ScrollView contentContainerStyle={styles.scrollContent}>
                    <View style={styles.mainContent}>
                        <Text style={styles.greetingText}>Day {dayCount}</Text>

                        <View style={styles.profileImageContainer}>
                            <Image
                                source={
                                    userPhoto
                                        ? { uri: userPhoto }
                                        : (userGender === 'female' || userGender === '여성')
                                            ? require('../../assets/default_profile_female.png')
                                            : require('../../assets/default_profile_male.png')
                                }
                                style={styles.profileImage}
                            />
                        </View>



                        {aiAnalysis && (
                            <GlassCard style={{ marginBottom: 20, padding: 20 }}>
                                <Text style={{ color: COLORS.gold, fontSize: 14, marginBottom: 10 }}>ORBIT'S INSIGHT</Text>
                                <Text style={{ color: 'rgba(255,255,255,0.8)', fontSize: 14, lineHeight: 22 }}>
                                    {aiAnalysis}
                                </Text>
                            </GlassCard>
                        )}

                        {/* Mission Card */}
                        {currentMissionText ? (
                            <View style={styles.missionContainer}>
                                <GlassCard style={styles.missionCard}>
                                    <Text style={{ color: COLORS.gold, fontSize: 14, marginBottom: 10, letterSpacing: 1.5 }}>
                                        {currentMissionTitle}
                                    </Text>
                                    <Text style={{ color: '#fff', fontSize: 18, textAlign: 'center', lineHeight: 28, fontFamily: FONTS.body }}>
                                        {currentMissionText}
                                    </Text>
                                </GlassCard>
                            </View>
                        ) : null}

                        {/* Action Buttons */}
                        <View style={{ width: '100%', gap: 15 }}>
                            <HolyButton
                                title={(dayCount % 10 === 0 && !isMatchDeclined) ? (matchRequestConfirmed ? "상대방 기다리는 중" : "인연만들기") : "기록하기"}
                                onPress={() => {
                                    if (dayCount % 10 === 0 && !isMatchDeclined) {
                                        setConfirmationModalVisible(true);
                                    } else {
                                        setJournalModalVisible(true);
                                    }
                                }}
                                style={styles.neonButton}
                                textStyle={styles.neonButtonText}
                            />
                        </View>
                    </View>
                </ScrollView >
            </SafeAreaView >

            {/* Day 10 Intro Modal (Cinematic Text) */}
            <Modal visible={day10IntroVisible} animationType="fade" transparent={false}>
                <View style={[styles.modalOverlay, { backgroundColor: '#000000' }]}>
                    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', width: '100%', paddingHorizontal: 20 }}>
                        <Text style={[styles.personaText, { textAlign: 'center' }]}>
                            {displayedText}
                        </Text>
                    </View>
                </View>
            </Modal>

            {/* Brightening Overlay */}
            <Animated.View
                style={[
                    styles.brighteningOverlay,
                    {
                        opacity: fadeAnim,
                        zIndex: day10IntroVisible || isJudging ? 2000 : -1 // Ensure it's on top during transition
                    }
                ]}
                pointerEvents="none"
            />

            {/* Journal Modal */}
            < Modal visible={journalModalVisible} animationType="slide" transparent={true} >
                <View style={styles.modalOverlay}>
                    <GlassCard style={styles.modalContent}>
                        <Text style={styles.modalTitle}>
                            {dayCount === 10 && missionStatus === 'secret_mission_active' ? "비밀 지령 수행 기록" : "미션 수행 기록"}
                        </Text>
                        <Text style={styles.modalSubtitle}>
                            {dayCount === 10 && missionStatus === 'secret_mission_active'
                                ? "상대방과의 만남, 그리고 당신의 감정을 솔직하게 기록하세요."
                                : "당신의 성장을 위한 미션 수행 결과를 기록하십시오."}
                        </Text>

                        <TextInput
                            style={styles.journalInput}
                            placeholder="데이터 입력..."
                            placeholderTextColor="#666"
                            multiline
                            value={journalInput}
                            onChangeText={setJournalInput}
                        />

                        <TouchableOpacity onPress={pickImage} style={styles.imagePickerButton}>
                            <Text style={styles.imagePickerText}>
                                {selectedImage ? "📷 사진 변경하기" : "📷 당신의 미소를 기록하세요"}
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
                                title={isAnalyzing ? "분석 중..." : "데이터 전송"}
                                onPress={handleCompleteReflection}
                                disabled={isAnalyzing}
                                style={{ flex: 1 }}
                                textStyle={{ fontSize: 13 }}
                            />
                        </View>
                    </GlassCard>
                </View>
            </Modal >

            {/* Analysis Result Modal */}
            < Modal visible={analysisModalVisible} animationType="fade" transparent={true} >
                <View style={styles.modalOverlay}>
                    <GlassCard style={styles.analysisModalContent}>
                        <Text style={styles.analysisTitle}>오르빗의 분석</Text>
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
            </Modal >

            {/* Judgment Modal (Day 10 Result) */}
            < Modal visible={judgmentModalVisible} animationType="fade" transparent={true} >
                <View style={styles.modalOverlay}>
                    <GlassCard style={styles.analysisModalContent}>
                        <Text style={styles.analysisTitle}>{judgmentResult?.title}</Text>
                        <Text style={styles.analysisText}>{judgmentResult?.message}</Text>
                        <HolyButton
                            title="확인"
                            onPress={async () => {
                                setJudgmentModalVisible(false);
                                if (judgmentResult?.type === 'reset') {
                                    // Reset Logic
                                    await AsyncStorage.setItem('dayCount', '1');
                                    await AsyncStorage.setItem('day10Done', 'false');
                                    setDayCount(1);
                                    setDay10Done(false);
                                    Alert.alert('알림', '새로운 여정이 시작됩니다.');
                                } else if (judgmentResult?.type === 'match') {
                                    // Match Logic
                                    console.log('Judgment Confirmed: Match Type. Opening confirmation modal...');
                                    setConfirmationModalVisible(true);
                                }
                            }}
                            style={{ marginTop: 20, width: '100%' }}
                        />
                    </GlassCard>
                </View>
            </Modal >

            {/* Confirmation Modal (Match Start) */}
            < Modal visible={confirmationModalVisible} animationType="fade" transparent={true} >
                <View style={styles.modalOverlay}>
                    <GlassCard style={styles.analysisModalContent}>
                        <Text style={styles.analysisTitle}>매칭 시작</Text>
                        <Text style={styles.analysisText}>
                            당신처럼 내면의 성장을 위해 미션을 해온 사람과 매칭해드립니다.{'\n\n'}
                            꼭 이성과 매칭되는건 아닙니다.{'\n'}
                            매칭하시겠습니까?
                        </Text>
                        <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 20, width: '100%' }}>
                            <HolyButton
                                title="아니오"
                                onPress={() => setConfirmationModalVisible(false)}
                                variant="ghost"
                                style={{ flex: 1, marginRight: 10 }}
                            />
                            <HolyButton
                                title="예"
                                onPress={async () => {
                                    setConfirmationModalVisible(false);
                                    setIsMatching(true);
                                    // Simulate matching process
                                    setTimeout(async () => {
                                        setIsMatching(false);
                                        setMatchFound(true);
                                        await AsyncStorage.setItem('matchFound', 'true');
                                        Alert.alert('매칭 성공!', '새로운 인연을 찾았습니다. 비밀 지령이 시작됩니다.');
                                        setMissionStatus('secret_mission_active');
                                        await AsyncStorage.setItem('missionStatus', 'secret_mission_active');
                                        setCurrentMissionTitle('비밀 지령');
                                        setCurrentMissionText('상대방과 만나서 대화하고, 그 사람의 눈을 통해 당신의 내면을 들여다보세요.');
                                    }, 3000);
                                }}
                                style={{ flex: 1 }}
                            />
                        </View>
                    </GlassCard>
                </View>
            </Modal >

            {/* Matching Modal */}
            <Modal visible={isMatching} animationType="fade" transparent={true}>
                <View style={styles.modalOverlay}>
                    <GlassCard style={styles.analysisModalContent}>
                        <Text style={styles.analysisTitle}>매칭 중...</Text>
                        <Text style={styles.analysisText}>
                            상대방에게 메시지를 전하고 있습니다.
                        </Text>
                        <ActivityIndicator size="large" color={COLORS.gold} style={{ marginTop: 20 }} />
                    </GlassCard>
                </View>
            </Modal>

            {/* Match Found Modal */}
            <Modal visible={matchFound} animationType="fade" transparent={true}>
                <View style={styles.modalOverlay}>
                    <GlassCard style={styles.analysisModalContent}>
                        <Text style={styles.analysisTitle}>매칭 성공!</Text>
                        <Text style={styles.analysisText}>
                            매칭을 신청하였습니다. 상대방이 확인하면 알려드리겠습니다.
                        </Text>
                        <HolyButton
                            title="확인"
                            onPress={() => {
                                setMatchFound(false);
                                setMatchRequestConfirmed(true);
                            }}
                            style={{ marginTop: 20, width: '100%' }}
                        />
                    </GlassCard>
                </View>
            </Modal>

            {/* Waiting for Partner Modal */}
            <Modal visible={isWaitingForPartner} animationType="fade" transparent={true}>
                <View style={styles.modalOverlay}>
                    <GlassCard style={styles.analysisModalContent}>
                        <Text style={styles.analysisTitle}>상대방의 결정을 기다리는 중...</Text>
                        <Text style={styles.analysisText}>
                            상대방도 당신과의 만남을 계속 이어갈지 결정 중입니다. 잠시만 기다려주세요.
                        </Text>
                        <ActivityIndicator size="large" color={COLORS.gold} style={{ marginTop: 20 }} />
                    </GlassCard>
                </View>
            </Modal>

            {/* Match Decision Modal */}
            < Modal visible={matchDecisionModalVisible} animationType="fade" transparent={true} >
                <View style={styles.modalOverlay}>
                    <GlassCard style={styles.analysisModalContent}>
                        <Text style={styles.analysisTitle}>만남 지속 여부</Text>
                        <Text style={styles.analysisText}>
                            비밀 지령을 수행하셨습니다.{'\n'}
                            이 분과의 만남을 계속 이어가시겠습니까?
                        </Text>
                        <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 20, width: '100%' }}>
                            <HolyButton
                                title="그만하기"
                                onPress={async () => {
                                    setMatchDecisionModalVisible(false);
                                    setMatchDecision('stop');
                                    await AsyncStorage.setItem('matchDecision', 'stop');
                                    setMatchResult('fail');
                                    await AsyncStorage.setItem('matchResult', 'fail');
                                }}
                                variant="ghost"
                                style={{ flex: 1, marginRight: 10 }}
                            />
                            <HolyButton
                                title="계속 만나기"
                                onPress={async () => {
                                    setMatchDecisionModalVisible(false);
                                    setMatchDecision('continue');
                                    await AsyncStorage.setItem('matchDecision', 'continue');
                                    setIsWaitingForPartner(true);

                                    // Simulate waiting for partner (3 seconds)
                                    setTimeout(async () => {
                                        setIsWaitingForPartner(false);
                                        setMatchResult('success');
                                        await AsyncStorage.setItem('matchResult', 'success');
                                        Alert.alert('축하합니다!', '상대방도 만남을 원했습니다.\n커플 미션이 시작됩니다.');
                                    }, 3000);
                                }}
                                style={{ flex: 1 }}
                            />
                        </View>
                    </GlassCard>
                </View>
            </Modal >

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
                                    <Image source={{ uri: entry.imageUri }} style={styles.historyImage} />
                                )}
                            </GlassCard>
                        ))}
                    </ScrollView>
                </SafeAreaView>
            </Modal>
        </LinearGradient >
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: COLORS.background,
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
    header: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingTop: Platform.OS === 'android' ? 70 : 30,
        paddingBottom: 20,
    },
    headerTitle: {
        color: COLORS.gold,
        fontSize: 18,
        fontWeight: 'bold',
        letterSpacing: 2,
        fontFamily: FONTS.title,
        textShadowColor: COLORS.gold,
        textShadowOffset: { width: 0, height: 0 },
        textShadowRadius: 10,
        zIndex: 1, // Ensure text is above animation
    },
    settingsIcon: {
        fontSize: 24,
    },
    scrollContent: {
        flexGrow: 1,
        paddingBottom: 120,
    },
    mainContent: {
        paddingHorizontal: 20,
        alignItems: 'center',
        width: '100%',
    },
    greetingText: {
        color: '#fff',
        fontSize: 30,
        fontWeight: 'bold',
        marginBottom: 30,
        textAlign: 'center',
        fontFamily: FONTS.title,
        textShadowColor: COLORS.gold,
        textShadowOffset: { width: 0, height: 0 },
        textShadowRadius: 10,
    },
    profileImageContainer: {
        alignItems: 'center',
        marginBottom: 30,
        marginTop: -10,
    },
    profileImage: {
        width: 120,
        height: 120,
        borderRadius: 60,
        borderWidth: 2,
        borderColor: COLORS.gold,
    },
    missionContainer: {
        width: '100%',
        marginBottom: 20,
    },
    missionCard: {
        padding: 25,
        alignItems: 'center',
    },
    neonButton: {
        backgroundColor: 'rgba(255, 255, 255, 0.05)',
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.3)',
        shadowColor: 'transparent',
        elevation: 0,
        borderRadius: 30,
        paddingVertical: 15,
    },
    neonButtonText: {
        color: COLORS.gold,
        fontSize: 18,
        fontWeight: 'bold',
        textShadowColor: COLORS.gold,
        textShadowOffset: { width: 0, height: 0 },
        textShadowRadius: 5,
    },
    dayText: {
        color: COLORS.gold,
        fontSize: 16,
        fontWeight: 'bold',
        marginTop: 20,
        alignItems: 'center',
    },
    missionTitle: {
        color: COLORS.gold,
        fontSize: 22,
        fontWeight: 'bold',
        marginBottom: 15,
        fontFamily: FONTS.title,
        textShadowColor: COLORS.gold,
        textShadowOffset: { width: 0, height: 0 },
        textShadowRadius: 8,
    },
    missionText: {
        color: '#fff',
        fontSize: 18,
        textAlign: 'center',
        lineHeight: 28,
        fontFamily: FONTS.body,
        maxWidth: '85%',
        alignSelf: 'center',
    },
    analysisCard: {
        padding: 20,
        marginBottom: 20,
        backgroundColor: 'rgba(255, 255, 255, 0.05)',
        borderColor: 'rgba(255, 255, 255, 0.3)',
    },
    analysisTitle: {
        color: COLORS.gold,
        fontSize: 20,
        fontWeight: 'bold',
        marginBottom: 10,
        fontFamily: FONTS.title,
        textShadowColor: COLORS.gold,
        textShadowOffset: { width: 0, height: 0 },
        textShadowRadius: 6,
    },
    analysisText: {
        color: '#ddd',
        fontSize: 15,
        lineHeight: 24,
        fontFamily: FONTS.body,
    },
    specialMissionTitle: {
        color: COLORS.gold,
        fontSize: 24,
        fontWeight: 'bold',
        marginBottom: 15,
        textAlign: 'center',
        fontFamily: FONTS.title,
    },
    specialMissionText: {
        color: '#fff',
        fontSize: 16,
        textAlign: 'center',
        lineHeight: 24,
        marginBottom: 20,
        fontFamily: FONTS.body,
    },
    historyLink: {
        color: '#aaa',
        fontSize: 14,
        textDecorationLine: 'underline',
        fontFamily: FONTS.body,
    },
    judgingOverlay: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0,0,0,0.9)',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 100,
    },
    judgingText: {
        color: COLORS.gold,
        fontSize: 26,
        fontWeight: 'bold',
        textAlign: 'center',
        lineHeight: 36,
        fontFamily: FONTS.title,
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.8)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    modalContent: {
        width: '100%',
        padding: 25,
    },
    modalTitle: {
        color: COLORS.gold,
        fontSize: 24,
        fontWeight: 'bold',
        marginBottom: 10,
        textAlign: 'center',
        fontFamily: FONTS.title,
    },
    modalSubtitle: {
        color: '#ccc',
        fontSize: 14,
        marginBottom: 20,
        textAlign: 'center',
        fontFamily: FONTS.body,
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
        fontFamily: FONTS.body,
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
        fontFamily: FONTS.body,
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
    analysisModalContent: {
        width: '100%',
        padding: 25,
        maxHeight: '80%',
    },
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
        fontSize: 22,
        fontWeight: 'bold',
        fontFamily: FONTS.title,
    },
    closeButton: {
        color: '#fff',
        fontSize: 16,
        fontFamily: FONTS.body,
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
        fontFamily: FONTS.title,
    },
    historyDate: {
        color: '#666',
        fontSize: 12,
        marginBottom: 10,
        fontFamily: FONTS.body,
    },
    historyContent: {
        color: '#fff',
        fontSize: 15,
        lineHeight: 22,
        fontFamily: FONTS.body,
    },
    historyImage: {
        width: '100%',
        height: 200,
        borderRadius: 10,
        marginTop: 15,
    },
    introContent: {
        padding: 30,
        alignItems: 'center',
    },
    introTitle: {
        color: COLORS.gold,
        fontSize: 26,
        fontWeight: 'bold',
        marginBottom: 20,
        textAlign: 'center',
        fontFamily: FONTS.title,
    },
    introText: {
        color: '#fff',
        fontSize: 16,
        lineHeight: 28,
        textAlign: 'center',
        marginBottom: 30,
        fontFamily: FONTS.body,
        maxWidth: '85%',
        alignSelf: 'center',
    },
    debugButtonContainer: {
        position: 'absolute',
        top: Platform.OS === 'android' ? 10 : 0,
        left: 10,
        flexDirection: 'column',
        gap: 5,
        zIndex: 999,
    },
    debugButton: {
        backgroundColor: 'rgba(255, 0, 0, 0.5)',
        padding: 5,
        borderRadius: 5,
    },
    debugButtonText: {
        color: '#fff',
        fontSize: 10,
        fontFamily: FONTS.body,
    },
    brighteningOverlay: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: '#fff',
        zIndex: 2000,
    },
    personaText: {
        color: '#FFF',
        fontSize: 24,
        fontFamily: FONTS.title,
        textAlign: 'center',
        lineHeight: 36,
        letterSpacing: 0.5,
        marginBottom: 40,
        textShadowColor: 'rgba(255, 255, 255, 0.5)',
        textShadowOffset: { width: 0, height: 0 },
        textShadowRadius: 15,
    },
});

export default HomeScreen;
