async function delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

async function testEndpoints() {
    const baseUrl = 'http://localhost:3000';

    console.log('==========================================');
    console.log('       STARTING API VERIFICATION');
    console.log('==========================================');

    // 1. Profile Analysis
    console.log('\n[1] Testing Profile Analysis...');
    try {
        const profileRes = await fetch(`${baseUrl}/api/analysis/profile`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                name: '테스트유저',
                gender: '남성',
                age: 30,
                job: '개발자',
                location: '서울',
                idealType: '지혜로운 사람',
                hobbies: '독서',
                growthGoal: '내면의 평화',
                complex: '조급함',
                deficit: '여유'
            })
        });
        const profileData = await profileRes.json();
        console.log('>> Profile Mission:', profileData.recommendedMission);
    } catch (e) {
        console.error('>> Profile Error:', e.message);
    }

    await delay(2000);

    // 2. Journal Analysis
    console.log('\n[2] Testing Journal Analysis...');
    try {
        const journalRes = await fetch(`${baseUrl}/api/analysis/journal`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                userId: 'test_user',
                journalText: '오늘 용기를 내어 친구에게 먼저 연락했다.',
                name: '테스트유저',
                deficit: '용기',
                dayCount: 1
            })
        });
        const journalData = await journalRes.json();
        console.log('>> Journal Mission:', journalData.recommendedMission);
    } catch (e) {
        console.error('>> Journal Error:', e.message);
    }

    await delay(2000);

    // 3. Couple Chat Analysis
    console.log('\n[3] Testing Couple Chat Analysis...');
    try {
        const coupleRes = await fetch(`${baseUrl}/api/analysis/couple-chat`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                user1Name: '테스트유저',
                user2Name: '상대방',
                chatContent: '우리 오늘 뭐 할까? 맛있는 거 먹으러 갈까?'
            })
        });
        const coupleData = await coupleRes.json();
        console.log('>> Couple Mission:', coupleData.nextMission);
    } catch (e) {
        console.error('>> Couple Error:', e.message);
    }

    console.log('\n==========================================');
    console.log('       VERIFICATION COMPLETE');
    console.log('==========================================');
}

testEndpoints();
