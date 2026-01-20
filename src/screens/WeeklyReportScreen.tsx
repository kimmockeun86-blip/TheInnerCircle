// WeeklyReportScreen.tsx
// 주간 리포트 화면 - AI 장문 코멘트 + SNS 공유

import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    ScrollView,
    ActivityIndicator,
    Share,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { api } from '../services/api';

interface WeeklyReportScreenProps {
    navigation: any;
}

const WeeklyReportScreen: React.FC<WeeklyReportScreenProps> = ({ navigation }) => {
    const [isLoading, setIsLoading] = useState(true);
    const [report, setReport] = useState('');
    const [weekLabel, setWeekLabel] = useState('');
    const [userName, setUserName] = useState('');

    useEffect(() => {
        loadReport();
    }, []);

    const loadReport = async () => {
        try {
            setIsLoading(true);

            // 사용자 정보 가져오기
            const name = await AsyncStorage.getItem('userName') || '사용자';
            const userId = await AsyncStorage.getItem('userId') || `user_${name}`;
            setUserName(name);

            // 최근 7일간 저널 기록 가져오기
            const journals: any[] = [];
            const currentDay = parseInt(await AsyncStorage.getItem('dayCount') || '1');

            for (let i = Math.max(1, currentDay - 6); i <= currentDay; i++) {
                const savedJournal = await AsyncStorage.getItem(`journal_day_${i}`);
                const missionData = await AsyncStorage.getItem(`mission_day_${i}`);

                if (savedJournal || missionData) {
                    let mission = '';
                    try {
                        const parsed = JSON.parse(missionData || '{}');
                        mission = parsed.mission || parsed.text || '';
                    } catch (e) {
                        mission = missionData || '';
                    }

                    journals.push({
                        day: i,
                        content: savedJournal || '',
                        mission: mission,
                        date: getDateLabel(i, currentDay)
                    });
                }
            }

            // API 호출
            const result = await api.getWeeklyReport({
                userId,
                name,
                journals
            });

            if (result.success) {
                setReport(result.report);
                setWeekLabel(result.weekLabel || getWeekLabel());
            }

        } catch (error) {
            console.error('[WeeklyReport] Error:', error);
            setReport(`${userName || ''}님, 이번 주도 함께해주셔서 감사해요.\n\n당신이 걸어온 여정 하나하나가\n결코 작지 않다는 걸 알아주세요.\n\n당신의 성장 속도는 전세계 이용자의 상위 15%입니다.\n\n다음 주에도 함께 걸어가요. 💜\n\n─ 오르빗`);
            setWeekLabel(getWeekLabel());
        } finally {
            setIsLoading(false);
        }
    };

    // 날짜 라벨 생성 (예: "월요일")
    const getDateLabel = (day: number, currentDay: number) => {
        const today = new Date();
        const diff = currentDay - day;
        const targetDate = new Date(today);
        targetDate.setDate(today.getDate() - diff);

        const dayNames = ['일요일', '월요일', '화요일', '수요일', '목요일', '금요일', '토요일'];
        return dayNames[targetDate.getDay()];
    };

    // 주차 라벨 생성
    const getWeekLabel = () => {
        const now = new Date();
        const month = now.getMonth() + 1;
        const weekOfMonth = Math.ceil(now.getDate() / 7);
        return `${month}월 ${weekOfMonth}주차`;
    };

    // 공유하기
    const handleShare = async () => {
        try {
            await Share.share({
                message: `🌙 ORBIT ${weekLabel} 여정을 마치며\n\n${report}`,
            });
        } catch (error) {
            console.error('Share error:', error);
        }
    };

    return (
        <LinearGradient
            colors={['#1A0B2E', '#2D1B4E', '#1A0B2E']}
            style={styles.container}
        >
            <SafeAreaView style={styles.safeArea}>
                {/* 헤더 */}
                <View style={styles.header}>
                    <TouchableOpacity
                        onPress={() => navigation.goBack()}
                        style={styles.backButton}
                    >
                        <Ionicons name="arrow-back" size={24} color="#fff" />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>주간 리포트</Text>
                    <View style={{ width: 40 }} />
                </View>

                {isLoading ? (
                    <View style={styles.loadingContainer}>
                        <ActivityIndicator size="large" color="#A78BFA" />
                        <Text style={styles.loadingText}>리포트를 생성하고 있어요...</Text>
                    </View>
                ) : (
                    <ScrollView
                        style={styles.scrollView}
                        contentContainerStyle={styles.scrollContent}
                    >
                        {/* 리포트 카드 */}
                        <LinearGradient
                            colors={['#1A0B2E', '#2D1B4E', '#1A0B2E']}
                            style={styles.reportCard}
                        >
                            {/* 로고 */}
                            <View style={styles.logoSection}>
                                <Text style={styles.logoEmoji}>🌙</Text>
                                <Text style={styles.logoText}>ORBIT</Text>
                            </View>

                            {/* 주차 라벨 */}
                            <Text style={styles.weekLabel}>
                                {weekLabel} 여정을 마치며
                            </Text>

                            {/* 구분선 */}
                            <View style={styles.divider} />

                            {/* AI 코멘트 */}
                            <Text style={styles.reportText}>
                                {report}
                            </Text>
                        </LinearGradient>

                        {/* 공유 버튼 */}
                        <TouchableOpacity
                            style={styles.shareButton}
                            onPress={handleShare}
                        >
                            <Ionicons name="share-social-outline" size={22} color="#fff" />
                            <Text style={styles.buttonText}>SNS에 공유하기</Text>
                        </TouchableOpacity>

                        {/* 새로고침 버튼 */}
                        <TouchableOpacity
                            style={styles.refreshButton}
                            onPress={loadReport}
                        >
                            <Ionicons name="refresh" size={16} color="rgba(255,255,255,0.5)" />
                            <Text style={styles.refreshText}>다시 생성하기</Text>
                        </TouchableOpacity>
                    </ScrollView>
                )}
            </SafeAreaView>
        </LinearGradient>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    safeArea: {
        flex: 1,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingVertical: 12,
    },
    backButton: {
        width: 40,
        height: 40,
        justifyContent: 'center',
        alignItems: 'center',
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: '#fff',
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        gap: 16,
    },
    loadingText: {
        color: 'rgba(255,255,255,0.7)',
        fontSize: 14,
    },
    scrollView: {
        flex: 1,
    },
    scrollContent: {
        padding: 20,
        paddingBottom: 40,
    },
    reportCard: {
        borderRadius: 24,
        padding: 32,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.15)',
    },
    logoSection: {
        alignItems: 'center',
        marginBottom: 16,
    },
    logoEmoji: {
        fontSize: 40,
        marginBottom: 4,
    },
    logoText: {
        fontSize: 24,
        fontWeight: '700',
        color: '#fff',
        letterSpacing: 3,
    },
    weekLabel: {
        fontSize: 15,
        color: 'rgba(255,255,255,0.6)',
        textAlign: 'center',
        marginBottom: 20,
    },
    divider: {
        height: 1,
        backgroundColor: 'rgba(255,255,255,0.1)',
        marginBottom: 24,
    },
    reportText: {
        fontSize: 16,
        color: '#fff',
        lineHeight: 28,
        textAlign: 'center',
    },
    shareButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 10,
        backgroundColor: 'rgba(167, 139, 250, 0.3)',
        paddingVertical: 18,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: 'rgba(167, 139, 250, 0.5)',
        marginTop: 24,
    },
    buttonText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#fff',
    },
    refreshButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 6,
        marginTop: 20,
        padding: 12,
    },
    refreshText: {
        fontSize: 13,
        color: 'rgba(255,255,255,0.5)',
    },
});

export default WeeklyReportScreen;
