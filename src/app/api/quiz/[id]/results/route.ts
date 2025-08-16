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
      where: { id: decoded.userId }
    });

    return user;
  } catch (error) {
    return null;
  }
}

// GET /api/quiz/[id]/results - Get quiz results for the user
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

    const { id: quizId } = await params;
    const url = new URL(request.url);
    const attemptId = url.searchParams.get('attemptId');

    if (attemptId) {
      // Get specific attempt result
      const attempt = await prisma.quizAttempt.findFirst({
        where: {
          id: attemptId,
          userId: user.id,
          quizId,
          completedAt: { not: null }
        },
        include: {
          quiz: {
            include: {
              questions: {
                include: {
                  answers: true
                },
                orderBy: {
                  orderIndex: 'asc'
                }
              }
            }
          },
          responses: {
            include: {
              question: {
                include: {
                  answers: true
                }
              }
            }
          },
          certificate: true
        }
      });

      if (!attempt) {
        return NextResponse.json(
          { error: 'Quiz attempt not found' },
          { status: 404 }
        );
      }

      return NextResponse.json({
        success: true,
        result: {
          attempt: {
            id: attempt.id,
            score: attempt.score,
            totalPoints: attempt.totalPoints,
            maxPoints: attempt.maxPoints,
            isPassed: attempt.isPassed,
            timeSpent: attempt.timeSpent,
            startedAt: attempt.startedAt,
            completedAt: attempt.completedAt
          },
          quiz: {
            id: attempt.quiz.id,
            title: attempt.quiz.title,
            description: attempt.quiz.description,
            passingScore: attempt.quiz.passingScore,
            timeLimit: attempt.quiz.timeLimit
          },
          questions: attempt.quiz.questions.map(question => {
            const response = attempt.responses.find(r => r.questionId === question.id);
            return {
              id: question.id,
              text: question.text,
              type: question.type,
              points: question.points,
              answers: question.answers.map(answer => ({
                id: answer.id,
                text: answer.text,
                isCorrect: answer.isCorrect
              })),
              userResponse: response ? {
                selectedAnswerId: response.answerId,
                selectedText: response.selectedText,
                isCorrect: response.isCorrect,
                pointsEarned: response.pointsEarned
              } : null
            };
          }),
          certificate: attempt.certificate ? {
            id: attempt.certificate.id,
            issuedAt: attempt.certificate.issuedAt,
            certificateUrl: attempt.certificate.certificateUrl
          } : null
        }
      });
    } else {
      // Get all attempts for this quiz by the user
      const attempts = await prisma.quizAttempt.findMany({
        where: {
          userId: user.id,
          quizId,
          completedAt: { not: null }
        },
        include: {
          quiz: {
            select: {
              title: true,
              passingScore: true
            }
          },
          certificate: {
            select: {
              id: true,
              issuedAt: true,
              certificateUrl: true
            }
          }
        },
        orderBy: {
          completedAt: 'desc'
        }
      });

      return NextResponse.json({
        success: true,
        attempts: attempts.map(attempt => ({
          id: attempt.id,
          score: attempt.score,
          totalPoints: attempt.totalPoints,
          maxPoints: attempt.maxPoints,
          isPassed: attempt.isPassed,
          timeSpent: attempt.timeSpent,
          completedAt: attempt.completedAt,
          certificate: attempt.certificate
        })),
        quiz: attempts.length > 0 ? {
          title: attempts[0].quiz.title,
          passingScore: attempts[0].quiz.passingScore
        } : null
      });
    }
  } catch (error) {
    console.error('Quiz results fetch error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
