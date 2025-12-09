import 'react-native-gesture-handler';
import React from 'react';
import { StatusBar, View, ActivityIndicator } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useFonts, Orbitron_400Regular, Orbitron_700Bold } from '@expo-google-fonts/orbitron';
import { NotoSansKR_400Regular, NotoSansKR_700Bold } from '@expo-google-fonts/noto-sans-kr';

import OnboardingScreen from './src/screens/OnboardingScreen';
import HomeScreen from './src/screens/HomeScreen';
import ProfileScreen from './src/screens/ProfileScreen';
import AdminScreen from './src/screens/AdminScreen';
import UserListScreen from './src/screens/UserListScreen';
import MatchScreen from './src/screens/MatchScreen';
import ConnectionsScreen from './src/screens/ConnectionsScreen';
import LogScreen from './src/screens/LogScreen';
import CustomTabBar from './src/components/CustomTabBar';

const Stack = createStackNavigator();
const Tab = createBottomTabNavigator();

function HomeTabs() {
  return (
    <Tab.Navigator
      tabBar={props => <CustomTabBar {...props} />}
      screenOptions={{
        headerShown: false,
        tabBarShowLabel: false,
        tabBarStyle: {
          position: 'absolute',
          backgroundColor: 'transparent',
          borderTopWidth: 0,
          elevation: 0,
        }
      }}
    >
      <Tab.Screen name="Home" component={HomeScreen} options={{ title: '홈' }} />
      <Tab.Screen name="Connection" component={ConnectionsScreen} options={{ title: '인연' }} />
      <Tab.Screen name="Log" component={LogScreen} options={{ title: '기록' }} />
      <Tab.Screen name="Profile" component={ProfileScreen} options={{ title: '프로필' }} />
    </Tab.Navigator>
  );
}

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
        <ActivityIndicator size="large" color="#FF00FF" />
      </View>
    );
  }

  return (
    <SafeAreaProvider>
      <StatusBar barStyle="light-content" backgroundColor="#000000" />
      <NavigationContainer linking={{
        prefixes: [],
        config: {
          screens: {
            Onboarding: 'onboarding',
            MainTabs: {
              path: '',
              screens: {
                Home: 'home',
                Connection: 'connection',
                Profile: 'profile',
              }
            },
            Match: 'match',
            Admin: 'admin',
            UserList: 'user-list',
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
          <Stack.Screen name="MainTabs" component={HomeTabs} />
          <Stack.Screen name="Match" component={MatchScreen} />
          <Stack.Screen name="Admin" component={AdminScreen} />
          <Stack.Screen name="UserList" component={UserListScreen} />
        </Stack.Navigator>
      </NavigationContainer>
    </SafeAreaProvider>
  );
}
