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
                isActive: true,
                isPublic: true
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
                    isActive: true,
                    isPublic: true
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
    
    // Shuffle the topics array randomly
    const randomizedTopics = [...topics].sort(() => Math.random() - 0.5);
    
    // Limit to 20 topics
    const limitedTopics = randomizedTopics.slice(0, 20);

    console.log(`Returning ${limitedTopics.length} randomized topics`);

    return NextResponse.json({ topics: limitedTopics });
  } catch (error) {
    console.error('Public topics error:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
