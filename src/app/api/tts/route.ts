import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenAI } from '@google/genai';

export const runtime = 'nodejs';

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const TTS_MODEL = 'gemini-2.5-flash-preview-tts';
const MAX_TTS_RETRIES = 2;

// ── PCM → WAV conversion (44-byte RIFF header) ──
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
    header.writeUInt32LE(16, 16);       // PCM sub-chunk size
    header.writeUInt16LE(1, 20);        // Audio format = PCM
    header.writeUInt16LE(numChannels, 22);
    header.writeUInt32LE(sampleRate, 24);
    header.writeUInt32LE(byteRate, 28);
    header.writeUInt16LE(blockAlign, 32);
    header.writeUInt16LE(bitsPerSample, 34);
    header.write('data', 36);
    header.writeUInt32LE(dataSize, 40);

    return Buffer.concat([header, pcmBuffer]);
}

const genAI = GEMINI_API_KEY ? new GoogleGenAI({ apiKey: GEMINI_API_KEY }) : null;

export async function POST(request: NextRequest) {
    if (!genAI) {
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

        // Truncate very long text to avoid token limits on TTS model
        const trimmedText = text.length > 800 ? text.slice(0, 800) + '...' : text;

        let audioData: any = null;

        // Retry loop – the TTS model sometimes returns finishReason: "OTHER" with no audio
        for (let attempt = 0; attempt <= MAX_TTS_RETRIES; attempt++) {
            try {
                const result = await genAI.models.generateContent({
                    model: TTS_MODEL,
                    contents: [{ parts: [{ text: trimmedText }] }],
                    config: {
                        responseModalities: ['AUDIO'],
                        speechConfig: {
                            voiceConfig: {
                                prebuiltVoiceConfig: {
                                    voiceName: 'Kore',
                                },
                            },
                        },
                    },
                });

                audioData = result.candidates?.[0]?.content?.parts?.[0]?.inlineData;

                if (audioData?.data) {
                    console.log(`[TTS API] Success on attempt ${attempt + 1}`);
                    break;
                }

                const reason = result.candidates?.[0]?.finishReason || 'unknown';
                console.warn(`[TTS API] Attempt ${attempt + 1} got no audio (finishReason: ${reason}). Retrying...`);
            } catch (retryErr: any) {
                console.warn(`[TTS API] Attempt ${attempt + 1} threw:`, retryErr.message);
            }
        }

        if (!audioData?.data) {
            console.error('[TTS API] All retries exhausted, no audio generated.');
            return NextResponse.json({ error: 'No audio generated after retries.' }, { status: 500 });
        }

        const pcmBuffer = Buffer.from(audioData.data, 'base64');
        const mimeType: string = audioData.mimeType || '';
        const rateMatch = mimeType.match(/rate=(\d+)/);
        const sampleRate = rateMatch ? parseInt(rateMatch[1], 10) : 24000;

        const wavBuffer = pcmToWav(pcmBuffer, sampleRate, 1, 16);
        console.log(`[TTS API] WAV: ${wavBuffer.length} bytes, rate=${sampleRate}, mime=${mimeType}`);

        // Convert Node Buffer to Uint8Array for proper NextResponse binary handling
        const responseBytes = new Uint8Array(wavBuffer.buffer, wavBuffer.byteOffset, wavBuffer.byteLength);

        return new Response(responseBytes as any, {
            headers: {
                'Content-Type': 'audio/wav',
                'Content-Length': responseBytes.byteLength.toString(),
                'Cache-Control': 'no-cache',
            },
        });
    } catch (err: any) {
        console.error('[TTS API] Unexpected error:', err);
        return NextResponse.json(
            { error: 'Failed to generate speech: ' + (err.message || 'Unknown error') },
            { status: 500 },
        );
    }
}