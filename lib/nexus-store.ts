'use client';

export interface RegistrationMember {
  id: string;
  memberName: string;
  memberMobile: string | null;
  memberType: 'Primary' | 'Accompanying';
  createdAt: string;
}

export interface Registration {
  id: string;
  regId: string;
  primaryName: string;
  primaryMobile: string;
  primaryEmail: string;
  category: string;
  city: string;
  state: string;
  country: string;
  pin: string;
  isACCEMember: boolean;
  accompanyingCount: number;
  totalMembers: number;
  checkedIn: boolean;
  checkedInAt: string | null;
  createdAt: string;
  members?: RegistrationMember[];
}

export interface GalleryImage {
  id: string;
  title: string | null;
  caption: string | null;
  image_url: string;
  storage_path: string | null;
  category: string;
  sort_order: number;
  created_at: string;
}

export interface PaginatedResult<T> {
  items: T[];
  total: number;
  totalPeople: number;
  totalAccompanying: number;
  page: number;
  limit: number;
  totalPages: number;
}

export async function captureElementAsImage(el: HTMLElement, filename = 'id-card.png'): Promise<void> {
  const { default: html2canvas } = await import('html2canvas');
  const canvas = await html2canvas(el, { useCORS: true, scale: 3, backgroundColor: '#ffffff', logging: false, allowTaint: true } as Record<string, unknown>);
  const url = canvas.toDataURL('image/png');
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();
}

// ── API helpers ──────────────────────────────────────

function regApiToUI(r: Record<string, unknown>): Registration {
  return {
    id: r.id as string,
    regId: r.reg_id as string,
    primaryName: r.primary_name as string,
    primaryMobile: r.primary_mobile as string,
    primaryEmail: r.primary_email as string,
    category: (r.category as string) || '',
    city: (r.city as string) || '',
    state: (r.state as string) || '',
    country: (r.country as string) || 'India',
    pin: (r.pin as string) || '',
    isACCEMember: r.is_acce_member as boolean,
    accompanyingCount: r.accompanying_count as number,
    totalMembers: r.total_members as number,
    checkedIn: r.checked_in as boolean,
    checkedInAt: (r.checked_in_at as string) || null,
    createdAt: r.created_at as string,
    members: (r.members as Record<string, unknown>[] || []).map(m => ({
      id: m.id as string,
      memberName: m.member_name as string,
      memberMobile: (m.member_mobile as string) || null,
      memberType: m.member_type as 'Primary' | 'Accompanying',
      createdAt: m.created_at as string,
    })),
  };
}

async function apiFetch<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, {
    ...init,
    cache: 'no-store',
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || `API error ${res.status}`);
  }
  return res.json();
}

// ── Registrations ────────────────────────────────────

export async function getRegistrations(params?: {
  search?: string;
  date?: string;
  page?: number;
  limit?: number;
}): Promise<PaginatedResult<Registration>> {
  const sp = new URLSearchParams();
  if (params?.search) sp.set('search', params.search);
  if (params?.date) sp.set('date', params.date);
  sp.set('page', String(params?.page || 1));
  sp.set('limit', String(Math.min(params?.limit || 50, 200)));

  const data = await apiFetch<{
    registrations: Record<string, unknown>[];
    total: number;
    totalPeople?: number;
    totalAccompanying?: number;
  }>(`/api/registrations?${sp}`);

  const page = params?.page || 1;
  const limit = params?.limit || 50;

  return {
    items: data.registrations.map(regApiToUI),
    total: data.total || 0,
    totalPeople: data.totalPeople || 0,
    totalAccompanying: data.totalAccompanying || 0,
    page,
    limit,
    totalPages: Math.ceil((data.total || 0) / limit),
  };
}

export async function addRegistration(data: {
  primaryName: string;
  primaryMobile: string;
  primaryEmail: string;
  category: string;
  city: string;
  state: string;
  country: string;
  pin: string;
  isACCEMember: boolean;
  accompanyingMembers: { name: string; mobile?: string }[];
}): Promise<{ regId: string; totalMembers: number }> {
  return apiFetch<{ regId: string; totalMembers: number }>('/api/registrations', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
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
  if (updates.primaryName !== undefined) body.primaryName = updates.primaryName;
  if (updates.primaryMobile !== undefined) body.primaryMobile = updates.primaryMobile;
  if (updates.primaryEmail !== undefined) body.primaryEmail = updates.primaryEmail;
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

// ── Debounce utility ─────────────────────────────────

export function debounce<T extends (...args: never[]) => void>(fn: T, ms: number): T & { cancel: () => void } {
  let timer: ReturnType<typeof setTimeout> | null = null;
  const debounced = (...args: Parameters<T>) => {
    if (timer) clearTimeout(timer);
    timer = setTimeout(() => fn(...args), ms);
  };
  debounced.cancel = () => {
    if (timer) clearTimeout(timer);
  };
  return debounced as unknown as T & { cancel: () => void };
}

// ── Gallery ──────────────────────────────────────────

export async function getGalleryImages(category?: string): Promise<GalleryImage[]> {
  const sp = new URLSearchParams();
  if (category) sp.set('category', category);
  sp.set('limit', '100');
  const qs = sp.toString();
  const data = await apiFetch<{ images: GalleryImage[] }>(`/api/gallery${qs ? `?${qs}` : ''}`);
  return data.images || [];
}

export async function uploadGalleryImage(file: File, title?: string, caption?: string, category?: string): Promise<void> {
  const formData = new FormData();
  formData.append('file', file);
  if (title) formData.append('title', title);
  if (caption) formData.append('caption', caption);
  if (category) formData.append('category', category);

  const res = await fetch('/api/gallery', { method: 'POST', body: formData });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || `Upload failed (${res.status})`);
  }
}

export async function deleteGalleryImage(id: string): Promise<void> {
  await apiFetch(`/api/gallery/${id}`, { method: 'DELETE' });
}