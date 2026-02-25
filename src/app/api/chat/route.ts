import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { prisma } from '@/lib/prisma';
import { geminiRateLimiter } from '@/lib/rate-limiter';

// Force Node.js runtime (needed for Prisma)
export const runtime = 'nodejs';

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const GEMINI_MODEL = process.env.GEMINI_MODEL || 'gemini-2.5-flash';

const APP_NAME = process.env.NEXT_PUBLIC_APP_NAME || 'GramKushal';

const BASE_SYSTEM_PROMPT = `You are ${APP_NAME} AI — a friendly, knowledgeable assistant for the ${APP_NAME} platform.

Your CORE PURPOSE is to assist with:
1. Modern farming techniques, planting, and agriculture (e.g., using a tractor, growing crops).
2. Navigating and using the ${APP_NAME} platform (courses, topics, etc.).

STRICT RULES:
- ANSWER ONLY questions directly related to **farming, planting, agriculture**, or **this platform**.
- If a user asks about UNRELATED topics (e.g., coding, mechanics, physics, movies), you must REFUSE to answer. 
- WHEN REFUSING an unrelated question OR when you do not know the answer, you MUST say EXACTLY this:
  "I can only assist with farming and the ${APP_NAME} platform. For other inquiries, please contact **Shop for Change**, an NGO empowering farmers through fair trade. You can visit them at: [https://shopforchange.ngo/](https://shopforchange.ngo/)"
- **IMPORTANT**: When sharing ANY video link (Shorts, Demos, specific Chapters), you MUST format it as a clickable Markdown link: [Video Title](URL). NEVER show the raw URL.

TONE & STYLE:
- Be helpful, concise (2-4 sentences), and encouraging.
- Respond in the same language the user writes in.
- NEVER invent topic/course names; use only the provided context.`;

type ChatMessage = {
    role: 'user' | 'assistant' | 'system';
    content: string;
};

// ────────────────────────────────────────────────────────────
// Cache for DB context (reduces redundant DB queries and keeps
// the context stable across rapid requests)
// ────────────────────────────────────────────────────────────
let cachedContext: string | null = null;
let cacheTimestamp = 0;
const CONTEXT_CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

/**
 * Fetch real topics, subtopics, courses, and videos from the database
 * and format them as a context string for the AI.
 * Results are cached for 5 minutes to avoid repeated DB hits.
 */
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
                demo: {
                    select: { demoUrls: true }
                },
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
                                    select: { title: true, youtubeUrl: true }
                                }
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
            take: 20
        });

        console.log('[Chat API] Fetched topics:', topics.length);

        if (!topics.length) {
            return '\n\nCurrent platform content: No topics are available yet.';
        }

        let context = '\n\nHere is the REAL, CURRENT content available on the platform (including VIDEO LINKS). Use ONLY this data:\n\n';

        if (shorts.length > 0) {
            context += '=== SHORTS / REELS ===\n';
            shorts.forEach(s => {
                context += `- Short: "${s.title}" -> Link: ${s.url}\n`;
            });
            context += '\n';
        }

        context += '=== TOPICS & COURSES ===\n';
        topics.forEach((topic, i) => {
            context += `${i + 1}. Topic: "${topic.title}"\n`;

            if (topic.demo && topic.demo.demoUrls && topic.demo.demoUrls.length > 0) {
                context += `   * Topic Demo Video: ${topic.demo.demoUrls[0]}\n`;
            }

            if (topic.subtopics && topic.subtopics.length > 0) {
                topic.subtopics.forEach((sub) => {
                    context += `   - Subtopic: "${sub.title}"\n`;
                    if (sub.courses && sub.courses.length > 0) {
                        sub.courses.forEach((course) => {
                            context += `     • Course: "${course.title}"\n`;
                            if (course.chapters && course.chapters.length > 0) {
                                course.chapters.forEach(ch => {
                                    if (ch.youtubeUrl) {
                                        context += `       > Chapter Video: "${ch.title}" -> Link: ${ch.youtubeUrl}\n`;
                                    }
                                });
                            }
                        });
                    }
                });
            }
        });

        context += '\nIMPORTANT INSTRUCTIONS:\n';
        context += '- If a user asks for a video, reel, or demo about a topic, provide the corresponding LINK from the list above.\n';
        context += '- If no video exists for the specific topic, say "I don\'t have a video for that specific topic yet."\n';
        context += '- When providing a link, formatted it as: [Video Title](URL)\n';

        cachedContext = context;
        cacheTimestamp = Date.now();
        return context;
    } catch (error) {
        console.error('[Chat API] Failed to fetch project context:', error);
        return '\n\n(Could not load current platform content from database.)';
    }
}

