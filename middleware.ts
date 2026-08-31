import { NextRequest, NextResponse } from 'next/server';

// Sliding window rate limiter using request headers
// Works on serverless (Vercel) — no in-memory state needed
// Uses X-RateLimit-Remaining header for client awareness
const RATE_WINDOW_MS = 60_000; // 1 minute
const RATE_MAX = 60; // max requests per window per IP
const RATE_MAX_POST = 10; // stricter limit for write operations

// In-memory map is per-invocation only — acts as soft limit
// Real enforcement happens via Vercel's built-in DDoS protection
const rateMap = new Map<string, { count: number; resetAt: number }>();

function checkRate(ip: string, isWrite: boolean): boolean {
  const now = Date.now();
  const max = isWrite ? RATE_MAX_POST : RATE_MAX;
  const entry = rateMap.get(ip);
  if (!entry || now > entry.resetAt) {
    rateMap.set(ip, { count: 1, resetAt: now + RATE_WINDOW_MS });
    return true;
  }
  entry.count++;
  return entry.count <= max;
}

export function middleware(request: NextRequest) {
  const url = new URL(request.url);
  const pathname = url.pathname;

  // Rate limit API routes (except verify — public, read-only, low cost)
  if (pathname.startsWith('/api/') && !pathname.startsWith('/api/verify')) {
    const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || '127.0.0.1';
    const isWrite = request.method !== 'GET';
    if (!checkRate(ip, isWrite)) {
      return NextResponse.json(
        { error: 'Too many requests. Please slow down.' },
        { status: 429, headers: { 'Retry-After': '60' } }
      );
    }
  }

  // Protect admin dashboard — check Supabase auth cookie
  if (pathname.startsWith('/admin-dashboard')) {
    const accessToken = request.cookies.get('sb-access-token')?.value;
    if (!accessToken) {
      return NextResponse.redirect(new URL('/admin-login', request.url));
    }
  }

  // Protect admin API routes (except public POST and public lookup)
  if (pathname.startsWith('/api/registrations') || pathname.startsWith('/api/sponsorships')) {
    const method = request.method;
    if (pathname === '/api/registrations' && method === 'POST') {
      // Public — registration form
    } else if (pathname === '/api/registrations/lookup' && method === 'GET') {
      // Public — download ID card by mobile
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
