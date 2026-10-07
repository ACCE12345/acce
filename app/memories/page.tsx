'use client';

import { useState, useEffect, useCallback, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { DAY1_PHOTOS, DAY2_PHOTOS, DAY1_ALBUM_URL, DAY2_ALBUM_URL } from '@/lib/memories';

type DayId = 'day1' | 'day2' | 'more';

const DAYS: { id: DayId; label: string; date: string; photos: string[]; albumUrl: string }[] = [
  { id: 'day1', label: 'Day 1', date: '25 September 2026', photos: DAY1_PHOTOS, albumUrl: DAY1_ALBUM_URL },
  { id: 'day2', label: 'Day 2', date: '26 September 2026', photos: DAY2_PHOTOS, albumUrl: DAY2_ALBUM_URL },
  { id: 'more', label: 'More', date: 'Event Video', photos: [], albumUrl: '' },
];

export default function MemoriesPage() {
  return (
    <Suspense fallback={null}>
      <MemoriesInner />
    </Suspense>
  );
}

function MemoriesInner() {
  const searchParams = useSearchParams();
  const initialDay = searchParams.get('day') === 'day2' ? 'day2' : 'day1';
  const [day, setDay] = useState<DayId>(initialDay);
  const [active, setActive] = useState<number | null>(null);

  const photos = DAYS.find((d) => d.id === day)?.photos ?? [];
  const dayLabel = DAYS.find((d) => d.id === day)?.label ?? '';
  const albumUrl = DAYS.find((d) => d.id === day)?.albumUrl ?? '';

  const close = useCallback(() => setActive(null), []);
  const step = useCallback(
    (dir: 1 | -1) => {
      setActive((cur) =>
        cur === null ? cur : (cur + dir + photos.length) % photos.length
      );
    },
    [photos.length]
  );

  useEffect(() => {
    setActive(null);
  }, [day]);

  useEffect(() => {
    if (active === null) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') close();
      if (e.key === 'ArrowRight') step(1);
      if (e.key === 'ArrowLeft') step(-1);
    };
    window.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener('keydown', onKey);
    };
  }, [active, close, step]);

  return (
    <>
      {/* ── Banner : Event Memories is the main heading ── */}
      <section
        style={{
          background: 'linear-gradient(160deg,#0A2647 0%,#1D4E86 100%)',
          padding: '150px 0 60px',
          textAlign: 'center',
          color: '#fff',
        }}
      >
        <div className="container" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <span
            style={{
              display: 'inline-block',
              fontFamily: 'var(--font-mono)',
              fontSize: 12,
              letterSpacing: '0.14em',
              textTransform: 'uppercase',
              color: 'var(--gold-bright)',
              marginBottom: 12,
            }}
          >
            Build Expo 2026 · Warangal
          </span>
          <h1
            style={{
              color: '#fff',
              fontSize: 'clamp(32px,5vw,50px)',
              margin: '0 0 10px',
            }}
          >
            Event Memories
          </h1>
          <p style={{ color: '#D4E4F7', margin: '0 0 28px' }}>
            Two days, one celebration — relive it photo by photo
          </p>

          {/* ── Day 1 / Day 2 buttons ── */}
          <div
            role="tablist"
            aria-label="Choose event day"
            style={{
              display: 'inline-flex',
              gap: 8,
              background: 'rgba(255,255,255,0.12)',
              border: '1px solid rgba(255,255,255,0.25)',
              borderRadius: 999,
              padding: 6,
            }}
          >
            {DAYS.map((d) => {
              const selected = d.id === day;
              return (
                <button
                  key={d.id}
                  role="tab"
                  aria-selected={selected}
                  onClick={() => setDay(d.id)}
                  style={{
                    border: 'none',
                    cursor: 'pointer',
                    borderRadius: 999,
                    padding: '12px 34px',
                    fontFamily: 'var(--font-mono)',
                    fontSize: 14,
                    fontWeight: 700,
                    letterSpacing: '0.06em',
                    textTransform: 'uppercase',
                    color: selected ? '#0A2647' : '#fff',
                    background: selected ? '#fff' : 'transparent',
                    boxShadow: selected
                      ? '0 8px 22px -8px rgba(0,0,0,0.5)'
                      : 'none',
                    transition: 'background 0.2s ease, color 0.2s ease',
                    minHeight: 48,
                  }}
                >
                  {d.label}
                  <span
                    style={{
                      display: 'block',
                      fontSize: 10,
                      fontWeight: 600,
                      letterSpacing: '0.04em',
                      opacity: selected ? 0.7 : 0.75,
                      marginTop: 2,
                    }}
                  >
                    {d.date}
                    {d.photos.length > 0 && ` · ${d.photos.length}`}
                  </span>
                </button>
              );
            })}
          </div>

          <div
            style={{
              marginTop: 26,
              display: 'flex',
              gap: 12,
              flexWrap: 'wrap',
              justifyContent: 'center',
            }}
          >
            <Link
              href="/"
              className="btn btn-outline"
              style={{ display: 'inline-flex' }}
            >
              ← Back to Home
            </Link>
            <a
              href={albumUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="btn btn-gold"
              style={{ display: 'inline-flex' }}
            >
              {dayLabel} Album · Explore More
            </a>
          </div>
        </div>
      </section>

      {/* ── Day gallery (scrollable) ── */}
      <section className="section" style={{ paddingTop: 60 }}>
        <div className="container">
          <div
            style={{
              textAlign: 'center',
              maxWidth: 640,
              margin: '0 auto 36px',
            }}
          >
            <span className="eyebrow">{dayLabel}</span>
            <h2 style={{ marginTop: 12 }}>
              {dayLabel} · {DAYS.find((d) => d.id === day)?.date}
            </h2>
            <p>
              {photos.length > 0
                ? `${photos.length} photos · Click any photo to view · Download button on each photo`
                : 'Photos coming soon — check back shortly.'}
            </p>
          </div>

          {photos.length > 0 ? (
            <div className="gallery-grid">
              {photos.map((src, i) => (
                <div key={src} className="gallery-card">
                  <button
                    onClick={() => setActive(i)}
                    aria-label={`View ${dayLabel} photo ${i + 1}`}
                    style={{
                      display: 'block',
                      width: '100%',
                      padding: 0,
                      border: 'none',
                      background: 'none',
                      cursor: 'zoom-in',
                    }}
                  >
                    <img
                      src={src}
                      alt={`Build Expo 2026 ${dayLabel} memory ${i + 1}`}
                      className="gallery-img"
                      loading="lazy"
                    />
                  </button>
                  <div
                    className="gallery-info"
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                    }}
                  >
                    <span className="gallery-title">
                      {dayLabel} · Photo {i + 1}
                    </span>
                    <a
                      href={src}
                      download={`build-expo-2026-${day}-${i + 1}.jpg`}
                      className="action-btn"
                      onClick={(e) => e.stopPropagation()}
                    >
                      Download
                    </a>
                  </div>
                </div>
              ))}
            </div>
          ) : day === 'more' ? (
            <div style={{ maxWidth: 760, margin: '0 auto' }}>
              <div
                style={{
                  position: 'relative',
                  paddingBottom: '56.25%',
                  height: 0,
                  borderRadius: 14,
                  overflow: 'hidden',
                  border: '2px solid var(--gold)',
                  boxShadow: '0 20px 50px -16px rgba(0,0,0,0.45)',
                  background: '#000',
                }}
              >
                <iframe
                  src="https://www.youtube.com/embed/o7fdNOFdSi0?autoplay=1&mute=1&rel=0&modestbranding=1"
                  title="Build Expo 2026 — Event Video"
                  allow="autoplay; encrypted-media; picture-in-picture"
                  allowFullScreen
                  style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    width: '100%',
                    height: '100%',
                    border: 'none',
                  }}
                />
              </div>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  marginTop: 14,
                  flexWrap: 'wrap',
                  gap: 10,
                }}
              >
                <span className="gallery-title" style={{ fontSize: 15 }}>
                  Build Expo 2026 — Event Video
                </span>
                <div style={{ display: 'flex', gap: 8 }}>
                  <a
                    href="https://youtu.be/o7fdNOFdSi0"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="action-btn"
                  >
                    Watch on YouTube
                  </a>
                </div>
              </div>

              <div style={{ marginTop: 32 }}>
                <video
                  src="/memories/video.mp4"
                  controls
                  playsInline
                  preload="metadata"
                  style={{
                    width: '100%',
                    borderRadius: 14,
                    border: '2px solid var(--gold)',
                    boxShadow: '0 20px 50px -16px rgba(0,0,0,0.45)',
                    background: '#000',
                  }}
                />
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    marginTop: 12,
                    flexWrap: 'wrap',
                    gap: 10,
                  }}
                >
                  <span className="gallery-title" style={{ fontSize: 15 }}>
                    Build Expo 2026 — Recorded Video
                  </span>
                  <a
                    href="/memories/video.mp4"
                    download="build-expo-2026-video.mp4"
                    className="action-btn"
                  >
                    Download
                  </a>
                </div>
              </div>
            </div>
          ) : (
            <div
              style={{
                textAlign: 'center',
                border: '2px dashed var(--line)',
                borderRadius: 16,
                padding: '60px 24px',
                color: '#5C7086',
              }}
            >
              <p style={{ fontSize: 17, margin: '0 0 8px' }}>
                {dayLabel} photos are on the way.
              </p>
              <p style={{ margin: 0 }}>
                Share the Day 1 Google Photos link and we will add them here.
              </p>
            </div>
          )}
        </div>
      </section>

      {/* ── Explore full album on Google Photos ── */}
      <section className="cta-banner">
        <div className="container">
          <h2>Explore the Full {dayLabel} Album</h2>
          <p>
            View every {dayLabel.toLowerCase()} moment ({DAYS.find((d) => d.id === day)?.date}) on
            Google Photos — you can see them all and download the whole album
            at once.
          </p>
          <a
            href={albumUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="btn btn-gold"
            style={{ display: 'inline-flex', marginTop: 8 }}
          >
            Explore {dayLabel} Album
          </a>
        </div>
      </section>

      {/* ── Fullscreen viewer ── */}
      {active !== null && photos.length > 0 && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={`${dayLabel} photo ${active + 1} of ${photos.length}`}
          onClick={close}
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 9999,
            background: 'rgba(6,20,38,0.94)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 16,
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 12,
              marginBottom: 12,
              flexWrap: 'wrap',
              justifyContent: 'center',
            }}
          >
            <span style={{ color: '#fff', fontFamily: 'var(--font-mono)', fontSize: 13 }}>
              {dayLabel} · {active + 1} / {photos.length}
            </span>
            <a
              href={photos[active]}
              download={`build-expo-2026-${day}-${active + 1}.jpg`}
              className="btn btn-gold"
              style={{ minHeight: 44, padding: '10px 20px' }}
            >
              Download
            </a>
            <button
              onClick={close}
              className="btn btn-outline"
              style={{ minHeight: 44, padding: '10px 20px' }}
            >
              Close ×
            </button>
          </div>
          <button
            onClick={() => step(-1)}
            aria-label="Previous photo"
            style={navBtnStyle('left')}
          >
            ‹
          </button>
          <img
            src={photos[active]}
            alt={`Build Expo 2026 ${dayLabel} memory ${active + 1}`}
            style={{
              maxWidth: 'min(1100px, 94vw)',
              maxHeight: '76vh',
              objectFit: 'contain',
              borderRadius: 12,
              border: '2px solid rgba(255,255,255,0.25)',
              boxShadow: '0 30px 80px -20px rgba(0,0,0,0.7)',
            }}
          />
          <button
            onClick={() => step(1)}
            aria-label="Next photo"
            style={navBtnStyle('right')}
          >
            ›
          </button>
        </div>
      )}
    </>
  );
}

function navBtnStyle(side: 'left' | 'right'): React.CSSProperties {
  return {
    position: 'fixed',
    top: '50%',
    transform: 'translateY(-50%)',
    [side]: 12,
    zIndex: 10000,
    width: 48,
    height: 48,
    borderRadius: '50%',
    border: '1px solid rgba(255,255,255,0.35)',
    background: 'rgba(255,255,255,0.12)',
    color: '#fff',
    fontSize: 26,
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    lineHeight: 1,
  };
}
