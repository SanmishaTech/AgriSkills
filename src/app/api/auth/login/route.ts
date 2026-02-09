import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { comparePasswords, generateToken } from '@/lib/auth';

// Force Node.js runtime to use jsonwebtoken
export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { password } = body;
    const identifier = body?.identifier ?? body?.phone ?? body?.email;

    if (!identifier || !password) {
      return NextResponse.json(
        { error: 'Email or phone and password are required' },
        { status: 400 }
      );
    }

    if (typeof identifier !== 'string') {
      return NextResponse.json(
        { error: 'Email or phone and password are required' },
        { status: 400 }
      );
    }

    const trimmedIdentifier = identifier.trim();

    // Find the user
    const user = trimmedIdentifier.includes('@')
      ? await prisma.user.findUnique({
          where: { email: trimmedIdentifier.toLowerCase() },
        })
      : await (async () => {
          let normalizedPhone = trimmedIdentifier.replace(/\D/g, '');
          if (normalizedPhone.length === 12 && normalizedPhone.startsWith('91')) {
            normalizedPhone = normalizedPhone.slice(2);
          }

          if (normalizedPhone.length !== 10) {
            return null;
          }

          return prisma.user.findUnique({
            where: { phone: normalizedPhone },
          });
        })();

    if (!user) {
      return NextResponse.json(
        { error: 'Invalid credentials' },
        { status: 401 }
      );
    }

    // Verify password
    const passwordValid = await comparePasswords(password, user.password);
    if (!passwordValid) {
      return NextResponse.json(
        { error: 'Invalid credentials' },
        { status: 401 }
      );
    }

    // Generate JWT token
    const token = generateToken(user.id, { phone: user.phone, email: user.email }, user.role);

    return NextResponse.json({
      user: {
        id: user.id,
        phone: user.phone,
        email: user.email,
        name: user.name,
        role: user.role,
      },
      token,
    });
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
