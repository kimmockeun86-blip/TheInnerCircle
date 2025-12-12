// ID: D-01
import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, SafeAreaView, TouchableOpacity, ScrollView, Alert, TextInput, ActivityIndicator, Modal } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import MysticVisualizer from '../components/MysticVisualizer';
import GlassCard from '../components/GlassCard';
import HolyButton from '../components/HolyButton';
import { COLORS } from '../theme/theme';
import { CouplesMissionScreenNavigationProp } from '../types/navigation';

type ScreenMode = 'intro' | 'input' | 'result' | 'completed';

const CouplesMissionScreen = () => {
    const navigation = useNavigation<CouplesMissionScreenNavigationProp>();
    const [mode, setMode] = useState<ScreenMode>('intro');
    const [reflection, setReflection] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [analysisResult, setAnalysisResult] = useState<any>(null);
    const [daysTogether, setDaysTogether] = useState(1);
    const [historyModalVisible, setHistoryModalVisible] = useState(false);
    const [missionHistory, setMissionHistory] = useState<any[]>([]);

    useEffect(() => {
        const loadHistory = async () => {
            try {
                const history = await AsyncStorage.getItem('coupleMissionHistory');
                if (history) {
                    setMissionHistory(JSON.parse(history));
                }
            } catch (e) {
                console.error('Failed to load history:', e);
            }
        };
        loadHistory();
    }, []);

    useEffect(() => {
        const initializeDays = async () => {
            try {
                const storedDate = await AsyncStorage.getItem('coupleStartDate');
                const today = new Date();

                if (storedDate) {
                    const startDate = new Date(storedDate);
                    const diffTime = Math.abs(today.getTime() - startDate.getTime());
                    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                    setDaysTogether(diffDays > 0 ? diffDays : 1);
                } else {
                    // If no date exists, assume today is day 1 and save it
                    await AsyncStorage.setItem('coupleStartDate', today.toISOString());
                    setDaysTogether(1);
                }
            } catch (e) {
                console.error('Failed to load couple start date:', e);
            }
        };
        initializeDays();
    }, []);

    const handleAnalyze = async () => {
        if (reflection.trim().length < 5) {
            Alert.alert('알림', '대화 내용을 조금 더 자세히 적어주세요.');
            return;
        }

        setIsLoading(true);
        try {
            const timeout = new Promise((_, reject) =>
                setTimeout(() => reject(new Error('Request timed out')), 15000)
            );

            const apiCall = fetch('http://localhost:3000/api/analysis/couple-chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    chatContent: reflection,
                    user1Name: '나',
                    user2Name: '상대방'
                })
            });

            const response = await Promise.race([apiCall, timeout]) as Response;
            const data = await response.json();

            if (data.success) {
                setAnalysisResult(data);
                setMode('result');
            } else {
                Alert.alert('오류', '분석에 실패했습니다. 다시 시도해주세요.');
            }
        } catch (e) {
            console.error('Analysis Error:', e);
            Alert.alert('오류', '분석 중 문제가 발생했습니다.');
        } finally {
            setIsLoading(false);
        }
    };

    const handleComplete = async () => {
        try {
            const today = new Date().toLocaleDateString();
            const newEntry = {
                day: daysTogether,
                date: today,
                reflection: reflection,
                mission: analysisResult?.nextMission || '',
                analysis: analysisResult?.analysis || ''
            };

            const updatedHistory = [newEntry, ...missionHistory];
            setMissionHistory(updatedHistory);
            await AsyncStorage.setItem('coupleMissionHistory', JSON.stringify(updatedHistory));

            await AsyncStorage.setItem('couplesMissionStatus', 'completed');
            await AsyncStorage.setItem('couplesReflection', reflection);
            // setMode('completed'); // Removed as per user request to simplify flow
        } catch (e) {
            console.error('Failed to save mission status:', e);
        }
    };

    const renderContent = () => {
        switch (mode) {
            case 'intro':
                return (
                    <View style={styles.contentContainer}>
                        <Text style={styles.title}>첫 번째 커플 미션</Text>
                        <Text style={styles.subtitle}>두 영혼의 공명</Text>

                        <GlassCard style={styles.card}>
                            <Text style={styles.missionText}>
                                "서로의 눈을 1분간 바라보며,{'\n'}
                                말하지 않고 마음을 전하십시오."
                            </Text>
                        </GlassCard>

                        <Text style={styles.instructionText}>
                            이 미션은 두 분이 물리적으로 함께 있거나,{'\n'}
                            화상 통화를 통해 진행할 수 있습니다.
                        </Text>

                        <HolyButton
                            title="미션 수행 완료"
                            onPress={() => setMode('input')}
                            style={{ marginTop: 40, width: '100%' }}
                        />
                    </View>
                );

            case 'input':
                return (
                    <View style={styles.contentContainer}>
                        <Text style={styles.title}>커플 미션 기록</Text>
                        <Text style={styles.subtitle}>함께 나눈 대화나 감정을 기록해주세요</Text>

                        <GlassCard style={styles.card}>
                            <TextInput
                                style={styles.input}
                                placeholder="예: 오늘 서로 눈을 보며 이런 이야기를 나눴어..."
                                placeholderTextColor="#666"
                                multiline
                                value={reflection}
                                onChangeText={setReflection}
                                editable={!isLoading}
                            />
                        </GlassCard>

                        <View style={styles.buttonRow}>
                            <TouchableOpacity
                                onPress={() => setMode('intro')}
                                style={styles.cancelButton}
                                disabled={isLoading}
                            >
                                <Text style={styles.cancelButtonText}>취소</Text>
                            </TouchableOpacity>

                            <View style={{ flex: 1, marginLeft: 10 }}>
                                <HolyButton
                                    title={isLoading ? "분석 중..." : "분석 시작"}
                                    onPress={handleAnalyze}
                                    style={{ opacity: isLoading ? 0.7 : 1 }}
                                />
                            </View>
                        </View>
                    </View>
                );

            case 'result':
                return (
                    <View style={styles.contentContainer}>
                        <View style={{ alignItems: 'center', justifyContent: 'center', flex: 1 }}>
                            <Text style={styles.title}>깊어지는 사랑({daysTogether}일째)</Text>
                            <Text style={styles.subtitle}>매일 성장하는 당신을 위해</Text>

                            <View style={{ marginVertical: 40, alignItems: 'center' }}>
                                <Text style={styles.missionText}>
                                    {analysisResult?.nextMission}
                                </Text>
                                <Text style={[styles.instructionText, { marginTop: 20 }]}>
                                    {analysisResult?.analysis}
                                </Text>
                            </View>

                            <HolyButton
                                title="돌아가기"
                                onPress={() => {
                                    handleComplete();
                                    navigation.goBack();
                                }}
                                style={{ marginTop: 20, width: '100%' }}
                            />
                        </View>
                    </View>
                );


        }
    };

    return (
        <SafeAreaView style={styles.safeArea}>
            <MysticVisualizer
                isActive={true}
                mode={mode === 'result' ? 'speaking' : 'listening'}
                sceneUrl="https://prod.spline.design/xL8YvPetHy5ja0Yk/scene.splinecode"
                style={styles.visualizer}
            />
            <ScrollView contentContainerStyle={styles.scrollContent}>
                <View style={styles.header}>
                    <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                        <Text style={styles.backButtonText}>←</Text>
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>커플 미션</Text>
                    <TouchableOpacity onPress={() => setHistoryModalVisible(true)} style={styles.historyButton}>
                        <Text style={styles.historyButtonText}>📜</Text>
                    </TouchableOpacity>
                </View>
                {renderContent()}
            </ScrollView>

            <Modal visible={historyModalVisible} animationType="slide" transparent={true}>
                <View style={styles.modalOverlay}>
                    <GlassCard style={styles.historyModalContent}>
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
                                    <View key={index} style={styles.historyItem}>
                                        <Text style={styles.historyDay}>Day {entry.day} ({entry.date})</Text>
                                        <Text style={styles.historyMission}>미션: {entry.mission}</Text>
                                        <Text style={styles.historyReflection}>"{entry.reflection}"</Text>
                                        <Text style={styles.historyAnalysis}>파라: {entry.analysis}</Text>
                                    </View>
                                ))
                            )}
                        </ScrollView>
                    </GlassCard>
                </View>
            </Modal>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    visualizer: {
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
    backButton: { padding: 10 },
    backButtonText: { color: COLORS.gold, fontSize: 24 },
    scrollContent: { flexGrow: 1, justifyContent: 'center', paddingBottom: 40 },
    contentContainer: { paddingHorizontal: 20, alignItems: 'center', width: '100%' },

    title: { color: COLORS.gold, fontSize: 28, fontWeight: 'bold', marginBottom: 10, textAlign: 'center' },
    subtitle: { color: '#fff', fontSize: 16, marginBottom: 30, opacity: 0.8, textAlign: 'center' },

    card: { padding: 25, width: '100%', marginBottom: 20 },
    missionText: { color: '#fff', fontSize: 20, textAlign: 'center', lineHeight: 32, fontWeight: '500' },
    instructionText: { color: '#aaa', fontSize: 14, textAlign: 'center', lineHeight: 22, marginBottom: 20 },

    input: { color: '#fff', fontSize: 16, height: 150, textAlignVertical: 'top' },
    buttonRow: { flexDirection: 'row', alignItems: 'center', width: '100%' },
    cancelButton: { padding: 15 },
    cancelButtonText: { color: '#aaa', fontSize: 16 },

    resultSection: { marginBottom: 25 },
    sectionHeader: { color: COLORS.gold, fontSize: 18, fontWeight: 'bold', marginBottom: 8 },
    sectionText: { color: '#fff', fontSize: 15, lineHeight: 24 },
    missionHighlight: { color: '#fff', fontSize: 20, lineHeight: 30, fontWeight: 'bold', textAlign: 'center', marginTop: 10, padding: 10, backgroundColor: 'rgba(255, 215, 0, 0.1)', borderRadius: 10, overflow: 'hidden' },

    completedContainer: { alignItems: 'center', paddingVertical: 50 },
    completedText: { color: COLORS.gold, fontSize: 32, fontWeight: 'bold', marginBottom: 20 },
    completedSubText: { color: '#fff', fontSize: 18, textAlign: 'center', lineHeight: 28 },

    // New Styles matching HomeScreen
    missionContainer: { width: '100%', marginBottom: 30 },
    missionCard: { padding: 30, alignItems: 'center' },
    missionTitle: { color: COLORS.gold, fontSize: 20, fontWeight: 'bold', marginBottom: 20 },

    analysisCard: { padding: 25, alignItems: 'center', marginBottom: 20, backgroundColor: 'rgba(255, 215, 0, 0.05)', borderColor: 'rgba(255, 215, 0, 0.3)' },
    analysisTitle: { color: COLORS.gold, fontSize: 24, fontWeight: 'bold', marginBottom: 20 },
    analysisText: { color: '#fff', fontSize: 16, lineHeight: 26, textAlign: 'center' },

    // History Styles
    historyButton: { padding: 10 },
    historyButtonText: { fontSize: 24 },
    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.8)', justifyContent: 'center', alignItems: 'center', padding: 20 },
    historyModalContent: { width: '100%', maxHeight: '80%', padding: 20 },
    historyHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
    historyTitle: { color: COLORS.gold, fontSize: 20, fontWeight: 'bold' },
    closeButton: { color: '#fff', fontSize: 16 },
    historyList: { paddingBottom: 20 },
    emptyHistoryText: { color: '#aaa', textAlign: 'center', marginTop: 50 },
    historyItem: { marginBottom: 20, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.1)', paddingBottom: 20 },
    historyDay: { color: COLORS.gold, fontSize: 16, fontWeight: 'bold', marginBottom: 5 },
    historyMission: { color: '#fff', fontSize: 14, marginBottom: 5, fontStyle: 'italic' },
    historyReflection: { color: '#ddd', fontSize: 15, marginBottom: 10, lineHeight: 22 },
    historyAnalysis: { color: '#aaa', fontSize: 13, lineHeight: 20 },
});

export default CouplesMissionScreen;
