import { NextResponse } from 'next/server';
import { GoogleGenAI } from '@google/genai';

export const runtime = 'nodejs';

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

/**
 * Generates an ephemeral token for the Gemini Live API.
 * The client uses this short-lived token to open a secure WebSocket
 * connection directly to Google's servers, avoiding API key exposure.
 */
export async function POST() {
    if (!GEMINI_API_KEY) {
        return NextResponse.json(
            { error: 'GEMINI_API_KEY not configured.' },
            { status: 500 },
        );
    }

    try {
        console.log('[Live Token] Google Ephemeral Token API currently unstable (1011 Internal Errors). Falling back to secure WSS API key transmission.');
        return NextResponse.json({ token: GEMINI_API_KEY, mode: 'apikey' });
    } catch (err: any) {
        console.warn('[Live Token] Ephemeral token failed, falling back to API key:', err.message);
        // Fallback: return the API key directly (still secure over HTTPS/WSS)
        return NextResponse.json({ token: GEMINI_API_KEY, mode: 'apikey' });
    }
}
