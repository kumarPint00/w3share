'use client';
import {
  Container,
  Typography,
  Button,
  Paper,
  Stack,
} from '@mui/material';
import { useRouter, useSearchParams } from 'next/navigation';
import Section from '@/components/Section';
export const dynamic = 'force-dynamic';

export default function GiftConfirmPage() {
  const router       = useRouter();
  const searchParams = useSearchParams();
  const code         = searchParams.get('code') ?? '—';

  return (
    <Section>
      <Container maxWidth="sm" sx={{ textAlign: 'center' }}>
        <Paper sx={{ p: { xs: 4, md: 6 }, borderRadius: 4 }}>
          <Typography variant="h4" fontWeight={800} mb={2}>
            Gift Locked on-chain ✅
          </Typography>

          <Typography fontSize={15} color="text.secondary" mb={4}>
            Your pack is now safely in escrow. Share the secret code below with the lucky recipient.
          </Typography>

          <Typography
            sx={{
              bgcolor: '#eeeeee',
              display: 'inline-block',
              px: 6,
              py: 2,
              fontWeight: 800,
              letterSpacing: 1,
              borderRadius: 1,
              mb: 4,
            }}
          >
            {code}
          </Typography>

          <Stack spacing={2}>
            <Button
              variant="contained"
              size="large"
              sx={{
                bgcolor: 'primary.main',
                textTransform: 'none',
                fontWeight: 700,
                borderRadius: 999,
                px: 6,
              }}
              onClick={() => router.push('/')}
            >
              Back to Home
            </Button>

            <Button
              variant="outlined"
              size="large"
              sx={{ textTransform: 'none', borderRadius: 999, px: 6 }}
              onClick={() => router.push('/gift/create')}
            >
              Create Another Gift
            </Button>
          </Stack>

          <Typography mt={4} fontSize={13} color="text.secondary">
            Anyone with this code can unlock the pack—share wisely!
          </Typography>
        </Paper>
      </Container>
    </Section>
  );
}
