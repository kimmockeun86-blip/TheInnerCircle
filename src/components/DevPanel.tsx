// DevPanel.tsx - 테스트용 디버그 패널
// 모든 페이지 바로가기, dayCount 조절, 타이머 제거 등 테스트 기능 제공

import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    Modal,
    ScrollView,
    StyleSheet,
    Alert,
    Platform,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation, CommonActions } from '@react-navigation/native';

interface DevPanelProps {
    visible?: boolean;
}

const DevPanel: React.FC<DevPanelProps> = ({ visible = true }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [dayCount, setDayCount] = useState(1);
    const [timerDisabled, setTimerDisabled] = useState(false);
    const [isCoupled, setIsCoupled] = useState(false);
    // 매칭 플로우 상태
    const [matchPhase, setMatchPhase] = useState(0);
    const [hasLetter, setHasLetter] = useState(false);
    const [meetingDate, setMeetingDate] = useState('');
    // 시간 가속 모드
    const [timeAccelRunning, setTimeAccelRunning] = useState(false);
    const [timeAccelSpeed, setTimeAccelSpeed] = useState(10); // 1일 = X초
    const timeAccelRef = React.useRef<NodeJS.Timeout | null>(null);
    const navigation = useNavigation<any>();

    // 매칭 단계 설명
    const matchPhaseLabels = [
        '0. 매칭 전 (Day < 10)',
        '1. 매칭 시작 (Day 10+)',
        '2. 특별미션 버튼 표시',
        '3. 매칭 이벤트 진행',
        '4. 상대 표시 (익명)',
        '5. 편지쓰기 가능',
        '6. 편지 수신됨',
        '7. 만날 날짜 입력',
        '8. 특별미션 생성됨',
        '9. 특별미션 기록',
        '10. 계속 만날지 결정',
        '11. 매칭 성공/실패',
    ];

    // 현재 상태 로드
    useEffect(() => {
        const loadState = async () => {
            try {
                const day = await AsyncStorage.getItem('dayCount');
                const timer = await AsyncStorage.getItem('devTimerDisabled');
                const coupled = await AsyncStorage.getItem('isCoupled');
                const phase = await AsyncStorage.getItem('devMatchPhase');
                const letter = await AsyncStorage.getItem('devHasLetter');
                const meeting = await AsyncStorage.getItem('devMeetingDate');
                if (day) setDayCount(parseInt(day));
                if (timer === 'true') setTimerDisabled(true);
                if (coupled === 'true' || coupled === 'coupled') setIsCoupled(true);
                if (phase) setMatchPhase(parseInt(phase));
                if (letter === 'true') setHasLetter(true);
                if (meeting) setMeetingDate(meeting);
                const level = await AsyncStorage.getItem('growthLevel');
                if (level) setGrowthLevel(parseInt(level));
            } catch (e) {
                console.log('[DevPanel] 상태 로드 실패:', e);
            }
        };
        loadState();
    }, [isOpen]);

    // 페이지 이동
    const navigateTo = (screen: string, params?: any) => {
        setIsOpen(false);
        try {
            if (screen === 'Onboarding') {
                navigation.dispatch(
                    CommonActions.reset({
                        index: 0,
                        routes: [{ name: 'Onboarding' }],
                    })
                );
            } else if (screen === 'CouplesMission') {
                navigation.dispatch(
                    CommonActions.reset({
                        index: 0,
                        routes: [{ name: 'CouplesMission' }],
                    })
                );
            } else if (screen === 'MainTabs') {
                navigation.dispatch(
                    CommonActions.reset({
                        index: 0,
                        routes: [{ name: 'MainTabs' }],
                    })
                );
            } else {
                navigation.navigate(screen, params);
            }
        } catch (e) {
            console.log('[DevPanel] 네비게이션 실패:', screen, e);
            Alert.alert('이동 실패', `${screen} 화면으로 이동할 수 없습니다.`);
        }
    };

    // dayCount 변경
    const changeDayCount = async (delta: number) => {
        const newDay = Math.max(1, Math.min(100, dayCount + delta));
        setDayCount(newDay);
        await AsyncStorage.setItem('dayCount', newDay.toString());
        Alert.alert('Day 변경', `Day ${newDay}로 변경되었습니다. 앱을 새로고침하세요.`);
    };

    // 타이머 토글
    const toggleTimer = async () => {
        const newValue = !timerDisabled;
        setTimerDisabled(newValue);
        await AsyncStorage.setItem('devTimerDisabled', newValue.toString());

        // 타이머 비활성화 시 lastCompletedDate도 삭제하여 즉시 잠금 해제
        if (newValue) {
            await AsyncStorage.removeItem('lastCompletedDate');
        }

        Alert.alert('타이머', newValue ? '타이머 비활성화됨 (화면 새로고침 필요)' : '타이머 활성화됨');
    };

    // 커플 모드 토글
    const toggleCoupleMode = async () => {
        const newValue = !isCoupled;
        setIsCoupled(newValue);
        await AsyncStorage.setItem('isCoupled', newValue ? 'true' : 'false');
        Alert.alert('커플 모드', newValue ? '커플 모드 ON' : '솔로 모드 ON');
    };

    // 매칭 단계 변경
    const changeMatchPhase = async (delta: number) => {
        const newPhase = Math.max(0, Math.min(11, matchPhase + delta));
        setMatchPhase(newPhase);
        await AsyncStorage.setItem('devMatchPhase', newPhase.toString());
        // 단계별로 필요한 데이터도 설정
        if (newPhase >= 1) await AsyncStorage.setItem('dayCount', '10');
        if (newPhase >= 4) {
            await AsyncStorage.setItem('matchedPartner', JSON.stringify({
                id: 'test_partner_123',
                name: '???',
                age: '??',
                job: '???',
                deficit: '성장',
                location: '서울'
            }));
        }
        Alert.alert('매칭 단계', matchPhaseLabels[newPhase]);
    };

    // 편지 수신 시뮬레이션
    const simulateLetter = async () => {
        const newValue = !hasLetter;
        setHasLetter(newValue);
        await AsyncStorage.setItem('devHasLetter', newValue.toString());
        if (newValue) {
            await AsyncStorage.setItem('receivedLetters', JSON.stringify([{
                id: 'letter_1',
                from: 'test_partner_123',
                fromName: '???님',
                content: '안녕하세요, 당신의 프로필을 보고 연락드립니다...',
                createdAt: new Date().toISOString(),
                read: false
            }]));
        }
        Alert.alert('편지', newValue ? '편지 수신됨 📩' : '편지 삭제됨');
    };

    // 만남 날짜 설정
    const setMeetingDateHandler = async () => {
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        const dateStr = tomorrow.toISOString().split('T')[0];
        setMeetingDate(dateStr);
        await AsyncStorage.setItem('devMeetingDate', dateStr);
        await AsyncStorage.setItem('specialMissionDate', dateStr);
        Alert.alert('만남 날짜', `${dateStr} 로 설정됨`);
    };

    // 특별미션 완료 시뮬레이션
    const completeSpecialMission = async () => {
        await AsyncStorage.setItem('specialMissionCompleted', 'true');
        await AsyncStorage.setItem('specialMissionRecord', JSON.stringify({
            date: new Date().toISOString(),
            reflection: '테스트 특별미션 기록입니다.',
            mood: 'happy'
        }));
        Alert.alert('특별미션', '특별미션 완료됨 ✅');
    };

    // 시간 가속 시작/정지
    const toggleTimeAccel = () => {
        if (timeAccelRunning) {
            // 정지
            if (timeAccelRef.current) {
                clearInterval(timeAccelRef.current);
                timeAccelRef.current = null;
            }
            setTimeAccelRunning(false);
            Alert.alert('시간 가속', '정지됨 ⏹️');
        } else {
            // 시작
            setTimeAccelRunning(true);
            Alert.alert('시간 가속', `시작됨 ▶️ (1일 = ${timeAccelSpeed}초)`);
            timeAccelRef.current = setInterval(async () => {
                const currentDay = await AsyncStorage.getItem('dayCount');
                const newDay = Math.min(100, (parseInt(currentDay || '1') + 1));
                await AsyncStorage.setItem('dayCount', newDay.toString());
                setDayCount(newDay);
                console.log(`[TimeAccel] Day ${newDay}`);

                // Day 10 도달 시 매칭 트리거
                if (newDay === 10) {
                    console.log('[TimeAccel] Day 10 도달! 매칭 시작 조건 충족');
                }

                // Day 100 도달 시 자동 정지
                if (newDay >= 100) {
                    if (timeAccelRef.current) clearInterval(timeAccelRef.current);
                    setTimeAccelRunning(false);
                    Alert.alert('시간 가속', 'Day 100 도달! 정지됨.');
                }
            }, timeAccelSpeed * 1000);
        }
    };

    // growthLevel 조절
    const [growthLevel, setGrowthLevel] = useState(1);
    const changeGrowthLevel = async (delta: number) => {
        const newLevel = Math.max(1, Math.min(10, growthLevel + delta));
        setGrowthLevel(newLevel);
        await AsyncStorage.setItem('growthLevel', newLevel.toString());
        Alert.alert('성장 레벨', `Level ${newLevel}로 변경됨`);
    };

    // 🤖 AI 분석 다시 시키기
    const triggerAiAnalysis = async () => {
        try {
            const userName = await AsyncStorage.getItem('userName') || '테스트유저';
            const userDeficit = await AsyncStorage.getItem('userDeficit') || '성장';
            const userGender = await AsyncStorage.getItem('userGender') || '남성';
            const userAge = await AsyncStorage.getItem('userAge') || '25';
            const userJob = await AsyncStorage.getItem('userJob') || '개발자';
            const userIdealType = await AsyncStorage.getItem('userIdealType') || '따뜻한 사람';
            const userHobbies = await AsyncStorage.getItem('userHobbies') || '독서, 운동';
            const userGrowth = await AsyncStorage.getItem('userGrowth') || '자기계발';
            const userComplex = await AsyncStorage.getItem('userComplex') || '내성적';

            Alert.alert('AI 분석', 'AI 분석을 다시 시작합니다...');

            const { api } = require('../services/api');
            const analysisResult = await api.analyzeProfile({
                name: userName,
                gender: userGender,
                age: userAge,
                job: userJob,
                location: '서울',
                idealType: userIdealType,
                hobbies: userHobbies,
                growthGoal: userGrowth,
                complex: userComplex,
                deficit: userDeficit
            });


            if (analysisResult.success) {
                await AsyncStorage.setItem('aiAnalysis', analysisResult.analysis || '');
                if (analysisResult.recommendedMission) {
                    await AsyncStorage.setItem(`mission_day_${dayCount}`, analysisResult.recommendedMission);
                }
                // DevPanel 닫고 화면에 결과 표시
                setIsOpen(false);
                Alert.alert('✅ AI 분석 완료', '화면에 결과가 표시됩니다. 스크롤하여 확인하세요!');
                // 화면 새로고침을 위해 홈으로 이동
                navigateTo('MainTabs');
            } else {
                Alert.alert('❌ AI 분석 실패', '다시 시도해주세요.');
            }
        } catch (e: any) {
            Alert.alert('❌ 오류', e.message || '분석에 실패했습니다.');
        }
    };

    // ☀️ 시간대별 맞춤 조언 테스트
    const testPersonalizedAdvice = async (timeOfDay: 'morning' | 'noon' | 'evening') => {
        try {
            const userName = await AsyncStorage.getItem('userName') || '테스트유저';
            const userDeficit = await AsyncStorage.getItem('userDeficit') || '성장';
            const storedGrowthLevel = await AsyncStorage.getItem('growthLevel') || '1';
            const currentMission = await AsyncStorage.getItem(`mission_day_${dayCount}`) || '오늘의 리추얼';

            const timeLabel = timeOfDay === 'morning' ? '아침' : timeOfDay === 'noon' ? '점심' : '저녁';
            Alert.alert(`☀️ ${timeLabel} 조언`, `조언 생성 중... (Lv.${storedGrowthLevel})`);

            const { api } = require('../services/api');
            const adviceResult = await api.getPersonalizedAdvice({
                userId: userName,
                name: userName,
                deficit: userDeficit,
                currentMission: currentMission,
                recentJournals: ['어제는 명상을 했다.', '오늘 감사일기를 썼다.'],
                timeOfDay: timeOfDay,
                dayCount: dayCount,
                growthLevel: parseInt(storedGrowthLevel, 10)
            });

            if (adviceResult && adviceResult.advice) {
                Alert.alert(`✅ ${timeLabel} 조언`, `${adviceResult.advice}\n\n집중 포인트: ${adviceResult.focusPrompt || '없음'}`);
            } else {
                Alert.alert('❌ 조언 생성 실패', '다시 시도해주세요.');
            }
        } catch (e: any) {
            Alert.alert('❌ 오류', e.message || '조언 생성에 실패했습니다.');
        }
    };

    // 📝 테스트 저널 자동 입력 (미션 수행 시뮬레이션)
    const simulateJournalEntry = async () => {
        const testJournals = [
            '오늘 하루는 정말 의미있었다. 처음으로 나 자신과 깊이 대화하는 시간을 가졌다. 항상 바쁘게만 살았는데, 이렇게 멈추고 생각하는 시간이 소중하게 느껴졌다.',
            '아침에 일어나서 5분 명상을 했다. 처음에는 집중이 안됐지만 점점 마음이 편안해지는 것을 느꼈다. 앞으로도 계속 해봐야겠다.',
            '오늘 낯선 사람에게 먼저 인사를 건넸다. 처음에는 부끄러웠지만, 상대방이 밝게 웃어주니 기분이 좋아졌다. 작은 용기가 큰 변화를 만드는 것 같다.',
            '거울 앞에서 나 자신에게 칭찬을 세 가지 했다. 어색했지만, 자존감이 조금 높아진 것 같다. 내가 나를 사랑해야 한다는 것을 다시 느꼈다.',
            '오늘 과거의 상처를 떠올리며 용서하는 연습을 했다. 아직 완전히 용서하지 못했지만, 그 시작이 중요하다고 생각한다.'
        ];
        const randomJournal = testJournals[Math.floor(Math.random() * testJournals.length)];

        try {
            const currentMission = await AsyncStorage.getItem(`mission_day_${dayCount}`) || '오늘의 리추얼';
            const userName = await AsyncStorage.getItem('userName') || '테스트유저';
            const userDeficit = await AsyncStorage.getItem('userDeficit') || '성장';
            const storedGrowthLevel = await AsyncStorage.getItem('growthLevel') || '1';

            Alert.alert('📝 테스트 저널', `저널 분석 중... (Lv.${storedGrowthLevel})`);

            const { api } = require('../services/api');
            const journalResult = await api.analyzeJournal({
                userId: userName,
                journalText: randomJournal,
                name: userName,
                deficit: userDeficit,
                dayCount: dayCount,
                growthLevel: parseInt(storedGrowthLevel, 10)  // 🎯 DevPanel에서 설정한 레벨 전달
            });

            if (journalResult.success) {
                // 저널 히스토리에 추가
                const historyStr = await AsyncStorage.getItem('journalHistory') || '[]';
                const history = JSON.parse(historyStr);
                history.unshift({
                    day: dayCount,
                    date: new Date().toLocaleDateString(),
                    mission: currentMission,
                    journal: randomJournal,
                    feedback: journalResult.feedback,
                    score: journalResult.score
                });
                await AsyncStorage.setItem('journalHistory', JSON.stringify(history));

                // 다음 미션 저장
                if (journalResult.nextMission) {
                    await AsyncStorage.setItem(`mission_day_${dayCount + 1}`, journalResult.nextMission);
                }

                // 미션 완료 처리
                await AsyncStorage.setItem('lastCompletedDate', new Date().toISOString());

                Alert.alert('✅ 저널 완료',
                    `피드백: ${journalResult.feedback || '없음'}\n\n다음 미션: ${journalResult.nextMission || '없음'}`);
            } else {
                Alert.alert('❌ 저널 분석 실패', '다시 시도해주세요.');
            }
        } catch (e: any) {
            Alert.alert('❌ 오류', e.message || '저널 분석에 실패했습니다.');
        }
    };

    // 데이터 초기화
    const resetData = async () => {
        Alert.alert(
            '데이터 초기화',
            '모든 데이터를 삭제하시겠습니까?',
            [
                { text: '취소', style: 'cancel' },
                {
                    text: '확인',
                    style: 'destructive',
                    onPress: async () => {
                        await AsyncStorage.clear();
                        Alert.alert('완료', '데이터가 초기화되었습니다.');
                        navigateTo('Onboarding');
                    },
                },
            ]
        );
    };

    if (!visible || !__DEV__) return null;

    return (
        <>
            {/* 토글 버튼 */}
            <TouchableOpacity
                style={styles.toggleButton}
                onPress={() => setIsOpen(true)}
            >
                <Text style={styles.toggleButtonText}>🔧</Text>
            </TouchableOpacity>

            {/* DevPanel 모달 */}
            <Modal
                visible={isOpen}
                transparent
                animationType="slide"
                onRequestClose={() => setIsOpen(false)}
            >
                <View style={styles.overlay}>
                    <View style={styles.panel}>
                        <View style={styles.header}>
                            <Text style={styles.title}>🔧 DevPanel</Text>
                            <TouchableOpacity onPress={() => setIsOpen(false)}>
                                <Text style={styles.closeButton}>✕</Text>
                            </TouchableOpacity>
                        </View>

                        <ScrollView style={styles.content}>
                            {/* === 메인 화면 === */}
                            <Text style={styles.sectionTitle}>🏠 메인 화면</Text>
                            <View style={styles.buttonGrid}>
                                <TouchableOpacity style={styles.navButton} onPress={() => navigateTo('Onboarding')}>
                                    <Text style={styles.navButtonText}>1. Onboarding{'\n'}(온보딩)</Text>
                                </TouchableOpacity>
                                <TouchableOpacity style={styles.navButton} onPress={() => navigateTo('MainTabs')}>
                                    <Text style={styles.navButtonText}>2. MainTabs{'\n'}(솔로 홈)</Text>
                                </TouchableOpacity>
                                <TouchableOpacity style={styles.navButton} onPress={() => navigateTo('CouplesMission')}>
                                    <Text style={styles.navButtonText}>3. CouplesMission{'\n'}(커플 홈)</Text>
                                </TouchableOpacity>
                            </View>

                            {/* === 솔로 모드 탭 화면 === */}
                            <Text style={styles.sectionTitle}>📱 솔로 모드 탭 (MainTabs)</Text>
                            <View style={styles.buttonGrid}>
                                <TouchableOpacity style={[styles.navButton, styles.tabButton]} onPress={() => {
                                    navigateTo('MainTabs');
                                    setTimeout(() => navigation.navigate('Home'), 100);
                                }}>
                                    <Text style={styles.navButtonText}>Home{'\n'}(오늘의 미션)</Text>
                                </TouchableOpacity>
                                <TouchableOpacity style={[styles.navButton, styles.tabButton]} onPress={() => {
                                    navigateTo('MainTabs');
                                    setTimeout(() => navigation.navigate('Log'), 100);
                                }}>
                                    <Text style={styles.navButtonText}>Log{'\n'}(기록)</Text>
                                </TouchableOpacity>
                                <TouchableOpacity style={[styles.navButton, styles.tabButton]} onPress={() => {
                                    navigateTo('MainTabs');
                                    setTimeout(() => navigation.navigate('Profile'), 100);
                                }}>
                                    <Text style={styles.navButtonText}>Profile{'\n'}(프로필)</Text>
                                </TouchableOpacity>
                            </View>

                            {/* === 커플 모드 탭 화면 === */}
                            <Text style={styles.sectionTitle}>💑 커플 모드 탭 (CouplesMission)</Text>
                            <View style={styles.buttonGrid}>
                                <TouchableOpacity style={[styles.navButton, styles.coupleButton]} onPress={() => {
                                    navigateTo('CouplesMission');
                                    setTimeout(() => navigation.navigate('CouplesHome'), 100);
                                }}>
                                    <Text style={styles.navButtonText}>CouplesHome{'\n'}(커플 미션)</Text>
                                </TouchableOpacity>
                                <TouchableOpacity style={[styles.navButton, styles.coupleButton]} onPress={() => {
                                    navigateTo('CouplesMission');
                                    setTimeout(() => navigation.navigate('CouplesLog'), 100);
                                }}>
                                    <Text style={styles.navButtonText}>CouplesLog{'\n'}(커플 기록)</Text>
                                </TouchableOpacity>
                                <TouchableOpacity style={[styles.navButton, styles.coupleButton]} onPress={() => {
                                    navigateTo('CouplesMission');
                                    setTimeout(() => navigation.navigate('CouplesProfile'), 100);
                                }}>
                                    <Text style={styles.navButtonText}>CouplesProfile{'\n'}(커플 프로필)</Text>
                                </TouchableOpacity>
                            </View>

                            {/* === 독립 화면 === */}
                            <Text style={styles.sectionTitle}>📄 독립 화면</Text>
                            <View style={styles.buttonGrid}>
                                <TouchableOpacity style={styles.navButton} onPress={() => navigateTo('Settings')}>
                                    <Text style={styles.navButtonText}>Settings{'\n'}(설정)</Text>
                                </TouchableOpacity>
                                {/* Match 화면은 _archived로 이동됨 - 버튼 제거 */}
                                <TouchableOpacity style={styles.navButton} onPress={() => navigateTo('SpecialMissionIntro')}>
                                    <Text style={styles.navButtonText}>SpecialMission{'\n'}(특별미션)</Text>
                                </TouchableOpacity>
                                <TouchableOpacity style={styles.navButton} onPress={() => navigateTo('Connections')}>
                                    <Text style={styles.navButtonText}>Connections{'\n'}(연결)</Text>
                                </TouchableOpacity>
                            </View>

                            {/* Day 조절 */}
                            <Text style={styles.sectionTitle}>📅 Day 조절</Text>
                            <View style={styles.dayControl}>
                                <TouchableOpacity style={styles.dayButton} onPress={() => changeDayCount(-10)}>
                                    <Text style={styles.dayButtonText}>-10</Text>
                                </TouchableOpacity>
                                <TouchableOpacity style={styles.dayButton} onPress={() => changeDayCount(-1)}>
                                    <Text style={styles.dayButtonText}>-1</Text>
                                </TouchableOpacity>
                                <Text style={styles.dayText}>Day {dayCount}</Text>
                                <TouchableOpacity style={styles.dayButton} onPress={() => changeDayCount(1)}>
                                    <Text style={styles.dayButtonText}>+1</Text>
                                </TouchableOpacity>
                                <TouchableOpacity style={styles.dayButton} onPress={() => changeDayCount(10)}>
                                    <Text style={styles.dayButtonText}>+10</Text>
                                </TouchableOpacity>
                            </View>

                            {/* 시간 가속 모드 */}
                            <Text style={styles.sectionTitle}>⏩ 시간 가속 모드</Text>
                            <View style={styles.dayControl}>
                                <TouchableOpacity
                                    style={[styles.dayButton, timeAccelRunning && { backgroundColor: '#5a3a5a' }]}
                                    onPress={toggleTimeAccel}
                                >
                                    <Text style={styles.dayButtonText}>{timeAccelRunning ? '⏹️ 정지' : '▶️ 시작'}</Text>
                                </TouchableOpacity>
                                <Text style={[styles.dayText, { fontSize: 12 }]}>
                                    1일 = {timeAccelSpeed}초
                                </Text>
                                <TouchableOpacity style={styles.dayButton} onPress={() => setTimeAccelSpeed(Math.max(1, timeAccelSpeed - 5))}>
                                    <Text style={styles.dayButtonText}>-5s</Text>
                                </TouchableOpacity>
                                <TouchableOpacity style={styles.dayButton} onPress={() => setTimeAccelSpeed(timeAccelSpeed + 5)}>
                                    <Text style={styles.dayButtonText}>+5s</Text>
                                </TouchableOpacity>
                            </View>

                            {/* 성장 레벨 조절 */}
                            <Text style={styles.sectionTitle}>📈 성장 레벨 (AI 피드백 변화)</Text>
                            <View style={styles.dayControl}>
                                <TouchableOpacity style={styles.dayButton} onPress={() => changeGrowthLevel(-1)}>
                                    <Text style={styles.dayButtonText}>-1</Text>
                                </TouchableOpacity>
                                <Text style={styles.dayText}>Lv. {growthLevel}</Text>
                                <TouchableOpacity style={styles.dayButton} onPress={() => changeGrowthLevel(1)}>
                                    <Text style={styles.dayButtonText}>+1</Text>
                                </TouchableOpacity>
                            </View>

                            {/* 토글 옵션 */}
                            <Text style={styles.sectionTitle}>⚙️ 옵션</Text>
                            <TouchableOpacity
                                style={[styles.optionButton, timerDisabled && styles.optionButtonActive]}
                                onPress={toggleTimer}
                            >
                                <Text style={styles.optionText}>
                                    타이머 {timerDisabled ? '비활성화 ✅' : '활성화'}
                                </Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[styles.optionButton, isCoupled && styles.optionButtonActive]}
                                onPress={toggleCoupleMode}
                            >
                                <Text style={styles.optionText}>
                                    커플 모드 {isCoupled ? 'ON ✅' : 'OFF'}
                                </Text>
                            </TouchableOpacity>

                            {/* 🤖 AI 테스트 */}
                            <Text style={styles.sectionTitle}>🤖 AI 테스트</Text>
                            <View style={styles.buttonGrid}>
                                <TouchableOpacity
                                    style={[styles.navButton, { backgroundColor: '#2a5a4a' }]}
                                    onPress={triggerAiAnalysis}
                                >
                                    <Text style={styles.navButtonText}>AI 프로필{'\n'}재분석</Text>
                                </TouchableOpacity>
                                <TouchableOpacity
                                    style={[styles.navButton, { backgroundColor: '#4a3a6a' }]}
                                    onPress={simulateJournalEntry}
                                >
                                    <Text style={styles.navButtonText}>테스트{'\n'}저널 입력</Text>
                                </TouchableOpacity>
                                <TouchableOpacity
                                    style={[styles.navButton, { backgroundColor: '#6a2a3a' }]}
                                    onPress={resetData}
                                >
                                    <Text style={styles.navButtonText}>전체{'\n'}데이터 초기화</Text>
                                </TouchableOpacity>
                            </View>

                            {/* ☀️ 시간대별 조언 테스트 */}
                            <Text style={styles.sectionTitle}>☀️ 시간대별 조언 테스트</Text>
                            <View style={styles.buttonGrid}>
                                <TouchableOpacity
                                    style={[styles.navButton, { backgroundColor: '#5a4a2a' }]}
                                    onPress={() => testPersonalizedAdvice('morning')}
                                >
                                    <Text style={styles.navButtonText}>🌅 아침{'\n'}조언</Text>
                                </TouchableOpacity>
                                <TouchableOpacity
                                    style={[styles.navButton, { backgroundColor: '#6a5a2a' }]}
                                    onPress={() => testPersonalizedAdvice('noon')}
                                >
                                    <Text style={styles.navButtonText}>☀️ 점심{'\n'}조언</Text>
                                </TouchableOpacity>
                                <TouchableOpacity
                                    style={[styles.navButton, { backgroundColor: '#3a3a5a' }]}
                                    onPress={() => testPersonalizedAdvice('evening')}
                                >
                                    <Text style={styles.navButtonText}>🌙 저녁{'\n'}조언</Text>
                                </TouchableOpacity>
                            </View>

                            {/* 매칭 플로우 테스트 */}
                            <Text style={styles.sectionTitle}>💘 매칭 플로우 테스트</Text>

                            {/* 매칭 단계 조절 */}
                            <View style={styles.dayControl}>
                                <TouchableOpacity style={styles.dayButton} onPress={() => changeMatchPhase(-1)}>
                                    <Text style={styles.dayButtonText}>◀</Text>
                                </TouchableOpacity>
                                <Text style={[styles.dayText, { fontSize: 11, minWidth: 150 }]}>
                                    {matchPhaseLabels[matchPhase]}
                                </Text>
                                <TouchableOpacity style={styles.dayButton} onPress={() => changeMatchPhase(1)}>
                                    <Text style={styles.dayButtonText}>▶</Text>
                                </TouchableOpacity>
                            </View>

                            {/* 매칭 액션 버튼들 */}
                            <View style={[styles.buttonGrid, { marginTop: 10 }]}>
                                <TouchableOpacity
                                    style={[styles.navButton, hasLetter && styles.optionButtonActive]}
                                    onPress={simulateLetter}
                                >
                                    <Text style={styles.navButtonText}>📩 편지 수신{'\n'}{hasLetter ? '(있음)' : '(없음)'}</Text>
                                </TouchableOpacity>
                                <TouchableOpacity style={styles.navButton} onPress={setMeetingDateHandler}>
                                    <Text style={styles.navButtonText}>📅 만남 날짜{'\n'}{meetingDate || '미설정'}</Text>
                                </TouchableOpacity>
                                <TouchableOpacity style={styles.navButton} onPress={completeSpecialMission}>
                                    <Text style={styles.navButtonText}>✨ 특별미션{'\n'}완료 처리</Text>
                                </TouchableOpacity>
                            </View>

                            {/* 데이터 관리 */}
                            <Text style={styles.sectionTitle}>🗑️ 데이터 관리</Text>
                            <TouchableOpacity style={styles.dangerButton} onPress={resetData}>
                                <Text style={styles.dangerButtonText}>전체 데이터 초기화</Text>
                            </TouchableOpacity>
                        </ScrollView>
                    </View>
                </View>
            </Modal>
        </>
    );
};

