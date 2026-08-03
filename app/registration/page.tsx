'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
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

interface FormData {
  fullName: string;
  photo: File | null;
  photoPreview: string;
  mobile: string;
  email: string;
  city: string;
  state: string;
  country: string;
  pin: string;
  isACCEMember: boolean;
  paymentScreenshot: File | null;
  paymentScreenshotPreview: string;
  termsAccepted: boolean;
  privacyAccepted: boolean;
}

const INITIAL: FormData = {
  fullName: '',
  photo: null,
  photoPreview: '',
  mobile: '',
  email: '',
  city: '',
  state: '',
  country: 'India',
  pin: '',
  isACCEMember: false,
  paymentScreenshot: null,
  paymentScreenshotPreview: '',
  termsAccepted: false,
  privacyAccepted: false,
};

const STEPS = ['Personal', 'Location', 'Membership', 'Payment', 'Terms'];

export default function RegistrationPage() {
  const { showToast } = useToast();
  const [step, setStep] = useState(0);
  const [form, setForm] = useState<FormData>(INITIAL);
  const [submitting, setSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [resultId, setResultId] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const photoRef = useRef<HTMLInputElement>(null);
  const payRef = useRef<HTMLInputElement>(null);

  // Revoke object URLs on unmount to prevent memory leaks
  useEffect(() => {
    return () => {
      if (form.photoPreview) URL.revokeObjectURL(form.photoPreview);
      if (form.paymentScreenshotPreview) URL.revokeObjectURL(form.paymentScreenshotPreview);
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const set = useCallback((key: keyof FormData, val: string | boolean | File | null) => {
    setForm((p) => ({ ...p, [key]: val }));
    setErrors((p) => { const n = { ...p }; delete n[key]; return n; });
  }, []);

  const paymentAmount = form.isACCEMember ? 500 : 700;

  const validateStep = (s: number): boolean => {
    const e: Record<string, string> = {};
    if (s === 0) {
      if (!form.fullName.trim()) e.fullName = 'Full Name is required';
      if (!form.photo) e.photo = 'Profile Photo is required';
      if (!/^[6-9]\d{9}$/.test(form.mobile)) e.mobile = 'Valid 10-digit Indian mobile required';
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) e.email = 'Valid email required';
    } else if (s === 1) {
      if (!form.city.trim()) e.city = 'City is required';
      if (!form.state) e.state = 'State is required';
      if (!form.country.trim()) e.country = 'Country is required';
    } else if (s === 3) {
      if (!form.paymentScreenshot) e.paymentScreenshot = 'Payment screenshot is required';
    } else if (s === 4) {
      if (!form.termsAccepted) e.termsAccepted = 'You must accept the Terms';
      if (!form.privacyAccepted) e.privacyAccepted = 'You must accept the Privacy Policy';
    }
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const next = () => { if (validateStep(step)) setStep((p) => Math.min(p + 1, STEPS.length - 1)); };
  const prev = () => setStep((p) => Math.max(p - 1, 0));

  const handlePhoto = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) { showToast('Photo must be JPG/PNG/WEBP', 'error'); return; }
    if (file.size > 2 * 1024 * 1024) { showToast('Photo must be under 2MB', 'error'); return; }
    set('photo', file);
    const url = URL.createObjectURL(file);
    setForm((p) => ({ ...p, photo: file, photoPreview: url }));
  };

  const handlePayment = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) { showToast('Screenshot must be JPG/PNG/WEBP', 'error'); return; }
    if (file.size > 5 * 1024 * 1024) { showToast('Screenshot must be under 5MB', 'error'); return; }
    setForm((p) => ({ ...p, paymentScreenshot: file, paymentScreenshotPreview: URL.createObjectURL(file) }));
  };

  const handleSubmit = async () => {
    if (!validateStep(4)) return;
    setSubmitting(true);
    try {
      const fd = new FormData();
      fd.append('fullName', form.fullName.trim());
      if (form.photo) fd.append('photo', form.photo);
      fd.append('mobile', form.mobile.trim());
      fd.append('email', form.email.trim());
      fd.append('city', form.city.trim());
      fd.append('state', form.state);
      fd.append('country', form.country.trim());
      fd.append('pin', form.pin.trim());
      fd.append('isACCEMember', String(form.isACCEMember));
      fd.append('paymentAmount', String(paymentAmount));
      if (form.paymentScreenshot) fd.append('paymentScreenshot', form.paymentScreenshot);

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
      <>
        <div style={styles.overlay}>
        <div className="reg-popup" style={styles.popup}>
          <div style={styles.checkCircle}>
            <svg width="48" height="48" viewBox="0 0 48 48" fill="none">
              <circle cx="24" cy="24" r="24" fill="#16a34a" />
              <path d="M14 25l7 7L34 17" stroke="#fff" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
          <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 28, color: 'var(--ink)', margin: '20px 0 8px', textAlign: 'center' }}>
            Registration Successful!
          </h2>
          <div style={styles.idBadge}>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--teal)' }}>Registration ID</span>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: 18, fontWeight: 700, color: 'var(--ink)', letterSpacing: '0.04em' }}>{resultId}</span>
          </div>

          <div style={{ padding: '12px 16px', background: 'rgba(212,80,72,0.08)', borderRadius: 8, textAlign: 'center', margin: '12px 0' }}>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: '#D45048', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              QR code will be available after payment verification
            </span>
          </div>

          {form.photoPreview && (
            <div style={{ margin: '16px auto', width: 90, height: 90, borderRadius: '50%', overflow: 'hidden', border: '3px solid var(--gold)' }}>
              <Image src={form.photoPreview} alt="Profile" width={90} height={90} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            </div>
          )}
          <div style={{ width: '100%', marginTop: 16 }}>
            {[
              ['Name', form.fullName],
              ['Phone', form.mobile],
              ['Email', form.email],
              ['Amount', `₹${paymentAmount}`],
              ['Payment', 'Pending Verification'],
            ].map(([label, value]) => (
              <div key={label as string} style={styles.summaryRow}>
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: '#5C7086', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{label}</span>
                <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--ink)' }}>{value as string}</span>
              </div>
            ))}
          </div>
          <div className="reg-popup-btn" style={{ display: 'flex', gap: 12, marginTop: 24, width: '100%' }}>
            <Link href={`/id-card?regId=${resultId}`} style={{ ...styles.popupBtn, ...styles.popupBtnPrimary }}>
              View Digital ID Card
            </Link>
            <Link href="/" style={{ ...styles.popupBtn, ...styles.popupBtnSecondary }}>
              Back to Home
            </Link>
          </div>
        </div>
      </div>
      </>
    );
  }

  const progress = ((step + 1) / STEPS.length) * 100;

  return (
    <>
    <div style={styles.page}>
      <div className="reg-banner" style={styles.headerBanner}>
        <div style={{ maxWidth: 1180, margin: '0 auto', padding: '0 28px', position: 'relative', zIndex: 1 }}>
          <span style={styles.eyebrow}>Registration</span>
          <h1 style={styles.bannerTitle}>ACCE (India) Build Expo</h1>
          <p style={{ color: '#B8CCE4', fontSize: 15, margin: 0 }}>Complete the form below to secure your delegate pass</p>
        </div>
      </div>

      <div style={{ maxWidth: 720, margin: '0 auto', padding: '0 20px', marginTop: -30, position: 'relative', zIndex: 2 }}>
        {/* Progress bar */}
        <div className="reg-progress" style={styles.progressWrap}>
          <div style={styles.progressTrack}>
            <div style={{ ...styles.progressFill, width: `${progress}%` }} />
          </div>
          <div style={styles.stepLabels}>
            {STEPS.map((s, i) => (
              <span key={s} style={{ ...styles.stepLabel, color: i <= step ? 'var(--gold)' : '#9AA5B4' }}>
                <span style={{ ...styles.stepDot, background: i <= step ? 'var(--gold)' : '#D0D9E4', color: i < step ? '#fff' : i === step ? '#fff' : '#9AA5B4' }}>
                   {i < step ? 'DONE' : i + 1}
                </span>
                <span style={{ display: 'none' }}>{s}</span>
              </span>
            ))}
          </div>
        </div>

        <div className="reg-card" style={styles.card}>
          <h3 style={styles.sectionTitle}>{STEPS[step]}</h3>

          {/* Step 0: Personal */}
          {step === 0 && (
            <>
              <Field label="Full Name" required>
                <input className="reg-input" style={styles.input} placeholder="Enter your full name" maxLength={100} value={form.fullName} onChange={(e) => set('fullName', e.target.value)} />
                <Err errors={errors} field="fullName" />
              </Field>
              <Field label="Profile Photo" required>
                <input ref={photoRef} type="file" accept="image/jpeg,image/png,image/webp" style={{ display: 'none' }} onChange={handlePhoto} />
                <div className="reg-upload" role="button" tabIndex={0} style={styles.uploadBox} onClick={() => photoRef.current?.click()} onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') photoRef.current?.click(); }}>
                  {form.photoPreview ? (
                    <Image src={form.photoPreview} alt="Preview" width={80} height={80} style={{ width: 80, height: 80, borderRadius: '50%', objectFit: 'cover', border: '2px solid var(--gold)' }} />
                  ) : (
                    <div style={{ textAlign: 'center', color: '#7A869A' }}>
                      <div style={{ fontSize: 28, marginBottom: 4 }}>+</div>
                      <div style={{ fontSize: 12 }}>JPG/PNG/WEBP, max 2MB</div>
                    </div>
                  )}
                </div>
                <Err errors={errors} field="photo" />
              </Field>
              <Field label="Mobile Number" required>
                <input className="reg-input" style={styles.input} placeholder="10-digit Indian mobile" value={form.mobile} onChange={(e) => set('mobile', e.target.value.replace(/\D/g, '').slice(0, 10))} />
                <Err errors={errors} field="mobile" />
              </Field>
              <Field label="Email Address" required>
                <input className="reg-input" style={styles.input} type="email" placeholder="your@email.com" maxLength={100} value={form.email} onChange={(e) => set('email', e.target.value)} />
                <Err errors={errors} field="email" />
              </Field>
            </>
          )}

          {/* Step 1: Location */}
          {step === 1 && (
            <>
              <Field label="City" required>
                <input className="reg-input" style={styles.input} placeholder="City" maxLength={60} value={form.city} onChange={(e) => set('city', e.target.value)} />
                <Err errors={errors} field="city" />
              </Field>
              <Field label="State" required>
                <select className="reg-input" style={styles.input} value={form.state} onChange={(e) => set('state', e.target.value)}>
                  <option value="">Select state</option>
                  {INDIAN_STATES.map((s) => <option key={s} value={s}>{s}</option>)}
                </select>
                <Err errors={errors} field="state" />
              </Field>
              <Field label="Country" required>
                <input className="reg-input" style={styles.input} value={form.country} onChange={(e) => set('country', e.target.value)} />
                <Err errors={errors} field="country" />
              </Field>
              <Field label="PIN / ZIP Code">
                <input className="reg-input" style={styles.input} placeholder="PIN or ZIP code (optional)" maxLength={12} value={form.pin} onChange={(e) => set('pin', e.target.value)} />
              </Field>
            </>
          )}

          {/* Step 2: Membership */}
          {step === 2 && (
            <>
              <p style={{ fontSize: 14, color: '#4A5568', marginBottom: 20 }}>
                ACCE (India) members receive a discounted registration fee.
              </p>
              {[
                { label: 'Yes, I am an ACCE (India) Member', sub: '₹500', val: true },
                { label: 'No, I am not a member', sub: '₹700', val: false },
              ].map((opt) => (
                <label key={String(opt.val)} className="reg-radio" style={{ ...styles.radioCard, borderColor: form.isACCEMember === opt.val ? 'var(--gold)' : 'var(--line)' }}>
                  <div style={styles.radioRow}>
                    <div style={{ ...styles.radioOuter, borderColor: form.isACCEMember === opt.val ? 'var(--gold)' : '#BCC6D4' }}>
                      {form.isACCEMember === opt.val && <div style={styles.radioInner} />}
                    </div>
                    <div>
                      <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--ink)' }}>{opt.label}</div>
                      <div style={{ fontSize: 13, color: '#5C7086', marginTop: 2 }}>{opt.sub}</div>
                    </div>
                  </div>
                  <input type="radio" name="membership" style={{ display: 'none' }} checked={form.isACCEMember === opt.val} onChange={() => set('isACCEMember', opt.val)} />
                </label>
              ))}
            </>
          )}

          {/* Step 3: Payment */}
          {step === 3 && (
            <>
              <div style={styles.amountBox}>
                <span style={{ fontSize: 14, color: '#5C7086' }}>Registration Fee</span>
                <span style={{ fontSize: 32, fontWeight: 700, color: 'var(--ink)', fontFamily: 'var(--font-display)' }}>₹{paymentAmount}</span>
              </div>

              <div style={{ textAlign: 'center', marginBottom: 24 }}>
                <div style={styles.qrWrap}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src="/img/qr.jpeg" alt="PhonePe QR Code" className="reg-qr-img" style={{ width: 320, height: 320, objectFit: 'contain', borderRadius: 8, border: '1px solid var(--line)' }} />
                </div>
                <p style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: '#5C7086', textTransform: 'uppercase', letterSpacing: '0.08em', marginTop: 10 }}>
                  PhonePe QR
                </p>
              </div>

              <Field label="Upload Payment Screenshot" required>
                <input ref={payRef} type="file" accept="image/jpeg,image/png,image/webp" style={{ display: 'none' }} onChange={handlePayment} />
                <div className="reg-upload" role="button" tabIndex={0} style={styles.uploadBox} onClick={() => payRef.current?.click()} onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') payRef.current?.click(); }}>
                  {form.paymentScreenshotPreview ? (
                     <div style={{ color: 'var(--teal)', fontWeight: 600, fontSize: 14 }}>Screenshot uploaded</div>
                  ) : (
                    <div style={{ textAlign: 'center', color: '#7A869A' }}>
                      <div style={{ fontSize: 28, marginBottom: 4 }}>+</div>
                      <div style={{ fontSize: 12 }}>JPG/PNG/WEBP, max 5MB</div>
                    </div>
                  )}
                </div>
                <Err errors={errors} field="paymentScreenshot" />
              </Field>
            </>
          )}

          {/* Step 4: Terms */}
          {step === 4 && (
            <>
              <label className="reg-check" style={styles.checkCard}>
                <input type="checkbox" checked={form.termsAccepted} onChange={(e) => set('termsAccepted', e.target.checked)} style={styles.checkbox} />
                <div>
                  <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--ink)' }}>I agree to the Terms &amp; Conditions</div>
                  <div style={{ fontSize: 12, color: '#5C7086', marginTop: 2 }}>By checking this box, you agree to the event terms.</div>
                </div>
              </label>
              <Err errors={errors} field="termsAccepted" />

              <label className="reg-check" style={styles.checkCard}>
                <input type="checkbox" checked={form.privacyAccepted} onChange={(e) => set('privacyAccepted', e.target.checked)} style={styles.checkbox} />
                <div>
                  <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--ink)' }}>I agree to the Privacy Policy</div>
                  <div style={{ fontSize: 12, color: '#5C7086', marginTop: 2 }}>Your data will be handled as per our privacy policy.</div>
                </div>
              </label>
              <Err errors={errors} field="privacyAccepted" />
            </>
          )}

          {/* Navigation buttons */}
          <div style={styles.btnRow}>
            {step > 0 && (
              <button type="button" className="reg-btn" onClick={prev} style={{ ...styles.btn, ...styles.btnGhost }}>
                ← Back
              </button>
            )}
            {step < STEPS.length - 1 ? (
              <button type="button" className="reg-btn" onClick={next} style={{ ...styles.btn, ...styles.btnPrimary, marginLeft: 'auto' }}>
                Next →
              </button>
            ) : (
              <button type="button" className="reg-btn" onClick={handleSubmit} disabled={submitting} style={{ ...styles.btn, ...styles.btnSubmit, marginLeft: 'auto' }}>
                {submitting ? 'Submitting…' : 'Submit Registration'}
              </button>
            )}
          </div>
        </div>
      </div>
      </div>
    </>
  );
}

