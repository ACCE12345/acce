'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

const NAV_LINKS = [
  { href: '/#about', label: 'About' },
  { href: '/#highlights', label: 'Highlights' },
  { href: '/#contact', label: 'Contact' },
  { href: '/#download-id', label: 'Download ID' },
  { href: '/admin-login', label: 'Admin' },
];

export default function Header() {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    const onScroll = () => {
      const next = window.scrollY > 40;
      setScrolled((prev) => (prev === next ? prev : next));
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  return (
    <header
      className={`site-header${scrolled ? ' scrolled' : ''}`}
    >
      <nav className="nav">
        <Link href="/" className="brand">
          <span className="brand-mark">
            <img src="/img/logo.png" alt="ACCE" />
          </span>
          ACCE(I), Warangal Centre
        </Link>

        <ul className={`nav-links${open ? ' open' : ''}`}>
          {NAV_LINKS.map((link) => {
            const isActive = pathname === link.href || (link.href.startsWith('/#') && pathname === '/');
            return (
              <li key={link.href}>
                <Link
                  href={link.href}
                  style={isActive ? { color: 'var(--gold-bright)', borderColor: 'var(--gold-bright)' } : undefined}
                >
                  {link.label}
                </Link>
              </li>
            );
          })}
        </ul>

        <div className="nav-cta">
          <Link href="/#download-id" className="btn btn-outline download-id-btn">
            Download ID
          </Link>
          <Link href="/registration" className="btn btn-red btn-ticket">
            Register<span className="hide-mobile"> Now</span>
          </Link>
          <button
            className="nav-toggle"
            aria-label="Toggle menu"
            onClick={() => setOpen((v) => !v)}
          >
            &#9776;
          </button>
        </div>
      </nav>
    </header>
  );
}
