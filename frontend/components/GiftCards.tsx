"use client";
import Image from 'next/image';
import { Box, Button, Container, Grid, Typography } from '@mui/material';
import ArrowOutwardIcon from '@mui/icons-material/ArrowOutward';
import Section from '@/components/Section';
import { useRouter } from 'next/navigation';

type CardSpec = {
  title: string;
  blurb: string;
  href: string;
  btnLabel: string;
  bg: string;
  text: string;
  btn: string;
  btnHover: string;
  img: string;
  imgW: { xs: number; md: number };
  imgH: { xs: number; md: number };
  cardH: { xs: number; sm: number };
};

function GiftCard({
  title,
  blurb,
  href,
  btnLabel,
  bg,
  text,
  btn,
  btnHover,
  img,
  imgW,
  imgH,
  cardH,
}: CardSpec) {
  const router = useRouter();

  const handleClick = async () => {



    router.push(href);
  };
  return (
    <Box
      sx={{
        height: cardH,
        borderRadius: { xs: 4, md: 8 },
        overflow: 'hidden',
        position: 'relative',
        background: bg,
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      {/* copy text */}
      <Box sx={{ p: { xs: 3.5, md: 5 }, color: text, flexGrow: 1 }}>
        <Typography
          component="h2"
          sx={{
            fontWeight: 900,
            fontSize: { xs: '1.9rem', md: '2.4rem' },
            lineHeight: 1.15,
            fontFamily: ' __JetBrains_Mono_3c557b',
            mb: 2,
            color: text,
            letterSpacing: '-0.02em',
          }}
        >
          {title}
        </Typography>

        <Typography
          sx={{
            fontSize: { xs: '0.95rem', md: '1.05rem' },
            lineHeight: 1.45,
            maxWidth: 300,
            mb: 5,
            opacity: 0.94,
            fontWeight: 500,
            color: text,
            fontFamily: 'Inter, sans-serif',
            letterSpacing: '-0.01em',
          }}
        >
          {blurb}
        </Typography>

        <Button
          onClick={handleClick}
          sx={{
            position: 'relative',
            zIndex: 3,
            px: 4,
            py: 1.4,
            borderRadius: 999,
            fontWeight: 600,
            bgcolor: btn,
            '&:hover': { bgcolor: btnHover },
            color: '#fff',
            textTransform: 'none',
            fontSize: '0.9rem',
            gap: 1,
            '&:disabled': {
              opacity: 0.7,
              bgcolor: btn,
            },
          }}
        >
          {btnLabel}
          <ArrowOutwardIcon sx={{ fontSize: 16 }} />
        </Button>
      </Box>

      {/* illustration */}
      <Box
        sx={{
          position: 'absolute',
          zIndex: 1,
          bottom: 0,
          right: 0,
          width: '65%',
          height: '70%',
          minWidth: { xs: 180, md: 220 },
          minHeight: { xs: 160, md: 200 },
          pointerEvents: 'none',
        }}
      >
        <Image
          src={img}
          alt={title}
          fill
          style={{ 
            objectFit: 'contain', 
            objectPosition: 'bottom right',
            marginTop:  '42px' ,
            marginLeft:  '32px',
            transform:  'rotate(-18deg)'
          }}
        />
      </Box>
    </Box>
  );
}

export default function GiftCards() {
  const cards: CardSpec[] = [
    {
      title: 'Create a Gift Pack',
      blurb:
        'Choose an amount, add a message, and send crypto as a unique digital gift.',
      href: '/gift/create',
      btnLabel: 'Start Gifting',
      bg: 'linear-gradient(145deg,#0062ff 0%,#0038ff 100%)',
      text: '#ffffff',
      btn: '#ff5f95',
      btnHover: '#ff4685',
      img: '/create-gift.png',
      imgW: { xs: 180, md: 220 },
      imgH: { xs: 160, md: 200 },
      cardH: { xs: 480, sm: 620 },
    },
    {
      title: 'Claim a Gift Pack',
      blurb: 'Your gift is ready to claim. Just follow a few steps to unlock it.',
      href: '/gift/claim',
      btnLabel: 'Start Claiming',
      bg: 'linear-gradient(145deg,#ffd6e6 0%,#fbbad2 100%)',
      text: '#ff3b82',
      btn: '#1955ff',
      btnHover: '#1d4ed8',
      img: '/claimgift.webp',
      imgW: { xs: 180, md: 220 },
      imgH: { xs: 160, md: 200 },
      cardH: { xs: 480, sm: 620 },
    },
  ];

  return (
    <Section sx={{ px: { xs: 2, lg: 6 }, py: { xs: 4, lg: 8 } }}>
      <Container maxWidth="xl">
        <Grid container spacing={{ xs: 4, lg: 6 }}>
          {cards.map((c) => (
            <Grid key={c.title} item xs={12} lg={6}>
              <GiftCard {...c} />
            </Grid>
          ))}
        </Grid>
      </Container>
    </Section>
  );
}
