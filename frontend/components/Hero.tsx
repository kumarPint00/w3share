"use client";
import Section from '@/components/Section';
import { Container, Grid, Typography, Box } from '@mui/material';
import BackgroundRemoverImage from '@/components/BackgroundRemoverImage';

export default function Hero() {
  return (
    <Section
      sx={{
        background: 'linear-gradient(135deg, #a7c7ff 0%, #e0f2fe 45%, #a7c7ff 100%)',
        px: { xs: 4, lg: 8 },
        py: { xs: 8, lg: 12 },
        pt: { xs: 10, lg: 16 },
      }}
    >
      <Container maxWidth="xl">
        <Grid container alignItems="center" spacing={4}>
          {/* Left Text Content - takes 2/3 of the space */}
          <Grid item xs={12} lg={7}>
            <Box sx={{
              textAlign: 'left',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'flex-start',
              justifyContent: 'center',
              minHeight: { lg: 480 }
            }}>
                <Typography
                component="h1"
                sx={{
                  fontWeight: 800,
                  fontSize: { xs: '3rem', sm: '4rem', md: '5rem', lg: '4rem' },
                  lineHeight: 0.95,
                  mb: 3,
                  textAlign: 'left',
                  WebkitBackgroundClip: 'text',
                  letterSpacing: '-0.02em',
                }}
                >
                <Box component="span" sx={{ display: { xs: 'block', lg: 'inline' }, color: '#ff3b82' }}>Send Kindness,</Box>
                <Box component="span" sx={{ display: { xs: 'block', lg: 'inline' }, color: '#0068ff' }}>Onchain.</Box>
                </Typography>

              <Typography
                sx={{
                  color: '#374151',
                  fontSize: { xs: '1rem', md: '1.125rem' },
                  lineHeight: 1.6,
                  maxWidth: 680,
                  mb: 4,
                }}
              >
                <strong>Send onchain gifts in seconds. </strong>DogeGiFty makes it easy to spread kind gestures — fast, secure and delightful.
              </Typography>

              {/* CTAs removed per design — hero shows headline, subtitle and illustration only */}
            </Box>
          </Grid>

          {/* Right Image - takes 1/3 of the space */}
          <Grid item xs={12} lg={5}>
            <Box sx={{
              display: 'flex',
              justifyContent: { xs: 'center', lg: 'flex-end' },
              alignItems: 'center',
              pr: { lg: 6 },
            }}>
              <Box sx={{ width: { xs: 300, md: 420 }, mt: { xs: 4, md: 0 } }}>
                <BackgroundRemoverImage
                  src="/dogegf_illustration.png"
                  alt="DogeGiFty gift illustration"
                  width={600}
                  height={600}
                />
              </Box>
            </Box>
          </Grid>
        </Grid>
      </Container>
    </Section>
  );
}
