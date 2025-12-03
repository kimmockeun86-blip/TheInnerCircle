console.log('Starting server script...');
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const mongoose = require('mongoose');
const { GoogleGenerativeAI } = require('@google/generative-ai');

console.log('Dependencies loaded.');

const app = express();
const PORT = process.env.PORT || 3000;

// Ensure uploads directory exists
const uploadDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir);
}

// Multer Configuration for Image Uploads
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, uploadDir);
    },
    filename: function (req, file, cb) {
        cb(null, Date.now() + '-' + file.originalname);
    }
});
const upload = multer({ storage: storage });

// API Key Configuration - Environment Variable Required
const API_KEY = process.env.GEMINI_API_KEY;

if (!API_KEY) {
    console.error('❌ FATAL ERROR: GEMINI_API_KEY environment variable is required!');
    console.error('❌ Please set GEMINI_API_KEY in your deployment environment (Render/Vercel dashboard).');
    console.error('❌ Get your API key from: https://aistudio.google.com/app/apikey');
    process.exit(1); // Stop server startup
}

console.log('✅ GEMINI_API_KEY loaded from environment variables');
console.log('Initializing Gemini with Key: Present');
const genAI = new GoogleGenerativeAI(API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
console.log('Gemini Model Initialized.');

app.use(cors({
    origin: '*', // Allow all origins for debugging
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Health Check
app.get('/', (req, res) => {
    res.status(200).send('The Inner Circle Server is Running! 🚀');
});

app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Request Logging Middleware
app.use((req, res, next) => {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
    console.log('Headers:', req.headers);
    if (req.method === 'POST') {
        console.log('Body:', JSON.stringify(req.body, null, 2)?.substring(0, 200) + '...');
    }
    next();
});

// Helper function to extract JSON
function extractJSON(text) {
    try {
        const match = text.match(/\{[\s\S]*\}/);
        if (match) {
            return JSON.parse(match[0]);
        }
        return JSON.parse(text);
    } catch (e) {
        console.error("Failed to extract JSON:", text);
        throw e;
    }
}

// 1. Profile Analysis Endpoint
app.post('/api/analysis/profile', async (req, res) => {
    try {
        const { name, gender, age, job, location, idealType, hobbies, growthGoal, complex, deficit } = req.body;
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log('[Profile Analysis] Request received');
        console.log('[Profile Analysis] User:', name, '| Deficit:', deficit);
        console.log('[Profile Analysis] Sending to Gemini API...');

        const prompt = `
        너는 'The Inner Circle'의 신비로운 AI 멘토 '파라(Para)'다. 
        사용자가 너에게 심리적으로 **의지하고 신뢰**를 느끼도록, 단순한 위로가 아닌 **"나보다 나를 더 잘 아는 것 같은 통찰력"**을 보여줘야 한다.

        [사용자 정보]
        이름: ${name}
        성별: ${gender}
        나이: ${age}
        직업: ${job}
        거주지: ${location}
        이상형: ${idealType}
        취미: ${hobbies}
        성장 목표: ${growthGoal}
        콤플렉스: ${complex}
        가장 큰 결핍: ${deficit}

        [심리학 기법 적용 가이드]
        1. **바넘 효과 (Barnum Effect)**: 상반된 두 성향을 동시에 언급하여 "마치 내 이야기 같아!"라고 느끼게 하라.
           예: "겉으로는 강한 모습을 보이지만, 내면 깊은 곳에선 누구에게도 말하지 못한 고독을 품고 있군요."
        
        2. **긍정적 재해석 (Reframing)**: 결핍이나 콤플렉스를 '잠재력'으로 바꿔 말하라. 이것이 치유의 핵심이다.
           예: "당신의 망설임은 우유부단함이 아닙니다. 신중함과 책임감의 다른 이름입니다."
        
        3. **은유와 상징 (Metaphor)**: 마음의 상태를 자연물(별, 뿌리, 파도, 강)에 비유하라.
           예: "당신의 결핍은 별들이 잠시 숨을 고르는 순간과 같습니다."
        
        4. **권위적 공감 (Authoritative Empathy)**: "~하십시오", "~하리라" 처럼 단정적이고 확신에 찬 어조로 말하되, 내용은 따뜻하게.
           예: "그동안 홀로 견뎌온 시간이 결코 헛되지 않았음을 나는 압니다."

        1. **분석 (Analysis)**: 
           - 위 4가지 기법을 모두 활용하여 사용자의 결핍(${deficit})과 콤플렉스(${complex})를 분석하라.
           - 상반된 성향을 언급하고, 결핍을 잠재력으로 재해석하며, 은유를 사용하고, 권위적 공감으로 마무리하라.
           - 3문장 이내, 시적이고 신비로운 문체.
        
        2. **오늘의 계시 (Recommended Mission)**: 
           - **길이**: 공백 포함 5자 이상 15자 이내.
           - **말투**: 단호한 명령조 (예: "작은 기부를 해라", "먼저 인사를 건네라").
           - **내용**: 누구나 오늘 바로 실천 가능한 구체적 행동. 운이나 특정 상황에 의존하지 않는 미션.
           - **금지**: "길잃은 아이", "곤경에 처한 사람", "도움이 필요한 누군가" 같은 상황 의존적 표현 절대 금지.
           - **예시**: "작은 기부를 해라", "먼저 인사를 건네라", "쓰레기를 주워라", "자리를 양보해라", "따뜻한 말을 건네라".

        반드시 **JSON 형식**으로 답해줘:
        {
            "analysis": "분석 내용",
            "recommendedMission": "미션 내용"
        }
        `;

        const result = await model.generateContent(prompt);
        const response = await result.response;
        const text = response.text();
        console.log('[Profile Analysis] Gemini raw response received:', text.substring(0, 100) + '...');

        const jsonResponse = extractJSON(text);
        console.log('[Profile Analysis] Parsed JSON:', jsonResponse);
        // FALLBACK LOGIC
        const validMissions = [
            "작은 기부를 해라",
            "약자를 도와라",
            "먼저 인사를 건네라",
            "쓰레기를 주워라",
            "자리를 양보해라",
            "문을 잡아줘라",
            "따뜻하게 웃어라",
            "진심으로 칭찬해라",
            "길을 비켜줘라",
            "감사함을 표현해라"
        ];

        let finalMission = jsonResponse.recommendedMission;
        const forbiddenWords = ["함께", "같이", "서로", "우리", "나누", "즐기", "데이트", "시간을"];
        const hasForbiddenWord = forbiddenWords.some(word => finalMission.includes(word));

        if (!finalMission || finalMission.length > 15 || hasForbiddenWord ||
            finalMission.includes(",") || finalMission.includes(".")) {

            console.log(`[Profile Mission Override] AI mission '${finalMission}' was invalid. Using fallback.`);
            finalMission = validMissions[Math.floor(Math.random() * validMissions.length)];
        }

        console.log('[Profile Analysis] ✅ Success - Sending response');
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

        res.json({
            success: true,
            analysis: jsonResponse.analysis,
            recommendedMission: finalMission
        });

    } catch (error) {
        console.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.error('[Profile Analysis] ❌ ERROR:', error.message);
        console.error('[Profile Analysis] Error type:', error.name);
        if (error.response) {
            console.error('[Profile Analysis] Gemini API Response Error:', error.response.status, error.response.statusText);
        }
        console.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

        // Fallback Mock Data
        res.json({
            success: true,
            analysis: "당신의 결핍은 별들이 잠시 숨을 고르는 순간과 같습니다. 그 외로움 속에서 당신은 진정한 자신을 마주하게 될 것입니다. (AI 연결 실패로 인한 예비 메시지)",
            recommendedMission: "오늘 하루, 가장 고요한 순간을 찾아 그 침묵의 소리를 기록하십시오.",
            errorType: 'API_CONNECTION_ERROR',
            errorMessage: error.message
        });
    }
});

// 2. Journal Analysis Endpoint
app.post('/api/analysis/journal', upload.single('image'), async (req, res) => {
    try {
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log('[Journal Analysis] Request received');
        console.log('[Journal] Content-Type:', req.headers['content-type']);
        console.log('[Journal] Body keys:', Object.keys(req.body));
        console.log('[Journal] File:', req.file ? req.file.originalname : 'No file');

        const { userId, journalText, name, deficit, dayCount } = req.body;
        const imagePath = req.file ? req.file.path : null;

        if (!journalText) {
            console.error('[Journal Analysis] ❌ Missing journalText in request');
            throw new Error('journalText is missing in request body');
        }

        console.log(`[Journal Analysis] User: ${name} | Day: ${dayCount} | Deficit: ${deficit}`);
        console.log(`[Journal Analysis] Text preview: ${journalText.substring(0, 50)}...`);

        const prompt = `
        당신은 'The Inner Circle'이라는 신비로운 자기 성찰 앱의 AI 멘토 '파라(Para)'입니다.
        사용자의 이름은 '${name}'이며, 현재 '${deficit}'(이)라는 내면의 결핍을 안고 여정을 떠나고 있습니다.
        오늘은 여정의 ${dayCount}일차입니다.

        사용자가 작성한 오늘의 수행 기록(일기)는 다음과 같습니다:
        "${journalText}"

        이 기록을 바탕으로 다음 3가지를 포함한 JSON 형식으로 응답해주세요.
        응답은 반드시 JSON 형식이어야 하며, 마크다운 코드 블록(\`\`\`json ... \`\`\`)으로 감싸지 마세요.

        [심리학 기법 적용 가이드]
        1. **바넘 효과**: 사용자가 "나를 정말 이해하는구나" 느끼도록 상반된 감정을 함께 언급하라.
           예: "겉으로는 담담히 이겨냈다고 쓰셨지만, 그 뒤에 숨겨진 흔들림을 나는 봅니다."
        
        2. **긍정적 재해석**: 사용자의 부족함이나 실패를 '성장의 증거'로 바꿔 말하라.
           예: "오늘의 미션을 완벽히 수행하지 못했다고 느끼신다면, 그것은 당신이 더 높은 기준을 가졌다는 뜻입니다."
        
        3. **은유 사용**: 감정을 자연물에 비유하여 신비롭고 시적인 분위기를 만들어라.
           예: "당신의 마음은 폭풍이 지나간 뒤의 고요한 호수와 같습니다."
        
        4. **권위적 공감**: "~합니다", "~하리라" 같은 확신에 찬 어조로 위로하되, 따뜻하게.
           예: "그대가 오늘 내딛은 한 걸음은 결코 작지 않았음을 나는 압니다."

        1. score (0~100): 사용자의 기록이 얼마나 진솔하고 깊이 있는 성찰을 담고 있는지 평가한 점수.
        
        2. feedback: 
           - **위 4가지 심리학 기법을 모두 활용**하여 사용자의 마음을 따뜻하게 어루만져주는 통찰력 있는 피드백을 작성하라.
           - 사용자가 자신의 감정을 솔직하게 마주한 것을 칭찬하고, 이 미션을 수행함으로써 내면이 어떻게 성장할 수 있는지 가이드하라.
           - 상반된 감정 언급 → 재해석 → 은유 → 권위적 공감으로 이어지는 구조가 이상적.
           - 말투: 신비롭지만 매우 친절하고 따뜻한 스승의 느낌, 단정적이고 확신에 찬 어조.
           예: "겉으로는 평온해 보이지만 내면의 파도를 나는 압니다. 그 흔들림은 약함이 아니라 살아있음의 증거입니다. 당신이 내딛은 오늘의 걸음은 작지 않았습니다."
        
        3. recommendedMission: **타인을 위한 이타적 행동 (5~15자)**.
           - **규칙**: **5자 이상 15자 이내**, **명령조**, **단독 수행**.
           - **내용**: **누구나 오늘 바로 실천 가능한** 구체적 행동. 운이나 특정 상황에 의존하지 않는 미션.
           - **금지**: "길잃은 아이", "곤경에 처한 사람", "도움이 필요한 누군가" 같은 **상황 의존적 표현 절대 금지**.
           - **예시**: "작은 기부를 해라", "먼저 인사를 건네라", "쓰레기를 주워라", "자리를 양보해라", "따뜻한 말을 건네라".

        JSON 형식 예시:
        {
            "score": 85,
            "feedback": "피드백 내용",
            "recommendedMission": "미션 내용"
        }
        `;

        console.log('[Journal Analysis] Sending request to Gemini API...');
        const result = await model.generateContent(prompt);
        console.log('[Journal Analysis] Gemini API response received successfully');
        const response = await result.response;
        const text = response.text();
        console.log('[Journal Analysis] Raw Gemini response:', text.substring(0, 150) + '...');

        let jsonResponse;
        try {
            const cleanText = text.replace(/```json/g, '').replace(/```/g, '').trim();
            jsonResponse = JSON.parse(cleanText);
            console.log('Parsed JSON response:', jsonResponse);
        } catch (e) {
            console.error('JSON Parse Error:', e);
            jsonResponse = {
                score: 80,
                feedback: text,
                recommendedMission: "내면의 목소리에 귀 기울이며 평온한 하루를 보내세요."
            };
        }

        // Handle key mismatch (Gemini sometimes returns 'analysis' instead of 'feedback')
        const feedbackContent = jsonResponse.feedback || jsonResponse.analysis || "피드백을 불러올 수 없습니다.";

        // FALLBACK LOGIC
        const validMissions = [
            "작은 기부를 해라",
            "약자를 도와라",
            "먼저 인사를 건네라",
            "쓰레기를 주워라",
            "자리를 양보해라",
            "문을 잡아줘라",
            "따뜻하게 웃어라",
            "진심으로 칭찬해라",
            "길을 비켜줘라",
            "감사함을 표현해라"
        ];

        let finalMission = jsonResponse.recommendedMission;
        const forbiddenWords = ["함께", "같이", "서로", "우리", "나누", "즐기", "데이트", "시간을"];
        const hasForbiddenWord = forbiddenWords.some(word => finalMission.includes(word));

        if (!finalMission || finalMission.length > 15 || hasForbiddenWord ||
            finalMission.includes(",") || finalMission.includes(".")) {

            console.log(`[Journal Mission Override] AI mission '${finalMission}' was invalid. Using fallback.`);
            finalMission = validMissions[Math.floor(Math.random() * validMissions.length)];
        }

        console.log('[Journal Analysis] ✅ Success - Sending response');
        console.log('[Journal Analysis] Score:', jsonResponse.score, '| Mission:', finalMission);
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

        res.json({
            success: true,
            feedback: feedbackContent,
            score: jsonResponse.score,
            recommendedMission: finalMission
        });

    } catch (error) {
        console.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.error('[Journal Analysis] ❌ ERROR:', error.message);
        console.error('[Journal Analysis] Error stack:', error.stack);
        if (error.response) {
            console.error('[Journal Analysis] API Response Error:', error.response.status);
        }
        console.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

        res.json({
            success: true,
            feedback: "당신의 기록에서 깊은 성찰이 느껴집니다. (AI 연결 실패로 인한 예비 피드백)",
            score: 85,
            recommendedMission: "내일은 오늘 느낀 감정을 색으로 표현해보세요.",
            errorType: 'API_CONNECTION_ERROR',
            errorMessage: error.message
        });
    }
});

// 3. Secret Mission Endpoint (Day 10)
app.post('/api/mission/secret', async (req, res) => {
    try {
        const { name, deficit, partnerName } = req.body;
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log('[Secret Mission] Request received');
        console.log(`[Secret Mission] User: ${name}, Partner: ${partnerName}, Deficit: ${deficit}`);

        const prompt = `
        너는 연애와 인간관계의 현자야. 
        '${name}'님이 '${deficit}'이라는 결핍을 가지고 있고, 이제 '${partnerName}'님과의 첫 만남(Day 10)을 앞두고 있어.
        
        이 만남이 의미 있고 서로를 존중하는 시간이 될 수 있도록, **구체적이고 현실적인 비밀 지령(조언)**을 3가지 내려줘.
        추상적인 말보다는, 대화 주제, 태도, 에티켓 등 실천 가능한 행동 지침을 줘.
        
        말투는 신비롭지만 따뜻하게 해줘.
        
        반드시 **JSON 형식**으로 답해줘:
        {
            "secretMission": "지령 내용 (줄바꿈 포함)"
        }
        `;

        console.log('[Secret Mission] Sending to Gemini API...');
        const result = await model.generateContent(prompt);
        const response = await result.response;
        const text = response.text();
        const cleanedText = text.replace(/```json/g, '').replace(/```/g, '').trim();
        const jsonResponse = JSON.parse(cleanedText);

        console.log('[Secret Mission] ✅ Success');
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        res.json({ success: true, secretMission: jsonResponse.secretMission });

    } catch (error) {
        console.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.error('[Secret Mission] ❌ ERROR:', error.message);
        console.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        res.json({
            success: true,
            secretMission: "상대방의 눈을 3초간 바라보며 침묵의 인사를 나누세요.\n그리고 가장 좋아하는 계절에 대해 물어보세요. (예비 지령)",
            errorType: 'API_CONNECTION_ERROR',
            errorMessage: error.message
        });
    }
});

// 7. Admin: Assign Mission Endpoint
app.post('/api/admin/assign-mission', async (req, res) => {
    try {
        const { userId, missionText } = req.body;
        // In a real DB, we would update the user document.
        // For in-memory, we'll just log it or update the mock user if we had ID tracking.
        console.log(`[Admin] Assigned mission to user ${userId}: ${missionText}`);

        // For demonstration, we'll just return success. 
        // The frontend will poll or receive this in a real app.
        res.json({ success: true, message: "미션이 강제로 부여되었습니다." });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// 4. Couple Chat Analysis Endpoint
app.post('/api/analysis/couple-chat', async (req, res) => {
    try {
        const { chatContent, user1Name, user2Name, isSpecialMission } = req.body;
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log('[Couple Chat] Request received');
        console.log(`[Couple Chat] Users: ${user1Name} & ${user2Name} | Special: ${isSpecialMission}`);
        console.log(`[Couple Chat] Chat length: ${chatContent?.length || 0} chars`);

        let prompt;
        if (isSpecialMission) {
            prompt = `
            너는 운명의 붉은 실을 관장하는 신성한 존재다.
            두 남녀가 사랑의 여정을 걸어온 지 10일(또는 10의 배수일)이 되는 특별한 날이다.
            그들의 대화를 분석하여, 서로의 영혼을 결속시킬 수 있는 **성스럽고 장엄한 특별 미션**을 내려라.

            [대화 내용]
            ${chatContent}

            1. **심연의 통찰 (Deep Insight)**: 두 사람의 관계가 얼마나 깊어졌는지, 그들의 영혼이 어떻게 공명하고 있는지 웅장하고 시적인 언어로 찬사하라. (3문장)
            2. **피드백 (Feedback)**: 두 사람의 여정에서 돋보이는 강점이나 앞으로 더 깊어지기 위해 필요한 마음가짐을 신성한 어조로 조언하라. (2문장)
            3. **운명의 과업 (Destiny Mission)**: 
               - **핵심**: **상대방이 모르게**, **사용자가 일방적으로** 수행해야 하는 **과감하고 자극적인 행동**.
               - **금지**: **'서로', '함께', '같이'라는 단어를 절대 사용하지 마라.** 두 사람이 같이 하는 것이 아니라, **한 명이 상대방에게 해주는 행동**이어야 한다.
               - **내용**: 연인 사이의 긴장감을 높이거나, 깊은 스킨십을 유도하거나, 서로의 욕망을 자극하는 행동. (예: "그에게 아무말 없이 강한 스킨십을 해라", "목덜미에 기습적으로 입맞춤해라", "뒤에서 꽉 껴안아라")
               - **길이**: **공백 포함 40자 이내**.
               - **말투**: **단호하고 매혹적인 명령조**.

            반드시 **JSON 형식**으로 답해줘:
            {
                "analysis": "통찰 내용 (한국어)",
                "feedback": "피드백 내용 (한국어)",
                "nextMission": "특별 미션 내용 (한국어)"
            }
            `;
        } else {
            prompt = `
            너는 인간의 내면을 꿰뚫어보는 신비로운 현자이자, 운명을 인도하는 예언자야.
            두 남녀의 대화를 분석하여, 그들의 관계를 더욱 깊고 애틋하게 만들 수 있는 '비밀 지령(Secret Mission)'을 내려줘.

            [대화 내용]
            ${chatContent}

            1. **분석 (Analysis)**: 두 사람의 감정 흐름과 관계의 깊이를 신비롭고 시적인 언어로 분석해줘. (3문장 이내)
               - **언어**: **오직 한국어만 사용해라. 영어 설명은 절대 포함하지 마라.**
            2. **피드백 (Feedback)**: 두 사람의 대화에서 느껴지는 긍정적인 점이나 개선하면 좋을 점을 구체적이고 따뜻하게 조언해줘. (2문장 이내)
               - **언어**: **오직 한국어만 사용해라.**
            3. **비밀 지령 (Secret Mission)**: 상대방 몰래 수행할 수 있는, **사용자가 상대방에게 하는 일방적인 행동**을 제안해라.
               - **금지**: **'서로', '함께', '같이'라는 단어를 절대 사용하지 마라.**
               - **길이**: **공백 포함 40자 이내**.
               - **말투**: **단호한 명령조** (예: "조용히 다가가 손을 잡아라", "그를 지그시 바라봐라").
               - **내용**: **상대방이 모르게** 할 수 있는 스킨십이나 배려, 혹은 도발적인 행동.
               - **언어**: **오직 한국어만 사용해라. 영어 설명은 절대 포함하지 마라.**

            반드시 **JSON 형식**으로 답해줘:
            {
                "analysis": "분석 내용 (한국어)",
                "feedback": "피드백 내용 (한국어)",
                "nextMission": "미션 내용 (한국어)"
            }
            `;
        }

        console.log('[Couple Chat] Sending to Gemini API...');
        const model = genAI.getGenerativeModel({
            model: "gemini-2.0-flash",
            generationConfig: { temperature: 0.4 }
        });
        const result = await model.generateContent(prompt);
        const response = await result.response;
        let text = response.text();
        console.log('[Couple Chat] Gemini response received');

        // Write raw response to file for debugging
        try {
            require('fs').writeFileSync('debug_gemini_response.txt', text, 'utf8');
            console.log('Saved raw Gemini response to debug_gemini_response.txt');
        } catch (err) {
            console.error('Failed to save debug file:', err);
        }

        console.log('Gemini Raw Response:', text);

        // Helper to clean JSON string
        function cleanJSON(str) {
            return str
                .replace(/```json/g, '')
                .replace(/```/g, '')
                .replace(/\/\/.*$/gm, '') // Remove single-line comments
                .replace(/\/\*[\s\S]*?\*\//g, '') // Remove multi-line comments
                .replace(/,\s*([\]}])/g, '$1') // Remove trailing commas
                .trim();
        }

        let jsonResponse;
        try {
            const cleanedText = cleanJSON(text);
            const jsonStartIndex = cleanedText.indexOf('{');
            const jsonEndIndex = cleanedText.lastIndexOf('}');

            if (jsonStartIndex !== -1 && jsonEndIndex !== -1) {
                const jsonString = cleanedText.substring(jsonStartIndex, jsonEndIndex + 1);
                jsonResponse = JSON.parse(jsonString);
            } else {
                throw new Error('No JSON object found in response');
            }
        } catch (parseError) {
            console.error('JSON Parse Error:', parseError);
            console.log('Failed Text:', text);

            jsonResponse = {
                analysis: "두 사람의 마음이 깊이 연결되어 있습니다. (AI 분석 데이터 형식 오류)",
                feedback: "서로를 향한 진심을 잃지 마세요.",
                nextMission: "서로의 손을 잡고 눈을 맞추라"
            };
        }

        // FALLBACK LOGIC: Strict validation.
        // Updated with BOLD & UNILATERAL missions as requested
        const validMissions = [
            "그의 뒤에서 꽉 껴안아라",
            "아무 말 없이 손을 잡아라",
            "목덜미에 입맞춤해라",
            "귓가에 사랑한다고 속삭여라",
            "그를 지그시 1분간 바라봐라",
            "허벅지에 손을 올려라",
            "그의 향기를 맡아라",
            "머리카락을 쓸어넘겨줘라",
            "갑자기 입맞춤해라",
            "그의 어깨에 기대라"
        ];

        let finalMission = jsonResponse.nextMission;
        let finalAnalysis = jsonResponse.analysis;
        let finalFeedback = jsonResponse.feedback || "서로의 마음을 더 자주 표현해주세요. (AI 피드백 누락)";

        // Robust check for forbidden concepts - STRICTLY UNILATERAL
        const forbiddenWords = ["서로", "함께", "같이", "우리", "나누", "즐기", "데이트", "시간을"];
        const hasForbiddenWord = forbiddenWords.some(word => finalMission.includes(word));

        // Check for English characters (a-z, A-Z) in Mission OR Analysis
        const hasEnglishInMission = /[a-zA-Z]/.test(finalMission);
        const hasEnglishInAnalysis = /[a-zA-Z]/.test(finalAnalysis);

        console.log(`[Analysis Check] Original Analysis: "${finalAnalysis}"`);
        console.log(`[Analysis Check] Original Feedback: "${finalFeedback}"`);
        console.log(`[Analysis Check] Has English: ${hasEnglishInAnalysis}`);

        // Check for length > 40, forbidden words
        // Relaxed validation: Allowed periods, commas, increased length to 40
        if (!finalMission || finalMission.length > 40 || hasForbiddenWord || hasEnglishInMission) {

            console.log(`[Mission Override] AI mission '${finalMission}' was invalid. Using fallback.`);
            finalMission = validMissions[Math.floor(Math.random() * validMissions.length)];
        }

        if (hasEnglishInAnalysis) {
            console.log(`[Analysis Override] AI analysis contained English. Using fallback.`);
            finalAnalysis = "두 사람의 마음이 깊어지고 있습니다. 서로를 향한 진심이 느껴집니다.";
        }

        console.log(`[Couple Chat] ✅ Success`);
        console.log(`[Couple Chat] Mission: "${finalMission}"`);
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

        res.json({
            success: true,
            analysis: finalAnalysis,
            feedback: finalFeedback,
            nextMission: finalMission
        });

    } catch (error) {
        console.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.error('[Couple Chat] ❌ ERROR:', error.message);
        console.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        res.json({
            success: true,
            analysis: "두 분의 대화에서 깊은 유대감이 느껴집니다. (AI 연결 실패)",
            feedback: "서로의 마음을 더 자주 표현해주세요.",
            nextMission: "서로에게 가장 고마웠던 순간을 편지로 써서 교환하라.",
            errorType: 'API_CONNECTION_ERROR',
            errorMessage: error.message
        });
    }
});

// 6. Matching Endpoint
app.post('/api/match', async (req, res) => {
    try {
        const { name, gender, deficit, age, job } = req.body;
        console.log(`Matching Request for: ${name} (${gender}, ${deficit})`);

        // Mock matching logic for now
        res.json({
            success: true,
            match: {
                _id: 'mock_user_fallback',
                name: '이서연',
                age: 28,
                job: '플로리스트',
                deficit: '안정',
                gender: gender === '남성' ? '여성' : '남성'
            },
            reason: "별들의 인도가 잠시 흐려졌으나, 운명은 이미 정해져 있습니다. (예비 운명)"
        });

    } catch (error) {
        console.error('Matching Error:', error.message);
        res.json({
            success: true,
            match: {
                _id: 'mock_user_fallback',
                name: '이서연',
                age: 28,
                job: '플로리스트',
                deficit: '안정',
                gender: gender === '남성' ? '여성' : '남성'
            },
            reason: "별들의 인도가 잠시 흐려졌으나, 운명은 이미 정해져 있습니다. (예비 운명)"
        });
    }
});

// 8. Couple Profile Analysis Endpoint (Day 1 Initialization)
app.post('/api/analysis/couple-profile', async (req, res) => {
    try {
        const { goal, wish, future, partnerDesc } = req.body;
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log('[Couple Profile] Request received');
        console.log(`[Couple Profile] Goal: ${goal?.substring(0, 30)}...`);

        const prompt = `
        너는 'The Inner Circle'의 신비로운 멘토 '파라(Para)'다.
        이제 막 여정을 시작한 커플의 답변을 보고, 그들의 관계를 통찰하고 첫 번째 미션을 내려라.

        [커플 답변]
        - 지향하는 연애: ${goal}
        - 바라는 점: ${wish}
        - 꿈꾸는 미래: ${future}
        - 상대방 묘사: ${partnerDesc}

        1. **통찰 (Analysis)**: 이 커플의 답변에서 느껴지는 관계의 잠재력과 아름다움을 신비롭고 시적인 언어로 축복해라. (3문장 이내)
        2. **첫 번째 미션 (Recommended Mission)**: 
           - **내용**: 서로의 눈을 바라보거나, 손을 잡거나, 짧은 감사를 전하는 등 **가볍지만 깊은 울림이 있는 행동**.
           - **길이**: **공백 포함 5자 이상 20자 이내**.
           - **말투**: **단호하고 신비로운 명령조**. (예: "서로의 눈을 1분간 바라보라", "손을 잡고 온기를 느껴라")

        반드시 **JSON 형식**으로 답해줘:
        {
            "analysis": "통찰 내용",
            "recommendedMission": "미션 내용"
        }
        `;

        console.log('[Couple Profile] Sending to Gemini API...');
        const result = await model.generateContent(prompt);
        const response = await result.response;
        const text = response.text();
        const jsonResponse = extractJSON(text);

        console.log('[Couple Profile] ✅ Success');
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

        res.json({
            success: true,
            analysis: jsonResponse.analysis,
            recommendedMission: jsonResponse.recommendedMission
        });

    } catch (error) {
        console.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.error('[Couple Profile] ❌ ERROR:', error.message);
        console.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        res.json({
            success: true,
            analysis: "두 분의 만남은 별들의 축복 속에 있습니다. 서로를 향한 진심이 이 여정을 빛나게 할 것입니다. (AI 연결 실패)",
            recommendedMission: "서로의 눈을 1분간 바라보라",
            errorType: 'API_CONNECTION_ERROR',
            errorMessage: error.message
        });
    }
});

app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on port ${PORT} (0.0.0.0)`);
});
