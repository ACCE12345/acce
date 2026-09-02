'use client';

import { H1, P, A } from '@/components/ui';
import { Loader2, X } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function NotFoundPage() {
  const router = useRouter();

  return (
    <div style={{
      minHeight: '100vh',
      background: 'var(--paper)',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 24,
      padding: 32,
    }}>
      <div style={{ width: '100%', maxWidth: 400, textAlign: 'center' }}>
        <Loader2 style={{ width: 80, height: 80, color: 'var(--ink)' }} />
        <h1 style={{ fontSize: 24, fontWeight: 600, margin: '16px 0' }}>404</h1>
        <p style={{ fontSize: 16, color: 'var(--muted)', marginBottom: '32px' }}>
          Page Not Found
        </p>
        <div style={{ display: 'flex', gap: 16, justifyContent: 'center' }}>
          <A
            href="/"
            style={{
              color: 'var(--ink)',
              textDecoration: 'none',
              background: 'var(--brick)',
              padding: '10px 20px',
              borderRadius: '6px',
              fontWeight: 500,
            }>
              Go Home
          </A>
          <A
            href="/registration"
            style={{
              color: 'var(--brick)',
              textDecoration: 'none',
              background: 'var(--gold)',
              padding: '10px 20px',
              borderRadius: '6px',
              fontWeight: 500,
            }>
              Register
            </A>
        </div>
      </div>
    </div>
  );
}