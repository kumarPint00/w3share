"use client";
import {
  Container,
  Grid,
  Typography,
  Button,
  Snackbar,
  Alert,
  Box,
  Paper,
  List,
  ListItem,
  ListItemAvatar,
  Avatar,
  ListItemText,
  Divider,
  Stack,
  CircularProgress,
} from '@mui/material';
import { useState, useMemo, useEffect } from 'react';
import Image from 'next/image';
import BackgroundRemoverImage from '@/components/BackgroundRemoverImage';
import Section from '@/components/Section';
import { useWallet } from '@/context/WalletContext';
import useWalletTokens from '@/lib/hooks/useWalletToken';
import useWalletNfts from '@/lib/hooks/useWalletNft';
import ClaimGiftForm from '@/components/ClaimGiftForm';
import GiftPreviewCard from '@/components/GiftPreviewCard';
import { useSearchParams } from 'next/navigation';
import { walletLogin, getGiftPackDetails } from '@/lib/api';
import { GiftItem } from '@/types/gift';
import { useAllowList } from '@/lib/hooks/useAllowList';

// Shared token logo map (module scope) - keys are lowered for convenience
const TOKEN_LOGO_MAP: Record<string, string> = {
  'eth': '/tokens/ethereum-eth-logo.png',
  'ethereum': '/tokens/ethereum-eth-logo.png',
  'ethereum sepolia': '/tokens/ethereum-eth-logo.png',
  'link': '/tokens/chainlink-link-logo.png',
  'chainlink': '/tokens/chainlink-link-logo.png',
  'chainlink token': '/tokens/chainlink-link-logo.png',
  'chainlink token (sepolia)': '/tokens/chainlink-link-logo.png',
  'usdc': '/tokens/Circle_USDC_Logo.svg',
  'usd coin': '/tokens/Circle_USDC_Logo.svg',
  'usd coin (sepolia)': '/tokens/Circle_USDC_Logo.svg',
};
export default function ClaimGiftPage() {

  const [claimedGift, setClaimedGift] = useState<{ message?: string; items?: any[], claimed?: boolean, claimer?: string } | null>(null);
  const [previewGift, setPreviewGift] = useState<{ message?: string; items?: any[], claimed?: boolean, claimer?: string } | null>(null);
  const [toast, setToast] = useState<{ msg: string; ok: boolean } | null>(null);
  const { provider, address, connect } = useWallet();
  const { tokens, loading: tokensLoading, error: tokensError } = useWalletTokens(provider, address);
  const { nfts, loading: nftsLoading, error: nftsError } = useWalletNfts(address);
  const { allowList } = useAllowList();

  // Memoize the allow-list map
  const allowMap = useMemo(() => {
    const map: Record<string, any> = {};
    allowList?.forEach((t: any) => {
      const contract = t.contract?.toLowerCase?.();
      if (contract) {
        map[contract] = t;
      }
      if (t.contract === 'native') {
        map['native'] = t;
      }
    });
    return map;
  }, [allowList]);

  // Memoize enriched tokens
  const enrichedTokens = useMemo(() => {
    if (!tokens || tokens.length === 0) return [];
    const tokenLogoMap = TOKEN_LOGO_MAP;
    
    const list = tokens.map((t: any) => {
      let image = t.image;
      
      // Primary: check allowMap by contract address
      let key = '';
      if (t.isNative) {
        key = 'native';
      } else {
        key = (t.address || t.contractAddress || t.contract || '').toLowerCase();
      }
      const meta = allowMap[key];
      if (meta?.image) {
        image = meta.image;
      }
      
      // Fallback: use symbol-based lookup
      if (t.symbol) {
        const symbolKey = t.symbol.toLowerCase();
        if (tokenLogoMap[symbolKey]) {
          if (image !== tokenLogoMap[symbolKey]) {
            console.log('[ClaimPage] Overriding token image via symbol map', { symbol: t.symbol, previous: image, new: tokenLogoMap[symbolKey] });
          }
          image = tokenLogoMap[symbolKey];
        } else if (!image && t.name) {
          const nameKey = t.name.toLowerCase();
          if (tokenLogoMap[nameKey]) {
            image = tokenLogoMap[nameKey];
          }
        }
      }
      
      // Final fallback
      if (!image) {
        console.warn('[ClaimPage] Token image missing for', { symbol: t.symbol, name: t.name, address: t.address });
        image = '/gift-icon.png';
      }
      
      return {
        ...t,
        image,
      };
    });

    console.log('[ClaimPage] Enriched wallet tokens:', list.map((x: any) => ({ symbol: x.symbol, name: x.name, image: x.image })));

    return list;
  }, [tokens, allowMap]);

  // Debug: detect token image collisions (two tokens using same image)
  useEffect(() => {
    if (!enrichedTokens || enrichedTokens.length === 0) return;
    const imgMap: Record<string, string[]> = {};
    enrichedTokens.forEach((t: any) => {
      const img = t.image || '/gift-icon.png';
      imgMap[img] = imgMap[img] || [];
      if (!imgMap[img].includes(t.symbol)) imgMap[img].push(t.symbol);
    });
    Object.entries(imgMap).forEach(([img, syms]) => {
      if (syms.length > 1 && img !== '/gift-icon.png') {
        console.warn('[ClaimPage] Multiple tokens sharing same image', { image: img, symbols: syms.slice(0, 6) });
      }
    });
  }, [enrichedTokens]);

  useEffect(() => {
    (async () => {
      try {
        if (provider && address) {
          const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null;
          if (!token) {
            await walletLogin(provider);
          }
        }
      } catch (e) {
        console.warn('Wallet auth failed:', e);
      }
    })();
  }, [provider, address]);


  const searchParams = useSearchParams();
  const initialGiftCode = searchParams?.get('giftId') || searchParams?.get('code') || '';


  useEffect(() => {
    async function fetchPreview() {
      if (!initialGiftCode) { setPreviewGift(null); return; }
      try {
        const preview = await getGiftPackDetails({ giftCode: initialGiftCode });
        // Fetch allow list to map symbols/names (best effort)
        let allow: any[] = [];
        try {
          const backendUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';
          const res = await fetch(`${backendUrl}/assets/tokens/allow-list`, { headers: { 'Authorization': '' } });
          if (res.ok) allow = await res.json();
        } catch { /* ignore */ }
        const allowMap: Record<string, any> = {};
        allow.forEach(t => { allowMap[t.contract?.toLowerCase?.()] = t; });
        const enrichedItems = (preview.items || []).map((it: any, idx: number): GiftItem => {
          const key = (it.contract || '').toLowerCase();
          const meta = allowMap[key];
          const decimals = meta?.decimals ?? 18;
          const raw = it.amount || it.rawAmount || '0';
          const formatted = (() => {
            const num = Number(raw) / Math.pow(10, decimals);
            if (!isFinite(num)) return '0';
            if (num >= 1) return num.toString();
            return num.toPrecision(3);
          })();

          // Determine image with deterministic priority and symbol override
          let image = meta?.image || it.image;
          const sym = (meta?.symbol || it.symbol || it.name || '').toLowerCase();
          if (sym && TOKEN_LOGO_MAP[sym]) {
            if (image !== TOKEN_LOGO_MAP[sym]) {
              console.log('[ClaimPage] Overriding preview item image with symbol map', { symbol: sym, previous: image, new: TOKEN_LOGO_MAP[sym] });
            }
            image = TOKEN_LOGO_MAP[sym];
          }

          if (!image) image = '/gift-icon.png';

          return {
            id: it.id || String(idx),
            name: it.contract === 'native' ? 'Ethereum' : (meta?.name || it.name || it.symbol || 'Token'),
            symbol: meta?.symbol || it.symbol,
            type: it.type === 'ERC721' ? 'NFT' : 'ERC20',
            usd: 0,
            amount: Number(raw),
            rawAmount: raw,
            decimals,
            formattedAmount: formatted,
            image,
          };
        });
        setPreviewGift({ ...preview, items: enrichedItems });
      } catch {
        setPreviewGift(null);
      }
    }
    fetchPreview();
  }, [initialGiftCode]);

  return (
    <Section
      sx={{
        // py: { xs: 8, md: 10 },
        width: '100%',
        background: 'linear-gradient(130deg, #b3d9ff 0%, #d5ecff 45%, #ffe1f0 90%)',
        position: 'relative',
        overflow: 'hidden',
        '&:before, &:after': {
          content: '""',
          position: 'absolute',
          borderRadius: '50%',
          filter: 'blur(80px)',
          opacity: 0.55,
        },
        '&:before': {
          width: 420,
          height: 420,
          left: -120,
          top: 260,
          background: 'radial-gradient(circle at 30% 30%, rgba(255,255,255,0.9), rgba(255,255,255,0))'
        },
        '&:after': {
          width: 520,
          height: 520,
          right: -160,
          top: -120,
          background: 'radial-gradient(circle at 70% 40%, rgba(255,255,255,0.85), rgba(255,255,255,0))'
        }
      }}
    >
      <Container maxWidth="xl">
        <Grid container spacing={6} alignItems="center">
          {/* LEFT: text + claim form wired to backend */}
          <Grid item xs={12} md={6}>
            <Box marginLeft={5}>
              <Typography
                variant="h3"
                fontWeight={800}
                mb={1.5}
                sx={{
                  fontSize: { xs: '2rem', md: '2.6rem' },
                  color: '#111e54',
                  letterSpacing: '-0.015em',
                }}
              >
                Claim Your Gift!
              </Typography>
              <Typography
                variant='h2'
                sx={{
                  fontSize: { xs: '1rem', md: '1.1rem' },
                  color: '#03080fff',
                  maxWidth: '420px',
                  lineHeight: 1.6,
                  fontWeight: 400,
                  mb: 4
                }}
                >
                Enter your Secret Gift Code to unlock and claim your gift securely onchain.
              </Typography>
            </Box>

            {/* Backend-integrated claim form */}
            <ClaimGiftForm
              walletAddress={address || undefined}
              initialGiftCode={initialGiftCode}
              onClaimSuccess={(giftDetails) => setClaimedGift(giftDetails)}
            />

            {/* After claim, show who claimed and what was claimed */}
            {/* {claimedGift && (
              <Box mt={4}>
                <GiftPreviewCard
                  giftPack={claimedGift}
                  onChainStatus={claimedGift.claimer ? {
                    giftId: 0,
                    tokenAddress: '',
                    amount: '',
                    sender: '',
                    expiryTimestamp: 0,
                    claimed: true,
                    status: 'CLAIMED' as const,
                    claimer: claimedGift.claimer
                  } : null}
                  showAnimation={true}
                />
              </Box>
            )} */}
          </Grid>

          {/* RIGHT: doge image */}
          <Grid item xs={12} md={6} textAlign="center">
            <BackgroundRemoverImage
              src="/dogegf_illustration.png"
              alt="DogeGiFty gift illustration"
              width={600}
              height={600}
            />
          </Grid>
        </Grid>

        {/* Wallet assets - only show when wallet is connected */}
        {address && (
          <Box mt={8} maxWidth="600px">
            <Typography variant="h5" fontWeight={800} mb={3}>
              Your Wallet Assets
            </Typography>
            <Typography variant='h4' fontSize={15} color="text.secondary" mb={4}>
              After claiming, your gifted assets will appear here. If you don&apos;t see them immediately, try refreshing the page.
            </Typography>

            <Grid container spacing={3}>
              {/* Tokens */}
              <Grid item xs={12}>
                <Paper sx={{ p: 3, borderRadius: 3 }}>
                  <Stack direction="row" alignItems="center" justifyContent="space-between" mb={2}>
                    <Typography fontWeight={700}>Tokens</Typography>
                    {tokensLoading && <CircularProgress size={18} />}
                  </Stack>

                  {tokensError && (
                    <Typography color="error.main" fontSize={13} mb={1}>
                      Failed to load tokens
                    </Typography>
                  )}

                  {!tokensLoading && tokens.length === 0 ? (
                    <Typography fontSize={14} color="text.secondary">No tokens found.</Typography>
                  ) : (
                    <List dense disablePadding>
                      {enrichedTokens.map((t, i) => (
                        <>
                          <ListItem key={t.id} sx={{ py: 1 }}>
                            <ListItemAvatar>
                              <Avatar 
                                sx={{ bgcolor: 'transparent', width: 40, height: 40 }}
                                src={t.image || '/gift-icon.png'}
                                alt={t.symbol}
                              />
                            </ListItemAvatar>
                            <ListItemText
                              primary={
                                <Stack direction="row" spacing={1} alignItems="center">
                                  <Typography fontWeight={700}>{t.symbol}</Typography>
                                  <Typography color="text.secondary" fontSize={13}>{t.name}</Typography>
                                </Stack>
                              }
                              secondary={
                                <Typography fontSize={13} color="text.secondary">
                                  {t.balance?.toFixed(6)} · ${t.usd?.toFixed(2) || '0.00'}
                                </Typography>
                              }
                            />
                          </ListItem>
                          {i < enrichedTokens.length - 1 && <Divider component="li" />}
                        </>
                      ))}
                    </List>
                  )}
                </Paper>
              </Grid>

              {/* NFTs */}
              {/* <Grid item xs={12} md={6}>
                <Paper sx={{ p: 3, borderRadius: 3 }}>
                  <Stack direction="row" alignItems="center" justifyContent="space-between" mb={2}>
                    <Typography fontWeight={700}>NFTs</Typography>
                    {nftsLoading && <CircularProgress size={18} />}
                  </Stack>

                  {nftsError && (
                    <Typography color="error.main" fontSize={13} mb={1}>
                      Failed to load NFTs
                    </Typography>
                  )}

                  {!nftsLoading && nfts.length === 0 ? (
                    <Typography fontSize={14} color="text.secondary">No NFTs found.</Typography>
                  ) : (
                    <Grid container spacing={2}>
                      {nfts.map((n: any) => (
                        <Grid item xs={4} sm={3} md={4} key={`${n.contractAddress || 'nft'}-${n.tokenId ?? n.id ?? Math.random()}`}>
                          <Box sx={{ borderRadius: 2, overflow: 'hidden', bgcolor: 'grey.100' }}>
                            <Image
                              src={n.image || '/gift-icon.png'}
                              alt={n.name || String(n.tokenId || n.id || '')}
                              width={180}
                              height={180}
                              style={{ width: '100%', height: 'auto' }}
                            />
                          </Box>
                          <Typography fontSize={12} mt={0.5} noWrap title={n.name || `#${n.tokenId}`}>
                            {n.name || `#${n.tokenId}`}
                          </Typography>
                        </Grid>
                      ))}
                    </Grid>
                  )}
                </Paper>
              </Grid> */}
            </Grid>
          </Box>
        )}
      </Container>

      {/* toast (retained for any future messaging) */}
      {toast && (
        <Snackbar open={!!toast} autoHideDuration={2500} onClose={() => setToast(null)}>
          <Alert onClose={() => setToast(null)} severity={toast.ok ? 'success' : 'error'} variant="filled">
            {toast.msg}
          </Alert>
        </Snackbar>
      )}
    </Section>
  );
}
