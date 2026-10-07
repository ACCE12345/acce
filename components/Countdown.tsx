'use client';

export default function Countdown() {
  return (
    <section className="countdown-section">
      <div className="container">
        <div className="countdown-inner">
          <span className="event-held-badge">✓ Successfully Held</span>
          <h2 className="countdown-heading">Thank You, Warangal!</h2>
          <div className="countdown-date-banner">
            <span className="countdown-date-item">25 – 26 September 2026</span>
            <span className="countdown-date-dot" aria-hidden="true" />
            <span className="countdown-date-item">Warangal, Telangana</span>
          </div>
        </div>
      </div>
    </section>
  );
}
