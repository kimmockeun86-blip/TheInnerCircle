/**
 * journals 컬렉션에서 이미지 URL 확인
 */

require('dotenv').config();
const admin = require('firebase-admin');

let serviceAccount;
try {
    serviceAccount = require('./serviceAccountKey.json');
} catch (e) {
    console.error('serviceAccountKey.json not found');
    process.exit(1);
}

admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    storageBucket: "orbit-920a0.firebasestorage.app"
});

const db = admin.firestore();

async function checkJournals() {
    console.log('🔍 journals 컬렉션 확인 중...\n');

    try {
        const journalsSnapshot = await db.collection('journals')
            .orderBy('createdAt', 'desc')
            .limit(20)
            .get();

        console.log(`📊 최근 ${journalsSnapshot.size}개의 수행기록:\n`);

        journalsSnapshot.forEach(doc => {
            const data = doc.data();
            console.log(`ID: ${doc.id}`);
            console.log(`  - uid: ${data.uid || '없음'}`);
            console.log(`  - day: ${data.day || '없음'}`);
            console.log(`  - imageUrl: ${data.imageUrl || '없음'}`);
            console.log(`  - imageUri: ${data.imageUri || '없음'}`);
            console.log(`  - createdAt: ${data.createdAt?.toDate?.() || data.createdAt || '없음'}`);
            console.log('---');
        });

    } catch (error) {
        console.error('❌ 조회 오류:', error);
    }

    process.exit(0);
}

checkJournals();
