import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Get the course with its chapters
    const course = await prisma.course.findUnique({
      where: {
        id,
        isActive: true
      },
      include: {
        chapters: {
          where: {
            isActive: true
          },
          select: {
            id: true,
            title: true,
            description: true,
            content: true,
            youtubeUrl: true,
            orderIndex: true,
            createdAt: true
          },
          orderBy: {
            orderIndex: 'asc'
          }
        },
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
    });

    if (!course) {
      return NextResponse.json(
        { error: 'Course not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ 
      course: {
        id: course.id,
        title: course.title,
        description: course.description,
        duration: course.duration,
        level: course.level,
        subtopic: course.subtopic,
        chapters: course.chapters
      }
    });
  } catch (error) {
    console.error('Course chapters error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
