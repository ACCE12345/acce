import Link from 'next/link';
import Image from 'next/image';

export default function Footer() {
  return (
    <footer className="site-footer">
      <div className="container">
        <div className="footer-grid">
          <div>
            <Link href="/" className="brand" style={{ color: 'var(--paper)' }}>
              <span className="brand-mark">
                <Image src="/img/logo.png" alt="ACCE" width={34} height={34} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              </span>
              ACCE(I), Warangal Centre
            </Link>
            <p style={{ marginTop: 16, maxWidth: 280 }}>
              Association of Consulting Civil Engineers (India) — Warangal Centre. Build Expo 2026, 25–26 Sep 2026.
            </p>
          </div>

          <div>
            <h5>Event</h5>
            <ul>
              <li><Link href="/#about">About</Link></li>
              <li><Link href="/#highlights">Highlights</Link></li>
              <li><Link href="/registration">Register</Link></li>
            </ul>
          </div>

          <div>
            <h5>Quick Links</h5>
            <ul>
              <li><Link href="/#about">About</Link></li>
              <li><Link href="/#highlights">Highlights</Link></li>
              <li><Link href="/registration">Register</Link></li>
              <li><Link href="/#download-id">Download ID Card</Link></li>
              <li><Link href="/admin-login">Admin</Link></li>
            </ul>
          </div>

          <div>
            <h5>Legal</h5>
            <ul>
              <li><Link href="#">Terms</Link></li>
              <li><Link href="#">Privacy Policy</Link></li>
            </ul>
          </div>
        </div>

        <div className="footer-bottom">
          <span>&copy; 2026 ACCE(I), Warangal Centre. All rights reserved.</span>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
            Powered by
            <Image src="/img/a+.png" alt="A+ Tech Services" width={80} height={20} style={{ height: 20, width: 'auto', verticalAlign: 'middle' }} />
            A+ Tech Services
          </span>
        </div>
      </div>
    </footer>
  );
}
