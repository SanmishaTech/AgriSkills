import { GoogleGenAI } from '@google/genai';
import * as fs from 'fs';

const client = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

async function listLiveModels() {
    console.log('Fetching models...');
    try {
        const response = await client.models.list();
        let out = '';
        for await (const model of response) {
            out += `Model: ${model.name}\n`;
        }
        fs.writeFileSync('models_utf8.txt', out, 'utf8');
        console.log('Done writing models_utf8.txt');
    } catch (e) {
        console.error('Error fetching models:', e);
    }
}

listLiveModels();
