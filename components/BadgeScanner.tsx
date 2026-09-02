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
  const scanStatusRef = useRef<'idle' | 'scanning' | 'success' | 'error' | 'already-checked-in'>('idle');
  const processingRef = useRef(false);
  const lastScannedRef = useRef<string>('');
  const lastScanTimeRef = useRef(0);

  const [isCameraActive, setIsCameraActive] = useState(false);
  const [scanResult, setScanResult] = useState<string | null>(null);
  const [scanStatus, setScanStatus] = useState<'idle' | 'scanning' | 'success' | 'error' | 'already-checked-in'>('idle');
  const [alreadyCheckedInName, setAlreadyCheckedInName] = useState<string>('');
  const [errorMsg, setErrorMsg] = useState<string>('');

  const processScan = useCallback(async (regId: string) => {
    if (processingRef.current) return;
    if (lastScannedRef.current === regId && Date.now() - lastScanTimeRef.current < 3000) return;

    processingRef.current = true;
    lastScannedRef.current = regId;
    lastScanTimeRef.current = Date.now();

    try {
      const rec = await findRegistration(regId);

      if (!rec) {
        showToast(`Registration ${regId} not found.`, 'error');
        setScanStatus('error');
        scanStatusRef.current = 'error';
        return;
      }

      if (rec.checkedIn) {
        showToast(`${rec.primaryName} is already checked in.`, 'default');
        setAlreadyCheckedInName(rec.primaryName);
        setScanResult(regId);
        setScanStatus('already-checked-in');
        scanStatusRef.current = 'already-checked-in';
        return;
      }

      await checkIn(regId);
      showToast(`${rec.primaryName} checked in.`, 'success');
      setScanResult(regId);
      setScanStatus('success');
      scanStatusRef.current = 'success';
      onCheckInSuccess?.(rec);

    } catch {
      showToast('Scan processing failed.', 'error');
      setScanStatus('error');
      scanStatusRef.current = 'error';
    } finally {
      processingRef.current = false;
    }
  }, [showToast, onCheckInSuccess]);

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
      if (processingRef.current) return;

      const video = videoRef.current;
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');

      if (!ctx || video.readyState !== video.HAVE_ENOUGH_DATA) return;

      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

      const decoded = await decodeQRCode(canvas);

      if (decoded) {
        if (/^[A-Z]+-/.test(decoded)) {
          setScanResult(decoded);
          clearInterval(scanIntervalRef.current!);

          processScan(decoded);
        }
      }
    }, 750);
  }, [decodeQRCode, processScan]);

  const startCamera = useCallback(async () => {
    setErrorMsg('');
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        const msg = 'Camera not supported on this device/browser.';
        setErrorMsg(msg);
        showToast(msg, 'error');
        return;
      }

      let stream: MediaStream;

      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: 'environment',
            width: { ideal: 1280 },
            height: { ideal: 720 },
          },
          audio: false,
        });
      } catch {
        stream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: false,
        });
      }

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        streamRef.current = stream;

        await new Promise<void>((resolve) => {
          if (videoRef.current) {
            videoRef.current.onloadedmetadata = () => resolve();
          }
        });

        await videoRef.current.play();

        setIsCameraActive(true);
        setScanStatus('scanning');
        scanStatusRef.current = 'scanning';
        setScanResult(null);

        startScanning();
      }
    } catch (error: unknown) {
      console.error('Camera error:', error);
      setScanStatus('error');
      const errObj = error as { message?: string; name?: string };
      const errMsg = errObj?.message || errObj?.name || '';
      let msg = '';

      if (errMsg.includes('Permission') || errMsg.includes('denied') || errObj?.name === 'NotAllowedError') {
        msg = 'Camera permission denied. Please allow camera access in your browser/device settings and reload.';
      } else if (errObj?.name === 'NotFoundError') {
        msg = 'No camera found on this device.';
      } else if (errObj?.name === 'NotReadableError') {
        msg = 'Camera is in use by another app.';
      } else if (errMsg.includes('Secure') || (typeof location !== 'undefined' && location.protocol !== 'https:')) {
        msg = 'Camera requires HTTPS. Please use a secure connection.';
      } else {
        msg = 'Could not access camera. Please check permissions and try again.';
      }

      setErrorMsg(msg);
      showToast(msg, 'error');
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
    processingRef.current = false;
  };

  const resetScanner = () => {
    setScanResult(null);
    setScanStatus('scanning');
    scanStatusRef.current = 'scanning';
    processingRef.current = false;
    lastScannedRef.current = '';
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
              <div style={styles.scanOverlay} className="gpu-fade">
                <div style={styles.scanSuccess}>
                  <div style={{ fontSize: 32, marginBottom: 8, color: '#22c55e', fontWeight: 700 }}>PASS</div>
                  <div style={{ fontSize: 16, fontWeight: 600, marginBottom: 8 }}>
                    Checked In: {scanResult}
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

            {scanStatus === 'already-checked-in' && (
              <div style={{ ...styles.scanOverlay, background: 'rgba(180,40,40,0.85)' }} className="gpu-fade">
                <div style={styles.scanSuccess}>
                  <div style={{ fontSize: 32, marginBottom: 8, color: '#EF4444', fontWeight: 700 }}>DENIED</div>
                  <div style={{ fontSize: 14, color: 'rgba(255,255,255,0.8)', marginBottom: 4 }}>
                    ALREADY CHECKED IN
                  </div>
                  <div style={{ fontSize: 18, fontWeight: 700, marginBottom: 8 }}>
                    {alreadyCheckedInName}
                  </div>
                  <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.6)', marginBottom: 12 }}>
                    {scanResult}
                  </div>
                  <button
                    onClick={resetScanner}
                    style={{ ...styles.actionButton, background: '#fff', color: 'var(--brick)' }}
                  >
                    Scan Next
                  </button>
                </div>
              </div>
            )}
          </>
        ) : (
          <div style={styles.scannerPlaceholder}>
            <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ marginBottom: 16, opacity: 0.4 }}>
              <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
              <circle cx="12" cy="13" r="4" />
            </svg>
            <div style={{ fontSize: 16, marginBottom: 20, color: '#9CA3AF' }}>
              Tap to activate camera
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
            {errorMsg && (
              <div style={{ marginTop: 12, color: '#EF4444', fontSize: 13, textAlign: 'center', padding: '8px 12px', background: 'rgba(239,68,68,0.1)', borderRadius: 8 }}>
                {errorMsg}
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
    maxWidth: 340,
    background: '#000',
    borderRadius: 8,
    overflow: 'hidden',
    margin: '0 auto 20px',
    aspectRatio: '1/1',
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
    animation: 'gpuScan 2s linear infinite',
    willChange: 'transform',
    transform: 'translateZ(0)',
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
    padding: 20,
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
    padding: 20,
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
    willChange: 'transform',
    transform: 'translateZ(0)',
  },
};
