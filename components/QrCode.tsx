'use client';

import { useEffect, useRef } from 'react';
import QRCodeLib from 'qrcode';

export default function QrCode({ text, size = 120 }: { text: string; size?: number }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!canvasRef.current || !text) return;
    QRCodeLib.toCanvas(canvasRef.current, text, {
      width: size,
      margin: 1,
      color: { dark: '#0A2647', light: '#ffffff' },
    }).catch((err) => console.error('QR generation failed:', err));
  }, [text, size]);

  return <canvas ref={canvasRef} style={{ width: size, height: size, display: 'block' }} />;
}
