// PermissionService.ts - 모든 권한 통합 관리 서비스
import { Platform, Alert } from 'react-native';
import * as Location from 'expo-location';
import * as Notifications from 'expo-notifications';
import * as ImagePicker from 'expo-image-picker';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface PermissionStatus {
    location: boolean;
    notification: boolean;
    camera: boolean;
    mediaLibrary: boolean;
}

class PermissionService {
    private static instance: PermissionService;

    static getInstance(): PermissionService {
        if (!PermissionService.instance) {
            PermissionService.instance = new PermissionService();
        }
        return PermissionService.instance;
    }

    // 모든 권한 상태 확인
    async checkAllPermissions(): Promise<PermissionStatus> {
        const status: PermissionStatus = {
            location: false,
            notification: false,
            camera: false,
            mediaLibrary: false,
        };

        try {
            // 위치 권한 확인
            const locationStatus = await Location.getForegroundPermissionsAsync();
            status.location = locationStatus.status === 'granted';

            // 알림 권한 확인 (웹 제외)
            if (Platform.OS !== 'web') {
                const notificationStatus = await Notifications.getPermissionsAsync();
                status.notification = notificationStatus.status === 'granted';
            }

            // 카메라 권한 확인
            const cameraStatus = await ImagePicker.getCameraPermissionsAsync();
            status.camera = cameraStatus.status === 'granted';

            // 미디어 라이브러리 권한 확인
            const mediaStatus = await ImagePicker.getMediaLibraryPermissionsAsync();
            status.mediaLibrary = mediaStatus.status === 'granted';
        } catch (e) {
            console.log('[PermissionService] 권한 상태 확인 실패:', e);
        }

        return status;
    }

    // 모든 권한 한번에 요청
    async requestAllPermissions(): Promise<PermissionStatus> {
        console.log('[PermissionService] 모든 권한 요청 시작...');

        const status: PermissionStatus = {
            location: false,
            notification: false,
            camera: false,
            mediaLibrary: false,
        };

        // 1. 위치 권한 요청
        try {
            console.log('[PermissionService] 위치 권한 요청...');
            const { status: locationStatus } = await Location.requestForegroundPermissionsAsync();
            status.location = locationStatus === 'granted';
            console.log('[PermissionService] 위치 권한:', status.location ? '허용' : '거부');
        } catch (e) {
            console.log('[PermissionService] 위치 권한 요청 실패:', e);
        }

        // 2. 알림 권한 요청 (웹 제외)
        if (Platform.OS !== 'web') {
            try {
                console.log('[PermissionService] 알림 권한 요청...');
                const { status: notificationStatus } = await Notifications.requestPermissionsAsync();
                status.notification = notificationStatus === 'granted';
                console.log('[PermissionService] 알림 권한:', status.notification ? '허용' : '거부');
            } catch (e) {
                console.log('[PermissionService] 알림 권한 요청 실패:', e);
            }
        }

        // 3. 카메라 권한 요청
        try {
            console.log('[PermissionService] 카메라 권한 요청...');
            const { status: cameraStatus } = await ImagePicker.requestCameraPermissionsAsync();
            status.camera = cameraStatus === 'granted';
            console.log('[PermissionService] 카메라 권한:', status.camera ? '허용' : '거부');
        } catch (e) {
            console.log('[PermissionService] 카메라 권한 요청 실패:', e);
        }

        // 4. 미디어 라이브러리 권한 요청
        try {
            console.log('[PermissionService] 미디어 라이브러리 권한 요청...');
            const { status: mediaStatus } = await ImagePicker.requestMediaLibraryPermissionsAsync();
            status.mediaLibrary = mediaStatus === 'granted';
            console.log('[PermissionService] 미디어 라이브러리 권한:', status.mediaLibrary ? '허용' : '거부');
        } catch (e) {
            console.log('[PermissionService] 미디어 라이브러리 권한 요청 실패:', e);
        }

        // 권한 요청 완료 기록
        await AsyncStorage.setItem('permissionsRequested', 'true');
        await AsyncStorage.setItem('permissionStatus', JSON.stringify(status));

        console.log('[PermissionService] 모든 권한 요청 완료:', status);
        return status;
    }

    // 권한 요청 여부 확인
    async hasRequestedPermissions(): Promise<boolean> {
        const requested = await AsyncStorage.getItem('permissionsRequested');
        return requested === 'true';
    }

    // 거부된 권한에 대한 안내 표시
    showPermissionDeniedAlert(deniedPermissions: string[]): void {
        if (deniedPermissions.length === 0) return;

        const permissionNames: { [key: string]: string } = {
            location: '위치',
            notification: '알림',
            camera: '카메라',
            mediaLibrary: '사진 앨범'
        };

        const deniedNames = deniedPermissions.map(p => permissionNames[p] || p).join(', ');

        Alert.alert(
            '권한 안내',
            `다음 권한이 거부되었습니다: ${deniedNames}\n\n일부 기능이 제한될 수 있습니다. 설정에서 권한을 변경할 수 있습니다.`,
            [{ text: '확인' }]
        );
    }
}

export default PermissionService.getInstance();
