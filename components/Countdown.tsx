'use client';

import { useState, useEffect, useRef } from 'react';

interface TimeLeft {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
}

function calcTimeLeft(target: Date): TimeLeft {
  const diff = target.getTime() - Date.now();
  if (diff <= 0) return { days: 0, hours: 0, minutes: 0, seconds: 0 };
  return {
    days: Math.floor(diff / 86400000),
    hours: Math.floor((diff % 86400000) / 3600000),
    minutes: Math.floor((diff % 3600000) / 60000),
    seconds: Math.floor((diff % 60000) / 1000),
  };
}

function pad(n: number) {
  return String(n).padStart(2, '0');
}

function Block({ val, label }: { val: number; label: string }) {
  return (
    <div className="countdown-block">
      <span className="countdown-number">{pad(val)}</span>
      <span className="countdown-label">{label}</span>
    </div>
  );
}

export default function Countdown({ targetDate = '2026-09-25T09:00:00+05:30' }: { targetDate?: string }) {
  const target = useRef(new Date(targetDate));
  const [time, setTime] = useState<TimeLeft>({ days: 0, hours: 0, minutes: 0, seconds: 0 });
  const mountedRef = useRef(false);

  useEffect(() => {
    setTime(calcTimeLeft(target.current));
    mountedRef.current = true;
    const id = setInterval(() => setTime(calcTimeLeft(target.current)), 1000);
    return () => clearInterval(id);
  }, []);

  return (
    <section className="countdown-section">
      <div className="container">
        <div className="countdown-inner">
          <h2 className="countdown-heading">Event Begins In</h2>
          <div className="countdown-grid">
            <Block val={time.days} label="Days" />
            <span className="countdown-sep">:</span>
            <Block val={time.hours} label="Hours" />
            <span className="countdown-sep">:</span>
            <Block val={time.minutes} label="Minutes" />
            <span className="countdown-sep">:</span>
            <Block val={time.seconds} label="Seconds" />
          </div>
          <p className="countdown-date">25 – 26 September 2026 &nbsp;|&nbsp; Warangal, Telangana</p>
        </div>
      </div>
    </section>
  );
}
