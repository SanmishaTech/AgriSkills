import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// Force Node.js runtime
export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  try {
    // Get all active topics with their subtopics and courses count
    const topics = await prisma.topic.findMany({
      where: {
        isActive: true
      },
      include: {
        subtopics: {
          where: {
            isActive: true
          },
          include: {
            courses: {
              where: {
                isActive: true
              },
              select: {
                id: true,
                title: true,
                description: true,
                isActive: true
              }
            },
            _count: {
              select: {
                courses: {
                  where: {
                    isActive: true
                  }
                }
              }
            }
          }
        },
        _count: {
          select: {
            subtopics: {
              where: {
                isActive: true
              }
            }
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    console.log('Topics with subtopics:', JSON.stringify(topics, null, 2));

    return NextResponse.json({ topics });
  } catch (error) {
    console.error('Public topics error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
