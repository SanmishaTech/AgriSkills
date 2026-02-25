import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const TTS_MODEL = 'gemini-2.5-flash-preview-tts';

// ── Build a valid WAV file from raw PCM data ──
function pcmToWav(pcmBuffer: Buffer, sampleRate: number, numChannels: number, bitsPerSample: number): Buffer {
    const byteRate = sampleRate * numChannels * (bitsPerSample / 8);
    const blockAlign = numChannels * (bitsPerSample / 8);
    const dataSize = pcmBuffer.length;

    // WAV header is 44 bytes
    const header = Buffer.alloc(44);

    // RIFF chunk descriptor
    header.write('RIFF', 0);
    header.writeUInt32LE(36 + dataSize, 4);     // ChunkSize
    header.write('WAVE', 8);

    // "fmt " sub-chunk
    header.write('fmt ', 12);
    header.writeUInt32LE(16, 16);               // Subchunk1Size (PCM = 16)
    header.writeUInt16LE(1, 20);                // AudioFormat (PCM = 1)
    header.writeUInt16LE(numChannels, 22);      // NumChannels
    header.writeUInt32LE(sampleRate, 24);       // SampleRate
    header.writeUInt32LE(byteRate, 28);         // ByteRate
    header.writeUInt16LE(blockAlign, 32);       // BlockAlign
    header.writeUInt16LE(bitsPerSample, 34);    // BitsPerSample

    // "data" sub-chunk
    header.write('data', 36);
    header.writeUInt32LE(dataSize, 40);         // Subchunk2Size

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

        // Call Gemini 2.5 Flash TTS via REST API
        const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${TTS_MODEL}:generateContent?key=${GEMINI_API_KEY}`;

        const response = await fetch(endpoint, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
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

        const data = await response.json();

        if (!response.ok) {
            console.error('[TTS API] Gemini error:', JSON.stringify(data));
            return NextResponse.json(
                { error: 'TTS generation failed.' },
                { status: 502 },
            );
        }

        // Extract the inline audio data from the response
        const audioData =
            data.candidates?.[0]?.content?.parts?.[0]?.inlineData;

        if (!audioData?.data) {
            console.error('[TTS API] No audio in response:', JSON.stringify(data));
            return NextResponse.json(
                { error: 'No audio generated.' },
                { status: 500 },
            );
        }

        // Decode the base64 PCM data
        const pcmBuffer = Buffer.from(audioData.data, 'base64');

        // Parse sample rate from mimeType (e.g. "audio/L16;codec=pcm;rate=24000")
        const mimeType: string = audioData.mimeType || '';
        const rateMatch = mimeType.match(/rate=(\d+)/);
        const sampleRate = rateMatch ? parseInt(rateMatch[1], 10) : 24000;

        // Convert raw PCM → WAV so browsers can play it
        const wavBuffer = pcmToWav(pcmBuffer, sampleRate, 1, 16);

        return new NextResponse(wavBuffer, {
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
