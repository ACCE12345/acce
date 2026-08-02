'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';

const SLIDES = [
  '/img/_DSC0076.JPG',
  '/img/_DSC0098.JPG',
  '/img/_DSC0121.JPG',
];

export default function HeroSlideshow() {
  const [active, setActive] = useState(0);

  useEffect(() => {
    const id = setInterval(() => {
      setActive((i) => (i + 1) % SLIDES.length);
    }, 4500);
    return () => clearInterval(id);
  }, []);

  return (
    <div className="hero-slideshow">
      {SLIDES.map((src, i) => (
        <Image
          key={src}
          src={src}
          alt=""
          fill
          sizes="100vw"
          priority={i === 0}
          className={`hero-slide${i === active ? ' active' : ''}`}
        />
      ))}
    </div>
  );
}
