import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const courseId = params.id;

    // Check if this course exists and is the first course in the first subtopic of a topic
    const course = await prisma.course.findUnique({
      where: { id: courseId },
      include: {
        subtopic: {
          include: {
            topic: {
              include: {
                subtopics: {
                  where: { isActive: true },
                  orderBy: { createdAt: 'asc' },
                  include: {
                    courses: {
                      where: { isActive: true },
                      orderBy: { createdAt: 'asc' },
                      take: 1
                    }
                  }
                }
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

    // Check if this is the first course in the first subtopic
    const firstSubtopic = course.subtopic.topic.subtopics[0];
    const firstCourse = firstSubtopic?.courses[0];
    
    if (!firstCourse || firstCourse.id !== courseId) {
      return NextResponse.json(
        { error: 'This course is not available for free preview' },
        { status: 403 }
      );
    }

    // Get the first 1-2 chapters of the course (free preview)
    const chapters = await prisma.chapter.findMany({
      where: { 
        courseId: courseId,
        isActive: true
      },
      orderBy: { orderIndex: 'asc' },
      take: 2, // Allow first 2 chapters for free
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
        }
      }
    });

    if (chapters.length === 0) {
      return NextResponse.json(
        { error: 'No chapters available for this course' },
        { status: 404 }
      );
    }

    return NextResponse.json({ 
      chapters,
      isFreePreview: true,
      message: 'This is a free preview. Sign up for full access to all chapters.'
    });
  } catch (error) {
    console.error('Error fetching free chapters:', error);
    return NextResponse.json(
      { error: 'Failed to fetch course chapters' },
      { status: 500 }
    );
  }
}
