import type { Metadata } from 'next';
import { Fraunces, Public_Sans, IBM_Plex_Mono } from 'next/font/google';
import { ToastProvider } from '@/lib/toast';
import ConditionalChrome from '@/components/ConditionalChrome';
import './globals.css';

const fraunces = Fraunces({
  subsets: ['latin'],
  variable: '--font-display',
  display: 'swap',
  weight: ['500', '600', '700', '900'],
});

const publicSans = Public_Sans({
  subsets: ['latin'],
  variable: '--font-body',
  display: 'swap',
  weight: ['400', '500', '600', '700'],
});

const ibmPlexMono = IBM_Plex_Mono({
  subsets: ['latin'],
  variable: '--font-mono',
  display: 'swap',
  weight: ['400', '500', '600'],
});

export const metadata: Metadata = {
  title: 'ACCE (India) — Warangal Centre',
  description:
    'ACCE (India) Warangal Centre: a two-day leadership summit on the build of technology, capital and industry.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${fraunces.variable} ${publicSans.variable} ${ibmPlexMono.variable}`} suppressHydrationWarning>
      <body>
        <ToastProvider>
          <ConditionalChrome>
            {children}
          </ConditionalChrome>
        </ToastProvider>
      </body>
    </html>
  );
}
