const axios = require('axios');

async function testServer() {
    try {
        console.log('Testing Server Connection...');
        const response = await axios.post('http://127.0.0.1:3000/api/analysis/profile', {
            name: '테스터',
            gender: '남성',
            age: 30,
            job: '개발자',
            location: '서울',
            idealType: '성실함',
            hobbies: '독서',
            growthGoal: '평온',
            complex: '완벽주의',
            deficit: '외로움'
        });

        console.log('Server Response Status:', response.status);
        console.log('Server Response Data:', JSON.stringify(response.data, null, 2));

        if (response.data.success && response.data.analysis && !response.data.analysis.includes('AI 연결 실패')) {
            console.log('SUCCESS: Real AI Analysis Received!');
        } else {
            console.log('FAILURE: Server returned fallback or error.');
        }

    } catch (error) {
        console.error('HTTP Request Failed:', error.message);
        if (error.response) {
            console.error('Response Status:', error.response.status);
            console.error('Response Data Preview:', typeof error.response.data === 'string' ? error.response.data.substring(0, 500) : JSON.stringify(error.response.data));
        }
    }
}

testServer();
