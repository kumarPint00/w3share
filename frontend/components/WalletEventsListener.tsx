'use client';
import { useEffect, useRef, useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Stack,
  Box,
  Slide,
  SlideProps,
} from '@mui/material';
import InfoIcon from '@mui/icons-material/InfoOutlined';
import ErrorIcon from '@mui/icons-material/ErrorOutline';
import WarningIcon from '@mui/icons-material/WarningAmberOutlined';
import { amber, blue, red } from '@mui/material/colors';

const transition = (props: SlideProps) => <Slide {...props} direction="down" />;

const severityStyles = {
  info: { icon: InfoIcon, bg: blue[50], color: blue[700] },
  warning: { icon: WarningIcon, bg: amber[50], color: amber[900] },
  error: { icon: ErrorIcon, bg: red[50], color: red[700] },
};

type Severity = 'info' | 'warning' | 'error';

export default function WalletEventsListener() {
  const [open, setOpen] = useState(false);
  const [msg, setMsg] = useState('');
  const [severity, setSeverity] = useState<Severity>('info');
  const [duration, setDuration] = useState(4000);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const handler = (e: any) => {
      const detail = e?.detail || {};
      setMsg(detail.message || 'Notification');
      const nextSeverity: Severity = detail.type === 'error'
        ? 'error'
        : detail.type === 'warning'
          ? 'warning'
          : 'info';
      setSeverity(nextSeverity);
      setDuration(detail.duration ?? (nextSeverity === 'warning' ? 6000 : nextSeverity === 'error' ? 7000 : 4000));
      setOpen(true);
    };
    window.addEventListener('wallet:notification', handler as EventListener);
    return () => window.removeEventListener('wallet:notification', handler as EventListener);
  }, []);

  useEffect(() => {
    if (!open) return;
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => setOpen(false), duration);
    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [open, duration]);

  return (
    <Dialog
      open={open}
      onClose={() => setOpen(false)}
      TransitionComponent={transition}
      PaperProps={{
        elevation: 8,
        sx: {
          borderRadius: 3,
          minWidth: 320,
          backgroundColor: '#fff',
        },
      }}
      keepMounted
    >
      <DialogContent>
        <Stack direction="row" spacing={2} alignItems="center">
          <Box
            sx={{
              bgcolor: severityStyles[severity].bg,
              color: severityStyles[severity].color,
              borderRadius: '50%',
              width: 48,
              height: 48,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            {(() => {
              const Icon = severityStyles[severity].icon;
              return <Icon fontSize="medium" />;
            })()}
          </Box>
          <Box>
            <Typography variant="subtitle1" fontWeight={600} gutterBottom>
              {severity === 'error' ? 'Wallet Authorization Needed' : 'Wallet Notification'}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {msg}
            </Typography>
          </Box>
        </Stack>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={() => setOpen(false)} variant="outlined" size="small">
          Got it
        </Button>
      </DialogActions>
    </Dialog>
  );
}
