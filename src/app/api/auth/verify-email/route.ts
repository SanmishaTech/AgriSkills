import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import jwt from 'jsonwebtoken';

// Force Node.js runtime to use jsonwebtoken
export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  try {
    const { email, otp } = await request.json();

    if (!email || !otp) {
      return NextResponse.json(
        { error: 'Email and OTP are required' },
        { status: 400 }
      );
    }

    // Find the pending user verification
    const verification = await prisma.user.findUnique({
      where: { email },
    });

    if (!verification) {
      return NextResponse.json(
        { error: 'Verification record not found' },
        { status: 404 }
      );
    }

    // Check if user is already verified
    if (verification.emailVerified) {
      return NextResponse.json(
        { error: 'Email already verified' },
        { status: 400 }
      );
    }

    // Check if OTP matches and hasn't expired
    if (verification.verificationToken !== otp) {
      return NextResponse.json(
        { error: 'Invalid verification code' },
        { status: 400 }
      );
    }

    // Check if OTP has expired (10 minutes)
    const now = new Date();
    const otpCreatedAt = verification.verificationTokenExpiry;
    
    if (!otpCreatedAt || now > otpCreatedAt) {
      return NextResponse.json(
        { error: 'Verification code has expired' },
        { status: 400 }
      );
    }

    // Verify the user and clear verification tokens
    const verifiedUser = await prisma.user.update({
      where: { email },
      data: {
        emailVerified: new Date(),
        verificationToken: null,
        verificationTokenExpiry: null,
      },
    });

    // Generate JWT token
    const token = jwt.sign(
      { 
        userId: verifiedUser.id, 
        email: verifiedUser.email,
        role: verifiedUser.role 
      },
      process.env.JWT_SECRET!,
      { expiresIn: '7d' }
    );

    // Return success with user data and token
    return NextResponse.json({
      message: 'Email verified successfully',
      token,
      user: {
        id: verifiedUser.id,
        email: verifiedUser.email,
        name: verifiedUser.name,
        role: verifiedUser.role,
      },
    });

  } catch (error) {
    console.error('Email verification error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
