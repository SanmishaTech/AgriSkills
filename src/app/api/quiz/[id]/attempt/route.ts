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

// POST /api/quiz/[id]/attempt - Start a new quiz attempt
export async function POST(
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

    // Check if quiz exists and is active
    const quiz = await prisma.quiz.findUnique({
      where: { id: quizId, isActive: true },
      include: {
        questions: {
          include: {
            answers: {
              select: {
                id: true,
                text: true,
                orderIndex: true
                // Don't include isCorrect for security
              }
            }
          },
          orderBy: {
            orderIndex: 'asc'
          }
        }
      }
    });

    if (!quiz) {
      return NextResponse.json(
        { error: 'Quiz not found or inactive' },
        { status: 404 }
      );
    }

    // Check if user has an active attempt
    const activeAttempt = await prisma.quizAttempt.findFirst({
      where: {
        userId: user.id,
        quizId,
        completedAt: null
      }
    });

    if (activeAttempt) {
      // Return existing active attempt
      return NextResponse.json({
        success: true,
        attempt: {
          id: activeAttempt.id,
          startedAt: activeAttempt.startedAt,
          timeLimit: quiz.timeLimit,
          quiz: {
            id: quiz.id,
            title: quiz.title,
            description: quiz.description,
            questions: quiz.questions
          }
        }
      });
    }

    // Create new attempt
    const attempt = await prisma.quizAttempt.create({
      data: {
        userId: user.id,
        quizId,
        score: 0,
        totalPoints: 0,
        maxPoints: quiz.questions.reduce((sum, q) => sum + q.points, 0),
        isPassed: false
      }
    });

    return NextResponse.json({
      success: true,
      attempt: {
        id: attempt.id,
        startedAt: attempt.startedAt,
        timeLimit: quiz.timeLimit,
        quiz: {
          id: quiz.id,
          title: quiz.title,
          description: quiz.description,
          questions: quiz.questions
        }
      }
    });
  } catch (error) {
    console.error('Quiz attempt start error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// PUT /api/quiz/[id]/attempt - Submit quiz answers
export async function PUT(
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
    const body = await request.json();
    const { attemptId, answers } = body;

    if (!attemptId || !answers || !Array.isArray(answers)) {
      return NextResponse.json(
        { error: 'Attempt ID and answers are required' },
        { status: 400 }
      );
    }

    // Verify attempt belongs to user and is active
    const attempt = await prisma.quizAttempt.findFirst({
      where: {
        id: attemptId,
        userId: user.id,
        quizId,
        completedAt: null
      },
      include: {
        quiz: {
          include: {
            questions: {
              include: {
                answers: true
              }
            }
          }
        }
      }
    });

    if (!attempt) {
      return NextResponse.json(
        { error: 'Active attempt not found' },
        { status: 404 }
      );
    }

    // Check time limit
    if (attempt.quiz.timeLimit) {
      const timeElapsed = Date.now() - attempt.startedAt.getTime();
      const timeLimit = attempt.quiz.timeLimit * 60 * 1000; // Convert minutes to milliseconds
      
      if (timeElapsed > timeLimit) {
        return NextResponse.json(
          { error: 'Time limit exceeded' },
          { status: 400 }
        );
      }
    }

    // Process answers and calculate score
    let totalPoints = 0;
    const responses = [];

    for (const answer of answers) {
      const question = attempt.quiz.questions.find(q => q.id === answer.questionId);
      if (!question) continue;

      let isCorrect = false;
      let pointsEarned = 0;
      let selectedAnswerId = null;
      let selectedText = null;

      if (question.type === 'multiple_choice') {
        selectedAnswerId = answer.answerId;
        const selectedAnswer = question.answers.find(a => a.id === answer.answerId);
        if (selectedAnswer) {
          selectedText = selectedAnswer.text;
          isCorrect = selectedAnswer.isCorrect;
          if (isCorrect) {
            pointsEarned = question.points;
            totalPoints += pointsEarned;
          }
        }
      } else if (question.type === 'true_false') {
        selectedText = answer.text;
        const correctAnswer = question.answers.find(a => a.isCorrect);
        if (correctAnswer && correctAnswer.text.toLowerCase() === answer.text.toLowerCase()) {
          isCorrect = true;
          pointsEarned = question.points;
          totalPoints += pointsEarned;
        }
      } else if (question.type === 'fill_in_blank') {
        selectedText = answer.text;
        // For fill in the blank, check if answer matches any correct answer (case-insensitive)
        const correctAnswers = question.answers.filter(a => a.isCorrect);
        isCorrect = correctAnswers.some(ca => 
          ca.text.toLowerCase().trim() === answer.text.toLowerCase().trim()
        );
        if (isCorrect) {
          pointsEarned = question.points;
          totalPoints += pointsEarned;
        }
      }

      responses.push({
        questionId: question.id,
        answerId: selectedAnswerId,
        selectedText,
        isCorrect,
        pointsEarned,
        attemptId: attempt.id
      });
    }

    // Calculate final score and check if passed
    const score = attempt.maxPoints > 0 ? (totalPoints / attempt.maxPoints) * 100 : 0;
    const isPassed = score >= attempt.quiz.passingScore;

    // Update attempt and create responses in transaction
    const updatedAttempt = await prisma.$transaction(async (tx) => {
      // Create quiz responses
      await tx.quizResponse.createMany({
        data: responses
      });

      // Update attempt
      const updated = await tx.quizAttempt.update({
        where: { id: attempt.id },
        data: {
          score,
          totalPoints,
          isPassed,
          completedAt: new Date(),
          timeSpent: Math.floor((Date.now() - attempt.startedAt.getTime()) / (1000 * 60)) // in minutes
        },
        include: {
          responses: {
            include: {
              question: true
            }
          },
          quiz: true
        }
      });

      // Create certificate if passed
      if (isPassed) {
        await tx.certificate.create({
          data: {
            userId: user.id,
            attemptId: attempt.id,
            issuedAt: new Date()
          }
        });
      }

      return updated;
    });

    return NextResponse.json({
      success: true,
      result: {
        score: updatedAttempt.score,
        totalPoints: updatedAttempt.totalPoints,
        maxPoints: updatedAttempt.maxPoints,
        isPassed: updatedAttempt.isPassed,
        passingScore: updatedAttempt.quiz.passingScore,
        timeSpent: updatedAttempt.timeSpent,
        completedAt: updatedAttempt.completedAt,
        certificateGenerated: isPassed
      }
    });
  } catch (error) {
    console.error('Quiz submission error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
