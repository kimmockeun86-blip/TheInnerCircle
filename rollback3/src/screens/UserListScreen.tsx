import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, TextInput, SafeAreaView, Alert, Image, Modal } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation } from '@react-navigation/native';

// Mock Data for demonstration
// Mock Data with "Nano Banana" style photos and detailed info
const MOCK_USERS = [
    {
        id: '1',
        name: '서지수',
        age: 28,
        day: 5,
        status: 'coupled',
        gender: '여성',
        location: '서울 강남구',
        image: require('../../assets/user1.png'),
        recentJournalImage: 'https://picsum.photos/id/1015/200/200', // Placeholder for journal photo
        currentMission: '내면의 아이와 대화하기'
    },
    {
        id: '2',
        name: '김민준',
        age: 32,
        day: 8,
        status: 'seeking',
        gender: '남성',
        location: '경기 성남시',
        image: require('../../assets/user2.png'),
        recentJournalImage: 'https://picsum.photos/id/1016/200/200',
        currentMission: '두려움의 근원 찾기'
    },
    {
        id: '3',
        name: '이예나',
        age: 25,
        day: 3,
        status: 'solo_focus',
        gender: '여성',
        location: '서울 마포구',
        image: require('../../assets/user3.png'),
        recentJournalImage: null,
        currentMission: '감사의 일기 쓰기'
    },
    {
        id: '4',
        name: '박준호',
        age: 35,
        day: 10,
        status: 'ready',
        gender: '남성',
        location: '서울 서초구',
        image: require('../../assets/user4.png'),
        recentJournalImage: 'https://picsum.photos/id/1018/200/200',
        currentMission: '내면의 문 열기'
    },
    {
        id: '5',
        name: '최수민',
        age: 29,
        day: 1,
        status: 'onboarding',
        gender: '여성',
        location: '경기 수원시',
        image: require('../../assets/user5.png'),
        recentJournalImage: null,
        currentMission: '자신의 결핍 마주하기'
    },
];

