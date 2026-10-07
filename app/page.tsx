'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import HeroSlideshow from '@/components/HeroSlideshow';
import CountUp from '@/components/CountUp';
import Countdown from '@/components/Countdown';

const COMMITTEE = [
  { name: 'Er. Mohammed Hidayath Ali', role: 'Bylaw Amendments Collegium member, ACCE(I), HQ · Convener Build Expo-2026', photo: '/img/Er_Mohammed_Hidayath_Ali.png', contact: '+91 9849453978' },
  { name: 'Er. Arra Ambadas', role: 'Chairman - ACCE(I)', photo: '/img/Er_Arra_Ambadas.png', contact: '+91 9849142419' },
  { name: 'Er. Konga Mohan', role: 'Secretary - ACCE(I)', photo: '/img/Er_Konga_Mohan.png', contact: '+91 9440171674' },
  { name: 'Er. Komakula Srinivas', role: 'Treasurer - ACCE(I)', photo: '/img/Er_Komakula_Srinivas.png', contact: '+91 9848920959' },
  { name: 'Er. Pabba Chandra Mohan', role: 'MC Member', photo: '/img/Er_P_Chandra_Mohan.png', contact: '+91 9059844884' },
  { name: 'Er. Adigoppula Jagadeeshwar', role: 'MC Member', photo: '/img/Er_A_Jagadeeshwar.png', contact: '+91 9704806686' },
  { name: 'Dr. Syed Riyaz', role: 'MC Member', photo: '/img/Er_Syed_Riyaz.png', contact: '+91 9701010244' },
  { name: 'Er. Rakesh Janagam', role: 'MC Member', photo: '/img/Er_Rakesh_Janagam.png', contact: '+91 7207721690' },
];

