import { GoogleGenAI } from '@google/genai';
import WebSocket from 'ws';

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const MODEL = 'gemini-3.1-flash-live-preview';

async function testConnection() {
    const client = new GoogleGenAI({ apiKey: GEMINI_API_KEY });
    const expireTime = new Date(Date.now() + 30 * 60 * 1000).toISOString();
    
    console.log('Fetching token...');
    const token = await (client as any).authTokens.create({
        config: {
            uses: 1,
            expireTime: expireTime,
            liveConnectConstraints: { model: MODEL },
            httpOptions: { apiVersion: 'v1alpha' },
        },
    });

    // Test access_token
    const wsUrl = `wss://generativelanguage.googleapis.com/ws/google.ai.generativelanguage.v1alpha.GenerativeService.BidiGenerateContentConstrained?access_token=${token.name}`;
    console.log('Connecting to WS...');
    
    const ws = new WebSocket(wsUrl);

    ws.on('open', () => {
        console.log('WebSocket Open! Sending Setup...');
        ws.send(JSON.stringify({
            setup: {
                model: `models/${MODEL}`,
                generationConfig: { responseModalities: ['AUDIO'] }
            }
        }));
    });

    ws.on('message', (data) => {
        console.log('Received Message From Server:', data.toString().substring(0, 100));
        process.exit(0);
    });

    ws.on('close', (code, reason) => {
        console.error('WebSocket Closed:', code, reason.toString());
        process.exit(1);
    });
}
testConnection();
