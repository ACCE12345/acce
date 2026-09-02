'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import HeroSlideshow from '@/components/HeroSlideshow';
import HeroActions from '@/components/HeroActions';
import DownloadIdCard from '@/components/DownloadIdCard';
import CountUp from '@/components/CountUp';
import { getGalleryImages, type GalleryImage } from '@/lib/nexus-store';

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
  const [galleryImages, setGalleryImages] = useState<GalleryImage[]>([]);

  useEffect(() => {
    const timer = setTimeout(() => setShowPoster(true), 1000);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    getGalleryImages().then(setGalleryImages).catch(() => {});
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
            animation: 'gpuFadeIn 0.3s ease',
            willChange: 'opacity',
            transform: 'translateZ(0)',
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
              animation: 'gpuScaleIn 0.3s ease',
              willChange: 'transform, opacity',
              transform: 'translateZ(0)',
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
              alt="ACCE Build Expo 2026 - Event Poster"
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
            <h1 style={{ textAlign: 'left', color: '#E06050', fontSize: 'clamp(28px, 4.5vw, 52px)', lineHeight: 1.1, textShadow: '0 2px 12px rgba(0,0,0,0.4)' }}>Association of Consulting Civil Engineers (India), Warangal Centre</h1>
            <span className="hero-kicker" style={{ color: '#FFFFFF', fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 20, letterSpacing: '0.06em', textTransform: 'none', display: 'inline-block', margin: '18px 0', padding: '10px 24px', background: 'rgba(10,38,71,0.6)', borderRadius: 8, border: '1px solid rgba(255,255,255,0.15)' }}>25–26 Sep 2026 · Warangal, Telangana, IN</span>
            <p className="hero-sub" style={{ textAlign: 'left', margin: '0 0 34px' }}>
              ACCE(India) Build Expo-2026 brings together 10,000+ Consulting Engineers,
              Architects, Builders, Contractors, Decision-Makers, and Industry Leaders
              from across Telangana. It is a powerful platform for innovation,
              collaboration, networking, business growth, and knowledge exchange,
              showcasing cutting-edge technologies, breakthrough products, and emerging
              solutions that are shaping the future of construction and the built
              environment.
            </p>
            <div className="hero-meta" style={{ justifyContent: 'flex-start', gap: 40, marginBottom: 36 }}>
              <div className="hero-stat">
                <span className="hero-stat-label">Delegates</span>
                <span className="hero-stat-number"><CountUp end={10000} suffix="+" /></span>
              </div>
              <div className="hero-stat">
                <span className="hero-stat-label">Partner Brands</span>
                <span className="hero-stat-number"><CountUp end={100} suffix="+" /></span>
              </div>
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
              willChange: 'transform',
              backfaceVisibility: 'hidden',
            }}>
              <Image
                src="/img/poste.jpeg"
                alt="ACCE Build Expo 2026 - Event Poster"
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
            <span className="eyebrow">About the Build Expo-2026</span>
            <h2 style={{ fontSize: 'clamp(30px,3.6vw,42px)', marginTop: 18 }}>
              Two days. One platform. Endless possibilities. Explore what happens when
              technology, innovation, industry, and investment come together to shape the
              future of the built environment.
            </h2>
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

      {/* ── Gallery ── */}
      {galleryImages.length > 0 && (
        <section className="section" id="gallery" style={{ background: 'var(--paper)' }}>
          <div className="container">
            <div className="section-head" style={{ textAlign: 'center', maxWidth: 640, margin: '0 auto 40px' }}>
              <span className="eyebrow">Gallery</span>
              <h2>Event Moments</h2>
            </div>
            <div className="gallery-grid">
              {galleryImages.map((img) => (
                <div key={img.id} className="gallery-card">
                  <img
                    src={img.image_url}
                    alt={img.title || 'Event photo'}
                    className="gallery-img"
                  />
                  {(img.title || img.caption) && (
                    <div className="gallery-info">
                      {img.title && <div className="gallery-title">{img.title}</div>}
                      {img.caption && <div className="gallery-caption">{img.caption}</div>}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

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
              <span>For Queries</span>
              <strong>acceiwarangal@gmail.com</strong>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
