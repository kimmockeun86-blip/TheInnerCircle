// Firebase Storage Service for ORBIT App
import { storage } from '../config/firebase';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';

class StorageService {
    /**
     * Upload profile photo to Firebase Storage
     * @param userId - User's unique ID
     * @param imageUri - Local image URI
     * @returns Download URL of uploaded image
     */
    async uploadProfilePhoto(userId: string, imageUri: string): Promise<string | null> {
        try {
            // Create a reference to the file location
            const imageRef = ref(storage, `profiles/${userId}/photo.jpg`);

            // Fetch the image as a blob
            const response = await fetch(imageUri);
            const blob = await response.blob();

            // Upload the blob
            await uploadBytes(imageRef, blob);

            // Get the download URL
            const downloadURL = await getDownloadURL(imageRef);
            console.log('[StorageService] 프로필 사진 업로드 완료:', downloadURL);

            return downloadURL;
        } catch (error) {
            console.error('[StorageService] 프로필 사진 업로드 실패:', error);
            return null;
        }
    }

    /**
     * Upload journal image to Firebase Storage
     * @param userId - User's unique ID
     * @param dayCount - Current day count
     * @param imageUri - Local image URI
     * @returns Download URL of uploaded image
     */
    async uploadJournalImage(userId: string, dayCount: number, imageUri: string): Promise<string | null> {
        try {
            const timestamp = Date.now();
            const imageRef = ref(storage, `journals/${userId}/day${dayCount}_${timestamp}.jpg`);

            const response = await fetch(imageUri);
            const blob = await response.blob();

            await uploadBytes(imageRef, blob);

            const downloadURL = await getDownloadURL(imageRef);
            console.log('[StorageService] 저널 이미지 업로드 완료:', downloadURL);

            return downloadURL;
        } catch (error) {
            console.error('[StorageService] 저널 이미지 업로드 실패:', error);
            return null;
        }
    }
}

export default new StorageService();
