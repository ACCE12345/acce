import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServer } from '@/lib/supabase/server';

export async function GET() {
  try {
    const supabase = getSupabaseServer();
    const { data, error } = await supabase
      .from('gallery')
      .select('*')
      .order('sort_order', { ascending: true })
      .order('created_at', { ascending: false });

    if (error) throw error;
    return NextResponse.json({ images: data || [] });
  } catch (err) {
    console.error('Gallery GET error:', err);
    return NextResponse.json({ images: [] });
  }
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    const title = (formData.get('title') as string || '').trim();
    const caption = (formData.get('caption') as string || '').trim();

    if (!file || file.size === 0) {
      return NextResponse.json({ error: 'No image file provided' }, { status: 400 });
    }
    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json({ error: 'File must be under 5MB' }, { status: 400 });
    }

    const ext = file.name.split('.').pop() || 'jpg';
    const filename = `gallery/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;

    const supabase = getSupabaseServer();

    const { error: uploadError } = await supabase.storage
      .from('gallery')
      .upload(filename, file, {
        contentType: file.type,
        upsert: false,
      });

    if (uploadError) throw uploadError;

    const { data: urlData } = supabase.storage.from('gallery').getPublicUrl(filename);

    const { error: dbError } = await supabase.from('gallery').insert({
      title: title || null,
      caption: caption || null,
      image_url: urlData.publicUrl,
      storage_path: filename,
      sort_order: 0,
    });

    if (dbError) throw dbError;

    return NextResponse.json({ ok: true, url: urlData.publicUrl });
  } catch (err) {
    console.error('Gallery upload error:', err);
    return NextResponse.json({ error: 'Upload failed' }, { status: 500 });
  }
}
