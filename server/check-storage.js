/**
 * Firebase Storage 전체 구조 확인
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

const bucket = admin.storage().bucket();

async function checkStorage() {
    console.log('🔍 Firebase Storage 전체 구조 확인 중...\n');

    try {
        // 모든 파일 확인
        const [files] = await bucket.getFiles({ maxResults: 100 });

        console.log(`📊 총 ${files.length}개의 파일 발견:\n`);

        // 폴더별로 정리
        const folders = {};
        for (const file of files) {
            const parts = file.name.split('/');
            const folder = parts[0];
            if (!folders[folder]) {
                folders[folder] = [];
            }
            folders[folder].push(file.name);
        }

        for (const [folder, fileList] of Object.entries(folders)) {
            console.log(`📁 ${folder}/ (${fileList.length}개)`);
            for (const f of fileList.slice(0, 5)) {
                console.log(`   - ${f}`);
            }
            if (fileList.length > 5) {
                console.log(`   ... 외 ${fileList.length - 5}개`);
            }
        }

    } catch (error) {
        console.error('❌ Storage 조회 오류:', error);
    }

    process.exit(0);
}

checkStorage();
