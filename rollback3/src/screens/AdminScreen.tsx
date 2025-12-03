import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, SafeAreaView, KeyboardAvoidingView, Platform } from 'react-native';
import { api } from '../services/api';
import { StackNavigationProp } from '@react-navigation/stack';

interface AdminScreenProps {
    navigation: StackNavigationProp<any>;
}

const AdminScreen: React.FC<AdminScreenProps> = ({ navigation }) => {
    const [userId, setUserId] = useState('');
    const [missionText, setMissionText] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const handleAssignMission = async () => {
        if (!userId || !missionText) {
            Alert.alert('오류', '사용자 ID와 미션 내용을 모두 입력해주세요.');
            return;
        }

        setIsLoading(true);
        try {
            const response = await api.assignMission(userId, missionText);
            if (response.success) {
                Alert.alert('성공', '미션이 성공적으로 할당되었습니다.');
                setMissionText(''); // Clear mission text, keep user ID for convenience
            } else {
                Alert.alert('실패', response.message || '미션 할당에 실패했습니다.');
            }
        } catch (error) {
            Alert.alert('오류', '서버 통신 중 문제가 발생했습니다.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <SafeAreaView style={styles.container}>
            <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.content}>
                <View style={styles.header}>
                    <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                        <Text style={styles.backButtonText}>← 뒤로</Text>
                    </TouchableOpacity>
                    <Text style={styles.title}>관리자 대시보드</Text>
                </View>

                <View style={styles.form}>
                    <Text style={styles.label}>대상 사용자 ID</Text>
                    <TextInput
                        style={styles.input}
                        placeholder="User ID (예: User_123)"
                        placeholderTextColor="#666"
                        value={userId}
                        onChangeText={setUserId}
                    />

                    <Text style={styles.label}>강제 할당할 미션</Text>
                    <TextInput
                        style={[styles.input, styles.textArea]}
                        placeholder="미션 내용을 입력하세요..."
                        placeholderTextColor="#666"
                        value={missionText}
                        onChangeText={setMissionText}
                        multiline
                        textAlignVertical="top"
                    />

                    <TouchableOpacity
                        style={[styles.button, isLoading && styles.buttonDisabled]}
                        onPress={handleAssignMission}
                        disabled={isLoading}
                    >
                        <Text style={styles.buttonText}>{isLoading ? '처리 중...' : '미션 강제 부여'}</Text>
                    </TouchableOpacity>
                </View>

                <TouchableOpacity
                    style={[styles.button, { backgroundColor: '#333', marginTop: 20 }]}
                    onPress={() => navigation.navigate('UserList')}
                >
                    <Text style={styles.buttonText}>사용자 목록 보기</Text>
                </TouchableOpacity>

                <View style={styles.infoBox}>
                    <Text style={styles.infoText}>⚠️ 주의: 이 기능은 테스트 및 관리 목적입니다. 실제 사용자에게 영향을 줄 수 있습니다.</Text>
                </View>
            </KeyboardAvoidingView>
        </SafeAreaView >
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#000',
    },
    content: {
        flex: 1,
        padding: 20,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 30,
        marginTop: 10,
    },
    backButton: {
        padding: 10,
        marginRight: 10,
    },
    backButtonText: {
        color: '#fff',
        fontSize: 16,
    },
    title: {
        color: '#FFD700',
        fontSize: 24,
        fontWeight: 'bold',
    },
    form: {
        flex: 1,
    },
    label: {
        color: '#ccc',
        fontSize: 16,
        marginBottom: 8,
        fontWeight: '600',
    },
    input: {
        backgroundColor: '#1a1a1a',
        borderWidth: 1,
        borderColor: '#333',
        borderRadius: 8,
        padding: 15,
        color: '#fff',
        fontSize: 16,
        marginBottom: 20,
    },
    textArea: {
        height: 120,
    },
    button: {
        backgroundColor: '#FF4500',
        padding: 18,
        borderRadius: 10,
        alignItems: 'center',
        marginTop: 10,
    },
    buttonDisabled: {
        backgroundColor: '#555',
    },
    buttonText: {
        color: '#fff',
        fontSize: 18,
        fontWeight: 'bold',
    },
    infoBox: {
        marginTop: 20,
        padding: 15,
        backgroundColor: 'rgba(255, 69, 0, 0.1)',
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#FF4500',
    },
    infoText: {
        color: '#FF6347',
        fontSize: 14,
        textAlign: 'center',
    },
});

export default AdminScreen;
