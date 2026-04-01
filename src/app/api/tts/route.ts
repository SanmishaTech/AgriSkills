import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const TTS_MODEL = 'gemini-2.5-flash-preview-tts';

// ── Server-side timeout for Gemini TTS (ms) ──
// If Gemini doesn't respond within this, we return 504 so the client
// can immediately fall back to browser speechSynthesis instead of hanging.
const GEMINI_TTS_TIMEOUT_MS = 6000;

// ── Build a valid WAV file from raw PCM data ──
function pcmToWav(
    pcmBuffer: Buffer,
    sampleRate: number,
    numChannels: number,
    bitsPerSample: number,
): Buffer {
    const byteRate = sampleRate * numChannels * (bitsPerSample / 8);
    const blockAlign = numChannels * (bitsPerSample / 8);
    const dataSize = pcmBuffer.length;

    const header = Buffer.alloc(44);
    header.write('RIFF', 0);
    header.writeUInt32LE(36 + dataSize, 4);
    header.write('WAVE', 8);
    header.write('fmt ', 12);
    header.writeUInt32LE(16, 16);
    header.writeUInt16LE(1, 20);
    header.writeUInt16LE(numChannels, 22);
    header.writeUInt32LE(sampleRate, 24);
    header.writeUInt32LE(byteRate, 28);
    header.writeUInt16LE(blockAlign, 32);
    header.writeUInt16LE(bitsPerSample, 34);
    header.write('data', 36);
    header.writeUInt32LE(dataSize, 40);

    return Buffer.concat([header, pcmBuffer]);
}

export async function POST(request: NextRequest) {
    if (!GEMINI_API_KEY) {
        return NextResponse.json(
            { error: 'TTS not configured. Add GEMINI_API_KEY to your environment.' },
            { status: 500 },
        );
    }

    try {
        const { text } = await request.json();
        if (!text || typeof text !== 'string') {
            return NextResponse.json({ error: 'No text provided.' }, { status: 400 });
        }

        const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${TTS_MODEL}:generateContent?key=${GEMINI_API_KEY}`;

        // ── PERF FIX: Hard server-side timeout so we never hang longer than 6s ──
        // The client also has its own 4s timeout, but this is a second layer of
        // protection that ensures the server itself doesn't keep a long-lived
        // connection open if Gemini is degraded.
        const abortController = new AbortController();
        const timeoutId = setTimeout(
            () => abortController.abort(),
            GEMINI_TTS_TIMEOUT_MS,
        );

        let response: Response;
        try {
            response = await fetch(endpoint, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                signal: abortController.signal,
                body: JSON.stringify({
                    contents: [{ parts: [{ text }] }],
                    generationConfig: {
                        responseModalities: ['AUDIO'],
                        speechConfig: {
                            voiceConfig: {
                                prebuiltVoiceConfig: {
                                    voiceName: 'Kore',
                                },
                            },
                        },
                    },
                }),
            });
        } catch (fetchErr: any) {
            clearTimeout(timeoutId);
            if (fetchErr?.name === 'AbortError') {
                // Tell the client to use browser TTS immediately
                return NextResponse.json(
                    { error: 'TTS generation timed out.' },
                    { status: 504 },
                );
            }
            throw fetchErr;
        }
        clearTimeout(timeoutId);

        const data = await response.json();

        if (!response.ok) {
            console.error('[TTS API] Gemini error:', JSON.stringify(data));
            return NextResponse.json(
                { error: 'TTS generation failed.' },
                { status: 502 },
            );
        }

        const audioData = data.candidates?.[0]?.content?.parts?.[0]?.inlineData;

        if (!audioData?.data) {
            console.error('[TTS API] No audio in response:', JSON.stringify(data));
            return NextResponse.json({ error: 'No audio generated.' }, { status: 500 });
        }

        const pcmBuffer = Buffer.from(audioData.data, 'base64');

        const mimeType: string = audioData.mimeType || '';
        const rateMatch = mimeType.match(/rate=(\d+)/);
        const sampleRate = rateMatch ? parseInt(rateMatch[1], 10) : 24000;

        const wavBuffer = pcmToWav(pcmBuffer, sampleRate, 1, 16);

        return new NextResponse(wavBuffer as any, {
            headers: {
                'Content-Type': 'audio/wav',
                'Content-Length': wavBuffer.length.toString(),
                'Cache-Control': 'no-cache',
            },
        });
    } catch (err: any) {
        console.error('[TTS API] Unexpected error:', err);
        return NextResponse.json(
            { error: 'Failed to generate speech.' },
            { status: 500 },
        );
    }
}