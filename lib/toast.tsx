'use client';

import React, { createContext, useCallback, useContext, useState, useRef, useEffect } from 'react';

type ToastType = 'default' | 'success' | 'error';

interface Toast {
  id: number;
  message: string;
  type: ToastType;
}

interface ToastContextValue {
  showToast: (message: string, type?: ToastType) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

let toastId = 0;

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const timers = useRef<Map<number, ReturnType<typeof setTimeout>>>(new Map());

  const removeToast = useCallback((id: number) => {
    timers.current.delete(id);
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const showToast = useCallback(
    (message: string, type: ToastType = 'default') => {
      const id = ++toastId;
      setToasts((prev) => [...prev, { id, message, type }]);
      const timer = setTimeout(() => removeToast(id), 4200);
      timers.current.set(id, timer);
    },
    [removeToast]
  );

  useEffect(() => {
    const current = timers.current;
    return () => {
      current.forEach((t) => clearTimeout(t));
    };
  }, []);

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}

      {/* ── Toast stack ── */}
      <div
        style={{
          position: 'fixed',
          bottom: 24,
          right: 24,
          zIndex: 9999,
          display: 'flex',
          flexDirection: 'column',
          gap: 10,
          pointerEvents: 'none',
        }}
      >
        {toasts.map((t) => (
          <ToastItem key={t.id} toast={t} onDismiss={() => removeToast(t.id)} />
        ))}
      </div>
    </ToastContext.Provider>
  );
}

function ToastItem({ toast, onDismiss }: { toast: Toast; onDismiss: () => void }) {
  const [exiting, setExiting] = useState(false);

  useEffect(() => {
    const id = setTimeout(() => setExiting(true), 3700);
    return () => clearTimeout(id);
  }, []);

  useEffect(() => {
    if (exiting) {
      const id = setTimeout(onDismiss, 500);
      return () => clearTimeout(id);
    }
  }, [exiting, onDismiss]);

  const borderColor =
    toast.type === 'success' ? '#22c55e' : toast.type === 'error' ? '#ef4444' : '#d4a843';

  const icon =
    toast.type === 'success' ? '✓' : toast.type === 'error' ? '✕' : 'ℹ';

  return (
    <div
      role="alert"
      style={{
        pointerEvents: 'auto',
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        minWidth: 300,
        maxWidth: 420,
        padding: '14px 18px',
        borderRadius: 10,
        background: 'linear-gradient(135deg, #0a1628 0%, #111d35 100%)',
        borderLeft: `4px solid ${borderColor}`,
        boxShadow: '0 8px 32px rgba(0,0,0,0.45)',
        color: '#f5f0e8',
        fontFamily: "'Inter', system-ui, sans-serif",
        fontSize: 14,
        lineHeight: 1.5,
        opacity: exiting ? 0 : 1,
        transform: exiting ? 'translateX(110%)' : 'translateX(0)',
        transition: 'opacity 0.4s ease, transform 0.4s ease',
      }}
    >
      <span
        style={{
          flexShrink: 0,
          width: 26,
          height: 26,
          borderRadius: '50%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: 13,
          fontWeight: 700,
          background: `${borderColor}22`,
          color: borderColor,
        }}
      >
        {icon}
      </span>

      <span style={{ flex: 1 }}>{toast.message}</span>

      <button
        onClick={onDismiss}
        aria-label="Dismiss"
        style={{
          flexShrink: 0,
          background: 'none',
          border: 'none',
          color: '#8899aa',
          fontSize: 18,
          cursor: 'pointer',
          padding: 0,
          lineHeight: 1,
        }}
      >
        ×
      </button>
    </div>
  );
}

export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used within a ToastProvider');
  return ctx;
}
