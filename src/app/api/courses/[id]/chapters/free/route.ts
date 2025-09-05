import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const courseId = params.id;

    // Check if this course exists and is the first course in the first subtopic of a topic
    let course = await prisma.course.findUnique({
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

    // If course not found, try to find a fallback course
    if (!course) {
      // First, try to find the original course to get its subtopic/topic info
      const originalCourse = await prisma.course.findUnique({
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

      let fallbackCourse = null;

      if (originalCourse?.subtopic) {
        // Try to find another course in the same subtopic (ordered by creation date)
        fallbackCourse = await prisma.course.findFirst({
          where: {
            subtopicId: originalCourse.subtopic.id,
            isActive: true,
            id: { not: courseId }, // Exclude the deleted course
          },
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
          },
          orderBy: {
            createdAt: 'asc' // Get the next course that was added
          }
        });

        // If no course found in the same subtopic, try the same topic
        if (!fallbackCourse && originalCourse.subtopic.topic) {
          fallbackCourse = await prisma.course.findFirst({
            where: {
              subtopic: {
                topicId: originalCourse.subtopic.topic.id
              },
              isActive: true,
              id: { not: courseId }, // Exclude the deleted course
            },
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
            },
            orderBy: {
              createdAt: 'asc' // Get the next course that was added
            }
          });
        }
      }

      // If we found a fallback course, use it
      if (fallbackCourse) {
        course = fallbackCourse;
      } else {
        // If no fallback course found, try to find any available first course from any topic
        const anyFirstCourse = await prisma.course.findFirst({
          where: {
            isActive: true,
            id: { not: courseId }
          },
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
          },
          orderBy: { createdAt: 'asc' }
        });
        
        if (anyFirstCourse) {
          course = anyFirstCourse;
        } else {
          return NextResponse.json(
            { error: 'Course not found and no alternative courses available' },
            { status: 404 }
          );
        }
      }
    }

    // Determine if this was a redirected course
    const wasRedirected = course.id !== courseId;
    const actualCourseId = course.id;
    
    // Check if this is the first course in the first subtopic
    const firstSubtopic = course.subtopic.topic.subtopics[0];
    const firstCourse = firstSubtopic?.courses[0];
    
    if (!firstCourse || firstCourse.id !== actualCourseId) {
      return NextResponse.json(
        { error: 'This course is not available for free preview' },
        { status: 403 }
      );
    }

    // Get the first 1-2 chapters of the course (free preview)
    const chapters = await prisma.chapter.findMany({
      where: { 
        courseId: actualCourseId,
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

    const response: any = { 
      chapters,
      isFreePreview: true,
      message: wasRedirected 
        ? 'The requested course was not found. Showing an alternative course instead. Sign up for full access to all chapters.'
        : 'This is a free preview. Sign up for full access to all chapters.'
    };

    // Add redirect information if course was redirected
    if (wasRedirected) {
      response.redirected = true;
      response.originalCourseId = courseId;
      response.newCourseId = actualCourseId;
    }

    return NextResponse.json(response);
  } catch (error) {
    console.error('Error fetching free chapters:', error);
    return NextResponse.json(
      { error: 'Failed to fetch course chapters' },
      { status: 500 }
    );
  }
}
