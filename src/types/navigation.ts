import { StackNavigationProp } from '@react-navigation/stack';
import { RouteProp } from '@react-navigation/native';

export type RootStackParamList = {
    Onboarding: undefined;
    Home: {
        name?: string;
        deficit?: string;
        profile?: {
            name: string;
            gender: string;
            age: string;
            location: string;
            idealType: string;
            hobbies: string;
            job: string;
            growth: string;
            complex: string;
            deficit: string;
        };
    };
    Match: { deficit?: string; reviewMode?: boolean };
    Matching: undefined;
    CouplesMission: undefined;
    Settings: undefined;
    Admin: undefined;
    UserList: undefined;
};


export type HomeScreenNavigationProp = StackNavigationProp<RootStackParamList, 'Home'>;
export type HomeScreenRouteProp = RouteProp<RootStackParamList, 'Home'>;

export type OnboardingScreenNavigationProp = StackNavigationProp<RootStackParamList, 'Onboarding'>;

export type MatchScreenNavigationProp = StackNavigationProp<RootStackParamList, 'Match'>;
export type MatchScreenRouteProp = RouteProp<RootStackParamList, 'Match'>;

export type CouplesMissionScreenNavigationProp = StackNavigationProp<RootStackParamList, 'CouplesMission'>;

export type SettingsScreenNavigationProp = StackNavigationProp<RootStackParamList, 'Settings'>;
