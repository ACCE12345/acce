import Link from 'next/link';

export default function Footer() {
  return (
    <footer className="site-footer">
      <div className="container">
        <div className="footer-grid">
          <div>
            <Link href="/" className="brand" style={{ color: 'var(--paper)' }}>
              <span className="brand-mark">
                <img src="/img/logo.png" alt="ACCE" />
              </span>
              ACCE (India)
            </Link>
            <p style={{ marginTop: 16, maxWidth: 280 }}>
              The Build Expo — 25–26 Sep 2026, ACCE Warangal Centre.
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
            <h5>Partners</h5>
            <ul>
              <li><Link href="/sponsorship">Sponsorship</Link></li>
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
          <span>&copy; 2026 ACCE (India) — Warangal Centre. All rights reserved.</span>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
            Powered by
            <img src="/img/a+.png" alt="A+ Tech Services" style={{ height: 20, width: 'auto', verticalAlign: 'middle' }} />
            A+ Tech Services
          </span>
        </div>
      </div>
    </footer>
  );
}
