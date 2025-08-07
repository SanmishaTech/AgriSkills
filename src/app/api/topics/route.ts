import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyToken } from '@/lib/auth';

// Force Node.js runtime to use jsonwebtoken
export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
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

    // Verify the token (any authenticated user can view topics)
    const decoded = verifyToken(token);
    if (!decoded) {
      return NextResponse.json(
        { error: 'Invalid token' },
        { status: 401 }
      );
    }

    // Get all active topics with subtopics and chapter count
    const topics = await prisma.topic.findMany({
      where: {
        isActive: true
      },
      include: {
        subtopics: {
          where: {
            isActive: true
          },
          include: {
            _count: {
              select: {
                chapters: {
                  where: {
                    isActive: true
                  }
                }
              }
            }
          }
        },
        _count: {
          select: { 
            subtopics: {
              where: {
                isActive: true
              }
            }
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    // Filter out topics with no active chapters and calculate total chapters
    const topicsWithChapters = topics.filter(topic => {
      const totalChapters = topic.subtopics.reduce((sum, subtopic) => sum + subtopic._count.chapters, 0);
      return totalChapters > 0;
    }).map(topic => ({
      ...topic,
      _count: {
        ...topic._count,
        chapters: topic.subtopics.reduce((sum, subtopic) => sum + subtopic._count.chapters, 0)
      }
    }));

    return NextResponse.json({ topics: topicsWithChapters });
  } catch (error) {
    console.error('Topics error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
