import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServer } from '@/lib/supabase/server';

export async function POST(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const supabase = getSupabaseServer();
    const { error } = await supabase
      .from('registrations')
      .update({ checked_in: true, checked_in_at: new Date().toISOString() })
      .eq('reg_id', id)
      .eq('checked_in', false);

    if (error) throw error;
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('Check-in error:', err);
    return NextResponse.json({ error: 'Check-in failed' }, { status: 500 });
  }
}
