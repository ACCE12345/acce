import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServer } from '@/lib/supabase/server';

// GET single registration by reg_id
export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const supabase = getSupabaseServer();
    const { data, error } = await supabase
      .from('registrations')
      .select('*')
      .eq('reg_id', id)
      .single();

    if (error || !data) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    return NextResponse.json(data);
  } catch (err) {
    console.error('Get registration error:', err);
    return NextResponse.json({ error: 'Failed' }, { status: 500 });
  }
}

// PATCH update registration
export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await request.json();
    const supabase = getSupabaseServer();

    const updates: Record<string, unknown> = {};
    if (body.fullName !== undefined) updates.full_name = body.fullName;
    if (body.mobile !== undefined) updates.mobile = body.mobile;
    if (body.email !== undefined) updates.email = body.email;
    if (body.qualification !== undefined) updates.qualification = body.qualification;
    if (body.orgName !== undefined) updates.org_name = body.orgName;
    if (body.paymentStatus !== undefined) updates.payment_status = body.paymentStatus;
    if (body.checkedIn !== undefined) {
      updates.checked_in = body.checkedIn;
      if (body.checkedIn) updates.checked_in_at = new Date().toISOString();
    }

    const { error } = await supabase
      .from('registrations')
      .update(updates)
      .eq('reg_id', id);

    if (error) throw error;
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('Update registration error:', err);
    return NextResponse.json({ error: 'Update failed' }, { status: 500 });
  }
}

// DELETE registration
export async function DELETE(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const supabase = getSupabaseServer();
    const { error } = await supabase
      .from('registrations')
      .delete()
      .eq('reg_id', id);

    if (error) throw error;
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('Delete registration error:', err);
    return NextResponse.json({ error: 'Delete failed' }, { status: 500 });
  }
}
