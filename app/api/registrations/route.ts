import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServer } from '@/lib/supabase/server';

function generateRegId(): string {
  const ts = Date.now().toString(36).toUpperCase();
  const arr = new Uint8Array(6);
  crypto.getRandomValues(arr);
  const rand = Array.from(arr, (b) => b.toString(36).padStart(2, '0')).join('').toUpperCase().slice(0, 8);
  return `REG-${ts}-${rand}`;
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();

    const fullName = (formData.get('fullName') as string || '').trim();
    const mobile = (formData.get('mobile') as string || '').trim();
    const email = (formData.get('email') as string || '').trim();
    const category = (formData.get('category') as string || '').trim();
    const city = (formData.get('city') as string || '').trim();
    const state = (formData.get('state') as string || '').trim();
    const country = (formData.get('country') as string || 'India').trim();
    const pin = (formData.get('pin') as string || '').trim();
    const isACCEMember = formData.get('isACCEMember') === 'true';

    if (!fullName || fullName.length > 100) return NextResponse.json({ error: 'Invalid full name' }, { status: 400 });
    if (!/^[6-9]\d{9}$/.test(mobile)) return NextResponse.json({ error: 'Invalid mobile number' }, { status: 400 });
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return NextResponse.json({ error: 'Invalid email' }, { status: 400 });

    const supabase = getSupabaseServer();

    const regId = generateRegId();

    const { error } = await supabase.from('registrations').insert({
      reg_id: regId,
      full_name: fullName,
      mobile,
      email,
      category,
      city,
      state,
      country,
      pin,
      is_acce_member: isACCEMember,
    });

    if (error) throw error;

    return NextResponse.json({ regId }, { status: 201 });
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
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = Math.min(parseInt(searchParams.get('limit') || '500', 10), 2000);
    const offset = (page - 1) * limit;

    let query = supabase
      .from('registrations')
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (search) {
      query = query.or(`full_name.ilike.%${search}%,reg_id.ilike.%${search}%,mobile.ilike.%${search}%,email.ilike.%${search}%`);
    }
    if (date) {
      query = query.gte('created_at', `${date}T00:00:00Z`).lt('created_at', `${date}T23:59:59Z`);
    }

    const { data, error, count } = await query;
    if (error) throw error;

    return NextResponse.json({ registrations: data, total: count });
  } catch (err) {
    console.error('List registrations error:', err);
    return NextResponse.json({ error: 'Failed to fetch registrations' }, { status: 500 });
  }
}
