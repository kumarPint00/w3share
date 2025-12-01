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
import { useState } from 'react';
import Image from 'next/image';
import { useRouter, useSearchParams } from 'next/navigation';
import Section from '@/components/Section';
export const dynamic = 'force-dynamic';

export default function GiftReady() {
  const params = useSearchParams();
  const router = useRouter();

  const giftCode = params?.get?.('giftCode');
  const giftId = params?.get?.('giftId');

  const [copied, setCopied] = useState(false);

  const shareUrl = giftId
    ? `${location.origin}/gift/claim?giftId=${giftId}`
    : `${location.origin}/gift/claim${giftCode ? `?giftCode=${giftCode}` : ''}`;

  const copyLink = () => {
    navigator.clipboard.writeText(shareUrl);
    setCopied(true);
  };

  const share = async () => {
    try {
      if (navigator.share) {
        await navigator.share({
          title: 'DogeGift',
          text: giftId ? `Here's your onchain Gift ID: ${giftId}` : `Here's your Secret Gift Code: ${giftCode ?? ''}`,
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
            {giftId
              ? 'Share this Gift ID with the recipient so they can claim onchain.'
              : 'You\'ve just created a gift. Share the Secret Gift Code below and make someone\'s day.'}
          </Typography>

          <Paper sx={{ p: { xs: 4, md: 6 }, borderRadius: 4 }}>
            <Typography fontWeight={700} mb={2}>
              {giftId ? 'Onchain Gift ID' : 'Secret Gift Code'}
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
              {giftId ?? giftCode ?? '—'}
            </Box>

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
              onClick={() => router.push('/gift/create')}
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
      </Section>
    </>
  );
}