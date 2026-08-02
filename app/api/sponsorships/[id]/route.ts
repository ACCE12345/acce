import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServer } from '@/lib/supabase/server';

export async function DELETE(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const supabase = getSupabaseServer();
    const { error } = await supabase
      .from('sponsorships')
      .delete()
      .eq('sponsor_id', id);

    if (error) throw error;
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('Delete sponsorship error:', err);
    return NextResponse.json({ error: 'Delete failed' }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await request.json();
    const supabase = getSupabaseServer();

    const updates: Record<string, unknown> = {};
    if (body.paymentStatus !== undefined) updates.payment_status = body.paymentStatus;

    const { error } = await supabase
      .from('sponsorships')
      .update(updates)
      .eq('sponsor_id', id);

    if (error) throw error;
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('Update sponsorship error:', err);
    return NextResponse.json({ error: 'Update failed' }, { status: 500 });
  }
}
