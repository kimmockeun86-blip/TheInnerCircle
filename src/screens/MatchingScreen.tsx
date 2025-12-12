// MatchingScreen.tsx - Letter Exchange Matching System
import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    TextInput,
    Modal,
    Image,
    Alert,
    ActivityIndicator,
    SafeAreaView
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LinearGradient } from 'expo-linear-gradient';
import { api } from '../services/api';
import { COLORS } from '../theme/theme';
import GlassCard from '../components/GlassCard';
import HolyButton from '../components/HolyButton';

interface Candidate {
    id: string;
    name: string;
    age: number;
    location: string;
    mbti: string;
    deficit: string;
    photo: string;
    bio: string;
}

interface Letter {
    id: string;
    fromUserId: string;
    fromUserName: string;
    content: string;
    createdAt: string;
}

interface MatchingScreenProps {
    navigation: any;
}

const MatchingScreen: React.FC<MatchingScreenProps> = ({ navigation }) => {
    const [candidates, setCandidates] = useState<Candidate[]>([]);
    const [selectedCandidate, setSelectedCandidate] = useState<Candidate | null>(null);
    const [letterModalVisible, setLetterModalVisible] = useState(false);
    const [letterContent, setLetterContent] = useState('');
    const [inboxLetters, setInboxLetters] = useState<Letter[]>([]);
    const [selectedLetter, setSelectedLetter] = useState<Letter | null>(null);
    const [letterDetailVisible, setLetterDetailVisible] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [userId, setUserId] = useState('');
    const [userName, setUserName] = useState('');
    const [activeTab, setActiveTab] = useState<'candidates' | 'inbox'>('candidates');

    useEffect(() => {
        loadUserData();
    }, []);

    const loadUserData = async () => {
        try {
            const storedName = await AsyncStorage.getItem('userName') || 'User';
            const storedLocation = await AsyncStorage.getItem('userLocation') || 'Seoul';
            const storedGender = await AsyncStorage.getItem('userGender') || 'male';
            const storedMbti = await AsyncStorage.getItem('userMBTI') || '';
            const storedDeficit = await AsyncStorage.getItem('userDeficit') || '';

            setUserName(storedName);
            setUserId(`user_${storedName}`);

            // Get matching candidates
            const result = await api.getMatchingCandidates({
                userId: `user_${storedName}`,
                userLocation: storedLocation,
                userGender: storedGender,
                userMbti: storedMbti,
                userDeficit: storedDeficit
            });

            if (result.success) {
                setCandidates(result.candidates);
            }

            // Check inbox
            const inbox = await api.getLetterInbox(`user_${storedName}`);
            if (inbox.success) {
                setInboxLetters(inbox.letters);
            }

            setIsLoading(false);
        } catch (error) {
            console.error('Error loading matching data:', error);
            setIsLoading(false);
        }
    };

    const handleSendLetter = async () => {
        if (!selectedCandidate || letterContent.trim().length < 10) {
            Alert.alert('알림', '편지를 10자 이상 작성해주세요.');
            return;
        }

        const result = await api.sendLetter({
            fromUserId: userId,
            fromUserName: userName,
            toUserId: selectedCandidate.id,
            content: letterContent
        });

        if (result.success) {
            Alert.alert('성공', result.message);
            setLetterModalVisible(false);
            setLetterContent('');
            setSelectedCandidate(null);
        } else {
            Alert.alert('알림', result.message);
        }
    };

    const handleAcceptMeeting = async () => {
        if (!selectedLetter) return;

        const result = await api.acceptMeeting({
            userId,
            partnerId: selectedLetter.fromUserId,
            partnerName: selectedLetter.fromUserName
        });

        if (result.success && result.matched) {
            Alert.alert('🎉 축하합니다!', result.message, [
                {
                    text: '커플 미션 시작',
                    onPress: () => {
                        // Save match info and navigate to couple mission
                        AsyncStorage.setItem('matchedPartner', JSON.stringify(result.partnerInfo));
                        AsyncStorage.setItem('matchResult', 'success');
                        navigation.replace('CouplesMission');
                    }
                }
            ]);
        }

        setLetterDetailVisible(false);
    };

    const renderCandidateCard = (candidate: Candidate) => (
        <TouchableOpacity
            key={candidate.id}
            onPress={() => {
                setSelectedCandidate(candidate);
                setLetterModalVisible(true);
            }}
        >
            <GlassCard style={styles.candidateCard}>
                <Image source={{ uri: candidate.photo }} style={styles.candidatePhoto} />
                <View style={styles.candidateInfo}>
                    <Text style={styles.candidateName}>{candidate.name}, {candidate.age}</Text>
                    <Text style={styles.candidateDetail}>{candidate.location} · {candidate.mbti}</Text>
                    <Text style={styles.candidateBio}>{candidate.bio}</Text>
                    <View style={styles.deficitBadge}>
                        <Text style={styles.deficitText}>💫 {candidate.deficit}</Text>
                    </View>
                </View>
            </GlassCard>
        </TouchableOpacity>
    );

    const renderLetterCard = (letter: Letter) => (
        <TouchableOpacity
            key={letter.id}
            onPress={() => {
                setSelectedLetter(letter);
                setLetterDetailVisible(true);
            }}
        >
            <GlassCard style={styles.letterCard}>
                <Text style={styles.letterFrom}>💌 {letter.fromUserName}님으로부터</Text>
                <Text style={styles.letterPreview} numberOfLines={2}>
                    {letter.content}
                </Text>
                <Text style={styles.letterDate}>
                    {new Date(letter.createdAt).toLocaleDateString()}
                </Text>
            </GlassCard>
        </TouchableOpacity>
    );

    if (isLoading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={COLORS.gold} />
                <Text style={styles.loadingText}>매칭 정보를 불러오는 중...</Text>
            </View>
        );
    }

    return (
        <LinearGradient colors={['#1A0B2E', '#3D0052', '#000020']} style={styles.container}>
            <SafeAreaView style={styles.safeArea}>
                {/* Header with Back Button */}
                <View style={styles.header}>
                    <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                        <Text style={styles.backButtonText}>← 돌아가기</Text>
                    </TouchableOpacity>
                </View>

                <Text style={styles.title}>✨ 인연 찾기</Text>
                <Text style={styles.subtitle}>편지를 통해 마음을 전해보세요</Text>


                {/* Tab Buttons */}
                <View style={styles.tabContainer}>
                    <TouchableOpacity
                        style={[styles.tab, activeTab === 'candidates' && styles.activeTab]}
                        onPress={() => setActiveTab('candidates')}
                    >
                        <Text style={[styles.tabText, activeTab === 'candidates' && styles.activeTabText]}>
                            후보 ({candidates.length})
                        </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={[styles.tab, activeTab === 'inbox' && styles.activeTab]}
                        onPress={() => setActiveTab('inbox')}
                    >
                        <Text style={[styles.tabText, activeTab === 'inbox' && styles.activeTabText]}>
                            편지함 ({inboxLetters.length})
                        </Text>
                    </TouchableOpacity>
                </View>

                <ScrollView style={styles.content}>
                    {activeTab === 'candidates' ? (
                        candidates.length > 0 ? (
                            candidates.map(renderCandidateCard)
                        ) : (
                            <Text style={styles.emptyText}>아직 매칭 가능한 후보가 없습니다.</Text>
                        )
                    ) : (
                        inboxLetters.length > 0 ? (
                            inboxLetters.map(renderLetterCard)
                        ) : (
                            <Text style={styles.emptyText}>받은 편지가 없습니다.</Text>
                        )
                    )}
                </ScrollView>

                {/* Letter Writing Modal */}
                <Modal visible={letterModalVisible} animationType="slide" transparent>
                    <View style={styles.modalOverlay}>
                        <View style={styles.modalContent}>
                            <Text style={styles.modalTitle}>
                                💌 {selectedCandidate?.name}님에게 편지 쓰기
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
                            <Text style={styles.charCount}>{letterContent.length}/500</Text>
                            <View style={styles.modalButtons}>
                                <HolyButton
                                    title="취소"
                                    variant="outline"
                                    onPress={() => {
                                        setLetterModalVisible(false);
                                        setLetterContent('');
                                    }}
                                    style={{ flex: 1, marginRight: 10 }}
                                />
                                <HolyButton
                                    title="보내기"
                                    onPress={handleSendLetter}
                                    style={{ flex: 1 }}
                                />
                            </View>
                        </View>
                    </View>
                </Modal>

                {/* Letter Detail Modal */}
                <Modal visible={letterDetailVisible} animationType="slide" transparent>
                    <View style={styles.modalOverlay}>
                        <View style={styles.modalContent}>
                            <Text style={styles.modalTitle}>
                                💌 {selectedLetter?.fromUserName}님의 편지
                            </Text>
                            <ScrollView style={styles.letterDetailContent}>
                                <Text style={styles.letterFullContent}>
                                    {selectedLetter?.content}
                                </Text>
                            </ScrollView>
                            <View style={styles.modalButtons}>
                                <HolyButton
                                    title="닫기"
                                    variant="outline"
                                    onPress={() => setLetterDetailVisible(false)}
                                    style={{ flex: 1, marginRight: 10 }}
                                />
                                <HolyButton
                                    title="만남 수락"
                                    onPress={handleAcceptMeeting}
                                    style={{ flex: 1 }}
                                />
                            </View>
                        </View>
                    </View>
                </Modal>
            </SafeAreaView>
        </LinearGradient>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1 },
    safeArea: { flex: 1, padding: 20 },
    loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#000020' },
    loadingText: { color: '#fff', marginTop: 10 },
    title: { color: '#fff', fontSize: 24, fontWeight: 'bold', textAlign: 'center', marginTop: 20 },
    subtitle: { color: '#aaa', fontSize: 14, textAlign: 'center', marginBottom: 20 },
    tabContainer: { flexDirection: 'row', marginBottom: 15 },
    tab: { flex: 1, paddingVertical: 12, alignItems: 'center', borderBottomWidth: 2, borderBottomColor: 'transparent' },
    activeTab: { borderBottomColor: COLORS.gold },
    tabText: { color: '#888', fontSize: 16 },
    activeTabText: { color: COLORS.gold, fontWeight: 'bold' },
    content: { flex: 1 },
    emptyText: { color: '#888', textAlign: 'center', marginTop: 50 },
    candidateCard: { flexDirection: 'row', padding: 15, marginBottom: 15 },
    candidatePhoto: { width: 80, height: 80, borderRadius: 40, marginRight: 15 },
    candidateInfo: { flex: 1 },
    candidateName: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
    candidateDetail: { color: '#aaa', fontSize: 13, marginTop: 3 },
    candidateBio: { color: '#ccc', fontSize: 14, marginTop: 8 },
    deficitBadge: { backgroundColor: 'rgba(255,255,255,0.1)', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 15, marginTop: 8, alignSelf: 'flex-start' },
    deficitText: { color: COLORS.gold, fontSize: 12 },
    letterCard: { padding: 15, marginBottom: 15 },
    letterFrom: { color: COLORS.gold, fontSize: 16, fontWeight: 'bold' },
    letterPreview: { color: '#ccc', fontSize: 14, marginTop: 8 },
    letterDate: { color: '#666', fontSize: 12, marginTop: 8, textAlign: 'right' },
    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.8)', justifyContent: 'center', padding: 20 },
    modalContent: { backgroundColor: '#1A0B2E', borderRadius: 20, padding: 25, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },
    modalTitle: { color: '#fff', fontSize: 20, fontWeight: 'bold', textAlign: 'center', marginBottom: 20 },
    letterInput: { backgroundColor: 'rgba(255,255,255,0.08)', borderRadius: 12, padding: 15, color: '#fff', height: 200, textAlignVertical: 'top', fontSize: 15 },
    charCount: { color: '#666', textAlign: 'right', marginTop: 5 },
    modalButtons: { flexDirection: 'row', marginTop: 20 },
    letterDetailContent: { maxHeight: 250, marginBottom: 15 },
    letterFullContent: { color: '#fff', fontSize: 16, lineHeight: 24 },

    // Header & Back Button
    header: { paddingBottom: 10, alignItems: 'flex-start' },
    backButton: { paddingVertical: 5 },
    backButtonText: { color: COLORS.gold, fontSize: 14 }
});


export default MatchingScreen;
