import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import jwt from 'jsonwebtoken';

// Verify user authentication
async function verifyUser(request: NextRequest) {
  try {
    const token = request.headers.get('Authorization')?.replace('Bearer ', '');
    if (!token) {
      return null;
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any;
    const user = await prisma.user.findUnique({
      where: { id: decoded.sub }
    });

    return user;
  } catch (error) {
    return null;
  }
}

// GET /api/certificates - Get user's certificates
export async function GET(request: NextRequest) {
  try {
    const user = await verifyUser(request);
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get user's certificates with course information
    const allCertificates = await prisma.certificate.findMany({
      where: {
        userId: user.id
      },
      include: {
        attempt: {
          include: {
            quiz: {
              include: {
                chapter: {
                  include: {
                    course: {
                      include: {
                        subtopic: {
                          include: {
                            topic: true
                          }
                        }
                      }
                    }
                  }
                }
              }
            }
          }
        }
      },
      orderBy: {
        issuedAt: 'asc' // Get earliest first
      }
    });

    // Deduplicate certificates by course - keep only the earliest one per course
    const certificatesByCourse = new Map();
    const certificates = [];
    
    for (const cert of allCertificates) {
      const courseId = cert.attempt.quiz.chapter.course.id;
      if (!certificatesByCourse.has(courseId)) {
        certificatesByCourse.set(courseId, cert);
        certificates.push(cert);
      }
    }

    // Get courses in progress (user has passed some but not all quizzes)
    const courseCompletions = await prisma.courseCompletion.findMany({
      where: {
        userId: user.id
      },
      include: {
        course: {
          include: {
            chapters: {
              include: {
                quiz: true
              }
            },
            subtopic: {
              include: {
                topic: true
              }
            }
          }
        }
      }
    });

    // Get all courses user has attempted quizzes for
    const userQuizAttempts = await prisma.quizAttempt.findMany({
      where: {
        userId: user.id,
        completedAt: { not: null }
      },
      include: {
        quiz: {
          include: {
            chapter: {
              include: {
                course: {
                  include: {
                    chapters: {
                      include: {
                        quiz: true
                      }
                    },
                    subtopic: {
                      include: {
                        topic: true
                      }
                    }
                  }
                }
              }
            }
          }
        }
      }
    });

    // Calculate courses in progress
    const coursesInProgress = [];
    const completedCourseIds = new Set(courseCompletions.map(c => c.courseId));
    const processedCourses = new Set();

    for (const attempt of userQuizAttempts) {
      const course = attempt.quiz.chapter.course;
      
      if (completedCourseIds.has(course.id) || processedCourses.has(course.id)) {
        continue;
      }
      
      processedCourses.add(course.id);

      // Get all quizzes in this course
      const courseQuizzes = course.chapters
        .filter(chapter => chapter.quiz)
        .map(chapter => chapter.quiz!);

      // Get user's passed attempts for this course
      const userPassedAttempts = await prisma.quizAttempt.findMany({
        where: {
          userId: user.id,
          quizId: { in: courseQuizzes.map(q => q.id) },
          isPassed: true,
          completedAt: { not: null }
        },
        distinct: ['quizId']
      });

      // If not all quizzes are passed, it's in progress
      if (userPassedAttempts.length > 0 && userPassedAttempts.length < courseQuizzes.length) {
        const progressPercentage = Math.round((userPassedAttempts.length / courseQuizzes.length) * 100);
        
        coursesInProgress.push({
          id: course.id,
          title: `${course.title} Certificate`,
          description: `Complete certification in ${course.title}`,
          progress: progressPercentage,
          chaptersCompleted: userPassedAttempts.length,
          totalChapters: courseQuizzes.length,
          estimatedCompletion: 'Ongoing',
          thumbnail: course.thumbnail
        });
      }
    }

    // Format completed certificates
    const completedCertificates = certificates.map(cert => {
      const course = cert.attempt.quiz.chapter.course;
      const topic = course.subtopic?.topic;
      
      return {
        id: cert.id,
        title: `${course.title} Certificate`,
        completedDate: cert.issuedAt.toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'long',
          day: 'numeric'
        }),
        score: Math.round(cert.attempt.score),
        description: `Comprehensive certification in ${course.title}${topic ? ` - ${topic.title}` : ''}`,
        issuer: 'AgriSkills Academy',
        validUntil: new Date(cert.issuedAt.getTime() + (2 * 365 * 24 * 60 * 60 * 1000)).toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'long',
          day: 'numeric'
        }), // Valid for 2 years
        thumbnail: course.thumbnail,
        certificateUrl: cert.certificateUrl
      };
    });

    // Calculate overall progress
    const totalCourses = completedCertificates.length + coursesInProgress.length;
    const overallProgress = totalCourses > 0 
      ? Math.round((completedCertificates.length / totalCourses) * 100)
      : 0;

    return NextResponse.json({
      success: true,
      data: {
        overallProgress,
        completed: completedCertificates,
        inProgress: coursesInProgress
      }
    });

  } catch (error) {
    console.error('Certificate fetch error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
