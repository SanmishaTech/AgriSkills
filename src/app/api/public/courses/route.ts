import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// Fetch active courses
export async function GET() {
  try {
    const courses = await prisma.course.findMany({
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

    return NextResponse.json({ courses });
  } catch (error) {
    console.error('Error fetching public courses:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

