import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const chapterId = params.id;

    // First, check if this chapter belongs to the first course of the first subtopic
    const chapter = await prisma.chapter.findUnique({
      where: { id: chapterId },
      include: {
        course: {
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
        }
      }
    });

    if (!chapter) {
      return NextResponse.json(
        { error: 'Chapter not found' },
        { status: 404 }
      );
    }

    // Verify this is the first course in the first subtopic
    const firstSubtopic = chapter.course.subtopic.topic.subtopics[0];
    const firstCourse = firstSubtopic?.courses[0];
    
    if (!firstCourse || firstCourse.id !== chapter.courseId) {
      return NextResponse.json(
        { error: 'This quiz is not available for free preview' },
        { status: 403 }
      );
    }

    // Get the quiz with questions for this chapter
    const quiz = await prisma.quiz.findUnique({
      where: { chapterId },
      include: {
        chapter: {
          include: {
            course: {
              select: {
                id: true,
                title: true
              }
            }
          }
        },
        questions: {
          orderBy: { orderIndex: 'asc' },
          include: {
            answers: {
              orderBy: { orderIndex: 'asc' }
            }
          }
        }
      }
    });

    if (!quiz) {
      return NextResponse.json(
        { error: 'No quiz found for this chapter' },
        { status: 404 }
      );
    }

    // Check if quiz is active
    if (!quiz.isActive) {
      return NextResponse.json(
        { error: 'Quiz is not active' },
        { status: 400 }
      );
    }

    if (quiz.questions.length === 0) {
      return NextResponse.json(
        { error: 'This quiz has no questions' },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      quiz: {
        id: quiz.id,
        title: quiz.title,
        description: quiz.description,
        passingScore: quiz.passingScore,
        timeLimit: quiz.timeLimit,
        questions: quiz.questions.map(question => ({
          id: question.id,
          text: question.text,
          type: question.type,
          points: question.points,
          answers: question.answers.map(answer => ({
            id: answer.id,
            text: answer.text
            // Note: We don't include isCorrect for security reasons
          }))
        })),
        chapter: {
          id: quiz.chapter.id,
          title: quiz.chapter.title,
          course: {
            id: quiz.chapter.course.id,
            title: quiz.chapter.course.title
          }
        }
      },
      isFreePreview: true,
      message: 'Free preview quiz started. Results will not be saved.'
    });
  } catch (error) {
    console.error('Free quiz start error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
