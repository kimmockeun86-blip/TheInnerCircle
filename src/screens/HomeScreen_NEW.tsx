import React, { useState, useEffect, useRef, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal, TextInput, ScrollView, SafeAreaView, Alert, Animated, useWindowDimensions, Image, ActivityIndicator, Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import MysticVisualizer from '../components/MysticVisualizer';
import { HomeScreenNavigationProp, HomeScreenRouteProp } from '../types/navigation';
import { api } from '../services/api';
import * as ImagePicker from 'expo-image-picker';
import { useNavigation, useRoute, useFocusEffect } from '@react-navigation/native';
import GlassCard from '../components/GlassCard';
import HolyButton from '../components/HolyButton';
import { COLORS, LAYOUT, FONTS } from '../theme/theme';

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

                    const canUnlock = await checkDayProgression();
                    if (!canUnlock) {
                        // Locked state logic if needed
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
                setCurrentAnalysis({ result: response.result, feedback: response.feedback });

                const newEntry: JournalEntry = {
                    day: dayCount,
                    content: journalInput,
                    date: new Date().toLocaleDateString(),
                    imageUri: selectedImage || undefined
                };

                const updatedHistory = [newEntry, ...journalHistory];
                setJournalHistory(updatedHistory);
                await AsyncStorage.setItem('journalHistory', JSON.stringify(updatedHistory));

                if (dayCount === 10) {
                    if (missionStatus === 'secret_mission_active') {
                        // Secret Mission Done -> Ask for Decision
                        Alert.alert(
                            '만남 지속 여부',
                            '비밀 지령을 수행하셨습니다.\n이 분과의 만남을 계속 이어가시겠습니까?',
                            [
                                {
                                    text: '그만하기',
                                    style: 'destructive',
                                    onPress: async () => {
                                        setMatchDecision('stop');
                                        await AsyncStorage.setItem('matchDecision', 'stop');
                                        setMatchResult('fail'); // Immediate fail for now
                                        await AsyncStorage.setItem('matchResult', 'fail');
                                    }
                                },
                                {
                                    text: '계속 만나기',
                                    onPress: async () => {
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
                                    }
                                }
                            ]
                        );
                    } else {
                        // Day 10 Standard Mission Done
                        setDay10Done(true);
                        await AsyncStorage.setItem('day10Done', 'true');
                        Alert.alert('수행 완료', '이제 운명의 상대를 만날 준비가 되었습니다.');
                    }
                } else {
                    // Normal Progression
                    const newDay = dayCount + 1;
                    setDayCount(newDay);
                    setMissionStatus(null);
                    await AsyncStorage.setItem('dayCount', newDay.toString());
                    await AsyncStorage.removeItem('missionStatus');
                    await AsyncStorage.setItem('lastCompletedDate', new Date().toISOString());

                    if (response.recommendedMission) {
                        await AsyncStorage.setItem(`mission_day_${newDay}`, response.recommendedMission);
                    }
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
                    <Text style={styles.headerTitle}>ORBIT</Text>
                    <TouchableOpacity onPress={() => navigation.navigate('Settings')}>
                        <Text style={styles.settingsIcon}>⚙️</Text>
                    </TouchableOpacity>
                </View>

                <ScrollView contentContainerStyle={styles.scrollContent}>
                    <View style={styles.mainContent}>
                        <Text style={styles.dayText}>Day {dayCount}</Text>
                        <Text style={styles.greetingText}>
                            {dayCount === 10 ? "여정의 완성" : "오늘의 수행"}
                        </Text>

                        <View style={styles.missionContainer}>
                            <GlassCard style={styles.missionCard}>
                                <Text style={styles.missionTitle}>오늘의 미션</Text>
                                <Text style={styles.missionText}>{currentMissionText}</Text>
                            </GlassCard>
                        </View>

                        {/* Post-Match Flow UI */}
                        {missionStatus === 'secret_mission_active' ? (
                            matchResult === 'success' ? (
                                <>
                                    <Text style={styles.specialMissionTitle}>💖 커플 매칭 성공</Text>
                                    <Text style={styles.specialMissionText}>
                                        축하합니다. 두 분의 마음이 통했습니다.
                                        이제 '커플 미션'을 통해 서로를 더 깊이 알아가세요.
                                    </Text>
                                    <HolyButton
                                        title="💑 커플 미션 시작하기"
                                        onPress={() => navigation.navigate('CouplesMission', {} as any)}
                                        style={{ marginTop: 20 }}
                                    />
                                </>
                            ) : matchResult === 'fail' ? (
                                <>
                                    <Text style={styles.specialMissionTitle}>💔 매칭 종료</Text>
                                    <Text style={styles.specialMissionText}>
                                        아쉽게도 인연이 닿지 않았습니다.
                                        하지만 당신의 여정은 계속됩니다.
                                    </Text>
                                    <HolyButton
                                        title="🔄 다시 시작하기"
                                        onPress={async () => {
                                            setMissionStatus(null);
                                            setMatchDecision(null);
                                            setMatchResult(null);
                                            await AsyncStorage.removeItem('missionStatus');
                                            await AsyncStorage.removeItem('matchDecision');
                                            await AsyncStorage.removeItem('matchResult');
                                            Alert.alert('알림', '매칭 상태가 초기화되었습니다.');
                                        }}
                                        variant="outline"
                                        style={{ marginTop: 20 }}
                                    />
                                </>
                            ) : isWaitingForPartner ? (
                                <>
                                    <Text style={styles.specialMissionTitle}>⏳ 응답 대기 중</Text>
                                    <Text style={styles.specialMissionText}>
                                        상대방의 결정을 기다리고 있습니다.
                                        잠시만 기다려주세요...
                                    </Text>
                                    <ActivityIndicator size="large" color={COLORS.gold} style={{ marginTop: 20 }} />
                                </>
                            ) : matchDecision === 'continue' ? (
                                <ActivityIndicator size="large" color={COLORS.gold} />
                            ) : (
                                <>
                                    <Text style={styles.specialMissionTitle}>🤫 비밀 지령 수행</Text>
                                    <Text style={styles.specialMissionText}>
                                        상대방과의 약속된 시간이 되었습니다.
                                        이제 지령을 수행하고 결과를 확인하세요.
                                    </Text>
                                    <HolyButton
                                        title={isAnalyzing ? "AI 정밀 분석 중..." : "🔥 비밀 지령 수행하기"}
                                        onPress={() => setJournalModalVisible(true)}
                                        disabled={isAnalyzing}
                                        style={{ marginTop: 20 }}
                                    />
                                </>
                            )
                        ) : (
                            // Standard Progression UI
                            <HolyButton
                                title={dayCount === 10 ? (day10Done ? "지난 10일 돌아보기" : "내면의 문 열기") : "수행 기록 남기기"}
                                onPress={() => {
                                    if (dayCount === 10 && !day10Done) {
                                        navigation.navigate('Match');
                                    } else if (dayCount === 10 && day10Done) {
                                        setHistoryModalVisible(true);
                                    } else {
                                        setJournalModalVisible(true);
                                    }
                                }}
                                style={{ marginTop: 30 }}
                            />
                        )}

                        <TouchableOpacity onPress={() => setHistoryModalVisible(true)} style={{ marginTop: 20 }}>
                            <Text style={styles.historyLink}>📜 지난 여정 보기</Text>
                        </TouchableOpacity>

                        {/* Dev Tool */}
                        <TouchableOpacity
                            onPress={() => {
                                setDayCount(10);
                                AsyncStorage.setItem('dayCount', '10');
                            }}
                            style={{ marginTop: 40, opacity: 0.3 }}
                        >
                            <Text style={{ color: 'red' }}>[개발용] Day 10으로 이동</Text>
                        </TouchableOpacity>
                    </View>
                </ScrollView>

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
                                    {selectedImage ? "📷 사진 변경하기" : "📷 사진 추가하기 (선택)"}
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
                                    title={isAnalyzing ? "분석 중..." : "기록 완료"}
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
                            <Text style={styles.analysisTitle}>파라의 메시지</Text>
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
                                        <Image source={{ uri: entry.imageUri }} style={styles.historyImage} />
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
    container: { flex: 1, backgroundColor: COLORS.background },
    visualizerBackground: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: 0,
    },
    safeArea: { flex: 1, zIndex: 10 },
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingTop: 10, paddingBottom: 10 },
    headerTitle: { color: COLORS.gold, fontSize: 18, fontWeight: 'bold', letterSpacing: 2 },
    settingsIcon: { fontSize: 24 },
    scrollContent: { flexGrow: 1, paddingBottom: 40 },
    mainContent: { paddingHorizontal: 20, alignItems: 'center', paddingTop: 20 },
    dayText: { color: COLORS.gold, fontSize: 48, fontWeight: 'bold', marginBottom: 10, textShadowColor: 'rgba(255, 215, 0, 0.5)', textShadowOffset: { width: 0, height: 0 }, textShadowRadius: 20 },
    greetingText: { color: '#fff', fontSize: 18, marginBottom: 40, opacity: 0.8 },
    missionContainer: { width: '100%', marginBottom: 30 },
    missionCard: { padding: 30, alignItems: 'center' },
    missionTitle: { color: COLORS.gold, fontSize: 20, fontWeight: 'bold', marginBottom: 20 },
    missionText: { color: '#fff', fontSize: 18, textAlign: 'center', lineHeight: 28 },
    historyLink: { color: '#888', fontSize: 14, textDecorationLine: 'underline' },

    specialMissionTitle: { color: COLORS.gold, fontSize: 22, fontWeight: 'bold', marginBottom: 15, textAlign: 'center' },
    specialMissionText: { color: '#fff', fontSize: 16, textAlign: 'center', lineHeight: 24, marginBottom: 20 },

    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.8)', justifyContent: 'center', alignItems: 'center', padding: 20 },
    modalContent: { width: '100%', padding: 25 },
    modalTitle: { color: COLORS.gold, fontSize: 22, fontWeight: 'bold', marginBottom: 10, textAlign: 'center' },
    modalSubtitle: { color: '#ccc', fontSize: 14, marginBottom: 20, textAlign: 'center' },
    journalInput: { backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 10, padding: 15, color: '#fff', height: 150, textAlignVertical: 'top', marginBottom: 20, fontSize: 16 },
    imagePickerButton: { marginBottom: 20, alignItems: 'center' },
    imagePickerText: { color: COLORS.gold, fontSize: 14 },
    previewImage: { width: '100%', height: 200, borderRadius: 10, marginBottom: 20 },
    modalButtons: { flexDirection: 'row', justifyContent: 'space-between' },

    analysisModalContent: { width: '90%', padding: 30, alignItems: 'center' },
    analysisTitle: { color: COLORS.gold, fontSize: 24, fontWeight: 'bold', marginBottom: 20 },
    analysisText: { color: '#fff', fontSize: 16, lineHeight: 26, textAlign: 'center' },

    historyContainer: { flex: 1, backgroundColor: COLORS.background },
    historyHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, borderBottomWidth: 1, borderBottomColor: '#333' },
    historyTitle: { color: COLORS.gold, fontSize: 20, fontWeight: 'bold' },
    closeButton: { color: '#fff', fontSize: 16 },
    historyList: { padding: 20 },
    historyCard: { marginBottom: 20, padding: 20 },
    historyDay: { color: COLORS.gold, fontSize: 18, fontWeight: 'bold', marginBottom: 5 },
    historyDate: { color: '#666', fontSize: 12, marginBottom: 10 },
    historyContent: { color: '#fff', fontSize: 15, lineHeight: 22 },
    historyImage: { width: '100%', height: 200, borderRadius: 10, marginTop: 15 },

    introContent: { padding: 30, alignItems: 'center' },
    introTitle: { color: COLORS.gold, fontSize: 24, fontWeight: 'bold', marginBottom: 20 },
    introText: { color: '#fff', fontSize: 16, lineHeight: 26, textAlign: 'center', marginBottom: 20 },
});

export default HomeScreen;
