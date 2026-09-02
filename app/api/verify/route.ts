import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServer } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const regId = searchParams.get('regId');

    if (!regId) {
      return NextResponse.json({ error: 'regId is required' }, { status: 400 });
    }

    const supabase = getSupabaseServer();
    const { data, error } = await supabase
      .from('registrations')
      .select('reg_id, primary_name, primary_mobile, category, total_members, checked_in, checked_in_at, is_acce_member')
      .eq('reg_id', regId)
      .single();

    if (error || !data) {
      return NextResponse.json({ valid: false }, { status: 404 });
    }

    return NextResponse.json({ valid: true, registration: data }, {
      status: 200,
      headers: { 'Cache-Control': 'public, s-maxage=10, stale-while-revalidate=30' },
    });
  } catch (err) {
    console.error('Verify error:', err);
    return NextResponse.json({ error: 'Verification failed' }, { status: 500 });
  }
}