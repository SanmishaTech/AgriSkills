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
  // Authentication is handled in individual routes, the middleware is disabled.
  return NextResponse.next();
}

// Middleware disabled - authentication handled in individual routes
export const config = {
  matcher: [],
};