function Err({ field, errors }: { field: string; errors: Record<string, string> }) {
  return errors[field] ? <span style={{ color: 'var(--brick)', fontSize: 12, marginTop: 4, display: 'block' }}>{errors[field]}</span> : null;
}

function Field({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: 18 }}>
      <label style={styles.label}>
        {label}{required && <span style={{ color: 'var(--brick)', marginLeft: 2 }}>*</span>}
      </label>
      {children}
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
  progressWrap: {
    background: 'var(--paper)',
    borderRadius: 14,
    padding: '20px 24px 16px',
    boxShadow: '0 8px 30px -12px rgba(10,38,71,0.15)',
    marginBottom: 24,
  },
  progressTrack: {
    height: 6,
    borderRadius: 3,
    background: 'var(--paper-dim)',
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 3,
    background: 'linear-gradient(90deg, var(--gold), var(--teal-bright))',
    transition: 'width 0.4s ease',
  },
  stepLabels: {
    display: 'flex',
    justifyContent: 'space-between',
    marginTop: 10,
  },
  stepLabel: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: 11,
  },
  stepDot: {
    width: 26,
    height: 26,
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontFamily: 'var(--font-mono)',
    fontSize: 11,
    fontWeight: 600,
    transition: 'background 0.3s',
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
  uploadBox: {
    border: '2px dashed var(--line)',
    borderRadius: 10,
    padding: '20px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    transition: 'border-color 0.2s',
    minHeight: 100,
  },
  radioCard: {
    display: 'block',
    border: '1.5px solid var(--line)',
    borderRadius: 10,
    padding: '16px 18px',
    marginBottom: 12,
    cursor: 'pointer',
    transition: 'border-color 0.2s',
  },
  radioRow: {
    display: 'flex',
    alignItems: 'center',
    gap: 14,
  },
  radioOuter: {
    width: 22,
    height: 22,
    borderRadius: '50%',
    border: '2px solid #BCC6D4',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  radioInner: {
    width: 12,
    height: 12,
    borderRadius: '50%',
    background: 'var(--gold)',
  },
  amountBox: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    background: 'var(--paper-dim)',
    borderRadius: 10,
    padding: '16px 20px',
    marginBottom: 24,
  },
  qrWrap: {
    display: 'flex',
    justifyContent: 'center',
    marginBottom: 8,
  },
  checkCard: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: 12,
    padding: '14px 16px',
    border: '1px solid var(--line)',
    borderRadius: 10,
    marginBottom: 12,
    cursor: 'pointer',
  },
  checkbox: {
    width: 18,
    height: 18,
    marginTop: 2,
    accentColor: 'var(--gold)',
    flexShrink: 0,
  },
  btnRow: {
    display: 'flex',
    gap: 12,
    marginTop: 28,
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
  btnPrimary: {
    background: 'linear-gradient(135deg, var(--gold), var(--teal-bright))',
    color: 'var(--paper)',
    boxShadow: '0 8px 24px -8px rgba(68,132,209,0.5)',
  },
  btnGhost: {
    background: 'transparent',
    color: 'var(--ink)',
    border: '1px solid var(--line)',
  },
  btnSubmit: {
    background: 'linear-gradient(135deg, var(--teal-bright), var(--gold))',
    color: 'var(--paper)',
    boxShadow: '0 12px 28px -10px rgba(68,132,209,0.55)',
    flex: 1,
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
