import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { prisma } from '@/lib/prisma';
import { handleFileUpload, deleteFile } from '@/lib/upload';

// Force Node.js runtime to use jsonwebtoken
export const runtime = 'nodejs';

export async function PUT(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { message: 'Authorization token required' },
        { status: 401 }
      );
    }

    const token = authHeader.substring(7);
    
    if (!process.env.JWT_SECRET) {
      return NextResponse.json(
        { message: 'Server configuration error' },
        { status: 500 }
      );
    }

    // Verify JWT token
    const decoded = jwt.verify(token, process.env.JWT_SECRET) as { userId: string };
    const userId = decoded.userId;

    // Get request body (FormData)
    const formData = await request.formData();
    const email = formData.get('email') as string;
    const currentPassword = formData.get('currentPassword') as string;
    const newPassword = formData.get('newPassword') as string;
    const profilePhotoFile = formData.get('profilePhoto') as File;

    // Validate email
    if (!email || typeof email !== 'string') {
      return NextResponse.json(
        { message: 'Valid email is required' },
        { status: 400 }
      );
    }

    // Get current user
    const user = await prisma.user.findUnique({
      where: { id: userId }
    });

    if (!user) {
      return NextResponse.json(
        { message: 'User not found' },
        { status: 404 }
      );
    }

    // Check if email is already taken by another user
    if (email !== user.email) {
      const existingUser = await prisma.user.findUnique({
        where: { email }
      });

      if (existingUser && existingUser.id !== userId) {
        return NextResponse.json(
          { message: 'Email is already in use' },
          { status: 400 }
        );
      }
    }

    // Handle profile photo upload
    let profilePhotoUrl = null;
    if (profilePhotoFile && profilePhotoFile.size > 0) {
      console.log('Processing profile photo upload:', profilePhotoFile.name);
      const uploadResult = await handleFileUpload(profilePhotoFile, userId);
      
      if (!uploadResult.success) {
        return NextResponse.json(
          { message: uploadResult.error || 'Failed to upload profile photo' },
          { status: 400 }
        );
      }
      
      profilePhotoUrl = uploadResult.publicUrl;
      
      // Delete old profile photo if exists
      if (user.profilePhoto) {
        await deleteFile(user.profilePhoto);
      }
    }

    // Prepare update data
    interface UpdateData {
      email: string;
      profilePhoto?: string;
      password?: string;
    }
    const updateData: UpdateData = {
      email,
    };
    
    if (profilePhotoUrl) {
      updateData.profilePhoto = profilePhotoUrl;
    }

    // Handle password update
    if (newPassword) {
      if (!currentPassword) {
        return NextResponse.json(
          { message: 'Current password is required to change password' },
          { status: 400 }
        );
      }

      // Verify current password
      const isCurrentPasswordValid = await bcrypt.compare(currentPassword, user.password);
      if (!isCurrentPasswordValid) {
        return NextResponse.json(
          { message: 'Current password is incorrect' },
          { status: 400 }
        );
      }

      // Validate new password
      if (newPassword.length < 6) {
        return NextResponse.json(
          { message: 'New password must be at least 6 characters long' },
          { status: 400 }
        );
      }

      // Hash new password
      const hashedNewPassword = await bcrypt.hash(newPassword, 12);
      updateData.password = hashedNewPassword;
    }

    // Update user
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: updateData,
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        profilePhoto: true,
      }
    });

    return NextResponse.json({
      message: 'Profile updated successfully',
      user: updatedUser
    });

  } catch (error) {
    console.error('Update profile error:', error);
    
    if (error instanceof jwt.JsonWebTokenError) {
      return NextResponse.json(
        { message: 'Invalid token' },
        { status: 401 }
      );
    }

    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}
