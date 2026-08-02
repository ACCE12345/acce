import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServer } from '@/lib/supabase/server';

export async function POST(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const supabase = getSupabaseServer();
    const { error } = await supabase
      .from('registrations')
      .update({ payment_status: 'rejected' })
      .eq('reg_id', id);

    if (error) throw error;
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('Reject payment error:', err);
    return NextResponse.json({ error: 'Failed' }, { status: 500 });
  }
}
