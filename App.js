import 'react-native-gesture-handler';
import React from 'react';
import { StatusBar, View, ActivityIndicator, Platform, StyleSheet } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useFonts, Orbitron_400Regular, Orbitron_700Bold } from '@expo-google-fonts/orbitron';
import { NotoSansKR_400Regular, NotoSansKR_700Bold } from '@expo-google-fonts/noto-sans-kr';

import OnboardingScreen from './src/screens/OnboardingScreen';
import HomeScreen from './src/screens/HomeScreen';
import ProfileScreen from './src/screens/ProfileScreen';
import LogScreen from './src/screens/LogScreen';
import AdminScreen from './src/screens/AdminScreen';
import UserListScreen from './src/screens/UserListScreen';
import MatchScreen from './src/screens/MatchScreen';
import ConnectionsScreen from './src/screens/ConnectionsScreen';
import CouplesMissionScreen from './src/screens/CouplesMissionScreen';
import SettingsScreen from './src/screens/SettingsScreen';
import MatchingScreen from './src/screens/MatchingScreen';
import TabNavigator from './src/navigation/TabNavigator';

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

export default function App() {
  console.log('🚀 App Component Mounted! (React Navigation System)');

  let [fontsLoaded] = useFonts({
    Orbitron_400Regular,
    Orbitron_700Bold,
    NotoSansKR_400Regular,
    NotoSansKR_700Bold,
  });

  if (!fontsLoaded) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#000' }}>
        <ActivityIndicator size="large" color="#FFFFFF" />
      </View>
    );
  }

  // Web wrapper for centering
  const content = (
    <SafeAreaProvider>
      <StatusBar barStyle="light-content" backgroundColor="#000000" />
      <NavigationContainer linking={{
        prefixes: [],
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
            Match: 'match',
            CouplesMission: 'couples-mission',
            Settings: 'settings',
            Admin: 'admin',
            UserList: 'user-list',
            Matching: 'matching',
          }
        }
      }}>
        <Stack.Navigator
          initialRouteName="MainTabs"
          screenOptions={{
            headerShown: false,
            cardStyle: { backgroundColor: '#000' },
            presentation: 'card',
          }}
        >
          <Stack.Screen name="Onboarding" component={OnboardingScreen} />
          <Stack.Screen name="MainTabs" component={TabNavigator} />
          <Stack.Screen name="Match" component={MatchScreen} />
          <Stack.Screen name="CouplesMission" component={CouplesMissionScreen} />
          <Stack.Screen name="Settings" component={SettingsScreen} />
          <Stack.Screen name="Admin" component={AdminScreen} />
          <Stack.Screen name="UserList" component={UserListScreen} />
          <Stack.Screen name="Matching" component={MatchingScreen} />
        </Stack.Navigator>
      </NavigationContainer>
    </SafeAreaProvider>
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
