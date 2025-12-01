'use client';
import { Box, Button, Grid, Typography, CircularProgress, Alert } from '@mui/material';
import { useContext, useState, useEffect } from 'react';
import EscrowContext from '@/context/EscrowContext';
import TokenCard from '@/components/ui/TokenCard';
import SelectedList from '@/components/ui/SelectedList';
import { GiftItem } from '@/types/gift';
import StepIndicator from '@/components/ui/StepIndicator';
import { useRouter } from 'next/navigation';

const dummy: GiftItem[] = [
  { id: '1', name: 'USDC', symbol: 'USDC', type: 'ERC20', amount: 1, image: '/usdc.png', usd: 1 },
  { id: '2', name: 'DogeGF', symbol: 'DOGEGF', type: 'ERC20', amount: 1000, image: '/dogegf.png', usd: 10 },
  { id: '3', name: 'Cool Cat #123', type: 'NFT', image: '/nft.png', usd: 100 },
  { id: '4', name: 'CryptoPunk #456', type: 'NFT', image: '/nft2.png', usd: 200 },
  { id: '5', name: 'Rare Token', symbol: 'RRT', type: 'ERC20', amount: 500, image: '/rare-token.png', usd: 50 },
  { id: '6', name: 'Mystery Box', type: 'NFT', image: '/mystery-box.png', usd: 150 },
  { id: '7', name: 'Limited Edition Card', type: 'NFT', image: '/limited-card.png', usd: 300 },
  { id: '8', name: 'Exclusive Token', symbol: 'EXC', type: 'ERC20', amount: 200, image: '/exclusive-token.png', usd: 75 },
  { id: '9', name: 'Virtual Asset', type: 'NFT', image: '/virtual-asset.png', usd: 120 },
  { id: '10', name: 'Collectible Item', type: 'NFT', image: '/collectible-item.png', usd: 80 },

];

export default function SelectPage() {
  const router = useRouter();
  const [state, dispatch] = useContext(EscrowContext)!;
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {

    const t = setTimeout(() => {
      setLoading(false);
    }, 400);
    return () => clearTimeout(t);
  }, []);

  const toggle = (item: GiftItem) =>
    dispatch({ type: state.items.find(i => i.id === item.id) ? 'remove' : 'add', item, id: item.id } as any);

  return (
    <Box maxWidth={900} mx="auto" px={2} py={4}>
      <StepIndicator activeStep={0} />

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {loading ? (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
          <CircularProgress size={18} />
          <Typography color="text.secondary">Loading assets…</Typography>
        </Box>
      ) : null}

      <Grid container spacing={2}>
        {dummy.map(d => (
          <Grid item xs={12} sm={4} key={d.id}>
            <TokenCard item={d} selected={!!state.items.find(i => i.id === d.id)} onToggle={toggle} />
          </Grid>
        ))}
      </Grid>
      <Box mt={4}>
        <Typography variant="h6">Selected Items ({state.items.length})</Typography>
        <SelectedList items={state.items} onRemove={(id) => dispatch({ type: 'remove', id } as any)} />
        <Button
          variant="contained"
          disabled={state.items.length === 0 || loading}
          sx={{ mt: 3 }}
          onClick={() => router.push('/gift/create/message')}
          startIcon={loading ? <CircularProgress size={18} /> : undefined}
        >
          {loading ? 'Please wait…' : 'Next'}
        </Button>
      </Box>
    </Box>
  );
}
