import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { hashPassword } from '@/lib/auth';

// Force Node.js runtime to use jsonwebtoken
export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { phone, email, password, name } = body;

    // Validate: at least one of email or phone is required, plus password
    const hasPhone = phone && typeof phone === 'string' && phone.trim().length > 0;
    const hasEmail = email && typeof email === 'string' && email.trim().length > 0;

    if (!hasPhone && !hasEmail) {
      return NextResponse.json(
        { error: 'Either phone number or email is required' },
        { status: 400 }
      );
    }

    if (!password || typeof password !== 'string' || password.length < 6) {
      return NextResponse.json(
        { error: 'Password must be at least 6 characters long' },
        { status: 400 }
      );
    }

    // Normalize and validate phone if provided
    let normalizedPhone: string | null = null;
    if (hasPhone) {
      normalizedPhone = (phone as string).replace(/\D/g, '');
      if (normalizedPhone.length !== 10) {
        return NextResponse.json(
          { error: 'Phone number must be exactly 10 digits' },
          { status: 400 }
        );
      }

      // Check if phone already exists
      const existingPhoneUser = await prisma.user.findUnique({
        where: { phone: normalizedPhone },
      });

      if (existingPhoneUser) {
        return NextResponse.json(
          { error: 'User with this phone number already exists' },
          { status: 409 }
        );
      }
    }

    // Normalize and validate email if provided
    let normalizedEmail: string | null = null;
    if (hasEmail) {
      normalizedEmail = (email as string).trim().toLowerCase();
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(normalizedEmail)) {
        return NextResponse.json(
          { error: 'Valid email is required' },
          { status: 400 }
        );
      }

      // Check if email already exists
      const existingEmailUser = await prisma.user.findUnique({
        where: { email: normalizedEmail },
      });

      if (existingEmailUser) {
        return NextResponse.json(
          { error: 'User with this email already exists' },
          { status: 409 }
        );
      }
    }

    // Hash password
    const hashedPassword = await hashPassword(password);

    const user = await prisma.user.create({
      data: {
        phone: normalizedPhone,
        email: normalizedEmail,
        password: hashedPassword,
        name: typeof name === 'string' ? name : '',
        role: 'user',
      },
    });

    return NextResponse.json({
      message: 'Registration successful',
      user: {
        id: user.id,
        phone: user.phone,
        email: user.email,
        name: user.name,
        role: user.role,
      },
    }, { status: 201 });
  } catch (error) {
    console.error('Registration error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
