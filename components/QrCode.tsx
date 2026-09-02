'use client';

import { useEffect, useRef, useState } from 'react';
import QRCodeLib from 'qrcode';

export default function QrCode({ text, size = 120 }: { text: string; size?: number }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (!canvasRef.current || !text) return;
    
    const canvas = canvasRef.current;
    QRCodeLib.toCanvas(canvas, text, {
      width: size,
      margin: 1,
      color: { dark: '#0A2647', light: '#ffffff' },
    }).catch((err) => {
      console.error('QR generation failed:', err);
      setError(true);
    });
  }, [text, size]);

  if (error) {
    return (
      <div 
        style={{ 
          width: size, 
          height: size, 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center',
          background: '#FEE2E2',
          border: '2px dashed #FCA5A5',
          borderRadius: '8px',
          color: '#991B1B',
          fontSize: Math.max(10, size / 12),
          textAlign: 'center',
          padding: '4px',
        }}
      >
        QR Error
      </div>
    );
  }

  return (
    <canvas 
      ref={canvasRef} 
      width={size} 
      height={size} 
      style={{ 
        width: size, 
        height: size, 
        display: 'block',
        background: '#fff',
      }} 
    />
  );
}
