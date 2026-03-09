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

// GET /api/admin/organizations/[id]
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    const admin = verifyAdmin(request);
    if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { id } = await params;
    try {
        const organization = await prisma.organization.findUnique({ where: { id } });
        if (!organization) return NextResponse.json({ error: 'Not found' }, { status: 404 });
        return NextResponse.json({ organization });
    } catch (error) {
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

// PUT /api/admin/organizations/[id]
export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    const admin = verifyAdmin(request);
    if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { id } = await params;
    try {
        const { name, description, htmlTemplate, isDefault } = await request.json();

        if (!name?.trim()) {
            return NextResponse.json({ error: 'Name is required' }, { status: 400 });
        }

        // If setting as default, unset previous defaults
        if (isDefault) {
            await prisma.organization.updateMany({
                where: { isDefault: true, NOT: { id } },
                data: { isDefault: false }
            });
        }

        const organization = await prisma.organization.update({
            where: { id },
            data: {
                name: name.trim(),
                description: description?.trim() || null,
                htmlTemplate: htmlTemplate?.trim() || null,
                isDefault: isDefault ?? false
            }
        });

        return NextResponse.json({ organization });
    } catch (error) {
        console.error('Error updating organization:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

// DELETE /api/admin/organizations/[id]
export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    const admin = verifyAdmin(request);
    if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { id } = await params;
    try {
        const org = await prisma.organization.findUnique({ where: { id } });
        if (!org) return NextResponse.json({ error: 'Not found' }, { status: 404 });

        if (org.isDefault) {
            return NextResponse.json({ error: 'Cannot delete the default organization' }, { status: 400 });
        }

        await prisma.organization.delete({ where: { id } });
        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Error deleting organization:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
