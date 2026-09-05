'use client';

import { useState, useCallback } from 'react';
import Link from 'next/link';
import { useToast } from '@/lib/toast';

const INDIAN_STATES = [
  'Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar', 'Chhattisgarh',
  'Goa', 'Gujarat', 'Haryana', 'Himachal Pradesh', 'Jharkhand',
  'Karnataka', 'Kerala', 'Madhya Pradesh', 'Maharashtra', 'Manipur',
  'Meghalaya', 'Mizoram', 'Nagaland', 'Odisha', 'Punjab',
  'Rajasthan', 'Sikkim', 'Tamil Nadu', 'Telangana', 'Tripura',
  'Uttar Pradesh', 'Uttarakhand', 'West Bengal',
  'Delhi', 'Jammu & Kashmir', 'Ladakh', 'Puducherry',
  'Chandigarh', 'Dadra and Nagar Haveli and Daman and Diu',
  'Lakshadweep', 'Andaman and Nicobar Islands',
];

const CATEGORIES = ['Delegate', 'Builder/Contractor', 'Engineer', 'Architect', 'Exhibitor'];
const MAX_ACCOMPANYING = 4;

interface FormData {
  fullName: string;
  mobile: string;
  email: string;
  category: string;
  address: string;
  district: string;
  state: string;
}

const INITIAL: FormData = {
  fullName: '',
  mobile: '',
  email: '',
  category: '',
  address: '',
  district: '',
  state: '',
};

