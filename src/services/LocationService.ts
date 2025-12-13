// Location Service - GPS 위치 기반 서비스
import * as Location from 'expo-location';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Alert, Platform } from 'react-native';

export interface UserLocation {
    latitude: number;
    longitude: number;
    updatedAt: string;
}

class LocationService {
    private static instance: LocationService;

    private constructor() { }

    static getInstance(): LocationService {
        if (!LocationService.instance) {
            LocationService.instance = new LocationService();
        }
        return LocationService.instance;
    }

    // 위치 권한 요청
    async requestPermission(): Promise<boolean> {
        try {
            const { status } = await Location.requestForegroundPermissionsAsync();
            if (status !== 'granted') {
                Alert.alert(
                    '위치 권한 필요',
                    '매칭 서비스를 이용하려면 위치 권한이 필요합니다.',
                    [{ text: '확인' }]
                );
                return false;
            }
            return true;
        } catch (error) {
            console.error('Location permission error:', error);
            return false;
        }
    }

    // 현재 위치 가져오기
    async getCurrentLocation(): Promise<UserLocation | null> {
        try {
            const hasPermission = await this.requestPermission();
            if (!hasPermission) return null;

            const location = await Location.getCurrentPositionAsync({
                accuracy: Location.Accuracy.Balanced,
            });

            const userLocation: UserLocation = {
                latitude: location.coords.latitude,
                longitude: location.coords.longitude,
                updatedAt: new Date().toISOString()
            };

            // 로컬 저장
            await AsyncStorage.setItem('userLocation', JSON.stringify(userLocation));

            console.log('[LocationService] 위치 업데이트:', userLocation);
            return userLocation;
        } catch (error) {
            console.error('Get location error:', error);
            return null;
        }
    }

    // 저장된 위치 가져오기
    async getSavedLocation(): Promise<UserLocation | null> {
        try {
            const saved = await AsyncStorage.getItem('userLocation');
            if (saved) {
                return JSON.parse(saved);
            }
            return null;
        } catch (error) {
            console.error('Get saved location error:', error);
            return null;
        }
    }

    // 두 좌표 간 거리 계산 (km) - Haversine 공식
    calculateDistance(
        lat1: number,
        lon1: number,
        lat2: number,
        lon2: number
    ): number {
        const R = 6371; // 지구 반지름 (km)
        const dLat = this.toRad(lat2 - lat1);
        const dLon = this.toRad(lon2 - lon1);

        const a =
            Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(this.toRad(lat1)) * Math.cos(this.toRad(lat2)) *
            Math.sin(dLon / 2) * Math.sin(dLon / 2);

        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        const distance = R * c;

        return Math.round(distance * 10) / 10; // 소수점 1자리
    }

    private toRad(deg: number): number {
        return deg * (Math.PI / 180);
    }

    // 거리를 한글로 표시
    formatDistance(km: number): string {
        if (km < 1) {
            return `${Math.round(km * 1000)}m`;
        } else if (km < 10) {
            return `${km.toFixed(1)}km`;
        } else {
            return `${Math.round(km)}km`;
        }
    }
}

export default LocationService.getInstance();
