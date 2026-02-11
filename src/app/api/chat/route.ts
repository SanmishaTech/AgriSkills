import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// Force Node.js runtime (needed for Prisma)
export const runtime = 'nodejs';

const GROQ_API_KEY = process.env.GROQ_API_KEY;
const GROQ_MODEL = process.env.GROQ_MODEL || 'llama-3.3-70b-versatile';

const BASE_SYSTEM_PROMPT = `You are Gram Kushal AI — a friendly, knowledgeable assistant for the Gram Kushal (AgriSkills) platform.

About the platform:
- Gram Kushal is an agricultural education platform that helps farmers learn modern farming techniques.
- Users can browse topics, watch educational videos, take quizzes, earn certificates, and read success stories.
- The platform supports multiple languages through Google Translate.
- Available features: Dashboard, Courses, Topics, Subtopics, Quizzes, Certificates, Success Stories, Help & Support.

Your role:
- Answer questions about the Gram Kushal platform, its features, and how to use it.
- When asked about topics, courses, or subtopics, use ONLY the real data provided below. NEVER make up or invent topic/course names.
- Provide agricultural knowledge and farming advice when asked.
- Be helpful, concise, and encouraging.
- If asked about something completely unrelated to agriculture or the platform, politely redirect the conversation.
- Respond in the same language the user writes in.
- Keep responses brief (2-4 sentences) unless the user asks for detailed information.`;

type ChatMessage = {
    role: 'user' | 'assistant' | 'system';
    content: string;
};

/**
 * Fetch real topics, subtopics and courses from the database
 * and format them as a context string for the AI.
 */
async function getProjectContext(): Promise<string> {
    try {
        const topics = await prisma.topic.findMany({
            where: { isActive: true },
            select: {
                title: true,
                subtopics: {
                    where: { isActive: true },
                    select: {
                        title: true,
                        courses: {
                            where: { isActive: true },
                            select: { title: true },
                        },
                    },
                },
            },
            orderBy: { createdAt: 'desc' },
        });

        console.log('[Chat API] Fetched topics:', topics.length);

        if (!topics.length) {
            return '\n\nCurrent platform content: No topics are available yet.';
        }

        let context = '\n\nHere is the REAL, CURRENT content available on the platform. Use ONLY this data when answering about topics, subtopics, or courses:\n\n';

        topics.forEach((topic, i) => {
            context += `${i + 1}. Topic: "${topic.title}"\n`;
            if (topic.subtopics && topic.subtopics.length > 0) {
                topic.subtopics.forEach((sub) => {
                    context += `   - Subtopic: "${sub.title}"\n`;
                    if (sub.courses && sub.courses.length > 0) {
                        sub.courses.forEach((course) => {
                            context += `     • Course: "${course.title}"\n`;
                        });
                    }
                });
            }
        });

        context += '\nIMPORTANT: If a user asks about topics/courses, list ONLY the ones above. Do NOT invent or hallucinate any names.';

        return context;
    } catch (error) {
        console.error('[Chat API] Failed to fetch project context:', error);
        return '\n\n(Could not load current platform content from database.)';
    }
}

export async function POST(request: NextRequest) {
    if (!GROQ_API_KEY) {
        return NextResponse.json(
            { error: 'AI chat is not configured. Please add GROQ_API_KEY to your environment.' },
            { status: 500 }
        );
    }

    try {
        const body = await request.json();
        const userMessages: ChatMessage[] = body.messages || [];

        if (!userMessages.length) {
            return NextResponse.json({ error: 'No messages provided.' }, { status: 400 });
        }

        // Fetch real data from the database
        const projectContext = await getProjectContext();

        // Build the messages array with system prompt + real data
        const messages: ChatMessage[] = [
            { role: 'system', content: BASE_SYSTEM_PROMPT + projectContext },
            ...userMessages.map((m) => ({
                role: m.role as 'user' | 'assistant',
                content: m.content,
            })),
        ];

        const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${GROQ_API_KEY}`,
            },
            body: JSON.stringify({
                model: GROQ_MODEL,
                messages,
                temperature: 0.7,
                max_tokens: 512,
            }),
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error('Groq API error:', response.status, errorText);
            return NextResponse.json(
                { error: 'Failed to get AI response. Please try again.' },
                { status: 502 }
            );
        }

        const data = await response.json();
        const reply = data.choices?.[0]?.message?.content || 'Sorry, I could not generate a response.';

        return NextResponse.json({ reply });
    } catch (error) {
        console.error('Chat API error:', error);
        return NextResponse.json(
            { error: 'Something went wrong. Please try again.' },
            { status: 500 }
        );
    }
}
