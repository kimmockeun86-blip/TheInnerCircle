const axios = require('axios');

async function testCoupleAnalysis() {
    console.log('Testing Couple Analysis API...');
    try {
        const response = await axios.post('http://127.0.0.1:3001/api/analysis/couple-chat', {
            chat: "This is a test reflection for debugging purposes.",
            day: 1,
            isSpecialMission: false
        });

        console.log('Response status:', response.status);
        console.log('Response data:', response.data);
    } catch (error) {
        console.error('Error:', error.message);
        if (error.response) {
            console.error('Error response:', error.response.data);
        }
    }
}

testCoupleAnalysis();
