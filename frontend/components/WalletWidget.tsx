'use client';
import { useWallet } from '@/context/WalletContext';
import { getEthBalance } from '@/lib/balance';

import {
  Button,
  Typography,
  Box,
  CircularProgress,
  Stack,
} from '@mui/material';
import { useEffect, useState } from 'react';

export default function WalletWidget() {
  const { provider, address, connect, disconnect, connectionRejected, clearConnectionRejection } = useWallet();
  const connected = !!address;
  const [ethBal, setEthBal] = useState<number | undefined>(undefined);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        if (provider && address) {
          const bal = await getEthBalance(provider, address);
          setEthBal(bal);
        } else {
          setEthBal(undefined);
        }
      } catch (e) {
        setEthBal(undefined);
      }
    })();
  }, [provider, address]);





  if (connected && ethBal === undefined) {
    return <CircularProgress size={22} sx={{ mx: 2 }} />;
  }

  if (!connected) {
    // Always show the standard Connect Wallet button when disconnected.
    // Connection cancellations are handled by WalletContext via toast notifications so we avoid inline banners.
    return (
      <>
        <Button
          variant="contained"
          size="small"
          onClick={async () => {
            try {
              console.log('[WalletWidget] Connect button clicked');
              setErr(null);
              await connect();
              console.log('[WalletWidget] Connect completed successfully');
            } catch (e: any) {
              console.error('[WalletWidget] Connect error:', e);
              const errorMessage = e?.message || 'Failed to connect wallet';
              // If user canceled the connect flow, do not show header text or duplicate toast
              if (typeof errorMessage === 'string' && /wallet connection canceled|user denied|rejected/i.test(errorMessage)) {
                // WalletContext already dispatched the bottom-left notification; no inline error required
              } else {
                setErr(errorMessage);
              }
            }
          }}
          sx={{
            bgcolor: 'primary.main',
            textTransform: 'none',
            fontWeight: 600,
            borderRadius: 999,
            px: 3,
            py: 1,
            '&:hover': { bgcolor: 'primary.dark' },
          }}
        >
          Connect Wallet
        </Button>
        {/* Only show inline header errors for real errors (not user-canceled flows) */}
        {err && !String(err).includes('Wallet connection canceled') && (
          <Box sx={{ fontSize: 12, color: 'error.main', mt: 1 }}>
            {err.includes('MetaMask not found')
              ? 'MetaMask not detected. On mobile, you will be redirected to open this page inside MetaMask.'
              : err}
          </Box>
        )}
      </>
    );
  }



  return (
    <Stack direction="row" spacing={2} alignItems="center" textAlign="right">
      <Box fontSize={13} lineHeight={1.2}>
        <Typography fontWeight={700}>{ethBal !== null && ethBal !== undefined ? ethBal.toFixed(4) : '0.0000'} ETH</Typography>
        <Typography color="text.secondary">
          {address ? `${address.slice(0, 6)}…${address.slice(-4)}` : ''}
        </Typography>
      </Box>

      <Button
        variant="outlined"
        size="small"
        onClick={() => {
          try { disconnect(); } catch {}
        }}
        sx={{ textTransform: 'none', borderRadius: 999, px: 2, py: 0.5 }}
      >
        Disconnect
      </Button>

    </Stack>
  );
}
