const axios = require('axios');

async function testProfileAnalysis() {
    try {
        const response = await axios.post('http://localhost:3000/api/analysis/profile', {
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
        console.log('Success:', response.data);
    } catch (error) {
        console.error('Error:', error.response ? error.response.data : error.message);
    }
}

testProfileAnalysis();
