/**
 * 기존 수행기록을 최상위 journals 컬렉션으로 마이그레이션
 * users/{userId}/journals → journals
 */

require('dotenv').config();
const admin = require('firebase-admin');

// Firebase 초기화
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

async function migrateJournals() {
    console.log('🚀 수행기록 마이그레이션 시작...\n');

    try {
        // 1. 모든 사용자 가져오기
        const usersSnapshot = await db.collection('users').get();
        console.log(`📊 총 ${usersSnapshot.size}명의 사용자 발견\n`);

        let totalMigrated = 0;
        let totalSkipped = 0;

        // 2. 각 사용자의 journals 서브컬렉션 조회
        for (const userDoc of usersSnapshot.docs) {
            const userId = userDoc.id;
            const userData = userDoc.data();
            const userName = userData.name || userId;

            // 사용자의 journals 서브컬렉션 가져오기
            const journalsSnapshot = await db.collection('users').doc(userId)
                .collection('journals').get();

            if (journalsSnapshot.empty) {
                continue;
            }

            console.log(`👤 [${userName}] ${journalsSnapshot.size}개의 수행기록 발견`);

            for (const journalDoc of journalsSnapshot.docs) {
                const journalData = journalDoc.data();

                // 이미 최상위 journals에 있는지 확인
                const existingQuery = await db.collection('journals')
                    .where('uid', '==', userId)
                    .where('day', '==', journalData.day)
                    .limit(1)
                    .get();

                if (!existingQuery.empty) {
                    totalSkipped++;
                    continue;
                }

                // 최상위 journals 컬렉션에 추가
                await db.collection('journals').add({
                    ...journalData,
                    uid: userId,
                    userId: userId,
                    imageUri: journalData.imageUrl || journalData.imageUri || null,
                    date: journalData.date || new Date().toLocaleDateString('ko-KR'),
                    migratedAt: new Date()
                });

                totalMigrated++;
                console.log(`   ✅ Day ${journalData.day} 마이그레이션 완료`);
            }
        }

        console.log('\n========================================');
        console.log(`✅ 마이그레이션 완료!`);
        console.log(`   - 마이그레이션됨: ${totalMigrated}개`);
        console.log(`   - 스킵됨 (이미 존재): ${totalSkipped}개`);
        console.log('========================================\n');

    } catch (error) {
        console.error('❌ 마이그레이션 오류:', error);
    }

    process.exit(0);
}

migrateJournals();
