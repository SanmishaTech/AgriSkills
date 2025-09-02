import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyToken } from '@/lib/auth';

// GET /api/courses/[id] - Get course details for users
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: courseId } = await params;

    // Optional authentication - users can view courses without being logged in
    const authHeader = request.headers.get('authorization');
    let userId: string | null = null;
    
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      const decoded = verifyToken(token) as { id: string } | null;
      if (decoded) {
        userId = decoded.id;
      }
    }

    // Fetch course with all related data
    const course = await prisma.course.findUnique({
      where: { 
        id: courseId,
        isActive: true
      },
      include: {
        subtopic: {
          include: {
            topic: {
              select: {
                id: true,
                title: true,
                description: true,
                thumbnail: true
              }
            }
          }
        },
        chapters: {
          where: {
            isActive: true
          },
          orderBy: {
            orderIndex: 'asc'
          },
          include: {
            quiz: {
              select: {
                id: true,
                title: true,
                passingScore: true,
                timeLimit: true,
                // Don't include questions in course overview
              }
            }
          }
        },
        completions: userId ? {
          where: {
            userId: userId
          },
          select: {
            id: true,
            completedAt: true
          }
        } : false
      }
    });

    if (!course) {
      return NextResponse.json(
        { error: 'Course not found' },
        { status: 404 }
      );
    }

    // Get completion status
    const isCompleted = userId && course.completions && course.completions.length > 0;
    const completedAt = isCompleted ? course.completions[0].completedAt : null;

    // Calculate total duration from chapters
    const totalDuration = course.chapters.reduce((total, chapter) => {
      // Estimate 10 minutes per chapter if no specific duration
      return total + (chapter.duration || 10);
    }, 0);

    // Format response
    const responseData = {
      course: {
        id: course.id,
        title: course.title,
        description: course.description,
        thumbnail: course.thumbnail,
        level: course.level,
        duration: totalDuration,
        isCompleted,
        completedAt,
        subtopic: course.subtopic,
        chapters: course.chapters.map(chapter => ({
          id: chapter.id,
          title: chapter.title,
          description: chapter.description,
          orderIndex: chapter.orderIndex,
          hasQuiz: !!chapter.quiz,
          quiz: chapter.quiz ? {
            id: chapter.quiz.id,
            title: chapter.quiz.title,
            passingScore: chapter.quiz.passingScore,
            timeLimit: chapter.quiz.timeLimit
          } : null
        }))
      }
    };

    return NextResponse.json(responseData);
  } catch (error) {
    console.error('Get course error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
