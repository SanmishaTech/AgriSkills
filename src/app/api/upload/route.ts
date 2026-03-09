import { NextRequest, NextResponse } from 'next/server';
import { writeFile } from 'fs/promises';
import path from 'path';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      );
    }

    // Security 1: Size Limit (Max 5MB)
    const MAX_FILE_SIZE = 5 * 1024 * 1024;
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: 'File size exceeds 5MB limit.' },
        { status: 400 }
      );
    }

    // Security 2: Validate MIME Type
    const validMimeTypes = ['image/jpeg', 'image/png', 'image/webp'];
    if (!validMimeTypes.includes(file.type)) {
      return NextResponse.json(
        { error: 'Invalid file type. Only JPEG, PNG, and WebP are allowed.' },
        { status: 400 }
      );
    }

    // Security 3: Validate File Extension (Secondary check to prevent mismatch)
    const validExtensions = ['.jpg', '.jpeg', '.png', '.webp'];
    const originalExtension = path.extname(file.name).toLowerCase();
    if (!validExtensions.includes(originalExtension)) {
      return NextResponse.json(
        { error: 'Invalid file extension.' },
        { status: 400 }
      );
    }

    // Convert to buffer for deep saving
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Security 4: Deep Inspection - check magic numbers (file signature)
    const hexSignature = buffer.subarray(0, 4).toString('hex').toUpperCase();
    const isJPEG = hexSignature.startsWith('FFD8FF');
    const isPNG = hexSignature === '89504E47';
    const isWEBP = hexSignature.startsWith('52494646') && buffer.subarray(8, 12).toString('ascii') === 'WEBP';

    if (!isJPEG && !isPNG && !isWEBP) {
      return NextResponse.json(
        { error: 'File content does not match image signature. Malicious file suspected.' },
        { status: 400 }
      );
    }

    // Security 5: completely randomize the filename to strip any payloads in the original name
    const crypto = await import('crypto');
    const randomName = crypto.randomUUID();
    const filename = `${randomName}${originalExtension}`;
    const uploadDir = path.join(process.cwd(), 'uploads', 'thumbnails');
    const filePath = path.join(uploadDir, filename);

    // Create directory if it doesn't exist
    const { mkdir } = await import('fs/promises');
    await mkdir(uploadDir, { recursive: true });

    // Save file
    await writeFile(filePath, buffer);

    // Return the API URL path
    const url = `/api/thumbnails/${filename}`;

    return NextResponse.json({ url });
  } catch (error) {
    console.error('Upload error:', error);
    return NextResponse.json(
      { error: 'Failed to upload file' },
      { status: 500 }
    );
  }
}
