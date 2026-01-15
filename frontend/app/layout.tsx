import type { Metadata } from 'next';
import { Inter, JetBrains_Mono } from 'next/font/google';
import { AppRouterCacheProvider } from '@mui/material-nextjs/v13-appRouter';
import { ThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import theme from '@/lib/theme';
import { EscrowProvider } from '@/context/EscrowContext';
import { WalletProvider } from '@/context/WalletContext';
import QueryProvider from '@/providers/QueryProvider';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import WalletEventsListener from '@/components/WalletEventsListener';

const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-inter',
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-jetbrains-mono',
});

export const metadata: Metadata = {
  title: 'DogeGiFty',
  description: 'Send crypto gifts with kindness',
  icons: {
    icon: '/favicon.png',
    shortcut: '/favicon.png',
    apple: '/apple-touch-icon.png',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${inter.variable} ${jetbrainsMono.variable}`}>
      <body>
        <AppRouterCacheProvider options={{ enableCssLayer: true }}>
          <ThemeProvider theme={theme}>
            <CssBaseline />
            <QueryProvider>
              <EscrowProvider>
                <WalletProvider>
                  <Navbar />
                  <WalletEventsListener />
                  {children}
                  <Footer />
                </WalletProvider>
              </EscrowProvider>
            </QueryProvider>
          </ThemeProvider>
        </AppRouterCacheProvider>
      </body>
    </html>
  );
}
