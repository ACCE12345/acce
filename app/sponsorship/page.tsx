'use client';

import React, { useState, useRef, useCallback, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { addSponsorship } from '@/lib/nexus-store';
import { useToast } from '@/lib/toast';

interface SponsorFormData {
  companyName: string;
  contactPerson: string;
  phone: string;
  email: string;
  website: string;
  address: string;
  gst: string;
  logo: File | null;
  logoPreview: string;
  requirements: string;
}

const INITIAL: SponsorFormData = {
  companyName: '',
  contactPerson: '',
  phone: '',
  email: '',
  website: '',
  address: '',
  gst: '',
  logo: null,
  logoPreview: '',
  requirements: '',
};

export default function SponsorshipPage() {
  const { showToast } = useToast();
  const [form, setForm] = useState<SponsorFormData>(INITIAL);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [sponsorId, setSponsorId] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const logoRef = useRef<HTMLInputElement>(null);

  // Revoke object URLs on unmount to prevent memory leaks
  useEffect(() => {
    return () => {
      if (form.logoPreview) URL.revokeObjectURL(form.logoPreview);
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const set = useCallback((key: keyof SponsorFormData, val: string | File | null) => {
    setForm((p) => ({ ...p, [key]: val }));
    setErrors((p) => { const n = { ...p }; delete n[key]; return n; });
  }, []);

  const handleLogo = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      showToast('Logo must be JPG, PNG or WEBP', 'error');
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      showToast('Logo must be under 2MB', 'error');
      return;
    }
    setForm((p) => ({ ...p, logo: file, logoPreview: URL.createObjectURL(file) }));
  };

  const validate = (): boolean => {
    const e: Record<string, string> = {};
    if (!form.companyName.trim()) e.companyName = 'Company name is required.';
    if (!form.contactPerson.trim()) e.contactPerson = 'Contact person is required.';
    if (!/^[6-9]\d{9}$/.test(form.phone)) e.phone = 'Enter a valid 10-digit mobile number.';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) e.email = 'Enter a valid email address.';
    if (!form.address.trim()) e.address = 'Address is required.';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    setSubmitting(true);
    try {
      const fd = new FormData();
      fd.append('companyName', form.companyName.trim());
      fd.append('contactPerson', form.contactPerson.trim());
      fd.append('phone', form.phone.trim());
      fd.append('email', form.email.trim());
      fd.append('website', form.website.trim());
      fd.append('address', form.address.trim());
      fd.append('gst', form.gst.trim());
      fd.append('requirements', form.requirements.trim());
      if (form.logo) fd.append('logo', form.logo);

      const result = await addSponsorship(fd);
      setSponsorId(result.sponsorId);
      setSuccess(true);
      showToast('Sponsorship application submitted!', 'success');
    } catch {
      showToast('Something went wrong. Please try again.', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  if (success) {
    return (
      <>
        <div style={styles.pageBanner}>
          <div style={{ maxWidth: 1180, margin: '0 auto', padding: '0 28px', position: 'relative', zIndex: 1 }}>
            <span style={styles.eyebrow}>Sponsorship</span>
            <h1 style={styles.bannerTitle}>Application Received</h1>
          </div>
        </div>
        <section style={styles.section}>
          <div style={{ maxWidth: 560, margin: '0 auto', padding: '0 20px' }}>
            <div style={styles.successCard}>
              <div style={styles.successIcon}>✓</div>
              <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 26, color: 'var(--ink)', margin: '0 0 8px', textAlign: 'center' }}>
                Sponsorship Application Received
              </h2>
              <p style={{ color: '#5A6270', fontSize: 15, textAlign: 'center', margin: '0 0 18px' }}>
                Our partnerships desk will reach out to confirm your sponsorship and payment details.
              </p>
              <div style={styles.sponsorIdBadge}>
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--teal)', textTransform: 'uppercase' }}>Sponsor ID</span>
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: 18, fontWeight: 700, color: 'var(--ink)', letterSpacing: '0.04em' }}>{sponsorId}</span>
              </div>
              <Link href="/" style={{ ...styles.btn, ...styles.btnDark, marginTop: 24 }}>Back to Home</Link>
            </div>
          </div>
        </section>
      </>
    );
  }

  return (
    <>
      <div style={styles.pageBanner}>
        <div style={{ maxWidth: 1180, margin: '0 auto', padding: '0 28px', position: 'relative', zIndex: 1 }}>
          <span style={styles.eyebrow}>Sponsorship</span>
          <h1 style={styles.bannerTitle}>Put your brand in front of 4,000 decision-makers</h1>
          <p style={{ color: '#C9C6BC', fontSize: 16, margin: '12px 0 0' }}>
            Tell us about your company and your goals — our partnerships desk will confirm availability within two business days.
          </p>
        </div>
      </div>

      <section className="section section-alt" id="apply" style={{ padding: '110px 0' }}>
        <div style={{ maxWidth: 820, margin: '0 auto', padding: '0 20px' }}>
          <div style={styles.formWrap}>
            <form onSubmit={handleSubmit} style={{ padding: 40 }}>
              <div style={styles.formSection}>
                <div style={styles.sectionTitle}>
                  Company Details
                  <span style={{ flex: 1, height: 1, background: 'var(--line)' }} />
                </div>
                <div style={styles.formGrid}>
                  <div style={styles.fieldFull}>
                    <FieldLabel label="Company / Organization Name" required />
                    <input type="text" maxLength={120} value={form.companyName} onChange={(e) => set('companyName', e.target.value)} style={styles.input} />
                    <ErrorMsg msg={errors.companyName} />
                  </div>
                  <div>
                    <FieldLabel label="Contact Person Name" required />
                    <input type="text" maxLength={80} value={form.contactPerson} onChange={(e) => set('contactPerson', e.target.value)} style={styles.input} />
                    <ErrorMsg msg={errors.contactPerson} />
                  </div>
                  <div>
                    <FieldLabel label="Phone Number" required />
                    <input type="tel" maxLength={10} value={form.phone} onChange={(e) => set('phone', e.target.value.replace(/\D/g, '').slice(0, 10))} style={styles.input} />
                    <ErrorMsg msg={errors.phone} />
                  </div>
                  <div>
                    <FieldLabel label="Email" required />
                    <input type="email" maxLength={100} value={form.email} onChange={(e) => set('email', e.target.value)} style={styles.input} />
                    <ErrorMsg msg={errors.email} />
                  </div>
                  <div>
                    <FieldLabel label="Company Website" />
                    <input type="text" maxLength={200} placeholder="https://" value={form.website} onChange={(e) => set('website', e.target.value)} style={styles.input} />
                  </div>
                  <div style={styles.fieldFull}>
                    <FieldLabel label="Company Address" required />
                    <textarea rows={3} maxLength={300} value={form.address} onChange={(e) => set('address', e.target.value)} style={{ ...styles.input, minHeight: 80, resize: 'vertical' }} />
                    <ErrorMsg msg={errors.address} />
                  </div>
                </div>
              </div>

              <div style={styles.formSection}>
                <div style={styles.sectionTitle}>
                  Additional Details
                  <span style={{ flex: 1, height: 1, background: 'var(--line)' }} />
                </div>
                <div style={styles.formGrid}>
                  <div>
                    <FieldLabel label="GST Number" />
                    <input type="text" maxLength={15} placeholder="22AAAAA0000A1Z5" value={form.gst} onChange={(e) => set('gst', e.target.value)} style={styles.input} />
                  </div>
                  <div style={styles.fieldFull}>
                    <FieldLabel label="Company Logo Upload" />
                    <input ref={logoRef} type="file" accept="image/png,image/jpeg,image/webp" style={{ display: 'none' }} onChange={handleLogo} />
                    <div style={styles.uploadBox} onClick={() => logoRef.current?.click()}>
                      {form.logoPreview ? (
                        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                          <Image src={form.logoPreview} alt="Logo" width={60} height={60} style={{ width: 60, height: 60, objectFit: 'contain', borderRadius: 8 }} />
                          <span style={{ color: 'var(--teal)', fontWeight: 600, fontSize: 14 }}>✓ Logo uploaded</span>
                        </div>
                      ) : (
                        <div style={{ textAlign: 'center', color: '#7A869A' }}>
                          <div style={{ fontSize: 28, marginBottom: 4 }}>+</div>
                          <div style={{ fontSize: 12 }}>JPG, PNG or WEBP — max 2MB</div>
                        </div>
                      )}
                    </div>
                  </div>
                  <div style={styles.fieldFull}>
                    <FieldLabel label="Additional Requirements" />
                    <textarea rows={3} maxLength={500} placeholder="Booth preferences, branding requests, etc." value={form.requirements} onChange={(e) => set('requirements', e.target.value)} style={{ ...styles.input, minHeight: 80, resize: 'vertical' }} />
                  </div>
                </div>
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="btn btn-gold"
                style={{ width: '100%', justifyContent: 'center', marginTop: 28 }}
              >
                {submitting ? 'Submitting…' : 'Submit Sponsorship Application'}
              </button>
            </form>
          </div>
        </div>
      </section>
    </>
  );
}

