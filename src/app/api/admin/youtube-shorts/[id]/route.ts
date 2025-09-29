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
      where: { id: decoded.sub }
    });

    if (!user || user.role !== 'admin') {
      return null;
    }

    return user;
  } catch (error) {
    return null;
  }
}

// PUT - Update YouTube short
export async function PUT(request: NextRequest, props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  try {
    // Verify admin authentication
    const user = await verifyAdminToken(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = params;
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

    // Check if the short exists
    const existingShort = await prisma.youTubeShort.findUnique({
      where: { id }
    });

    if (!existingShort) {
      return NextResponse.json({ error: 'Short not found' }, { status: 404 });
    }

    // Check if URL already exists for a different short
    if (url !== existingShort.url) {
      const urlConflict = await prisma.youTubeShort.findUnique({
        where: { url }
      });

      if (urlConflict && urlConflict.id !== id) {
        return NextResponse.json({ error: 'This YouTube URL already exists' }, { status: 409 });
      }
    }

    // Generate thumbnail URL
    const thumbnailUrl = generateThumbnailUrl(videoId);

    // Update the short
    const updatedShort = await prisma.youTubeShort.update({
      where: { id },
      data: {
        title,
        description: description || null,
        url,
        videoId,
        thumbnailUrl,
      }
    });

    return NextResponse.json(updatedShort);
  } catch (error) {
    console.error('Error updating YouTube short:', error);
    return NextResponse.json({ error: 'Failed to update short' }, { status: 500 });
  }
}

// DELETE - Delete YouTube short
export async function DELETE(request: NextRequest, props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  try {
    // Verify admin authentication
    const user = await verifyAdminToken(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = params;

    // Check if the short exists
    const existingShort = await prisma.youTubeShort.findUnique({
      where: { id }
    });

    if (!existingShort) {
      return NextResponse.json({ error: 'Short not found' }, { status: 404 });
    }

    // Delete the short
    await prisma.youTubeShort.delete({
      where: { id }
    });

    return NextResponse.json({ message: 'Short deleted successfully' });
  } catch (error) {
    console.error('Error deleting YouTube short:', error);
    return NextResponse.json({ error: 'Failed to delete short' }, { status: 500 });
  }
}

// GET - Get single YouTube short (optional, for debugging)
export async function GET(request: NextRequest, props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  try {
    // Verify admin authentication
    const user = await verifyAdminToken(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = params;

    const short = await prisma.youTubeShort.findUnique({
      where: { id }
    });

    if (!short) {
      return NextResponse.json({ error: 'Short not found' }, { status: 404 });
    }

    return NextResponse.json(short);
  } catch (error) {
    console.error('Error fetching YouTube short:', error);
    return NextResponse.json({ error: 'Failed to fetch short' }, { status: 500 });
  }
}
