'use client';
import {
  Container,
  Typography,
  Paper,
  Box,
  Stack,
  Button,
  Snackbar,
  Alert,
} from '@mui/material';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import ShareIcon from '@mui/icons-material/Share';
import { useState, useContext, useEffect } from 'react';
import Image from 'next/image';
import { useRouter, useSearchParams } from 'next/navigation';
import Section from '@/components/Section';
import EscrowContext from '@/context/EscrowContext';
export const dynamic = 'force-dynamic';

export default function GiftReady() {
  const params = useSearchParams();
  const router = useRouter();

  const giftCode = params?.get?.('giftCode');
  const giftId = params?.get?.('giftId');
  const txHash = params?.get?.('txHash');
  const txHashesParam = params?.get?.('txHashes');
  const multiCount = params?.get?.('multi');
  const txHashes = txHashesParam ? txHashesParam.split(',') : (txHash ? [txHash] : []);
  const blockNumber = params?.get?.('blockNumber');

  const [copied, setCopied] = useState(false);
  const [txCopied, setTxCopied] = useState(false);
  const [showSuccessToast, setShowSuccessToast] = useState(false);
  const escrowCtx = useContext(EscrowContext);

  // Get the origin for sharing URLs (works in browser environment)
  const origin = typeof window !== 'undefined' ? window.location.origin : process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

  // Always prioritize gift code for sharing, as that's what recipients need to claim
  const shareUrl = giftCode 
    ? `${origin}/gift/claim?giftCode=${giftCode}`
    : giftId 
    ? `${origin}/gift/claim?giftId=${giftId}`
    : `${origin}/gift/claim`;

  const copyLink = () => {
    navigator.clipboard.writeText(shareUrl);
    setCopied(true);
  };

  const share = async () => {
    try {
      if (navigator.share) {
        await navigator.share({
          title: 'DogeGift',
          text: giftCode ? `Here's your Secret Gift Code: ${giftCode}` : `Here's your onchain Gift ID: ${giftId ?? ''}`,
          url: shareUrl,
        });
      } else {
        await navigator.clipboard.writeText(shareUrl);
        setCopied(true);
      }
    } catch {
      /* no-op */
    }
  };

  // Show success toast when navigated here after lock
  const toastFlag = params?.get?.('toast');
  useEffect(() => {
    if (toastFlag === 'locked') {
      setShowSuccessToast(true);
    }
  }, [toastFlag]);

  return (
    <>
      <Section
        sx={{
          background: 'linear-gradient(130deg, #b3d9ff 0%, #d5ecff 45%, #ffe1f0 90%)',
          position: 'relative',
          overflow: 'hidden',
          '&:before, &:after': {
            content: '""',
            position: 'absolute',
            borderRadius: '50%',
            filter: 'blur(80px)',
            opacity: 0.55,
          },
          '&:before': {
            width: 420,
            height: 420,
            left: -120,
            top: 260,
            background: 'radial-gradient(circle at 30% 30%, rgba(255,255,255,0.9), rgba(255,255,255,0))'
          },
          '&:after': {
            width: 520,
            height: 520,
            right: -160,
            top: -120,
            background: 'radial-gradient(circle at 70% 40%, rgba(255,255,255,0.85), rgba(255,255,255,0))'
          }
        }}
      >
        <Container
          maxWidth="md"
          sx={{
            py: 10,
            textAlign: 'center',
            position: 'relative',
          }}
        >
          <Image
            src="/dogegifty_logo_without_text.png"
            alt="gift icon"
            width={120}
            height={140}
            priority
            style={{ margin: '0 auto 16px' }}
          />

          <Typography variant="h3" fontWeight={800} mb={1}>
            Your Gift Is Ready!
          </Typography>
          <Typography fontSize={15} color="text.secondary" mb={5}>
            {giftCode
              ? 'Share this Secret Gift Code with the recipient so they can claim onchain.'
              : 'You\'ve just created a gift. Share the Gift ID below and make someone\'s day.'}
          </Typography>

          <Paper sx={{ p: { xs: 4, md: 6 }, borderRadius: 4 }}>
            <Typography fontWeight={700} mb={2}>
              {giftCode ? 'Secret Gift Code' : 'Onchain Gift ID'}
            </Typography>

            <Box
              sx={{
                bgcolor: '#eeeeee',
                borderRadius: 1,
                px: 6,
                py: 2,
                mb: 2.5,
                fontWeight: 800,
                letterSpacing: 1,
                fontSize: 22,
                display: 'inline-block',
              }}
            >
              {giftCode ?? giftId ?? '—'}
            </Box>

            {/* Transaction Hash Section */}
            {txHashes.length > 0 && (
              <Box sx={{ mt: 3, mb: 3 }}>
                <Typography fontWeight={700} mb={1} color="text.secondary" fontSize={14}>
                  Transaction {txHashes.length > 1 ? 'Hashes' : 'Hash'} {multiCount ? `(${multiCount} tokens)` : ''}
                </Typography>
                {txHashes.map((h, i) => (
                  <Box
                    key={`tx-${i}`}
                    sx={{
                      bgcolor: '#f5f5f5',
                      borderRadius: 1,
                      px: 3,
                      py: 1.5,
                      mb: 1,
                      fontFamily: 'monospace',
                      fontSize: 14,
                      wordBreak: 'break-all',
                      border: '1px solid #e0e0e0',
                    }}
                  >
                    {h}
                    <Stack direction="row" spacing={1} justifyContent="flex-end" sx={{ mt: 1 }}>
                      <Button
                        variant="outlined"
                        size="small"
                        startIcon={<ContentCopyIcon fontSize="small" />}
                        onClick={() => {
                          navigator.clipboard.writeText(h);
                          setTxCopied(true);
                        }}
                        sx={{ textTransform: 'none', fontWeight: 600, mr: 1 }}
                      >
                        Copy
                      </Button>
                      <Button
                        variant="contained"
                        size="small"
                        onClick={() => {
                          const explorerUrl = `https://etherscan.io/tx/${h}`;
                          window.open(explorerUrl, '_blank');
                        }}
                        sx={{ textTransform: 'none', fontWeight: 600, bgcolor: '#1976d2' }}
                      >
                        View
                      </Button>
                    </Stack>
                  </Box>
                ))}
                {blockNumber && (
                  <Typography fontSize={12} color="text.secondary">
                    Block: {blockNumber}
                  </Typography>
                )}
              </Box>
            )}

            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} justifyContent="center" mb={4}>
              <Button 
                variant="outlined" 
                startIcon={<ContentCopyIcon fontSize="small" />} 
                onClick={copyLink} 
                sx={{ 
                  textTransform: 'none', 
                  minWidth: 140, 
                  fontWeight: 700,
                  '&:disabled': {
                    background: '#9e9e9e',
                    color: '#ffffff',
                    borderColor: '#9e9e9e'
                  }
                }}
              >
                Copy Link
              </Button>

              <Button 
                variant="outlined" 
                startIcon={<ShareIcon fontSize="small" />} 
                onClick={share} 
                sx={{ 
                  textTransform: 'none', 
                  minWidth: 140, 
                  fontWeight: 700,
                  '&:disabled': {
                    background: '#9e9e9e',
                    color: '#ffffff',
                    borderColor: '#9e9e9e'
                  }
                }}
              >
                Share Link
              </Button>
            </Stack>

            <Typography fontSize={13} color="text.secondary" mb={4}>
              {giftId
                ? 'Anyone with this Gift ID can claim the pack—share wisely!'
                : 'Don\'t post this publicly unless you want anyone to claim it!'}
            </Typography>

            <Button
              variant="contained"
              size="large"
              sx={{
                textTransform: 'none',
                fontWeight: 700,
                borderRadius: 2,
                px: 6,
                py: 1.25,
                background: 'primary.main',
                '&:hover': {
                  background: 'primary.dark',
                },
                '&:disabled': {
                  background: '#9e9e9e',
                  color: '#ffffff'
                }
              }}
              onClick={() => {
                try {
                  if (escrowCtx && Array.isArray(escrowCtx) && typeof escrowCtx[1] === 'function') {
                    const dispatch = escrowCtx[1] as any;
                    dispatch({ type: 'reset' });
                  }
                } catch (err) {
                  // ignore if context not available
                }
                router.push('/gift/create');
              }}
            >
              Create Another Gift
            </Button>
          </Paper>
        </Container>

        <Snackbar open={copied} autoHideDuration={2000} onClose={() => setCopied(false)}>
          <Alert severity="success" variant="filled">
            Link copied!
          </Alert>
        </Snackbar>
        
        <Snackbar
          open={txCopied}
          autoHideDuration={1500}
          onClose={() => setTxCopied(false)}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
        >
          <Alert severity="success">Transaction hash copied!</Alert>
        </Snackbar>
        <Snackbar
          open={showSuccessToast}
          autoHideDuration={8000}
          onClose={() => setShowSuccessToast(false)}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
        >
          <Alert severity="success" variant="filled">
            Gift pack successfully locked.
          </Alert>
        </Snackbar>
      </Section>
    </>
  );
}