// ────────────────────────────────────────────────────────────
// Retry helper with exponential backoff + jitter
// ────────────────────────────────────────────────────────────
async function callWithRetry<T>(
    fn: () => Promise<T>,
    maxRetries = 3,
): Promise<T> {
    let lastError: unknown;
    for (let attempt = 0; attempt <= maxRetries; attempt++) {
        try {
            // Wait for a rate-limiter token before each attempt
            await geminiRateLimiter.waitForToken();
            return await fn();
        } catch (err: any) {
            lastError = err;
            const status = err?.status ?? err?.httpStatusCode ?? 0;
            const isRetryable = status === 429 || status === 503;

            console.error(
                `[Chat API] Gemini error (attempt ${attempt + 1}/${maxRetries + 1}):`,
                status,
                err?.message ?? err,
            );

            if (!isRetryable || attempt === maxRetries) {
                throw err;
            }

            // Longer backoff for free-tier: 5s, 15s, 30s + random jitter
            // Gemini's retryDelay for free tier is typically 30-60s
            const delays = [5000, 15000, 30000];
            const baseDelay = delays[Math.min(attempt, delays.length - 1)];
            const jitter = Math.random() * 2000;
            const delay = baseDelay + jitter;
            console.log(`[Chat API] Retrying in ${Math.round(delay)}ms...`);
            await new Promise((r) => setTimeout(r, delay));
        }
    }
    throw lastError;
}

// ────────────────────────────────────────────────────────────
// POST handler
// ────────────────────────────────────────────────────────────
export async function POST(request: NextRequest) {
    if (!GEMINI_API_KEY) {
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

        // Fetch real data from the database only if AI_DB_ACCESS is "on"
        const aiDbAccess = process.env.AI_DB_ACCESS?.toLowerCase() === 'on';
        const projectContext = aiDbAccess ? await getProjectContext() : '';

        // Build the system instruction
        const systemInstruction = BASE_SYSTEM_PROMPT + projectContext;

        // Build content history — map 'assistant' → 'model' for Gemini
        const contents = userMessages
            .filter((m) => m.role !== 'system')
            .map((m) => ({
                role: m.role === 'assistant' ? 'model' as const : 'user' as const,
                parts: [{ text: m.content }],
            }));

        // Initialize the Google Generative AI client
        const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
        const model = genAI.getGenerativeModel({
            model: GEMINI_MODEL,
            systemInstruction,
            generationConfig: {
                temperature: 0.7,
                maxOutputTokens: 512,
            },
        });

        // Call Gemini with retry + rate limiting
        const result = await callWithRetry(async () => {
            return model.generateContent({ contents });
        });

        const reply =
            result.response?.candidates?.[0]?.content?.parts?.[0]?.text ||
            'Sorry, I could not generate a response.';

        return NextResponse.json({ reply });
    } catch (err: any) {
        console.error('[Chat API] Unexpected error:', err);

        // Map known error statuses to user-friendly messages
        const status = err?.status ?? err?.httpStatusCode ?? 500;
        let userMessage = 'Failed to get AI response. Please try again.';

        if (status === 429) {
            userMessage = 'AI is currently busy due to high demand. Please wait a moment and try again.';
        } else if (status === 400) {
            userMessage = 'There was a problem with the request. Please try rephrasing your message.';
        } else if (status === 403) {
            userMessage = 'AI service access denied. The API key may be invalid or restricted.';
        } else if (status === 404) {
            userMessage = 'AI model not found. Please contact the administrator.';
        }

        return NextResponse.json({ error: userMessage }, { status: 502 });
    }
}