const UserListScreen = () => {
    const navigation = useNavigation();
    const [searchQuery, setSearchQuery] = useState('');
    const [users, setUsers] = useState(MOCK_USERS);
    const [filteredUsers, setFilteredUsers] = useState(MOCK_USERS);
    const [selectedUser, setSelectedUser] = useState<any>(null);
    const [modalVisible, setModalVisible] = useState(false);

    useEffect(() => {
        if (searchQuery) {
            const lower = searchQuery.toLowerCase();
            const filtered = users.filter(u =>
                u.name.toLowerCase().includes(lower) ||
                u.location.toLowerCase().includes(lower) ||
                u.status.toLowerCase().includes(lower)
            );
            setFilteredUsers(filtered);
        } else {
            setFilteredUsers(users);
        }
    }, [searchQuery, users]);

    const handleUserClick = (user: any) => {
        setSelectedUser(user);
        setModalVisible(true);
    };

    const renderItem = ({ item }: { item: any }) => (
        <TouchableOpacity style={styles.userCard} onPress={() => handleUserClick(item)}>
            <View style={styles.avatarContainer}>
                <Image source={item.image} style={styles.avatarImage} />
            </View>
            <View style={styles.userInfo}>
                <View style={styles.nameRow}>
                    <Text style={styles.userName}>{item.name}</Text>
                    <Text style={styles.userAge}>({item.age}세)</Text>
                    <View style={styles.dayBadge}>
                        <Text style={styles.dayText}>Day {item.day}</Text>
                    </View>
                </View>
                <Text style={styles.userLocation}>{item.location}</Text>
                <Text style={styles.missionText} numberOfLines={1}>미션: {item.currentMission}</Text>
            </View>
            {item.recentJournalImage && (
                <View style={styles.journalPreview}>
                    <Image source={{ uri: item.recentJournalImage }} style={styles.journalImage} />
                </View>
            )}
            <Text style={styles.arrow}>›</Text>
        </TouchableOpacity>
    );

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                    <Text style={styles.backButtonText}>← 뒤로</Text>
                </TouchableOpacity>
                <Text style={styles.title}>관리자: 사용자 목록</Text>
            </View>

            <View style={styles.searchContainer}>
                <TextInput
                    style={styles.searchInput}
                    placeholder="이름, 지역, 상태 검색..."
                    placeholderTextColor="#666"
                    value={searchQuery}
                    onChangeText={setSearchQuery}
                />
            </View>

            <FlatList
                data={filteredUsers}
                renderItem={renderItem}
                keyExtractor={item => item.id}
                contentContainerStyle={styles.listContent}
                ListEmptyComponent={
                    <Text style={styles.emptyText}>검색 결과가 없습니다.</Text>
                }
            />

            {/* User Detail Modal */}
            {selectedUser && (
                <Modal visible={modalVisible} transparent={true} animationType="fade">
                    <View style={styles.modalOverlay}>
                        <View style={styles.modalContent}>
                            <TouchableOpacity style={styles.closeModalButton} onPress={() => setModalVisible(false)}>
                                <Text style={styles.closeModalText}>✕</Text>
                            </TouchableOpacity>

                            <View style={styles.fullImageContainer}>
                                <Image source={selectedUser.image} style={styles.fullImage} resizeMode="cover" />
                            </View>

                            <Text style={styles.modalName}>{selectedUser.name} <Text style={styles.modalAge}>({selectedUser.age}세)</Text></Text>
                            <Text style={styles.modalInfo}>{selectedUser.gender} • {selectedUser.location}</Text>

                            <View style={styles.divider} />

                            <Text style={styles.sectionTitle}>현재 상태</Text>
                            <Text style={styles.modalStatus}>{selectedUser.status}</Text>
                            <Text style={styles.modalDay}>진행도: Day {selectedUser.day}</Text>

                            <Text style={styles.sectionTitle}>현재 미션</Text>
                            <Text style={styles.modalMission}>{selectedUser.currentMission}</Text>

                            {selectedUser.recentJournalImage && (
                                <>
                                    <Text style={styles.sectionTitle}>최근 수행 사진</Text>
                                    <Image source={{ uri: selectedUser.recentJournalImage }} style={styles.modalJournalImage} />
                                </>
                            )}

                            <TouchableOpacity
                                style={styles.actionButton}
                                onPress={() => Alert.alert('관리', '추후 상세 관리 기능이 추가될 예정입니다.')}
                            >
                                <Text style={styles.actionButtonText}>관리자 액션</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </Modal>
            )}
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#000' },
    header: { flexDirection: 'row', alignItems: 'center', padding: 20, paddingTop: 50, borderBottomWidth: 1, borderBottomColor: '#333' },
    backButton: { padding: 10, marginRight: 10 },
    backButtonText: { color: '#fff', fontSize: 16 },
    title: { color: '#FFD700', fontSize: 20, fontWeight: 'bold' },

    searchContainer: { padding: 15 },
    searchInput: { backgroundColor: '#1a1a1a', borderRadius: 10, padding: 12, color: '#fff', fontSize: 16, borderWidth: 1, borderColor: '#333' },

    listContent: { padding: 15 },
    userCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#111', padding: 15, borderRadius: 12, marginBottom: 10, borderWidth: 1, borderColor: '#222' },
    avatarContainer: { width: 50, height: 50, borderRadius: 25, overflow: 'hidden', marginRight: 15, borderWidth: 1, borderColor: '#FFD700' },
    avatarImage: { width: '100%', height: '100%' },
    userInfo: { flex: 1 },
    nameRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 4 },
    userName: { color: '#fff', fontSize: 16, fontWeight: 'bold', marginRight: 5 },
    userAge: { color: '#aaa', fontSize: 14, fontWeight: 'normal', marginRight: 8 },
    dayBadge: { backgroundColor: '#333', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 },
    dayText: { color: '#FFD700', fontSize: 10, fontWeight: 'bold' },
    userLocation: { color: '#888', fontSize: 13, marginBottom: 2 },
    missionText: { color: '#aaa', fontSize: 13, fontStyle: 'italic' },

    journalPreview: { width: 40, height: 40, borderRadius: 4, overflow: 'hidden', marginLeft: 10, borderWidth: 1, borderColor: '#444' },
    journalImage: { width: '100%', height: '100%' },

    arrow: { color: '#444', fontSize: 24, fontWeight: 'bold', marginLeft: 10 },
    emptyText: { color: '#666', textAlign: 'center', marginTop: 50, fontSize: 16 },

    // Modal Styles
    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.9)', justifyContent: 'center', alignItems: 'center', padding: 20 },
    modalContent: { width: '100%', maxHeight: '90%', backgroundColor: '#1a1a1a', borderRadius: 20, padding: 20, alignItems: 'center', borderWidth: 1, borderColor: '#FFD700' },
    closeModalButton: { position: 'absolute', top: 15, right: 15, zIndex: 10, padding: 5 },
    closeModalText: { color: '#fff', fontSize: 24, fontWeight: 'bold' },
    fullImageContainer: { width: 120, height: 120, borderRadius: 60, overflow: 'hidden', marginBottom: 15, borderWidth: 3, borderColor: '#FFD700' },
    fullImage: { width: '100%', height: '100%' },
    modalName: { color: '#FFD700', fontSize: 24, fontWeight: 'bold', marginBottom: 5 },
    modalAge: { fontSize: 18, color: '#ccc', fontWeight: 'normal' },
    modalInfo: { color: '#fff', fontSize: 16, marginBottom: 15 },

    divider: { width: '100%', height: 1, backgroundColor: '#333', marginVertical: 15 },
    sectionTitle: { color: '#888', fontSize: 12, marginBottom: 5, alignSelf: 'flex-start', width: '100%' },

    modalStatus: { color: '#fff', fontSize: 16, marginBottom: 5, alignSelf: 'flex-start' },
    modalDay: { color: '#FFD700', fontSize: 16, marginBottom: 15, alignSelf: 'flex-start' },
    modalMission: { color: '#fff', fontSize: 16, marginBottom: 15, fontStyle: 'italic', alignSelf: 'flex-start' },

    modalJournalImage: { width: '100%', height: 200, borderRadius: 10, marginBottom: 20, borderWidth: 1, borderColor: '#444' },

    actionButton: { backgroundColor: '#333', paddingVertical: 12, paddingHorizontal: 30, borderRadius: 25, borderWidth: 1, borderColor: '#666', marginTop: 10 },
    actionButtonText: { color: '#fff', fontSize: 16, fontWeight: '600' }
});

export default UserListScreen;
