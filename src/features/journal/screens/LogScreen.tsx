import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, SafeAreaView, Image, StatusBar } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { COLORS, FONTS, SPACING, LAYOUT } from '../theme/theme';
import GlassCard from '../components/GlassCard';

interface HistoryEntry {
    day: number;
    date: string;
    mission: string;
    content?: string; // 사용자가 쓴 글
    reflection?: string; // 구버전 호환
    analysis: string;
    feedback?: string;
    signal?: string;
    imageUri?: string;
}

const LogScreen = () => {
    const [history, setHistory] = useState<HistoryEntry[]>([]);

    useEffect(() => {
        loadHistory();
    }, []);

    const loadHistory = async () => {
        try {
            const storedHistory = await AsyncStorage.getItem('journalHistory');
            if (storedHistory) {
                const parsed = JSON.parse(storedHistory);
                setHistory(parsed);
            }
        } catch (e) {
            console.error('Failed to load history:', e);
        }
    };

    const renderHistoryItem = ({ item }: { item: HistoryEntry }) => {
        // content 또는 reflection에서 사용자 기록 가져오기
        const userContent = item.content || item.reflection || '';
        // signal 또는 feedback에서 AI 피드백 가져오기
        const aiFeedback = item.signal || item.feedback || item.analysis || '';

        return (
            <GlassCard style={styles.historyCard}>
                <View style={styles.historyHeader}>
                    <Text style={styles.dayText}>Day {item.day}</Text>
                    <Text style={styles.dateText}>{item.date}</Text>
                </View>

                <Text style={styles.missionText}>미션: {item.mission}</Text>

                {item.imageUri && (
                    <Image source={{ uri: item.imageUri }} style={styles.historyImage} />
                )}

                {/* 사용자가 작성한 내용 */}
                {userContent ? (
                    <View style={styles.userContentSection}>
                        <Text style={styles.analysisTitleText}>나의 기록</Text>
                        <Text style={styles.reflectionText}>"{userContent}"</Text>
                    </View>
                ) : null}

                <View style={styles.analysisSection}>
                    <Text style={styles.analysisTitleText}>오르빗의 시그널</Text>
                    <Text style={styles.analysisText}>{aiFeedback}</Text>
                </View>
            </GlassCard>
        );
    };

    return (
        <View style={styles.container}>
            <StatusBar barStyle="light-content" backgroundColor={COLORS.background} />
            <SafeAreaView style={styles.safeArea}>
                <View style={styles.header}>
                    <Text style={styles.headerTitle}>기록</Text>
                </View>

                {history.length === 0 ? (
                    <View style={styles.emptyContainer}>
                        <Text style={styles.emptyText}>아직 기록된 여정이 없습니다.</Text>
                    </View>
                ) : (
                    <FlatList
                        data={history}
                        renderItem={renderHistoryItem}
                        keyExtractor={(item, index) => `${item.day}-${index}`}
                        contentContainerStyle={styles.listContent}
                    />
                )}
            </SafeAreaView>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: COLORS.background,
    },
    safeArea: {
        flex: 1,
        paddingTop: LAYOUT.safeAreaTop,
    },
    header: {
        paddingVertical: SPACING.m,
        paddingHorizontal: SPACING.l,
        alignItems: 'center',
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(255,255,255,0.1)',
    },
    headerTitle: {
        color: COLORS.gold,
        fontSize: 20,
        fontFamily: FONTS.serif,
        fontWeight: 'bold',
        letterSpacing: 2,
    },
    listContent: {
        padding: SPACING.l,
        paddingBottom: 120, // Space for tab bar
    },
    historyCard: {
        padding: SPACING.l,
        marginBottom: SPACING.m,
    },
    historyHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: SPACING.m,
    },
    dayText: {
        color: COLORS.gold,
        fontSize: 18,
        fontFamily: FONTS.serif,
        fontWeight: 'bold',
    },
    dateText: {
        color: '#aaa',
        fontSize: 14,
        fontFamily: FONTS.sans,
    },
    missionText: {
        color: '#fff',
        fontSize: 16,
        fontFamily: FONTS.sans,
        marginBottom: SPACING.m,
    },
    historyImage: {
        width: '100%',
        height: 200,
        borderRadius: 10,
        marginBottom: SPACING.m,
    },
    reflectionText: {
        color: '#fff',
        fontSize: 15,
        fontFamily: FONTS.sans,
        lineHeight: 22,
        marginBottom: SPACING.m,
        fontStyle: 'italic',
    },
    analysisSection: {
        borderTopWidth: 1,
        borderTopColor: 'rgba(255,255,255,0.1)',
        paddingTop: SPACING.m,
    },
    analysisTitleText: {
        color: COLORS.gold,
        fontSize: 14,
        fontFamily: FONTS.serif,
        fontWeight: 'bold',
        marginBottom: SPACING.s,
    },
    analysisText: {
        color: '#ccc',
        fontSize: 14,
        fontFamily: FONTS.sans,
        lineHeight: 20,
    },
    feedbackText: {
        color: '#aaa',
        fontSize: 14,
        fontFamily: FONTS.sans,
        lineHeight: 20,
        fontStyle: 'italic',
    },
    emptyContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    emptyText: {
        color: '#666',
        fontSize: 16,
        fontFamily: FONTS.sans,
    },
});

export default LogScreen;
