'use client';
import { useEffect, useRef, useState } from 'react';
import { Snackbar, Alert, IconButton } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';

type Severity = 'info' | 'warning' | 'error';

// Minimum display time for toasts (milliseconds)
const MIN_TOAST_MS = 3000;
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

      setMsg(message);
      setSeverity(type);
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
        sx={{ minWidth: 260, boxShadow: 3 }}
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
