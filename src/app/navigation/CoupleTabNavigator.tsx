import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import CouplesMissionScreen from '../screens/CouplesMissionScreen';
import LogScreen from '../screens/LogScreen';
import ProfileScreen from '../screens/ProfileScreen';
import CustomTabBar from '../components/CustomTabBar';

const Tab = createBottomTabNavigator();

const CoupleTabNavigator = () => {
    return (
        <Tab.Navigator
            id="CoupleTabs"
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
                component={CouplesMissionScreen}
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

export default CoupleTabNavigator;
