import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyToken } from '@/lib/auth';

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

    // Get topic with subtopics and chapters
    const topic = await prisma.topic.findUnique({
      where: { id },
      include: {
        subtopics: {
          include: {
            courses: {
              include: {
                _count: {
                  select: { chapters: true }
                }
              }
            },
            _count: {
              select: { courses: true }
            }
          },
          orderBy: {
            createdAt: 'desc'
          }
        },
        _count: {
          select: { subtopics: true }
        }
      }
    });

    if (!topic) {
      return NextResponse.json(
        { error: 'Topic not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ topic });
  } catch (error) {
    console.error('Admin topic details error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

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
    const { title, description, thumbnail, isActive } = await request.json();

    if (!title || title.trim() === '') {
      return NextResponse.json(
        { error: 'Title is required' },
        { status: 400 }
      );
    }

    // Check if topic exists
    const existingTopic = await prisma.topic.findUnique({
      where: { id }
    });

    if (!existingTopic) {
      return NextResponse.json(
        { error: 'Topic not found' },
        { status: 404 }
      );
    }

    // Update topic
    const updatedTopic = await prisma.topic.update({
      where: { id },
      data: {
        title: title.trim(),
        description: description?.trim() || null,
        thumbnail: thumbnail?.trim() || null,
        isActive: isActive !== undefined ? isActive : existingTopic.isActive,
      },
      include: {
        _count: {
          select: { subtopics: true }
        }
      }
    });

    return NextResponse.json({ topic: updatedTopic });
  } catch (error) {
    console.error('Admin topic update error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

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

    // Check if topic exists
    const existingTopic = await prisma.topic.findUnique({
      where: { id },
      include: {
        _count: {
          select: { subtopics: true }
        }
      }
    });

    if (!existingTopic) {
      return NextResponse.json(
        { error: 'Topic not found' },
        { status: 404 }
      );
    }

    // Check if topic has subtopics
    if (existingTopic._count.subtopics > 0) {
      return NextResponse.json(
        { error: 'Cannot delete topic with subtopics. Please delete all subtopics first.' },
        { status: 400 }
      );
    }

    // Delete topic
    await prisma.topic.delete({
      where: { id }
    });

    return NextResponse.json({ message: 'Topic deleted successfully' });
  } catch (error) {
    console.error('Admin topic delete error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
