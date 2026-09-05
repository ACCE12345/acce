import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServer } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
  try {
    const supabase = getSupabaseServer();
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search') || '';
    const date = searchParams.get('date') || '';

    let query = supabase
      .from('registrations')
      .select('id, reg_id, primary_name, primary_mobile, primary_email, category, city, state, country, is_acce_member, checked_in, created_at')
      .order('created_at', { ascending: false })
      .range(0, 4999);

    if (search) {
      query = query.or(`primary_name.ilike.%${search}%,reg_id.ilike.%${search}%,primary_mobile.ilike.%${search}%,primary_email.ilike.%${search}%`);
    }
    if (date) {
      const nextDay = new Date(`${date}T00:00:00Z`);
      nextDay.setDate(nextDay.getDate() + 1);
      query = query.gte('created_at', `${date}T00:00:00Z`).lt('created_at', nextDay.toISOString());
    }

    const { data: registrations, error } = await query;
    if (error) throw error;

    const rows: Record<string, unknown>[] = [];

    for (const reg of registrations || []) {
      const { data: members } = await supabase
        .from('registration_members')
        .select('member_name, member_mobile, member_type')
        .eq('registration_id', reg.id)
        .order('created_at', { ascending: true });

      const memberList = members || [];
      if (memberList.length === 0) {
        rows.push({
          regId: reg.reg_id,
          memberName: reg.primary_name,
          memberMobile: reg.primary_mobile,
          memberType: 'Primary',
          email: reg.primary_email,
          category: reg.category,
          city: reg.city,
          state: reg.state,
          isACCEMember: reg.is_acce_member,
          checkedIn: reg.checked_in,
          createdAt: reg.created_at,
        });
      } else {
        for (const m of memberList) {
          rows.push({
            regId: reg.reg_id,
            memberName: m.member_name,
            memberMobile: m.member_mobile || '',
            memberType: m.member_type,
            email: reg.primary_email,
            category: reg.category,
            city: reg.city,
            state: reg.state,
            isACCEMember: reg.is_acce_member,
            checkedIn: reg.checked_in,
            createdAt: reg.created_at,
          });
        }
      }
    }

    return NextResponse.json({ rows, total: rows.length }, {
      status: 200,
      headers: { 'Cache-Control': 'private, no-cache, no-store, must-revalidate' },
    });
  } catch (err) {
    console.error('Export error:', err);
    return NextResponse.json({ error: 'Export failed' }, { status: 500 });
  }
}
