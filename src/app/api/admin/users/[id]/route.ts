import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyToken } from '@/lib/auth';
import bcrypt from 'bcryptjs';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Get the token from the Authorization header
    const authHeader = request.headers.get('authorization');
    const token = authHeader?.split(' ')[1];

    if (!token) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Verify the token
    const decoded = verifyToken(token) as { role: string } | null;
    if (!decoded || decoded.role !== 'admin') {
      return NextResponse.json(
        { error: 'Admin access required' },
        { status: 403 }
      );
    }

    const { id } = await params;

    // Get the specific user by ID
    const user = await prisma.user.findUnique({
      where: {
        id: id
      },
      select: {
        id: true,
        phone: true,
        email: true,
        name: true,
        role: true,
        createdAt: true,
        updatedAt: true,
      }
    });

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ user });
  } catch (error) {
    console.error('Admin user details error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Get the token from the Authorization header
    const authHeader = request.headers.get('authorization');
    const token = authHeader?.split(' ')[1];

    if (!token) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Verify the token
    const decoded = verifyToken(token) as { role: string } | null;
    if (!decoded || decoded.role !== 'admin') {
      return NextResponse.json(
        { error: 'Admin access required' },
        { status: 403 }
      );
    }

    const { id } = await params;
    const { phone, password, email } = await request.json();

    // Check if user exists
    const existingUser = await prisma.user.findUnique({
      where: { id }
    });

    if (!existingUser) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    let normalizedPhone: string | null = existingUser.phone;
    if (phone !== undefined && phone !== null && phone.trim() !== '') {
      normalizedPhone = phone.replace(/\D/g, '');
      if (normalizedPhone.length === 12 && normalizedPhone.startsWith('91')) {
        normalizedPhone = normalizedPhone.slice(2);
      }
      if (normalizedPhone.length !== 10) {
        return NextResponse.json(
          { error: 'Phone number must be exactly 10 digits' },
          { status: 400 }
        );
      }

      // Check if phone is already taken by another user
      if (normalizedPhone !== existingUser.phone) {
        const phoneExists = await prisma.user.findUnique({
          where: { phone: normalizedPhone }
        });

        if (phoneExists) {
          return NextResponse.json(
            { error: 'Phone number already exists' },
            { status: 400 }
          );
        }
      }
    } else if (phone === null || (typeof phone === 'string' && phone.trim() === '')) {
      normalizedPhone = null;
    }

    // Prepare update data
    const updateData: { phone?: string | null; email?: string | null; password?: string } = {};
    if (normalizedPhone !== existingUser.phone) {
      updateData.phone = normalizedPhone;
    }

    if (email !== undefined) {
      if (email === null || (typeof email === 'string' && email.trim() === '')) {
        updateData.email = null;
      } else if (typeof email !== 'string') {
        return NextResponse.json(
          { error: 'Valid email is required' },
          { status: 400 }
        );
      } else {
        const normalizedEmail = email.trim().toLowerCase();
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(normalizedEmail)) {
          return NextResponse.json(
            { error: 'Valid email is required' },
            { status: 400 }
          );
        }

        if (normalizedEmail !== (existingUser.email ?? '').toLowerCase()) {
          const emailExists = await prisma.user.findUnique({
            where: { email: normalizedEmail }
          });

          if (emailExists && emailExists.id !== id) {
            return NextResponse.json(
              { error: 'Email already exists' },
              { status: 400 }
            );
          }
        }

        updateData.email = normalizedEmail;
      }
    }

    // Hash password if provided
    if (password && password.trim() !== '') {
      const saltRounds = 10;
      updateData.password = await bcrypt.hash(password, saltRounds);
    }

    // Update the user
    const updatedUser = await prisma.user.update({
      where: { id },
      data: updateData,
      select: {
        id: true,
        phone: true,
        email: true,
        name: true,
        role: true,
        createdAt: true,
        updatedAt: true,
      }
    });

    return NextResponse.json({ user: updatedUser });
  } catch (error) {
    console.error('Admin user update error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Get the token from the Authorization header
    const authHeader = request.headers.get('authorization');
    const token = authHeader?.split(' ')[1];

    if (!token) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Verify the token
    const decoded = verifyToken(token) as { role: string } | null;
    if (!decoded || decoded.role !== 'admin') {
      return NextResponse.json(
        { error: 'Admin access required' },
        { status: 403 }
      );
    }

    const { id } = await params;

    // Check if user exists
    const existingUser = await prisma.user.findUnique({
      where: { id }
    });

    if (!existingUser) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Prevent deleting admin users
    if (existingUser.role === 'admin') {
      return NextResponse.json(
        { error: 'Cannot delete admin users' },
        { status: 403 }
      );
    }

    // Delete the user
    await prisma.user.delete({
      where: { id }
    });

    return NextResponse.json({ message: 'User deleted successfully' });
  } catch (error) {
    console.error('Admin user delete error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
