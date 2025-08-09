import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import jwt from 'jsonwebtoken';

const prisma = new PrismaClient();

// Helper function to extract video ID from YouTube URL
function extractVideoId(url: string): string | null {
  const regex = /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?|shorts)\/|.*[?&]v=)|youtu\.be\/|youtube\.com\/shorts\/)([^"&?\/\s]{11})/;
  const match = url.match(regex);
  return match ? match[1] : null;
}

// Helper function to generate thumbnail URL
function generateThumbnailUrl(videoId: string): string {
  return `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`;
}

// Helper function to verify admin token
async function verifyAdminToken(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return null;
    }

    const token = authHeader.substring(7);
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any;
    
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId }
    });

    if (!user || user.role !== 'admin') {
      return null;
    }

    return user;
  } catch (error) {
    return null;
  }
}

// GET - Fetch all YouTube shorts
export async function GET(request: NextRequest) {
  try {
    // Verify admin authentication
    const user = await verifyAdminToken(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const search = searchParams.get('search') || '';

    const skip = (page - 1) * limit;

    // Build where clause for search
    const where = search ? {
      OR: [
        { title: { contains: search, mode: 'insensitive' as const } },
        { videoId: { contains: search, mode: 'insensitive' as const } },
        { description: { contains: search, mode: 'insensitive' as const } },
      ]
    } : {};

    // Get total count for pagination
    const totalCount = await prisma.youTubeShort.count({ where });

    // Fetch shorts with pagination
    const shorts = await prisma.youTubeShort.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit,
    });

    return NextResponse.json({
      shorts,
      pagination: {
        total: totalCount,
        page,
        limit,
        totalPages: Math.ceil(totalCount / limit)
      }
    });
  } catch (error) {
    console.error('Error fetching YouTube shorts:', error);
    return NextResponse.json({ error: 'Failed to fetch shorts' }, { status: 500 });
  }
}

// POST - Create new YouTube short
export async function POST(request: NextRequest) {
  try {
    // Verify admin authentication
    const user = await verifyAdminToken(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { title, description, url } = await request.json();

    // Validate required fields
    if (!title || !url) {
      return NextResponse.json({ error: 'Title and URL are required' }, { status: 400 });
    }

    // Extract video ID from URL
    const videoId = extractVideoId(url);
    if (!videoId) {
      return NextResponse.json({ error: 'Invalid YouTube URL' }, { status: 400 });
    }

    // Check if URL already exists
    const existingShort = await prisma.youTubeShort.findUnique({
      where: { url }
    });

    if (existingShort) {
      return NextResponse.json({ error: 'This YouTube URL already exists' }, { status: 409 });
    }

    // Generate thumbnail URL
    const thumbnailUrl = generateThumbnailUrl(videoId);

    // Create new short
    const newShort = await prisma.youTubeShort.create({
      data: {
        title,
        description: description || null,
        url,
        videoId,
        thumbnailUrl,
      }
    });

    return NextResponse.json(newShort, { status: 201 });
  } catch (error) {
    console.error('Error creating YouTube short:', error);
    return NextResponse.json({ error: 'Failed to create short' }, { status: 500 });
  }
}
