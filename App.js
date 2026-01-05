import 'react-native-gesture-handler';
import React, { useState, useEffect, useCallback } from 'react';
import { StatusBar, View, ActivityIndicator, Platform, StyleSheet } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useFonts, Orbitron_400Regular, Orbitron_700Bold } from '@expo-google-fonts/orbitron';
import { NotoSansKR_400Regular, NotoSansKR_700Bold } from '@expo-google-fonts/noto-sans-kr';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SplashScreen from 'expo-splash-screen';

// 스플래시 화면 자동 숨김 방지 (앱 로딩 전)
SplashScreen.preventAutoHideAsync().catch(() => {
  // 에러 무시 (이미 숨겨진 경우)
});

import OnboardingScreen from './src/screens/OnboardingScreen';
import HomeScreen from './src/screens/HomeScreen';
import ProfileScreen from './src/screens/ProfileScreen';
import LogScreen from './src/screens/LogScreen';
// MatchScreen moved to _archived (legacy - no longer used)
import ConnectionsScreen from './src/screens/ConnectionsScreen';
import CouplesMissionScreen from './src/screens/CouplesMissionScreen';
import CoupleTabNavigator from './src/navigation/CoupleTabNavigator';
import SettingsScreen from './src/screens/SettingsScreen';
// MatchingScreen moved to _archived
import SpecialMissionIntroScreen from './src/screens/SpecialMissionIntroScreen';
import TabNavigator from './src/navigation/TabNavigator';
import ErrorBoundary from './src/components/ErrorBoundary';
import DevPanel from './src/components/DevPanel';

// 신규 서비스들
import { offlineQueueService } from './src/services/OfflineQueueService';
import { crashlyticsService } from './src/services/CrashlyticsService';
import { analyticsService } from './src/services/AnalyticsService';
import { deepLinkService } from './src/services/DeepLinkService';
import { i18n } from './src/i18n';
import AdService from './src/services/AdService';
import { appReviewService } from './src/services/AppReviewService';
import { OrbitTrustService } from './src/services/OrbitTrustService';

const Stack = createStackNavigator();

// Web container styles for centering
const webContainerStyle = Platform.OS === 'web' ? {
  flex: 1,
  maxWidth: 480,
  width: '100%',
  alignSelf: 'center',
  backgroundColor: '#000020',
  minHeight: '100vh',
  boxShadow: '0 0 30px rgba(0, 0, 0, 0.5)',
} : {};

// 사용자별 데이터를 저장/복원하는 헬퍼 함수들
const USER_DATA_KEYS = [
  'userName', 'userGender', 'userAge', 'userLocation', 'userJob',
  'userPhoto', 'userDeficit', 'userIdealType', 'userGrowth', 'userComplex',
  'userHobbies', 'userMBTI', 'hasOnboarded', 'dayCount', 'growthLevel',
  'missionCompletedCount', 'isCoupled', 'coupleDayCount', 'relationshipLevel',
  'savedJournal', 'missionStatus', 'lastCompletedDate', 'aiAnalysis',
  'currentMission', 'missionHistory', 'coupleMissionHistory', 'partnerName',
  'couplePhoto', 'coupleProfile', 'matchRecommendation', 'userOnboardingAnswers'
];

// 현재 사용자 데이터를 userId별로 저장
const saveUserDataToStorage = async (userId) => {
  if (Platform.OS !== 'web' || !userId) return;
  try {
    const userData = {};
    for (const key of USER_DATA_KEYS) {
      const value = await AsyncStorage.getItem(key);
      if (value !== null) {
        userData[key] = value;
      }
    }
    // 미션 데이터도 저장 (day별)
    for (let i = 1; i <= 100; i++) {
      const missionKey = `mission_day_${i}`;
      const missionValue = await AsyncStorage.getItem(missionKey);
      if (missionValue) userData[missionKey] = missionValue;
    }
    localStorage.setItem(`orbit_user_${userId}`, JSON.stringify(userData));
    console.log(`[App] 사용자 데이터 저장됨: ${userId}`);
  } catch (e) {
    console.error('[App] 사용자 데이터 저장 실패:', e);
  }
};

