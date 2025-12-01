'use client';
import {
  Box,
  Container,
  Grid,
  Typography,
  Link,
  IconButton,
  styled,
} from '@mui/material';
import TwitterIcon from '@mui/icons-material/X';
import TelegramIcon from '@mui/icons-material/Telegram';
import EmailIcon from '@mui/icons-material/Email';

/* navy pill-square icon wrapper */
const SocialBtn = styled(IconButton)(({ theme }) => ({
  background: '#0D1B3E',
  color: '#fff',
  borderRadius: 8,
  width: 44,
  height: 44,
  '&:hover': { background: theme.palette.primary.dark },
}));

export default function Footer() {
  return (
    <Box
      component="footer"
      sx={{
        pt: 6,
        pb: 2,
        borderTop: '1px solid rgba(0,0,0,.05)',
        backgroundColor: '#fff',
      }}
    >
      <Container maxWidth="xl">
        <Grid container spacing={4} alignItems="flex-start">
          {/* logo */}
          <Grid item xs={12} md={3}>
            <Box display="flex" alignItems="center" gap={1}>
              <Box
                component="img"
                src="/dogegifty_logo_with_text.png"
                alt="logo"
                sx={{ width: 150, height: 36 }}
              />

            </Box>
          </Grid>

          {/* quick links */}
          <Grid item xs={6} md={3}>
            <Typography fontWeight={700} mb={1} sx={{ display: 'flex', gap: 1 }}>
                <Box
                component="img"
                src="/link_icon.png"
                alt="link icon"
                sx={{ width: 24, height: 24 }}
                />Quick Links
            </Typography>
            <ul style={{ paddingLeft: 18, margin: 0, listStyle: 'disc' }}>
              <li><Link href="#" underline="hover" color="inherit">About DogeGiFty</Link></li>
              <li><Link href="#" underline="hover" color="inherit">How It Works</Link></li>
              <li><Link href="https://www.dogegf.com" target="_blank" rel="noopener noreferrer" underline="hover" color="inherit">DogeGF Website</Link></li>
            </ul>
          </Grid>

          {/* support */}
          <Grid item xs={6} md={3}>
            <Typography fontWeight={700} mb={1} sx={{ display: 'flex', gap: 1 }}>
              <Box
              component="img"
              src="/mail_icon.png"
              alt="mail icon"
              sx={{ width: 24, height: 24 }}
              /> Support
            </Typography>
            <ul style={{ paddingLeft: 18, margin: 0, listStyle: 'disc' }}>
              <li>
                <Link
                  href="mailto:dogegf@dogegf.com"
                  underline="hover"
                  color="inherit"
                >
                  Contact Us
                </Link>
              </li>
            </ul>
          </Grid>

          {/* socials */}
          <Grid item xs={12} md={3}>
            <Typography fontWeight={700} mb={1} sx={{ display: 'flex', gap: 1 }}>
              <Box
              component="img"
              src="/hand_icon.png"
              alt="hand icon"
              sx={{ width: 24, height: 24 }}
              />
              Stay Connected
            </Typography>
            <Box display="flex" gap={1}>
              <Link 
                href="https://x.com/dogegftoken" 
                target="_blank" 
                rel="noopener noreferrer"
                sx={{ textDecoration: 'none' }}
              >
                <SocialBtn aria-label="x">
                  <TwitterIcon fontSize="small" />
                </SocialBtn>
              </Link>
              <Link 
                href="https://t.me/DogeGF_Official" 
                target="_blank" 
                rel="noopener noreferrer"
                sx={{ textDecoration: 'none' }}
              >
                <SocialBtn aria-label="telegram">
                  <TelegramIcon />
                </SocialBtn>
              </Link>
              <Link 
                href="https://discord.com/invite/EwKuFDCA5V" 
                target="_blank" 
                rel="noopener noreferrer"
                sx={{ textDecoration: 'none' }}
              >
                <SocialBtn aria-label="discord">
                  <Box
                    component="img"
                    src="/discord-white-icon.png"
                    alt="discord"
                    sx={{ width: 20, height: 20 }}
                  />
                </SocialBtn>
              </Link>
            </Box>
          </Grid>
        </Grid>

        {/* divider line */}
        <Box
          my={4}
          sx={{ height: 1, bgcolor: 'rgba(0,0,0,.06)' }}
        />

        {/* copyright */}
        <Typography
          textAlign="center"
          fontSize={14}
          color="text.secondary"
        >
          All rights reserved © DogeGF. Built with&nbsp;
          <Box component="span" sx={{ color: 'secondary.main' }}>❤️</Box>&nbsp;for the
          future of gifting.
        </Typography>
      </Container>
    </Box>
  );
}
