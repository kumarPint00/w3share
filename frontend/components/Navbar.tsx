'use client';
import {
  AppBar,
  Box,
  Button,
  Container,
  Snackbar,
  Alert,
  Stack,
  Toolbar,
  Typography,
  Drawer,
  List,
  ListItem,
  ListItemButton,
  ListItemText,
  IconButton,
} from '@mui/material';
import { useRouter } from 'next/navigation';
import { useContext, useState } from 'react';
import EscrowContext from '@/context/EscrowContext';

import WalletWidget from './WalletWidget';
import { useWallet } from '@/context/WalletContext';
import Image from 'next/image';

export default function Navbar() {
  const router = useRouter();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { address, connect } = useWallet();

  const [err, setErr] = useState<string | null>(null);
  const [state, dispatch]  = useContext(EscrowContext)!;

  const handleNavigate = (href: string) => {

    if (href.startsWith('#')) {
      const el = document.querySelector(href);
      if (el) el.scrollIntoView({ behavior: 'smooth' });
    } else {
      router.push(href);
    }
    setMobileMenuOpen(false);
  };


  const menuItems = [
    { label: 'How it Works', href: '/learn', external: false },
    { label: 'DogeGF', href: '/why', external: false },
    { label: 'Create Gift', href: '/gift/create', external: false },
    { label: 'Claim Gift', href: '/gift/claim', external: false },

  ];

  return (
    <>
      <Box
        component="nav"
        sx={{
          position: 'sticky',
          top: 0,
          left: 0,
          right: 0,
          width: '100%',
          background: 'radial-gradient(circle at 0% 0%, #60a5fa 0%, rgba(96,165,250,0) 45%), #e0f2fe',
          zIndex: 1200,
          px: { xs: 2, lg: 6 },
          py: 2,
        }}
      >
        <Container maxWidth="xl">
          <Toolbar
            disableGutters
            sx={{
              position: 'relative',
              bgcolor: 'background.paper',
              borderRadius: 28,
              px: { xs: 2, md: 3 },
              py: { xs: 1.5, md: 2 },
              border: '1px solid rgba(14,14,16,0.06)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 6px 30px rgba(3,3,10,0.06)',
              minHeight: 64,
            }}
          >
            {/* Left: Logo (absolutely positioned) */}
            <Box
              component="a"
              href="/"
              sx={{
                position: 'absolute',
                left: { xs: 12, md: 20 },
                top: '50%',
                transform: 'translateY(-50%)',
                display: 'flex',
                alignItems: 'center',
                textDecoration: 'none',
                gap: 1,
              }}
            >
              <Image src="/dogegifty_logo_with_text.png" alt="DogeGiFty Logo" width={150} height={36} />
            </Box>

            {/* Center: Nav links */}
            <Box sx={{ display: { xs: 'none', md: 'block' } }}>
              <Stack direction="row" spacing={4} alignItems="center">
                {menuItems.map((l) => (
                  <Button
                    key={l.label}
                    size="small"
                    onClick={() => handleNavigate(l.href)}
                    sx={{
                      bgcolor: 'transparent',
                      color: 'text.primary',
                      px: 2,
                      py: 1,
                      borderRadius: 999,
                      fontSize: 15,
                      fontWeight: 700,
                      textTransform: 'none',
                      '&:hover': {
                        bgcolor: 'rgba(13, 71, 161, 0.04)',
                      },
                    }}
                  >
                    {l.label}
                  </Button>
                ))}
              </Stack>
            </Box>

            {/* Right: Wallet (absolutely positioned) */}
            <Box sx={{ position: 'absolute', right: { xs: 12, md: 20 }, top: '50%', transform: 'translateY(-50%)', display: { xs: 'none', md: 'block' } }}>
              <WalletWidget />
            </Box>

            {/* Mobile: hamburger on the right */}
            <Box sx={{ display: { xs: 'block', md: 'none' }, position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)' }}>
              <IconButton
                onClick={() => setMobileMenuOpen(true)}
                sx={{
                  minWidth: 'auto',
                  p: 1,
                  color: 'text.primary',
                }}
              >
                <svg width="24" height="24" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </IconButton>
            </Box>
          </Toolbar>
        </Container>
      </Box>

      {/* Mobile Menu Drawer */}
      <Drawer
        anchor="right"
        open={mobileMenuOpen}
        onClose={() => setMobileMenuOpen(false)}
        sx={{
          '& .MuiDrawer-paper': {
            width: 280,
            bgcolor: '#e0f2fe',
            background: 'radial-gradient(circle at 0% 0%, #60a5fa 0%, rgba(96,165,250,0) 45%), #e0f2fe',
          },
        }}
      >
        <Box sx={{ p: 3 }}>
          {/* Wallet Widget */}
          <Box sx={{ mb: 4 }}>
            <WalletWidget />
          </Box>

          {/* Menu Items */}
          <List>
            {menuItems.map((item) => (
              <ListItem key={item.label} disablePadding>
                {item.external ? (
                  <ListItemButton
                    component="a"
                    href={item.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    sx={{
                      borderRadius: 2,
                      mb: 1,
                      bgcolor: '#bfdbfe',
                      color: '#1d4ed8',
                      '&:hover': {
                        bgcolor: '#93c5fd',
                      },
                    }}
                  >
                    <ListItemText
                      primary={item.label}
                      sx={{
                        '& .MuiListItemText-primary': {
                          fontWeight: 600,
                          fontSize: 16,
                        },
                      }}
                    />
                  </ListItemButton>
                ) : (
                  <ListItemButton
                    onClick={() => handleNavigate(item.href)}
                    sx={{
                      borderRadius: 2,
                      mb: 1,
                      bgcolor: '#bfdbfe',
                      color: '#1d4ed8',
                      '&:hover': {
                        bgcolor: '#93c5fd',
                      },
                    }}
                  >
                    <ListItemText
                      primary={item.label}
                      sx={{
                        '& .MuiListItemText-primary': {
                          fontWeight: 600,
                          fontSize: 16,
                        },
                      }}
                    />
                  </ListItemButton>
                )}
              </ListItem>
            ))}
          </List>
        </Box>
      </Drawer>

      <Snackbar open={!!err} autoHideDuration={3000} onClose={() => setErr(null)}>
        <Alert severity="error" variant="filled" onClose={() => setErr(null)}>
          {err}
        </Alert>
      </Snackbar>
    </>
  );
}
