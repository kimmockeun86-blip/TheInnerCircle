import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, SafeAreaView, Image, StatusBar } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { COLORS, FONTS, SPACING, LAYOUT } from '../theme/theme';
import GlassCard from '../components/GlassCard';

interface HistoryEntry {
    day: number;
    date: string;
    mission: string;
    reflection: string;
    analysis: string;
    feedback?: string;
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

    const renderHistoryItem = ({ item }: { item: HistoryEntry }) => (
        <GlassCard style={styles.historyCard}>
            <View style={styles.historyHeader}>
                <Text style={styles.dayText}>Day {item.day}</Text>
                <Text style={styles.dateText}>{item.date}</Text>
            </View>

            <Text style={styles.missionText}>미션: {item.mission}</Text>

            {item.imageUri && (
                <Image source={{ uri: item.imageUri }} style={styles.historyImage} />
            )}

            <Text style={styles.reflectionText}>"{item.reflection}"</Text>

            <View style={styles.analysisSection}>
                <Text style={styles.analysisTitleText}>오르빗의 통찰</Text>
                <Text style={styles.analysisText}>{item.analysis}</Text>

                {item.feedback && (
                    <>
                        <Text style={[styles.analysisTitleText, { marginTop: 10 }]}>조언</Text>
                        <Text style={styles.feedbackText}>{item.feedback}</Text>
                    </>
                )}
            </View>
        </GlassCard>
    );

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
