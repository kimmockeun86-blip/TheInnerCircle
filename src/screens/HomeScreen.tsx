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
import LocationService from '../services/LocationService';
import MatchingService from '../services/MatchingService';
import { soundService } from '../services/SoundService';
import HeaderSpline from '../components/HeaderSpline';
import { WebView } from 'react-native-webview';
import JournalModal from '../components/JournalModal';
import AnalysisModal from '../components/AnalysisModal';
import IntroModal from '../components/IntroModal';
import { getSpecialDayMission } from '../services/MissionData';

// Placeholder images
const malePlaceholder = require('../../assets/male_placeholder.png');
const femalePlaceholder = require('../../assets/female_placeholder.png');

// Cosmic background
const cosmicBackground = require('../../assets/cosmic_background.png');


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
    const [letterSent, setLetterSent] = useState(false);

    // 받은 편지 시스템
    const [receivedLetter, setReceivedLetter] = useState<{ from: string; content: string; date: string } | null>(null);
    const [receivedLetterModalVisible, setReceivedLetterModalVisible] = useState(false);

    // 만남 확정 시스템
    const [meetingConfirmed, setMeetingConfirmed] = useState(false);
    const [meetingDate, setMeetingDate] = useState<string | null>(null);
    const [meetingDateModalVisible, setMeetingDateModalVisible] = useState(false);

    // 만남 후 유지 선택 시스템
    const [specialMissionCompleted, setSpecialMissionCompleted] = useState(false);
    const [meetingDecisionModalVisible, setMeetingDecisionModalVisible] = useState(false);
    const [myMeetingDecision, setMyMeetingDecision] = useState<'continue' | 'stop' | null>(null);
    const [partnerMeetingDecision, setPartnerMeetingDecision] = useState<'continue' | 'stop' | 'waiting' | null>(null);
    const [meetingResultModalVisible, setMeetingResultModalVisible] = useState(false);
    const [isMeetingDay, setIsMeetingDay] = useState(false);

    // 🌟 아침/점심/저녁 맞춤 조언 상태
    const [personalizedAdvice, setPersonalizedAdvice] = useState<{
        advice: string;
        focusPrompt: string;
        timeOfDay: 'morning' | 'noon' | 'evening';
        icon: string;
    } | null>(null);


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

    // Background Matching - Silently check for compatible matches via Firebase
    const checkBackgroundMatching = async () => {
        try {
            const storedUserId = await AsyncStorage.getItem('userId');
            const storedGender = await AsyncStorage.getItem('userGender') || '남성';
            const storedDeficit = await AsyncStorage.getItem('userDeficit') || '';
            const storedAge = await AsyncStorage.getItem('userAge');
            const location = await LocationService.getSavedLocation();

            // Create user profile for matching
            const userProfile = {
                uid: storedUserId || `user_${name}`,
                name: name,
                age: parseInt(storedAge || '25'),
                gender: storedGender,
                deficit: storedDeficit,
                location: location,
                dayCount: dayCount,
                isMatchingActive: true
            };

            // Try Firebase MatchingService first
            const candidates = await MatchingService.findMatchCandidates(userProfile);

            if (candidates.length > 0) {
                // Found match candidates from Firebase!
                const topCandidate = candidates[0];
                setMatchCandidate({
                    id: topCandidate.uid,
                    name: topCandidate.name,
                    age: topCandidate.age,
                    photo: topCandidate.photo,
                    bio: topCandidate.bio || '',
                    deficit: topCandidate.deficit,
                    distance: topCandidate.distanceText
                });
                console.log('[ORBIT] 🎯 Firebase에서 매칭 후보 발견:', topCandidate.name, topCandidate.distanceText);
            } else {
                // Fallback to old API (Mock data)
                const result = await api.getMatchingCandidates({
                    userId: `user_${name}`,
                    userLocation: location ? 'Seoul' : 'Seoul',
                    userGender: storedGender,
                    userMbti: '',
                    userDeficit: storedDeficit
                });

                if (result.success && result.candidates.length > 0) {
                    setMatchCandidate(result.candidates[0]);
                    console.log('[ORBIT] 🎯 Mock 데이터에서 매칭 후보 발견:', result.candidates[0].name);
                } else {
                    // 모든 방법 실패 시 테스트용 mock 데이터 생성
                    const mockGender = storedGender === '남성' ? '여성' : '남성';
                    const mockCandidate = {
                        id: 'mock_user_' + Date.now(),
                        name: mockGender === '여성' ? '하늘' : '민준',
                        age: 28,
                        photo: mockGender === '여성'
                            ? 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=300'
                            : 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=300',
                        bio: '진정한 사랑을 찾아 여정 중입니다.',
                        deficit: storedDeficit || '성장',
                        mbti: 'INFP',
                        distance: '5km 이내'
                    };
                    setMatchCandidate(mockCandidate);
                    console.log('[ORBIT] 🎯 테스트용 Mock 데이터 생성:', mockCandidate.name);
                }
            }
        } catch (error) {
            console.error('Background matching error:', error);
        }
    };

    // Send letter to match candidate via Firebase
    const handleSendLetter = async () => {
        if (letterContent.trim().length < 10) {
            Alert.alert('알림', '편지를 10자 이상 작성해주세요.');
            return;
        }

        const storedUserId = await AsyncStorage.getItem('userId');

        // Try Firebase first
        const firebaseResult = await MatchingService.sendLetter({
            fromUid: storedUserId || `user_${name}`,
            fromName: name,
            toUid: matchCandidate.id,
            content: letterContent,
            status: 'sent'
        });

        if (firebaseResult.success) {
            Alert.alert('성공', firebaseResult.message);
            setMatchCandidateModalVisible(false);
            setLetterContent('');
            setLetterSent(true);
            await AsyncStorage.setItem('letterSent', 'true');

            // 상대방 편지 수신 시뮬레이션 (5초 후)
            setTimeout(async () => {
                const simulatedLetter = {
                    from: matchCandidate?.name || '비밀의 상대',
                    content: '안녕하세요! 편지 잘 받았어요. 저도 정말 설레네요. 커피 한잔 하면서 이야기 나눠요. 연락 기다릴게요!',
                    date: new Date().toLocaleDateString('ko-KR')
                };
                setReceivedLetter(simulatedLetter);
                await AsyncStorage.setItem('receivedLetter', JSON.stringify(simulatedLetter));
                Alert.alert('편지 도착', '상대방에게서 답장이 도착했습니다.');
            }, 5000);

            // Check for replies after 3 seconds (simulation for now)
            setTimeout(async () => {
                // In real app, this would be a push notification or real-time listener
                const letters = await MatchingService.getReceivedLetters(storedUserId || `user_${name}`);
                if (letters.length > 0) {
                    const reply = letters[0];

                    // Save match to Firestore
                    const matchResult = await MatchingService.acceptMatch(
                        storedUserId || `user_${name}`,
                        matchCandidate.id
                    );

                    if (matchResult.success) {
                        console.log('[ORBIT] 매칭 저장 완료:', matchResult.matchId);
                    }

                    setMatchResult('success');
                    await AsyncStorage.setItem('matchResult', 'success');
                    await AsyncStorage.setItem('matchedPartner', JSON.stringify(matchCandidate));
                    await AsyncStorage.setItem('isCoupled', 'coupled');
                    Alert.alert('🎉 축하합니다!', `${matchCandidate.name}님도 만남을 원했습니다!\n커플 미션이 시작됩니다.`, [
                        { text: '시작하기', onPress: () => navigation.replace('CouplesMission', {} as any) }
                    ]);
                }
            }, 3000);
        } else {
            // Fallback to old API
            const result = await api.sendLetter({
                fromUserId: storedUserId || `user_${name}`,
                fromUserName: name,
                toUserId: matchCandidate.id,
                content: letterContent
            });

            if (result.success) {
                Alert.alert('성공', '편지가 전송되었습니다.');
                setMatchCandidateModalVisible(false);
                setLetterContent('');
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
        }
    };

    // 특별 미션 완료 후 만남 결정 요청
    const handleSpecialMissionComplete = async () => {
        setSpecialMissionCompleted(true);
        await AsyncStorage.setItem('specialMissionCompleted', 'true');
        setMeetingDecisionModalVisible(true);
    };

    // 만남 유지 결정 처리
    const handleMeetingDecision = async (decision: 'continue' | 'stop') => {
        setMyMeetingDecision(decision);
        await AsyncStorage.setItem('myMeetingDecision', decision);
        setMeetingDecisionModalVisible(false);

        // 상대방 응답 대기 상태로 설정
        setPartnerMeetingDecision('waiting');
        await AsyncStorage.setItem('partnerMeetingDecision', 'waiting');

        // Firebase에 내 결정 저장
        try {
            const storedUserId = await AsyncStorage.getItem('userId');
            const myUid = storedUserId || `user_${name}`;
            const partnerUid = matchCandidate?.id || 'partner';
            const matchId = MatchingService.generateMatchId(myUid, partnerUid);

            // 내 결정 저장
            await MatchingService.saveMeetingDecision(matchId, myUid, decision);
            await AsyncStorage.setItem('currentMatchId', matchId);
            await AsyncStorage.setItem('partnerUid', partnerUid);

            // 상대방 결정 폴링 시작 (5초 간격, 최대 60초)
            let attempts = 0;
            const maxAttempts = 12;

            const checkPartnerDecision = async () => {
                attempts++;
                const partnerDecision = await MatchingService.getPartnerMeetingDecision(matchId, partnerUid);

                if (partnerDecision) {
                    // 상대방이 결정함
                    setPartnerMeetingDecision(partnerDecision);
                    await AsyncStorage.setItem('partnerMeetingDecision', partnerDecision);
                    setMeetingResultModalVisible(true);
                } else if (attempts < maxAttempts) {
                    // 아직 결정 안함, 계속 폴링
                    setTimeout(checkPartnerDecision, 5000);
                } else {
                    // 60초 경과 - 아직도 응답 없음
                    Alert.alert(
                        '상대방 응답 대기 중',
                        '상대방이 아직 결정하지 않았어요. 나중에 다시 확인해볼게요.',
                        [{ text: '확인' }]
                    );
                }
            };

            // 첫 번째 확인은 3초 후
            setTimeout(checkPartnerDecision, 3000);

        } catch (e) {
            console.log('Decision save failed:', e);
            Alert.alert('오류', '결정 저장에 실패했습니다. 다시 시도해주세요.');
        }
    };

    // 매칭 결과 처리 (양쪽 모두 continue면 커플 성사)
    const handleMeetingResult = async () => {
        setMeetingResultModalVisible(false);

        if (myMeetingDecision === 'continue' && partnerMeetingDecision === 'continue') {
            // 🎉 커플 성사!
            await AsyncStorage.setItem('isCoupled', 'coupled');
            await AsyncStorage.setItem('matchResult', 'success');
            if (matchCandidate) {
                await AsyncStorage.setItem('matchedPartner', JSON.stringify(matchCandidate));
            }

            // Firebase에 매칭 저장
            const storedUserId = await AsyncStorage.getItem('userId');
            await MatchingService.acceptMatch(
                storedUserId || `user_${name}`,
                matchCandidate?.id || 'partner'
            );

            navigation.replace('CouplesMission', {} as any);
        } else {
            // 거절됨 - 솔로 미션으로 계속
            await AsyncStorage.removeItem('matchCandidate');
            await AsyncStorage.removeItem('matchedPartner');
            await AsyncStorage.removeItem('meetingConfirmed');
            await AsyncStorage.removeItem('meetingDate');
            await AsyncStorage.removeItem('specialMissionCompleted');
            await AsyncStorage.removeItem('myMeetingDecision');
            await AsyncStorage.removeItem('partnerMeetingDecision');
            setMatchCandidate(null);
            setMeetingConfirmed(false);
            setMeetingDate(null);
            setSpecialMissionCompleted(false);
            setMyMeetingDecision(null);
            setPartnerMeetingDecision(null);
            setIsMeetingDay(false);
        }
    };

    const checkDayProgression = async () => {
        const lastCompletedDate = await AsyncStorage.getItem('lastCompletedDate');
        if (!lastCompletedDate) return true;

        const now = new Date();
        const lastDate = new Date(lastCompletedDate);

        // 자정 기준: 날짜가 다르면 새로운 날
        const isSameDay = now.getDate() === lastDate.getDate() &&
            now.getMonth() === lastDate.getMonth() &&
            now.getFullYear() === lastDate.getFullYear();

        if (isSameDay) {
            // 같은 날 - 다음 날 자정에 해금
            const tomorrow = new Date(now);
            tomorrow.setDate(tomorrow.getDate() + 1);
            tomorrow.setHours(0, 0, 0, 0);
            setNextMissionUnlockTime(tomorrow.toLocaleString());
            return false; // Still same day, wait for tomorrow midnight
        }

        // 날짜가 다르면 바로 해금 (자정이 지났으므로)
        setNextMissionUnlockTime(null);
        return true;
    };

    useFocusEffect(
        useCallback(() => {
            const loadData = async () => {
                try {
                    const storedDay = await AsyncStorage.getItem('dayCount');
                    let currentDayCount = storedDay ? parseInt(storedDay, 10) : 1;

                    // Check if we can unlock (new day after midnight)
                    const canUnlock = await checkDayProgression();

                    if (canUnlock) {
                        // 중복 증가 방지: 오늘 이미 dayCount를 증가시켰는지 체크
                        const lastDayIncrementDate = await AsyncStorage.getItem('lastDayIncrementDate');
                        const today = new Date().toDateString();

                        if (lastDayIncrementDate !== today) {
                            // It's a new day! Increase day count
                            const lastCompletedDate = await AsyncStorage.getItem('lastCompletedDate');
                            if (lastCompletedDate) {
                                // User completed mission before, now it's new day
                                currentDayCount = currentDayCount + 1;
                                await AsyncStorage.setItem('dayCount', currentDayCount.toString());
                                await AsyncStorage.setItem('lastDayIncrementDate', today); // 오늘 증가했음을 기록
                                console.log(`[ORBIT] 🌅 새로운 날! Day ${currentDayCount} 시작`);

                                // Load next mission that was saved yesterday
                                const savedNextMission = await AsyncStorage.getItem('nextMission');
                                if (savedNextMission) {
                                    await AsyncStorage.setItem(`mission_day_${currentDayCount}`, savedNextMission);
                                    await AsyncStorage.removeItem('nextMission');
                                }
                            }
                        }
                    } else {
                        // Still locked - notification already scheduled during onboarding
                        // No need to call scheduleMissionNotification() again
                    }

                    setDayCount(currentDayCount);

                    // Load Growth Level from separate storage (not calculated from dayCount)
                    const storedGrowthLevel = await AsyncStorage.getItem('growthLevel');
                    const level = storedGrowthLevel ? parseInt(storedGrowthLevel, 10) : 1;
                    setGrowthLevel(level);
                    const phases = ['각성', '직면', '파괴', '재구축', '통합', '초월'];
                    setGrowthPhase(phases[level - 1] || '각성');

                    const storedStatus = await AsyncStorage.getItem('missionStatus');
                    setMissionStatus(storedStatus);

                    // ============================================
                    // 🎯 관리자가 부여한 미션 우선 체크
                    // ============================================
                    let adminMissionApplied = false;
                    try {
                        const adminApiUrl = Platform.OS === 'web' && (window as any).location?.hostname === 'localhost'
                            ? 'http://localhost:3001'
                            : 'https://orbit-adminfinalfight.onrender.com';
                        const storedUserId = await AsyncStorage.getItem('userId');
                        const storedName = await AsyncStorage.getItem('userName');
                        const userId = storedUserId || storedName || '';

                        if (userId) {
                            const res = await fetch(`${adminApiUrl}/api/users/${encodeURIComponent(userId)}`);
                            const data = await res.json();
                            if (data.success && data.user?.assignedMission) {
                                const adminMission = data.user.assignedMission;
                                console.log(`[ORBIT Solo] 🎯 관리자 미션 발견: ${adminMission}`);
                                setCurrentMissionText(adminMission);
                                await AsyncStorage.setItem(`mission_day_${currentDayCount}`, adminMission);
                                await AsyncStorage.setItem('hasAdminMission', 'true'); // 관리자 미션 플래그
                                adminMissionApplied = true;
                            }
                        }
                    } catch (adminErr) {
                        console.log('[ORBIT Solo] 관리자 서버 연결 실패 (정상 - 로컬 미션 사용)');
                    }

                    // 관리자 미션이 없으면 일반 로직 수행
                    if (!adminMissionApplied) {
                        // 특별한 날 미션 체크 우선
                        const specialDayMission = getSpecialDayMission();
                        if (specialDayMission) {
                            console.log(`[ORBIT] 🎉 특별한 날: ${specialDayMission.name}`);
                            setCurrentMissionText(`🎉 ${specialDayMission.name} 특별 미션: ${specialDayMission.mission}`);
                        } else {
                            const storedMission = await AsyncStorage.getItem(`mission_day_${currentDayCount}`);
                            if (storedMission) {
                                setCurrentMissionText(storedMission);
                            } else {
                                const defaultMission = currentDayCount <= 9 ? missions[currentDayCount - 1] : "당신의 영혼이 준비되었습니다.";
                                setCurrentMissionText(defaultMission);
                            }
                        }
                    }

                    const storedDay10Done = await AsyncStorage.getItem('day10Done');
                    if (storedDay10Done === 'true') {
                        setDay10Done(true);
                    }

                    const storedMatchDecision = await AsyncStorage.getItem('matchDecision');
                    if (storedMatchDecision) setMatchDecision(storedMatchDecision as any);

                    const storedMatchResult = await AsyncStorage.getItem('matchResult');
                    if (storedMatchResult) setMatchResult(storedMatchResult as any);

                    // 편지/만남 관련 데이터 복원
                    const storedLetterSent = await AsyncStorage.getItem('letterSent');
                    if (storedLetterSent === 'true') setLetterSent(true);

                    const storedReceivedLetter = await AsyncStorage.getItem('receivedLetter');
                    if (storedReceivedLetter) {
                        try {
                            setReceivedLetter(JSON.parse(storedReceivedLetter));
                        } catch (e) {
                            console.log('Received letter parse failed');
                        }
                    }

                    const storedMeetingConfirmed = await AsyncStorage.getItem('meetingConfirmed');
                    if (storedMeetingConfirmed === 'true') setMeetingConfirmed(true);

                    const storedMeetingDate = await AsyncStorage.getItem('meetingDate');
                    if (storedMeetingDate) {
                        setMeetingDate(storedMeetingDate);
                        // 오늘이 만남 날짜인지 확인
                        const today = new Date().toLocaleDateString('ko-KR', { month: 'long', day: 'numeric', weekday: 'short' });
                        if (storedMeetingDate === today) {
                            setIsMeetingDay(true);
                        }
                    }

                    // 특별 미션 완료 상태 로드
                    const storedSpecialMissionCompleted = await AsyncStorage.getItem('specialMissionCompleted');
                    if (storedSpecialMissionCompleted === 'true') setSpecialMissionCompleted(true);

                    // 만남 결정 상태 로드
                    const storedMyDecision = await AsyncStorage.getItem('myMeetingDecision');
                    if (storedMyDecision) setMyMeetingDecision(storedMyDecision as 'continue' | 'stop');

                    const storedPartnerDecision = await AsyncStorage.getItem('partnerMeetingDecision');
                    if (storedPartnerDecision) setPartnerMeetingDecision(storedPartnerDecision as 'continue' | 'stop' | 'waiting');

                    await loadJournalHistory();

                    // GPS 위치 수집 (매칭 시스템용)
                    try {
                        const location = await LocationService.getCurrentLocation();
                        if (location) {
                            console.log('[HomeScreen] GPS 위치 수집 완료:', location);
                        }
                    } catch (e) {
                        console.log('GPS 위치 수집 실패 (무시):', e);
                    }

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

                        // 편지 모달 자동 열림 체크 (SpecialMissionIntroScreen에서 돌아온 경우)
                        const openLetterModal = await AsyncStorage.getItem('openLetterModal');
                        if (openLetterModal === 'true') {
                            await AsyncStorage.removeItem('openLetterModal');
                            setTimeout(() => {
                                setMatchCandidateModalVisible(true);
                            }, 500);
                        }
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
                // 로컬 커플 상태 확인
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

                // 🌟 12시/18시 맞춤 조언 알림 스케줄링
                try {
                    const storedDeficit = await AsyncStorage.getItem('userDeficit') || '성장';
                    await notificationService.scheduleAdviceNotifications(storedDeficit);
                    console.log('[ORBIT] 조언 알림 스케줄링 완료');
                } catch (e) {
                    console.log('조언 알림 스케줄링 실패 (무시):', e);
                }

                // 🌟 아침(7시~)/점심(12시~)/저녁(18시~) 맞춤 조언 API 호출하여 화면에 표시
                try {
                    const currentHour = new Date().getHours();
                    // 7시~24시 사이에 조언 표시 (아침 7시부터 시작)
                    if (currentHour >= 7) {
                        // 시간대 결정: 7시~12시 아침, 12시~18시 점심, 18시~ 저녁
                        let timeOfDay: 'morning' | 'noon' | 'evening';
                        if (currentHour < 12) {
                            timeOfDay = 'morning';
                        } else if (currentHour < 18) {
                            timeOfDay = 'noon';
                        } else {
                            timeOfDay = 'evening';
                        }

                        const storedDeficit = await AsyncStorage.getItem('userDeficit') || '성장';
                        const storedName = await AsyncStorage.getItem('userName') || '구도자';
                        const storedUserId = await AsyncStorage.getItem('userId');
                        const storedLevel = await AsyncStorage.getItem('growthLevel');

                        // 최근 수행기록 가져오기
                        const journalHistoryStr = await AsyncStorage.getItem('journalHistory');
                        let recentJournals: Array<{ day: number; content: string; mission?: string }> = [];
                        if (journalHistoryStr) {
                            try {
                                const parsed = JSON.parse(journalHistoryStr);
                                recentJournals = parsed.slice(0, 3).map((j: any) => ({
                                    day: j.day,
                                    content: j.content,
                                    mission: j.mission
                                }));
                            } catch (e) { }
                        }

                        const adviceResponse = await api.getPersonalizedAdvice({
                            userId: storedUserId || undefined,
                            name: storedName,
                            deficit: storedDeficit,
                            currentMission: currentMissionText || '',
                            recentJournals,
                            timeOfDay,
                            dayCount: currentDayCount,
                            growthLevel: storedLevel ? parseInt(storedLevel, 10) : 1
                        });

                        if (adviceResponse.success) {
                            setPersonalizedAdvice({
                                advice: adviceResponse.advice,
                                focusPrompt: adviceResponse.focusPrompt || '',
                                timeOfDay: adviceResponse.timeOfDay as 'morning' | 'noon' | 'evening',
                                icon: adviceResponse.icon
                            });
                            console.log('[ORBIT] 맞춤 조언 로드 완료:', adviceResponse.advice.substring(0, 50) + '...');
                        }
                    }
                } catch (e) {
                    console.log('맞춤 조언 로드 실패 (무시):', e);
                }
            } catch (e) {
                console.error('데이터 로드 실패:', e);
            }
        };
        initializeData();
    }, []);

    // Countdown timer effect (자정 기준)
    useEffect(() => {
        if (!nextMissionUnlockTime) {
            setCountdown('');
            return;
        }

        const calculateCountdown = () => {
            const now = new Date();
            const target = new Date(now);

            // 다음 날 자정 설정
            target.setDate(target.getDate() + 1);
            target.setHours(0, 0, 0, 0);

            const diff = target.getTime() - now.getTime();
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
            // User ID for Firebase storage
            const storedUserId = await AsyncStorage.getItem('userId');
            if (storedUserId) {
                formData.append('userId', storedUserId);
            }
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

                // Firebase에도 수행기록 저장 (비동기, 실패해도 앱 동작에 영향 없음)
                try {
                    const storedUserId = await AsyncStorage.getItem('userId');
                    await MatchingService.saveJournalRecord({
                        id: `solo_journal_${Date.now()}`,
                        uid: storedUserId || '',
                        type: 'solo',
                        day: dayCount,
                        date: new Date().toLocaleDateString(),
                        content: journalInput,
                        mission: currentMissionText,
                        feedback: response.feedback,
                        createdAt: new Date().toISOString()
                    });
                    console.log('[ORBIT Solo] ✅ Firebase 수행기록 저장 완료');
                } catch (firebaseError) {
                    console.log('[ORBIT Solo] Firebase 수행기록 저장 실패 (무시):', firebaseError);
                }

                // Store next mission if provided
                if (response.nextMission || response.recommendedMission) {
                    const nextRitual = response.nextMission || response.recommendedMission;
                    await AsyncStorage.setItem('currentMission', nextRitual);
                }


                // Adaptive Progression - AI decides if user is ready for next LEVEL (not day)
                // Day는 날짜 기반으로 증가 (loadData에서 처리), shouldProgress는 레벨만 결정
                const shouldProgress = response.shouldProgress !== false; // default true
                setProgressReason(response.progressReason || null);

                // Get current growth level from storage
                const storedGrowthLevel = await AsyncStorage.getItem('growthLevel');
                let currentGrowthLevel = storedGrowthLevel ? parseInt(storedGrowthLevel, 10) : 1;

                if (shouldProgress) {
                    // User is ready for next level - increase growth level
                    const newLevel = Math.min(currentGrowthLevel + 1, 6);
                    setGrowthLevel(newLevel);
                    await AsyncStorage.setItem('growthLevel', newLevel.toString());
                    const phases = ['각성', '직면', '파괴', '재구축', '통합', '초월'];
                    setGrowthPhase(phases[newLevel - 1] || '각성');
                    console.log(`[ORBIT] ✅ Level Up to ${newLevel} (${phases[newLevel - 1]}) - ${response.progressReason || 'Ready'}`);
                } else {
                    // User needs more practice - stay at same level with new mission
                    console.log(`[ORBIT] ⏸️ Stay at Level ${currentGrowthLevel} - ${response.progressReason || 'More practice needed'}`);
                }

                // Save next mission (for next day unlock)
                if (response.recommendedMission) {
                    await AsyncStorage.setItem('nextMission', response.recommendedMission);
                }

                setMissionStatus(null);
                await AsyncStorage.removeItem('missionStatus');
                await AsyncStorage.setItem('lastCompletedDate', new Date().toISOString());

                // ============================================
                // 🎯 관리자 미션 완료 후 삭제 (다음엔 AI 미션 사용)
                // ============================================
                const hadAdminMission = await AsyncStorage.getItem('hasAdminMission');
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
                            console.log('[ORBIT Solo] ✅ 관리자 미션 완료 → 서버에서 삭제됨 (다음엔 AI 미션)');
                        }
                        // 로컬 플래그도 삭제
                        await AsyncStorage.removeItem('hasAdminMission');
                    } catch (adminErr) {
                        console.log('[ORBIT Solo] 관리자 미션 삭제 실패 (무시):', adminErr);
                        // 실패해도 로컬 플래그는 삭제
                        await AsyncStorage.removeItem('hasAdminMission');
                    }
                }

                // Set lock time for next 9 AM (오늘 9시 이전이면 오늘, 이후면 내일)
                const now = new Date();
                const target = new Date(now);
                target.setHours(9, 0, 0, 0);
                if (now.getTime() >= target.getTime()) {
                    target.setDate(target.getDate() + 1);
                }
                setNextMissionUnlockTime(target.toLocaleString());

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

                // 만남 당일이면 특별 미션 완료 처리 및 만남 유지 선택 모달 표시
                if (isMeetingDay && meetingConfirmed && !specialMissionCompleted) {
                    setSpecialMissionCompleted(true);
                    await AsyncStorage.setItem('specialMissionCompleted', 'true');
                    setMeetingDecisionModalVisible(true);
                } else {
                    setAnalysisModalVisible(true);
                }

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
            {/* Cosmic Background Image */}
            <Image
                source={cosmicBackground}
                style={styles.cosmicBackground}
                resizeMode="cover"
            />
            {/* Spline Animation Overlay */}
            <View style={styles.visualizerBackground}>
                <MysticVisualizer isActive={true} mode={visualizerMode} sceneUrl="https://prod.spline.design/gjz7s8UmZl4fmUa7/scene.splinecode" />
            </View>

            <SafeAreaView style={styles.safeArea}>
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
                                const placeholder = (userGender === 'female' || userGender === '여성') ? femalePlaceholder : malePlaceholder;
                                return <Image source={placeholder} style={styles.userPhoto} />;
                            })()}
                        </TouchableOpacity>



                        {/* 12시/6시 맞춤 조언 카드 */}
                        {personalizedAdvice && (
                            <View style={styles.missionContainer}>
                                <GlassCard variant="dark" style={[styles.signalCard, { borderColor: 'rgba(139, 92, 246, 0.3)', borderWidth: 1 }]}>
                                    <Text style={[styles.signalLabel, { color: '#A78BFA' }]}>
                                        ORBIT의 조언
                                    </Text>
                                    <Text style={styles.signalText}>
                                        {personalizedAdvice.advice}
                                    </Text>
                                    {personalizedAdvice.focusPrompt && (
                                        <Text style={[styles.signalText, { marginTop: 10, fontStyle: 'italic', color: 'rgba(167, 139, 250, 0.7)' }]}>
                                            {personalizedAdvice.focusPrompt}
                                        </Text>
                                    )}
                                </GlassCard>
                            </View>
                        )}

                        {/* ORBIT'S SIGNAL - AI Analysis */}
                        {aiAnalysis && (
                            <View style={styles.missionContainer}>
                                <GlassCard variant="dark" style={styles.signalCard}>
                                    <Text style={styles.signalLabel}>ORBIT'S SIGNAL</Text>
                                    <Text style={styles.signalText}>{aiAnalysis}</Text>
                                </GlassCard>
                            </View>
                        )}

                        {/* Today's Ritual */}
                        <View style={styles.missionContainer}>
                            <GlassCard variant="light" style={[styles.missionCard, nextMissionUnlockTime && styles.lockedCard]}>
                                <Text style={styles.missionTitle}>오늘의 리추얼</Text>
                                {nextMissionUnlockTime ? (
                                    <View style={styles.lockedMissionContainer}>
                                        <Text style={styles.countdownTimer}>{countdown}</Text>
                                        <Text style={styles.lockedText}>오전 9시에 돌아오겠습니다.</Text>
                                        {journalHistory.length > 0 && (
                                            <Text style={{ color: COLORS.textDim, fontSize: 14, marginTop: 20, textAlign: 'center' }}>
                                                최근 완수한 미션{'\n'}{journalHistory[0]?.mission || currentMissionText}
                                            </Text>
                                        )}
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
                                style={{ marginTop: 20, marginBottom: 10 }}
                            />
                        )}

                        {/* Day 10+ 특별미션 버튼 */}
                        {dayCount >= 10 && matchCandidate && !matchResult && !letterSent && (
                            <HolyButton
                                title="특별미션 시작하기"
                                variant="outline"
                                onPress={() => navigation.navigate('SpecialMissionIntro' as any)}
                                style={{ marginTop: 10, marginBottom: 10 }}
                            />
                        )}

                        {/* 받은 편지 읽기 버튼 */}
                        {receivedLetter && !meetingConfirmed && (
                            <HolyButton
                                title="받은 편지 읽기"
                                variant="outline"
                                onPress={() => setReceivedLetterModalVisible(true)}
                                style={{ marginTop: 10, marginBottom: 10 }}
                            />
                        )}

                        {/* 만남 확정 버튼 */}
                        {receivedLetter && !meetingConfirmed && (
                            <HolyButton
                                title="만남 확정하기"
                                onPress={() => setMeetingDateModalVisible(true)}
                                style={{ marginTop: 10, marginBottom: 20 }}
                            />
                        )}

                        {/* 만남 확정됨 상태 */}
                        {meetingConfirmed && meetingDate && !isMeetingDay && !specialMissionCompleted && (
                            <View style={{ marginTop: 10, marginBottom: 20, alignItems: 'center' }}>
                                <Text style={{ color: '#00FF88', fontSize: 16, fontWeight: 'bold' }}>
                                    💫 {meetingDate} 만남 예정
                                </Text>
                                <Text style={{ color: 'rgba(255,255,255,0.6)', fontSize: 12, marginTop: 5 }}>
                                    그 날이 되면 특별 미션이 열립니다
                                </Text>
                            </View>
                        )}

                        {/* 만남 당일 - 특별 미션 버튼 */}
                        {meetingConfirmed && isMeetingDay && !specialMissionCompleted && (
                            <View style={{ marginTop: 10, marginBottom: 20, alignItems: 'center' }}>
                                <Text style={{ color: COLORS.gold, fontSize: 18, fontWeight: 'bold', marginBottom: 10 }}>
                                    ✨ 오늘이 만남의 날입니다!
                                </Text>
                                <HolyButton
                                    title="💫 특별 미션 기록하기"
                                    onPress={() => setJournalModalVisible(true)}
                                    style={{ marginBottom: 10 }}
                                />
                                <Text style={{ color: 'rgba(255,255,255,0.5)', fontSize: 11, textAlign: 'center' }}>
                                    미션 기록 후 만남을 계속할지 선택하게 됩니다
                                </Text>
                            </View>
                        )}

                        {/* 상대방 응답 대기 중 */}
                        {specialMissionCompleted && partnerMeetingDecision === 'waiting' && (
                            <View style={{ marginTop: 10, marginBottom: 20, alignItems: 'center' }}>
                                <ActivityIndicator size="small" color={COLORS.gold} />
                                <Text style={{ color: COLORS.gold, fontSize: 14, marginTop: 10 }}>
                                    상대방의 응답을 기다리는 중...
                                </Text>
                            </View>
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
                                const placeholder = (userGender === 'female' || userGender === '여성') ? femalePlaceholder : malePlaceholder;
                                return <Image source={placeholder} style={styles.photoModalImage} />;
                            })()}
                        </View>

                        <TouchableOpacity
                            style={styles.photoChangeButton}
                            onPress={async () => {
                                setPhotoModalVisible(false);

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
                                                const uri = event.target.result;
                                                setUserPhoto(uri);
                                                await AsyncStorage.setItem('userPhoto', uri);
                                            };
                                            reader.readAsDataURL(file);
                                        }
                                    };
                                    input.click();
                                } else {
                                    // 모바일에서는 기존 Alert 사용
                                    Alert.alert(
                                        "프로필 사진 변경",
                                        "사진을 가져올 방법을 선택하세요.",
                                        [
                                            {
                                                text: "카메라로 촬영",
                                                onPress: async () => {
                                                    try {
                                                        const { status } = await ImagePicker.requestCameraPermissionsAsync();
                                                        if (status !== 'granted') {
                                                            Alert.alert('권한 필요', '카메라 권한이 필요합니다. 설정에서 권한을 허용해주세요.');
                                                            return;
                                                        }
                                                        const result = await ImagePicker.launchCameraAsync({
                                                            mediaTypes: ImagePicker.MediaTypeOptions.Images,
                                                            allowsEditing: true,
                                                            aspect: [1, 1],
                                                            quality: 0.8,
                                                        });
                                                        if (!result.canceled && result.assets && result.assets.length > 0) {
                                                            setUserPhoto(result.assets[0].uri);
                                                            await AsyncStorage.setItem('userPhoto', result.assets[0].uri);
                                                        }
                                                    } catch (error) {
                                                        console.error('카메라 오류:', error);
                                                        Alert.alert('오류', '카메라를 열 수 없습니다.');
                                                    }
                                                }
                                            },
                                            {
                                                text: "앨범에서 선택",
                                                onPress: async () => {
                                                    try {
                                                        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
                                                        if (status !== 'granted') {
                                                            Alert.alert('권한 필요', '사진 라이브러리 권한이 필요합니다. 설정에서 권한을 허용해주세요.');
                                                            return;
                                                        }
                                                        const result = await ImagePicker.launchImageLibraryAsync({
                                                            mediaTypes: ImagePicker.MediaTypeOptions.Images,
                                                            allowsEditing: true,
                                                            aspect: [1, 1],
                                                            quality: 0.8,
                                                        });
                                                        if (!result.canceled && result.assets && result.assets.length > 0) {
                                                            setUserPhoto(result.assets[0].uri);
                                                            await AsyncStorage.setItem('userPhoto', result.assets[0].uri);
                                                        }
                                                    } catch (error) {
                                                        console.error('앨범 오류:', error);
                                                        Alert.alert('오류', '앨범을 열 수 없습니다.');
                                                    }
                                                }
                                            },
                                            { text: "취소", style: "cancel" }
                                        ]
                                    );
                                }
                            }}
                        >
                            <Text style={styles.photoChangeButtonText}>사진 변경</Text>

                        </TouchableOpacity>
                    </View>
                </Modal>

                {/* Match Candidate Modal - Special Mission */}
                <Modal visible={matchCandidateModalVisible} animationType="slide" transparent={true}>
                    <View style={styles.modalOverlay}>
                        <GlassCard variant="dark" style={styles.matchCandidateModal}>
                            <ScrollView
                                showsVerticalScrollIndicator={false}
                                contentContainerStyle={{ paddingBottom: 10 }}
                            >
                                <Text style={styles.matchModalBadge}>특별 미션</Text>
                                <Text style={styles.matchModalTitle}>운명의 신호</Text>

                                {matchCandidate && (
                                    <View style={styles.matchCandidateProfile}>
                                        {/* 블러 처리된 사진 - 매칭 수락 전 */}
                                        <View style={styles.blurPhotoContainer}>
                                            <Image
                                                source={{ uri: matchCandidate.photo }}
                                                style={[styles.matchCandidatePhoto, { opacity: 0.7 }]}
                                                blurRadius={Platform.OS === 'ios' ? 15 : 10}
                                            />
                                            <View style={styles.blurOverlay} />
                                        </View>
                                        {/* 개인정보 숨김 - MBTI + 이상형만 표시 */}
                                        <Text style={styles.matchCandidateName}>
                                            비밀의 상대
                                        </Text>
                                        <Text style={styles.matchCandidateDetail}>
                                            {matchCandidate.mbti || 'MBTI 비공개'}
                                        </Text>
                                        <View style={styles.matchCandidateDeficit}>
                                            <Text style={styles.matchCandidateDeficitText}>
                                                이상형: {matchCandidate.deficit}
                                            </Text>
                                        </View>
                                    </View>
                                )}

                                <Text style={styles.matchModalInstruction}>
                                    가볍게 자기소개와 인사를 해보세요. 커피 한잔 마시는거 어떠세요? 약속장소와 날짜를 정하기 위해 상대방과 연락할 번호나 메일, 메신저 아이디를 교환하는 것도 좋습니다.
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
                            </ScrollView>

                            <View style={styles.matchModalButtons}>
                                <HolyButton
                                    title="나중에"
                                    variant="outline"
                                    onPress={() => setMatchCandidateModalVisible(false)}
                                    style={{ flex: 1, marginRight: 10, minHeight: 50, paddingVertical: 12 }}
                                    textStyle={{ fontSize: 14 }}
                                />
                                <HolyButton
                                    title="편지 보내기"
                                    onPress={handleSendLetter}
                                    style={{ flex: 1, minHeight: 50, paddingVertical: 12 }}
                                    textStyle={{ fontSize: 14 }}
                                />
                            </View>
                        </GlassCard>
                    </View>
                </Modal>

                {/* 받은 편지 읽기 모달 */}
                <Modal visible={receivedLetterModalVisible} animationType="slide" transparent={true}>
                    <View style={styles.modalOverlay}>
                        <GlassCard style={styles.matchCandidateModal}>
                            <Text style={styles.matchModalBadge}>받은 편지</Text>
                            <Text style={styles.matchModalTitle}>{receivedLetter?.from}님의 편지</Text>

                            <View style={{
                                backgroundColor: 'rgba(255,255,255,0.1)',
                                borderRadius: 12,
                                padding: 20,
                                marginVertical: 20,
                                width: '100%'
                            }}>
                                <Text style={{ color: '#FFF', fontSize: 16, lineHeight: 24 }}>
                                    {receivedLetter?.content}
                                </Text>
                                <Text style={{ color: 'rgba(255,255,255,0.5)', fontSize: 12, marginTop: 10, textAlign: 'right' }}>
                                    {receivedLetter?.date}
                                </Text>
                            </View>

                            <View style={styles.matchModalButtons}>
                                <HolyButton
                                    title="닫기"
                                    variant="outline"
                                    onPress={() => setReceivedLetterModalVisible(false)}
                                    style={{ flex: 1 }}
                                />
                            </View>
                        </GlassCard>
                    </View>
                </Modal>

                {/* 만남 날짜 선택 모달 */}
                <Modal visible={meetingDateModalVisible} animationType="slide" transparent={true}>
                    <View style={styles.modalOverlay}>
                        <GlassCard style={styles.matchCandidateModal}>
                            <Text style={styles.matchModalBadge}>만남 확정</Text>
                            <Text style={styles.matchModalTitle}>만남 날짜 선택</Text>

                            <Text style={{ color: 'rgba(255,255,255,0.7)', fontSize: 14, textAlign: 'center', marginVertical: 20 }}>
                                {matchCandidate?.name || receivedLetter?.from}님과 만날 날짜를 선택해주세요.
                            </Text>

                            <View style={{ width: '100%', gap: 10 }}>
                                {[1, 2, 3, 5, 7].map((days) => {
                                    const date = new Date();
                                    date.setDate(date.getDate() + days);
                                    const dateStr = date.toLocaleDateString('ko-KR', { month: 'long', day: 'numeric', weekday: 'short' });
                                    return (
                                        <HolyButton
                                            key={days}
                                            title={dateStr}
                                            variant="outline"
                                            onPress={async () => {
                                                setMeetingDate(dateStr);
                                                setMeetingConfirmed(true);
                                                setMeetingDateModalVisible(false);
                                                await AsyncStorage.setItem('meetingDate', dateStr);
                                                await AsyncStorage.setItem('meetingConfirmed', 'true');
                                                Alert.alert('만남 확정', `${dateStr}에 만나기로 했습니다. 그 날 오르빗이 특별미션을 드릴게요!`);
                                            }}
                                            style={{ width: '100%' }}
                                        />
                                    );
                                })}
                            </View>

                            <HolyButton
                                title="취소"
                                variant="outline"
                                onPress={() => setMeetingDateModalVisible(false)}
                                style={{ marginTop: 20, width: '100%' }}
                            />
                        </GlassCard>
                    </View>
                </Modal>

                {/* 만남 유지 선택 모달 */}
                <Modal visible={meetingDecisionModalVisible} animationType="slide" transparent={true}>
                    <View style={styles.modalOverlay}>
                        <GlassCard style={styles.matchCandidateModal}>
                            <Text style={styles.matchModalBadge}>💫 결정의 순간</Text>
                            <Text style={styles.matchModalTitle}>만남을 이어가시겠습니까?</Text>

                            <Text style={{ color: 'rgba(255,255,255,0.7)', fontSize: 14, textAlign: 'center', marginVertical: 20, lineHeight: 22 }}>
                                {matchCandidate?.name || receivedLetter?.from}님과의 만남은 어떠셨나요?{'\n'}
                                이 인연을 계속 이어가고 싶으신가요?
                            </Text>

                            <View style={{ width: '100%', gap: 15 }}>
                                <HolyButton
                                    title="💕 계속 만남을 이어가고 싶어요"
                                    onPress={() => handleMeetingDecision('continue')}
                                    style={{ width: '100%' }}
                                />
                                <HolyButton
                                    title="🙏 아쉽지만, 여기까지만 할게요"
                                    variant="outline"
                                    onPress={() => handleMeetingDecision('stop')}
                                    style={{ width: '100%' }}
                                />
                            </View>

                            <Text style={{ color: 'rgba(255,255,255,0.4)', fontSize: 11, textAlign: 'center', marginTop: 20 }}>
                                상대방도 같은 선택을 해야 인연이 이어집니다
                            </Text>
                        </GlassCard>
                    </View>
                </Modal>

                {/* 매칭 결과 모달 */}
                <Modal visible={meetingResultModalVisible} animationType="fade" transparent={true}>
                    <View style={styles.modalOverlay}>
                        <GlassCard style={styles.matchCandidateModal}>
                            {myMeetingDecision === 'continue' && partnerMeetingDecision === 'continue' ? (
                                <>
                                    <Text style={{ fontSize: 60, textAlign: 'center', marginBottom: 15 }}>🎉</Text>
                                    <Text style={[styles.matchModalTitle, { color: COLORS.gold }]}>인연이 이어집니다!</Text>
                                    <Text style={{ color: 'rgba(255,255,255,0.7)', fontSize: 14, textAlign: 'center', marginVertical: 20, lineHeight: 24 }}>
                                        축하드려요! 두 분 모두 만남을 계속하길 원하셨어요.{'\n'}
                                        이제 함께하는 커플 미션이 시작됩니다.{'\n\n'}
                                        서로를 더 깊이 알아가는 여정이 될 거예요. ✨
                                    </Text>
                                </>
                            ) : myMeetingDecision === 'stop' ? (
                                <>
                                    <Text style={{ fontSize: 60, textAlign: 'center', marginBottom: 15 }}>🌱</Text>
                                    <Text style={[styles.matchModalTitle, { color: '#A0A0A0' }]}>새로운 시작</Text>
                                    <Text style={{ color: 'rgba(255,255,255,0.7)', fontSize: 14, textAlign: 'center', marginVertical: 20, lineHeight: 24 }}>
                                        모든 만남에는 의미가 있어요.{'\n'}
                                        이번 경험도 당신의 성장에 소중한 밑거름이 될 거예요.{'\n\n'}
                                        다음에 만날 인연을 위해 계속 성장해나가요. 🌟
                                    </Text>
                                </>
                            ) : (
                                <>
                                    <Text style={{ fontSize: 60, textAlign: 'center', marginBottom: 15 }}>🌿</Text>
                                    <Text style={[styles.matchModalTitle, { color: '#A0A0A0' }]}>다른 길을 걷게 되었어요</Text>
                                    <Text style={{ color: 'rgba(255,255,255,0.7)', fontSize: 14, textAlign: 'center', marginVertical: 20, lineHeight: 24 }}>
                                        아쉽지만, 상대방은 다른 선택을 했어요.{'\n'}
                                        하지만 괜찮아요, 당신에게 맞는 인연은{'\n'}
                                        반드시 나타날 거예요.{'\n\n'}
                                        지금까지의 여정이 헛되지 않았어요.{'\n'}
                                        더 멋진 만남을 위해 함께 걸어가요. 💪
                                    </Text>
                                </>
                            )}

                            <HolyButton
                                title={myMeetingDecision === 'continue' && partnerMeetingDecision === 'continue' ? "커플 미션 시작하기" : "홈으로 돌아가기"}
                                onPress={handleMeetingResult}
                                style={{ width: '100%', marginTop: 10 }}
                            />
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
                                    {selectedImage ? "📷 사진 변경하기" : "📷 오늘의 미소를 기록하세요"}
                                </Text>
                            </TouchableOpacity>


                            {selectedImage && (
                                <Image source={{ uri: selectedImage }} style={styles.previewImage as ImageStyle} />
                            )}



                            <View style={styles.modalButtons}>
                                <HolyButton
                                    title="취소"
                                    onPress={() => setJournalModalVisible(false)}
                                    variant="ghost"
                                    style={{ minWidth: 100, paddingHorizontal: 20 }}
                                />
                                <HolyButton
                                    title={isAnalyzing ? "전송 중..." : "기록 완료"}
                                    onPress={handleCompleteReflection}
                                    disabled={isAnalyzing}
                                    style={{ minWidth: 100, paddingHorizontal: 20 }}
                                />
                            </View>
                        </GlassCard>
                    </View>
                </Modal>

                {/* Analysis Result Modal */}
                <AnalysisModal
                    visible={analysisModalVisible}
                    onClose={() => setAnalysisModalVisible(false)}
                    feedback={currentAnalysis?.feedback || null}
                />

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
                <IntroModal
                    visible={introModalVisible}
                    onClose={async () => {
                        setIntroModalVisible(false);
                        await AsyncStorage.setItem('hasSeenIntro', 'true');
                    }}
                    userName={name}
                    userDeficit={deficit}
                />

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
        zIndex: 1, // Above background image
        opacity: 0.6, // Allow cosmic background to show through
    },
    cosmicBackground: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        width: '100%',
        height: '100%',
        zIndex: 0, // Behind spline
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
        borderColor: 'rgba(139, 92, 246, 0.4)', // Purple cosmic border
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
        minWidth: 250, // Fixed width to prevent layout shift
        textAlign: 'center',
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
    modalButtons: { flexDirection: 'row', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10, minHeight: 50 },

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
    blurPhotoContainer: { position: 'relative', width: 100, height: 100, marginBottom: 15 },
    blurOverlay: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, borderRadius: 50, backgroundColor: 'rgba(0,0,0,0.3)', justifyContent: 'center', alignItems: 'center' },
    matchCandidatePhoto: { width: 100, height: 100, borderRadius: 50, borderWidth: 2, borderColor: COLORS.gold },
    matchCandidateName: { color: '#fff', fontSize: 20, fontWeight: 'bold' },
    matchCandidateDetail: { color: '#aaa', fontSize: 14, marginTop: 5 },
    matchCandidateDeficit: { backgroundColor: 'rgba(255,255,255,0.1)', paddingHorizontal: 15, paddingVertical: 8, borderRadius: 20, marginTop: 10 },
    matchCandidateDeficitText: { color: COLORS.gold, fontSize: 13 },
    matchCandidateBio: { color: '#ccc', fontSize: 14, marginTop: 10, textAlign: 'center' },
    matchModalInstruction: { color: '#888', fontSize: 13, textAlign: 'center', marginBottom: 15 },
    letterInput: {
        backgroundColor: 'rgba(255,255,255,0.08)',
        borderRadius: 12,
        padding: 15,
        color: '#fff',
        height: 120,
        textAlignVertical: 'top',
        fontSize: 14,
        borderWidth: 1.5,
        borderColor: 'rgba(139, 92, 246, 0.5)', // Purple border instead of yellow
        outlineStyle: 'none', // Remove yellow focus outline on web
    } as any,
    letterCharCount: { color: '#666', textAlign: 'right', marginTop: 5, marginBottom: 15, fontSize: 12 },
    matchModalButtons: {
        flexDirection: 'row',
        paddingHorizontal: 10,
        marginTop: 10,
    },

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
