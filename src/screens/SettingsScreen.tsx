import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, Switch, SafeAreaView, Image, Alert, Modal, TouchableOpacity, TextInput, StatusBar } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { StackNavigationProp } from '@react-navigation/stack';
import { COLORS, FONTS, SPACING, LAYOUT } from '../theme/theme';
import GlassCard from '../components/GlassCard';
import HolyButton from '../components/HolyButton';
import AdService from '../services/AdService';

type SettingsScreenNavigationProp = StackNavigationProp<any, 'Settings'>;

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
    const [notificationsEnabled, setNotificationsEnabled] = useState(true);
    const [soundEnabled, setSoundEnabled] = useState(true);
    const [customMission, setCustomMission] = useState('');
    const [currentUser, setCurrentUser] = useState<UserData | null>(null);
    const [userListVisible, setUserListVisible] = useState(false);
    const [selectedUser, setSelectedUser] = useState<UserData | null>(null);
    const [targetMission, setTargetMission] = useState('');
    const [adminActionModalVisible, setAdminActionModalVisible] = useState(false);
    const [resetModalVisible, setResetModalVisible] = useState(false);
    const [isAdFree, setIsAdFree] = useState(false);

    // Photo Zoom State
    const [photoZoomVisible, setPhotoZoomVisible] = useState(false);
    const [zoomedPhoto, setZoomedPhoto] = useState<string | null>(null);

    const mockUsers: UserData[] = [
        {
            name: currentUser?.name || '',
            dayCount: currentUser?.dayCount || '1',
            deficit: currentUser?.deficit || '미설정',
            gender: currentUser?.gender || '남성',
            job: currentUser?.job || '개발자',
            age: currentUser?.age || '30',
            location: currentUser?.location || '서울',
            photo: currentUser?.photo,
            idealType: currentUser?.idealType || '지혜롭고 차분한 사람',
            isCurrentUser: true
        },
        {
            name: '김철수',
            dayCount: '3',
            deficit: '외로움',
            gender: '남성',
            job: '회사원',
            age: '28',
            location: '경기',
            photo: 'https://randomuser.me/api/portraits/men/32.jpg',
            idealType: '밝고 긍정적인 에너지를 가진 사람',
            isCurrentUser: false
        },
        {
            name: '이영희',
            dayCount: '7',
            deficit: '불안',
            gender: '여성',
            job: '디자이너',
            age: '26',
            location: '서울',
            photo: 'https://randomuser.me/api/portraits/women/44.jpg',
            idealType: '예술적 감각이 통하는 사람',
            isCurrentUser: false
        },
        {
            name: '박지성',
            dayCount: '10',
            deficit: '공허함',
            gender: '남성',
            job: '운동선수',
            age: '32',
            location: '부산',
            photo: 'https://randomuser.me/api/portraits/men/85.jpg',
            idealType: '함께 성장할 수 있는 사람',
            isCurrentUser: false
        },
        // Mock Female Users for Testing
        { name: '김민지', dayCount: '2', deficit: '외로움', gender: '여성', job: '마케터', age: '27', location: '서울', photo: 'https://randomuser.me/api/portraits/women/10.jpg', idealType: '유머러스한 사람', isCurrentUser: false },
        { name: '이수진', dayCount: '5', deficit: '불안', gender: '여성', job: '간호사', age: '29', location: '경기', photo: 'https://randomuser.me/api/portraits/women/22.jpg', idealType: '따뜻한 사람', isCurrentUser: false },
        { name: '박서연', dayCount: '8', deficit: '자존감', gender: '여성', job: '교사', age: '31', location: '인천', photo: 'https://randomuser.me/api/portraits/women/33.jpg', idealType: '성실한 사람', isCurrentUser: false },
        { name: '최유나', dayCount: '1', deficit: '무기력', gender: '여성', job: '프리랜서', age: '25', location: '서울', photo: 'https://randomuser.me/api/portraits/women/45.jpg', idealType: '꿈이 있는 사람', isCurrentUser: false },
        { name: '정하은', dayCount: '9', deficit: '스트레스', gender: '여성', job: '개발자', age: '28', location: '대전', photo: 'https://randomuser.me/api/portraits/women/56.jpg', idealType: '대화가 잘 통하는 사람', isCurrentUser: false },
        { name: '강지영', dayCount: '4', deficit: '우울', gender: '여성', job: '디자이너', age: '26', location: '부산', photo: 'https://randomuser.me/api/portraits/women/67.jpg', idealType: '감성적인 사람', isCurrentUser: false },
        { name: '윤서아', dayCount: '6', deficit: '고독', gender: '여성', job: '작가', age: '30', location: '제주', photo: 'https://randomuser.me/api/portraits/women/78.jpg', idealType: '자연을 사랑하는 사람', isCurrentUser: false },
        { name: '임수정', dayCount: '3', deficit: '피로', gender: '여성', job: '약사', age: '33', location: '서울', photo: 'https://randomuser.me/api/portraits/women/89.jpg', idealType: '건강한 사람', isCurrentUser: false },
        { name: '한지민', dayCount: '7', deficit: '불면', gender: '여성', job: '승무원', age: '29', location: '경기', photo: 'https://randomuser.me/api/portraits/women/90.jpg', idealType: '배려심 깊은 사람', isCurrentUser: false },
        { name: '오혜진', dayCount: '10', deficit: '불안정', gender: '여성', job: '요가 강사', age: '32', location: '서울', photo: 'https://randomuser.me/api/portraits/women/91.jpg', idealType: '차분한 사람', isCurrentUser: false },
    ];

    const handleAssignMissionToUser = async () => {
        if (!targetMission.trim()) {
            Alert.alert('알림', '미션 내용을 입력해주세요.');
            return;
        }

        if (selectedUser?.isCurrentUser) {
            try {
                const day = parseInt(selectedUser.dayCount, 10);
                await AsyncStorage.setItem(`mission_day_${day}`, targetMission);
                Alert.alert('성공', `${selectedUser.name}님(Day ${day})에게 미션이 부여되었습니다.\n홈 화면을 새로고침하세요.`);
            } catch (e) {
                Alert.alert('오류', '저장 실패');
            }
        } else {
            Alert.alert('성공', `[Mock] ${selectedUser?.name}님에게 미션이 부여되었습니다.\n"${targetMission}"`);
        }
        setTargetMission('');
    };

    useEffect(() => {
        loadUserData();
        // AdService 초기화 및 광고 제거 상태 확인
        AdService.initialize().then(() => {
            setIsAdFree(AdService.isAdFree());
        });
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

                <ScrollView contentContainerStyle={styles.content}>
                    {/* 1. Profile Summary */}
                    <GlassCard style={styles.profileSection}>
                        <View style={styles.profileHeader}>
                            <View style={styles.avatarPlaceholder}>
                                {currentUser?.photo ? (
                                    <Image source={{ uri: currentUser.photo }} style={styles.avatarImage} />
                                ) : (
                                    <Text style={styles.avatarText}>{currentUser?.name?.charAt(0) || '?'}</Text>
                                )}
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
                            <View style={styles.toggleContainer}>
                                <Text style={[styles.toggleLabel, !notificationsEnabled && styles.toggleLabelActive]}>
                                    OFF
                                </Text>
                                <Switch
                                    value={notificationsEnabled}
                                    onValueChange={setNotificationsEnabled}
                                    trackColor={{ false: "#3a3a3a", true: "#4CAF50" }}
                                    thumbColor={notificationsEnabled ? "#FFFFFF" : "#888888"}
                                />
                                <Text style={[styles.toggleLabel, notificationsEnabled && styles.toggleLabelActive]}>
                                    ON
                                </Text>
                            </View>
                        </View>
                        <View style={styles.divider} />
                        <View style={styles.row}>
                            <Text style={styles.label}>배경음 및 효과음</Text>
                            <View style={styles.toggleContainer}>
                                <Text style={[styles.toggleLabel, !soundEnabled && styles.toggleLabelActive]}>
                                    OFF
                                </Text>
                                <Switch
                                    value={soundEnabled}
                                    onValueChange={setSoundEnabled}
                                    trackColor={{ false: "#3a3a3a", true: "#4CAF50" }}
                                    thumbColor={soundEnabled ? "#FFFFFF" : "#888888"}
                                />
                                <Text style={[styles.toggleLabel, soundEnabled && styles.toggleLabelActive]}>
                                    ON
                                </Text>
                            </View>
                        </View>
                    </GlassCard>

                    {/* 4. Data Management */}
                    <GlassCard style={styles.section}>
                        <Text style={styles.sectionTitle}>데이터 관리</Text>
                        <HolyButton
                            title="모든 데이터 초기화"
                            onPress={handleReset}
                            variant="ghost"
                            textStyle={{ color: COLORS.error, textShadowColor: 'transparent', textShadowRadius: 0 }}
                            style={{ borderWidth: 1, borderColor: COLORS.error, marginTop: 10, borderRadius: 10 }}
                        />
                        <Text style={styles.warningText}>
                            * 초기화 시 복구할 수 없으며, 온보딩부터 다시 시작합니다.
                        </Text>
                    </GlassCard>

                    {/* 주간 리포트 */}
                    <GlassCard style={styles.section}>
                        <Text style={styles.sectionTitle}>나의 여정</Text>
                        <HolyButton
                            title="📊 주간 리포트 보기"
                            onPress={() => navigation.navigate('WeeklyReport')}
                            style={{ marginTop: 5 }}
                        />
                        <Text style={styles.warningText}>
                            이번 주 여정을 돌아보고 SNS에 공유해보세요.
                        </Text>
                    </GlassCard>

                    {/* 3. 광고 제거 구매 */}
                    <GlassCard style={styles.section}>
                        <Text style={styles.sectionTitle}>프리미엄</Text>
                        {isAdFree ? (
                            <View style={styles.adFreeContainer}>
                                <Text style={styles.adFreeText}>✨ 광고 없음</Text>
                                <Text style={styles.adFreeSubtext}>프리미엄 사용자입니다</Text>
                            </View>
                        ) : (
                            <>
                                <View style={styles.adPurchaseInfo}>
                                    <Text style={styles.adPurchaseTitle}>광고 제거</Text>
                                    <Text style={styles.adPurchaseDesc}>
                                        광고 없이 깔끔하게 앱을 사용하세요.{'\n'}
                                        한 번 구매로 영구적으로 광고가 제거됩니다.
                                    </Text>
                                </View>
                                <HolyButton
                                    title={`광고 제거 ${AdService.getAdRemovalPrice()}`}
                                    onPress={async () => {
                                        await AdService.purchaseAdRemoval();
                                        setIsAdFree(AdService.isAdFree());
                                    }}
                                    style={{ marginTop: 15 }}
                                />
                                <TouchableOpacity
                                    style={styles.restoreButton}
                                    onPress={async () => {
                                        await AdService.restorePurchases();
                                        setIsAdFree(AdService.isAdFree());
                                    }}
                                >
                                    <Text style={styles.restoreButtonText}>구매 복원</Text>
                                </TouchableOpacity>
                            </>
                        )}
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
                                            console.log('Reset confirmed. Clearing data...');
                                            try {
                                                await AsyncStorage.clear();
                                                console.log('AsyncStorage cleared. Resetting navigation...');
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
    avatarPlaceholder: { width: 60, height: 60, borderRadius: 30, backgroundColor: 'rgba(255, 215, 0, 0.1)', justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: COLORS.gold, overflow: 'hidden' },
    avatarText: { color: COLORS.gold, fontSize: 24, fontWeight: 'bold' },
    avatarImage: { width: 60, height: 60, borderRadius: 30 },
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

    // 광고 제거 관련 스타일
    adFreeContainer: { alignItems: 'center', paddingVertical: 20 },
    adFreeText: { color: COLORS.gold, fontSize: 20, fontWeight: 'bold', marginBottom: 5 },
    adFreeSubtext: { color: '#888', fontSize: 14 },
    adPurchaseInfo: { marginBottom: 10 },
    adPurchaseTitle: { color: '#fff', fontSize: 18, fontWeight: 'bold', marginBottom: 8 },
    adPurchaseDesc: { color: '#aaa', fontSize: 14, lineHeight: 22 },
    restoreButton: { marginTop: 15, alignItems: 'center', paddingVertical: 10 },
    restoreButtonText: { color: '#888', fontSize: 14, textDecorationLine: 'underline' },

    // 토글 관련 스타일
    toggleContainer: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    toggleLabel: { color: '#666', fontSize: 12, fontWeight: '500', minWidth: 28 },
    toggleLabelActive: { color: '#4CAF50', fontWeight: 'bold' },
});

export default SettingsScreen;
