import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyToken } from '@/lib/auth';

export const runtime = 'nodejs';

function isSafeInternalPath(path: unknown): path is string {
  if (typeof path !== 'string') return false;
  if (!path.startsWith('/')) return false;
  if (path.startsWith('//')) return false;
  if (path.includes('://')) return false;
  return true;
}

function isBlockedLastUrl(path: string) {
  const blocked = new Set<string>(['/login', '/register']);
  if (blocked.has(path)) return true;
  if (path.startsWith('/api')) return true;
  return false;
}

export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    const token = authHeader?.split(' ')[1];

    if (!token) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const decoded = verifyToken(token) as { sub?: string; userId?: string } | null;
    const userId = decoded?.sub ?? decoded?.userId;

    if (!userId) {
      return NextResponse.json({ error: 'Invalid or expired token' }, { status: 401 });
    }

    const body = await request.json().catch(() => null);
    const lastUrl = body?.lastUrl;

    if (lastUrl !== null && lastUrl !== undefined && !isSafeInternalPath(lastUrl)) {
      return NextResponse.json({ error: 'Invalid lastUrl' }, { status: 400 });
    }

    if (typeof lastUrl === 'string' && isBlockedLastUrl(lastUrl)) {
      return NextResponse.json({ success: true });
    }

    await prisma.user.update({
      where: { id: userId },
      data: { lastUrl: lastUrl ?? null },
      select: { id: true },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Update lastUrl error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
