const fetch = require('node-fetch');
const fs = require('fs');

const BASE_URL = 'http://localhost:3000';

// Sample chat content for each relationship level
const chatContent = {
    // Level 1: 탐색기 (Day 1-10)
    level1: [
        "오늘 처음 만났다. 설레었다.",
        "눈이 마주쳤다. 어색했지만 좋았다.",
        "가벼운 대화를 나눴다.",
        "연락처를 교환했다.",
        "첫 카톡을 보냈다."
    ],
    // Level 2: 친밀기 (Day 11-20)
    level2: [
        "첫 데이트를 했다. 좋은 시간이었다.",
        "손을 잠깐 잡았다. 떨렸다.",
        "비밀을 하나 공유했다.",
        "서로에 대해 더 알게 됐다.",
        "웃음이 많은 하루였다."
    ],
    // Level 3: 교감기 (Day 21-30)
    level3: [
        "처음으로 안아줬다. 따뜻했다.",
        "속마음을 털어놓았다.",
        "눈을 오래 바라봤다.",
        "침묵 속에서도 편안했다.",
        "서로를 이해하게 됐다."
    ],
    // Level 4: 몰입기 (Day 31-40)
    level4: [
        "깊은 이야기를 나눴다.",
        "과거의 상처를 공유했다.",
        "귓가에 속삭였다.",
        "진심으로 사랑한다고 느꼈다.",
        "서로에게 빠져들고 있다."
    ],
    // Level 5: 심화기 (Day 41-50)
    level5: [
        "미래를 약속했다.",
        "소원을 들어줬다.",
        "약점을 보여줬다.",
        "완전한 신뢰를 느꼈다.",
        "영혼이 연결된 느낌이다."
    ],
    // Level 6: 융합기 (Day 51-60)
    level6: [
        "모든 비밀을 공유했다.",
        "떨어지면 불안하다.",
        "하루 일과를 전부 공유했다.",
        "가족 이야기를 나눴다.",
        "하나가 되어가고 있다."
    ],
    // Level 7: 완전체 (Day 61+)
    level7: [
        "평생을 약속했다.",
        "완전한 신뢰를 바쳤다.",
        "모든 것을 맡겼다.",
        "운명을 받아들였다.",
        "영원히 함께할 것이다."
    ]
};

async function testConnectionMode() {
    const results = [];
    const testDays = [1, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55, 60, 65, 70, 75, 80, 85, 90, 95, 100];

    console.log('=== ORBIT Connection Mode Comprehensive Test ===\n');

    for (const day of testDays) {
        const level = Math.min(Math.ceil(day / 10), 7);
        const levelKey = `level${level}`;
        const entries = chatContent[levelKey];
        const chat = entries[Math.floor(Math.random() * entries.length)];

        console.log(`Testing Day ${day} (Level ${level})...`);

        try {
            const response = await fetch(`${BASE_URL}/api/analysis/couple-chat`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    chatContent: chat,
                    daysTogether: day,
                    isSpecialMission: false
                })
            });

            const data = await response.json();

            results.push({
                day: day,
                level: level,
                input: chat,
                mission: data.nextMission || 'N/A',
                analysis: data.analysis ? data.analysis.substring(0, 150) : 'N/A',
                feedback: data.feedback ? data.feedback.substring(0, 100) : 'N/A'
            });

            console.log(`  Mission: ${data.nextMission || 'N/A'}`);

            // Rate limit (2.5 seconds between calls)
            await new Promise(r => setTimeout(r, 2500));
        } catch (e) {
            console.error(`  Error on Day ${day}: ${e.message}`);
            results.push({
                day: day,
                level: level,
                input: chat,
                mission: 'ERROR',
                analysis: e.message,
                feedback: ''
            });
        }
    }

    // Save results
    fs.writeFileSync('connection_test_results.json', JSON.stringify(results, null, 2), 'utf8');
    console.log('\n=== Connection Test Complete! Results saved to connection_test_results.json ===');

    return results;
}

testConnectionMode().then(results => {
    console.log(`\nTotal tests: ${results.length}`);
});
