'use client';
import {
  Container,
  Typography,
  Grid,
  Paper,
  Box,
} from '@mui/material';
import Section from '@/components/Section';

const cardSx = {
  p: { xs: 3, md: 4 },
  borderRadius: 4,
  height: '100%',
  display: 'flex',
  flexDirection: 'column',
  gap: 1,
};

const STEPS = [
  {
    title: 'Create a Gift Pack',
    desc: 'Add tokens, NFTs, or both—whatever kindness looks like to you.',
    img: '/step-heart.png',
  },
  {
    title: 'Generate a Secret Code',
    desc: 'Lock your gift with a unique code. The pack sits in escrow until claimed.',
    img: '/step-lock.png',
  },
  {
    title: 'Share & Surprise',
    desc: 'Send the code to a friend, loved one, or stranger. Only they can unlock it.',
    img: '/step-gift.png',
  },
];

export default function HowPage() {
  return (
    <Section>
      <Container maxWidth="md">
        <Typography variant="h3" fontWeight={800} mb={1}>
          How&nbsp;It&nbsp;Works
        </Typography>
        <Typography fontSize={15} color="text.secondary" mb={5}>
          Kindness, Sealed &amp; Delivered (On-Chain)
        </Typography>

        <Grid container spacing={3}>
          {STEPS.map((s) => (
            <Grid item xs={12} md={4} key={s.title}>
              <Paper sx={cardSx}>
                <Box
                  component="img"
                  src={s.img}
                  alt={s.title}
                  sx={{ width: 80, height: 80, mb: 2 }}
                />
                <Typography fontWeight={700} mb={0.5}>
                  {s.title}
                </Typography>
                <Typography fontSize={14} color="text.secondary">
                  {s.desc}
                </Typography>
              </Paper>
            </Grid>
          ))}
        </Grid>
      </Container>
    </Section>
  );
}
