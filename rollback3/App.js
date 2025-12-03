import 'react-native-gesture-handler';
import React from 'react';
import { StatusBar } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';

import OnboardingScreen from './src/screens/OnboardingScreen';
import HomeScreen from './src/screens/HomeScreen';
import SettingsScreen from './src/screens/SettingsScreen';
import AdminScreen from './src/screens/AdminScreen';
import UserListScreen from './src/screens/UserListScreen';
import MatchScreen from './src/screens/MatchScreen';
import CouplesMissionScreen from './src/screens/CouplesMissionScreen';

const Stack = createStackNavigator();

export default function App() {
  console.log('🚀 App Component Mounted! (React Navigation System)');

  return (
    <SafeAreaProvider>
      <StatusBar barStyle="light-content" backgroundColor="#000000" />
      <NavigationContainer linking={{
        prefixes: [],
        config: {
          screens: {
            Onboarding: 'onboarding',
            Home: 'home',
            Match: 'match',
            CouplesMission: 'couples-mission',
            Settings: 'settings',
          }
        }
      }}>
        <Stack.Navigator
          initialRouteName="Home"
          screenOptions={{
            headerShown: false,
            cardStyle: { backgroundColor: '#000' },
            presentation: 'card',
          }}
        >
          <Stack.Screen name="Onboarding" component={OnboardingScreen} />
          <Stack.Screen name="Home" component={HomeScreen} />
          <Stack.Screen name="Match" component={MatchScreen} />
          <Stack.Screen name="CouplesMission" component={CouplesMissionScreen} />
          <Stack.Screen name="Settings" component={SettingsScreen} />
          <Stack.Screen name="Admin" component={AdminScreen} />
          <Stack.Screen name="UserList" component={UserListScreen} />
        </Stack.Navigator>
      </NavigationContainer>
    </SafeAreaProvider>
  );
}
