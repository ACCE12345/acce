import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServer } from '@/lib/supabase/server';

function generateSponsorId(): string {
  const ts = Date.now().toString(36).toUpperCase();
  const arr = new Uint8Array(6);
  crypto.getRandomValues(arr);
  const rand = Array.from(arr, (b) => b.toString(36).padStart(2, '0')).join('').toUpperCase().slice(0, 8);
  return `SPO-${ts}-${rand}`;
}

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

    const companyName = (formData.get('companyName') as string || '').trim();
    const contactPerson = (formData.get('contactPerson') as string || '').trim();
    const phone = (formData.get('phone') as string || '').trim();
    const email = (formData.get('email') as string || '').trim();
    const website = (formData.get('website') as string || '').trim();
    const address = (formData.get('address') as string || '').trim();
    const gst = (formData.get('gst') as string || '').trim();
    const requirements = (formData.get('requirements') as string || '').trim();

    if (!companyName) return NextResponse.json({ error: 'Company name is required' }, { status: 400 });
    if (!contactPerson) return NextResponse.json({ error: 'Contact person is required' }, { status: 400 });
    if (!/^[6-9]\d{9}$/.test(phone)) return NextResponse.json({ error: 'Invalid mobile number' }, { status: 400 });
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return NextResponse.json({ error: 'Invalid email' }, { status: 400 });
    if (!address) return NextResponse.json({ error: 'Address is required' }, { status: 400 });

    const supabase = getSupabaseServer();

    const logoFile = formData.get('logo') as File | null;
    let logoUrl: string | null = null;
    if (logoFile && logoFile.size > 0) {
      const allowed = ['image/jpeg', 'image/png', 'image/webp'];
      if (!allowed.includes(logoFile.type)) return NextResponse.json({ error: 'Logo must be JPG/PNG/WEBP' }, { status: 400 });
      if (logoFile.size > 2 * 1024 * 1024) return NextResponse.json({ error: 'Logo must be under 2MB' }, { status: 400 });
      logoUrl = await uploadFile(supabase, 'logos', 'company-logos', logoFile);
    }

    const sponsorId = generateSponsorId();

    const { error } = await supabase.from('sponsorships').insert({
      sponsor_id: sponsorId,
      company_name: companyName,
      contact_person: contactPerson,
      phone,
      email,
      website,
      address,
      logo_url: logoUrl,
      gst,
      requirements,
      payment_status: 'pending',
    });

    if (error) throw error;

    return NextResponse.json({ sponsorId }, { status: 201 });
  } catch (err) {
    console.error('Sponsorship error:', err);
    return NextResponse.json({ error: 'Sponsorship submission failed' }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    const supabase = getSupabaseServer();
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search') || '';
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = Math.min(parseInt(searchParams.get('limit') || '100', 10), 500);
    const offset = (page - 1) * limit;

    let query = supabase
      .from('sponsorships')
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (search) {
      query = query.or(`company_name.ilike.%${search}%,sponsor_id.ilike.%${search}%,contact_person.ilike.%${search}%`);
    }

    const { data, error, count } = await query;
    if (error) throw error;

    return NextResponse.json({ sponsorships: data, total: count }, {
      status: 200,
      headers: {
        'Cache-Control': 'private, no-cache, no-store, must-revalidate',
      },
    });
  } catch (err) {
    console.error('List sponsorships error:', err);
    return NextResponse.json({ error: 'Failed' }, { status: 500 });
  }
}
