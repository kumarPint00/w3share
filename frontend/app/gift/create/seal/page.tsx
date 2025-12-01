'use client';
import { Box, Button, Typography, CircularProgress } from '@mui/material';
import { useContext, useState } from 'react';
import EscrowContext from '@/context/EscrowContext';
import StepIndicator from '@/components/ui/StepIndicator';
import { sealPack } from '@/lib/escrow';
import { useRouter } from 'next/navigation';

export default function SealPage() {
  const router = useRouter();
  const [state, dispatch] = useContext(EscrowContext)!;
  const [loading, setLoading] = useState(false);
  const [code, setCode] = useState('');

  const handleSeal = async () => {
    setLoading(true);
    const res = await sealPack(state.items, state.message);
    dispatch({ type: 'setCode', code: res.code });
    setCode(res.code);
    setLoading(false);
  };

  return (
    <Box maxWidth={600} mx="auto" px={2} py={4}>
      <StepIndicator activeStep={2} />
      {code ? (
        <>
          <Typography variant="h5" mb={2}>Your Secret Code</Typography>
          <Typography variant="h4" fontWeight={800} mb={3}>{code}</Typography>
          <Typography mb={3}>Share this code with the recipient so they can claim the gift pack.</Typography>
          <Button 
            variant="contained" 
            onClick={() => router.push('/gift/create/confirm')}
            sx={{
              textTransform: 'none',
              fontWeight: 600,
              borderRadius: 2,
              py: 1.25,
              px: 4,
              background: 'primary.main',
              '&:hover': {
                background: 'primary.dark',
              }
            }}
          >Continue</Button>
        </>
      ) : (
        <Button
          variant="contained"
          disabled={loading}
          onClick={handleSeal}
          startIcon={loading ? <CircularProgress size={18} /> : undefined}
          sx={{
            textTransform: 'none',
            fontWeight: 600,
            borderRadius: 2,
            py: 1.25,
            px: 4,
            background: 'primary.main',
            '&:hover': {
              background: 'primary.dark',
            },
            '&:disabled': {
              background: '#9e9e9e',
              color: '#ffffff'
            }
          }}
        >
          {loading ? 'Sealing...' : 'Generate Secret Gift Code'}
        </Button>
      )}
    </Box>
  );
}
