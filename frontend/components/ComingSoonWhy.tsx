'use client';
import { useState } from 'react';
import Image from 'next/image';
import {
  Box,
  Container,
  Typography,
  Button,
  Stack,
  Snackbar,
  Alert,
} from '@mui/material';
import BoltIcon from '@mui/icons-material/Bolt';
import LaunchIcon from '@mui/icons-material/Launch';

const radialBg = {
  xs: 'radial-gradient(circle at 50% 0%, #93c5fd 0%, #bfdbfe 35%, #dbeafe 100%)',
  md: 'radial-gradient(circle at 50% 0%, #dbeafe 0%, #e0f2fe 40%, #f0f9ff 100%)',
};

const heading = (size: { xs: string; md: string }) => ({
  fontWeight: 800,
  fontSize: size,
  lineHeight: 1.05,
});

const primaryBtn = {
  px: 5,
  py: 1.5,
  borderRadius: 6,
  fontWeight: 700,
};

export default function ComingSoonWhy() {
  const [open, setOpen] = useState(false);

  return (
    <Box
      component="section"
      sx={{
        py: { xs: 8, md: 12 },
        display: 'flex',
        justifyContent: 'center',
        background: radialBg,
        width: '100%',
      }}
    >
      <Container>
        <Stack spacing={{ xs: 10, md: 14 }} alignItems="center">
          {/* Blue card */}
          <Box
            sx={{
              width: { xs: '100%', md: '3900px' },
              maxWidth: '100%',
              mx: 'auto',
              height: { xs: 'auto', md: '60vh' },
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              textAlign: 'center',
              px: { xs: 3, md: 8 },
              py: { xs: 6, md: 10 },
              borderRadius: { xs: 4, md: 10 },
              color: '#fff',
              background: (theme) => `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.primary.dark} 100%)`,
              boxShadow: { xs: 'none', md: '0 18px 60px -16px rgba(0,0,0,0.35)' },
              position: 'relative',
              overflow: 'hidden',
              '&::after': {
                content: '""',
                position: 'absolute',
                inset: 0,
                borderRadius: 'inherit',
                background:
                  'linear-gradient(145deg, rgba(255,255,255,0.15), rgba(255,255,255,0))',
                mixBlendMode: 'overlay',
                pointerEvents: 'none',
              },
            }}
          >
            <Typography
              sx={{
                mb: 1,
                fontFamily: '"JetBrains Mono", monospace',
                fontSize: { xs: 14, md: 18 },
                letterSpacing: 1,
                color: 'rgba(255,255,255,0.85)',
              }}
            >
              We&rsquo;re just getting started
            </Typography>

            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 1,
                flexWrap: 'nowrap',
                whiteSpace: 'nowrap',
                mb: 2,
              }}
            >
              <Typography
                component="h1"
                sx={{
                  ...heading({ xs: '1.6rem', md: '3.2rem' }),
                  color: 'rgba(255,255,255,0.95)',
                  fontWeight: 800,
                  textAlign: 'center',
                }}
              >
                Kindness for Everyone
              </Typography>

              <Box sx={{ display: { xs: 'none', md: 'inline-flex' } }}>
                <Image src="/kindness_for_causes_icon.png" alt="Kindness for causes" width={44} height={44} />
              </Box>
            </Box>

            <Typography
              sx={{
                maxWidth: { xs: '100%', md: 640 },
                mx: 'auto',
                fontSize: { xs: 13, md: 18 },
                lineHeight: 1.5,
                opacity: 0.9,
                mb: { xs: 4, md: 5 },
                color: 'rgba(255,255,255,0.9)',
                px: { xs: 1.5, md: 0 },
              }}
            >
              DogeGiFty is in its early days, and we&rsquo;re building fast. More features and more
              ways to share are coming soon. Stay tuned.
            </Typography>

            <Box sx={{ display: 'flex', justifyContent: 'center' }}>
              <Button
                size="large"
                onClick={() => window.open('https://x.com/dogegftoken', '_blank')}
                endIcon={
                  <Box component="span" sx={{ display: 'flex', alignItems: 'center', ml: 1 }}>
                    <Image src="/x_icon.png" alt="X (Twitter)" width={16} height={16} />
                  </Box>
                }
                sx={{ ...primaryBtn, px: { xs: 3, md: 5 }, mt: { xs: 0, md: 3 }, bgcolor: '#fff', color: 'primary.main', '&:hover': { bgcolor: 'rgba(255,255,255,0.9)' } }}
              >
                Follow our journey on
              </Button>
            </Box>

            <Snackbar open={open} autoHideDuration={2500} onClose={() => setOpen(false)}>
              <Alert severity="success" variant="filled">
                We&rsquo;ll keep you posted!
              </Alert>
            </Snackbar>
          </Box>

          {/* Why DogeGF */}
          <Box textAlign="center">
            <Typography component="h2" sx={heading({ xs: '2rem', md: '3rem' })}>
              Why&nbsp;DogeGF&nbsp;?
            </Typography>

            <Typography
              sx={{
                maxWidth: 800,
                mx: 'auto',
                fontSize: { xs: 17, md: 20 },
                mb: 5,
                color: 'rgba(0,0,0,0.85)',
              }}
            >
              DogeGF stands for kindness, community, and heart. With DogeGiFty we&rsquo;re
              turning that spirit into action—empowering everyday people to spread kindness in
              a fun, decentralized way.
            </Typography>

            <Button
              href="https://dogegf.com"
              target="_blank"
              rel="noopener noreferrer"
              endIcon={<LaunchIcon fontSize="small" />}
              sx={{ ...primaryBtn, bgcolor: 'primary.main', color: 'white', '&:hover': { bgcolor: 'primary.dark' } }}
            >
              Learn more about&nbsp;DogeGF
            </Button>
          </Box>
        </Stack>
      </Container>
    </Box>
  );
}
