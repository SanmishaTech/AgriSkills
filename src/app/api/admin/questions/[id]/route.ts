import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyToken } from '@/lib/auth';

// Force Node.js runtime to use jsonwebtoken
export const runtime = 'nodejs';

// GET - Fetch a specific question
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

    // Get the question
    const question = await prisma.topicQuestion.findUnique({
      where: { id },
      include: {
        topic: {
          select: {
            id: true,
            title: true
          }
        }
      }
    });

    if (!question) {
      return NextResponse.json(
        { error: 'Question not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ question });
  } catch (error) {
    console.error('Admin question fetch error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// PUT - Update a specific question
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
    const { question, isActive, orderIndex } = await request.json();

    if (!question || question.trim() === '') {
      return NextResponse.json(
        { error: 'Question text is required' },
        { status: 400 }
      );
    }

    // Check if question exists
    const existingQuestion = await prisma.topicQuestion.findUnique({
      where: { id }
    });

    if (!existingQuestion) {
      return NextResponse.json(
        { error: 'Question not found' },
        { status: 404 }
      );
    }

    // Update question
    const updatedQuestion = await prisma.topicQuestion.update({
      where: { id },
      data: {
        question: question.trim(),
        isActive: isActive !== undefined ? isActive : existingQuestion.isActive,
        orderIndex: orderIndex !== undefined ? orderIndex : existingQuestion.orderIndex,
      },
      include: {
        topic: {
          select: {
            id: true,
            title: true
          }
        }
      }
    });

    return NextResponse.json({ question: updatedQuestion });
  } catch (error) {
    console.error('Admin question update error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// DELETE - Delete a specific question
export async function DELETE(
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

    // Check if question exists
    const existingQuestion = await prisma.topicQuestion.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            selections: true
          }
        }
      }
    });

    if (!existingQuestion) {
      return NextResponse.json(
        { error: 'Question not found' },
        { status: 404 }
      );
    }

    // Delete question (this will cascade delete all related selections)
    await prisma.topicQuestion.delete({
      where: { id }
    });

    return NextResponse.json({ 
      message: 'Question deleted successfully',
      deletedQuestion: existingQuestion
    });
  } catch (error) {
    console.error('Admin question deletion error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
