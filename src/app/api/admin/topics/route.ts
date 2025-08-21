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

    // Get all topics with subtopics and chapter count
    const topics = await prisma.topic.findMany({
      include: {
        subtopics: {
          include: {
            _count: {
              select: { courses: true }
            }
          }
        },
        _count: {
          select: { subtopics: true }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    return NextResponse.json({ topics });
  } catch (error) {
    console.error('Admin topics error:', error);
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

    const { title, description, thumbnail } = await request.json();

    if (!title || title.trim() === '') {
      return NextResponse.json(
        { error: 'Title is required' },
        { status: 400 }
      );
    }

    // Create new topic
    const topic = await prisma.topic.create({
      data: {
        title: title.trim(),
        description: description?.trim() || null,
        thumbnail: thumbnail || null,
      },
      include: {
        _count: {
          select: { subtopics: true }
        }
      }
    });

    return NextResponse.json({ topic });
  } catch (error) {
    console.error('Admin topic creation error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
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

    const url = new URL(request.url);
    const topicId = url.searchParams.get('id');

    if (!topicId) {
      return NextResponse.json(
        { error: 'Topic ID is required' },
        { status: 400 }
      );
    }

    // Check if topic exists
    const existingTopic = await prisma.topic.findUnique({
      where: { id: topicId },
      include: {
        _count: {
          select: { 
            subtopics: true
          }
        }
      }
    });

    if (!existingTopic) {
      return NextResponse.json(
        { error: 'Topic not found' },
        { status: 404 }
      );
    }

    // Delete topic (this will cascade delete all related subtopics, courses, and chapters)
    await prisma.topic.delete({
      where: { id: topicId }
    });

    return NextResponse.json({ 
      message: 'Topic deleted successfully',
      deletedTopic: existingTopic
    });
  } catch (error) {
    console.error('Admin topic deletion error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
