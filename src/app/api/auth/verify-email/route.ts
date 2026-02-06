import { NextRequest, NextResponse } from 'next/server';

// Force Node.js runtime to use jsonwebtoken
export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  void request;
  return NextResponse.json(
    { error: 'This endpoint is disabled (phone + password authentication is enabled).' },
    { status: 410 }
  );
}
