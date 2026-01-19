'use client';
import { useEffect, useRef, useState } from 'react';
import { Snackbar, Alert, IconButton } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';

type Severity = 'info' | 'warning' | 'error';

// Minimum display time for toasts (milliseconds)
const MIN_TOAST_MS = 4000; // per UX guidance: keep toasts visible ~4-6s
// Maximum display time cap
const MAX_TOAST_MS = 15000;

function computeDuration(message: string | undefined, explicit?: number) {
  if (typeof explicit === 'number') return explicit;
  const len = message ? message.length : 0;
  // Give ~120ms per character as base, with min and max bounds
  const estimated = Math.min(MAX_TOAST_MS, Math.max(MIN_TOAST_MS, Math.floor(len * 120)));
  return estimated;
}

export default function WalletEventsListener() {
  const [open, setOpen] = useState(false);
  const [msg, setMsg] = useState('');
  const [severity, setSeverity] = useState<Severity>('info');
  const [autoHideDuration, setAutoHideDuration] = useState<number>(MIN_TOAST_MS);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const handler = (e: any) => {
      const detail = e?.detail || {};
      const message = detail.message || '';
      const type: Severity = detail.type === 'error' ? 'error' : detail.type === 'warning' ? 'warning' : 'info';
      const duration = computeDuration(message, detail.duration);

      // If the message indicates a user-canceled action, make it visually distinct
      const isCancel = /canceled/i.test(message || '');
      const resolvedSeverity: Severity = isCancel ? 'error' : type;

      setMsg(message);
      setSeverity(resolvedSeverity);
      setAutoHideDuration(duration);
      setOpen(true);
    };
    window.addEventListener('wallet:notification', handler as EventListener);
    return () => window.removeEventListener('wallet:notification', handler as EventListener);
  }, []);

  // Ensure the snackbar respects the computed duration (and clears timers cleanly)
  useEffect(() => {
    if (!open) return;
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => setOpen(false), autoHideDuration);
    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [open, autoHideDuration]);

  return (
    <Snackbar
      open={open}
      anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
      onClose={() => setOpen(false)}
      autoHideDuration={autoHideDuration}
    >
      <Alert
        severity={severity}
        sx={(theme) => ({
          minWidth: 260,
          boxShadow: 3,
          // Make canceled messages visually more prominent (brighter red)
          backgroundColor: /canceled/i.test(msg) ? (theme.palette.error.main || '#ff4d4f') : undefined,
          color: /canceled/i.test(msg) ? '#fff' : undefined,
        })}
        action={
          <IconButton size="small" aria-label="close" color="inherit" onClick={() => setOpen(false)}>
            <CloseIcon fontSize="small" />
          </IconButton>
        }
      >
        {msg}
      </Alert>
    </Snackbar>
  );
}
