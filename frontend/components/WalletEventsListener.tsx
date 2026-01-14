'use client';
import { useEffect, useState } from 'react';
import { Snackbar, Alert } from '@mui/material';

export default function WalletEventsListener() {
  const [open, setOpen] = useState(false);
  const [msg, setMsg] = useState('');
  const [severity, setSeverity] = useState<'info' | 'error'>('info');

  useEffect(() => {
    const handler = (e: any) => {
      const detail = e?.detail || {};
      setMsg(detail.message || 'Notification');
      setSeverity(detail.type === 'error' ? 'error' : 'info');
      setOpen(true);
    };
    window.addEventListener('wallet:notification', handler as EventListener);
    return () => window.removeEventListener('wallet:notification', handler as EventListener);
  }, []);

  return (
    <Snackbar
      open={open}
      autoHideDuration={3500}
      onClose={() => setOpen(false)}
      anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
    >
      <Alert onClose={() => setOpen(false)} severity={severity} sx={{ minWidth: 180 }}>
        {msg}
      </Alert>
    </Snackbar>
  );
}
