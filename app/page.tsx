'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import HeroSlideshow from '@/components/HeroSlideshow';
import HeroActions from '@/components/HeroActions';
import DownloadIdCard from '@/components/DownloadIdCard';

const COMMITTEE = [
  { name: 'Er. Mohammed Hidayath Ali', role: 'Chairman - ACCE(I)', photo: '/img/Er_Mohammed_Hidayath_Ali.png' },
  { name: 'Er. Arra Ambadas', role: 'Chairman (Elect) - ACCE(I)', photo: '/img/Er_Arra_Ambadas.png' },
  { name: 'Er. Konga Mohan', role: 'Secretary (Elect) - ACCE(I)', photo: '/img/Er_Konga_Mohan.png' },
  { name: 'Er. Komakula Srinivas', role: 'Treasurer (Elect) - ACCE(I)', photo: '/img/Er_Komakula_Srinivas.png' },
  { name: 'Er. P. Chandra Mohan', role: 'MC Member', photo: '/img/Er_P_Chandra_Mohan.png' },
  { name: 'Er. A. Jagadeeshwar', role: 'MC Member', photo: '/img/Er_A_Jagadeeshwar.png' },
  { name: 'Er. Syed Riyaz', role: 'MC Member', photo: '/img/Er_Syed_Riyaz.png' },
  { name: 'Er. Rakesh Janagam', role: 'MC Member', photo: '/img/Er_Rakesh_Janagam.png' },
];

