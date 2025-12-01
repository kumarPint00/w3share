'use client';
import { Box, Grid, Paper, Typography, Button } from '@mui/material';
import Image from 'next/image';
import { GiftItem } from '@/types/gift';
import NftCard from './NFTCard';
import { CircularProgress } from '@mui/material';
import { useWallet } from '@/context/WalletContext';
import useWalletNfts from '@/lib/hooks/useWalletNft';

/* —— 8 pretty demo NFTs —————————————————————————— */
const demoNfts: GiftItem[] = [
  {
    id: 'demo-1',
    name: 'Basquiat Toy Face',
    image: '/nft/basquiat.png',
    usd: 783.9,
    symbol: 'BASQ',
    type: 'NFT',
    balance: 1,
    amount: 1,
  },
  {
    id: 'demo-2',
    name: 'Warhol Toy Face',
    image: '/nft/warhol.png',
    usd: 420.9,
    symbol: 'WARH',
    type: 'NFT',
    balance: 1,
    amount: 1,
  },
  {
    id: 'demo-3',
    name: 'Dali Toy Face',
    image: '/nft/dali.png',
    usd: 783.9,
    symbol: 'DALI',
    type: 'NFT',
    balance: 1,
    amount: 1,
  },
  {
    id: 'demo-4',
    name: 'The Bakery',
    image: '/nft/bakery.png',
    usd: 783.9,
    symbol: 'BAKE',
    type: 'NFT',
    balance: 1,
    amount: 1,
  },
  {
    id: 'demo-5',
    name: 'Pirate Toy Face',
    image: '/nft/pirate.png',
    usd: 783.9,
    symbol: 'PIRATE',
    type: 'NFT',
    balance: 1,
    amount: 1,
  },
  {
    id: 'demo-6',
    name: 'Autobots Assemble',
    image: '/nft/autobots.png',
    symbol: 'AUTO',
    type: 'NFT',
    balance: 1,
    amount: 1,
    usd: 783.9,
  },
  {
    id: 'demo-7',
    name: 'Viking Toy Face',
    image: '/nft/viking.png',
    symbol: 'VIKING',
    type: 'NFT',
    balance: 1,
    amount: 1,
    usd: 783.9,
  },
  {
    id: 'demo-8',
    name: 'Bowie Toy Face',
    image: '/nft/bowie.png',
    usd: 783.9,
    symbol: 'BOWIE',
    type: 'NFT',
    balance: 1,
    amount: 1,
  },
];

export interface NftGalleryProps {
  nfts: GiftItem[];
  selectedIds: string[];
  onToggle: (n: GiftItem) => void;
}

export default function NftGallery({
  nfts,
  selectedIds,
  onToggle,
}: NftGalleryProps) {
  const { address, connect } = useWallet();
  const { nfts: walletNfts, loading } = useWalletNfts(address);

  const gallery: GiftItem[] = address
    ? (walletNfts.length ? walletNfts : [])
    : (nfts.length ? nfts : demoNfts);

  return (
    <Paper sx={{ p: 4, borderRadius: 4 }}>
      <Typography fontWeight={700} mb={3} fontSize={20}>
        Select NFT
      </Typography>

      {/* States: not connected / loading / empty */}
      {!address && !nfts.length ? (
        <Box textAlign="center">
          <Typography color="text.secondary" mb={2}>
            Connect your wallet to view your NFTs.
          </Typography>
          <Button variant="contained" onClick={connect} sx={{ textTransform: 'none', fontWeight: 700 }}>
            Connect Wallet
          </Button>
        </Box>
      ) : address && loading ? (
        <Box textAlign="center"><CircularProgress size={24} /></Box>
      ) : address && !loading && walletNfts.length === 0 ? (
        <Typography color="text.secondary">No NFTs found in your wallet.</Typography>
      ) : (
        <Grid container spacing={3}>
          {gallery.map((n) => (
            <Grid item xs={6} md={3} key={n.id}>
              <NftCard
                nft={n}
                added={selectedIds.includes(n.id)}
                onToggle={onToggle}
              />
            </Grid>
          ))}
        </Grid>
      )}
    </Paper>
  );
}
