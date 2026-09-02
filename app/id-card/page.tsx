'use client';

import React, { useState, useRef, Suspense, useCallback, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { findRegistration, captureElementAsImage } from '@/lib/nexus-store';
import { useToast } from '@/lib/toast';
import type { Registration } from '@/lib/nexus-store';
import QrCode from '@/components/QrCode';
import QRCodeLib from 'qrcode';

export default function IdCardPage() {
  return (
    <Suspense fallback={null}>
      <IdCardContent />
    </Suspense>
  );
}

function IdCardContent() {
  const searchParams = useSearchParams();
  const { showToast } = useToast();
  const cardRef = useRef<HTMLDivElement>(null);
  const [record, setRecord] = useState<Registration | null>(null);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    const regIdParam = searchParams.get('regId');
    const regId = regIdParam || sessionStorage.getItem('nexus_last_reg');
    if (regId) {
      findRegistration(regId).then((r) => {
        setRecord(r);
        setHydrated(true);
      });
    } else {
      setHydrated(true);
    }
  }, [searchParams]);

  const handleDownloadCard = async () => {
    if (!cardRef.current || !record) return;
    try {
      showToast('Preparing your ID card image...');
      await captureElementAsImage(cardRef.current, `${record?.regId || 'id'}-idcard.png`);
      showToast('ID card downloaded.', 'success');
    } catch {
      showToast('Could not generate the ID card image. Please try again.', 'error');
    }
  };

  const handleDownloadQR = useCallback(async () => {
    if (!record) return;
    try {
      const dataUrl = await QRCodeLib.toDataURL(record.regId, {
        width: 300, margin: 2,
        color: { dark: '#0A2647', light: '#ffffff' },
      });
      const link = document.createElement('a');
      link.download = `${record.regId}-qr.png`;
      link.href = dataUrl;
      link.click();
      showToast('QR code downloaded.', 'success');
    } catch {
      showToast('Could not generate QR code.', 'error');
    }
  }, [record, showToast]);

  const banner = (
    <div style={styles.pageBanner}>
      <div style={{ maxWidth: 1180, margin: '0 auto', padding: '0 28px', position: 'relative', zIndex: 1 }}>
        <div style={styles.breadcrumb}>
          <Link href="/">Home</Link> / <Link href="/success">Registration</Link> / Digital ID Card
        </div>
        <h1 style={styles.bannerTitle}>Digital ID Card</h1>
      </div>
    </div>
  );

  if (!hydrated) {
    return (
      <>
        {banner}
        <div style={styles.shell}>
          <div style={styles.emptyCard}>
            <span style={{ color: '#8A8E96', fontSize: 14 }}>Loading...</span>
          </div>
        </div>
      </>
    );
  }

  if (!record) {
    return (
      <>
        {banner}
        <div style={styles.shell}>
          <div style={styles.emptyCard}>
            <h2 style={{ fontSize: 22, fontFamily: "'Fraunces', serif", margin: '0 0 10px' }}>
              No registration found
            </h2>
            <p style={{ color: '#8A8E96', minHeight: 22 }}>
              We couldn&apos;t find a badge for this session. Please register to generate your digital ID.
            </p>
            <Link href="/registration" className="btn btn-gold" style={{ marginTop: 16, display: 'inline-flex' }}>Go to Registration</Link>
          </div>
        </div>
      </>
    );
  }

  const members = record.members || [];

  return (
    <>
      {banner}
      <div style={styles.shell}>
        <div ref={cardRef} style={styles.idcard}>
          <div style={styles.idcardHead}>
            <div style={styles.logoRow}>
              <img src="/img/logo.png" alt="ACCE" style={{ height: 44, width: 'auto' }} />
              <img src="/img/2.jpeg" alt="Partner" style={{ height: 44, width: 'auto' }} />
            </div>
            <h3 style={styles.headTitle}>Build Expo 2026</h3>
          </div>

          <div style={styles.idcardBody}>
            <div style={styles.name}>{record.primaryName}</div>
            <div style={styles.role}>{record.category || 'Delegate'}</div>

            <div style={styles.photoWrap}>
              <div style={styles.photoCircle}>
                <span style={{ fontSize: 36, fontWeight: 700, color: '#fff', lineHeight: '74px', textAlign: 'center', display: 'block' }}>{record.primaryName.charAt(0)}</span>
              </div>
            </div>

            <div style={styles.details}>
              <DetailRow label="Reg. ID" value={record.regId} />
              <DetailRow label="Email" value={record.primaryEmail || '---'} />
              <DetailRow label="Phone" value={`+91 ${record.primaryMobile}`} />
              <DetailRow label="Total Members" value={String(record.totalMembers)} />
            </div>

            {members.length > 1 && (
              <div style={{ marginTop: 14, textAlign: 'left', borderTop: '1px dashed rgba(10,38,71,0.12)', paddingTop: 12 }}>
                <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.06em', color: '#8A8E96' }}>
                  Group Members ({members.length})
                </span>
                <div style={{ marginTop: 6, fontSize: 12 }}>
                  {members.map((m, i) => (
                    <div key={m.id} style={{ padding: '3px 0', borderBottom: '1px solid rgba(10,38,71,0.06)' }}>
                      {i + 1}. {m.memberName}
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div style={styles.perfLine}>
              <span style={styles.perfHoleLeft} />
              <span style={styles.perfHoleRight} />
            </div>

            <div style={styles.qrSection}>
              <div style={styles.qrBox}>
                <QrCode text={record.regId} size={120} />
              </div>
              <span style={styles.qrLabel}>Scan to verify</span>
            </div>
          </div>

          <div style={styles.idcardFooter}>
            <div style={styles.poweredBy}>
              Powered by{' '}
              <img src="/img/a+.png" alt="A+ Tech Services" style={{ height: 18, width: 'auto', verticalAlign: 'middle', marginLeft: 4 }} />
              {' '}A+ Tech Services
            </div>
            <div style={styles.idcardStatus}>Registered Participant</div>
          </div>
        </div>

        <div className="idcard-actions" style={styles.actions}>
          <button className="btn btn-gold" onClick={handleDownloadCard}>Download ID Card</button>
          <button className="btn" style={{ background: 'transparent', color: '#0A2647', border: '1px solid rgba(10,38,71,0.12)' }} onClick={handleDownloadQR}>
            Download QR Code
          </button>
          <Link href="/" className="btn btn-dark" style={{ textDecoration: 'none' }}>Back to Home</Link>
        </div>
      </div>
    </>
  );
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12.5, padding: '6px 0' }}>
      <span style={{ color: '#8A8E96', fontFamily: "'IBM Plex Mono', monospace", textTransform: 'uppercase', fontSize: 10.5, letterSpacing: '0.05em' }}>{label}</span>
      <span style={{ fontWeight: 600, textAlign: 'right' }}>{value}</span>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  pageBanner: {
    background: 'linear-gradient(160deg, #1D4E86 0%, #0A2647 55%, #061A33 100%)',
    color: '#FFFFFF',
    padding: '150px 0 60px',
    position: 'relative',
    overflow: 'hidden',
  },
  breadcrumb: {
    fontFamily: "'IBM Plex Mono', monospace",
    fontSize: 12,
    color: '#8FA9CC',
    marginBottom: 16,
  },
  bannerTitle: {
    fontFamily: "'Fraunces', serif",
    fontSize: 40,
    color: '#FFFFFF',
    margin: 0,
    lineHeight: 1.15,
  },
  shell: {
    minHeight: '70vh',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: 34,
    padding: '60px 20px 100px',
    position: 'relative',
    overflow: 'hidden',
  },
  emptyCard: {
    background: '#FFFFFF',
    border: '1px solid rgba(10,38,71,0.12)',
    borderRadius: 20,
    boxShadow: '0 0 0 1px rgba(124,172,227,0.22), 0 30px 70px -20px rgba(68,132,209,0.55)',
    padding: '50px 44px',
    textAlign: 'center',
    maxWidth: 440,
    width: '100%',
  },
  idcard: {
    width: 400,
    maxWidth: '92vw',
    background: '#FFFFFF',
    borderRadius: 16,
    overflow: 'hidden',
    boxShadow: '0 30px 80px -24px rgba(10,38,71,0.45), 0 10px 28px -12px rgba(68,132,209,0.3)',
  },
  idcardHead: {
    background: 'linear-gradient(135deg, #0A2647, #1D4E86)',
    color: '#FFFFFF',
    padding: '20px 28px 24px',
    textAlign: 'center',
  },
  logoRow: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 24,
    marginBottom: 10,
  },
  headTitle: {
    color: '#FFFFFF',
    fontSize: 20,
    letterSpacing: '0.08em',
    textTransform: 'uppercase' as const,
    fontFamily: "'IBM Plex Mono', monospace",
    fontWeight: 700,
    margin: 0,
  },
  photoWrap: {
    textAlign: 'center',
    margin: '14px 0',
  },
  photoCircle: {
    width: 80,
    height: 80,
    borderRadius: '50%',
    border: '3px solid #FFFFFF',
    background: 'linear-gradient(135deg, #0A2647, #1D4E86)',
    overflow: 'hidden',
    boxShadow: '0 4px 12px rgba(0,0,0,.25)',
    margin: '0 auto',
  },
  idcardBody: {
    padding: '12px 28px 10px',
    textAlign: 'center',
  },
  name: {
    fontFamily: "'Fraunces', serif",
    fontSize: 23,
    marginBottom: 4,
    fontWeight: 700,
    color: '#0A2647',
  },
  role: {
    fontFamily: "'IBM Plex Mono', monospace",
    fontSize: 11.5,
    color: '#2E63A8',
    textTransform: 'uppercase' as const,
    letterSpacing: '0.06em',
  },
  details: {
    textAlign: 'left',
    marginTop: 22,
    borderTop: '1px dashed rgba(10,38,71,0.12)',
    paddingTop: 18,
  },
  perfLine: {
    position: 'relative',
    height: 0,
    borderTop: '2px dashed rgba(10,38,71,0.12)',
    marginTop: 22,
  },
  perfHoleLeft: {
    position: 'absolute',
    top: -9,
    left: -9,
    width: 18,
    height: 18,
    borderRadius: '50%',
    background: '#FFFFFF',
  },
  perfHoleRight: {
    position: 'absolute',
    top: -9,
    right: -9,
    width: 18,
    height: 18,
    borderRadius: '50%',
    background: '#FFFFFF',
  },
  qrSection: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: 8,
    padding: '22px 0 26px',
  },
  qrBox: {
    width: 120,
    height: 120,
    border: '1px solid rgba(10,38,71,0.12)',
    borderRadius: 8,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: '#FFFFFF',
  },
  qrLabel: {
    fontFamily: "'IBM Plex Mono', monospace",
    fontSize: 10,
    letterSpacing: '0.1em',
    textTransform: 'uppercase' as const,
    color: '#8A8E96',
  },
  idcardFooter: {
    textAlign: 'center',
  },
  poweredBy: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    fontSize: 13,
    color: '#5A6270',
    fontFamily: "'IBM Plex Mono', monospace",
    fontWeight: 500,
    padding: '12px 0 6px',
  },
  idcardStatus: {
    background: 'linear-gradient(135deg, #2E63A8, #4484D1)',
    color: '#FFFFFF',
    textAlign: 'center',
    padding: 12,
    fontFamily: "'IBM Plex Mono', monospace",
    fontSize: 12,
    fontWeight: 600,
    letterSpacing: '0.1em',
    textTransform: 'uppercase' as const,
  },
  actions: {
    display: 'flex',
    gap: 14,
    flexWrap: 'wrap',
    justifyContent: 'center',
  },
};