import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const createChapterSchema = z.object({
  title: z.string().min(1, 'Title is required').max(200, 'Title must be less than 200 characters'),
  description: z.string().optional(),
  content: z.string().min(1, 'Content is required'),
  youtubeUrl: z.string().optional(),
  isActive: z.boolean().default(true),
  subtopicId: z.string().min(1, 'Subtopic ID is required'),
});

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    // Check authentication and admin role
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.substring(7);
    const decoded = verifyToken(token) as { role: string } | null;
    if (!decoded || decoded.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden - Admin access required' }, { status: 403 });
    }

    const params = await context.params;
    const topicId = params.id;

    // Verify topic exists
    const topic = await prisma.topic.findUnique({
      where: { id: topicId },
      select: { id: true, title: true },
    });

    if (!topic) {
      return NextResponse.json({ error: 'Topic not found' }, { status: 404 });
    }

    // Parse and validate request body
    const body = await request.json();
    const validatedData = createChapterSchema.parse(body);

    // Verify subtopic exists and belongs to the topic
    const subtopic = await prisma.subtopic.findFirst({
      where: { 
        id: validatedData.subtopicId,
        topicId: topicId
      },
      select: { id: true, title: true }
    });

    if (!subtopic) {
      return NextResponse.json({ error: 'Subtopic not found or does not belong to this topic' }, { status: 404 });
    }

    // Create the chapter under the specified subtopic
    const chapter = await prisma.chapter.create({
      data: {
        title: validatedData.title,
        description: validatedData.description || null,
        content: validatedData.content,
        youtubeUrl: validatedData.youtubeUrl || null,
        isActive: validatedData.isActive,
        subtopicId: validatedData.subtopicId,
      },
      include: {
        subtopic: {
          select: {
            id: true,
            title: true,
            topic: {
              select: {
                id: true,
                title: true,
              },
            },
          },
        },
      },
    });

    return NextResponse.json(chapter, { status: 201 });
  } catch (error) {
    console.error('Error creating chapter:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.format() },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
