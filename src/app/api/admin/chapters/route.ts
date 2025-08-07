import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyToken } from '@/lib/auth';

// Force Node.js runtime to use jsonwebtoken
export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
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

    // Get course ID from query params
    const { searchParams } = new URL(request.url);
    const courseId = searchParams.get('courseId');

    if (!courseId) {
      return NextResponse.json(
        { error: 'Course ID is required' },
        { status: 400 }
      );
    }

    // Get all chapters for the course
    const chapters = await prisma.chapter.findMany({
      where: { courseId },
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
        }
      },
      orderBy: {
        orderIndex: 'asc'
      }
    });

    return NextResponse.json({ chapters });
  } catch (error) {
    console.error('Admin chapters error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
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

    const { title, description, content, youtubeUrl, orderIndex, isActive, courseId } = await request.json();

    if (!title || title.trim() === '') {
      return NextResponse.json(
        { error: 'Title is required' },
        { status: 400 }
      );
    }

    if (!courseId) {
      return NextResponse.json(
        { error: 'Course is required' },
        { status: 400 }
      );
    }

    if (!content || content.trim() === '') {
      return NextResponse.json(
        { error: 'Content is required' },
        { status: 400 }
      );
    }

    // Verify course exists
    const course = await prisma.course.findUnique({
      where: { id: courseId },
      include: {
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

    // Get the maximum order index if not provided
    let finalOrderIndex = orderIndex;
    if (finalOrderIndex === undefined || finalOrderIndex === null) {
      const maxOrderResult = await prisma.chapter.findFirst({
        where: { courseId },
        orderBy: { orderIndex: 'desc' },
        select: { orderIndex: true }
      });
      finalOrderIndex = (maxOrderResult?.orderIndex ?? -1) + 1;
    }

    // Create new chapter
    const chapter = await prisma.chapter.create({
      data: {
        title: title.trim(),
        description: description?.trim() || null,
        content: content.trim(),
        youtubeUrl: youtubeUrl?.trim() || null,
        orderIndex: finalOrderIndex,
        isActive: isActive !== undefined ? isActive : true,
        courseId,
      },
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
        }
      }
    });

    return NextResponse.json({ chapter });
  } catch (error) {
    console.error('Admin chapter creation error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
