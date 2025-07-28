import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import jwt from 'jsonwebtoken';

// List of paths that require authentication
const protectedPaths = [
  '/api/protected',
  // Add more protected paths as needed
];

// List of paths that require admin role
const adminPaths = [
  '/api/admin',
  // Add more admin paths as needed
];

export function middleware(request: NextRequest) {
  const path = request.nextUrl.pathname;
  
  // Check if the path is protected
  const isProtectedPath = protectedPaths.some(pp => path.startsWith(pp));
  const isAdminPath = adminPaths.some(ap => path.startsWith(ap));
  
  if (!isProtectedPath && !isAdminPath) {
    return NextResponse.next();
  }

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
  // In middleware, we need to use the JWT_SECRET directly as env vars work differently in Edge Runtime
  const JWT_SECRET = process.env.JWT_SECRET || '83077b22cfbb2436782076383304e84a6bba45607837697f7b81c085f620eae9';
  
  try {
    interface JWTPayload {
      userId: string;
      email: string;
      role: string;
      iat?: number;
      exp?: number;
    }
    const decoded = jwt.verify(token, JWT_SECRET) as JWTPayload;
    
    // Check admin role for admin paths
    if (isAdminPath && decoded.role !== 'admin') {
      return NextResponse.json(
        { error: 'Admin access required' },
        { status: 403 }
      );
    }
    
    return NextResponse.next();
  } catch {
    return NextResponse.json(
      { error: 'Invalid or expired token' },
      { status: 401 }
    );
  }

}

// Middleware disabled - authentication handled in individual routes
export const config = {
  matcher: [],
};
