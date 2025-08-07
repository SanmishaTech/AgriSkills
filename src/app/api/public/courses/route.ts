import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// Fetch active chapters
export async function GET() {
  try {
    const chapters = await prisma.chapter.findMany({
      where: {
        isActive: true
      },
      select: {
        id: true,
        title: true,
        description: true,
        createdAt: true,
        updatedAt: true
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    return NextResponse.json({ chapters });
  } catch (error) {
    console.error('Error fetching public chapters:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

