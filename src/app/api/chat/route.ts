import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { GoogleGenAI } from '@google/genai';

export const runtime = 'nodejs';

// We get our secret API key and the specific model name from environment variables.
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const GEMINI_MODEL = process.env.GEMINI_MODEL || 'gemini-2.5-flash';
const APP_NAME = process.env.NEXT_PUBLIC_APP_NAME || 'GramKushal';

// Simplified background instruction sets the personality of the AI.
const BASE_SYSTEM_PROMPT = `You are ${APP_NAME} AI — a friendly, knowledgeable assistant. 
You provide expert advice on modern farming techniques, agriculture, and help users navigate the ${APP_NAME} platform.

IMPORTANT: 
- If the user asks for anything NOT related to agriculture or the ${APP_NAME} platform, politely tell them that you are an agricultural assistant and advise them to contact the SFC website for other inquiries.
- When sharing any video link (Shorts, Demos, Chapters), you MUST format it as a clickable Markdown link: [Video Title](URL). 
- Be helpful, concise, and encourage users to explore the platform's courses.
- Respond in the same language the user writes in.`;

type ChatMessage = {
    role: 'user' | 'assistant';
    content: string;
};

// ── Context cache (5-min TTL, avoids repeated DB hits) ──
let cachedContext: string | null = null;
let cacheTimestamp = 0;
const CONTEXT_CACHE_TTL_MS = 5 * 60 * 1000;

async function getProjectContext(): Promise<string> {
    const now = Date.now();
    if (cachedContext !== null && now - cacheTimestamp < CONTEXT_CACHE_TTL_MS) {
        return cachedContext;
    }
    
    try {
        const topics = await prisma.topic.findMany({
            where: { isActive: true },
            select: {
                title: true,
                demo: { select: { demoUrls: true } },
                subtopics: {
                    where: { isActive: true },
                    select: {
                        title: true,
                        courses: {
                            where: { isActive: true },
                            select: {
                                title: true,
                                chapters: {
                                    where: { isActive: true, youtubeUrl: { not: null } },
                                    select: { title: true, youtubeUrl: true },
                                },
                            },
                        },
                    },
                },
            },
            orderBy: { createdAt: 'desc' },
        });

        const shorts = await prisma.youTubeShort.findMany({
            where: { isActive: true },
            select: { title: true, url: true },
            take: 20,
        });

        let context = '\n\nAVAILABLE PLATFORM CONTENT:\n';

        if (shorts.length > 0) {
            context += '=== SHORTS / REELS ===\n';
            shorts.forEach(s => { context += `- Short: "${s.title}" -> Link: ${s.url}\n`; });
        }

        context += '\n=== TOPICS & COURSES ===\n';
        topics.forEach((topic, i) => {
            context += `${i + 1}. Topic: "${topic.title}"\n`;
            if (topic.demo?.demoUrls) {
                let urls = [];
                try { urls = typeof topic.demo.demoUrls === 'string' ? JSON.parse(topic.demo.demoUrls) : topic.demo.demoUrls; } catch (e) {}
                if (urls?.length > 0) context += `   * Topic Demo Video: ${urls[0]}\n`;
            }
            topic.subtopics?.forEach(sub => {
                context += `   - Subtopic: "${sub.title}"\n`;
                sub.courses?.forEach(course => {
                    context += `     • Course: "${course.title}"\n`;
                    course.chapters?.forEach(ch => {
                        if (ch.youtubeUrl) context += `       > Chapter Video: "${ch.title}" -> Link: ${ch.youtubeUrl}\n`;
                    });
                });
            });
        });

        cachedContext = context;
        cacheTimestamp = Date.now();
        return context;
    } catch (error) {
        console.error('[Chat API] Failed to fetch project context:', error);
        return '';
    }
}

// ── initialization ──
const genAI = GEMINI_API_KEY ? new GoogleGenAI({ apiKey: GEMINI_API_KEY }) : null;

export async function POST(request: NextRequest) {
    if (!genAI) {
        return NextResponse.json(
            { error: 'AI chat is not configured. Please add GEMINI_API_KEY to your environment.' },
            { status: 500 },
        );
    }

    try {
        const body = await request.json();
        const userMessages: ChatMessage[] = body.messages || [];

        if (!userMessages.length) {
            return NextResponse.json({ error: 'No messages provided.' }, { status: 400 });
        }

        const reqLanguage = body.language || 'en-US';

        const aiDbAccess = process.env.AI_DB_ACCESS?.toLowerCase() === 'on';
        const projectContext = aiDbAccess ? await getProjectContext() : '';
        
        // --- Fetch Custom Knowledge Base ---
        let customKnowledgeBase = '';
        try {
            const kbConfig = await prisma.appConfig.findUnique({
                where: { key: 'llm_knowledge_base' }
            });
            if (kbConfig?.value) {
                customKnowledgeBase = `\n\nCUSTOM KNOWLEDGE BASE:\n${kbConfig.value}\n`;
            }
        } catch (kbErr) {
            console.error('[Chat API] KB fetch failed:', kbErr);
        }

        let languageInstruction = '';
        if (reqLanguage === 'hi-IN') languageInstruction = '\nCRITICAL: You MUST respond ONLY in Hindi (हिंदी).';
        else if (reqLanguage === 'mr-IN') languageInstruction = '\nCRITICAL: You MUST respond ONLY in Marathi (मराठी).';
        else languageInstruction = '\nCRITICAL: You MUST respond ONLY in English.';

        const systemInstruction = BASE_SYSTEM_PROMPT + languageInstruction + projectContext + customKnowledgeBase;

        // Convert messages to Google Gen AI format
        const contents = userMessages.map(m => ({
            role: m.role === 'assistant' ? 'model' : 'user',
            parts: [{ text: m.content }],
        }));

        const result = await genAI.models.generateContent({
            model: GEMINI_MODEL,
            contents: contents,
            config: {
                systemInstruction: systemInstruction,
                temperature: 0.7,
                maxOutputTokens: 1024,
            }
        });

        const reply = result.text || 'Sorry, I could not generate a response.';
        return NextResponse.json({ reply });

    } catch (err: any) {
        console.error('[Chat API] Unexpected error:', err);
        const status = err?.status || 500;
        return NextResponse.json({ error: err.message || 'Failed to get AI response.' }, { status });
    }
}