const axios = require('axios');

const BASE_URL = 'http://localhost:3000/api';

async function testCoupleAnalysis() {
    console.log('--- Starting Prompt Verification Test ---');

    // Test Case 1: Special Mission (Day 10)
    const payloadSpecial = {
        chat: "우리는 오늘 서로의 눈을 바라보며 깊은 대화를 나누었습니다. 서로의 소중함을 다시 한번 느꼈습니다.",
        day: 10,
        isSpecialMission: true
    };

    // Test Case 2: Regular Mission (Day 11)
    const payloadRegular = {
        chat: "오늘은 같이 밥을 먹고 산책을 했어. 평범하지만 행복한 하루였어.",
        day: 11,
        isSpecialMission: false
    };

    try {
        console.log('\n[TEST 1] Special Mission (Day 10)');
        const response1 = await axios.post(`${BASE_URL}/analysis/couple-chat`, payloadSpecial);
        const data1 = response1.data;
        if (data1.nextMission) {
            const base64Mission = Buffer.from(data1.nextMission).toString('base64');
            require('fs').writeFileSync('mission_base64.txt', base64Mission);
            console.log('Saved Base64 mission to mission_base64.txt');
        } else {
            console.log('No mission returned.');
        }

        console.log('\n[TEST 2] Regular Mission (Day 11)');
        const response2 = await axios.post(`${BASE_URL}/analysis/couple-chat`, payloadRegular);
        const data2 = response2.data;
        if (data2.nextMission) {
            console.log('Mission (Base64):', Buffer.from(data2.nextMission).toString('base64'));
            console.log('Mission (Decoded):', data2.nextMission);
        } else {
            console.log('No mission returned.');
        }

    } catch (error) {
        console.error('[ERROR]', error.message);
    }
}

testCoupleAnalysis();
