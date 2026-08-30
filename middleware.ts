import { NextRequest, NextResponse } from 'next/server';

// Simple in-memory rate limiter (per-IP, resets on cold start — acceptable for Vercel)
const rateMap = new Map<string, { count: number; resetAt: number }>();
const RATE_WINDOW_MS = 60_000; // 1 minute
const RATE_MAX = 30; // max requests per window

function checkRate(ip: string): boolean {
  const now = Date.now();
  const entry = rateMap.get(ip);
  if (!entry || now > entry.resetAt) {
    rateMap.set(ip, { count: 1, resetAt: now + RATE_WINDOW_MS });
    return true;
  }
  entry.count++;
  return entry.count <= RATE_MAX;
}

export function middleware(request: NextRequest) {
  const url = new URL(request.url);
  const pathname = url.pathname;

  // Rate limit API routes (except verify — public, read-only)
  if (pathname.startsWith('/api/') && !pathname.startsWith('/api/verify')) {
    const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || '127.0.0.1';
    if (!checkRate(ip)) {
      return NextResponse.json({ error: 'Too many requests' }, { status: 429 });
    }
  }

  // Protect admin dashboard — check Supabase auth cookie
  if (pathname.startsWith('/admin-dashboard')) {
    const accessToken = request.cookies.get('sb-access-token')?.value;
    if (!accessToken) {
      return NextResponse.redirect(new URL('/admin-login', request.url));
    }
  }

  // Protect admin API routes (except public POST)
  if (pathname.startsWith('/api/registrations') || pathname.startsWith('/api/sponsorships')) {
    const method = request.method;
    if (pathname === '/api/registrations' && method === 'POST') {
      // Public — registration form
    } else if (pathname === '/api/sponsorships' && method === 'POST') {
      // Public — sponsorship form
    } else {
      const accessToken = request.cookies.get('sb-access-token')?.value;
      if (!accessToken) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/admin-dashboard/:path*',
    '/api/:path*',
  ],
};
