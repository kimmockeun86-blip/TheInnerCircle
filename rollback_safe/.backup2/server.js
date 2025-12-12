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

// API Key Configuration
const API_KEY = 'AIzaSyBnio5R8jKvguClPe5-e6_rtk1t3Z-VEZk'; // In production, use process.env.GEMINI_API_KEY
console.log('Initializing Gemini with Key:', API_KEY ? 'Present' : 'Missing');
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
        console.log(`Analyzing profile for: ${name}, Deficit: ${deficit}`);

        const prompt = `
        너는 인간의 내면을 꿰뚫어보는 신비로운 현자이자, 운명을 인도하는 예언자야.
        사용자의 정보를 바탕으로 그의 내면 깊은 곳에 있는 결핍을 분석하고, 이를 치유하거나 승화시킬 수 있는 '오늘의 계시(Mission)'를 내려줘.

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

        1. **분석 (Analysis)**: 사용자의 결핍(${deficit})과 콤플렉스(${complex})가 그의 삶에 어떤 영향을 미치고 있는지, 그리고 그것이 사실은 어떤 잠재력을 품고 있는지 시적이고 철학적인 언어로 설명해줘. 마치 고대의 예언서처럼 신비롭고 깊이 있게. (3문장 이내)
        2. **오늘의 계시 (Recommended Mission)**: 오늘 하루 동안 이 결핍을 마주하고 조금이라도 해소할 수 있는 구체적이고 실천 가능한 행동 미션을 하나 제안해줘. 단순한 할 일이 아니라, **운명을 바꾸기 위한 하나의 의식(Ritual)**처럼 느껴지게 작성해줘. (예: "오늘 밤, 달빛 아래서 거울을 보며 너의 가장 약한 모습을 사랑한다고 말하라.")

        반드시 **JSON 형식**으로 답해줘:
        {
            "analysis": "분석 내용",
            "recommendedMission": "미션 내용"
        }
        `;

        const result = await model.generateContent(prompt);
        const response = await result.response;
        const text = response.text();
        const jsonResponse = extractJSON(text);

        console.log('Gemini Analysis Result:', jsonResponse);
        res.json({
            success: true,
            analysis: jsonResponse.analysis,
            recommendedMission: jsonResponse.recommendedMission
        });

    } catch (error) {
        console.error('Gemini API Error (Profile):', error.message);
        // Fallback Mock Data
        res.json({
            success: true,
            analysis: "당신의 결핍은 별들이 잠시 숨을 고르는 순간과 같습니다. 그 외로움 속에서 당신은 진정한 자신을 마주하게 될 것입니다. (AI 연결 실패로 인한 예비 메시지)",
            recommendedMission: "오늘 하루, 가장 고요한 순간을 찾아 그 침묵의 소리를 기록하십시오."
        });
    }
});

// 2. Journal Analysis Endpoint
app.post('/api/analysis/journal', upload.single('image'), async (req, res) => {
    try {
        console.log('[Journal] Content-Type:', req.headers['content-type']);
        console.log('[Journal] Body:', JSON.stringify(req.body, null, 2));
        console.log('[Journal] File:', req.file ? req.file.originalname : 'No file');

        const { userId, journalText, name, deficit, dayCount } = req.body;
        const imagePath = req.file ? req.file.path : null;

        if (!journalText) {
            throw new Error('journalText is missing in request body');
        }

        console.log(`Analyzing journal for user ${name}: ${journalText.substring(0, 20)}...`);

        const prompt = `
        당신은 'The Inner Circle'이라는 신비로운 자기 성찰 앱의 AI 멘토 '파라(Para)'입니다.
        사용자의 이름은 '${name}'이며, 현재 '${deficit}'(이)라는 내면의 결핍을 안고 여정을 떠나고 있습니다.
        오늘은 여정의 ${dayCount}일차입니다.

        사용자가 작성한 오늘의 수행 기록(일기)는 다음과 같습니다:
        "${journalText}"

        이 기록을 바탕으로 다음 3가지를 포함한 JSON 형식으로 응답해주세요.
        응답은 반드시 JSON 형식이어야 하며, 마크다운 코드 블록(\`\`\`json ... \`\`\`)으로 감싸지 마세요.

        1. score (0~100): 사용자의 기록이 얼마나 진솔하고 깊이 있는 성찰을 담고 있는지 평가한 점수.
        2. feedback: 사용자의 마음을 따뜻하게 어루만져주는 친절하고 통찰력 있는 피드백. 
           - 사용자가 자신의 감정을 솔직하게 마주한 것을 칭찬해주세요.
           - 이 미션을 수행함으로써 내면이 어떻게 성장할 수 있는지 부드럽게 가이드해주세요.
           - 말투: 신비롭지만 매우 친절하고 따뜻한 스승의 느낌. (예: "그대의 솔직한 고백이 마음을 울리는군요...")
        3. recommendedMission: 오늘(또는 내일) 수행할 **임팩트 있는 행동 미션**.
           - **짧고 간결하게 (20자 이내)**. (필수)
           - **단순한 소소한 행동(명사, 차 마시기 등)은 금지**.
           - **인간관계, 감사 표현, 용서, 두려움 극복, 타인에게 친절 베풀기** 등 사용자의 삶에 파동을 줄 수 있는 행동이어야 함.
           - 명사형 종결 또는 짧은 권유형.
           - 예시: "부모님께 사랑한다고 문자 보내기", "싫어하는 사람에게 먼저 인사하기", "가장 아끼는 물건 선물하기", "거울 속 자신에게 용서한다고 말하기"

        JSON 형식 예시:
        {
            "score": 85,
            "feedback": "그대의 솔직한 기록이...",
            "recommendedMission": "부모님께 사랑한다고 문자 보내기"
        }
        `;

        console.log('Sending request to Gemini API...');
        const result = await model.generateContent(prompt);
        console.log('Gemini API response received.');
        const response = await result.response;
        const text = response.text();
        console.log('Raw Gemini response text:', text);

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

        res.json({
            success: true,
            feedback: feedbackContent,
            score: jsonResponse.score,
            recommendedMission: jsonResponse.recommendedMission
        });
        console.log('Sent response to client. Feedback:', feedbackContent.substring(0, 50));

    } catch (error) {
        console.error('Gemini API Error (Journal):', error.message);
        res.json({
            success: true,
            feedback: "당신의 기록에서 깊은 성찰이 느껴집니다. (AI 연결 실패로 인한 예비 피드백)",
            score: 85,
            recommendedMission: "내일은 오늘 느낀 감정을 색으로 표현해보세요."
        });
    }
});

