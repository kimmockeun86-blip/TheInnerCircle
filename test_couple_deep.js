const axios = require('axios');

const BASE_URL = 'http://localhost:3000/api';

async function testCoupleAnalysis() {
    console.log('--- Starting Deep Diagnostic Test for Couple Analysis ---');

    const payload = {
        chat: "우리는 오늘 서로의 눈을 바라보며 깊은 대화를 나누었습니다. 서로의 소중함을 다시 한번 느꼈습니다. 앞으로도 영원히 함께하고 싶어요.",
        day: 10,
        isSpecialMission: true
    };

    try {
        console.log('Sending request to:', `${BASE_URL}/analysis/couple-chat`);
        console.log('Payload:', JSON.stringify(payload, null, 2));

        const startTime = Date.now();
        const response = await axios.post(`${BASE_URL}/analysis/couple-chat`, payload);
        const endTime = Date.now();

        console.log(`\nResponse received in ${(endTime - startTime) / 1000}s`);
        console.log('Status:', response.status);
        console.log('Data:', JSON.stringify(response.data, null, 2));

        if (response.data.analysis && response.data.analysis.includes("AI 연결 실패")) {
            console.error('\n[FAILURE] The server returned the FALLBACK analysis.');
        } else if (response.data.feedback && response.data.feedback.includes("AI 피드백 누락")) {
            console.error('\n[FAILURE] The server returned the FALLBACK feedback.');
        } else {
            console.log('\n[SUCCESS] The server returned a generated analysis.');
        }

    } catch (error) {
        console.error('\n[ERROR] Request failed:', error.message);
        if (error.response) {
            console.error('Server responded with:', error.response.status, error.response.data);
        }
    }
}

testCoupleAnalysis();
