const { GoogleGenerativeAI } = require("@google/generative-ai");

const API_KEY = 'AIzaSyAn0zqB6oiVQ7ll9qNdi9WDeW6DHTOPLfs';
const genAI = new GoogleGenerativeAI(API_KEY);

async function testAI() {
    console.log("Testing Gemini API...");
    try {
        const model = genAI.getGenerativeModel({ model: "gemini-pro" });
        const prompt = "Explain 'Hello World' in 5 words.";

        console.log("Sending prompt:", prompt);

        const result = await model.generateContent(prompt);
        const response = await result.response;
        const text = response.text();

        console.log("✅ Success! Response:", text);
    } catch (err) {
        console.error("❌ Failed:", err.message);
        if (err.response) {
            console.error("Error Response:", JSON.stringify(err.response, null, 2));
        }
    }
}

testAI();
