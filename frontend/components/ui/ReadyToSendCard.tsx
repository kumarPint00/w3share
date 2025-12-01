'use client';
import {
  Paper,
  Typography,
  Stack,
  Avatar,
  Box,
  Divider,
  Button,
  CircularProgress,
} from '@mui/material';
import { GiftItem } from '@/types/gift';

interface Props {
  items: GiftItem[];
  message: string;
  secretCode: string;
  onConfirm: () => void;
  disabled?: boolean;
  isLoading?: boolean;
}

export default function ReadyToSendCard({
  items,
  message,
  secretCode,
  onConfirm,
  disabled = false,
  isLoading = false,
}: Props) {
  const firstToken = items.find((i) => i.type === 'ERC20');
  const firstNft = items.find((i) => i.type === 'NFT');
  const totalUsd = items.reduce((s, i) => s + (typeof i.usd === 'number' ? i.usd : 0), 0);


  const formatAmount = (v?: number) =>
    typeof v === 'number'
      ? Number(v).toLocaleString(undefined, { maximumFractionDigits: 6 })
      : '';

  return (
    <Paper sx={{ p: { xs: 4, md: 6 }, borderRadius: 4, textAlign: 'center' }}>
      <Typography fontWeight={700} mb={1}>
        Item Added to Gift Pack
      </Typography>

      <Stack
        direction="row"
        justifyContent="center"
        alignItems="center"
        spacing={2}
        mb={5}
      >
        <Typography variant="h5" fontWeight={800}>
          ${typeof totalUsd === 'number' ? totalUsd.toFixed(2) : '0.00'}
        </Typography>

        {firstToken && (
          <>
            <Divider orientation="vertical" flexItem />
            <Stack direction="row" spacing={1} alignItems="center">
              <Avatar src={firstToken.image} sx={{ width: 28, height: 28 }} />
              <Box>
                <Typography fontSize={14} fontWeight={600}>
                  {firstToken.symbol}
                </Typography>
                <Typography fontSize={12} color="text.secondary">
                  {formatAmount(firstToken.amount)} &nbsp;${typeof firstToken.usd === 'number' ? firstToken.usd.toFixed(2) : '0.00'}
                </Typography>
              </Box>
            </Stack>
          </>
        )}

        {firstNft && (
          <>
            <Divider orientation="vertical" flexItem />
            <Avatar src={firstNft.image} sx={{ width: 36, height: 36 }} />
          </>
        )}
      </Stack>

      <Typography fontWeight={700} mb={1}>
        Message
      </Typography>
      <Typography
        sx={{
          bgcolor: '#eeeeee',
          borderRadius: 1,
          px: 3,
          py: 1.5,
          mx: 'auto',
          maxWidth: 400,
          mb: 4,
          fontWeight: 600,
        }}
      >
        {message || '—'}
      </Typography>

      <Stack direction="column" alignItems="center" spacing={4}>
        <Box>
          <Typography fontWeight={700} mb={1}>
            Secret Code
          </Typography>
          <Box
            sx={{
              bgcolor: '#eeeeee',
              borderRadius: 1,
              px: 6,
              py: 2,
              mx: 'auto',
              display: 'inline-block',
              fontWeight: 800,
              letterSpacing: 1,
              fontSize: 20,
            }}
          >
            {secretCode}
          </Box>
        </Box>

        <Button
          variant="contained"
          size="large"
          onClick={onConfirm}
          disabled={disabled || isLoading}
          sx={{
            textTransform: 'none',
            fontWeight: 700,
            borderRadius: 999,
            px: 6,
            py: 1.5,
            bgcolor: '#0B7EFF',
            '&:hover': {
              bgcolor: '#0068ff',
            },
            '&:disabled': {
              bgcolor: '#9e9e9e',
              color: '#ffffff',
            },
          }}
          startIcon={isLoading ? <CircularProgress size={20} color="inherit" /> : null}
        >
          {isLoading ? 'Processing...' : 'Confirm & Lock Gift Pack'}
        </Button>
      </Stack>

      <Typography
        fontSize={12}
        color="text.secondary"
        mt={3}
        maxWidth={260}
        mx="auto"
      >
        Your gift will be stored onchain in escrow. Only the person with the
        code can unlock and claim it.
      </Typography>
    </Paper>
  );
}
