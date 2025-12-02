const { GoogleGenerativeAI } = require('@google/generative-ai');

const API_KEY = 'AIzaSyBnio5R8jKvguClPe5-e6_rtk1t3Z-VEZk';
const genAI = new GoogleGenerativeAI(API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

async function run() {
    try {
        const prompt = "Hello, are you working? Answer in Korean.";
        const result = await model.generateContent(prompt);
        const response = await result.response;
        const text = response.text();
        console.log("Success:", text);
    } catch (error) {
        console.error("Error:", error.message);
    }
}

run();
