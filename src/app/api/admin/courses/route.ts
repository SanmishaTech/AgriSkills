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

    // Get subtopic ID from query params
    const { searchParams } = new URL(request.url);
    const subtopicId = searchParams.get('subtopicId');
    const topicId = searchParams.get('topicId');

    let whereClause = {};
    if (subtopicId) {
      whereClause = { subtopicId };
    } else if (topicId) {
      // If topicId is provided, get all courses from subtopics under that topic
      whereClause = {
        subtopic: {
          topicId: topicId
        }
      };
    }

    // Get all courses with chapters and subtopic information
    const courses = await prisma.course.findMany({
      where: whereClause,
      include: {
        chapters: {
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
        },
        _count: {
          select: {
            chapters: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    return NextResponse.json({ courses });
  } catch (error) {
    console.error('Admin courses error:', error);
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

    const { title, description, thumbnail, duration, level, isActive, isPublic, subtopicId, organizationId } = await request.json();

    if (!title || title.trim() === '') {
      return NextResponse.json(
        { error: 'Title is required' },
        { status: 400 }
      );
    }

    if (!subtopicId) {
      return NextResponse.json(
        { error: 'Subtopic is required' },
        { status: 400 }
      );
    }

    // Verify subtopic exists
    const subtopic = await prisma.subtopic.findUnique({
      where: { id: subtopicId },
      include: {
        topic: {
          select: {
            id: true,
            title: true
          }
        }
      }
    });

    if (!subtopic) {
      return NextResponse.json(
        { error: 'Subtopic not found' },
        { status: 404 }
      );
    }

    // Create new course
    const course = await prisma.course.create({
      data: {
        title: title.trim(),
        description: description?.trim() || null,
        thumbnail: thumbnail?.trim() || null,
        duration: duration || null,
        level: level || 'BEGINNER',
        isActive: isActive !== undefined ? isActive : true,
        isPublic: isPublic !== undefined ? isPublic : true,
        subtopicId,
        organizationId: organizationId || null,
      },
      include: {
        chapters: {
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
        },
        _count: {
          select: {
            chapters: true
          }
        }
      }
    });

    return NextResponse.json({ course });
  } catch (error) {
    console.error('Admin chapter creation error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