function FieldLabel({ label, required }: { label: string; required?: boolean }) {
  return (
    <label style={styles.label}>
      {label}{required && <span style={{ color: 'var(--brick)', marginLeft: 2 }}>*</span>}
    </label>
  );
}

function ErrorMsg({ msg }: { msg?: string }) {
  return msg ? <span style={{ color: 'var(--brick)', fontSize: 12.5, marginTop: 4, display: 'block' }}>{msg}</span> : null;
}

const styles: Record<string, React.CSSProperties> = {
  pageBanner: {
    background: 'linear-gradient(160deg, var(--ink-softer) 0%, var(--ink) 55%, #061A33 100%)',
    color: 'var(--paper)',
    padding: '150px 0 60px',
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
  section: {
    padding: '110px 0',
  },
  formWrap: {
    background: '#fff',
    border: '1px solid var(--line)',
    borderRadius: 'var(--radius-lg)',
    boxShadow: 'var(--glow)',
    overflow: 'hidden',
  },
  formSection: {
    marginBottom: 38,
  },
  sectionTitle: {
    fontFamily: 'var(--font-mono)',
    fontSize: 12,
    textTransform: 'uppercase' as const,
    letterSpacing: '0.08em',
    color: 'var(--teal)',
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    marginBottom: 22,
  },
  formGrid: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: 22,
  },
  fieldFull: {
    gridColumn: '1 / -1',
  },
  label: {
    display: 'block',
    fontFamily: 'var(--font-mono)',
    fontSize: 11.5,
    textTransform: 'uppercase' as const,
    letterSpacing: '0.05em',
    color: '#3A3F4A',
    marginBottom: 6,
  },
  input: {
    width: '100%',
    padding: '13px 14px',
    border: '1px solid var(--line)',
    borderRadius: 10,
    fontFamily: 'var(--font-body)',
    fontSize: 14.5,
    background: 'var(--paper)',
    transition: 'border-color 0.2s, box-shadow 0.2s',
    boxSizing: 'border-box' as const,
    outline: 'none',
  },
  uploadBox: {
    border: '1.5px dashed rgba(68,132,209,0.4)',
    borderRadius: 14,
    padding: 18,
    background: 'var(--paper-dim)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    minHeight: 80,
  },
  successCard: {
    background: '#fff',
    border: '1px solid var(--line)',
    borderRadius: 20,
    boxShadow: 'var(--glow)',
    padding: '50px 44px',
    textAlign: 'center',
  },
  successIcon: {
    width: 74,
    height: 74,
    borderRadius: '50%',
    background: 'linear-gradient(135deg, var(--teal), var(--teal-bright))',
    color: '#fff',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: 36,
    margin: '0 auto 22px',
  },
  sponsorIdBadge: {
    display: 'inline-flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: 4,
    background: 'linear-gradient(135deg, var(--ink), var(--ink-soft))',
    color: 'var(--gold-bright)',
    padding: '12px 20px',
    borderRadius: 10,
    marginTop: 8,
  },
  btn: {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    padding: '14px 30px',
    fontFamily: 'var(--font-mono)',
    fontSize: 13,
    letterSpacing: '0.06em',
    textTransform: 'uppercase' as const,
    border: 'none',
    borderRadius: 10,
    cursor: 'pointer',
    textDecoration: 'none',
    minHeight: 48,
  },
  btnDark: {
    background: 'linear-gradient(135deg, var(--ink), var(--ink-soft))',
    color: 'var(--paper)',
  },
};
