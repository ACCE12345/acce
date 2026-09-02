import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServer } from '@/lib/supabase/server';

export async function POST(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const supabase = getSupabaseServer();
    
    const { data, error } = await supabase
      .from('registrations')
      .update({ checked_in: true, checked_in_at: new Date().toISOString() })
      .eq('reg_id', id)
      .eq('checked_in', false)
      .select('id');

    if (error) {
      console.error('Check-in update error:', error);
      throw error;
    }
    
    if (!data || data.length === 0) {
      return NextResponse.json({ error: 'Registration not found or already checked in' }, { status: 404 });
    }
    
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('Check-in error:', err);
    const errorMessage = err instanceof Error ? err.message : 'Check-in failed';
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
