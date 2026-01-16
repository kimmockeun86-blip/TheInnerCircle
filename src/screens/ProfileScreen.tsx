// ID: E-01
import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Switch, Alert, ScrollView, SafeAreaView, StatusBar, TextInput, Modal, TouchableOpacity, Image, Keyboard, TouchableWithoutFeedback } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { SettingsScreenNavigationProp } from '../types/navigation';
import { COLORS, FONTS, SPACING, LAYOUT } from '../theme/theme';
import GlassCard from '../components/GlassCard';
import HolyButton from '../components/HolyButton';
import logger from '../utils/logger';

interface SettingsScreenProps {
    navigation: SettingsScreenNavigationProp;
}

interface UserData {
    name: string;
    dayCount: string;
    deficit: string;
    gender?: string;
    job?: string;
    age?: string;
    location?: string;
    photo?: string;
    idealType?: string;
    isCurrentUser?: boolean;
}

const SettingsScreen: React.FC<SettingsScreenProps> = ({ navigation }) => {
    logger.log('⚙️ SettingsScreen Component Rendered');
    const [notificationsEnabled, setNotificationsEnabled] = useState(true);
    const [soundEnabled, setSoundEnabled] = useState(true);
    const [customMission, setCustomMission] = useState('');
    const [currentUser, setCurrentUser] = useState<UserData | null>(null);
    const [userListVisible, setUserListVisible] = useState(false);
    const [selectedUser, setSelectedUser] = useState<UserData | null>(null);
    const [targetMission, setTargetMission] = useState('');
    const [adminActionModalVisible, setAdminActionModalVisible] = useState(false);
    const [resetModalVisible, setResetModalVisible] = useState(false);

    // Photo Zoom State
    const [photoZoomVisible, setPhotoZoomVisible] = useState(false);
    const [zoomedPhoto, setZoomedPhoto] = useState<string | null>(null);


    useEffect(() => {
        loadUserData();
    }, []);

    const loadUserData = async () => {
        try {
            const name = await AsyncStorage.getItem('userName');
            const day = await AsyncStorage.getItem('dayCount');
            const deficit = await AsyncStorage.getItem('userDeficit');

            const gender = await AsyncStorage.getItem('userGender');
            const job = await AsyncStorage.getItem('userJob');
            const age = await AsyncStorage.getItem('userAge');
            const location = await AsyncStorage.getItem('userLocation');
            const photo = await AsyncStorage.getItem('userPhoto');
            const idealType = await AsyncStorage.getItem('userIdealType');

            setCurrentUser({
                name: name || '',
                dayCount: day || '1',
                deficit: deficit || '미설정',
                gender: gender || '알 수 없음',
                job: job || '알 수 없음',
                age: age || '알 수 없음',
                location: location || '알 수 없음',
                photo: photo || undefined,
                idealType: idealType || '미입력'
            });
        } catch (e) {
            console.error('Failed to load user data', e);
        }
    };

    const handleReset = () => {
        setResetModalVisible(true);
    };

    const handleSetCustomMission = async () => {
        if (!customMission.trim()) {
            Alert.alert('알림', '미션 내용을 입력해주세요.');
            return;
        }

        try {
            const dayCount = await AsyncStorage.getItem('dayCount');
            const currentDay = dayCount ? parseInt(dayCount, 10) : 1;

            await AsyncStorage.setItem(`mission_day_${currentDay}`, customMission);
            Alert.alert('성공', `Day ${currentDay}의 미션이 변경되었습니다.\n홈 화면을 새로고침하세요.`);
            setCustomMission('');
        } catch (e) {
            Alert.alert('오류', '미션 저장 실패');
        }
    };

    return (
        <View style={styles.container}>
            <StatusBar barStyle="light-content" backgroundColor={COLORS.background} />
            <SafeAreaView style={styles.safeArea}>
                <View style={styles.header}>
                    <View style={styles.headerLeft}>
                        <HolyButton
                            title="← 뒤로"
                            onPress={() => navigation.goBack()}
                            variant="ghost"
                            style={{ paddingHorizontal: 0 }}
                        />
                    </View>
                    <Text style={styles.headerTitle}>설정</Text>
                    <View style={styles.headerRight} />
                </View>

                <ScrollView
                    contentContainerStyle={styles.content}
                    keyboardDismissMode="on-drag"
                    keyboardShouldPersistTaps="handled"
                >
                    {/* 1. Profile Summary */}
                    <GlassCard style={styles.profileSection}>
                        <View style={styles.profileHeader}>
                            <View style={styles.avatarPlaceholder}>
                                <Text style={styles.avatarText}>{currentUser?.name?.charAt(0) || '?'}</Text>
                            </View>
                            <View style={styles.profileInfo}>
                                <Text style={styles.profileName}>{currentUser?.name}</Text>
                                <Text style={styles.profileDetail}>Day {currentUser?.dayCount} | {currentUser?.deficit}</Text>
                            </View>
                        </View>
                    </GlassCard>

                    {/* 2. General Settings */}
                    <GlassCard style={styles.section}>
                        <Text style={styles.sectionTitle}>일반 설정</Text>
                        <View style={styles.row}>
                            <Text style={styles.label}>일일 미션 알림</Text>
                            <Switch
                                value={notificationsEnabled}
                                onValueChange={setNotificationsEnabled}
                                trackColor={{ false: "#767577", true: COLORS.goldDim }}
                                thumbColor={notificationsEnabled ? COLORS.gold : "#f4f3f4"}
                            />
                        </View>
                        <View style={styles.divider} />
                        <View style={styles.row}>
                            <Text style={styles.label}>배경음 및 효과음</Text>
                            <Switch
                                value={soundEnabled}
                                onValueChange={setSoundEnabled}
                                trackColor={{ false: "#767577", true: COLORS.goldDim }}
                                thumbColor={soundEnabled ? COLORS.gold : "#f4f3f4"}
                            />
                        </View>
                    </GlassCard>

                    {/* 4. Data Management */}
                    <GlassCard style={styles.section}>
                        <Text style={styles.sectionTitle}>데이터 관리</Text>
                        <HolyButton
                            title="모든 데이터 초기화"
                            onPress={handleReset}
                            variant="outline"
                            textStyle={{ color: COLORS.error }}
                            style={{ borderColor: COLORS.error, marginTop: 10 }}
                        />
                        <Text style={styles.warningText}>
                            * 초기화 시 복구할 수 없으며, 온보딩부터 다시 시작합니다.
                        </Text>
                    </GlassCard>

                    {/* Reset Confirmation Modal */}
                    <Modal visible={resetModalVisible} animationType="fade" transparent={true}>
                        <View style={styles.modalOverlay}>
                            <GlassCard style={styles.analysisModalContent}>
                                <Text style={styles.analysisTitle}>데이터 초기화</Text>
                                <Text style={styles.analysisText}>
                                    기존 기록을 모두 삭제하고 앱을 초기화하시겠습니까?
                                </Text>
                                <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 20, width: '100%' }}>
                                    <HolyButton
                                        title="아니오"
                                        onPress={() => setResetModalVisible(false)}
                                        variant="ghost"
                                        style={{ flex: 1, marginRight: 10 }}
                                    />
                                    <HolyButton
                                        title="예"
                                        onPress={async () => {
                                            setResetModalVisible(false);
                                            logger.log('Reset confirmed. Clearing data...');
                                            try {
                                                await AsyncStorage.clear();
                                                logger.log('AsyncStorage cleared. Resetting navigation...');
                                                navigation.reset({
                                                    index: 0,
                                                    routes: [{ name: 'Onboarding' }],
                                                });
                                            } catch (e) {
                                                console.error('Reset failed:', e);
                                                Alert.alert('오류', '초기화 중 문제가 발생했습니다.');
                                            }
                                        }}
                                        style={{ flex: 1, backgroundColor: COLORS.error, borderColor: COLORS.error }}
                                        textStyle={{ color: '#fff' }}
                                    />
                                </View>
                            </GlassCard>
                        </View>
                    </Modal>

                    <View style={styles.footer}>
                        <Text style={styles.version}>ORBIT v1.1.0</Text>
                        <Text style={styles.copyright}>Designed for the Soul</Text>
                    </View>
                </ScrollView>
            </SafeAreaView>
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: COLORS.background },
    safeArea: { flex: 1, paddingTop: LAYOUT.safeAreaTop },
    header: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', paddingHorizontal: 20, marginBottom: 20, position: 'relative', height: 50 },
    headerTitle: { color: COLORS.gold, fontSize: 20, fontWeight: 'bold', textAlign: 'center' },
    headerLeft: { position: 'absolute', left: 20, top: 0, bottom: 0, justifyContent: 'center' },
    headerRight: { position: 'absolute', right: 20, top: 0, bottom: 0, justifyContent: 'center', width: 40 },

    content: { paddingHorizontal: 20, paddingBottom: 50 },
    section: { marginBottom: 25 },
    sectionTitle: { color: '#888', fontSize: 13, marginBottom: 15, textTransform: 'uppercase', letterSpacing: 1, fontWeight: '600' },

    profileSection: { marginBottom: 25, padding: 20 },
    profileHeader: { flexDirection: 'row', alignItems: 'center' },
    avatarPlaceholder: { width: 60, height: 60, borderRadius: 30, backgroundColor: 'rgba(255, 215, 0, 0.1)', justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: COLORS.gold },
    avatarText: { color: COLORS.gold, fontSize: 24, fontWeight: 'bold' },
    profileInfo: { marginLeft: 20 },
    profileName: { color: '#fff', fontSize: 22, fontWeight: 'bold', marginBottom: 5 },
    profileDetail: { color: '#aaa', fontSize: 14 },

    row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 12 },
    label: { color: '#fff', fontSize: 16 },
    divider: { height: 1, backgroundColor: 'rgba(255, 255, 255, 0.1)', width: '100%', marginVertical: 5 },

    menuItem: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 15 },
    menuText: { color: '#fff', fontSize: 16 },
    menuArrow: { color: '#666', fontSize: 20 },

    warningText: { color: '#666', fontSize: 12, marginTop: 10, fontStyle: 'italic', textAlign: 'center' },

    adminLabel: { color: '#ccc', fontSize: 14, marginBottom: 8 },
    adminRow: { flexDirection: 'row', alignItems: 'center' },
    adminInput: { flex: 1, backgroundColor: 'rgba(0,0,0,0.3)', borderRadius: 8, padding: 12, color: '#fff', borderWidth: 1, borderColor: '#333' },

    footer: { marginTop: 20, alignItems: 'center' },
    version: { color: '#555', fontSize: 12, marginBottom: 5 },
    copyright: { color: '#444', fontSize: 12, fontStyle: 'italic' },

    modalContainer: { flex: 1, backgroundColor: 'rgba(0,0,0,0.8)', justifyContent: 'center', padding: 20 },
    modalContent: { backgroundColor: '#1a1a1a', borderRadius: 20, padding: 20, borderWidth: 1, borderColor: COLORS.gold },
    modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
    modalTitle: { color: COLORS.gold, fontSize: 20, fontWeight: 'bold' },
    closeButton: { color: '#fff', fontSize: 24 },
    userItem: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 15, borderBottomWidth: 1, borderBottomColor: '#333' },
    selectedUserItem: { backgroundColor: 'rgba(255, 215, 0, 0.1)', borderColor: COLORS.gold, borderWidth: 1, borderRadius: 10 },
    userName: { color: '#fff', fontSize: 18, fontWeight: '600' },
    userDetail: { color: '#888', fontSize: 14, marginTop: 4 },
    userArrow: { color: COLORS.gold, fontSize: 20 },
    missionAssignmentSection: { marginTop: 20, paddingTop: 20, borderTopWidth: 1, borderTopColor: '#333' },
    assignmentTitle: { color: '#fff', fontSize: 16, marginBottom: 10, fontWeight: 'bold' },

    // Added missing styles for Reset Modal
    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.8)', justifyContent: 'center', alignItems: 'center', padding: 20 },
    analysisModalContent: { width: '90%', padding: 30, alignItems: 'center' },
    analysisTitle: { color: COLORS.gold, fontSize: 24, fontWeight: 'bold', marginBottom: 20 },
    analysisText: { color: '#fff', fontSize: 16, lineHeight: 26, textAlign: 'center' },
});

export default SettingsScreen;