export default function Home() {
  const [showPoster, setShowPoster] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setShowPoster(true), 1000);
    return () => clearTimeout(timer);
  }, []);

  return (
    <>
      {/* ── Poster Popup ── */}
      {showPoster && (
        <div
          className="poster-popup-overlay"
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 9999,
            background: 'rgba(10,38,71,0.75)',
            backdropFilter: 'blur(6px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 'env(safe-area-inset-top, 16px) 16px env(safe-area-inset-bottom, 16px)',
            animation: 'fadeIn 0.3s ease',
          }}
          onClick={() => setShowPoster(false)}
        >
          <div
            className="poster-popup-card"
            style={{
              position: 'relative',
              maxWidth: 420,
              width: '100%',
              maxHeight: 'calc(100vh - 32px)',
              borderRadius: 16,
              overflow: 'hidden',
              boxShadow: '0 30px 80px -20px rgba(0,0,0,0.5)',
              border: '3px solid var(--gold)',
              animation: 'scaleIn 0.3s ease',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <button
              className="poster-popup-close"
              onClick={() => setShowPoster(false)}
              aria-label="Close poster"
              style={{
                position: 'absolute',
                top: 10,
                right: 10,
                zIndex: 10,
                width: 40,
                height: 40,
                borderRadius: '50%',
                border: 'none',
                background: 'rgba(10,38,71,0.9)',
                color: '#fff',
                fontSize: 22,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                lineHeight: 1,
                boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
                transition: 'transform 0.15s ease',
              }}
            >
              close
            </button>
            <Image
              src="/img/poste.jpeg"
              alt="ACCE Convergence Summit 2026 - Event Poster"
              width={420}
              height={595}
              style={{ width: '100%', height: 'auto', display: 'block' }}
              priority
            />
          </div>
        </div>
      )}
      {/* ── Hero ── */}
      <section className="hero">
        <HeroSlideshow />
        <div className="hero-overlay" />
        <div className="container hero-content" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 48, flexWrap: 'wrap', textAlign: 'left', maxWidth: 1100 }}>
          <div style={{ flex: '1 1 480px', minWidth: 300 }}>
                        <span className="hero-kicker" style={{ color: '#D45048', fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 18, letterSpacing: '0.04em', textTransform: 'none' }}>25–26 Sep 2026 · Warangal, Telangana, IN</span>
            <h1 style={{ textAlign: 'left' }}>Where industry <span style={{ color: '#D14C46', fontStyle: 'italic' }}>converges</span> on what&apos;s next.</h1>
            <p className="hero-sub" style={{ textAlign: 'left', margin: '0 0 34px' }}>
              ACCE (India) gathers 4,000 builders, operators and investors for two days
              of frank conversation on technology, capital, and the decisions that shape the
              decade ahead.
            </p>
            <div className="hero-meta" style={{ justifyContent: 'flex-start', gap: 36, marginBottom: 36 }}>
              <div>Delegates<strong>4,000+</strong></div>
              <div>Sessions<strong>120</strong></div>
              <div>Partner Brands<strong>85</strong></div>
            </div>
            <HeroActions />
          </div>
          <div
            className="hero-poster"
            onClick={() => setShowPoster(true)}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') setShowPoster(true); }}
            style={{ flex: '0 0 auto', display: 'flex', justifyContent: 'center', perspective: '1000px', cursor: 'pointer' }}
          >
            <div className="hero-poster-card" style={{
              borderRadius: 16,
              overflow: 'hidden',
              boxShadow: '0 30px 80px -15px rgba(0,0,0,0.55), 0 0 40px rgba(76,163,255,0.15)',
              border: '3px solid rgba(255,255,255,0.2)',
              maxWidth: 320,
              width: '100%',
              transform: 'rotateY(-4deg)',
              transition: 'transform 0.4s ease, box-shadow 0.4s ease',
            }}>
              <Image
                src="/img/poste.jpeg"
                alt="ACCE Convergence Summit 2026 - Event Poster"
                width={320}
                height={452}
                style={{ width: '100%', height: 'auto', display: 'block', pointerEvents: 'none' }}
                priority
              />
            </div>
          </div>
        </div>
      </section>

      {/* ── About ── */}
      <section className="section" id="about">
        <div className="container intro-grid">
          <div>
            <span className="eyebrow">About the summit</span>
            <h2 style={{ fontSize: 'clamp(30px,3.6vw,42px)', marginTop: 18 }}>
              Two days. One question: what happens when every industry converges on the
              same technology curve?
            </h2>
            <div className="stat-row">
              <div className="stat"><strong>07</strong><span>Editions run</span></div>
              <div className="stat"><strong>42</strong><span>Countries represented</span></div>
              <div className="stat"><strong>9.4k</strong><span>Alumni network</span></div>
            </div>
          </div>
          <ul className="about-list">
            <li>
              <span className="about-num">01</span>
              <div>
                <h4>Built for decision-makers</h4>
                <p>
                  Curated tracks for founders, operators, engineers and capital allocators —
                  not a general-admission trade show.
                </p>
              </div>
            </li>
            <li>
              <span className="about-num">02</span>
              <div>
                <h4>Closed-door working sessions</h4>
                <p>
                  Half the agenda runs off-record: roundtables capped at 40 seats, built for
                  candor over content.
                </p>
              </div>
            </li>
            <li>
              <span className="about-num">03</span>
              <div>
                <h4>A verified badge, not a sticker</h4>
                <p>
                  Every delegate pass carries a scannable credential — your registration,
                  checked in real time at every door.
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
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Highlights ── */}
      <section className="section section-alt" id="highlights">
        <div className="container">
          <div className="section-head">
            <span className="eyebrow">Event highlights</span>
            <h2>What two days actually looks like</h2>
          </div>
        </div>
        <div className="container" style={{ padding: '0 28px' }}>
          <div className="highlight-grid">
            <div className="highlight-card">
              <span className="tag">Day One</span>
              <h4>Keynote &amp; Capital Outlook</h4>
              <p>
                Opening address, macro outlook from three sovereign funds, and the
                year&apos;s first product unveilings.
              </p>
            </div>
            <div className="highlight-card">
              <span className="tag">Day Two</span>
              <h4>Closed-Door Roundtables</h4>
              <p>
                Forty-seat working sessions on infrastructure, regulation, and the
                build-vs-buy question, off the record.
              </p>
            </div>
            <div className="highlight-card">
              <span className="tag">Day Two</span>
              <h4>Founders&apos; Floor</h4>
              <p>
                120 companies on the exhibition floor, a live pitch stage, and the closing
                gala at the ACCE Warangal Centre.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ── Sponsorship ── */}
      <section className="section" id="sponsorship">
        <div className="container">
          <div className="section-head">
            <span className="eyebrow">Sponsorship</span>
            <h2>Put your brand on the floor</h2>
            <p>
              From a logo placement to a fully co-branded stage — tell us your goals and
              our partnerships desk will build a package that fits.
            </p>
          </div>
          <div className="sponsor-cta" style={{ textAlign: 'center', maxWidth: 640, margin: '0 auto' }}>
            <p style={{ color: '#3A3F4A', fontSize: 16, marginBottom: 28 }}>
              No fixed tiers, no published price list. Share what you&apos;re looking to
              achieve and we&apos;ll put together a tailored partnership — confirmed within
              two business days.
            </p>
            <Link href="/sponsorship#apply" className="btn btn-gold btn-ticket">
              Become a Sponsor
            </Link>
          </div>
        </div>
      </section>

      {/* ── CTA Banner ── */}
      <section className="cta-banner">
        <div className="container">
          <h2>Passes are moving. Yours won&apos;t wait.</h2>
          <p>
            Registration takes under three minutes — your digital badge and QR credential
            are generated instantly.
          </p>
          <Link href="/registration" className="btn btn-red">Register Now</Link>
        </div>
      </section>

      {/* ── Download ID Card by Mobile ── */}
      <section className="section" id="download-id" style={{ background: 'var(--paper-dim)' }}>
        <div className="container">
          <div className="section-head" style={{ textAlign: 'center', maxWidth: 640, margin: '0 auto 40px' }}>
            <span className="eyebrow">Download Your ID Card</span>
            <h2>Already Registered? Get Your Digital Badge</h2>
            <p>Enter your registered mobile number below to download your ACCE delegate ID card instantly.</p>
          </div>
          <DownloadIdCard variant="light" />
        </div>
      </section>

      {/* ── Contact ── */}
      <section className="section" id="contact">
        <div className="container contact-grid">
          <div>
            <span className="eyebrow">Contact</span>
            <h2 style={{ marginTop: 16 }}>Questions before you register?</h2>
            <div className="contact-card">
              <span>Delegate queries</span>
              <strong>delegates@acceindia.org</strong>
            </div>
            <div className="contact-card">
              <span>Sponsorship desk</span>
              <strong>partners@acceindia.org</strong>
            </div>
            <div className="contact-card">
              <span>Venue</span>
              <strong>ACCE Warangal Centre, Warangal, Telangana</strong>
            </div>
          </div>
          <form className="contact-form">
            <div className="field">
              <label htmlFor="cName">Name</label>
              <input type="text" id="cName" required />
            </div>
            <div className="field">
              <label htmlFor="cEmail">Email</label>
              <input type="email" id="cEmail" required />
            </div>
            <div className="field">
              <label htmlFor="cMsg">Message</label>
              <textarea id="cMsg" rows={4} required />
            </div>
            <button type="submit" className="btn btn-dark">Send Message</button>
          </form>
        </div>
      </section>
    </>
  );
}