const styles = StyleSheet.create({
    toggleButton: {
        position: 'absolute',
        top: Platform.OS === 'ios' ? 50 : 30,
        left: 10,
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: 'rgba(100, 100, 255, 0.8)',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 9999,
        elevation: 10,
    },
    toggleButtonText: {
        fontSize: 20,
    },
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    panel: {
        width: '90%',
        maxHeight: '80%',
        backgroundColor: '#1a1a2e',
        borderRadius: 15,
        overflow: 'hidden',
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 15,
        backgroundColor: '#16213e',
        borderBottomWidth: 1,
        borderBottomColor: '#333',
    },
    title: {
        color: '#fff',
        fontSize: 18,
        fontWeight: 'bold',
    },
    closeButton: {
        color: '#fff',
        fontSize: 24,
        padding: 5,
    },
    content: {
        padding: 15,
    },
    sectionTitle: {
        color: '#888',
        fontSize: 14,
        fontWeight: 'bold',
        marginTop: 15,
        marginBottom: 10,
    },
    buttonGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
    },
    navButton: {
        backgroundColor: '#2a2a4a',
        paddingVertical: 10,
        paddingHorizontal: 15,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#444',
    },
    navButtonText: {
        color: '#fff',
        fontSize: 11,
        textAlign: 'center',
    },
    tabButton: {
        backgroundColor: '#2a4a4a',
        borderColor: '#4a8a8a',
    },
    coupleButton: {
        backgroundColor: '#4a2a4a',
        borderColor: '#8a4a8a',
    },
    dayControl: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 10,
    },
    dayButton: {
        backgroundColor: '#3a3a5a',
        paddingVertical: 8,
        paddingHorizontal: 15,
        borderRadius: 5,
    },
    dayButtonText: {
        color: '#fff',
        fontSize: 14,
    },
    dayText: {
        color: '#fff',
        fontSize: 18,
        fontWeight: 'bold',
        minWidth: 80,
        textAlign: 'center',
    },
    optionButton: {
        backgroundColor: '#2a2a4a',
        padding: 15,
        borderRadius: 8,
        marginBottom: 8,
        borderWidth: 1,
        borderColor: '#444',
    },
    optionButtonActive: {
        backgroundColor: '#3a5a3a',
        borderColor: '#5a5',
    },
    optionText: {
        color: '#fff',
        fontSize: 14,
    },
    dangerButton: {
        backgroundColor: '#5a2a2a',
        padding: 15,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#a55',
        marginBottom: 20,
    },
    dangerButtonText: {
        color: '#faa',
        fontSize: 14,
        textAlign: 'center',
    },
});

export default DevPanel;
