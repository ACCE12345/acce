'use client';

import React, { useState, useRef, Suspense, useCallback, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
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
    if (record.paymentStatus !== 'verified') {
      showToast('ID card download requires payment verification by an admin.', 'error');
      return;
    }
    try {
      showToast('Preparing your ID card image…');
      await captureElementAsImage(cardRef.current, `${record?.regId || 'id'}-idcard.png`);
      showToast('ID card downloaded.', 'success');
    } catch {
      showToast('Could not generate the ID card image. Please try again.', 'error');
    }
  };

  const handleDownloadQR = useCallback(async () => {
    if (!record) return;
    if (record.paymentStatus !== 'verified') {
      showToast('QR code download requires payment verification by an admin.', 'error');
      return;
    }
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
            <span style={{ color: '#8A8E96', fontSize: 14 }}>Loading…</span>
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
            <h2 style={{ fontSize: 22, fontFamily: 'var(--font-display)', margin: '0 0 10px' }}>
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

  return (
    <>
      {banner}
      <div style={styles.shell}>
        <div ref={cardRef} style={styles.idcard}>
          <div style={styles.idcardHead}>
            <span style={styles.brandMark}>
              <Image src="/img/logo.png" alt="ACCE" width={34} height={34} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            </span>
            <h3 style={styles.headTitle}>ACCE · Convergence Summit</h3>
            <div style={styles.photoCircle}>
              {record.photo && <img src={record.photo} alt={record.fullName} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />}
            </div>
          </div>

          <div style={styles.idcardBody}>
            <div style={styles.name}>{record.fullName}</div>
            <div style={styles.role}>{record.isACCEMember ? 'ACCE Member — Delegate' : 'Delegate'}</div>

            <div style={styles.details}>
              <DetailRow label="Reg. ID" value={record.regId} />
              <DetailRow label="Email" value={record.email} />
              <DetailRow label="Phone" value={`+91 ${record.mobile}`} />
            </div>

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

            <div style={{ marginTop: 14, textAlign: 'center', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, fontSize: 10, color: '#8A8E96', fontFamily: 'var(--font-mono)' }}>
              Powered by
              <img src="/img/a+.png" alt="A+ Tech Services" style={{ height: 14, width: 'auto', verticalAlign: 'middle' }} />
              A+ Tech Services
            </div>
          </div>

          <div style={styles.idcardStatus}>Registered Participant</div>
        </div>

          <div style={styles.actions}>
            <button className="btn btn-gold" onClick={handleDownloadCard} disabled={record.paymentStatus !== 'verified'}>Download ID Card</button>
            <button className="btn" style={{ background: 'transparent', color: 'var(--ink)', border: '1px solid var(--line)' }} onClick={handleDownloadQR} disabled={record.paymentStatus !== 'verified'}>
              Download QR Code
          </button>
          <Link href="/verify" className="btn btn-dark" style={{ textDecoration: 'none' }}>Verify a Badge</Link>
        </div>
      </div>
    </>
  );
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12.5, padding: '6px 0' }}>
      <span style={{ color: '#8A8E96', fontFamily: 'var(--font-mono)', textTransform: 'uppercase', fontSize: 10.5, letterSpacing: '0.05em' }}>{label}</span>
      <span style={{ fontWeight: 600, textAlign: 'right' }}>{value}</span>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  pageBanner: {
    background: 'linear-gradient(160deg, var(--ink-softer) 0%, var(--ink) 55%, #061A33 100%)',
    color: 'var(--paper)',
    padding: '150px 0 60px',
    position: 'relative',
    overflow: 'hidden',
  },
  breadcrumb: {
    fontFamily: 'var(--font-mono)',
    fontSize: 12,
    color: '#8FA9CC',
    marginBottom: 16,
  },
  bannerTitle: {
    fontFamily: 'var(--font-display)',
    fontSize: 'clamp(30px, 4vw, 48px)',
    color: 'var(--paper)',
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
    background: '#fff',
    border: '1px solid var(--line)',
    borderRadius: 20,
    boxShadow: 'var(--glow)',
    padding: '50px 44px',
    textAlign: 'center',
    maxWidth: 440,
    width: '100%',
  },
  idcard: {
    width: 380,
    maxWidth: '92vw',
    background: '#fff',
    borderRadius: 'var(--radius-lg)',
    overflow: 'hidden',
    boxShadow: 'var(--glow)',
  },
  idcardHead: {
    background: 'linear-gradient(135deg, var(--ink), var(--ink-softer))',
    color: 'var(--paper)',
    padding: '22px 26px 40px',
    textAlign: 'center',
    position: 'relative',
  },
  brandMark: {
    display: 'inline-flex',
    width: 34,
    height: 34,
    borderRadius: '50%',
    border: '1.5px solid var(--gold)',
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
    background: 'var(--ink)',
    marginBottom: 10,
  },
  headTitle: {
    color: 'var(--paper)',
    fontSize: 15,
    letterSpacing: '0.06em',
    textTransform: 'uppercase' as const,
    fontFamily: 'var(--font-mono)',
    margin: 0,
  },
  photoCircle: {
    width: 100,
    height: 100,
    borderRadius: '50%',
    border: '4px solid #fff',
    background: '#eee',
    position: 'absolute',
    left: '50%',
    bottom: -50,
    transform: 'translateX(-50%)',
    overflow: 'hidden',
    boxShadow: '0 6px 18px rgba(0,0,0,.25)',
  },
  idcardBody: {
    padding: '64px 28px 10px',
    textAlign: 'center',
  },
  name: {
    fontFamily: 'var(--font-display)',
    fontSize: 23,
    marginBottom: 4,
    fontWeight: 700,
  },
  role: {
    fontFamily: 'var(--font-mono)',
    fontSize: 11.5,
    color: 'var(--teal)',
    textTransform: 'uppercase' as const,
    letterSpacing: '0.06em',
  },
  details: {
    textAlign: 'left',
    marginTop: 22,
    borderTop: '1px dashed var(--line)',
    paddingTop: 18,
  },
  perfLine: {
    position: 'relative',
    height: 0,
    borderTop: '2px dashed var(--line)',
    marginTop: 22,
  },
  perfHoleLeft: {
    position: 'absolute',
    top: -9,
    left: -9,
    width: 18,
    height: 18,
    borderRadius: '50%',
    background: 'var(--paper)',
  },
  perfHoleRight: {
    position: 'absolute',
    top: -9,
    right: -9,
    width: 18,
    height: 18,
    borderRadius: '50%',
    background: 'var(--paper)',
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
    border: '1px solid var(--line)',
    borderRadius: 8,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: '#fff',
  },
  qrLabel: {
    fontFamily: 'var(--font-mono)',
    fontSize: 10,
    letterSpacing: '0.1em',
    textTransform: 'uppercase' as const,
    color: '#8A8E96',
  },
  idcardStatus: {
    background: 'linear-gradient(135deg, var(--teal), var(--teal-bright))',
    color: '#fff',
    textAlign: 'center',
    padding: 10,
    fontFamily: 'var(--font-mono)',
    fontSize: 11,
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
