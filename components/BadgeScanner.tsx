'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { useToast } from '@/lib/toast';
import { findRegistration, checkIn } from '@/lib/nexus-store';
import type { Registration } from '@/lib/nexus-store';

export default function BadgeScanner({ onCheckInSuccess }: { onCheckInSuccess?: (reg: Registration) => void }) {
  const { showToast } = useToast();
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const scanIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const scanStatusRef = useRef<'idle' | 'scanning' | 'success' | 'error'>('idle');

  const [isCameraActive, setIsCameraActive] = useState(false);
  const [scanResult, setScanResult] = useState<string | null>(null);
  const [scanStatus, setScanStatus] = useState<'idle' | 'scanning' | 'success' | 'error'>('idle');

  const processScan = useCallback(async (regId: string) => {
    try {
      const rec = await findRegistration(regId);

      if (!rec) {
        showToast(`Registration ${regId} not found.`, 'error');
        setScanStatus('error');
        scanStatusRef.current = 'error';
        return;
      }

      if (rec.checkedIn) {
        showToast(`${rec.fullName} is already checked in.`, 'default');
        setScanResult(regId);
        return;
      }

      await checkIn(regId);
      showToast(`${rec.fullName} checked in.`, 'success');
      setScanResult(regId);
      onCheckInSuccess?.(rec);

    } catch {
      showToast('Scan processing failed.', 'error');
      setScanStatus('error');
      scanStatusRef.current = 'error';
    }
  }, [showToast, onCheckInSuccess]);

  // Import jsQR dynamically to avoid SSR issues
  const decodeQRCode = useCallback(async (canvas: HTMLCanvasElement): Promise<string | null> => {
    try {
      const jsQRModule = await import('jsqr');
      const jsQR = jsQRModule.default;
      const ctx = canvas.getContext('2d');
      if (!ctx) return null;

      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const code = jsQR(imageData.data, imageData.width, imageData.height, {
        inversionAttempts: 'attemptBoth',
      });

      return code?.data || null;
    } catch {
      return null;
    }
  }, []);

  const startScanning = useCallback(() => {
    if (scanIntervalRef.current) clearInterval(scanIntervalRef.current);
    scanIntervalRef.current = setInterval(async () => {
      if (!videoRef.current || !canvasRef.current || scanStatusRef.current !== 'scanning') return;

      const video = videoRef.current;
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');

      if (!ctx || video.readyState !== video.HAVE_ENOUGH_DATA) return;

      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

      const decoded = await decodeQRCode(canvas);

      if (decoded) {
        if (/^[A-Z]{3}-/.test(decoded)) {
          setScanResult(decoded);
          setScanStatus('success');
          scanStatusRef.current = 'success';
          clearInterval(scanIntervalRef.current!);

          processScan(decoded);
        }
      }
    }, 500);
  }, [decodeQRCode, processScan]);

  const startCamera = useCallback(async () => {
    try {
      let stream: MediaStream;
      
      try {
        // Try environment-facing camera first (mobile devices)
        stream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: 'environment',
            width: { ideal: 1280 },
            height: { ideal: 720 },
          },
        });
      } catch {
        // Fall back to any available camera (desktop/front-facing)
        stream = await navigator.mediaDevices.getUserMedia({
          video: {
            width: { ideal: 1280 },
            height: { ideal: 720 },
          },
        });
      }

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        streamRef.current = stream;
        await videoRef.current.play();

        setIsCameraActive(true);
        setScanStatus('scanning');
        scanStatusRef.current = 'scanning';
        setScanResult(null);

        startScanning();
      }
    } catch (error: any) {
      console.error('Camera error:', error);
      setScanStatus('error');
      const errMsg = error?.message || '';
      let toastMsg = 'Failed to access camera. Please try again.';
      let helpMsg = 'If the issue persists, check your browser permissions.';

      if (errMsg.includes('Permission dismissed') || errMsg.includes('Permission denied')) {
        toastMsg = 'Camera permission was denied or dismissed.';
        helpMsg = 'Please allow camera access in your browser settings and try again.';
      } else if (errMsg.includes('NotAllowedError') || error?.name === 'NotAllowedError') {
        toastMsg = 'Camera access not allowed.';
        helpMsg = 'Please grant camera permission in your browser settings.';
      } else if (errMsg.includes('NotFoundError') || error?.name === 'NotFoundError') {
        toastMsg = 'No camera found on this device.';
      } else if (errMsg.includes('NotReadableError') || error?.name === 'NotReadableError') {
        toastMsg = 'Camera is in use by another application.';
        helpMsg = 'Please close other apps using the camera and try again.';
      } else if (errMsg.includes('Secure')) {
        toastMsg = 'Camera requires a secure connection (HTTPS).';
      }

      showToast(`${toastMsg} ${helpMsg}`, 'error');
    }
  }, [showToast, startScanning]);

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    if (scanIntervalRef.current) {
      clearInterval(scanIntervalRef.current);
      scanIntervalRef.current = null;
    }
    setIsCameraActive(false);
    setScanStatus('idle');
    scanStatusRef.current = 'idle';
    setScanResult(null);
  };

  const resetScanner = () => {
    setScanResult(null);
    setScanStatus('scanning');
    scanStatusRef.current = 'scanning';
    startScanning();
  };

  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, []);

  return (
    <div style={styles.scannerContainer}>
      <div style={styles.scannerHeader}>
        <h3 style={{ margin: 0, fontSize: 18, fontFamily: 'var(--font-display)' }}>Badge Scanner</h3>
        <p style={{ color: '#8A8E96', fontSize: 14, margin: '8px 0 0' }}>
          Point the camera at a delegate&apos;s badge QR to validate &amp; check them in.
        </p>
        <p style={{ color: '#8A8E96', fontSize: 12, margin: '4px 0 0' }}>
          Requires camera permission. Click "Activate Camera" and allow access when prompted.
        </p>
      </div>

      <div style={styles.scannerViewport}>
        <video
          ref={videoRef}
          style={{
            ...styles.scannerVideo,
            display: isCameraActive ? 'block' : 'none',
          }}
          playsInline
          muted
          autoPlay
        />
        <canvas
          ref={canvasRef}
          style={{ display: 'none' }}
        />

        {isCameraActive ? (
          <>
            <div style={styles.scannerReticle} />

            {scanStatus === 'scanning' && (
              <div style={styles.scanLineContainer}>
                <div style={styles.scanLine} />
              </div>
            )}

            {scanStatus === 'success' && scanResult && (
              <div style={styles.scanOverlay}>
                <div style={styles.scanSuccess}>
                  <div style={{ fontSize: 32, marginBottom: 8 }}>✅</div>
                  <div style={{ fontSize: 16, fontWeight: 600, marginBottom: 8 }}>
                    Scanned: {scanResult}
                  </div>
                  <button
                    onClick={resetScanner}
                    style={{ ...styles.actionButton, background: 'var(--ink)' }}
                  >
                    Scan Again
                  </button>
                </div>
              </div>
            )}
          </>
        ) : (
          <div style={styles.scannerPlaceholder}>
            <div style={{ fontSize: 48, marginBottom: 16, opacity: 0.3 }}>📷</div>
            <div style={{ fontSize: 16, marginBottom: 20, color: '#9CA3AF' }}>
              No camera active
            </div>
            <button
              onClick={startCamera}
              style={{
                ...styles.actionButton,
                background: 'linear-gradient(135deg, var(--gold), var(--teal-bright))',
                color: '#fff',
              }}
            >
              Activate Camera
            </button>
            {scanStatus === 'error' && (
              <div style={{ marginTop: 12, color: '#EF4444', fontSize: 13, textAlign: 'center', padding: '8px 12px' }}>
                Camera access failed. Check permissions and try again.
                <br />
                <span style={{ opacity: 0.8, fontSize: 11 }}>
                  Ensure the site has camera permission in your browser settings.
                  <br />
                  Note: Camera access requires a secure connection (HTTPS).
                </span>
              </div>
            )}
          </div>
        )}
      </div>

      {isCameraActive && (
        <div style={{ marginTop: 16, textAlign: 'center' }}>
          <button
            onClick={stopCamera}
            style={{ ...styles.actionButton, background: '#EF4444', color: '#fff' }}
          >
            Stop Camera
          </button>
        </div>
      )}
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  scannerContainer: {
    background: '#fff',
    border: '1px solid var(--line)',
    borderRadius: 8,
    padding: 24,
    boxShadow: 'var(--shadow-card)',
    width: '100%',
  },
  scannerHeader: {
    marginBottom: 20,
  },
  scannerViewport: {
    position: 'relative',
    width: '100%',
    aspectRatio: '1/1',
    maxWidth: 340,
    background: '#000',
    borderRadius: 8,
    overflow: 'hidden',
    margin: '0 auto 20px',
  },
  scannerVideo: {
    width: '100%',
    height: '100%',
    objectFit: 'cover',
  },
  scannerReticle: {
    position: 'absolute',
    top: '16%',
    left: '16%',
    right: '16%',
    bottom: '16%',
    border: '2px solid var(--gold-bright)',
    borderRadius: '10px',
    boxShadow: '0 0 0 100vmax rgba(11,37,69,.42)',
    pointerEvents: 'none',
  },
  scanLineContainer: {
    position: 'absolute',
    top: '16%',
    left: '16%',
    right: '16%',
    bottom: '16%',
    pointerEvents: 'none',
    overflow: 'hidden',
  },
  scanLine: {
    position: 'absolute',
    top: '50%',
    left: 0,
    right: 0,
    height: '2px',
    background: 'var(--gold-bright)',
    boxShadow: '0 0 10px rgba(255,255,255,0.5)',
    animation: 'scan 2s linear infinite',
  },
  scannerPlaceholder: {
    position: 'absolute',
    inset: 0,
    display: 'flex',
    flexDirection: 'column' as const,
    alignItems: 'center',
    justifyContent: 'center',
    background: '#1F2937',
    color: '#9CA3AF',
  },
  scanOverlay: {
    position: 'absolute',
    inset: 0,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: 'rgba(0,0,0,0.8)',
    zIndex: 10,
  },
  scanSuccess: {
    textAlign: 'center',
    color: '#fff',
  },
  actionButton: {
    padding: '12px 24px',
    borderRadius: 10,
    border: 'none',
    fontFamily: 'var(--font-mono)',
    fontSize: 13,
    letterSpacing: '0.06em',
    textTransform: 'uppercase' as const,
    cursor: 'pointer',
    fontWeight: 600,
    transition: 'transform 0.2s, box-shadow 0.2s',
  },
};
