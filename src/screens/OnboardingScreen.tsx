// ID: A-01, A-02, A-03, A-04, A-05
import React, { useState, useEffect, useRef } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    TextInput,
    Animated,
    Alert,
    SafeAreaView,
    StatusBar,
    KeyboardAvoidingView,
    Platform,
    TouchableWithoutFeedback,
    Keyboard,
    Image,
    ActivityIndicator
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as ImagePicker from 'expo-image-picker';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS } from '../theme/theme';
import MysticVisualizer from '../components/MysticVisualizer';
import HolyButton from '../components/HolyButton';
import { personaScripts, soloScripts, coupleScripts, PersonaScript } from '../services/PersonaService';
import LocationService from '../services/LocationService';
import MatchingService from '../services/MatchingService';
import { db } from '../config/firebase';
import { doc, setDoc, Timestamp } from 'firebase/firestore';
import StorageService from '../services/StorageService';
import { CommonActions } from '@react-navigation/native';
import notificationService from '../services/NotificationService';
import { api } from '../services/api';
import PermissionService from '../services/PermissionService';

interface OnboardingScreenProps {
    navigation: any;
}

const OnboardingScreen: React.FC<OnboardingScreenProps> = ({ navigation }) => {
    const [currentScriptIndex, setCurrentScriptIndex] = useState(0);
    const [inputText, setInputText] = useState('');
    const [answers, setAnswers] = useState<{ [key: string]: string }>({});
    const [selectedImage, setSelectedImage] = useState<string | null>(null);
    const [visualizerKey, setVisualizerKey] = useState(0);
    const [phase, setPhase] = useState<'intro' | 'solo' | 'couple'>('intro');

    const textFadeAnim = useRef(new Animated.Value(0)).current;
    const flashAnim = useRef(new Animated.Value(0)).current;
    const timerRef = useRef<NodeJS.Timeout | null>(null);
    const typingTimerRef = useRef<NodeJS.Timeout | null>(null);
    const textInputRef = useRef<TextInput>(null);
    const [displayedText, setDisplayedText] = useState('');
    const [isTyping, setIsTyping] = useState(false);
    const [permissionsRequested, setPermissionsRequested] = useState(false);
    const [isAnalyzing, setIsAnalyzing] = useState(false); // AI 분석 중 로딩

    // 온보딩 시작 시 모든 권한 한번에 요청
    useEffect(() => {
        const requestPermissions = async () => {
            const alreadyRequested = await PermissionService.hasRequestedPermissions();
            if (!alreadyRequested && !permissionsRequested) {
                console.log('[Onboarding] 모든 권한 요청 시작...');
                const status = await PermissionService.requestAllPermissions();
                setPermissionsRequested(true);

                // 거부된 권한 확인
                const deniedPermissions: string[] = [];
                if (!status.location) deniedPermissions.push('location');
                if (!status.notification) deniedPermissions.push('notification');
                if (!status.camera) deniedPermissions.push('camera');

                // 일부 권한 거부 시 안내 (비차단적)
                if (deniedPermissions.length > 0 && deniedPermissions.length < 4) {
                    // PermissionService.showPermissionDeniedAlert(deniedPermissions);
                    console.log('[Onboarding] 일부 권한 거부됨:', deniedPermissions);
                }
                console.log('[Onboarding] 권한 요청 완료:', status);
            }
        };
        requestPermissions();
    }, []);

    // Get current scripts based on phase
    const getCurrentScripts = () => {
        switch (phase) {
            case 'intro': return personaScripts;
            case 'solo': return soloScripts;
            case 'couple': return coupleScripts;
        }
    };

    const currentScripts = getCurrentScripts();
    const currentScript = currentScripts[currentScriptIndex];
    const totalScripts = currentScripts.length;

    useEffect(() => {
        startStepAnimation();

        // Character-by-character typing effect for statements
        if (currentScript.type === 'statement' && currentScript.text) {
            setDisplayedText('');
            setIsTyping(true);
            const fullText = currentScript.text;
            let charIndex = 0;

            const typeNextChar = () => {
                if (charIndex < fullText.length) {
                    setDisplayedText(fullText.substring(0, charIndex + 1));
                    charIndex++;
                    typingTimerRef.current = setTimeout(typeNextChar, 80);
                } else {
                    setIsTyping(false);
                    // If statement has a buttonText, don't auto-advance
                    if (!currentScript.buttonText) {
                        const readTime = 1500 + (fullText.length * 50);
                        timerRef.current = setTimeout(() => {
                            handleNext();
                        }, readTime);
                    }
                }
            };

            typingTimerRef.current = setTimeout(typeNextChar, 500);
        }

        return () => {
            if (timerRef.current) clearTimeout(timerRef.current);
            if (typingTimerRef.current) clearTimeout(typingTimerRef.current);
        };
    }, [currentScriptIndex, phase]);

    const startStepAnimation = () => {
        textFadeAnim.setValue(0);
        Animated.timing(textFadeAnim, {
            toValue: 1,
            duration: 1000,
            useNativeDriver: Platform.OS !== 'web',
        }).start();
    };

    const handleBack = () => {
        if (currentScriptIndex > 0) {
            setCurrentScriptIndex(prev => prev - 1);
            setInputText('');
            setSelectedImage(null);
            setVisualizerKey(prev => prev + 1);
        }
    };

    const handleNext = async (explicitValue?: string) => {
        if (timerRef.current) clearTimeout(timerRef.current);
        if (typingTimerRef.current) clearTimeout(typingTimerRef.current);
        setIsTyping(false);

        // Validation for text input (skip for image input and options)
        if (currentScript.type === 'question' && !currentScript.options && currentScript.inputType !== 'image' && inputText.trim() === '') {
            Alert.alert('알림', '답변을 입력해주세요.');
            return;
        }

        // 🚫 userDeficit (결핍 키워드) 의미없는 입력 검증
        if (currentScript.id === 'userDeficit') {
            const text = inputText.trim();
            const isMeaningless =
                /^[0-9]+$/.test(text) || // 숫자만
                /^[a-zA-Z]+$/.test(text) && text.length < 3 || // 너무 짧은 영문
                /^[ㄱ-ㅎㅏ-ㅣ]+$/.test(text) || // 자음/모음만
                /(.)\1{3,}/.test(text) || // 같은 문자 4번 이상 반복
                text.length < 2; // 너무 짧음

            if (isMeaningless) {
                Alert.alert('알림', '의미있는 키워드를 입력해주세요.\n예: 고독, 성취감, 안정, 사랑...');
                return;
            }
        }

        // Validation for image input
        if (currentScript.inputType === 'image' && !selectedImage) {
            // Image is optional, just proceed
        }

        // Save Answer
        if (currentScript.id) {
            let value = explicitValue !== undefined ? explicitValue : inputText;
            if (currentScript.inputType === 'image') value = selectedImage || '';

            const newAnswers = { ...answers, [currentScript.id]: value };
            setAnswers(newAnswers);

            // Save important data to AsyncStorage
            if (currentScript.id === 'userName') await AsyncStorage.setItem('userName', value);
            if (currentScript.id === 'userDeficit') await AsyncStorage.setItem('userDeficit', value);
            if (currentScript.id === 'userLocation') await AsyncStorage.setItem('userLocation', value);

            // Branching Logic: isCouple question in intro phase
            if (currentScript.id === 'isCouple' && phase === 'intro') {
                if (value === 'true') {
                    // Go to couple track
                    setPhase('couple');
                    setCurrentScriptIndex(0);
                    setVisualizerKey(prev => prev + 1);
                    setInputText('');
                    return;
                } else {
                    // Go to solo track
                    setPhase('solo');
                    setCurrentScriptIndex(0);
                    setVisualizerKey(prev => prev + 1);
                    setInputText('');
                    return;
                }
            }

            setVisualizerKey(prev => prev + 1);
        }

        // Reset inputs
        setInputText('');
        setSelectedImage(null);

        // Move to next or finish
        if (currentScriptIndex < totalScripts - 1) {
            setCurrentScriptIndex(prev => prev + 1);
        } else {
            completeOnboarding();
        }
    };

    const handleScreenTap = () => {
        if (currentScript.type === 'statement' && !currentScript.buttonText) {
            if (isTyping) {
                // 타이핑 중이면 텍스트 전체 표시 (스킵)
                if (typingTimerRef.current) clearTimeout(typingTimerRef.current);
                if (timerRef.current) clearTimeout(timerRef.current);
                setDisplayedText(currentScript.text || '');
                setIsTyping(false);
                // 자동 진행 안함 - 다시 터치해야 다음으로
            } else {
                // 타이핑 완료 상태면 다음으로
                handleNext();
            }
        }
    };

    const completeOnboarding = async () => {
        setIsAnalyzing(true); // 바로 로딩 표시
        try {
            console.log('[Onboarding] 🔍 answers 전체:', JSON.stringify(answers, null, 2));
            const keys = Object.keys(answers);
            for (const key of keys) {
                await AsyncStorage.setItem(key, answers[key]);
            }
            await AsyncStorage.setItem('hasOnboarded', 'true');
            await AsyncStorage.setItem('dayCount', '1');

            // Generate unique user ID
            const uniqueId = `user_${Date.now()}_${Math.random().toString(36).substring(7)}`;
            await AsyncStorage.setItem('userId', uniqueId);

            // Get GPS location for matching (non-blocking)
            let userLocation = null;
            try {
                userLocation = await LocationService.getCurrentLocation();
                console.log('[Onboarding] GPS 위치 수집:', userLocation);
            } catch (e) {
                console.log('[Onboarding] GPS 위치 수집 실패 (무시)');
            }

            // 알림 권한 요청 및 푸시 토큰 등록 (non-blocking)
            try {
                console.log('[Onboarding] 알림 권한 요청...');
                await notificationService.registerForPushNotifications(uniqueId);
                // 미션 알림 스케줄 설정
                await notificationService.scheduleMissionNotification();
                console.log('[Onboarding] 알림 설정 완료');
            } catch (e) {
                console.log('[Onboarding] 알림 설정 실패 (무시):', e);
            }

            // Upload profile photo to Firebase Storage (완전 비동기 - 기다리지 않음)
            // Note: selectedImage might be cleared after handleNext, so use answers['userPhoto'] instead
            const userPhotoUri = answers['userPhoto'] || selectedImage;
            let photoURL = null;
            if (userPhotoUri) {
                // 사진 업로드는 백그라운드에서 실행 (await 없음 - 기다리지 않음)
                console.log('[Onboarding] 프로필 사진 업로드 시작 (비동기):', userPhotoUri);
                StorageService.uploadProfilePhoto(uniqueId, userPhotoUri)
                    .then((url) => console.log('[Onboarding] 프로필 사진 업로드 완료:', url))
                    .catch((e) => console.log('[Onboarding] 프로필 사진 업로드 실패 (무시):', e));
            } else {
                console.log('[Onboarding] 프로필 사진 없음 (userPhoto:', answers['userPhoto'], ', selectedImage:', selectedImage, ')');
            }

            // Save user profile to Firestore (non-blocking)
            try {
                const userProfile: any = {
                    uid: uniqueId,
                    name: answers['userName'] || '',
                    age: parseInt(answers['userAge']) || 25,
                    gender: answers['userGender'] || '미입력',
                    deficit: answers['userDeficit'] || '성장',
                    job: answers['userJob'] || '미입력',
                    location: userLocation,
                    dayCount: 1,
                    growthLevel: 1,
                    growthPhase: '각성',
                    isMatchingActive: phase !== 'couple',
                    createdAt: Timestamp.now(),
                    // 오르빗인터뷰에서 수집한 추가 정보
                    idealType: answers['userIdealType'] || '',
                    bio: answers['userComplex'] || '',  // 자기소개로 활용
                    mbti: answers['userMBTI'] || '',
                    hobbies: answers['userHobbies'] || ''
                };

                // Add photoURL if available
                if (photoURL) {
                    userProfile.photoURL = photoURL;
                }

                setDoc(doc(db, 'users', uniqueId), userProfile)
                    .then(() => console.log('[Onboarding] Firestore 저장 완료:', uniqueId))
                    .catch(e => console.error('[Onboarding] Firestore 저장 실패:', e));
            } catch (e) {
                console.error('[Onboarding] Firestore 준비 실패:', e);
            }

            // ============================================
            // 🎯 AI 프로필 분석 (온보딩 완료 시점에 수행)
            // ============================================
            try {
                console.log('[Onboarding] AI 프로필 분석 시작...');
                const fullProfile = {
                    name: answers['userName'] || '',
                    gender: answers['userGender'] || '알 수 없음',
                    age: answers['userAge'] || '알 수 없음',
                    location: answers['userLocation'] || '',
                    idealType: answers['userIdealType'] || '',
                    hobbies: answers['userHobbies'] || '',
                    job: answers['userJob'] || '',
                    growth: answers['userGrowth'] || '',
                    complex: answers['userComplex'] || '',
                    deficit: answers['userDeficit'] || '성장'
                };

                const analysisResult = await api.analyzeProfile(fullProfile);
                if (analysisResult.success) {
                    await AsyncStorage.setItem('aiAnalysis', analysisResult.analysis || '');
                    if (analysisResult.matchRecommendation) {
                        await AsyncStorage.setItem('matchRecommendation', analysisResult.matchRecommendation);
                    }
                    // AI 생성 미션 저장 (Day 1 미션)
                    if (analysisResult.recommendedMission) {
                        await AsyncStorage.setItem('mission_day_1', analysisResult.recommendedMission);
                        console.log('[Onboarding] AI 미션 저장:', analysisResult.recommendedMission);
                    }
                    console.log('[Onboarding] AI 분석 완료:', analysisResult.analysis?.substring(0, 50) + '...');
                }
            } catch (e) {
                console.log('[Onboarding] AI 분석 실패 (무시):', e);
            }

            // 네비게이션 함수 정의 (에러 안전)
            const navigateToNextScreen = () => {
                try {
                    console.log('[Onboarding] 네비게이션 시작: phase =', phase);
                    if (phase === 'couple') {
                        const coupleProfile = {
                            goal: answers['coupleGoal'],
                            wish: answers['coupleWish'],
                            future: answers['coupleFuture'],
                            partnerDesc: answers['partnerDescription']
                        };
                        AsyncStorage.setItem('coupleProfile', JSON.stringify(coupleProfile));
                        AsyncStorage.setItem('isCoupled', 'true');
                        navigation.dispatch(
                            CommonActions.reset({
                                index: 0,
                                routes: [{ name: 'CouplesMission' }]
                            })
                        );
                    } else {
                        navigation.dispatch(
                            CommonActions.reset({
                                index: 0,
                                routes: [{ name: 'MainTabs' }]
                            })
                        );
                    }
                } catch (navError) {
                    console.error('[Onboarding] 네비게이션 에러:', navError);
                    // 강제 이동 시도
                    navigation.navigate('MainTabs');
                }
            };

            // Bright Flash Effect (웹에서는 애니메이션 콜백 문제 회피)
            setIsAnalyzing(false); // 로딩 종료
            if (Platform.OS === 'web') {
                // 웹: 애니메이션 없이 바로 네비게이션
                navigateToNextScreen();
            } else {
                // 네이티브: 애니메이션 시작 + 확실한 네비게이션 보장
                Animated.sequence([
                    Animated.timing(flashAnim, {
                        toValue: 1,
                        duration: 500,
                        useNativeDriver: true,
                    }),
                    Animated.timing(flashAnim, {
                        toValue: 0,
                        duration: 1000,
                        useNativeDriver: true,
                    })
                ]).start();

                // 애니메이션 콜백 대신 setTimeout으로 확실하게 네비게이션
                setTimeout(() => {
                    navigateToNextScreen();
                }, 1500);
            }

        } catch (error) {
            console.error('Error saving onboarding data:', error);
            Alert.alert('오류', '데이터 저장 중 문제가 발생했습니다.');
            // 에러 발생해도 Home으로 이동 시도
            try {
                navigation.replace('MainTabs');
            } catch (e) {
                console.error('Navigation failed:', e);
            }
        }
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
            return;
        }

        // 모바일에서는 카메라/앨범 선택
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
                            allowsEditing: true,
                            aspect: [1, 1],
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
                            allowsEditing: true,
                            aspect: [1, 1],
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

    const renderInput = () => {
        if (!currentScript || currentScript.type !== 'question') return null;

        // Options selection (new structure with label/value)
        if (currentScript.options && currentScript.options.length > 0) {
            return (
                <View style={styles.optionsContainer}>
                    {currentScript.options.map((option, index) => (
                        <HolyButton
                            key={index}
                            title={option.label}
                            onPress={() => {
                                const valueToSave = String(option.value);
                                setAnswers({ ...answers, [currentScript.id!]: valueToSave });
                                handleNext(valueToSave);
                            }}
                            variant="outline"
                            style={{ marginBottom: 10, width: '100%', borderColor: '#FFF' }}
                            textStyle={{ color: '#FFF' }}
                        />
                    ))}
                </View>
            );
        }

        // Image input
        if (currentScript.inputType === 'image') {
            return (
                <View style={{ width: '100%', alignItems: 'center', flex: 1, justifyContent: 'center' }}>
                    <TouchableOpacity onPress={pickImage} style={styles.photoUploadButton}>
                        {selectedImage ? (
                            <Image source={{ uri: selectedImage }} style={styles.uploadedImage} />
                        ) : (
                            <Text style={styles.photoUploadText}>사진 선택하기</Text>
                        )}
                    </TouchableOpacity>

                    <HolyButton
                        key={selectedImage || 'no-image'}
                        title={selectedImage ? "확인" : "사진 없이 계속하기"}
                        onPress={() => handleNext()}
                        style={{ marginTop: 30, width: '100%' }}
                    />
                </View>
            );
        }

        // Text/Numeric input (default)
        return (
            <View style={{ width: '100%', paddingHorizontal: 40 }}>
                <TextInput
                    style={styles.textInput}
                    placeholder={currentScript.placeholder || "답변을 입력하세요"}
                    placeholderTextColor="rgba(255,255,255,0.5)"
                    value={inputText}
                    onChangeText={setInputText}
                    onSubmitEditing={() => handleNext()}
                    autoFocus={true}
                    keyboardType={currentScript.inputType === 'numeric' ? 'numeric' : 'default'}
                />
                <HolyButton title="확인" onPress={() => handleNext()} style={{ marginTop: 20, width: '100%' }} />
            </View>
        );
    };

    const handleFastFill = async () => {
        try {
            // 고유 userId 생성
            const uniqueId = `user_${Date.now()}_${Math.random().toString(36).substring(7)}`;
            await AsyncStorage.setItem('userId', uniqueId);

            await AsyncStorage.setItem('userName', '민수');
            await AsyncStorage.setItem('userGender', '남성');
            await AsyncStorage.setItem('userAge', '29');
            await AsyncStorage.setItem('userLocation', '서울');
            await AsyncStorage.setItem('userIdealType', '솔직한 영혼');
            await AsyncStorage.setItem('userHobbies', '명상');
            await AsyncStorage.setItem('userJob', '건축가');
            await AsyncStorage.setItem('userGrowth', '두려움 극복');
            await AsyncStorage.setItem('userComplex', '완벽주의');
            await AsyncStorage.setItem('userDeficit', '내면의 평화');

            await AsyncStorage.setItem('hasOnboarded', 'true');
            await AsyncStorage.setItem('dayCount', '1');

            navigation.replace('Home', { name: '민수', deficit: '내면의 평화' });
        } catch (e) {
            console.error(e);
        }
    };

    return (
        <TouchableWithoutFeedback onPress={handleScreenTap}>
            <View style={styles.container}>
                <StatusBar barStyle="light-content" backgroundColor={COLORS.background} />
                {/* Cosmic Background Image (나노바나나 제작) */}
                <Image
                    source={require('../../assets/cosmic_background.png')}
                    style={styles.cosmicBackground}
                    resizeMode="cover"
                />
                <View style={styles.visualizerBackground}>
                    <MysticVisualizer isActive={true} mode={currentScript.type === 'statement' ? 'speaking' : 'listening'} sceneUrl="https://prod.spline.design/gjz7s8UmZl4fmUa7/scene.splinecode" />
                </View>

                <SafeAreaView style={styles.safeArea}>
                    {/* 뒤로가기 버튼 (첫 화면이 아닐 때만 표시) */}
                    {currentScriptIndex > 0 && (
                        <TouchableOpacity
                            style={styles.backButton}
                            onPress={handleBack}
                        >
                            <Text style={styles.backButtonText}>← 이전</Text>
                        </TouchableOpacity>
                    )}

                    <KeyboardAvoidingView
                        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                        style={{ flex: 1, justifyContent: 'center' }}
                    >
                        <View style={styles.contentContainer}>


                            <Animated.View style={{ opacity: textFadeAnim, width: '100%', alignItems: 'center', paddingHorizontal: 30 }}>
                                <Text style={styles.personaText}>
                                    {currentScript?.type === 'statement' ? displayedText : currentScript?.text}
                                </Text>
                            </Animated.View>

                            <View style={styles.inputContainer}>
                                {/* Render input for questions */}
                                {renderInput()}

                                {/* Render button for statements with buttonText */}
                                {currentScript?.type === 'statement' && currentScript?.buttonText && !isTyping && (
                                    <HolyButton
                                        title={currentScript.buttonText}
                                        onPress={() => handleNext()}
                                        style={{ marginTop: 30, width: '80%' }}
                                    />
                                )}
                            </View>
                        </View>
                    </KeyboardAvoidingView>
                </SafeAreaView>

                {/* Flash Overlay */}
                <Animated.View
                    style={[
                        styles.flashOverlay,
                        { opacity: flashAnim },
                        { pointerEvents: 'none' }
                    ]}
                />

                {/* AI 분석 로딩 오버레이 */}
                {isAnalyzing && (
                    <View style={styles.analyzingOverlay}>
                        <ActivityIndicator size="large" color="#A78BFA" />
                        <Text style={styles.analyzingText}>당신의 내면을 분석하고 있습니다...</Text>
                        <Text style={styles.analyzingSubtext}>잠시만 기다려주세요</Text>
                    </View>
                )}
            </View>
        </TouchableWithoutFeedback>
    );
};

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
    contentContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        width: '100%',
        paddingBottom: 50,
    },
    skipButton: {
        position: 'absolute',
        top: 20,
        right: 20,
        padding: 10,
        zIndex: 20,
    },
    skipText: {
        color: 'rgba(255, 255, 255, 0.5)',
        fontSize: 14,
        letterSpacing: 1,
    },
    personaText: {
        color: '#FFF',
        fontSize: 22,
        fontWeight: '600',
        textAlign: 'center',
        lineHeight: 34,
        letterSpacing: 0.5,
        marginBottom: 40,
        ...(Platform.OS === 'web'
            ? { textShadow: '0 0 15px rgba(255, 255, 255, 0.8)' }
            : {
                textShadowColor: 'rgba(255, 255, 255, 0.8)',
                textShadowOffset: { width: 0, height: 0 },
                textShadowRadius: 15,
            }
        ),
    } as any,
    inputContainer: {
        width: '100%',
        alignItems: 'center',
        position: 'absolute',
        bottom: 80,
    },
    textInput: {
        width: '100%',
        borderBottomWidth: 2,
        borderBottomColor: '#FFF',
        color: '#FFF',
        fontSize: 24,
        paddingVertical: 10,
        textAlign: 'center',
        fontWeight: 'bold',
        outlineStyle: 'none',
    } as any,
    optionsContainer: {
        width: '100%',
        paddingHorizontal: 30,
    },
    photoUploadButton: {
        width: 150,
        height: 150,
        borderRadius: 75,
        backgroundColor: 'rgba(255,255,255,0.1)',
        justifyContent: 'center',
        alignItems: 'center',
        alignSelf: 'center',
        borderWidth: 2,
        borderColor: '#FFF',
        overflow: 'hidden',
    },
    photoUploadText: {
        color: '#FFF',
        fontSize: 14,
        fontWeight: '600',
    },
    uploadedImage: {
        width: '100%',
        height: '100%',
    },
    flashOverlay: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: '#FFFFFF',
        zIndex: 100,
    },
    // Progress Bar Styles
    progressContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 30,
        paddingTop: 20,
        paddingBottom: 10,
    },
    progressBarBackground: {
        flex: 1,
        height: 4,
        backgroundColor: 'rgba(255, 255, 255, 0.2)',
        borderRadius: 2,
        overflow: 'hidden',
    },
    progressBarFill: {
        height: '100%',
        backgroundColor: COLORS.gold,
        borderRadius: 2,
    },
    progressText: {
        color: 'rgba(255, 255, 255, 0.6)',
        fontSize: 12,
        marginLeft: 10,
        fontWeight: '500',
    },
    analyzingOverlay: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(0, 0, 0, 0.85)',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 200,
    },
    analyzingText: {
        color: '#FFFFFF',
        fontSize: 18,
        fontWeight: '600',
        marginTop: 20,
        textAlign: 'center',
    },
    analyzingSubtext: {
        color: 'rgba(255, 255, 255, 0.6)',
        fontSize: 14,
        marginTop: 10,
        textAlign: 'center',
    },
    backButton: {
        position: 'absolute',
        top: 20,
        left: 20,
        padding: 10,
        zIndex: 10,
    },
    backButtonText: {
        color: 'rgba(255, 255, 255, 0.7)',
        fontSize: 16,
        fontWeight: '500',
    },
});

export default OnboardingScreen;
