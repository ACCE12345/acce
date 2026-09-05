import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServer } from '@/lib/supabase/server';

function generateRegId(): string {
  const ts = Date.now().toString(36).toUpperCase();
  const arr = new Uint8Array(6);
  crypto.getRandomValues(arr);
  const rand = Array.from(arr, (b) => b.toString(36).padStart(2, '0')).join('').toUpperCase().slice(0, 8);
  return `ACCI-WGL-${ts}-${rand}`;
}

const REG_COLUMNS = 'id, reg_id, primary_name, primary_mobile, primary_email, category, city, state, country, pin, is_acce_member, accompanying_count, total_members, checked_in, checked_in_at, created_at';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const primaryName = (body.primaryName as string || '').trim();
    const primaryMobile = (body.primaryMobile as string || '').trim();
    const primaryEmail = (body.primaryEmail as string || '').trim();
    const category = (body.category as string || '').trim();
    const city = (body.city as string || '').trim();
    const state = (body.state as string || '').trim();
    const country = (body.country as string || 'India').trim();
    const pin = (body.pin as string || '').trim();
    const isACCEMember = body.isACCEMember === true;
    const accompanyingMembers = Array.isArray(body.accompanyingMembers) ? body.accompanyingMembers : [];

    // Validation
    if (!primaryName || primaryName.length > 100) {
      return NextResponse.json({ error: 'Invalid primary name' }, { status: 400 });
    }
    if (!/^[6-9]\d{9}$/.test(primaryMobile)) {
      return NextResponse.json({ error: 'Invalid mobile number' }, { status: 400 });
    }
    if (primaryEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(primaryEmail)) {
      return NextResponse.json({ error: 'Invalid email' }, { status: 400 });
    }
    if (!category) {
      return NextResponse.json({ error: 'Category is required' }, { status: 400 });
    }
    if (!state) {
      return NextResponse.json({ error: 'State is required' }, { status: 400 });
    }

    // Validate accompanying members
    if (accompanyingMembers.length > 5) {
      return NextResponse.json({ error: 'Maximum 5 accompanying members allowed' }, { status: 400 });
    }
    for (const m of accompanyingMembers) {
      if (!m.name || m.name.trim().length === 0) {
        return NextResponse.json({ error: 'All member names are required' }, { status: 400 });
      }
      if (m.name.length > 100) {
        return NextResponse.json({ error: 'Member name too long' }, { status: 400 });
      }
      if (m.mobile && !/^[6-9]\d{9}$/.test(m.mobile)) {
        return NextResponse.json({ error: 'Invalid mobile number for accompanying member' }, { status: 400 });
      }
    }

    const supabase = getSupabaseServer();
    const regId = generateRegId();
    const totalMembers = 1 + accompanyingMembers.length;

    // Insert registration (will fail if mobile already exists due to unique constraint)
    const { data: regData, error: regError } = await supabase
      .from('registrations')
      .insert({
        reg_id: regId,
        primary_name: primaryName,
        primary_mobile: primaryMobile,
        primary_email: primaryEmail,
        category,
        city,
        state,
        country,
        pin,
        is_acce_member: isACCEMember,
        accompanying_count: accompanyingMembers.length,
        total_members: totalMembers,
      })
      .select('id')
      .single();

    if (regError) {
      if (regError.code === '23505' && regError.message.includes('primary_mobile')) {
        return NextResponse.json({
          error: 'This mobile number is already registered. Please use your existing Registration ID or contact the event team.'
        }, { status: 409 });
      }
      throw regError;
    }

    const registrationId = regData.id;

    // Insert members
    const membersToInsert = [
      {
        registration_id: registrationId,
        member_name: primaryName,
        member_mobile: primaryMobile,
        member_type: 'Primary',
      },
      ...accompanyingMembers.map((m: { name: string; mobile?: string }) => ({
        registration_id: registrationId,
        member_name: m.name.trim(),
        member_mobile: m.mobile?.trim() || null,
        member_type: 'Accompanying',
      })),
    ];

    const { error: membersError } = await supabase
      .from('registration_members')
      .insert(membersToInsert);

    if (membersError) throw membersError;

    return NextResponse.json({ regId, totalMembers }, { status: 201 });
  } catch (err) {
    console.error('Registration error:', err);
    return NextResponse.json({ error: 'Registration failed' }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    const supabase = getSupabaseServer();
    const { searchParams } = new URL(request.url);

    const search = searchParams.get('search') || '';
    const date = searchParams.get('date') || '';
    const checkedIn = searchParams.get('checkedIn') || '';
    const page = Math.max(parseInt(searchParams.get('page') || '1', 10), 1);
    const limit = Math.min(Math.max(parseInt(searchParams.get('limit') || '50', 10), 1), 200);
    const offset = (page - 1) * limit;

    let query = supabase
      .from('registrations')
      .select(REG_COLUMNS, { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (search) {
      query = query.or(`primary_name.ilike.%${search}%,reg_id.ilike.%${search}%,primary_mobile.ilike.%${search}%,primary_email.ilike.%${search}%`);
    }
    if (date) {
      const nextDay = new Date(`${date}T00:00:00Z`);
      nextDay.setDate(nextDay.getDate() + 1);
      query = query.gte('created_at', `${date}T00:00:00Z`).lt('created_at', nextDay.toISOString());
    }
    if (checkedIn === 'true') {
      query = query.eq('checked_in', true);
    } else if (checkedIn === 'false') {
      query = query.eq('checked_in', false);
    }

    const { data, error, count } = await query;
    if (error) throw error;

    // Query ALL matching registrations (without pagination) to compute accurate totals
    let totalsQuery = supabase
      .from('registrations')
      .select('total_members, accompanying_count', { count: 'exact' });

    if (search) {
      totalsQuery = totalsQuery.or(`primary_name.ilike.%${search}%,reg_id.ilike.%${search}%,primary_mobile.ilike.%${search}%,primary_email.ilike.%${search}%`);
    }
    if (date) {
      const nextDay = new Date(`${date}T00:00:00Z`);
      nextDay.setDate(nextDay.getDate() + 1);
      totalsQuery = totalsQuery.gte('created_at', `${date}T00:00:00Z`).lt('created_at', nextDay.toISOString());
    }
    if (checkedIn === 'true') {
      totalsQuery = totalsQuery.eq('checked_in', true);
    } else if (checkedIn === 'false') {
      totalsQuery = totalsQuery.eq('checked_in', false);
    }

    const { data: totalsData } = await totalsQuery;
    const totalPeople = (totalsData || []).reduce((sum: number, r: Record<string, unknown>) => sum + ((r.total_members as number) || 1), 0);
    const totalAccompanying = (totalsData || []).reduce((sum: number, r: Record<string, unknown>) => sum + ((r.accompanying_count as number) || 0), 0);

    return NextResponse.json({ registrations: data, total: count, totalPeople, totalAccompanying }, {
      status: 200,
      headers: { 'Cache-Control': 'private, no-cache, no-store, must-revalidate' },
    });
  } catch (err) {
    console.error('List registrations error:', err);
    return NextResponse.json({ error: 'Failed to fetch registrations' }, { status: 500 });
  }
}