import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, Switch, SafeAreaView, Image, Alert, Modal, TouchableOpacity, TextInput, StatusBar } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { StackNavigationProp } from '@react-navigation/stack';
import { COLORS, FONTS, SPACING, LAYOUT } from '../theme/theme';
import GlassCard from '../components/GlassCard';
import HolyButton from '../components/HolyButton';

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
    console.log('⚙️ SettingsScreen Component Rendered');
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

    const mockUsers: UserData[] = [
        {
            name: currentUser?.name || '구도자',
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
                name: name || '구도자',
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

                    {/* 5. Admin Zone */}
                    <GlassCard style={[styles.section, { borderColor: 'rgba(255, 215, 0, 0.1)' }]}>
                        <Text style={[styles.sectionTitle, { color: COLORS.gold }]}>관리자 구역 (Admin Zone)</Text>

                        <HolyButton
                            title="휴식 모드 강제 해제"
                            onPress={async () => {
                                await AsyncStorage.removeItem('lastCompletedDate');
                                Alert.alert('알림', '휴식 모드가 해제되었습니다. 홈 화면을 새로고침하세요.');
                            }}
                            variant="ghost"
                            style={{ marginBottom: 15 }}
                        />

                        <Text style={styles.adminLabel}>커스텀 미션 부여 (현재 Day)</Text>
                        <View style={styles.adminRow}>
                            <TextInput
                                style={styles.adminInput}
                                placeholder="미션 내용 입력"
                                placeholderTextColor="#666"
                                value={customMission}
                                onChangeText={setCustomMission}
                            />
                            <HolyButton
                                title="부여"
                                onPress={handleSetCustomMission}
                                variant="outline"
                                style={{ width: 80, marginLeft: 10 }}
                            />
                        </View>

                        <HolyButton
                            title="사용자 리스트 (User List)"
                            onPress={() => {
                                loadUserData();
                                setUserListVisible(true);
                            }}
                            variant="secondary"
                            style={{ marginTop: 15 }}
                        />
                    </GlassCard>

                    {/* User List Modal */}
                    <Modal
                        animationType="slide"
                        transparent={true}
                        visible={userListVisible}
                        onRequestClose={() => setUserListVisible(false)}
                    >
                        <View style={styles.modalContainer}>
                            <View style={styles.modalContent}>
                                <Text style={styles.modalTitle}>사용자 리스트</Text>
                                <ScrollView style={{ maxHeight: 400 }}>
                                    {mockUsers.filter(user => user.gender === '여성').map((user, index) => (
                                        <TouchableOpacity
                                            key={index}
                                            style={[
                                                styles.userItem,
                                                selectedUser?.name === user.name && styles.selectedUserItem
                                            ]}
                                            onPress={() => {
                                                setSelectedUser(user);
                                                setAdminActionModalVisible(true);
                                            }}
                                        >
                                            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                                                {/* Photo Placeholder - Click to Zoom */}
                                                <TouchableOpacity
                                                    onPress={() => {
                                                        if (user.photo) {
                                                            setZoomedPhoto(user.photo);
                                                            setPhotoZoomVisible(true);
                                                        }
                                                    }}
                                                    style={{ width: 50, height: 50, borderRadius: 25, backgroundColor: '#333', marginRight: 15, justifyContent: 'center', alignItems: 'center', overflow: 'hidden' }}
                                                >
                                                    {user.photo ? (
                                                        <Image source={{ uri: user.photo }} style={{ width: 50, height: 50 }} />
                                                    ) : (
                                                        <Text style={{ color: '#fff', fontSize: 20 }}>{user.name[0]}</Text>
                                                    )}
                                                </TouchableOpacity>

                                                <View style={{ flex: 1 }}>
                                                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                                                        <Text style={styles.userName}>{user.name} {user.isCurrentUser && "(나)"}</Text>
                                                        <View style={{ backgroundColor: COLORS.gold + '30', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 10 }}>
                                                            <Text style={{ color: COLORS.gold, fontSize: 12, fontWeight: 'bold' }}>Day {user.dayCount}</Text>
                                                        </View>
                                                    </View>

                                                    <Text style={{ color: '#aaa', fontSize: 12, marginBottom: 2 }}>
                                                        {user.gender} · {user.age}세 · {user.location} · {user.job}
                                                    </Text>

                                                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                                                        <Text style={{ color: '#888', fontSize: 12 }}>결핍: </Text>
                                                        <Text style={{ color: '#fff', fontSize: 12 }}>{user.deficit}</Text>
                                                    </View>

                                                    {/* Ideal Type Display */}
                                                    <View style={{ marginTop: 4 }}>
                                                        <Text style={{ color: COLORS.gold, fontSize: 11 }}>♥ 이상형: {user.idealType || '미입력'}</Text>
                                                    </View>
                                                </View>
                                            </View>
                                        </TouchableOpacity>
                                    ))}
                                </ScrollView>
                                <HolyButton
                                    title="닫기"
                                    onPress={() => setUserListVisible(false)}
                                    variant="outline"
                                    style={{ marginTop: 20 }}
                                />
                            </View>
                        </View>
                    </Modal>

                    {/* Admin Action Modal */}
                    <Modal
                        animationType="fade"
                        transparent={true}
                        visible={adminActionModalVisible}
                        onRequestClose={() => setAdminActionModalVisible(false)}
                    >
                        <View style={styles.modalContainer}>
                            <View style={styles.modalContent}>
                                <Text style={styles.modalTitle}>{selectedUser?.name} 관리</Text>

                                <View style={{ width: '100%', marginBottom: 20 }}>
                                    <Text style={{ color: '#aaa', marginBottom: 10, textAlign: 'center' }}>
                                        {selectedUser?.gender} / {selectedUser?.age}세 / {selectedUser?.job} / {selectedUser?.location}
                                    </Text>
                                    <Text style={{ color: COLORS.gold, textAlign: 'center', marginBottom: 5 }}>
                                        현재 결핍: {selectedUser?.deficit}
                                    </Text>
                                    <Text style={{ color: '#fff', textAlign: 'center', marginBottom: 20, fontSize: 12 }}>
                                        이상형: {selectedUser?.idealType}
                                    </Text>

                                    <Text style={styles.label}>미션 강제 부여</Text>
                                    <TextInput
                                        style={styles.adminInput}
                                        placeholder="미션 내용을 입력하세요"
                                        placeholderTextColor="#666"
                                        value={targetMission}
                                        onChangeText={setTargetMission}
                                    />
                                </View>

                                <HolyButton
                                    title="미션 전송"
                                    onPress={() => {
                                        handleAssignMissionToUser();
                                        setAdminActionModalVisible(false);
                                    }}
                                    style={{ marginBottom: 10 }}
                                />

                                <HolyButton
                                    title="취소"
                                    onPress={() => setAdminActionModalVisible(false)}
                                    variant="outline"
                                />
                            </View>
                        </View>
                    </Modal>

                    {/* Photo Zoom Modal */}
                    <Modal
                        animationType="fade"
                        transparent={true}
                        visible={photoZoomVisible}
                        onRequestClose={() => setPhotoZoomVisible(false)}
                    >
                        <View style={{ flex: 1, backgroundColor: 'black', justifyContent: 'center', alignItems: 'center' }}>
                            <TouchableOpacity
                                style={{ position: 'absolute', top: 50, right: 30, zIndex: 1 }}
                                onPress={() => setPhotoZoomVisible(false)}
                            >
                                <Text style={{ color: 'white', fontSize: 30 }}>✕</Text>
                            </TouchableOpacity>

                            {zoomedPhoto && (
                                <Image
                                    source={{ uri: zoomedPhoto }}
                                    style={{ width: '100%', height: '80%', resizeMode: 'contain' }}
                                />
                            )}
                        </View>
                    </Modal>

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
