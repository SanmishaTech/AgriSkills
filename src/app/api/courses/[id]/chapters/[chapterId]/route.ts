import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyToken } from '@/lib/auth';

// GET /api/courses/[id]/chapters/[chapterId] - Get chapter details for users
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; chapterId: string }> }
) {
  try {
    // Optional authentication - users can view chapters without being logged in
    const authHeader = request.headers.get('authorization');
    let userId: string | null = null;
    
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      const decoded = verifyToken(token) as { id: string } | null;
      if (decoded) {
        userId = decoded.id;
      }
    }

    const { id: courseId, chapterId } = await params;

    // Get chapter with course and quiz information
    const chapter = await prisma.chapter.findUnique({
      where: {
        id: chapterId,
        courseId: courseId,
        isActive: true
      },
      include: {
        course: {
          select: {
            id: true,
            title: true,
            description: true,
            subtopic: {
              select: {
                id: true,
                title: true,
                topic: {
                  select: {
                    id: true,
                    title: true
                  }
                }
              }
            }
          }
        },
        quiz: {
          select: {
            id: true,
            title: true,
            passingScore: true,
            timeLimit: true,
            // Don't include questions - that's for the quiz endpoint
          }
        }
      }
    });

    if (!chapter) {
      return NextResponse.json(
        { error: 'Chapter not found' },
        { status: 404 }
      );
    }

    // Get all chapters in the course for navigation
    const allChapters = await prisma.chapter.findMany({
      where: {
        courseId: courseId,
        isActive: true
      },
      orderBy: {
        orderIndex: 'asc'
      },
      select: {
        id: true,
        title: true,
        orderIndex: true
      }
    });

    // Find current chapter index
    const currentIndex = allChapters.findIndex(ch => ch.id === chapterId);
    const previousChapter = currentIndex > 0 ? allChapters[currentIndex - 1] : null;
    const nextChapter = currentIndex < allChapters.length - 1 ? allChapters[currentIndex + 1] : null;

    // Format response
    const responseData = {
      chapter: {
        id: chapter.id,
        title: chapter.title,
        description: chapter.description,
        content: chapter.content,
        youtubeUrl: chapter.youtubeUrl,
        orderIndex: chapter.orderIndex,
        course: chapter.course,
        quiz: chapter.quiz,
        navigation: {
          previous: previousChapter,
          next: nextChapter,
          current: currentIndex + 1,
          total: allChapters.length
        }
      }
    };

    return NextResponse.json(responseData);
  } catch (error) {
    console.error('Get chapter error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