export default function RegistrationPage() {
  const { showToast } = useToast();
  const [form, setForm] = useState<FormData>(INITIAL);
  const [accompanyingCount, setAccompanyingCount] = useState(0);
  const [accompanyingNames, setAccompanyingNames] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [resultId, setResultId] = useState('');
  const [totalMembers, setTotalMembers] = useState(0);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const set = useCallback((key: keyof FormData, val: string) => {
    setForm((p) => ({ ...p, [key]: val }));
    setErrors((p) => { const n = { ...p }; delete n[key]; return n; });
  }, []);

  const handleAccompanyingChange = (count: number) => {
    setAccompanyingCount(count);
    setAccompanyingNames((prev) => {
      if (count > prev.length) {
        return [...prev, ...Array(count - prev.length).fill('')];
      }
      return prev.slice(0, count);
    });
  };

  const handleMemberNameChange = (index: number, name: string) => {
    setAccompanyingNames((prev) => {
      const updated = [...prev];
      updated[index] = name;
      return updated;
    });
  };

  const validate = (): boolean => {
    const e: Record<string, string> = {};
    if (!form.fullName.trim()) e.fullName = 'Full Name is required';
    if (!/^[6-9]\d{9}$/.test(form.mobile)) e.mobile = 'Valid 10-digit Indian mobile required';
    if (form.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) e.email = 'Valid email required';
    if (!form.category) e.category = 'Category is required';
    if (!form.state) e.state = 'State is required';
    // Validate accompanying member names
    for (let i = 0; i < accompanyingCount; i++) {
      if (!accompanyingNames[i]?.trim()) {
        e[`member_${i}`] = `Member ${i + 1} name is required`;
      }
    }
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;
    setSubmitting(true);
    try {
      const members = accompanyingNames
        .filter((name) => name.trim())
        .map((name) => ({ name: name.trim() }));

      const response = await fetch('/api/registrations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          primaryName: form.fullName.trim(),
          primaryMobile: form.mobile.trim(),
          primaryEmail: form.email.trim(),
          category: form.category,
          city: form.district.trim(),
          state: form.state,
          country: 'India',
          pin: '',
          isACCEMember: false,
          accompanyingMembers: members,
        }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Registration failed');
      setResultId(data.regId);
      setTotalMembers(data.totalMembers || (1 + accompanyingCount));
      sessionStorage.setItem('nexus_last_reg', data.regId);
      setShowSuccess(true);
      showToast('Registration successful!', 'success');
    } catch (err: any) {
      const msg = err?.message || 'Something went wrong. Please try again.';
      showToast(typeof msg === 'string' ? msg : 'Something went wrong. Please try again.', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  if (showSuccess) {
    return (
      <div style={styles.overlay}>
        <div className="reg-popup" style={styles.popup}>
          <div style={{ width: '100%', overflow: 'hidden', borderRadius: '16px 16px 0 0' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 20, background: 'linear-gradient(135deg, #0A2647, #1D4E86)', padding: '16px 24px' }}>
              <img src="/img/logo.png" alt="ACCE" style={{ height: 44, width: 'auto' }} />
              <img src="/img/2.jpeg" alt="Partner" style={{ height: 44, width: 'auto' }} />
            </div>
          </div>

          <div style={{ background: 'linear-gradient(135deg, #0A2647, #1D4E86)', padding: '14px 20px', textAlign: 'center', width: '100%' }}>
            <h3 style={{ color: '#fff', fontSize: 13, letterSpacing: '0.06em', textTransform: 'uppercase' as const, fontFamily: 'var(--font-mono)', margin: 0 }}>
              Build Expo 2026
            </h3>
          </div>

          <div style={{ padding: '24px 24px 0', textAlign: 'center' }}>
            <div style={styles.checkCircle}>
              <svg width="48" height="48" viewBox="0 0 48 48" fill="none">
                <circle cx="24" cy="24" r="24" fill="#16a34a" />
                <path d="M14 25l7 7L34 17" stroke="#fff" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
            <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 24, color: 'var(--ink)', margin: '16px 0 8px' }}>
              Registration Successful!
            </h2>
            <div style={styles.idBadge}>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--teal)' }}>Registration ID</span>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: 16, fontWeight: 700, color: 'var(--ink)', letterSpacing: '0.04em' }}>{resultId}</span>
            </div>
            
            <div style={{ padding: '10px 14px', background: 'rgba(22,163,74,0.08)', borderRadius: 8, textAlign: 'center', margin: '12px 0' }}>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: '#16a34a', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Total Members: {totalMembers}
              </span>
            </div>

            <div style={{ width: '100%', marginTop: 12 }}>
              {[
                ['Name', form.fullName],
                ['Phone', form.mobile],
                ['Email', form.email || '—'],
                ['Category', form.category],
                ['District', form.district || '—'],
                ['State', form.state],
              ].map(([label, value]) => (
                <div key={label as string} style={styles.summaryRow}>
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: '#5C7086', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{label}</span>
                  <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--ink)' }}>{value as string}</span>
                </div>
              ))}
            </div>

            <div style={{ padding: '12px', background: '#FEF3C7', borderRadius: 8, marginTop: 12, textAlign: 'left' }}>
              <p style={{ fontSize: 12, color: '#92400E', margin: 0, fontFamily: 'var(--font-mono)' }}>
                <strong>Important:</strong> Please save this Registration ID for entry at the event. One ID covers all {totalMembers} members.
              </p>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4, fontSize: 9, color: '#8A8E96', fontFamily: 'var(--font-mono)', padding: '12px 0 4px' }}>
              Powered by
              <img src="/img/a+.png" alt="A+ Tech Services" style={{ height: 12, width: 'auto', verticalAlign: 'middle', marginLeft: 4 }} />
              A+ Tech Services
            </div>
          </div>

          <div className="reg-popup-btn" style={{ display: 'flex', gap: 12, marginTop: 16, width: '100%', padding: '0 24px 24px', flexDirection: 'column' }}>
            <a
              href="https://chat.whatsapp.com/Lac8P28FkLlBNULS2yueGv?s=qt&p=a&mlu=4&ilr=4"
              target="_blank"
              rel="noopener noreferrer"
              style={{
                ...styles.popupBtn,
                background: '#25D366',
                color: '#fff',
                textDecoration: 'none',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 8,
                width: '100%',
              }}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
              </svg>
              Join WhatsApp Group
            </a>
            <div style={{ display: 'flex', gap: 12, width: '100%' }}>
              <Link href={`/id-card?regId=${resultId}`} style={{ ...styles.popupBtn, ...styles.popupBtnPrimary, flex: 1 }}>
                View Digital ID Card
              </Link>
              <Link href="/" style={{ ...styles.popupBtn, ...styles.popupBtnSecondary, flex: 1 }}>
                Go Home
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.page}>
      <div style={styles.headerBanner}>
        <div className="container">
          <div style={styles.eyebrow}>
            <svg width="14" height="14" viewBox="0 0 14 14" fill="currentColor">
              <path d="M7 0L8.5 5.5L14 7L8.5 8.5L7 14L5.5 8.5L0 7L5.5 5.5L7 0Z" />
            </svg>
            ACCE Build Expo 2026
          </div>
          <h1 style={styles.bannerTitle}>Delegate Registration</h1>
        </div>
      </div>

      <div className="container">
        <div style={styles.card}>
          <h2 style={styles.sectionTitle}>Primary Registrant</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 20 }}>
            <div>
              <label style={styles.label}>Full Name <span style={{ color: '#EF4444' }}>*</span></label>
              <input
                style={{ ...styles.input, borderColor: errors.fullName ? '#EF4444' : undefined }}
                placeholder="Enter your full name"
                value={form.fullName}
                onChange={(e) => set('fullName', e.target.value)}
                maxLength={100}
              />
              {errors.fullName && <span style={{ fontSize: 12, color: '#EF4444', marginTop: 4 }}>{errors.fullName}</span>}
            </div>
            <div>
              <label style={styles.label}>Mobile Number <span style={{ color: '#EF4444' }}>*</span></label>
              <input
                style={{ ...styles.input, borderColor: errors.mobile ? '#EF4444' : undefined }}
                placeholder="10-digit Indian mobile"
                value={form.mobile}
                onChange={(e) => set('mobile', e.target.value.replace(/\D/g, '').slice(0, 10))}
                maxLength={10}
              />
              {errors.mobile && <span style={{ fontSize: 12, color: '#EF4444', marginTop: 4 }}>{errors.mobile}</span>}
            </div>
            <div>
              <label style={styles.label}>Email Address</label>
              <input
                style={{ ...styles.input, borderColor: errors.email ? '#EF4444' : undefined }}
                placeholder="your@email.com"
                type="email"
                value={form.email}
                onChange={(e) => set('email', e.target.value)}
              />
              {errors.email && <span style={{ fontSize: 12, color: '#EF4444', marginTop: 4 }}>{errors.email}</span>}
            </div>
            <div>
              <label style={styles.label}>Category <span style={{ color: '#EF4444' }}>*</span></label>
              <select
                style={{ ...styles.input, borderColor: errors.category ? '#EF4444' : undefined }}
                value={form.category}
                onChange={(e) => set('category', e.target.value)}
              >
                <option value="">Select category</option>
                {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
              {errors.category && <span style={{ fontSize: 12, color: '#EF4444', marginTop: 4 }}>{errors.category}</span>}
            </div>
          </div>
        </div>

        <div style={styles.card}>
          <h2 style={styles.sectionTitle}>Group Registration</h2>
          <p style={{ fontSize: 14, color: '#64748B', marginTop: 0, marginBottom: 16 }}>
            Are you bringing additional family members or colleagues?
          </p>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <label style={styles.label}>Number of Accompanying Members</label>
            <select
              style={{ ...styles.input, width: 'auto', minWidth: 100 }}
              value={accompanyingCount}
              onChange={(e) => handleAccompanyingChange(parseInt(e.target.value))}
            >
              {Array.from({ length: MAX_ACCOMPANYING + 1 }, (_, i) => (
                <option key={i} value={i}>{i}</option>
              ))}
            </select>
          </div>

          {accompanyingCount > 0 && (
            <div style={{ marginTop: 24 }}>
              <label style={styles.label}>Member Names</label>
              <p style={{ fontSize: 12, color: '#64748B', marginTop: 0 }}>Enter names of accompanying members</p>
              {Array.from({ length: accompanyingCount }, (_, i) => (
                <div key={i} style={{ marginBottom: 12 }}>
                  <input
                    style={{ ...styles.input, borderColor: errors[`member_${i}`] ? '#EF4444' : undefined }}
                    placeholder={`Member ${i + 1} Name`}
                    value={accompanyingNames[i] || ''}
                    onChange={(e) => handleMemberNameChange(i, e.target.value)}
                    maxLength={100}
                  />
                  {errors[`member_${i}`] && (
                    <span style={{ fontSize: 12, color: '#EF4444', marginTop: 4 }}>{errors[`member_${i}`]}</span>
                  )}
                </div>
              ))}
            </div>
          )}

          {accompanyingCount > 0 && (
            <div style={{ marginTop: 16, padding: '12px 16px', background: '#EFF6FF', borderRadius: 8, border: '1px solid #BFDBFE' }}>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: '#1E40AF' }}>
                <strong>Total:</strong> {1 + accompanyingCount} members under one Registration ID
              </span>
            </div>
          )}
        </div>

        <div style={styles.card}>
          <h2 style={styles.sectionTitle}>Location Details</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 20 }}>
            <div style={{ gridColumn: '1 / -1' }}>
              <label style={styles.label}>Address</label>
              <input
                style={styles.input}
                placeholder="Enter your address"
                value={form.address}
                onChange={(e) => set('address', e.target.value)}
              />
            </div>
            <div>
              <label style={styles.label}>District / City</label>
              <input
                style={styles.input}
                placeholder="Enter district or city"
                value={form.district}
                onChange={(e) => set('district', e.target.value)}
              />
            </div>
            <div>
              <label style={styles.label}>State <span style={{ color: '#EF4444' }}>*</span></label>
              <select
                style={{ ...styles.input, borderColor: errors.state ? '#EF4444' : undefined }}
                value={form.state}
                onChange={(e) => set('state', e.target.value)}
              >
                <option value="">Select state</option>
                {INDIAN_STATES.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
              {errors.state && <span style={{ fontSize: 12, color: '#EF4444', marginTop: 4 }}>{errors.state}</span>}
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 60 }}>
          <button
            type="button"
            className="reg-btn"
            onClick={handleSubmit}
            disabled={submitting}
            style={{
              ...styles.btn,
              ...styles.btnSubmit,
              width: '100%',
              marginTop: 28,
              opacity: submitting ? 0.6 : 1,
              cursor: submitting ? 'not-allowed' : 'pointer',
            }}
          >
            {submitting ? (
              <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10 }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ animation: 'spin 0.8s linear infinite' }}>
                  <path d="M21 12a9 9 0 1 1-6.219-8.56" />
                </svg>
                Submitting...
              </span>
            ) : 'Register Now'}
          </button>
        </div>
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  page: {
    minHeight: '100vh',
    background: 'var(--paper)',
    fontFamily: 'var(--font-body)',
  },
  headerBanner: {
    background: 'linear-gradient(160deg, var(--ink-softer) 0%, var(--ink) 55%, #061A33 100%)',
    color: 'var(--paper)',
    padding: '150px 0 70px',
    position: 'relative',
    overflow: 'hidden',
  },
  eyebrow: {
    fontFamily: 'var(--font-mono)',
    fontSize: 12,
    letterSpacing: '0.14em',
    textTransform: 'uppercase' as const,
    color: 'var(--gold-bright)',
    display: 'inline-flex',
    alignItems: 'center',
    gap: 10,
  },
  bannerTitle: {
    fontFamily: 'var(--font-display)',
    fontSize: 'clamp(28px, 4vw, 42px)',
    color: 'var(--paper)',
    margin: '12px 0 8px',
    lineHeight: 1.15,
  },
  card: {
    background: 'var(--paper)',
    borderRadius: 14,
    padding: '28px 24px',
    boxShadow: '0 8px 30px -12px rgba(10,38,71,0.15)',
    border: '1px solid var(--line)',
    marginBottom: 40,
  },
  sectionTitle: {
    fontFamily: 'var(--font-display)',
    fontSize: 22,
    fontWeight: 700,
    color: 'var(--ink)',
    margin: '0 0 20px',
  },
  label: {
    display: 'block',
    fontFamily: 'var(--font-mono)',
    fontSize: 11.5,
    textTransform: 'uppercase' as const,
    letterSpacing: '0.06em',
    color: 'var(--teal)',
    marginBottom: 6,
  },
  input: {
    width: '100%',
    padding: '12px 14px',
    border: '1px solid var(--line)',
    borderRadius: 10,
    fontSize: 16,
    fontFamily: 'var(--font-body)',
    background: '#fff',
    outline: 'none',
    transition: 'border-color 0.2s, box-shadow 0.2s',
    boxSizing: 'border-box' as const,
    minHeight: 48,
  },
  btn: {
    padding: '14px 28px',
    borderRadius: 10,
    border: 'none',
    fontFamily: 'var(--font-mono)',
    fontSize: 13,
    letterSpacing: '0.06em',
    textTransform: 'uppercase' as const,
    cursor: 'pointer',
    transition: 'transform 0.2s, box-shadow 0.2s',
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 48,
  },
  btnSubmit: {
    background: 'linear-gradient(135deg, var(--teal-bright), var(--gold))',
    color: 'var(--paper)',
    boxShadow: '0 12px 28px -10px rgba(68,132,209,0.55)',
  },
  overlay: {
    position: 'fixed',
    inset: 0,
    zIndex: 1000,
    background: 'rgba(10,38,71,0.6)',
    backdropFilter: 'blur(6px)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  popup: {
    background: 'var(--paper)',
    borderRadius: 16,
    padding: '36px 32px',
    maxWidth: 420,
    width: '100%',
    boxShadow: '0 30px 80px -24px rgba(10,38,71,0.45)',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
  },
  checkCircle: {
    marginBottom: 8,
  },
  idBadge: {
    display: 'flex',
    flexDirection: 'column' as const,
    alignItems: 'center',
    gap: 4,
    background: 'var(--paper-dim)',
    padding: '10px 24px',
    borderRadius: 8,
    marginTop: 8,
  },
  summaryRow: {
    display: 'flex',
    justifyContent: 'space-between',
    padding: '10px 0',
    borderBottom: '1px solid var(--line)',
  },
  popupBtn: {
    flex: 1,
    padding: '14px 18px',
    borderRadius: 10,
    border: 'none',
    fontFamily: 'var(--font-mono)',
    fontSize: 12,
    letterSpacing: '0.06em',
    textTransform: 'uppercase' as const,
    cursor: 'pointer',
    textAlign: 'center' as const,
    textDecoration: 'none',
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 48,
  },
  popupBtnPrimary: {
    background: 'linear-gradient(135deg, var(--gold), var(--teal-bright))',
    color: 'var(--paper)',
    boxShadow: '0 8px 20px -8px rgba(68,132,209,0.5)',
  },
  popupBtnSecondary: {
    background: 'transparent',
    color: 'var(--ink)',
    border: '1px solid var(--line)',
  },
};
