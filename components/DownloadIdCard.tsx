'use client';

import { useState, useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { findRegistrationByMobile, captureElementAsImage, type Registration } from '@/lib/nexus-store';
import { useToast } from '@/lib/toast';
import QrCode from '@/components/QrCode';

export default function DownloadIdCard({ variant = 'light' }: { variant?: 'light' | 'dark' }) {
  const { showToast } = useToast();
  const [mobile, setMobile] = useState('');
  const [record, setRecord] = useState<Registration | null>(null);
  const [notFound, setNotFound] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);

  const isDark = variant === 'dark';

  const handleLookup = async () => {
    const clean = mobile.replace(/\D/g, '').slice(0, 10);
    if (!/^[6-9]\d{9}$/.test(clean)) {
      showToast('Enter a valid 10-digit Indian mobile number.', 'error');
      return;
    }
    const found = await findRegistrationByMobile(clean);
    if (found) {
      setRecord(found);
      setNotFound(false);
    } else {
      setRecord(null);
      setNotFound(true);
      showToast('No registration found for this mobile number.', 'error');
    }
  };

  const handleDownloadCard = async () => {
    if (!cardRef.current) return;
    try {
      showToast('Preparing your ID card…');
      await captureElementAsImage(cardRef.current, `${record?.regId || 'id'}-idcard.png`);
      showToast('ID card downloaded!', 'success');
    } catch {
      showToast('Could not generate ID card. Please try again.', 'error');
    }
  };

  return (
    <div style={{ width: '100%' }}>
      {/* Lookup form */}
      <div style={{
        display: 'flex', gap: 10, maxWidth: 480, margin: '0 auto',
      }}>
        <input
          type="tel"
          placeholder="Enter your 10-digit mobile number"
          value={mobile}
          onChange={(e) => setMobile(e.target.value.replace(/\D/g, '').slice(0, 10))}
          onKeyDown={(e) => e.key === 'Enter' && handleLookup()}
          maxLength={10}
          style={{
            flex: 1,
            padding: '14px 18px',
            border: `1px solid ${isDark ? 'rgba(255,255,255,0.2)' : 'var(--line)'}`,
            borderRadius: 10,
            fontSize: 15,
            fontFamily: 'var(--font-body)',
            background: isDark ? 'rgba(255,255,255,0.1)' : '#fff',
            color: isDark ? '#fff' : 'var(--ink)',
            outline: 'none',
            boxSizing: 'border-box' as const,
          }}
        />
        <button
          onClick={handleLookup}
          style={{
            padding: '14px 28px',
            borderRadius: 10,
            border: 'none',
            background: isDark ? 'var(--paper)' : 'linear-gradient(135deg, var(--gold), var(--teal-bright))',
            color: isDark ? 'var(--ink)' : '#fff',
            fontFamily: 'var(--font-mono)',
            fontSize: 13,
            letterSpacing: '0.06em',
            textTransform: 'uppercase' as const,
            cursor: 'pointer',
            fontWeight: 600,
            whiteSpace: 'nowrap' as const,
          }}
        >
          Download ID Card
        </button>
      </div>

      {notFound && (
        <p style={{ textAlign: 'center', marginTop: 12, fontSize: 14, color: isDark ? '#FFB4B4' : 'var(--brick)' }}>
          No registration found. <Link href="/registration" style={{ color: isDark ? '#fff' : 'var(--gold)', textDecoration: 'underline' }}>Register now</Link>
        </p>
      )}

      {/* ID Card preview + download */}
        {record && record.paymentStatus === 'rejected' && (
          <div style={{ marginTop: 24, padding: '16px 20px', background: 'rgba(255,184,38,0.1)', borderRadius: 10, textAlign: 'center' }}>
            <p style={{ color: 'var(--gold)', fontFamily: 'var(--font-mono)', fontSize: 13, textTransform: 'uppercase', letterSpacing: '0.05em', margin: 0 }}>
              ID card not available — payment rejected
            </p>
          </div>
        )}

        {record && record.paymentStatus !== 'rejected' && (
          <div style={{ marginTop: 24 }}>
            <div ref={cardRef} style={{
              width: 380, maxWidth: '100%', background: '#fff', borderRadius: 16,
              overflow: 'hidden', boxShadow: '0 20px 60px -16px rgba(10,38,71,0.35)', margin: '0 auto',
            }}>
              {/* Card header */}
              <div style={{
                background: 'linear-gradient(135deg, #0A2647, #1D4E86)', color: '#fff',
                padding: '22px 26px 40px', textAlign: 'center', position: 'relative',
              }}>
                <div style={{
                  width: 34, height: 34, borderRadius: '50%', border: '1.5px solid #4484D1',
                  display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                  overflow: 'hidden', background: '#0A2647', marginBottom: 10,
                }}>
                  <Image src="/img/logo.png" alt="ACCE" width={34} height={34} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                </div>
                <h3 style={{ color: '#fff', fontSize: 15, letterSpacing: '0.06em', textTransform: 'uppercase' as const, fontFamily: 'var(--font-mono)', margin: 0 }}>
                  ACCE · Build Expo
                </h3>
                <div style={{
                  width: 100, height: 100, borderRadius: '50%', border: '4px solid #fff',
                  background: '#eee', position: 'absolute', left: '50%', bottom: -50,
                  transform: 'translateX(-50%)', overflow: 'hidden', boxShadow: '0 6px 18px rgba(0,0,0,.25)',
                }}>
                  {record.photo && <img src={record.photo} alt={record.fullName} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />}
                </div>
              </div>

              {/* Card body */}
              <div style={{ padding: '64px 28px 10px', textAlign: 'center' }}>
                <div style={{ fontFamily: 'var(--font-display)', fontSize: 23, marginBottom: 4, fontWeight: 700 }}>{record.fullName}</div>
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11.5, color: '#2E63A8', textTransform: 'uppercase' as const, letterSpacing: '0.06em' }}>
                  {record.isACCEMember ? 'ACCE Member — Delegate' : 'Delegate'}
                </div>
                <div style={{ textAlign: 'left', marginTop: 22, borderTop: '1px dashed rgba(10,38,71,0.12)', paddingTop: 18 }}>
                  {[
                    ['Reg. ID', record.regId],
                    ['Email', record.email],
                    ['Phone', `+91 ${record.mobile}`],
                  ].map(([label, value]) => (
                    <div key={label} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12.5, padding: '6px 0' }}>
                      <span style={{ color: '#8A8E96', fontFamily: 'var(--font-mono)', textTransform: 'uppercase' as const, fontSize: 10.5, letterSpacing: '0.05em' }}>{label}</span>
                      <span style={{ fontWeight: 600, textAlign: 'right' }}>{value}</span>
                    </div>
                  ))}
                </div>
                <div style={{ position: 'relative', height: 0, borderTop: '2px dashed rgba(10,38,71,0.12)', marginTop: 22 }}>
                  <span style={{ position: 'absolute', top: -9, left: -9, width: 18, height: 18, borderRadius: '50%', background: '#fff' }} />
                  <span style={{ position: 'absolute', top: -9, right: -9, width: 18, height: 18, borderRadius: '50%', background: '#fff' }} />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column' as const, alignItems: 'center', gap: 8, padding: '22px 0 26px' }}>
                  <div style={{
                    width: 120, height: 120, border: '1px solid rgba(10,38,71,0.12)', borderRadius: 8,
                    display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#fff',
                  }}>
                    <QrCode text={record.regId} size={110} />
                  </div>
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, letterSpacing: '0.1em', textTransform: 'uppercase' as const, color: '#8A8E96' }}>Scan to verify</span>
                </div>
              </div>
              <div style={{
                background: 'linear-gradient(135deg, #2E63A8, #4484D1)', color: '#fff', textAlign: 'center',
                padding: 10, fontFamily: 'var(--font-mono)', fontSize: 11, letterSpacing: '0.1em', textTransform: 'uppercase' as const,
              }}>
                Registered Participant
              </div>
            </div>

            {/* Action buttons - only show after payment verified */}
            <div style={{ display: 'flex', gap: 12, marginTop: 20, justifyContent: 'center', flexWrap: 'wrap' }}>
              <button
                className="btn btn-gold"
                onClick={handleDownloadCard}
                style={{ minWidth: 180, justifyContent: 'center' }}
              >
                Download ID Card
              </button>
              <Link
                href={`/id-card?regId=${record.regId}`}
                className="btn"
                style={{ textDecoration: 'none', background: 'transparent', color: 'var(--ink)', border: '1px solid var(--line)', minWidth: 160, justifyContent: 'center' }}
              >
                View Full Card
              </Link>
            </div>
            <div style={{ marginTop: 24, textAlign: 'center', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, fontSize: 12, color: '#8A8E96' }}>
              Powered by
              <img src="/img/a+.png" alt="A+ Tech Services" style={{ height: 18, width: 'auto', verticalAlign: 'middle' }} />
              A+ Tech Services
            </div>
          </div>
        )}
    </div>
  );
}
