'use client';

import { createTheme } from '@mui/material/styles';

/* Extend palette with neutral for consistent theming */
declare module '@mui/material/styles' {
  interface Palette {
    neutral: Palette['primary'];
  }
  interface PaletteOptions {
    neutral?: PaletteOptions['primary'];
  }
  interface TypeBackground {
    gradient: string;
  }
}

const theme = createTheme({
  palette: {
    primary: { main: '#2563eb' },
    secondary: { main: '#e616127b' },
    /* Set error palette to pink for consistent error alerts */
    error: { main: '#e616127b', contrastText: '#FFFFFF' },
    neutral: { main: '#46415B', contrastText: '#FFFFFF' },
    background: {
      default: '#E0F2FE',
      paper: '#FFFFFF',
      gradient: 'radial-gradient(circle at 0% 0%, #60a5fa 0%, rgba(96,165,250,0) 45%), #e0f2fe'
    },
    text: { primary: '#1F2250', secondary: '#555770' }
  },
  shape: { borderRadius: 14 },
  typography: {
    fontFamily: 'var(--font-inter), Inter, system-ui, sans-serif',
    h1: {
      fontWeight: 800,
      fontSize: 'clamp(2.25rem, 5vw, 3.5rem)',
      lineHeight: 1.1,
      color: '#1F2250'
    },
    h2: {
      fontWeight: 800,
      fontSize: 'clamp(1.75rem, 4vw, 2.75rem)',
      lineHeight: 1.15,
      color: '#1F2250'
    },
    h3: {
      fontWeight: 700,
      fontSize: 'clamp(1.5rem, 3vw, 2rem)',
      color: '#1F2250'
    },
    h4: {
      fontWeight: 700,
      fontSize: '1.5rem',
      color: '#1F2250'
    },
    body1: {
      color: '#555770',
      fontSize: '1rem',
      lineHeight: 1.6
    },
    body2: {
      color: '#555770',
      fontSize: '0.875rem',
      lineHeight: 1.5
    },
    button: {
      textTransform: 'none',
      fontWeight: 700,
      fontFamily: 'var(--font-inter), Inter, system-ui, sans-serif'
    }
  },
  components: {
    MuiButton: {
      defaultProps: { disableElevation: true },
      styleOverrides: {
        root: {
          borderRadius: 10,
          paddingInline: 26,
          transition: 'all 0.2s ease',
          '&:hover': {
            transform: 'translateY(-2px)',
            boxShadow: '0 4px 12px rgba(37, 99, 235, 0.3)'
          }
        },
        containedPrimary: {
          backgroundColor: '#2563eb',
          color: '#FFFFFF',
          '&:hover': {
            backgroundColor: '#1d4ed8'
          }
        }
      }
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          borderRadius: 16,
          boxShadow: '0 6px 22px -8px rgba(0,0,0,.15)',
          backgroundColor: '#FFFFFF'
        }
      }
    },
    MuiContainer: {
      styleOverrides: {
        root: {
          paddingLeft: '1rem',
          paddingRight: '1rem',
          '@media (min-width: 600px)': {
            paddingLeft: '2rem',
            paddingRight: '2rem'
          }
        }
      }
    },
    MuiTypography: {
      styleOverrides: {
        root: {
          fontFamily: 'var(--font-inter), Inter, system-ui, sans-serif'
        }
      }
    },
    MuiAlert: {
      styleOverrides: {
        /* Standard (text) variant — use pink for text */
        standardError: {
          color: '#e616127b'
        },
        /* Outlined variant — pink border and icon */
        outlinedError: {
          borderColor: '#e616127b',
          color: '#e616127b',
          '& .MuiAlert-icon': { color: '#e616127b' }
        },
        /* Filled variant — solid pink background with white text */
        filledError: {
          backgroundColor: '#e616127b',
          color: '#FFFFFF',
          '& .MuiAlert-icon': { color: '#FFFFFF' }
        }
      }
    }
  }
});

export default theme;
