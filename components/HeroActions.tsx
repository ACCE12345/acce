'use client';

import Link from 'next/link';

export default function HeroActions() {
  return (
    <div className="hero-actions">
      <Link href="/registration" className="btn btn-red btn-ticket">Register Now</Link>
      <button
        onClick={() => document.getElementById('download-id')?.scrollIntoView({ behavior: 'smooth' })}
        className="btn btn-outline"
        style={{ cursor: 'pointer' }}
      >
        Download Your ID Card
      </button>
      <a
        href="https://maps.app.goo.gl/k3fTfiv8GZz3XKFC9"
        target="_blank"
        rel="noopener noreferrer"
        className="btn btn-outline"
      >
        View Location on Maps
      </a>
    </div>
  );
}
