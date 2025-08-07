import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyToken } from '@/lib/auth';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Get the token from the Authorization header
    const authHeader = request.headers.get('authorization');
    const token = authHeader?.split(' ')[1];

    if (!token) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Verify the token (any authenticated user can view chapters)
    const decoded = verifyToken(token);
    if (!decoded) {
      return NextResponse.json(
        { error: 'Invalid token' },
        { status: 401 }
      );
    }

    const { id } = await params;

    // Verify topic exists and is active
    const topic = await prisma.topic.findUnique({
      where: {
        id,
        isActive: true
      }
    });

    if (!topic) {
      return NextResponse.json(
        { error: 'Topic not found' },
        { status: 404 }
      );
    }

    // Get all active chapters for the topic through subtopics
    const topicWithChapters = await prisma.topic.findUnique({
      where: {
        id,
        isActive: true
      },
      include: {
        subtopics: {
          where: {
            isActive: true
          },
          include: {
            chapters: {
              where: {
                isActive: true
              },
              select: {
                id: true,
                title: true,
                description: true,
                createdAt: true,
                updatedAt: true,
                subtopicId: true
              },
              orderBy: {
                createdAt: 'asc'
              }
            }
          }
        }
      }
    });

    // Flatten all chapters from all subtopics
    const chapters = topicWithChapters?.subtopics.flatMap(subtopic => 
      subtopic.chapters.map(chapter => ({
        ...chapter,
        subtopicTitle: subtopic.title
      }))
    ) || [];

    return NextResponse.json({ 
      topic: {
        id: topic.id,
        title: topic.title,
        description: topic.description
      },
      chapters 
    });
  } catch (error) {
    console.error('Topic chapters error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
