'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

const NAV_LINKS = [
  { href: '/#about', label: 'About' },
  { href: '/#highlights', label: 'Highlights' },
  { href: '/#sponsorship', label: 'Sponsorship' },
  { href: '/#contact', label: 'Contact' },
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
          ACCE (India)
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
          <Link href="/registration" className="btn btn-red btn-ticket">
            <span className="long">Register</span> Now
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
