import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyToken } from '@/lib/auth';

// Force Node.js runtime to use jsonwebtoken
export const runtime = 'nodejs';

// GET /api/admin/chapters/[id]/quiz - Get chapter quiz
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

    // Verify the token
    const decoded = verifyToken(token) as { role: string } | null;
    if (!decoded || decoded.role !== 'admin') {
      return NextResponse.json(
        { error: 'Admin access required' },
        { status: 403 }
      );
    }

    const { id: chapterId } = await params;

    // Get chapter with quiz and related information
    const chapter = await prisma.chapter.findUnique({
      where: { id: chapterId },
      include: {
        course: {
          select: {
            id: true,
            title: true,
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
          include: {
            questions: {
              include: {
                answers: {
                  orderBy: {
                    orderIndex: 'asc'
                  }
                }
              },
              orderBy: {
                orderIndex: 'asc'
              }
            }
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

    return NextResponse.json({ chapter });
  } catch (error) {
    console.error('Get chapter quiz error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST /api/admin/chapters/[id]/quiz - Create chapter quiz
export async function POST(
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

    // Verify the token
    const decoded = verifyToken(token) as { role: string } | null;
    if (!decoded || decoded.role !== 'admin') {
      return NextResponse.json(
        { error: 'Admin access required' },
        { status: 403 }
      );
    }

    const { id: chapterId } = await params;
    const { 
      title, 
      description, 
      passingScore, 
      timeLimit, 
      isActive, 
      questions 
    } = await request.json();

    // Validation
    if (!title || title.trim() === '') {
      return NextResponse.json(
        { error: 'Quiz title is required' },
        { status: 400 }
      );
    }

    if (!questions || !Array.isArray(questions) || questions.length === 0) {
      return NextResponse.json(
        { error: 'At least one question is required' },
        { status: 400 }
      );
    }

    // Validate questions structure
    for (let i = 0; i < questions.length; i++) {
      const question = questions[i];
      
      if (!question.text || question.text.trim() === '') {
        return NextResponse.json(
          { error: `Question ${i + 1} text is required` },
          { status: 400 }
        );
      }

      if (!question.answers || !Array.isArray(question.answers) || question.answers.length !== 4) {
        return NextResponse.json(
          { error: `Question ${i + 1} must have exactly 4 answers` },
          { status: 400 }
        );
      }

      let correctAnswerCount = 0;
      for (let j = 0; j < question.answers.length; j++) {
        const answer = question.answers[j];
        
        if (!answer.text || answer.text.trim() === '') {
          return NextResponse.json(
            { error: `Question ${i + 1}, Answer ${j + 1} text is required` },
            { status: 400 }
          );
        }

        if (answer.isCorrect) {
          correctAnswerCount++;
        }
      }

      if (correctAnswerCount !== 1) {
        return NextResponse.json(
          { error: `Question ${i + 1} must have exactly one correct answer` },
          { status: 400 }
        );
      }
    }

    // Check if chapter exists
    const existingChapter = await prisma.chapter.findUnique({
      where: { id: chapterId },
      include: { quiz: true }
    });

    if (!existingChapter) {
      return NextResponse.json(
        { error: 'Chapter not found' },
        { status: 404 }
      );
    }

    if (existingChapter.quiz) {
      return NextResponse.json(
        { error: 'Chapter already has a quiz. Use PUT to update.' },
        { status: 409 }
      );
    }

    // Create quiz with questions and answers in a transaction
    const quiz = await prisma.$transaction(async (tx) => {
      // Create the quiz
      const newQuiz = await tx.quiz.create({
        data: {
          title: title.trim(),
          description: description?.trim() || null,
          passingScore: passingScore || 70,
          timeLimit: timeLimit || null,
          isActive: isActive !== undefined ? isActive : true,
          chapterId
        }
      });

      // Create questions and answers
      for (let i = 0; i < questions.length; i++) {
        const question = questions[i];
        
        const newQuestion = await tx.question.create({
          data: {
            text: question.text.trim(),
            type: 'multiple_choice',
            points: question.points || 1,
            orderIndex: i,
            quizId: newQuiz.id
          }
        });

        // Create answers
        for (let j = 0; j < question.answers.length; j++) {
          const answer = question.answers[j];
          
          await tx.answer.create({
            data: {
              text: answer.text.trim(),
              isCorrect: answer.isCorrect,
              orderIndex: j,
              questionId: newQuestion.id
            }
          });
        }
      }

      // Return the complete quiz with questions and answers
      return await tx.quiz.findUnique({
        where: { id: newQuiz.id },
        include: {
          questions: {
            include: {
              answers: {
                orderBy: { orderIndex: 'asc' }
              }
            },
            orderBy: { orderIndex: 'asc' }
          }
        }
      });
    });

    return NextResponse.json({ 
      message: 'Quiz created successfully',
      quiz 
    }, { status: 201 });

  } catch (error) {
    console.error('Create chapter quiz error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// PUT /api/admin/chapters/[id]/quiz - Update chapter quiz
export async function PUT(
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

    // Verify the token
    const decoded = verifyToken(token) as { role: string } | null;
    if (!decoded || decoded.role !== 'admin') {
      return NextResponse.json(
        { error: 'Admin access required' },
        { status: 403 }
      );
    }

    const { id: chapterId } = await params;
    const { 
      title, 
      description, 
      passingScore, 
      timeLimit, 
      isActive, 
      questions 
    } = await request.json();

    // Validation
    if (!title || title.trim() === '') {
      return NextResponse.json(
        { error: 'Quiz title is required' },
        { status: 400 }
      );
    }

    if (!questions || !Array.isArray(questions) || questions.length === 0) {
      return NextResponse.json(
        { error: 'At least one question is required' },
        { status: 400 }
      );
    }

    // Validate questions structure
    for (let i = 0; i < questions.length; i++) {
      const question = questions[i];
      
      if (!question.text || question.text.trim() === '') {
        return NextResponse.json(
          { error: `Question ${i + 1} text is required` },
          { status: 400 }
        );
      }

      if (!question.answers || !Array.isArray(question.answers) || question.answers.length !== 4) {
        return NextResponse.json(
          { error: `Question ${i + 1} must have exactly 4 answers` },
          { status: 400 }
        );
      }

      let correctAnswerCount = 0;
      for (let j = 0; j < question.answers.length; j++) {
        const answer = question.answers[j];
        
        if (!answer.text || answer.text.trim() === '') {
          return NextResponse.json(
            { error: `Question ${i + 1}, Answer ${j + 1} text is required` },
            { status: 400 }
          );
        }

        if (answer.isCorrect) {
          correctAnswerCount++;
        }
      }

      if (correctAnswerCount !== 1) {
        return NextResponse.json(
          { error: `Question ${i + 1} must have exactly one correct answer` },
          { status: 400 }
        );
      }
    }

    // Check if chapter and quiz exist
    const existingChapter = await prisma.chapter.findUnique({
      where: { id: chapterId },
      include: { 
        quiz: {
          include: {
            questions: {
              include: { answers: true }
            }
          }
        }
      }
    });

    if (!existingChapter) {
      return NextResponse.json(
        { error: 'Chapter not found' },
        { status: 404 }
      );
    }

    if (!existingChapter.quiz) {
      return NextResponse.json(
        { error: 'Chapter quiz not found. Use POST to create.' },
        { status: 404 }
      );
    }

    // Update quiz with questions and answers in a transaction
    const updatedQuiz = await prisma.$transaction(async (tx) => {
      // Update the quiz
      const quiz = await tx.quiz.update({
        where: { id: existingChapter.quiz!.id },
        data: {
          title: title.trim(),
          description: description?.trim() || null,
          passingScore: passingScore || 70,
          timeLimit: timeLimit || null,
          isActive: isActive !== undefined ? isActive : true
        }
      });

      // Delete existing questions (cascade will delete answers)
      await tx.question.deleteMany({
        where: { quizId: quiz.id }
      });

      // Create new questions and answers
      for (let i = 0; i < questions.length; i++) {
        const question = questions[i];
        
        const newQuestion = await tx.question.create({
          data: {
            text: question.text.trim(),
            type: 'multiple_choice',
            points: question.points || 1,
            orderIndex: i,
            quizId: quiz.id
          }
        });

        // Create answers
        for (let j = 0; j < question.answers.length; j++) {
          const answer = question.answers[j];
          
          await tx.answer.create({
            data: {
              text: answer.text.trim(),
              isCorrect: answer.isCorrect,
              orderIndex: j,
              questionId: newQuestion.id
            }
          });
        }
      }

      // Return the complete updated quiz
      return await tx.quiz.findUnique({
        where: { id: quiz.id },
        include: {
          questions: {
            include: {
              answers: {
                orderBy: { orderIndex: 'asc' }
              }
            },
            orderBy: { orderIndex: 'asc' }
          }
        }
      });
    });

    return NextResponse.json({ 
      message: 'Quiz updated successfully',
      quiz: updatedQuiz 
    });

  } catch (error) {
    console.error('Update chapter quiz error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
