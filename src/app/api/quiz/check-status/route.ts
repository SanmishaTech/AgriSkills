import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

export async function POST(request: NextRequest) {
  try {
    // Get the authorization header
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Verify the token
    const token = authHeader.split(' ')[1];
    let userId: string;
    
    try {
      const decoded = jwt.verify(token, JWT_SECRET) as any;
      userId = decoded.userId;
    } catch (error) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    // Get chapter IDs from request body
    const { chapterIds } = await request.json();
    
    if (!chapterIds || !Array.isArray(chapterIds)) {
      return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
    }

    // Fetch quiz attempts for all chapters
    const quizAttempts = await prisma.quizAttempt.findMany({
      where: {
        userId,
        quiz: {
          chapterId: {
            in: chapterIds
          }
        }
      },
      include: {
        quiz: {
          select: {
            chapterId: true,
            passingScore: true
          }
        }
      }
    });

    // Create a map of chapter ID to pass status
    const statusMap: Record<string, { passed: boolean; score?: number; attemptDate?: string }> = {};
    
    for (const chapterId of chapterIds) {
      const attempts = quizAttempts.filter(attempt => attempt.quiz.chapterId === chapterId);
      
      if (attempts.length === 0) {
        statusMap[chapterId] = { passed: false };
      } else {
        // Check if any attempt has passed
        const passedAttempt = attempts.find(attempt => {
          const passingScore = attempt.quiz.passingScore || 70;
          return attempt.score >= passingScore;
        });
        
        if (passedAttempt) {
          statusMap[chapterId] = {
            passed: true,
            score: passedAttempt.score,
            attemptDate: passedAttempt.completedAt?.toISOString()
          };
        } else {
          // Get the best score if not passed
          const bestScore = Math.max(...attempts.map(a => a.score));
          statusMap[chapterId] = {
            passed: false,
            score: bestScore
          };
        }
      }
    }

    return NextResponse.json({ statusMap });
  } catch (error) {
    console.error('Error checking quiz status:', error);
    return NextResponse.json(
      { error: 'Failed to check quiz status' },
      { status: 500 }
    );
  }
}
