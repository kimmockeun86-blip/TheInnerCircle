import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import HomeScreen from '../screens/HomeScreen';
import LogScreen from '../screens/LogScreen';
import ConnectionsScreen from '../screens/ConnectionsScreen';
import ProfileScreen from '../screens/ProfileScreen';
import CustomTabBar from '../components/CustomTabBar';

const Tab = createBottomTabNavigator();

const TabNavigator = () => {
    return (
        <Tab.Navigator
            id="MainTabs"
            tabBar={props => <CustomTabBar {...props} />}
            screenOptions={{
                headerShown: false,
                tabBarShowLabel: true,
                tabBarStyle: {
                    position: 'absolute',
                    bottom: 0,
                    left: 0,
                    right: 0,
                    elevation: 0,
                    backgroundColor: 'transparent',
                    borderTopWidth: 0,
                }
            }}
            initialRouteName="Home"
        >
            <Tab.Screen
                name="Home"
                component={HomeScreen}
                options={{
                    title: '홈',
                    tabBarLabel: 'HOME'
                }}
            />
            <Tab.Screen
                name="Log"
                component={LogScreen}
                options={{
                    title: '기록',
                    tabBarLabel: 'LOG'
                }}
            />
            <Tab.Screen
                name="Profile"
                component={ProfileScreen}
                options={{
                    title: '프로필',
                    tabBarLabel: 'SETTINGS'
                }}
            />
        </Tab.Navigator>
    );
};

export default TabNavigator;
