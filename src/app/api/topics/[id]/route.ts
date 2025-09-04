import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// Force Node.js runtime to use jsonwebtoken
export const runtime = 'nodejs';

function getYoutubeVideoId(url: string): string | null {
  console.log('Testing YouTube ID extraction for:', url);
  // Updated regex to handle YouTube Shorts and regular videos
  const regex = /^.*(?:youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|shorts\/|\&v=)([^#\&\?]*).*/;
  const match = url.match(regex);
  const result = (match && match[1].length === 11) ? match[1] : null;
  console.log('Regex match result:', match);
  console.log('Final YouTube ID:', result);
  return result;
}

function formatDuration(seconds: number | null): string {
  if (!seconds) return '0:00';
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
}

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { id } = params;

    // Fetch detailed topic data, including subtopics, courses, and topic demo
    const topic = await prisma.topic.findUnique({
      where: {
        id: id,
      },
      include: {
        demo: true, // Include topic demo data
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
                chapters: {
                  where: {
                    isActive: true
                  },
                  include: {
                    demoVideos: true
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
        }
      }
    });

    if (!topic) {
      return NextResponse.json(
        { error: 'Topic not found' },
        { status: 404 }
      );
    }

    // Collect demo videos from topic demo and all chapters under this topic
    const allDemoVideos: any[] = [];
    let topicDemoContent = '';
    let totalCourses = 0;
    let totalStudents = 1250; // Mock data for now
    const rating = 4.8; // Mock data for now

    // Add topic-level demo videos
    console.log('Topic demo data:', topic.demo);
    console.log('Demo URLs:', topic.demo?.demoUrls);
    
    if (topic.demo?.demoUrls) {
      topic.demo.demoUrls.forEach((url: string, index: number) => {
        console.log(`Processing URL ${index}:`, url);
        const youtubeId = getYoutubeVideoId(url);
        console.log('Extracted YouTube ID:', youtubeId);
        
        if (youtubeId) {
          allDemoVideos.push({
            id: `topic-demo-${index}`,
            title: `${topic.title} Demo ${index + 1}`,
            duration: '0:00', // We don't have duration for topic demos
            thumbnail: `https://img.youtube.com/vi/${youtubeId}/mqdefault.jpg`,
            youtubeId: youtubeId,
            instructor: 'Topic Demo'
          });
        }
      });
    }

    // Get topic demo content
    if (topic.demo?.content) {
      topicDemoContent = topic.demo.content;
    }

    // Add chapter demo videos
    topic.subtopics.forEach((subtopic) => {
      totalCourses += subtopic.courses.length;
      subtopic.courses.forEach((course) => {
        course.chapters.forEach((chapter) => {
          chapter.demoVideos.forEach((video) => {
            const youtubeId = getYoutubeVideoId(video.videoUrl);
            if (youtubeId) {
              allDemoVideos.push({
                id: video.id,
                title: video.title,
                duration: formatDuration(video.duration),
                thumbnail: video.thumbnailUrl || '/api/placeholder/320/180',
                youtubeId: youtubeId,
                instructor: 'Chapter Instructor' // Mock data - you might want to add instructor field
              });
            }
          });
        });
      });
    });

    // Transform the data to match the frontend interface
    const transformedTopic = {
      id: topic.id,
      title: topic.title,
      description: topic.description || '',
      icon: '🌱', // Mock icon - you might want to add this field to the schema
      subtopics: topic.subtopics.map((subtopic) => ({
        id: subtopic.id,
        title: subtopic.title,
        description: subtopic.description || '',
        courseCount: subtopic._count.courses,
        courses: subtopic.courses.map((course) => ({
          id: course.id,
          title: course.title,
          description: course.description || '',
          thumbnail: course.thumbnail || null,
          duration: '2h 30m', // Mock duration - you might want to calculate this
          difficulty: 'Beginner', // Mock difficulty - you might want to add this field
          enrolledCount: 100 // Mock enrolled count - you might want to add this field
        }))
      })),
      totalCourses,
      totalStudents,
      rating
    };

    return NextResponse.json({ 
      topic: transformedTopic,
      demoVideos: allDemoVideos,
      demoContent: topicDemoContent
    });
  } catch (error) {
    console.error('Fetch topic error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
