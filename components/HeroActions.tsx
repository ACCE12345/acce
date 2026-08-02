'use client';

import Link from 'next/link';

export default function HeroActions() {
  return (
    <div className="hero-actions">
      <Link href="/registration" className="btn btn-red btn-ticket">Register Now</Link>
      <Link href="/sponsorship#apply" className="btn btn-outline">Become a Sponsor</Link>
      <button
        onClick={() => document.getElementById('download-id')?.scrollIntoView({ behavior: 'smooth' })}
        className="btn btn-outline"
        style={{ cursor: 'pointer' }}
      >
        Download Your ID Card
      </button>
    </div>
  );
}
