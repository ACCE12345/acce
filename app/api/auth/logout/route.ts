import { NextResponse } from 'next/server';
import { getSupabaseServer } from '@/lib/supabase/server';

export async function POST() {
  try {
    const supabase = getSupabaseServer();
    await supabase.auth.signOut();
  } catch {
    // Continue with cookie clearing even if signOut fails
  }

  const response = NextResponse.json({ ok: true });

  response.cookies.set('sb-access-token', '', {
    httpOnly: true,
    secure: true,
    sameSite: 'lax',
    maxAge: 0,
    path: '/',
  });
  response.cookies.set('sb-refresh-token', '', {
    httpOnly: true,
    secure: true,
    sameSite: 'lax',
    maxAge: 0,
    path: '/',
  });

  return response;
}
