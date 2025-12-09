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
    Image
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as ImagePicker from 'expo-image-picker';
import { COLORS } from '../theme/theme';
import MysticVisualizer from '../components/MysticVisualizer';
import HolyButton from '../components/HolyButton';
import { personaScripts, coupleScripts, PersonaScript } from '../services/PersonaService';

interface OnboardingScreenProps {
    navigation: any;
}

const OnboardingScreen: React.FC<OnboardingScreenProps> = ({ navigation }) => {
    const [currentScriptIndex, setCurrentScriptIndex] = useState(0);
    const [inputText, setInputText] = useState('');
    const [answers, setAnswers] = useState<{ [key: string]: string }>({});
    const [selectedImage, setSelectedImage] = useState<string | null>(null);
    const [visualizerKey, setVisualizerKey] = useState(0);
    const [isCoupleMode, setIsCoupleMode] = useState(false);

    const textFadeAnim = useRef(new Animated.Value(0)).current;
    const flashAnim = useRef(new Animated.Value(0)).current;
    const timerRef = useRef<NodeJS.Timeout | null>(null);

    const currentScripts = isCoupleMode ? coupleScripts : personaScripts;
    const currentScript = currentScripts[currentScriptIndex];
    const totalScripts = currentScripts.length;

    useEffect(() => {
        startStepAnimation();

        // Auto-advance logic for messages
        if (currentScript.type === 'message') {
            timerRef.current = setTimeout(() => {
                handleNext();
            }, 15000); // 15 seconds
        }

        return () => {
            if (timerRef.current) {
                clearTimeout(timerRef.current);
            }
        };
    }, [currentScriptIndex]);

    const startStepAnimation = () => {
        textFadeAnim.setValue(0);
        Animated.timing(textFadeAnim, {
            toValue: 1,
            duration: 1000,
            useNativeDriver: true,
        }).start();
    };

    const handleNext = async (explicitValue?: string) => {
        if (timerRef.current) clearTimeout(timerRef.current);

        // Validation
        if (currentScript.inputType === 'text' && inputText.trim() === '') {
            Alert.alert('알림', '답변을 입력해주세요.');
            return;
        }
        if (currentScript.inputType === 'photo' && !selectedImage && currentScript.required) {
            Alert.alert('알림', '사진을 선택해주세요.');
            return;
        }

        // Save Answer
        if (currentScript.key) {
            let value = explicitValue !== undefined ? explicitValue : inputText;
            if (currentScript.inputType === 'photo') value = selectedImage || '';

            const newAnswers = { ...answers, [currentScript.key]: value };
            setAnswers(newAnswers);

            if (currentScript.key === 'userName') await AsyncStorage.setItem('userName', value);
            if (currentScript.key === 'userDeficit') await AsyncStorage.setItem('userDeficit', value);
            if (currentScript.key === 'userLocation') await AsyncStorage.setItem('userLocation', value);

            // Couple Branching Logic
            if (currentScript.key === 'isCouple') {
                if (value === '네, 커플입니다') {
                    setIsCoupleMode(true);
                    setCurrentScriptIndex(0); // Restart index for couple scripts
                    setVisualizerKey(prev => prev + 1);
                    setInputText('');
                    return; // Stop here to let effect hook handle the new script
                }
            }

            // Only trigger visualizer reset on input confirmation
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
        if (currentScript.type === 'message') {
            handleNext();
        }
    };

    const completeOnboarding = async () => {
        try {
            const keys = Object.keys(answers);
            for (const key of keys) {
                await AsyncStorage.setItem(key, answers[key]);
            }
            await AsyncStorage.setItem('hasOnboarded', 'true');
            await AsyncStorage.setItem('dayCount', '1');

            // Bright Flash Effect
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
            ]).start(async () => {
                if (isCoupleMode) {
                    // Save Couple Profile
                    const coupleProfile = {
                        goal: answers['coupleGoal'],
                        wish: answers['coupleWish'],
                        future: answers['coupleFuture'],
                        partnerDesc: answers['partnerDescription']
                    };
                    await AsyncStorage.setItem('coupleProfile', JSON.stringify(coupleProfile));
                    await AsyncStorage.setItem('isCoupled', 'true');

                    // Navigate to Couples Mission
                    navigation.replace('MainTabs', {
                        screen: 'Connection'
                    });
                } else {
                    navigation.replace('Home', {
                        name: answers['userName'] || '구도자',
                        deficit: answers['userDeficit'] || '성장'
                    });
                }
            });

        } catch (error) {
            console.error('Error saving onboarding data:', error);
            Alert.alert('오류', '데이터 저장 중 문제가 발생했습니다.');
        }
    };

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
                            allowsEditing: false, // Disabled editing for direct upload
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
                            allowsEditing: false, // Disabled editing for direct upload
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
        if (!currentScript) return null;

        if (currentScript.inputType === 'text') {
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
                    />
                    <HolyButton title="확인" onPress={() => handleNext()} style={{ marginTop: 20, width: '100%' }} />
                </View>
            );
        } else if (currentScript.inputType === 'selection') {
            return (
                <View style={styles.optionsContainer}>
                    {currentScript.options?.map((option: string, index: number) => (
                        <HolyButton
                            key={index}
                            title={option}
                            onPress={() => {
                                if (currentScript.key === 'userLocation' && option === '그 외 지역') {
                                    Alert.alert(
                                        '안내',
                                        '현재 매칭 파동은 서울과 경기 지역에만 닿고 있습니다.\n하지만 내면의 성장을 위한 수련은 언제든 가능합니다.',
                                        [
                                            {
                                                text: '확인',
                                                onPress: () => {
                                                    setAnswers({ ...answers, [currentScript.key!]: 'Other' });
                                                    handleNext('Other');
                                                }
                                            }
                                        ]
                                    );
                                } else {
                                    let valueToSave = option;
                                    if (currentScript.key === 'userLocation') {
                                        if (option === '서울') valueToSave = 'Seoul';
                                        if (option === '경기') valueToSave = 'Gyeonggi';
                                    }

                                    setAnswers({ ...answers, [currentScript.key!]: valueToSave });
                                    handleNext(valueToSave);
                                }
                            }}
                            variant="outline"
                            style={{ marginBottom: 10, width: '100%', borderColor: '#FFF' }}
                            textStyle={{ color: '#FFF' }}
                        />
                    ))}
                </View>
            );
        } else if (currentScript.inputType === 'photo') {
            return (
                <View style={{ width: '100%', alignItems: 'center' }}>
                    <TouchableOpacity onPress={pickImage} style={styles.photoUploadButton}>
                        {selectedImage ? (
                            <Image source={{ uri: selectedImage }} style={styles.uploadedImage} />
                        ) : (
                            <Text style={styles.photoUploadText}>📷 사진 선택하기</Text>
                        )}
                    </TouchableOpacity>

                    <HolyButton
                        key={selectedImage || 'no-image'}
                        title={selectedImage ? "확인" : "사진 없이 계속하기"}
                        onPress={() => handleNext()}
                        style={{ marginTop: 20, width: '100%' }}
                    />
                </View>
            );
        } else {
            return null;
        }
    };

    const handleFastFill = async () => {
        try {
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
                <View style={styles.visualizerBackground}>
                    <MysticVisualizer isActive={true} mode={currentScript.type === 'message' ? 'speaking' : 'listening'} key={visualizerKey} sceneUrl="https://prod.spline.design/jYIOKYyzTpgISC0I/scene.splinecode" />
                </View>

                <SafeAreaView style={styles.safeArea}>
                    {/* DEV: Fast Fill Button */}
                    <TouchableOpacity
                        onPress={handleFastFill}
                        style={{ position: 'absolute', top: 50, left: 20, zIndex: 999, padding: 10, backgroundColor: 'rgba(255,0,0,0.3)' }}
                    >
                        <Text style={{ color: 'white', fontSize: 10 }}>DEV FILL</Text>
                    </TouchableOpacity>

                    <KeyboardAvoidingView
                        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                        style={{ flex: 1, justifyContent: 'center' }}
                    >
                        <View style={styles.contentContainer}>
                            <TouchableOpacity
                                style={styles.skipButton}
                                onPress={() => {
                                    Alert.alert('알림', '온보딩을 건너뛰시겠습니까?', [
                                        { text: '취소', style: 'cancel' },
                                        { text: '건너뛰기', onPress: completeOnboarding }
                                    ]);
                                }}
                            >
                                <Text style={styles.skipText}>Skip</Text>
                            </TouchableOpacity>

                            <Animated.View style={{ opacity: textFadeAnim, width: '100%', alignItems: 'center', paddingHorizontal: 30 }}>
                                <Text style={styles.personaText}>
                                    {currentScript?.text}
                                </Text>
                            </Animated.View>

                            <View style={styles.inputContainer}>
                                {renderInput()}
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
            </View>
        </TouchableWithoutFeedback>
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
        textShadowColor: 'rgba(0, 0, 0, 0.5)',
        textShadowOffset: { width: 0, height: 0 },
        textShadowRadius: 10,
    },
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
    },
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
    }
});

export default OnboardingScreen;
