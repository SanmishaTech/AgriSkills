import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const topicId = params.id;

    // Fetch active questions for the topic, ordered by orderIndex
    const questions = await prisma.topicQuestion.findMany({
      where: {
        topicId,
        isActive: true,
      },
      select: {
        id: true,
        question: true,
        isActive: true,
        orderIndex: true,
      },
      orderBy: {
        orderIndex: 'asc',
      },
    });

    return NextResponse.json({
      success: true,
      questions,
    });
  } catch (error) {
    console.error('Error fetching topic questions:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
