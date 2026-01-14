'use client';
import { useWallet } from '@/context/WalletContext';
import { getEthBalance } from '@/lib/balance';
import { walletLogin } from '@/lib/api';
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
  const [authing, setAuthing] = useState(false);
  const [authErr, setAuthErr] = useState<string | null>(null);
  const [hasToken, setHasToken] = useState<boolean>(false);

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

  useEffect(() => {
    try {
      setHasToken(!!localStorage.getItem('auth_token'));
    } catch {}
  }, [provider, address]);

  useEffect(() => {
    const shouldLogin = connected && provider && !hasToken && !authing && !authErr;
    if (!shouldLogin) return;

    (async () => {
      try {
        setAuthErr(null);
        setAuthing(true);
        await walletLogin(provider!);
        setHasToken(true);
      } catch (e: any) {
        if (e?.code === 4001 || e?.message?.includes('rejected')) {
          console.log('[WalletWidget] User rejected signing');
          setAuthErr('Signature rejected. Please click "Sign in" to try again.');
        } else {
          setAuthErr(e?.message || 'Failed to sign in');
        }
      } finally {
        setAuthing(false);
      }
    })();
  }, [connected, provider, hasToken, authing, authErr]);

  if (connected && ethBal === undefined) {
    return <CircularProgress size={22} sx={{ mx: 2 }} />;
  }

  if (!connected) {
    // Show rejection message and stop re-prompting
    if (connectionRejected) {
      return (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <Typography sx={{ fontSize: 12, color: 'error.main', fontWeight: 500 }}>
            ✗ Connection rejected
          </Typography>
          <Button
            variant="outlined"
            size="small"
            onClick={async () => {
              try {
                console.log('[WalletWidget] Retrying after rejection');
                setErr(null);
                await connect();
                clearConnectionRejection();
              } catch (e: any) {
                console.error('[WalletWidget] Retry failed:', e);
                const errorMessage = e?.message || 'Failed to connect wallet';
                setErr(errorMessage);
              }
            }}
            sx={{ textTransform: 'none', borderRadius: 999, px: 2, py: 0.5 }}
          >
            Try Again
          </Button>
        </Box>
      );
    }

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
              setErr(errorMessage);
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
        {err && (
          <Box sx={{ fontSize: 12, color: 'error.main', mt: 1 }}>
            {err.includes('MetaMask not found')
              ? 'MetaMask not detected. On mobile, you will be redirected to open this page inside MetaMask.'
              : err}
          </Box>
        )}
      </>
    );
  }

  const handleManualSignIn = async () => {
    if (!provider) return;
    try {
      setAuthErr(null);
      setAuthing(true);
      await walletLogin(provider);
      setHasToken(true);
    } catch (e: any) {
      if (e?.code === 4001 || e?.message?.includes('rejected')) {
        setAuthErr('Signature rejected. Please try again.');
      } else {
        setAuthErr(e?.message || 'Failed to sign in');
      }
    } finally {
      setAuthing(false);
    }
  };

  return (
    <Stack direction="row" spacing={2} alignItems="center" textAlign="right">
      <Box fontSize={13} lineHeight={1.2}>
        <Typography fontWeight={700}>{ethBal !== null && ethBal !== undefined ? ethBal.toFixed(4) : '0.0000'} ETH</Typography>
        <Typography color="text.secondary">
          {address ? `${address.slice(0, 6)}…${address.slice(-4)}` : ''}
        </Typography>
      </Box>
      {(!hasToken || authErr) && (
        <Button
          variant="outlined"
          size="small"
          onClick={handleManualSignIn}
          disabled={authing}
          sx={{ textTransform: 'none', borderRadius: 999, px: 2, py: 0.5 }}
        >
          {authing ? <CircularProgress size={16} /> : 'Sign in'}
        </Button>
      )}
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
      {authErr && (
        <Box sx={{ fontSize: 12, color: 'error.main', ml: 1 }}>
          {authErr}
        </Box>
      )}
    </Stack>
  );
}