export default function Home() {
  const [showPoster, setShowPoster] = useState(false);

  useEffect(() => {
    // Show once per session so it doesn't annoy on every navigation
    try {
      if (sessionStorage.getItem('poster-seen')) return;
    } catch {}
    const timer = setTimeout(() => setShowPoster(true), 800);
    return () => clearTimeout(timer);
  }, []);

  // Lock body scroll + close on ESC while popup is open
  useEffect(() => {
    if (!showPoster) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setShowPoster(false);
    };
    window.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener('keydown', onKey);
    };
  }, [showPoster]);

  const closePoster = () => {
    setShowPoster(false);
    try {
      sessionStorage.setItem('poster-seen', '1');
    } catch {}
  };

  return (
    <>
      {/* ── Poster Popup ── */}
      {showPoster && (
        <div
          className="poster-popup-overlay"
          role="dialog"
          aria-modal="true"
          aria-label="ACCE Build Expo 2026 poster"
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 9999,
            background: 'rgba(10,38,71,0.78)',
            backdropFilter: 'blur(6px)',
            WebkitBackdropFilter: 'blur(6px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '16px',
            animation: 'gpuFadeIn 0.3s ease',
            willChange: 'opacity',
            transform: 'translateZ(0)',
          }}
          onClick={closePoster}
        >
          <div
            className="poster-popup-card"
            style={{
              position: 'relative',
              maxWidth: 420,
              width: '100%',
              maxHeight: '90vh',
              display: 'flex',
              flexDirection: 'column',
              borderRadius: 16,
              overflow: 'hidden',
              boxShadow: '0 30px 80px -20px rgba(0,0,0,0.5)',
              border: '3px solid var(--gold)',
              background: '#0A2647',
              animation: 'gpuScaleIn 0.3s ease',
              willChange: 'transform, opacity',
              transform: 'translateZ(0)',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <button
              className="poster-popup-close"
              onClick={closePoster}
              aria-label="Close poster"
              style={{
                position: 'absolute',
                top: 10,
                right: 10,
                zIndex: 10,
                width: 38,
                height: 38,
                borderRadius: '50%',
                border: '1px solid rgba(255,255,255,0.35)',
                background: 'rgba(10,38,71,0.9)',
                color: '#fff',
                fontSize: 20,
                fontWeight: 700,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                lineHeight: 1,
                boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
                transition: 'transform 0.15s ease',
              }}
            >
              ×
            </button>
            <div style={{ overflowY: 'auto', maxHeight: 'calc(90vh - 64px)' }}>
              <img
                src="/img/poste.jpeg"
                alt="ACCE Build Expo 2026 - Event Poster"
                style={{ width: '100%', height: 'auto', display: 'block', objectFit: 'contain' }}
              />
            </div>
            <div
              style={{
                display: 'flex',
                gap: 10,
                padding: '12px 14px',
                background: '#fff',
                borderTop: '1px solid rgba(10,38,71,0.12)',
              }}
            >
              <button
                onClick={closePoster}
                className="btn btn-dark"
                style={{ flex: 1, justifyContent: 'center', minHeight: 48 }}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
      {/* ── Hero ── */}
      <section className="hero">
        <HeroSlideshow />
        <div className="hero-overlay" />
        <div className="container hero-content" style={{ justifyContent: 'center', textAlign: 'center' }}>
          <div className="hero-text" style={{ textAlign: 'center', flex: '1 1 100%', maxWidth: 900, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <h1 style={{ textAlign: 'center', color: '#E06050', fontSize: 'clamp(28px, 4.5vw, 52px)', lineHeight: 1.1, textShadow: '0 2px 12px rgba(0,0,0,0.4)', marginBottom: 8, WebkitTextStroke: '3px rgba(255,255,255,0.9)', paintOrder: 'stroke fill' }}>Association of Consulting Civil Engineers (India), Warangal Centre</h1>
          </div>
        </div>
      </section>

      {/* ── Stats ── */}
      <section className="hero-stats-actions">
        <div className="container hero-stats-actions-inner">
          <div style={{ background: 'rgba(10,38,71,0.55)', backdropFilter: 'blur(10px)', WebkitBackdropFilter: 'blur(10px)', borderRadius: 20, padding: '28px 32px', border: '1px solid rgba(255,255,255,0.18)' }}>
            <div style={{ textAlign: 'center' }}>
              <span style={{ fontFamily: 'var(--font-display)', fontWeight: 900, fontSize: 'clamp(18px,2.6vw,26px)', color: '#FFD166', letterSpacing: '0.02em', textShadow: '0 2px 12px rgba(0,0,0,0.5)' }}>
                Event Successfully Held
              </span>
            </div>
            <div style={{ textAlign: 'center', marginTop: 10 }}>
              <span style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 'clamp(20px,3vw,28px)', color: '#fff', textShadow: '0 2px 10px rgba(0,0,0,0.4)' }}>
                Event Memories
              </span>
            </div>
            <div style={{ display: 'flex', gap: 14, justifyContent: 'center', flexWrap: 'wrap', marginTop: 14 }}>
              <Link href="/memories?day=day1" className="btn" style={{ display: 'inline-flex', padding: '16px 44px', fontSize: 15, borderRadius: 999, background: '#122C4A', color: '#fff', border: '2px solid rgba(255,255,255,0.35)', boxShadow: '0 14px 34px -10px rgba(0,0,0,0.5)' }}>
                Day 1
              </Link>
              <Link href="/memories?day=day2" className="btn" style={{ display: 'inline-flex', padding: '16px 44px', fontSize: 15, borderRadius: 999, background: '#122C4A', color: '#fff', border: '2px solid rgba(255,255,255,0.35)', boxShadow: '0 14px 34px -10px rgba(0,0,0,0.5)' }}>
                Day 2
              </Link>
            </div>
          </div>
          <div className="hero-meta" style={{ marginTop: 28 }}>
            <div className="hero-stat">
              <span className="hero-stat-label">Delegates</span>
              <span className="hero-stat-number"><CountUp end={10000} suffix="+" /></span>
            </div>
            <div className="hero-stat">
              <span className="hero-stat-label">Partner Brands</span>
              <span className="hero-stat-number"><CountUp end={100} suffix="+" /></span>
            </div>
          </div>
        </div>
      </section>

      {/* ── Poster ── */}
      <section className="poster-section" onClick={() => setShowPoster(true)} role="button" tabIndex={0} onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') setShowPoster(true); }}>
        <div className="container poster-section-inner">
          <div className="hero-poster-card">
            <img src="/img/poste.jpeg" alt="ACCE Build Expo 2026 - Event Poster" />
          </div>
        </div>
      </section>

      {/* ── About ── */}
      <section className="section" id="about">
        <div className="container intro-grid">
          <div>
            <span className="eyebrow">About Build Expo 2026</span>
            <h2 style={{ fontSize: 'clamp(30px,3.6vw,42px)', marginTop: 18 }}>
              Where Technology, Innovation &amp; Industry Converge
            </h2>
            <p style={{ marginTop: 16, fontSize: 'clamp(14px,2vw,16px)', lineHeight: 1.7 }}>
              ACCE(India) Build Expo 2026 was held on 25–26 September 2026, bringing together 10,000+ consulting engineers, architects, builders, and decision-makers across Telangana and beyond.
            </p>
          </div>
          <ul className="about-list">
            <li>
              <span className="about-num">01</span>
              <div>
                <h4>Built for Industry Leaders</h4>
                <p>
                  A high-impact platform designed for Consulting Engineers, Architects,
                  Builders, Contractors, Developers, Consultants, and Decision-Makers —
                  bringing the professionals who shape the built environment into one
                  powerful ecosystem.
                </p>
              </div>
            </li>
            <li>
              <span className="about-num">02</span>
              <div>
                <h4>Where Ideas Become Opportunities</h4>
                <p>
                  Go beyond exhibitions and discover meaningful connections, expert
                  insights, strategic partnerships, and real business opportunities
                  through focused interactions with leading professionals and industry
                  experts.
                </p>
              </div>
            </li>
            <li>
              <span className="about-num">03</span>
              <div>
                <h4>Experience Innovation First-Hand</h4>
                <p>
                  Explore the latest construction technologies, materials, equipment,
                  products, and smart solutions from leading brands — designed to
                  inspire, transform, and accelerate the future of the construction
                  industry.
                </p>
              </div>
            </li>
            <li>
              <span className="about-num">04</span>
              <div>
                <h4>Connect. Collaborate. Grow.</h4>
                <p>
                  Build valuable relationships with industry leaders, innovators,
                  manufacturers, developers, and professionals from across Telangana
                  and beyond, creating opportunities that extend well beyond the Expo.
                </p>
              </div>
            </li>
            <li>
              <span className="about-num">05</span>
              <div>
                <h4>The Future of Construction, Under One Roof</h4>
                <p>
                  Experience two powerful days of technology, innovation, knowledge,
                  networking, and business — all converging on one platform to shape the
                  next generation of the built environment.
                </p>
              </div>
            </li>
          </ul>
        </div>
      </section>

      {/* ── Committee ── */}
      <section className="section section-alt" id="committee">
        <div className="container">
          <div className="section-head">
            <span className="eyebrow">Committee</span>
            <h2>Meet the Leadership</h2>
          </div>
          <div className="committee-grid">
            {COMMITTEE.map((m) => (
              <div className="member-card" key={m.name}>
                <div className="member-photo">
                  <Image src={m.photo} alt={m.name} width={100} height={100} />
                </div>
                <h4 className="member-name">{m.name}</h4>
                <p className="member-role">{m.role}</p>
                {m.contact && <p className="member-contact" style={{ fontSize: 13, color: '#5C7086', marginTop: 4 }}>{m.contact}</p>}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Highlights ── */}
      <section className="section section-alt" id="highlights">
        <div className="container">
          <div className="section-head">
            <span className="eyebrow">Event Highlights</span>
            <h2>What Two Days Actually Looks Like</h2>
          </div>
        </div>
        <div className="container" style={{ padding: '0 28px' }}>
          <div className="highlight-grid">
            <div className="highlight-card">
              <span className="tag">01</span>
              <h4>Discover What&apos;s Next</h4>
              <p>
                Experience the latest construction technologies, innovative materials,
                advanced equipment, and smart solutions transforming the industry.
              </p>
            </div>
            <div className="highlight-card">
              <span className="tag">02</span>
              <h4>Meet the People Who Matter</h4>
              <p>
                Connect with 10,000+ Consulting Engineers, Architects, Builders,
                Contractors, Developers, and Industry Decision-Makers to build powerful
                professional and business relationships.
              </p>
            </div>
            <div className="highlight-card">
              <span className="tag">03</span>
              <h4>Turn Connections into Opportunities</h4>
              <p>
                Engage in expert discussions, knowledge exchange, strategic networking,
                and business opportunities designed to create meaningful collaborations
                and accelerate growth.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ── CTA Banner ── */}
      <section className="cta-banner">
        <div className="container">
          <h2>Thank you for making Build Expo 2026 a success.</h2>
          <p>
            The event was held on 25–26 September 2026 in Warangal, Telangana.
          </p>
        </div>
      </section>

      {/* ── Contact ── */}
      <section className="section" id="contact">
        <div className="container contact-grid">
          <div>
            <span className="eyebrow">Contact</span>
            <h2 style={{ marginTop: 16 }}>Get in touch with the team</h2>
            <div className="contact-card">
              <span>For Queries</span>
              <strong>acceiwarangal@gmail.com</strong>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
