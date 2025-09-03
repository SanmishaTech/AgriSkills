import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyToken } from '@/lib/auth';

// Force Node.js runtime to use jsonwebtoken
export const runtime = 'nodejs';

// GET - Fetch questions for a topic
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

    const { id } = await params;

    // Check if topic exists
    const topic = await prisma.topic.findUnique({
      where: { id },
    });

    if (!topic) {
      return NextResponse.json(
        { error: 'Topic not found' },
        { status: 404 }
      );
    }

    // Get questions for the topic
    const questions = await prisma.topicQuestion.findMany({
      where: { topicId: id },
      orderBy: [
        { orderIndex: 'asc' },
        { createdAt: 'asc' }
      ],
    });

    return NextResponse.json({ questions });
  } catch (error) {
    console.error('Admin topic questions fetch error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST - Create a new question for a topic
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

    const { id } = await params;
    const { question, orderIndex, isActive } = await request.json();

    if (!question || question.trim() === '') {
      return NextResponse.json(
        { error: 'Question text is required' },
        { status: 400 }
      );
    }

    // Check if topic exists
    const topic = await prisma.topic.findUnique({
      where: { id },
    });

    if (!topic) {
      return NextResponse.json(
        { error: 'Topic not found' },
        { status: 404 }
      );
    }

    // If no orderIndex provided, set it to the next available index
    let finalOrderIndex = orderIndex;
    if (finalOrderIndex === undefined || finalOrderIndex === null) {
      const lastQuestion = await prisma.topicQuestion.findFirst({
        where: { topicId: id },
        orderBy: { orderIndex: 'desc' }
      });
      finalOrderIndex = (lastQuestion?.orderIndex || 0) + 1;
    }

    // Create new question
    const newQuestion = await prisma.topicQuestion.create({
      data: {
        topicId: id,
        question: question.trim(),
        orderIndex: finalOrderIndex,
        isActive: isActive !== undefined ? isActive : true,
      },
    });

    return NextResponse.json({ question: newQuestion });
  } catch (error) {
    console.error('Admin topic question creation error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// PUT - Update questions order or bulk operations
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

    const { id } = await params;
    const { questions } = await request.json();

    if (!Array.isArray(questions)) {
      return NextResponse.json(
        { error: 'Questions must be an array' },
        { status: 400 }
      );
    }

    // Check if topic exists
    const topic = await prisma.topic.findUnique({
      where: { id },
    });

    if (!topic) {
      return NextResponse.json(
        { error: 'Topic not found' },
        { status: 404 }
      );
    }

    // Update questions order
    await Promise.all(
      questions.map((q: any, index: number) =>
        prisma.topicQuestion.update({
          where: { id: q.id },
          data: { orderIndex: index }
        })
      )
    );

    // Fetch updated questions
    const updatedQuestions = await prisma.topicQuestion.findMany({
      where: { topicId: id },
      orderBy: [
        { orderIndex: 'asc' },
        { createdAt: 'asc' }
      ],
    });

    return NextResponse.json({ questions: updatedQuestions });
  } catch (error) {
    console.error('Admin topic questions update error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
