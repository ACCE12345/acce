'use client';

export interface Registration {
  regId: string;
  fullName: string;
  photo: string;
  mobile: string;
  email: string;
  category: string;
  city: string;
  state: string;
  country: string;
  pin: string;
  isACCEMember: boolean;
  checkedIn: boolean;
  checkedInAt: string | null;
  createdAt: string;
}

export interface Sponsorship {
  sponsorId: string;
  companyName: string;
  contactPerson: string;
  phone: string;
  email: string;
  website: string;
  address: string;
  logo: string;
  gst: string;
  requirements: string;
  createdAt: string;
}

export async function captureElementAsImage(el: HTMLElement, filename = 'id-card.png'): Promise<void> {
  const { default: html2canvas } = await import('html2canvas');
  const canvas = await html2canvas(el, { useCORS: true, scale: 2, backgroundColor: '#ffffff' } as Record<string, unknown>);
  const url = canvas.toDataURL('image/png');
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();
}

// ── API helpers ──────────────────────────────────────

function regApiToUI(r: Record<string, unknown>): Registration {
  return {
    regId: r.reg_id as string,
    fullName: r.full_name as string,
    photo: (r.photo_url as string) || '',
    mobile: r.mobile as string,
    email: r.email as string,
    category: (r.category as string) || '',
    city: (r.city as string) || '',
    state: (r.state as string) || '',
    country: (r.country as string) || 'India',
    pin: (r.pin as string) || '',
    isACCEMember: r.is_acce_member as boolean,
    checkedIn: r.checked_in as boolean,
    checkedInAt: (r.checked_in_at as string) || null,
    createdAt: r.created_at as string,
  };
}

function spnApiToUI(s: Record<string, unknown>): Sponsorship {
  return {
    sponsorId: s.sponsor_id as string,
    companyName: s.company_name as string,
    contactPerson: s.contact_person as string,
    phone: s.phone as string,
    email: s.email as string,
    website: (s.website as string) || '',
    address: (s.address as string) || '',
    logo: (s.logo_url as string) || '',
    gst: (s.gst as string) || '',
    requirements: (s.requirements as string) || '',
    createdAt: s.created_at as string,
  };
}

async function apiFetch<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, { ...init, cache: 'no-store' });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || `API error ${res.status}`);
  }
  return res.json();
}

// ── Registrations ────────────────────────────────────

export async function getRegistrations(params?: { search?: string; date?: string }): Promise<Registration[]> {
  const sp = new URLSearchParams();
  if (params?.search) sp.set('search', params.search);
  if (params?.date) sp.set('date', params.date);
  sp.set('limit', '2000');
  const data = await apiFetch<{ registrations: Record<string, unknown>[] }>(`/api/registrations?${sp}`);
  return data.registrations.map(regApiToUI);
}

export async function addRegistration(formData: FormData): Promise<{ regId: string }> {
  return apiFetch<{ regId: string }>('/api/registrations', {
    method: 'POST',
    body: formData,
  });
}

export async function findRegistration(regId: string): Promise<Registration | null> {
  try {
    const data = await apiFetch<Record<string, unknown>>(`/api/registrations/${regId}`);
    return regApiToUI(data);
  } catch {
    return null;
  }
}

export async function findRegistrationByMobile(mobile: string): Promise<Registration | null> {
  try {
    const data = await apiFetch<Record<string, unknown>>(`/api/registrations/lookup?mobile=${mobile}`);
    return regApiToUI(data);
  } catch {
    return null;
  }
}

export async function updateRegistration(regId: string, updates: Partial<Registration>): Promise<void> {
  const body: Record<string, unknown> = {};
  if (updates.fullName !== undefined) body.fullName = updates.fullName;
  if (updates.mobile !== undefined) body.mobile = updates.mobile;
  if (updates.email !== undefined) body.email = updates.email;
  if (updates.checkedIn !== undefined) body.checkedIn = updates.checkedIn;

  await apiFetch(`/api/registrations/${regId}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

export async function deleteRegistration(regId: string): Promise<void> {
  await apiFetch(`/api/registrations/${regId}`, { method: 'DELETE' });
}

export async function checkIn(regId: string): Promise<void> {
  await apiFetch(`/api/registrations/${regId}/check-in`, { method: 'POST' });
}

// ── Sponsorships ─────────────────────────────────────

export async function getSponsorships(params?: { search?: string }): Promise<Sponsorship[]> {
  const sp = new URLSearchParams();
  if (params?.search) sp.set('search', params.search);
  const data = await apiFetch<{ sponsorships: Record<string, unknown>[] }>(`/api/sponsorships?${sp}`);
  return data.sponsorships.map(spnApiToUI);
}

export async function addSponsorship(formData: FormData): Promise<{ sponsorId: string }> {
  return apiFetch<{ sponsorId: string }>('/api/sponsorships', {
    method: 'POST',
    body: formData,
  });
}

export async function deleteSponsorship(sponsorId: string): Promise<void> {
  await apiFetch(`/api/sponsorships/${sponsorId}`, { method: 'DELETE' });
}

// ── Auth ─────────────────────────────────────────────

export async function login(email: string, password: string): Promise<boolean> {
  try {
    await apiFetch<{ ok: boolean }>('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    return true;
  } catch {
    return false;
  }
}

export async function logout(): Promise<void> {
  await apiFetch('/api/auth/logout', { method: 'POST' });
}

// ── Badge verification ───────────────────────────────

export async function verifyBadge(regId: string): Promise<{ valid: boolean; registration?: Record<string, unknown> }> {
  return apiFetch(`/api/verify?regId=${encodeURIComponent(regId)}`);
}

// ── CSV Export ───────────────────────────────────────

function csvEscape(val: string | number | boolean | null | undefined): string {
  const str = String(val ?? '');
  if (str.includes(',') || str.includes('"') || str.includes('\n')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

export function toCSV<T extends Record<string, unknown>>(rows: T[], headers: string[]): string {
  const headerLine = headers.map(csvEscape).join(',');
  const lines = rows.map((row) => headers.map((h) => csvEscape(row[h] as string | number | boolean | null | undefined)).join(','));
  return [headerLine, ...lines].join('\n');
}

export function downloadCSV(filename: string, csvContent: string) {
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}
