import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import jwt from 'jsonwebtoken';

// Verify user authentication
async function verifyUser(request: NextRequest) {
  try {
    const token = request.headers.get('Authorization')?.replace('Bearer ', '');
    if (!token) {
      return null;
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any;
    const user = await prisma.user.findUnique({
      where: { id: decoded.sub }
    });

    return user;
  } catch (error) {
    return null;
  }
}

// GET /api/quiz/[id] - Get quiz information for users
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await verifyUser(request);
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { id } = await params;

    // First try to find quiz by ID
    let quiz = await prisma.quiz.findUnique({
      where: { id },
      include: {
        chapter: {
          include: {
            course: {
              include: {
                subtopic: {
                  include: {
                    topic: true
                  }
                }
              }
            }
          }
        },
        _count: {
          select: {
            questions: true
          }
        }
      }
    });

    // If not found by ID, try to find by chapterId (in case ID passed is chapterId)
    if (!quiz) {
      quiz = await prisma.quiz.findUnique({
        where: { chapterId: id },
        include: {
          chapter: {
            include: {
              course: {
                include: {
                  subtopic: {
                    include: {
                      topic: true
                    }
                  }
                }
              }
            }
          },
          _count: {
            select: {
              questions: true
            }
          }
        }
      });
    }

    if (!quiz) {
      return NextResponse.json(
        { error: 'Quiz not found' },
        { status: 404 }
      );
    }

    // Check if quiz is active
    if (!quiz.isActive) {
      return NextResponse.json(
        { error: 'Quiz is not active' },
        { status: 400 }
      );
    }

    // Check user's previous attempts
    const attempts = await prisma.quizAttempt.findMany({
      where: {
        userId: user.id,
        quizId: quiz.id
      },
      orderBy: {
        startedAt: 'desc'
      },
      select: {
        id: true,
        score: true,
        isPassed: true,
        completedAt: true,
        startedAt: true
      }
    });

    // Check if there's an active (incomplete) attempt
    const activeAttempt = attempts.find(attempt => !attempt.completedAt);

    return NextResponse.json({
      success: true,
      quiz: {
        id: quiz.id,
        title: quiz.title,
        description: quiz.description,
        passingScore: quiz.passingScore,
        timeLimit: quiz.timeLimit,
        questionsCount: quiz._count.questions,
        chapter: {
          id: quiz.chapter.id,
          title: quiz.chapter.title,
          course: {
            id: quiz.chapter.course.id,
            title: quiz.chapter.course.title,
            subtopic: {
              id: quiz.chapter.course.subtopic.id,
              title: quiz.chapter.course.subtopic.title,
              topic: {
                id: quiz.chapter.course.subtopic.topic.id,
                title: quiz.chapter.course.subtopic.topic.title
              }
            }
          }
        }
      },
      attempts: attempts.map(attempt => ({
        id: attempt.id,
        score: attempt.score,
        isPassed: attempt.isPassed,
        completedAt: attempt.completedAt,
        startedAt: attempt.startedAt,
        isActive: !attempt.completedAt
      })),
      hasActiveAttempt: !!activeAttempt,
      activeAttemptId: activeAttempt?.id
    });
  } catch (error) {
    console.error('Quiz fetch error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
