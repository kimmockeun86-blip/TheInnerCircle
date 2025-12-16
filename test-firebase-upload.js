// Firebase Test User Creation Script
// Run with: node test-firebase-upload.js

const { initializeApp } = require('firebase/app');
const { getFirestore, doc, setDoc, Timestamp } = require('firebase/firestore');
const { getStorage, ref, uploadBytes, getDownloadURL } = require('firebase/storage');
const fs = require('fs');
const path = require('path');

// Firebase configuration (same as in the app)
const firebaseConfig = {
    apiKey: "AIzaSyAqb7fWb0bCIIbhqIg_eSFEVpzXDxJ2E8c",
    authDomain: "holycircle-d25e8.firebaseapp.com",
    projectId: "holycircle-d25e8",
    storageBucket: "holycircle-d25e8.firebasestorage.app",
    messagingSenderId: "975889208541",
    appId: "1:975889208541:web:c30e71ff7e7f6e8b15f39c"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const storage = getStorage(app);

// Test users data
const testUsers = [
    {
        id: `test_user_${Date.now()}_1`,
        name: '김민준',
        age: 28,
        gender: '남성',
        location: 'Seoul',
        job: '개발자',
        deficit: '내면의 평화',
        dayCount: 1,
        isMatchingActive: true,
        photoFile: 'test_user_photo_1_1765641126852.png'
    },
    {
        id: `test_user_${Date.now()}_2`,
        name: '이서연',
        age: 25,
        gender: '여성',
        location: 'Seoul',
        job: '디자이너',
        deficit: '진정한 연결',
        dayCount: 1,
        isMatchingActive: true,
        photoFile: 'test_user_photo_2_1765641143956.png'
    },
    {
        id: `test_user_${Date.now()}_3`,
        name: '박지훈',
        age: 31,
        gender: '남성',
        location: 'Gyeonggi',
        job: '건축가',
        deficit: '성취감',
        dayCount: 1,
        isMatchingActive: true,
        photoFile: 'test_user_photo_3_1765641161033.png'
    }
];

const artifactsDir = 'C:/Users/mocke/.gemini/antigravity/brain/8cf2b807-a463-4418-84da-8049d8c84452';

async function uploadPhoto(userId, photoFileName) {
    try {
        const photoPath = path.join(artifactsDir, photoFileName);
        console.log(`[Upload] Reading file: ${photoPath}`);

        const fileBuffer = fs.readFileSync(photoPath);
        const imageRef = ref(storage, `profiles/${userId}/photo.jpg`);

        console.log(`[Upload] Uploading to Firebase Storage...`);
        await uploadBytes(imageRef, fileBuffer, { contentType: 'image/png' });

        const downloadURL = await getDownloadURL(imageRef);
        console.log(`[Upload] ✅ Success! URL: ${downloadURL}`);
        return downloadURL;
    } catch (error) {
        console.error(`[Upload] ❌ Failed:`, error.message);
        return null;
    }
}

async function createTestUser(userData) {
    try {
        console.log(`\n${'='.repeat(50)}`);
        console.log(`Creating user: ${userData.name} (${userData.id})`);

        // Upload photo first
        let photoURL = null;
        if (userData.photoFile) {
            photoURL = await uploadPhoto(userData.id, userData.photoFile);
        }

        // Create user profile
        const userProfile = {
            uid: userData.id,
            name: userData.name,
            age: userData.age,
            gender: userData.gender,
            location: userData.location,
            job: userData.job,
            deficit: userData.deficit,
            dayCount: userData.dayCount,
            isMatchingActive: userData.isMatchingActive,
            createdAt: Timestamp.now()
        };

        if (photoURL) {
            userProfile.photoURL = photoURL;
        }

        console.log(`[Firestore] Saving user to database...`);
        await setDoc(doc(db, 'users', userData.id), userProfile);
        console.log(`[Firestore] ✅ User saved successfully!`);

        return { success: true, photoURL };
    } catch (error) {
        console.error(`[Error] Failed to create user:`, error.message);
        return { success: false, error: error.message };
    }
}

async function main() {
    console.log('🔮 Firebase Test User Creation Script');
    console.log('=====================================\n');

    for (const user of testUsers) {
        const result = await createTestUser(user);
        if (result.success) {
            console.log(`✅ ${user.name} created with photo: ${result.photoURL ? 'YES' : 'NO'}`);
        } else {
            console.log(`❌ ${user.name} failed: ${result.error}`);
        }
    }

    console.log('\n=====================================');
    console.log('🎉 Test complete! Check admin dashboard.');
    process.exit(0);
}

main();
