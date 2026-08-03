'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { findRegistration } from '@/lib/nexus-store';
import type { Registration } from '@/lib/nexus-store';
import QrCode from '@/components/QrCode';

export default function SuccessPage() {
  const [record, setRecord] = useState<Registration | null>(null);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    const regId = sessionStorage.getItem('nexus_last_reg');
    if (regId) {
      findRegistration(regId).then((r) => {
        setRecord(r);
        setHydrated(true);
      });
    } else {
      setHydrated(true);
    }
  }, []);

  if (!hydrated) {
    return (
      <>
        <div style={styles.pageBanner}>
          <div style={{ maxWidth: 1180, margin: '0 auto', padding: '0 28px', position: 'relative', zIndex: 1 }}>
            <div style={styles.breadcrumb}><Link href="/">Home</Link> / Registration</div>
            <h1 style={styles.bannerTitle}>Registration Successful</h1>
          </div>
        </div>
        <div style={styles.shell}>
          <div style={styles.card}>
            <span style={{ color: '#8A8E96', fontSize: 14 }}>Loading…</span>
          </div>
        </div>
      </>
    );
  }

  if (!record) {
    return (
      <>
        <div style={styles.pageBanner}>
          <div style={{ maxWidth: 1180, margin: '0 auto', padding: '0 28px', position: 'relative', zIndex: 1 }}>
            <div style={styles.breadcrumb}><Link href="/">Home</Link> / Registration</div>
            <h1 style={styles.bannerTitle}>Registration Successful</h1>
          </div>
        </div>
        <div style={styles.shell}>
          <div style={styles.card}>
            <h2 style={{ fontSize: 22, fontFamily: 'var(--font-display)', margin: '0 0 10px', textAlign: 'center' }}>No registration found</h2>
            <p style={{ color: '#8A8E96', textAlign: 'center' }}>We couldn&apos;t find your registration. Please register first.</p>
            <Link href="/registration" className="btn btn-gold" style={{ marginTop: 16, display: 'inline-flex' }}>Go to Registration</Link>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <div style={styles.pageBanner}>
        <div style={{ maxWidth: 1180, margin: '0 auto', padding: '0 28px', position: 'relative', zIndex: 1 }}>
          <div style={styles.breadcrumb}><Link href="/">Home</Link> / Registration</div>
          <h1 style={styles.bannerTitle}>Registration Successful</h1>
        </div>
      </div>

      <div style={styles.shell}>
        <div style={styles.card}>
          <div style={styles.successIcon}>✓</div>
          <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 26, color: 'var(--ink)', margin: '0 0 8px', textAlign: 'center' }}>
            Registration Successful
          </h2>
          <p style={{ color: '#5A6270', fontSize: 15, textAlign: 'center', margin: '0 0 6px' }}>
            Your delegate badge for ACCE (India) has been generated.
          </p>

          <div style={styles.regIdBadge}>{record.regId}</div>

          {/* QR Code for badge */}
          <div style={styles.qrSection}>
            <div style={styles.qrBox}>
              <QrCode text={record.regId} size={120} />
            </div>
            <span style={styles.qrLabel}>Scan to verify badge</span>
          </div>

          <div style={{ display: 'flex', justifyContent: 'center', margin: '16px 0' }}>
            <div style={{ width: 88, height: 88, borderRadius: '50%', overflow: 'hidden', border: '3px solid var(--teal)', background: '#eee' }}>
              {record.photo
                ? <Image src={record.photo} alt={record.fullName} width={88} height={88} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                : <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'var(--font-mono)', fontSize: 10, color: '#8A8E96' }}>No photo</div>
              }
            </div>
          </div>

          <div style={styles.summary}>
            <SummaryRow label="Name" value={record.fullName} />
            <SummaryRow label="Email" value={record.email} />
            <SummaryRow label="Phone" value={`+91 ${record.mobile}`} />
            <SummaryRow label="Amount" value={`₹${record.paymentAmount}`} />
            <SummaryRow label="Payment" value="Pending Verification" />
          </div>

          <div style={styles.actions}>
            <Link href={`/id-card?regId=${record.regId}`} className="btn btn-gold" style={{ width: '100%', justifyContent: 'center', textDecoration: 'none' }}>
              View Digital ID Card
            </Link>
            <Link href="/" className="btn" style={{ width: '100%', justifyContent: 'center', textDecoration: 'none', background: 'linear-gradient(135deg, var(--ink), var(--ink-soft))', color: 'var(--paper)' }}>
              Back to Home
            </Link>
          </div>
        </div>
      </div>
    </>
  );
}

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '9px 0', borderBottom: '1px solid var(--line)', fontSize: 14, gap: 12 }}>
      <span style={{ color: '#8A8E96', fontFamily: 'var(--font-mono)', fontSize: 12, textTransform: 'uppercase', letterSpacing: '0.05em', flexShrink: 0 }}>{label}</span>
      <span style={{ textAlign: 'right', wordBreak: 'break-word', fontWeight: 600 }}>{value}</span>
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
    minHeight: '60vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '60px 20px 100px',
    position: 'relative',
    overflow: 'hidden',
  },
  card: {
    maxWidth: 560,
    width: '100%',
    background: '#fff',
    border: '1px solid var(--line)',
    borderRadius: 'var(--radius-lg)',
    boxShadow: 'var(--glow)',
    padding: '50px 44px',
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
  regIdBadge: {
    fontFamily: 'var(--font-mono)',
    fontSize: 22,
    letterSpacing: '0.04em',
    background: 'linear-gradient(135deg, var(--ink), var(--ink-soft))',
    color: 'var(--gold-bright)',
    padding: '12px 20px',
    borderRadius: 10,
    display: 'inline-block',
    margin: '18px auto',
    wordBreak: 'break-all',
    textAlign: 'center' as const,
  },
  qrSection: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: 8,
    margin: '16px 0',
  },
  qrBox: {
    width: 120,
    height: 120,
    border: '2px solid var(--gold)',
    borderRadius: '12px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: '#fff',
    boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
  },
  qrLabel: {
    fontFamily: 'var(--font-mono)',
    fontSize: 11,
    letterSpacing: '0.1em',
    textTransform: 'uppercase' as const,
    color: '#8A8E96',
  },
  summary: {
    textAlign: 'left',
    borderTop: '1px solid var(--line)',
    marginTop: 26,
    paddingTop: 22,
  },
  actions: {
    display: 'flex',
    flexDirection: 'column',
    gap: 12,
    marginTop: 30,
  },
};
