import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import jwt from 'jsonwebtoken';

export const runtime = 'nodejs';

function verifyAdmin(request: NextRequest) {
    const authHeader = request.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) return null;
    try {
        const token = authHeader.substring(7);
        const decoded = jwt.verify(token, process.env.JWT_SECRET!) as { userId: string; role: string };
        if (decoded.role !== 'admin') return null;
        return decoded;
    } catch {
        return null;
    }
}

// GET /api/admin/organizations - List all organizations
export async function GET(request: NextRequest) {
    const admin = verifyAdmin(request);
    if (!admin) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const organizations = await prisma.organization.findMany({
            orderBy: [{ isDefault: 'desc' }, { createdAt: 'asc' }],
            include: {
                _count: { select: { courses: true } }
            }
        });
        return NextResponse.json({ organizations });
    } catch (error) {
        console.error('Error fetching organizations:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

// POST /api/admin/organizations - Create organization
export async function POST(request: NextRequest) {
    const admin = verifyAdmin(request);
    if (!admin) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const { name, description, htmlTemplate, isDefault } = await request.json();

        if (!name?.trim()) {
            return NextResponse.json({ error: 'Name is required' }, { status: 400 });
        }

        // If setting as default, unset other defaults
        if (isDefault) {
            await prisma.organization.updateMany({
                where: { isDefault: true },
                data: { isDefault: false }
            });
        }

        const organization = await prisma.organization.create({
            data: {
                name: name.trim(),
                description: description?.trim() || null,
                htmlTemplate: htmlTemplate?.trim() || null,
                isDefault: isDefault ?? false
            }
        });

        return NextResponse.json({ organization }, { status: 201 });
    } catch (error) {
        console.error('Error creating organization:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
