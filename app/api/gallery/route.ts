import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServer } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category') || '';
    const limit = searchParams.get('limit') || '100';

    const supabase = getSupabaseServer();
    let query = supabase.from('gallery').select('*').order('sort_order', { ascending: true }).order('created_at', { ascending: false }).limit(parseInt(limit, 10));
    if (category) {
      query = query.eq('category', category);
    }
    const { data, error } = await query;
    if (error) {
      console.error('Gallery fetch error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    return NextResponse.json({ images: data || [] });
  } catch (err) {
    console.error('Gallery GET error:', err);
    return NextResponse.json({ error: 'Failed to fetch gallery' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    const title = (formData.get('title') as string || '').trim();
    const caption = (formData.get('caption') as string || '').trim();
    const category = (formData.get('category') as string || 'events').trim();

    // File existence check
    if (!file || file.size === 0) {
      return NextResponse.json({ error: 'No image file provided' }, { status: 400 });
    }
    
    // File size validation (5MB limit)
    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json({ error: 'File must be under 5MB' }, { status: 400 });
    }
    
    // MIME type validation
    const allowedMimeTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    if (!allowedMimeTypes.includes(file.type)) {
      return NextResponse.json({ error: 'Only JPEG, PNG, GIF, and WebP images are allowed' }, { status: 400 });
    }
    
    // File extension validation
    const originalName = file.name;
    const fileExtension = originalName.substring(originalName.lastIndexOf('.') + 1).toLowerCase();
    const allowedExtensions = ['jpg', 'jpeg', 'png', 'gif', 'webp'];
    
    if (!allowedExtensions.includes(fileExtension)) {
      return NextResponse.json({ 
        error: 'Invalid file extension. Allowed: ' + allowedExtensions.join(', ') 
      }, { status: 400 });
    }
    
    const supabase = getSupabaseServer();
    
    // Generate secure, unique filename
    const timestamp = Date.now();
    const randomBytes = new Uint8Array(16);
    crypto.getRandomValues(randomBytes);
    const randomString = Array.from(randomBytes, byte => 
      byte.toString(16).padStart(2, '0')
    ).join('').substring(0, 32);
    const secureFilename = `gallery/${timestamp}-${randomString}.${fileExtension}`;
    
    // Upload to Supabase storage
    const { error: uploadError } = await supabase.storage
      .from('gallery')
      .upload(secureFilename, file, {
        contentType: file.type,
        cacheControl: '3600',
        upsert: false,
      });
    
    if (uploadError) {
      console.error('Storage upload error:', uploadError);
      return NextResponse.json({ 
        error: `Storage error: ${uploadError.message}. Please check Supabase storage configuration.` 
      }, { status: 500 });
    }
    
    // Get public URL
    const { data: urlData } = supabase.storage.from('gallery').getPublicUrl(secureFilename);
    
    // Save metadata to database
    const { error: dbError } = await supabase.from('gallery').insert({
      title: title || null,
      caption: caption || null,
      image_url: urlData.publicUrl,
      storage_path: secureFilename,
      category: category || 'events',
      sort_order: 0,
    });
    
    if (dbError) {
      console.error('Gallery DB insert error:', dbError);
      // Attempt to clean up uploaded file if DB insertion fails
      await supabase.storage.from('gallery').remove([secureFilename]);
      
      return NextResponse.json({ 
        error: `Database error: ${dbError.message}. Please check gallery table configuration.` 
      }, { status: 500 });
    }
    
    return NextResponse.json({ ok: true, url: urlData.publicUrl });
  } catch (err) {
    console.error('Gallery upload error:', err);
    const errorMessage = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ 
      error: `Upload failed: ${errorMessage}`
    }, { status: 500 });
  }
}
