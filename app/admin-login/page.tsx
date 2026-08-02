'use client';

import React, { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { login } from '@/lib/nexus-store';
import { useToast } from '@/lib/toast';

export default function AdminLoginPage() {
  const router = useRouter();
  const { showToast } = useToast();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      setLoading(true);
      const ok = await login(email.trim(), password);
      if (ok) {
        showToast('Signed in — redirecting…', 'success');
        router.push('/admin-dashboard');
      } else {
        setLoading(false);
        showToast('Invalid email or password.', 'error');
      }
    },
    [email, password, router, showToast]
  );

  return (
    <div style={styles.shell}>
      <div style={styles.orbTopRight} />
      <div style={styles.orbBottomLeft} />

      <div style={styles.card}>
        <div style={styles.brand}>
          <span style={styles.brandMark}>
            <Image src="/img/logo.png" alt="ACCE" width={34} height={34} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          </span>
          ACCE (India)
        </div>
        <h2 style={styles.title}>Admin Dashboard</h2>
        <p style={styles.subtitle}>Sign in to manage registrations &amp; sponsorships</p>

        <form onSubmit={handleSubmit} style={{ marginTop: 26 }}>
          <div style={styles.field}>
            <label style={styles.label}>Email</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              style={styles.input}
            />
          </div>
          <div style={styles.field}>
            <label style={styles.label}>Password</label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              style={styles.input}
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="btn btn-gold"
            style={{ width: '100%', justifyContent: 'center', marginTop: 6 }}
          >
            {loading ? 'Signing In…' : 'Sign In'}
          </button>
        </form>

        <div style={styles.hint}>Use your Supabase admin credentials to sign in</div>

        <p style={{ marginTop: 20, textAlign: 'center' }}>
          <Link href="/" style={{ color: 'var(--gold-bright)', textDecoration: 'underline', fontSize: 14 }}>
            ← Back to site
          </Link>
        </p>
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  shell: {
    minHeight: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: 'linear-gradient(160deg, var(--ink-softer) 0%, var(--ink) 55%, #061A33 100%)',
    padding: 20,
    position: 'relative',
    overflow: 'hidden',
  },
  orbTopRight: {
    position: 'absolute',
    width: 560,
    height: 560,
    top: -220,
    right: -160,
    borderRadius: '50%',
    background: 'radial-gradient(circle at 50% 50%, rgba(124,172,227,0.5), transparent 70%)',
    filter: 'blur(100px)',
    opacity: 0.55,
    pointerEvents: 'none',
  },
  orbBottomLeft: {
    position: 'absolute',
    width: 480,
    height: 480,
    bottom: -220,
    left: -160,
    borderRadius: '50%',
    background: 'radial-gradient(circle at 50% 50%, rgba(68,132,209,0.38), transparent 70%)',
    filter: 'blur(100px)',
    opacity: 0.55,
    pointerEvents: 'none',
  },
  card: {
    width: '100%',
    maxWidth: 400,
    background: 'linear-gradient(160deg,rgba(29,78,134,0.55),rgba(18,59,103,0.75))',
    border: '1px solid var(--line-dark)',
    backdropFilter: 'blur(18px) saturate(160%)',
    WebkitBackdropFilter: 'blur(18px) saturate(160%)',
    borderRadius: 'var(--radius-lg)',
    padding: '44px 38px',
    color: 'var(--paper)',
    boxShadow: 'var(--glow)',
    position: 'relative',
    zIndex: 1,
  },
  brand: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    color: 'var(--paper)',
    fontFamily: 'var(--font-display)',
    fontWeight: 700,
    fontSize: 20,
    marginBottom: 8,
  },
  brandMark: {
    width: 34,
    height: 34,
    borderRadius: '50%',
    border: '1.5px solid var(--gold)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    flexShrink: 0,
  },
  title: {
    textAlign: 'center',
    color: 'var(--paper)',
    fontSize: 22,
    fontFamily: 'var(--font-display)',
    fontWeight: 700,
    marginTop: 6,
    marginBottom: 4,
  },
  subtitle: {
    textAlign: 'center',
    color: '#C8D6E8',
    fontSize: 13.5,
    margin: 0,
  },
  field: {
    marginBottom: 18,
  },
  label: {
    display: 'block',
    fontFamily: 'var(--font-mono)',
    fontSize: 11.5,
    textTransform: 'uppercase' as const,
    letterSpacing: '0.06em',
    color: '#D4D0CA',
    marginBottom: 6,
  },
  input: {
    width: '100%',
    padding: '13px 14px',
    border: '1px solid var(--line-dark)',
    borderRadius: 10,
    fontSize: 14,
    fontFamily: 'var(--font-body)',
    background: 'var(--ink)',
    color: 'var(--paper)',
    outline: 'none',
    transition: 'border-color 0.2s',
    boxSizing: 'border-box' as const,
    WebkitTextFillColor: 'var(--paper)',
  },
  hint: {
    marginTop: 20,
    padding: '12px 14px',
    background: 'rgba(124,172,227,0.14)',
    border: '1px solid rgba(124,172,227,0.32)',
    borderRadius: 10,
    fontFamily: 'var(--font-mono)',
    fontSize: 11.5,
    color: 'var(--gold-bright)',
    textAlign: 'center',
  },
};
