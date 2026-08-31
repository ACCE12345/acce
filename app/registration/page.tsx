'use client';

import { useState, useCallback } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { addRegistration } from '@/lib/nexus-store';
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

const CATEGORIES = ['Delegate', 'Builder/Contractor', 'Engineer', 'Architect'];

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
  const [submitting, setSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [resultId, setResultId] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});

  const set = useCallback((key: keyof FormData, val: string) => {
    setForm((p) => ({ ...p, [key]: val }));
    setErrors((p) => { const n = { ...p }; delete n[key]; return n; });
  }, []);

  const validate = (): boolean => {
    const e: Record<string, string> = {};
    if (!form.fullName.trim()) e.fullName = 'Full Name is required';
    if (!/^[6-9]\d{9}$/.test(form.mobile)) e.mobile = 'Valid 10-digit Indian mobile required';
    if (form.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) e.email = 'Valid email required';
    if (!form.category) e.category = 'Category is required';
    if (!form.state) e.state = 'State is required';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;
    setSubmitting(true);
    try {
      const fd = new FormData();
      fd.append('fullName', form.fullName.trim());
      fd.append('mobile', form.mobile.trim());
      fd.append('email', form.email.trim());
      fd.append('category', form.category);
      fd.append('address', form.address.trim());
      fd.append('district', form.district);
      fd.append('state', form.state);

      const result = await addRegistration(fd);
      setResultId(result.regId);
      sessionStorage.setItem('nexus_last_reg', result.regId);
      setShowSuccess(true);
      showToast('Registration successful!', 'success');
    } catch (err: any) {
      const msg = err?.message || err?.error || 'Something went wrong. Please try again.';
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
            <div style={{ display: 'flex', width: '100%' }}>
              <Image src="/img/1.jpeg" alt="Partner" width={200} height={60} style={{ width: '50%', height: 60, objectFit: 'cover' }} />
              <Image src="/img/2.jpeg" alt="Partner" width={200} height={60} style={{ width: '50%', height: 60, objectFit: 'cover' }} />
            </div>
          </div>

          <div style={{ background: 'linear-gradient(135deg, #0A2647, #1D4E86)', padding: '14px 20px', textAlign: 'center', width: '100%' }}>
            <h3 style={{ color: '#fff', fontSize: 13, letterSpacing: '0.06em', textTransform: 'uppercase' as const, fontFamily: 'var(--font-mono)', margin: 0 }}>
              ACCE · Build Expo 2026
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
                Your digital ID card is ready
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

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4, fontSize: 9, color: '#8A8E96', fontFamily: 'var(--font-mono)', padding: '12px 0 4px' }}>
              Powered by
              <img src="/img/a+.png" alt="A+ Tech Services" style={{ height: 12, width: 'auto', verticalAlign: 'middle', marginLeft: 4 }} />
              A+ Tech Services
            </div>
          </div>

          <div className="reg-popup-btn" style={{ display: 'flex', gap: 12, marginTop: 16, width: '100%', padding: '0 24px 24px' }}>
            <Link href={`/id-card?regId=${resultId}`} style={{ ...styles.popupBtn, ...styles.popupBtnPrimary }}>
              View Digital ID Card
            </Link>
            <Link href="/" style={{ ...styles.popupBtn, ...styles.popupBtnSecondary }}>
              Back to Home
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.page}>
      <div className="reg-banner" style={styles.headerBanner}>
        <div style={{ maxWidth: 1180, margin: '0 auto', padding: '0 28px', position: 'relative', zIndex: 1 }}>
          <span style={styles.eyebrow}>Registration</span>
          <h1 style={styles.bannerTitle}>ACCE(I) Build Expo 2026</h1>
          <p style={{ color: '#B8CCE4', fontSize: 15, margin: 0 }}>Complete the form below to secure your delegate pass</p>
        </div>
      </div>

      <div style={{ maxWidth: 640, margin: '0 auto', padding: '0 20px', marginTop: -30, position: 'relative', zIndex: 2 }}>
        <div className="reg-card" style={styles.card}>
          <h3 style={styles.sectionTitle}>Register</h3>

          <div style={{ marginBottom: 18 }}>
            <label style={styles.label}>Full Name <span style={{ color: 'var(--brick)', marginLeft: 2 }}>*</span></label>
            <input className="reg-input" style={styles.input} placeholder="Enter your full name" maxLength={100} value={form.fullName} onChange={(e) => set('fullName', e.target.value)} />
            {errors.fullName && <span style={{ color: 'var(--brick)', fontSize: 12, marginTop: 4, display: 'block' }}>{errors.fullName}</span>}
          </div>

          <div style={{ marginBottom: 18 }}>
            <label style={styles.label}>Contact Number <span style={{ color: 'var(--brick)', marginLeft: 2 }}>*</span></label>
            <input className="reg-input" style={styles.input} placeholder="10-digit Indian mobile" value={form.mobile} onChange={(e) => set('mobile', e.target.value.replace(/\D/g, '').slice(0, 10))} />
            {errors.mobile && <span style={{ color: 'var(--brick)', fontSize: 12, marginTop: 4, display: 'block' }}>{errors.mobile}</span>}
          </div>

          <div style={{ marginBottom: 18 }}>
            <label style={styles.label}>Email Address</label>
            <input className="reg-input" style={styles.input} type="email" placeholder="your@email.com (optional)" maxLength={100} value={form.email} onChange={(e) => set('email', e.target.value)} />
            {errors.email && <span style={{ color: 'var(--brick)', fontSize: 12, marginTop: 4, display: 'block' }}>{errors.email}</span>}
          </div>

          <div style={{ marginBottom: 18 }}>
            <label style={styles.label}>Category <span style={{ color: 'var(--brick)', marginLeft: 2 }}>*</span></label>
            <select className="reg-input" style={styles.input} value={form.category} onChange={(e) => set('category', e.target.value)}>
              <option value="">Select category</option>
              {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
            {errors.category && <span style={{ color: 'var(--brick)', fontSize: 12, marginTop: 4, display: 'block' }}>{errors.category}</span>}
          </div>

          <div style={{ marginBottom: 18 }}>
            <label style={styles.label}>Address</label>
            <input className="reg-input" style={styles.input} placeholder="Enter your full address" maxLength={200} value={form.address} onChange={(e) => set('address', e.target.value)} />
            {errors.address && <span style={{ color: 'var(--brick)', fontSize: 12, marginTop: 4, display: 'block' }}>{errors.address}</span>}
          </div>

          <div style={{ marginBottom: 18 }}>
            <label style={styles.label}>District</label>
            <input className="reg-input" style={styles.input} placeholder="Enter your district" maxLength={100} value={form.district} onChange={(e) => set('district', e.target.value)} />
          </div>

          <div style={{ marginBottom: 18 }}>
            <label style={styles.label}>State <span style={{ color: 'var(--brick)', marginLeft: 2 }}>*</span></label>
            <select className="reg-input" style={styles.input} value={form.state} onChange={(e) => set('state', e.target.value)}>
              <option value="">Select state</option>
              {INDIAN_STATES.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
            {errors.state && <span style={{ color: 'var(--brick)', fontSize: 12, marginTop: 4, display: 'block' }}>{errors.state}</span>}
          </div>

          <button type="button" className="reg-btn" onClick={handleSubmit} disabled={submitting} style={{ ...styles.btn, ...styles.btnSubmit, width: '100%', marginTop: 28 }}>
            {submitting ? 'Submitting…' : 'Submit Registration'}
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
    fontSize: 14,
    fontFamily: 'var(--font-body)',
    background: '#fff',
    outline: 'none',
    transition: 'border-color 0.2s, box-shadow 0.2s',
    boxSizing: 'border-box' as const,
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
