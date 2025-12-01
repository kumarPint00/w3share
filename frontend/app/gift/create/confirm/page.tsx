'use client';
import { Box, Button, Typography } from '@mui/material';
import { useContext } from 'react';
import EscrowContext from '@/context/EscrowContext';
import StepIndicator from '@/components/ui/StepIndicator';
import { useRouter } from 'next/navigation';

export default function ConfirmPage() {
  const router = useRouter();
  const [state] = useContext(EscrowContext)!;
  return (
    <Box maxWidth={700} mx="auto" px={2} py={4}>
      <StepIndicator activeStep={3} />
      <Typography variant="h4" mb={2}>Gift Pack Ready!</Typography>
      <Typography mb={3}>Secret Code: <strong>{state.code}</strong></Typography>
      <Typography mb={3}>Share it and spread kindness.</Typography>
      <Button variant="contained" onClick={() => router.push('/')}>Back to Home</Button>
    </Box>
  );
}
