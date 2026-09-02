import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServer } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
  try {
    // Get registration ID from URL path or query params
    // Support both: /api/registrations/{id} and /api/registrations?regId={id}
    const { searchParams } = new URL(request.url);
    let regId = searchParams.get('regId') || '';

    // If regId not in query params, try to extract from URL path
    // e.g., /api/registrations/ACCI-WGL-MTKLN1FZ-1N520Q68
    if (!regId) {
      const pathname = new URL(request.url).pathname;
      const parts = pathname.split('/').filter(p => p.length > 0);
      const potentialId = parts[parts.length - 1];
      // Validate it looks like a regId (starts with ACCI-WGL)
      if (potentialId && potentialId.startsWith('ACCI-WGL')) {
        regId = potentialId;
      }
    }

    const supabase = getSupabaseServer();
    const { data: registration, error } = await supabase
      .from('registrations')
      .select('id, reg_id, primary_name, primary_mobile, primary_email, category, city, state, country, pin, is_acce_member, accompanying_count, total_members, checked_in, checked_in_at, created_at')
      .eq('reg_id', regId)
      .single();

    if (error) {
      console.error('Registration fetch error:', error);
      if (error.code === 'PGRST116') {
        return NextResponse.json({ error: 'Registration not found' }, { status: 404 });
      }
      throw error;
    }

    const { data: members } = await supabase
      .from('registration_members')
      .select('member_name, member_mobile, member_type')
      .eq('registration_id', registration.id)
      .order('created_at', { ascending: true });

    return NextResponse.json({ ...registration, members: members || [] });
  } catch (err) {
    console.error('Get registration error:', err);
    const errorMessage = err instanceof Error ? err.message : 'Failed to fetch registration';
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const { id, regId, mobile, name, email, category, city, state, country, pin, isACCEMember, accompanyingCount, totalMembers, checkedIn, checkedInAt, createdAt } = await request.json();
    
    const supabase = getSupabaseServer();
    
    const updates: Record<string, unknown> = {};
    if (name !== undefined) {
      if (!name || name.trim().length > 100) {
        return NextResponse.json({ error: 'Invalid primary name' }, { status: 400 });
      }
      updates.primary_name = name.trim();
    }
    if (mobile !== undefined) {
      if (!/^[6-9]\d{9}$/.test(mobile)) {
        return NextResponse.json({ error: 'Invalid mobile number' }, { status: 400 });
      }
      updates.primary_mobile = mobile.trim();
    }
    if (email !== undefined) {
      if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        return NextResponse.json({ error: 'Invalid email' }, { status: 400 });
      }
      updates.primary_email = email.trim();
    }
    if (checkedIn !== undefined) {
      updates.checked_in = checkedIn;
      if (checkedIn) updates.checked_in_at = new Date().toISOString();
    }
    
    const { error } = await supabase
      .from('registrations')
      .update(updates)
      .eq('reg_id', regId);
    
    if (error) {
      console.error('Update error:', error);
      throw error;
    }
    
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('Update registration error:', err);
    const errorMessage = err instanceof Error ? err.message : 'Update failed';
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}