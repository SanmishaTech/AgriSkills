import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// GET - Fetch active YouTube shorts for public display
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '10');

    // Fetch active shorts ordered by creation date (newest first)
    const shorts = await prisma.youTubeShort.findMany({
      where: { isActive: true },
      orderBy: { createdAt: 'desc' },
      take: limit,
      select: {
        id: true,
        title: true,
        description: true,
        url: true,
        videoId: true,
        thumbnailUrl: true,
        createdAt: true,
      }
    });

    // Transform the data to match the expected format for the homepage
    const transformedShorts = shorts.map((short, index) => ({
      id: index + 1, // Use index for display purposes
      youtubeId: short.videoId,
      title: short.title,
      duration: "Short", // YouTube shorts are typically under 60 seconds
      instructor: process.env.NEXT_PUBLIC_APP_NAME || "GramKushal", // Default instructor name
      views: `${Math.floor(Math.random() * 50) + 1}K`, // Mock view count
      timeAgo: getTimeAgo(short.createdAt),
      shortsUrl: short.url,
      embedUrl: `https://www.youtube.com/embed/${short.videoId}`,
      thumbnailUrl: short.thumbnailUrl,
      description: short.description,
    }));

    return NextResponse.json({
      success: true,
      shorts: transformedShorts,
      total: transformedShorts.length
    });
  } catch (error) {
    console.error('Error fetching YouTube shorts for public display:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to fetch shorts',
      shorts: []
    }, { status: 500 });
  }
}

// Helper function to calculate time ago
function getTimeAgo(date: Date): string {
  const now = new Date();
  const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));

  if (diffInMinutes < 1) return 'Just now';
  if (diffInMinutes < 60) return `${diffInMinutes} minute${diffInMinutes !== 1 ? 's' : ''} ago`;

  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) return `${diffInHours} hour${diffInHours !== 1 ? 's' : ''} ago`;

  const diffInDays = Math.floor(diffInHours / 24);
  if (diffInDays < 30) return `${diffInDays} day${diffInDays !== 1 ? 's' : ''} ago`;

  const diffInMonths = Math.floor(diffInDays / 30);
  if (diffInMonths < 12) return `${diffInMonths} month${diffInMonths !== 1 ? 's' : ''} ago`;

  const diffInYears = Math.floor(diffInMonths / 12);
  return `${diffInYears} year${diffInYears !== 1 ? 's' : ''} ago`;
}
