import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServer } from '@/lib/supabase/server';

function generateRegId(): string {
  const ts = Date.now().toString(36).toUpperCase();
  const arr = new Uint8Array(6);
  crypto.getRandomValues(arr);
  const rand = Array.from(arr, (b) => b.toString(36).padStart(2, '0')).join('').toUpperCase().slice(0, 8);
  return `REG-${ts}-${rand}`;
}

const MAX_PHOTO_BYTES = 2 * 1024 * 1024;
const MAX_SCREENSHOT_BYTES = 5 * 1024 * 1024;
const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

async function uploadFile(supabase: ReturnType<typeof getSupabaseServer>, bucket: string, folder: string, file: File): Promise<string> {
  const ext = file.type.split('/')[1] || 'jpg';
  const path = `${folder}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
  const buffer = Buffer.from(await file.arrayBuffer());
  const { error } = await supabase.storage.from(bucket).upload(path, buffer, {
    contentType: file.type,
    upsert: false,
  });
  if (error) throw new Error(`Upload failed: ${error.message}`);
  const { data } = supabase.storage.from(bucket).getPublicUrl(path);
  return data.publicUrl;
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();

    const fullName = (formData.get('fullName') as string || '').trim();
    const mobile = (formData.get('mobile') as string || '').trim();
    const email = (formData.get('email') as string || '').trim();
    const city = (formData.get('city') as string || '').trim();
    const state = (formData.get('state') as string || '').trim();
    const country = (formData.get('country') as string || 'India').trim();
    const pin = (formData.get('pin') as string || '').trim();
    const isACCEMember = formData.get('isACCEMember') === 'true';
    const paymentAmount = parseInt(formData.get('paymentAmount') as string || '0', 10);

    if (!fullName || fullName.length > 100) return NextResponse.json({ error: 'Invalid full name' }, { status: 400 });
    if (!/^[6-9]\d{9}$/.test(mobile)) return NextResponse.json({ error: 'Invalid mobile number' }, { status: 400 });
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return NextResponse.json({ error: 'Invalid email' }, { status: 400 });

    const supabase = getSupabaseServer();

    const photoFile = formData.get('photo') as File | null;
    let photoUrl: string | null = null;
    if (photoFile && photoFile.size > 0) {
      if (!ALLOWED_IMAGE_TYPES.includes(photoFile.type)) return NextResponse.json({ error: 'Photo must be JPG/PNG/WEBP' }, { status: 400 });
      if (photoFile.size > MAX_PHOTO_BYTES) return NextResponse.json({ error: 'Photo must be under 2MB' }, { status: 400 });
      photoUrl = await uploadFile(supabase, 'avatars', 'photos', photoFile);
    }

    const screenshotFile = formData.get('paymentScreenshot') as File | null;
    let screenshotUrl: string | null = null;
    if (screenshotFile && screenshotFile.size > 0) {
      if (!ALLOWED_IMAGE_TYPES.includes(screenshotFile.type)) return NextResponse.json({ error: 'Screenshot must be JPG/PNG/WEBP' }, { status: 400 });
      if (screenshotFile.size > MAX_SCREENSHOT_BYTES) return NextResponse.json({ error: 'Screenshot must be under 5MB' }, { status: 400 });
      screenshotUrl = await uploadFile(supabase, 'payments', 'screenshots', screenshotFile);
    }

    const regId = generateRegId();

    const { error } = await supabase.from('registrations').insert({
      reg_id: regId,
      full_name: fullName,
      photo_url: photoUrl,
      mobile,
      email,
      city,
      state,
      country,
      pin,
      is_acce_member: isACCEMember,
      payment_amount: paymentAmount,
      payment_screenshot_url: screenshotUrl,
      payment_status: 'pending',
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
    const paymentStatus = searchParams.get('paymentStatus') || '';
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
    if (paymentStatus) {
      query = query.eq('payment_status', paymentStatus);
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
