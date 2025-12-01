'use client';
import React from 'react';
import Section from '@/components/Section';
import {
  Container,
  Grid,
  Typography,
  Paper,
  Box,
  useTheme,
} from '@mui/material';
import Image from 'next/image';
import BackgroundRemoverImage from '@/components/BackgroundRemoverImage';

interface Card {
  title: string;
  body: string;
  img: string;
}

const CARDS: Card[] = [
  {
    title: 'Create a Gift Pack',
    body: 'Write a message and add tokens to turn kindness into a gift.',
    img: '/dogpaw.png',
  },
  {
    title: 'Generate a Secret Code',
    body: 'Lock your gift with a unique code. The pack goes into escrow until someone claims it with the code.',
    img: '/lock.png',
  },
  {
    title: 'Share & Surprise',
    body: 'Send the secret code to a friend, loved one, or stranger. Only they can unlock the pack and claim your gift.',
    img: '/giftbox.png',
  },
];

export default function How() {
  const theme = useTheme();

  return (
    <Section
      sx={{
        bgcolor: '#E1EFFF',
        py: { xs: 6, md: 10 },
      }}
    >
      <Container maxWidth="xl">
        <Grid container spacing={{ xs: 4, md: 6 }} alignItems="flex-start">
          {/*  LEFT  */}
          <Grid item xs={12} md={4}>
            <Box sx={{
              textAlign: { xs: 'center', md: 'left' },
              mb: { xs: 2, md: 0 }
            }}>
              <Typography
                variant="h2"
                fontWeight={800}
                color="primary.main"
                mb={1}
                sx={{
                  fontSize: { xs: '2rem', md: '2.5rem' }
                }}
              >
                How It Works
              </Typography>
              <Typography
                color="primary.main"
                fontSize={{ xs: 16, md: 18 }}
                sx={{ maxWidth: { xs: '100%', md: 'none' } }}
              >
                Kindness, Sealed &amp; Delivered (OnChain)
              </Typography>
            </Box>
          </Grid>

          {/*  RIGHT  */}
          <Grid item xs={12} md={8}>
            <Grid container spacing={{ xs: 2, md: 3 }}>
              {CARDS.map((c, idx) => (
                <Grid
                  key={c.title}
                  item
                  xs={12}
                  sm={6}
                  md={idx < 2 ? 6 : 12}
                >
                  <Paper
                    sx={{
                      p: { xs: 3, md: 4 },
                      borderRadius: { xs: 3, md: '28px' },
                      height: 1,
                      display: 'flex',
                      flexDirection: 'column',
                      boxShadow:
                        '0 8px 30px -12px rgba(6,30,60,0.12), 0 2px 6px rgba(12,24,48,0.06)',
                      minHeight: { xs: 200, md: 280 },
                      position: 'relative',
                    }}
                  >
                    <Box sx={{ 
                      flex: 1, 
                      pr: { xs: 5, md: 8 },
                      pb: { xs: 5, md: 4 }
                    }}>
                      <Typography
                        variant="h6"
                        fontWeight={700}
                        mb={1}
                        sx={{ fontSize: { xs: '1.1rem', md: '1.25rem' } }}
                      >
                        {c.title}
                      </Typography>
                      <Typography
                        color="text.secondary"
                        sx={{ fontSize: { xs: '0.95rem', md: '1rem' } }}
                      >
                        {c.body}
                      </Typography>
                    </Box>

                    {/* image area: for the last card place a larger gift anchored to bottom-right */}
                    {idx === 2 ? (
                      <Box sx={{ 
                        position: 'absolute', 
                        bottom: { xs: 8, md: 12 }, 
                        right: { xs: 8, md: 12 }, 
                        width: { xs: 70, md: 100 }, 
                        height: { xs: 70, md: 100 },
                        pointerEvents: 'none' 
                      }}>
                        <BackgroundRemoverImage
                          src={c.img}
                          alt={c.title}
                          width={100}
                          height={100}
                          threshold={255}
                          channelDiff={80}
                          crop
                          cropPadding={2}
                          removeLightNeutral
                          lightnessCutoff={0.88}
                          saturationCutoff={0.22}
                          showSkeleton={false}
                        />
                      </Box>
                    ) : (
                      <Box
                        sx={{
                          position: 'absolute',
                          bottom: { xs: 8, md: 16 },
                          right: { xs: 8, md: 16 },
                          width: { xs: 70, md: 100 },
                          height: { xs: 70, md: 100 }
                        }}
                      >
                        <Image
                          src={c.img}
                          alt={c.title}
                          width={100}
                          height={100}
                          style={{
                            width: '100%',
                            height: '100%',
                            objectFit: 'contain',
                          }}
                          priority={idx === 0}
                        />
                      </Box>
                    )}
                  </Paper>
                </Grid>
              ))}
            </Grid>
          </Grid>
        </Grid>
      </Container>
    </Section>
  );
}
