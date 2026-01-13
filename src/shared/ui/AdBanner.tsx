// AdBanner.tsx - 배너 광고 컴포넌트
// dayCount >= 7이고 광고 제거 미구매 시에만 표시

import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Platform, TouchableOpacity } from 'react-native';
import AdService from '../services/AdService';

interface AdBannerProps {
    style?: object;
    testMode?: boolean;
}

const AdBanner: React.FC<AdBannerProps> = ({ style, testMode = true }) => {
    const [shouldShow, setShouldShow] = useState(false);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        checkAdVisibility();
    }, []);

    const checkAdVisibility = async () => {
        const show = await AdService.shouldShowAds();
        setShouldShow(show);
        setIsLoading(false);
    };

    // 웹이나 광고 미표시 조건이면 렌더링 안함
    if (Platform.OS === 'web' || !shouldShow || isLoading) {
        return null;
    }

    // 테스트 모드: 실제 광고 대신 플레이스홀더 표시
    // TODO: 실제 광고 라이브러리 연동 시 아래 코드로 교체
    // import { BannerAd, BannerAdSize } from 'react-native-google-mobile-ads';
    // return (
    //     <BannerAd
    //         unitId={AdService.getBannerAdUnitId()}
    //         size={BannerAdSize.ANCHORED_ADAPTIVE_BANNER}
    //     />
    // );

    if (testMode) {
        return (
            <View style={[styles.container, style]}>
                <View style={styles.placeholderBanner}>
                    <Text style={styles.placeholderText}>광고 영역</Text>
                    <Text style={styles.placeholderSubtext}>TEST MODE</Text>
                </View>
            </View>
        );
    }

    return (
        <View style={[styles.container, style]}>
            {/* 실제 광고 컴포넌트 */}
            <View style={styles.adBanner}>
                <Text style={styles.adText}>광고</Text>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        width: '100%',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 5,
        backgroundColor: 'transparent',
    },
    placeholderBanner: {
        width: '100%',
        height: 50,
        backgroundColor: 'rgba(255, 255, 255, 0.1)',
        borderRadius: 8,
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.2)',
        borderStyle: 'dashed',
        justifyContent: 'center',
        alignItems: 'center',
    },
    placeholderText: {
        color: 'rgba(255, 255, 255, 0.5)',
        fontSize: 12,
        fontWeight: '600',
    },
    placeholderSubtext: {
        color: 'rgba(255, 255, 255, 0.3)',
        fontSize: 10,
        marginTop: 2,
    },
    adBanner: {
        width: '100%',
        height: 50,
        backgroundColor: '#222',
        justifyContent: 'center',
        alignItems: 'center',
    },
    adText: {
        color: '#888',
        fontSize: 10,
    },
});

export default AdBanner;
