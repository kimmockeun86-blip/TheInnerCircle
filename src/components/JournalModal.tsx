import React from 'react';
import { View, Modal, Text, TextInput, TouchableOpacity, Image, StyleSheet, ImageStyle, Platform, Alert, KeyboardAvoidingView, TouchableWithoutFeedback, Keyboard, ScrollView } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import GlassCard from './GlassCard';
import HolyButton from './HolyButton';
import { COLORS } from '../theme/theme';

interface JournalModalProps {
    visible: boolean;
    onClose: () => void;
    onSubmit: () => void;
    journalInput: string;
    onJournalInputChange: (text: string) => void;
    selectedImage: string | null;
    onSelectImage: (uri: string) => void;
    isSubmitting: boolean;
    title?: string;
    subtitle?: string;
}

/**
 * JournalModal 컴포넌트
 * 사용자가 일일 미션 수행 기록을 작성하는 모달
 */
const JournalModal: React.FC<JournalModalProps> = ({
    visible,
    onClose,
    onSubmit,
    journalInput,
    onJournalInputChange,
    selectedImage,
    onSelectImage,
    isSubmitting,
    title = "오늘의 수행 기록",
    subtitle = "오늘의 미션을 수행하며 느낀 점을 기록해주세요."
}) => {

    // iOS 키보드 닫기 핸들러
    const dismissKeyboard = () => {
        Keyboard.dismiss();
    };

    const pickImage = async () => {
        // 이미지 선택 전 키보드 닫기
        dismissKeyboard();

        if (Platform.OS === 'web') {
            const input = document.createElement('input');
            input.type = 'file';
            input.accept = 'image/*';
            input.onchange = (e: any) => {
                const file = e.target.files[0];
                if (file) {
                    const reader = new FileReader();
                    reader.onload = (event: any) => {
                        onSelectImage(event.target.result);
                    };
                    reader.readAsDataURL(file);
                }
            };
            input.click();
        } else {
            Alert.alert(
                "사진 추가",
                "사진을 가져올 방법을 선택하세요.",
                [
                    {
                        text: "카메라로 촬영",
                        onPress: async () => {
                            const { status } = await ImagePicker.requestCameraPermissionsAsync();
                            if (status !== 'granted') {
                                Alert.alert('권한 필요', '카메라 접근 권한이 필요합니다.');
                                return;
                            }
                            const result = await ImagePicker.launchCameraAsync({
                                mediaTypes: ImagePicker.MediaTypeOptions.Images,
                                allowsEditing: false,
                                aspect: [4, 3],
                                quality: 0.8,
                            });
                            if (!result.canceled) {
                                onSelectImage(result.assets[0].uri);
                            }
                        }
                    },
                    {
                        text: "앨범에서 선택",
                        onPress: async () => {
                            const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
                            if (status !== 'granted') {
                                Alert.alert('권한 필요', '앨범 접근 권한이 필요합니다.');
                                return;
                            }
                            const result = await ImagePicker.launchImageLibraryAsync({
                                mediaTypes: ImagePicker.MediaTypeOptions.Images,
                                allowsEditing: false,
                                aspect: [4, 3],
                                quality: 0.8,
                            });
                            if (!result.canceled) {
                                onSelectImage(result.assets[0].uri);
                            }
                        }
                    },
                    { text: "취소", style: "cancel" }
                ]
            );
        }
    };

    return (
        <Modal visible={visible} animationType="slide" transparent={true}>
            <KeyboardAvoidingView
                style={styles.modalOverlay}
                behavior={Platform.OS === 'ios' ? 'padding' : undefined}
                keyboardVerticalOffset={Platform.OS === 'ios' ? 60 : 0}
            >
                <TouchableWithoutFeedback onPress={dismissKeyboard} accessible={false}>
                    <ScrollView
                        contentContainerStyle={styles.scrollContent}
                        keyboardShouldPersistTaps="handled"
                        showsVerticalScrollIndicator={false}
                        bounces={false}
                        onScrollBeginDrag={dismissKeyboard}
                    >
                        <TouchableWithoutFeedback onPress={dismissKeyboard}>
                            <GlassCard style={styles.modalContent}>
                                <Text style={styles.modalTitle}>{title}</Text>
                                <Text style={styles.modalSubtitle}>{subtitle}</Text>

                                <TextInput
                                    style={styles.journalInput}
                                    placeholder="내면의 목소리를 이곳에 담아주세요..."
                                    placeholderTextColor="#666"
                                    multiline
                                    value={journalInput}
                                    onChangeText={onJournalInputChange}
                                    returnKeyType="done"
                                    blurOnSubmit={true}
                                    onSubmitEditing={dismissKeyboard}
                                />

                                <TouchableOpacity onPress={pickImage} style={styles.imagePickerButton}>
                                    <Text style={styles.imagePickerText}>
                                        {selectedImage ? "📷 사진 변경하기" : "📷 오늘의 미소를 기록하세요"}
                                    </Text>
                                </TouchableOpacity>

                                {selectedImage && (
                                    <Image source={{ uri: selectedImage }} style={styles.previewImage as ImageStyle} />
                                )}

                                <View style={styles.modalButtons}>
                                    <HolyButton
                                        title="취소"
                                        onPress={() => { dismissKeyboard(); onClose(); }}
                                        variant="ghost"
                                        style={{ minWidth: 100, paddingHorizontal: 20 }}
                                    />
                                    <HolyButton
                                        title={isSubmitting ? "전송 중..." : "기록 완료"}
                                        onPress={() => { dismissKeyboard(); onSubmit(); }}
                                        disabled={isSubmitting}
                                        style={{ minWidth: 100, paddingHorizontal: 20 }}
                                    />
                                </View>
                            </GlassCard>
                        </TouchableWithoutFeedback>
                    </ScrollView>
                </TouchableWithoutFeedback>
            </KeyboardAvoidingView>
        </Modal>
    );
};

const styles = StyleSheet.create({
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.85)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    scrollContent: {
        flexGrow: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingVertical: 20,
    },
    modalContent: {
        width: '100%',
        maxWidth: 400,
        padding: 25,
        alignItems: 'center',
    },
    modalTitle: {
        color: COLORS.gold,
        fontSize: 22,
        fontWeight: 'bold',
        marginBottom: 10,
        textAlign: 'center',
    },
    modalSubtitle: {
        color: '#888',
        fontSize: 14,
        marginBottom: 20,
        textAlign: 'center',
        lineHeight: 20,
    },
    journalInput: {
        width: '100%',
        height: 150,
        backgroundColor: 'rgba(0, 0, 0, 0.3)',
        borderRadius: 12,
        padding: 15,
        color: '#fff',
        fontSize: 16,
        textAlignVertical: 'top',
        borderWidth: 1,
        borderColor: 'rgba(255, 215, 0, 0.3)',
    },
    imagePickerButton: {
        marginTop: 15,
        padding: 12,
        backgroundColor: 'rgba(255, 255, 255, 0.05)',
        borderRadius: 10,
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.1)',
        borderStyle: 'dashed',
        width: '100%',
        alignItems: 'center',
    },
    imagePickerText: {
        color: '#888',
        fontSize: 14,
    },
    previewImage: {
        width: 100,
        height: 100,
        borderRadius: 10,
        marginTop: 10,
    },
    modalButtons: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginTop: 20,
        width: '100%',
        gap: 15,
    },
});

export default JournalModal;
