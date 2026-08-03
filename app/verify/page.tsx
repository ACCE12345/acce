'use client';

import React, { useState, useCallback, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { verifyBadge } from '@/lib/nexus-store';
import { useToast } from '@/lib/toast';

export default function VerifyPage() {
  return (
    <Suspense fallback={null}>
      <VerifyContent />
    </Suspense>
  );
}

function VerifyContent() {
  const searchParams = useSearchParams();
  const { showToast } = useToast();
  const regIdParam = searchParams.get('regId');
  const [lookupId, setLookupId] = useState(regIdParam || '');
  const [result, setResult] = useState<'valid' | 'invalid' | null>(null);
  const [record, setRecord] = useState<Record<string, unknown> | null>(null);
  const [loading, setLoading] = useState(false);

  const handleVerify = useCallback(async () => {
    if (!lookupId.trim()) {
      showToast('Enter a Registration ID first.', 'error');
      return;
    }
    setLoading(true);
    try {
      const data = await verifyBadge(lookupId.trim());
      setResult(data.valid ? 'valid' : 'invalid');
      setRecord(data.registration || null);
    } catch {
      setResult('invalid');
      setRecord(null);
    } finally {
      setLoading(false);
    }
  }, [lookupId, showToast]);

  return (
    <>
      <div style={styles.pageBanner}>
        <div style={{ maxWidth: 1180, margin: '0 auto', padding: '0 28px', position: 'relative', zIndex: 1 }}>
          <div style={styles.breadcrumb}><Link href="/">Home</Link> / Verify</div>
          <h1 style={styles.bannerTitle}>Badge Verification</h1>
          <p style={{ color: '#B8CCE4', fontSize: 15, margin: '8px 0 0' }}>
            Scan a badge QR code, or enter a Registration ID above, to verify a delegate.
          </p>
        </div>
      </div>

      <div style={styles.shell}>
        <div style={styles.card}>
          <div style={styles.lookupRow}>
            <input
              type="text"
              placeholder="Enter Registration ID e.g. REG-XXXXX"
              value={lookupId}
              onChange={(e) => setLookupId(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleVerify()}
              style={styles.lookupInput}
            />
            <button className="btn btn-dark" onClick={handleVerify} disabled={loading} style={{ whiteSpace: 'nowrap' }}>
              {loading ? 'Verifying…' : 'Verify'}
            </button>
          </div>

          {result === null && !loading && (
            <div style={{ padding: '20px 30px 40px', textAlign: 'center', color: '#8A8E96' }}>
              Scan a badge QR code, or enter a Registration ID above, to verify a delegate.
            </div>
          )}

          {result === 'invalid' && (
            <div>
              <div style={styles.statusInvalid}>
                <div style={{ fontSize: 44, marginBottom: 10 }}>✕</div>
                <h2 style={{ color: '#fff', fontSize: 22, margin: 0 }}>Invalid Registration</h2>
              </div>
              <div style={styles.verifyBody}>
                <p style={{ textAlign: 'center', color: '#8A8E96' }}>
                  No registration found for <strong>{lookupId}</strong>. Double-check the ID or ask the delegate to show their confirmation.
                </p>
              </div>
            </div>
          )}

          {result === 'valid' && record && (
            <div>
              <div style={styles.statusValid}>
                <div style={{ fontSize: 44, marginBottom: 10 }}>✓</div>
                <h2 style={{ color: '#fff', fontSize: 22, margin: 0 }}>Valid Registration</h2>
              </div>
              <div style={styles.verifyBody}>
                <SummaryRow label="Name" value={record.full_name as string} />
                <SummaryRow label="Reg. ID" value={record.reg_id as string} />
                <SummaryRow label="Check-In" value={record.checked_in ? `Checked in${record.checked_in_at ? ' · ' + new Date(record.checked_in_at as string).toLocaleString() : ''}` : 'Not checked in'} />
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid var(--line)', fontSize: 14 }}>
      <span style={{ color: '#8A8E96', fontFamily: 'var(--font-mono)', fontSize: 12, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{label}</span>
      <span style={{ fontWeight: 600 }}>{value}</span>
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
    justifyContent: 'center',
    alignItems: 'flex-start',
    padding: '60px 20px 100px',
    position: 'relative',
    overflow: 'hidden',
  },
  card: {
    maxWidth: 440,
    width: '100%',
    background: '#fff',
    borderRadius: 'var(--radius-lg)',
    boxShadow: 'var(--glow)',
    overflow: 'hidden',
    textAlign: 'center',
  },
  lookupRow: {
    padding: 30,
    display: 'flex',
    gap: 10,
  },
  lookupInput: {
    flex: 1,
    padding: '13px 14px',
    border: '1px solid var(--line)',
    borderRadius: 3,
    fontFamily: 'var(--font-mono)',
    fontSize: 13,
  },
  statusValid: {
    padding: '40px 30px 26px',
    background: 'linear-gradient(160deg, var(--teal), var(--teal-bright))',
    color: '#fff',
  },
  statusInvalid: {
    padding: '40px 30px 26px',
    background: 'linear-gradient(160deg, var(--brick), #A11D2E)',
    color: '#fff',
  },
  verifyBody: {
    padding: '28px 30px 36px',
    textAlign: 'left',
  },
};
