import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import jwt from 'jsonwebtoken';

// Verify admin authentication
async function verifyAdmin(request: NextRequest) {
  try {
    const token = request.headers.get('Authorization')?.replace('Bearer ', '');
    if (!token) {
      return null;
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any;
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId }
    });

    if (!user || user.role !== 'admin') {
      return null;
    }

    return user;
  } catch (error) {
    return null;
  }
}

// GET /api/admin/quizzes - List all quizzes
export async function GET(request: NextRequest) {
  try {
    const user = await verifyAdmin(request);
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const quizzes = await prisma.quiz.findMany({
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
        questions: {
          include: {
            answers: true
          },
          orderBy: {
            orderIndex: 'asc'
          }
        },
        _count: {
          select: {
            questions: true,
            attempts: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    return NextResponse.json({ 
      success: true,
      quizzes 
    });
  } catch (error) {
    console.error('Quiz fetch error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST /api/admin/quizzes - Create a new quiz
export async function POST(request: NextRequest) {
  try {
    const user = await verifyAdmin(request);
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { 
      title, 
      description, 
      chapterId, 
      passingScore, 
      timeLimit,
      isActive,
      questions 
    } = body;

    // Validate required fields
    if (!title || !chapterId || !questions || questions.length === 0) {
      return NextResponse.json(
        { error: 'Title, chapter, and at least one question are required' },
        { status: 400 }
      );
    }

    // Check if quiz already exists for this chapter
    const existingQuiz = await prisma.quiz.findUnique({
      where: { chapterId }
    });

    if (existingQuiz) {
      return NextResponse.json(
        { error: 'A quiz already exists for this chapter' },
        { status: 400 }
      );
    }

    // Verify chapter exists
    const chapter = await prisma.chapter.findUnique({
      where: { id: chapterId }
    });

    if (!chapter) {
      return NextResponse.json(
        { error: 'Chapter not found' },
        { status: 404 }
      );
    }

    // Create quiz with questions and answers
    const quiz = await prisma.quiz.create({
      data: {
        title,
        description,
        chapterId,
        passingScore: passingScore || 50,
        timeLimit,
        isActive: isActive !== false,
        questions: {
          create: questions.map((question: any, index: number) => ({
            text: question.text,
            type: question.type || 'multiple_choice',
            points: question.points || 1,
            orderIndex: index,
            answers: {
              create: question.answers.map((answer: any, answerIndex: number) => ({
                text: answer.text,
                isCorrect: answer.isCorrect || false,
                orderIndex: answerIndex
              }))
            }
          }))
        }
      },
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
        questions: {
          include: {
            answers: true
          },
          orderBy: {
            orderIndex: 'asc'
          }
        }
      }
    });

    return NextResponse.json({ 
      success: true,
      quiz 
    });
  } catch (error) {
    console.error('Quiz creation error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
