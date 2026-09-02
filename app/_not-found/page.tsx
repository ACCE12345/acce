'use client';

import { useRouter } from 'next/navigation';

export default function NotFoundPage() {
  const router = useRouter();

  return (
    <div style={{ minHeight: '100vh', background: 'var(--paper)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 24, padding: 32 }}>
      <div style={{ width: '100%', maxWidth: 400, textAlign: 'center' }}>
        <h1 style={{ fontSize: 24, fontWeight: 600, margin: '16px 0' }}>404</h1>
        <p style={{ fontSize: 16, color: 'var(--muted)', marginBottom: '32px' }}>Page Not Found</p>
        <div style={{ display: 'flex', gap: 16, justifyContent: 'center' }}>
          <a href="/" style={{ margin: '0 auto', display: 'inline-block', padding: '10px 20px', background: 'var(--brick)', color: 'var(--ink)', borderRadius: '6px', textDecoration: 'none', fontWeight: 500 }}>Go Home</a>
          <a href="/registration" style={{ margin: '0 auto', display: 'inline-block', padding: '10px 20px', background: 'var(--gold)', color: 'var(--ink)', borderRadius: '6px', textDecoration: 'none', fontWeight: 500 }}>Register</a>
        </div>
      </div>
    </div>
  );
}