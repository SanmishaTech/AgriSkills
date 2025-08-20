import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const chapterId = params.id;

    // Fetch chapter with all related data
    const chapter = await prisma.chapter.findUnique({
      where: { id: chapterId },
      include: {
        course: {
          select: {
            id: true,
            title: true,
            description: true,
          }
        },
        demoVideos: {
          orderBy: { createdAt: 'asc' }
        },
        sections: {
          orderBy: { orderIndex: 'asc' }
        },
        quiz: {
          select: {
            id: true,
            title: true,
            description: true,
            passingScore: true,
            timeLimit: true,
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
    console.error('Error fetching chapter:', error);
    return NextResponse.json(
      { error: 'Failed to fetch chapter details' },
      { status: 500 }
    );
  }
}
