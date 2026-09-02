import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServer } from '@/lib/supabase/server';

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = getSupabaseServer();

    const { data: item } = await supabase
      .from('gallery')
      .select('storage_path')
      .eq('id', id)
      .single();

    if (item?.storage_path) {
      await supabase.storage.from('gallery').remove([item.storage_path]).catch(() => {});
    }

    const { error } = await supabase.from('gallery').delete().eq('id', id);
    if (error) throw error;

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('Gallery delete error:', err);
    return NextResponse.json({ error: 'Delete failed' }, { status: 500 });
  }
}