// userId에 해당하는 사용자 데이터를 복원
const loadUserDataFromStorage = async (userId) => {
  if (Platform.OS !== 'web' || !userId) return false;
  try {
    const storedData = localStorage.getItem(`orbit_user_${userId}`);
    if (storedData) {
      const userData = JSON.parse(storedData);
      // 기존 데이터 모두 클리어
      await AsyncStorage.clear();
      // 저장된 데이터 복원
      for (const [key, value] of Object.entries(userData)) {
        await AsyncStorage.setItem(key, value);
      }
      console.log(`[App] 사용자 데이터 복원됨: ${userId}`);
      return true;
    }
    return false;
  } catch (e) {
    console.error('[App] 사용자 데이터 복원 실패:', e);
    return false;
  }
};

// URL에서 userId 파라미터 추출
const getUserIdFromUrl = () => {
  if (Platform.OS !== 'web') return null;
  try {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get('userId');
  } catch (e) {
    return null;
  }
};

// 현재 세션의 userId 저장/가져오기
const getCurrentUserId = async () => {
  if (Platform.OS !== 'web') return null;
  return await AsyncStorage.getItem('currentUserId');
};

const setCurrentUserId = async (userId) => {
  if (Platform.OS !== 'web' || !userId) return;
  await AsyncStorage.setItem('currentUserId', userId);
};

