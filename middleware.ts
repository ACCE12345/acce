import { NextRequest, NextResponse } from 'next/server';

// Sliding window rate limiter
// Uses header-based tracking for serverless compatibility
// In production, use Upstash Redis or Supabase for distributed rate limiting
const RATE_WINDOW_MS = 60_000; // 1 minute
const RATE_MAX = 60; // max requests per window per IP
const RATE_MAX_POST = 10; // stricter limit for write operations

// In-memory store — works per cold instance on Vercel
// For true distributed limiting, integrate Upstash Redis
const rateStore = new Map<string, { count: number; resetAt: number }>();

// Cleanup stale entries every 5 minutes
let lastCleanup = Date.now();
function cleanupStaleEntries() {
  const now = Date.now();
  if (now - lastCleanup < 300_000) return;
  lastCleanup = now;
  for (const [key, entry] of rateStore) {
    if (now > entry.resetAt) rateStore.delete(key);
  }
  // Hard limit: if store grows too large, clear oldest half
  if (rateStore.size > 10000) {
    const entries = Array.from(rateStore.entries()).sort((a, b) => a[1].resetAt - b[1].resetAt);
    const toDelete = entries.slice(0, Math.floor(entries.length / 2));
    for (const [key] of toDelete) rateStore.delete(key);
  }
}

function checkRate(ip: string, isWrite: boolean): { allowed: boolean; remaining: number; resetAt: number } {
  cleanupStaleEntries();

  const now = Date.now();
  const max = isWrite ? RATE_MAX_POST : RATE_MAX;
  const key = `${ip}:${isWrite ? 'w' : 'r'}`;
  const entry = rateStore.get(key);

  if (!entry || now > entry.resetAt) {
    const resetAt = now + RATE_WINDOW_MS;
    rateStore.set(key, { count: 1, resetAt });
    return { allowed: true, remaining: max - 1, resetAt };
  }

  entry.count++;
  const remaining = Math.max(0, max - entry.count);
  return { allowed: entry.count <= max, remaining, resetAt: entry.resetAt };
}

export function middleware(request: NextRequest) {
  const url = new URL(request.url);
  const pathname = url.pathname;

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

  // Protect gallery admin routes (GET is public)
  if (pathname.startsWith('/api/gallery') && request.method !== 'GET') {
    const accessToken = request.cookies.get('sb-access-token')?.value;
    if (!accessToken) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
  }

  // Rate limit API routes (except verify — public, read-only, low cost)
  if (pathname.startsWith('/api/') && !pathname.startsWith('/api/verify')) {
    const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
      || request.headers.get('x-real-ip')
      || '127.0.0.1';
    const isWrite = request.method !== 'GET';
    const { allowed, remaining, resetAt } = checkRate(ip, isWrite);

    if (!allowed) {
      const retryAfter = Math.ceil((resetAt - Date.now()) / 1000);
      return NextResponse.json(
        { error: 'Too many requests. Please slow down.' },
        {
          status: 429,
          headers: {
            'Retry-After': String(retryAfter),
            'X-RateLimit-Remaining': '0',
            'X-RateLimit-Reset': String(Math.ceil(resetAt / 1000)),
          },
        }
      );
    }

    const response = NextResponse.next();
    response.headers.set('X-RateLimit-Remaining', String(remaining));
    response.headers.set('X-RateLimit-Reset', String(Math.ceil(resetAt / 1000)));
    return response;
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/admin-dashboard/:path*',
    '/api/:path*',
  ],
};
