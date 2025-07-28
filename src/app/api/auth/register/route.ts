import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { hashPassword } from '@/lib/auth';
import { sendEmail, generateOTP, getOTPEmailTemplate } from '@/lib/email';

// Force Node.js runtime to use jsonwebtoken
export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password, name } = body;

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      );
    }

    // Check if user already exists and is verified
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser && existingUser.emailVerified) {
      return NextResponse.json(
        { error: 'User with this email already exists' },
        { status: 409 }
      );
    }

    // Generate OTP and expiry time (10 minutes from now)
    const otp = generateOTP();
    const otpExpiry = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    // Hash password
    const hashedPassword = await hashPassword(password);

    // Create or update user with OTP
    const user = await prisma.user.upsert({
      where: { email },
      update: {
        password: hashedPassword,
        name: name || '',
        verificationToken: otp,
        verificationTokenExpiry: otpExpiry,
        emailVerified: null, // Reset verification status
      },
      create: {
        email,
        password: hashedPassword,
        name: name || '',
        role: 'user',
        verificationToken: otp,
        verificationTokenExpiry: otpExpiry,
        emailVerified: null,
      },
    });

    // Send OTP email
    const emailResult = await sendEmail({
      to: email,
      subject: 'Verify your email - CrediSphere',
      html: getOTPEmailTemplate(otp, name || 'User'),
      text: `Your verification code is: ${otp}. This code will expire in 10 minutes.`,
    });

    if (!emailResult.success) {
      // If email sending fails, delete the user record
      await prisma.user.delete({ where: { id: user.id } });
      return NextResponse.json(
        { error: 'Failed to send verification email. Please try again.' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      message: 'Registration initiated. Please check your email for verification code.',
      email: user.email,
      requiresVerification: true,
    }, { status: 201 });
  } catch (error) {
    console.error('Registration error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
