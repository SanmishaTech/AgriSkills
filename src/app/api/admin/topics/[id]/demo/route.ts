import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import jwt from 'jsonwebtoken';

const prisma = new PrismaClient();

// GET - Fetch demo data for a topic
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const token = request.headers.get('authorization')?.replace('Bearer ', '');
    
    if (!token) {
      return NextResponse.json(
        { error: 'Authorization token required' },
        { status: 401 }
      );
    }

    // Verify JWT token
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any;
    
    // Check if user is admin
    const user = await prisma.user.findUnique({
      where: { id: decoded.sub },
    });

    if (!user || user.role !== 'admin') {
      return NextResponse.json(
        { error: 'Admin access required' },
        { status: 403 }
      );
    }

    const topicId = params.id;

    // Check if topic exists
    const topic = await prisma.topic.findUnique({
      where: { id: topicId },
    });

    if (!topic) {
      return NextResponse.json(
        { error: 'Topic not found' },
        { status: 404 }
      );
    }

    // Try to find existing demo data
    const demoData = await prisma.topicDemo.findUnique({
      where: { topicId: topicId },
    });

    return NextResponse.json({
      success: true,
      demo: demoData ? {
        demoUrls: demoData.demoUrls || [],
        content: demoData.content || ''
      } : null
    });

  } catch (error) {
    console.error('Error fetching demo data:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// PUT - Save/Update demo data for a topic
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const token = request.headers.get('authorization')?.replace('Bearer ', '');
    
    if (!token) {
      return NextResponse.json(
        { error: 'Authorization token required' },
        { status: 401 }
      );
    }

    // Verify JWT token
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any;
    
    // Check if user is admin
    const user = await prisma.user.findUnique({
      where: { id: decoded.sub },
    });

    if (!user || user.role !== 'admin') {
      return NextResponse.json(
        { error: 'Admin access required' },
        { status: 403 }
      );
    }

    const topicId = params.id;
    const { demoUrls, content } = await request.json();

    // Validate input
    if (!Array.isArray(demoUrls)) {
      return NextResponse.json(
        { error: 'demoUrls must be an array' },
        { status: 400 }
      );
    }

    if (typeof content !== 'string') {
      return NextResponse.json(
        { error: 'content must be a string' },
        { status: 400 }
      );
    }

    // Check if topic exists
    const topic = await prisma.topic.findUnique({
      where: { id: topicId },
    });

    if (!topic) {
      return NextResponse.json(
        { error: 'Topic not found' },
        { status: 404 }
      );
    }

    // Validate YouTube URLs
    const youtubeRegex = /^(https?:\/\/)?(www\.)?(youtube\.com\/(watch\?v=|shorts\/)|youtu\.be\/)[\w-]+/;
    for (const url of demoUrls) {
      if (url && !youtubeRegex.test(url)) {
        return NextResponse.json(
          { error: `Invalid YouTube URL: ${url}` },
          { status: 400 }
        );
      }
    }

    // Upsert demo data
    const demoData = await prisma.topicDemo.upsert({
      where: { topicId: topicId },
      update: {
        demoUrls: demoUrls,
        content: content,
        updatedAt: new Date(),
      },
      create: {
        topicId: topicId,
        demoUrls: demoUrls,
        content: content,
      },
    });

    return NextResponse.json({
      success: true,
      demo: {
        id: demoData.id,
        demoUrls: demoData.demoUrls,
        content: demoData.content,
        topicId: demoData.topicId,
        createdAt: demoData.createdAt,
        updatedAt: demoData.updatedAt,
      }
    });

  } catch (error) {
    console.error('Error saving demo data:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
