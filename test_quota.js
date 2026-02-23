
const { GoogleGenerativeAI } = require('@google/generative-ai');
require('dotenv').config();

const apiKey = process.env.GEMINI_API_KEY;
const genAI = new GoogleGenerativeAI(apiKey);

const models = [
    'gemini-2.5-flash',
    'gemini-2.0-flash',
    'gemini-1.5-flash',
    'gemini-1.5-pro',
    'gemini-pro'
];

async function testModel(modelName) {
    try {
        const model = genAI.getGenerativeModel({ model: modelName });
        const result = await model.generateContent('Hi');
        const response = await result.response;
        console.log(`✅ [${modelName}] Success! Response: ${response.text()}`);
        return true;
    } catch (error) {
        if (error.message.includes('429')) {
            console.log(`❌ [${modelName}] FAILED: Quota Exceeded (429)`);
        } else {
            console.log(`❌ [${modelName}] FAILED: ${error.message.split('\n')[0]}`);
        }
        return false;
    }
}

async function main() {
    console.log('Testing models with API Key ending in...', apiKey.slice(-5));

    for (const model of models) {
        await testModel(model);
    }
}

main();
