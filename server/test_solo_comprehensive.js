const fetch = require('node-fetch');
const fs = require('fs');

const BASE_URL = 'http://localhost:3000';

// Sample journal entries for each growth level
const journalEntries = {
    // Level 1: 각성 (Day 1-10)
    level1: [
        "오늘 하루가 그냥 지나갔다. 뭔가 의미 없는 느낌이다.",
        "아침에 일어나기 힘들었다. 하지만 그래도 일어났다.",
        "왜 이렇게 살고 있는지 모르겠다.",
        "오늘 커피 한잔 마시면서 잠깐 쉬었다.",
        "변화가 필요한 것 같다."
    ],
    // Level 2: 직면 (Day 11-20)
    level2: [
        "내 문제점이 보이기 시작했다. 너무 소극적이었다.",
        "오늘 거절을 당했다. 마음이 아프지만 받아들였다.",
        "두려운 것을 마주했다. 생각보다 덜 무섭다.",
        "습관을 바꾸려고 노력했다.",
        "나 자신을 분석해보았다."
    ],
    // Level 3: 파괴 (Day 21-30)
    level3: [
        "오래된 습관을 버렸다. 후련하다.",
        "익숙한 것들을 내려놓았다.",
        "새로운 시도를 했다. 무섭지만 해냈다.",
        "거절을 해봤다. 괜찮았다.",
        "한계를 시험했다."
    ],
    // Level 4: 재구축 (Day 31-40)
    level4: [
        "과거를 용서했다. 마음이 가벼워졌다.",
        "진심을 고백했다. 떨렸지만 해냈다.",
        "약점을 인정했다.",
        "도움을 요청했다.",
        "새로운 나를 만들어가고 있다."
    ],
    // Level 5: 통합 (Day 41-50)
    level5: [
        "삶의 의미를 정의했다.",
        "핵심 가치를 찾았다.",
        "미래 비전을 수립했다.",
        "유언을 써봤다. 깊은 생각이 들었다.",
        "내면과 외면이 하나가 되어가고 있다."
    ]
};

async function testSoloMode() {
    const results = [];
    const testDays = [1, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50];

    console.log('=== ORBIT Solo Mode Comprehensive Test ===\n');

    for (const day of testDays) {
        const level = Math.ceil(day / 10);
        const levelKey = `level${Math.min(level, 5)}`;
        const entries = journalEntries[levelKey];
        const journalEntry = entries[Math.floor(Math.random() * entries.length)];

        console.log(`Testing Day ${day} (Level ${level})...`);

        try {
            const response = await fetch(`${BASE_URL}/api/analysis/journal`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    journalText: journalEntry,
                    dayCount: day,
                    userDeficit: '자신감 부족'
                })
            });

            const data = await response.json();

            results.push({
                day: day,
                level: level,
                phase: data.growthPhase || 'N/A',
                input: journalEntry,
                mission: data.recommendedMission || data.nextMission || 'N/A',
                feedback: data.feedback ? data.feedback.substring(0, 150) : 'N/A',
                score: data.score || 0
            });

            console.log(`  Mission: ${data.recommendedMission || data.nextMission || 'N/A'}`);

            // Rate limit (2.5 seconds between calls)
            await new Promise(r => setTimeout(r, 2500));
        } catch (e) {
            console.error(`  Error on Day ${day}: ${e.message}`);
            results.push({
                day: day,
                level: level,
                input: journalEntry,
                mission: 'ERROR',
                signal: e.message,
                score: 0
            });
        }
    }

    // Save results
    fs.writeFileSync('solo_test_results.json', JSON.stringify(results, null, 2), 'utf8');
    console.log('\n=== Solo Test Complete! Results saved to solo_test_results.json ===');

    return results;
}

testSoloMode().then(results => {
    console.log(`\nTotal tests: ${results.length}`);
});