// 3. Secret Mission Endpoint (Day 10)
app.post('/api/mission/secret', async (req, res) => {
    try {
        const { name, deficit, partnerName } = req.body;
        console.log(`[Secret Mission] User: ${name}, Partner: ${partnerName}`);

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

        const result = await model.generateContent(prompt);
        const response = await result.response;
        const text = response.text();
        const cleanedText = text.replace(/```json/g, '').replace(/```/g, '').trim();
        const jsonResponse = JSON.parse(cleanedText);

        res.json({ success: true, secretMission: jsonResponse.secretMission });

    } catch (error) {
        console.error('Secret Mission Error:', error.message);
        res.json({
            success: true,
            secretMission: "상대방의 눈을 3초간 바라보며 침묵의 인사를 나누세요.\n그리고 가장 좋아하는 계절에 대해 물어보세요. (예비 지령)"
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
        const { chatContent, user1Name, user2Name } = req.body;
        console.log(`[Couple Chat] Analyzing conversation between ${user1Name} and ${user2Name}`);

        const prompt = `
        You are a couple's counseling expert and a relationship alchemist.
        Analyze the following chat content between ${user1Name} and ${user2Name}.
        
        **CRITICAL INSTRUCTION FOR "nextMission":**
        - The mission MUST be extremely concise and short (MAXIMUM 20 characters).
        - Use a warm, encouraging, yet imperative tone.
        - Example: "상대방에게 최고로 행복한 하루를 선물하세요."
        - Do NOT use polite endings like "해요" or "바랍니다". Use "해라", "보내라", "해주어라" or simple imperative forms.
        - STRICTLY NO EXPLANATIONS, JUST THE MISSION.
        
        Return the response as a JSON string ONLY, without any markdown code blocks or extra text.
        The JSON should have the following structure:
        {
          "analysis": "string (Short analysis)",
          "feedback": "string (Short feedback)",
          "nextMission": "string (The concise, imperative mission)"
        }
        
        [Chat Content]
        ${chatContent}
        `;

        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
        const result = await model.generateContent(prompt);
        const response = await result.response;
        let text = response.text();
        console.log('Gemini Raw Response:', text);

        let jsonResponse;
        try {
            const cleanedText = text.replace(/```json/g, '').replace(/```/g, '').trim();
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
            jsonResponse = {
                analysis: text.substring(0, 100) + "...",
                feedback: "AI 응답을 분석하는 중 오류가 발생했습니다.",
                nextMission: "서로를 안아주며 사랑한다고 말하라."
            };
        }

        res.json({
            success: true,
            analysis: jsonResponse.analysis,
            feedback: jsonResponse.feedback,
            nextMission: jsonResponse.nextMission
        });

    } catch (error) {
        console.error('Couple Chat Analysis Error:', error.message);
        res.json({
            success: true,
            analysis: "두 분의 대화에서 깊은 유대감이 느껴집니다. (AI 연결 실패)",
            feedback: "서로의 마음을 더 자주 표현해주세요.",
            nextMission: "서로에게 가장 고마웠던 순간을 편지로 써서 교환하라."
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

app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on port ${PORT} (0.0.0.0)`);
});