export default function App() {
  console.log('🚀 App Component Mounted! (React Navigation System)');

  const [initialRoute, setInitialRoute] = useState(null);
  const [currentUserId, setCurrentUserIdState] = useState(null);

  let [fontsLoaded] = useFonts({
    Orbitron_400Regular,
    Orbitron_700Bold,
    NotoSansKR_400Regular,
    NotoSansKR_700Bold,
  });

  // URL 파라미터로 userId 처리 및 커플 모드 확인
  useEffect(() => {
    const initializeUser = async () => {
      try {
        // URL에서 userId 파라미터 확인
        const urlUserId = getUserIdFromUrl();
        const storedUserId = await getCurrentUserId();

        if (urlUserId) {
          console.log(`[App] URL userId 감지: ${urlUserId}`);

          // 이전 사용자와 다르면 데이터 저장 후 전환
          if (storedUserId && storedUserId !== urlUserId) {
            console.log(`[App] 사용자 전환: ${storedUserId} → ${urlUserId}`);
            await saveUserDataToStorage(storedUserId);
          }

          // 새 사용자 데이터 로드
          const loaded = await loadUserDataFromStorage(urlUserId);
          await setCurrentUserId(urlUserId);
          setCurrentUserIdState(urlUserId);

          if (!loaded) {
            // 새 사용자: 기존 데이터 클리어하고 온보딩으로 이동
            console.log(`[App] 새 사용자: ${urlUserId} - 데이터 클리어 후 온보딩으로 이동`);
            await AsyncStorage.clear();
            await AsyncStorage.setItem('currentUserId', urlUserId);
            setInitialRoute('Onboarding');
            return; // 여기서 종료 (온보딩으로 이동)
          }
        }

        // 기존 사용자: 커플 모드 확인
        const isCoupled = await AsyncStorage.getItem('isCoupled');
        console.log('[App] isCoupled:', isCoupled);

        // 온보딩 완료 여부 확인
        const hasOnboarded = await AsyncStorage.getItem('hasOnboarded');
        if (!hasOnboarded) {
          setInitialRoute('Onboarding');
        } else if (isCoupled === 'true' || isCoupled === 'coupled') {
          setInitialRoute('CouplesMission');
        } else {
          setInitialRoute('MainTabs');
        }
      } catch (e) {
        console.error('[App] Error initializing user:', e);
        setInitialRoute('MainTabs');
      }
    };

    // 서비스 초기화 함수
    const initializeServices = async () => {
      try {
        console.log('[App] 서비스 초기화 시작...');

        // i18n (다국어)
        await i18n.initialize();

        // 에러 트래킹
        await crashlyticsService.initialize();
        crashlyticsService.setupGlobalErrorHandler();

        // Analytics
        await analyticsService.initialize();

        // 오프라인 큐
        await offlineQueueService.initialize();

        // 딥링크
        await deepLinkService.initialize();

        // 광고 서비스
        await AdService.initialize();

        // 앱 리뷰 서비스 - 앱 열기 트래킹
        await appReviewService.trackAppOpen();

        // ORBIT 신뢰 시스템 초기화 (스트릭, 기념일 등)
        await OrbitTrustService.initialize();

        console.log('[App] 서비스 초기화 완료');
      } catch (e) {
        console.error('[App] 서비스 초기화 실패:', e);
      }
    };

    initializeUser();
    initializeServices();
  }, []);

  // 사용자 데이터 변경 시 자동 저장 (주기적)
  useEffect(() => {
    if (Platform.OS !== 'web') return;

    const saveInterval = setInterval(async () => {
      const userId = await getCurrentUserId();
      if (userId) {
        await saveUserDataToStorage(userId);
      }
    }, 30000); // 30초마다 저장

    // 페이지 이탈 시 저장
    const handleBeforeUnload = async () => {
      const userId = await getCurrentUserId();
      if (userId) {
        await saveUserDataToStorage(userId);
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      clearInterval(saveInterval);
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [currentUserId]);

  // 앱 준비 완료 확인 (스플래시 대기 제거)
  const [appIsReady, setAppIsReady] = useState(false);

  useEffect(() => {
    if (fontsLoaded && initialRoute) {
      setAppIsReady(true);
      // 스플래시 최소 2초 표시 후 숨김
      const splashTimeout = setTimeout(() => {
        SplashScreen.hideAsync().catch(() => { });
      }, 2000);
      return () => clearTimeout(splashTimeout);
    }
  }, [fontsLoaded, initialRoute]);

  // 앱 준비 완료 전 로딩 화면 표시
  if (!appIsReady) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#000020' }}>
        <ActivityIndicator size="large" color="#FFFFFF" />
      </View>
    );
  }
  // 네비게이션 레퍼런스
  const navigationRef = React.useRef(null);

  // 네비게이션 준비되면 딥링크 서비스에 연결
  React.useEffect(() => {
    if (navigationRef.current) {
      deepLinkService.setNavigationRef(navigationRef.current);
    }
  }, [navigationRef.current]);

  // Web wrapper for centering
  const content = (
    <ErrorBoundary>
      <SafeAreaProvider>
        <StatusBar barStyle="light-content" backgroundColor="#000000" />
        <NavigationContainer
          ref={navigationRef}
          linking={{
            prefixes: ['orbit://', 'https://theinnercircle.app'],
            config: {
              screens: {
                Onboarding: 'onboarding',
                MainTabs: {
                  screens: {
                    Home: 'home',
                    Log: 'log',
                    Chat: 'chat',
                    Profile: 'profile',
                  }
                },
                // Match: 'match', // Legacy - removed
                CouplesMission: {
                  screens: {
                    Home: 'couples-mission/Home',
                    Log: 'couples-mission/Log',
                    Profile: 'couples-mission/Profile',
                  }
                },
                Settings: 'settings',

                SpecialMissionIntro: 'special-mission-intro',
              }
            }
          }}>
          <Stack.Navigator
            initialRouteName={initialRoute}
            screenOptions={{
              headerShown: false,
              cardStyle: { backgroundColor: '#000' },
              presentation: 'card',
            }}
          >
            <Stack.Screen name="Onboarding" component={OnboardingScreen} />
            <Stack.Screen name="MainTabs" component={TabNavigator} />
            {/* MatchScreen removed - legacy code moved to _archived */}
            <Stack.Screen name="CouplesMission" component={CoupleTabNavigator} />
            <Stack.Screen name="Settings" component={SettingsScreen} />

            <Stack.Screen name="SpecialMissionIntro" component={SpecialMissionIntroScreen} />
            <Stack.Screen name="Connections" component={ConnectionsScreen} />
          </Stack.Navigator>
          {__DEV__ && <DevPanel />}
        </NavigationContainer>
      </SafeAreaProvider>
    </ErrorBoundary>
  );

  // Apply web centering wrapper
  if (Platform.OS === 'web') {
    return (
      <View style={{ flex: 1, backgroundColor: '#000020', alignItems: 'center' }}>
        <View style={webContainerStyle}>
          {content}
        </View>
      </View>
    );
  }

  return content;
}
