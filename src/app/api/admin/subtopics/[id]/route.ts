import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyToken } from '@/lib/auth';

// Force Node.js runtime to use jsonwebtoken
export const runtime = 'nodejs';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
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

    const subtopic = await prisma.subtopic.findUnique({
      where: { id: params.id },
      include: {
        courses: {
          orderBy: {
            createdAt: 'desc'
          }
        },
        _count: {
          select: {
            courses: true
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

    return NextResponse.json({ subtopic });
  } catch (error) {
    console.error('Admin subtopic fetch error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
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

    const { title, description, isActive } = await request.json();

    if (!title || title.trim() === '') {
      return NextResponse.json(
        { error: 'Title is required' },
        { status: 400 }
      );
    }

    // Check if subtopic exists
    const existingSubtopic = await prisma.subtopic.findUnique({
      where: { id: params.id }
    });

    if (!existingSubtopic) {
      return NextResponse.json(
        { error: 'Subtopic not found' },
        { status: 404 }
      );
    }

    // Update the subtopic
    const subtopic = await prisma.subtopic.update({
      where: { id: params.id },
      data: {
        title: title.trim(),
        description: description?.trim() || null,
        isActive: isActive ?? true,
      },
      include: {
        courses: {
          orderBy: {
            createdAt: 'desc'
          }
        },
        _count: {
          select: {
            courses: true
          }
        }
      }
    });

    return NextResponse.json({ subtopic });
  } catch (error) {
    console.error('Admin subtopic update error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
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

    // Check if subtopic exists
    const existingSubtopic = await prisma.subtopic.findUnique({
      where: { id: params.id },
      include: {
        courses: true
      }
    });

    if (!existingSubtopic) {
      return NextResponse.json(
        { error: 'Subtopic not found' },
        { status: 404 }
      );
    }

    // Delete all courses associated with this subtopic
    if (existingSubtopic.courses.length > 0) {
      await prisma.course.deleteMany({
        where: { subtopicId: params.id }
      });
    }

    // Delete the subtopic
    await prisma.subtopic.delete({
      where: { id: params.id }
    });

    return NextResponse.json({ 
      message: 'Subtopic deleted successfully',
      deletedSubtopic: existingSubtopic 
    });
  } catch (error) {
    console.error('Admin subtopic deletion error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
