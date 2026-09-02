import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServer } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const mobile = searchParams.get('mobile') || '';

    if (!/^[6-9]\d{9}$/.test(mobile)) {
      return NextResponse.json({ error: 'Invalid mobile number' }, { status: 400 });
    }

    const supabase = getSupabaseServer();
    const { data: reg, error } = await supabase
      .from('registrations')
      .select('id, reg_id, primary_name, primary_mobile, primary_email, category, city, state, country, pin, is_acce_member, accompanying_count, total_members, checked_in, checked_in_at, created_at')
      .eq('primary_mobile', mobile)
      .order('created_at', { ascending: false })
      .limit(1);

    if (error) throw error;

    if (!reg || reg.length === 0) {
      return NextResponse.json({ error: 'No registration found' }, { status: 404 });
    }

    const registration = reg[0];

    const { data: members } = await supabase
      .from('registration_members')
      .select('member_name, member_mobile, member_type')
      .eq('registration_id', registration.id)
      .order('created_at', { ascending: true });

    return NextResponse.json({ ...registration, members: members || [] });
  } catch {
    return NextResponse.json({ error: 'Lookup failed' }, { status: 500 });
  }
}