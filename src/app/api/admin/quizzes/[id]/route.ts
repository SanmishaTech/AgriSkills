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
      where: { id: decoded.sub }
    });

    if (!user || user.role !== 'admin') {
      return null;
    }

    return user;
  } catch (error) {
    return null;
  }
}

// GET /api/admin/quizzes/[id] - Get a specific quiz
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await verifyAdmin(request);
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { id } = await params;

    const quiz = await prisma.quiz.findUnique({
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
        questions: {
          include: {
            answers: true
          },
          orderBy: {
            orderIndex: 'asc'
          }
        },
        attempts: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true
              }
            }
          },
          orderBy: {
            startedAt: 'desc'
          }
        },
        _count: {
          select: {
            questions: true,
            attempts: true
          }
        }
      }
    });

    if (!quiz) {
      return NextResponse.json(
        { error: 'Quiz not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ 
      success: true,
      quiz 
    });
  } catch (error) {
    console.error('Quiz fetch error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// PUT /api/admin/quizzes/[id] - Update a quiz
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await verifyAdmin(request);
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { id } = await params;
    const body = await request.json();
    const { 
      title, 
      description, 
      passingScore, 
      timeLimit,
      isActive,
      questions 
    } = body;

    // Validate required fields
    if (!title) {
      return NextResponse.json(
        { error: 'Title is required' },
        { status: 400 }
      );
    }

    // Check if quiz exists
    const existingQuiz = await prisma.quiz.findUnique({
      where: { id }
    });

    if (!existingQuiz) {
      return NextResponse.json(
        { error: 'Quiz not found' },
        { status: 404 }
      );
    }

    // Update quiz in a transaction
    const updatedQuiz = await prisma.$transaction(async (tx) => {
      // Delete existing questions and answers if new questions provided
      if (questions && questions.length > 0) {
        await tx.question.deleteMany({
          where: { quizId: id }
        });
      }

      // Update quiz
      const quiz = await tx.quiz.update({
        where: { id },
        data: {
          title,
          description,
          passingScore: passingScore || 50,
          timeLimit,
          isActive: isActive !== false,
          ...(questions && questions.length > 0 && {
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
          })
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

      return quiz;
    });

    return NextResponse.json({ 
      success: true,
      quiz: updatedQuiz 
    });
  } catch (error) {
    console.error('Quiz update error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// DELETE /api/admin/quizzes/[id] - Delete a quiz
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await verifyAdmin(request);
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { id } = await params;

    // Check if quiz exists
    const existingQuiz = await prisma.quiz.findUnique({
      where: { id }
    });

    if (!existingQuiz) {
      return NextResponse.json(
        { error: 'Quiz not found' },
        { status: 404 }
      );
    }

    // Delete quiz (cascade will delete questions, answers, and attempts)
    await prisma.quiz.delete({
      where: { id }
    });

    return NextResponse.json({ 
      success: true,
      message: 'Quiz deleted successfully' 
    });
  } catch (error) {
    console.error('Quiz deletion error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
