import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// Force Node.js runtime
export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  try {
    console.log('Fetching public topics...');
    
    // Get all active topics with their subtopics and courses
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
              include: {
                _count: {
                  select: {
                    chapters: {
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

    console.log(`Found ${topics.length} topics`);
    console.log('Topics:', topics.map(t => ({ id: t.id, title: t.title, subtopics: t.subtopics.length })));

    return NextResponse.json({ topics });
  } catch (error) {
    console.error('Public topics error:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
