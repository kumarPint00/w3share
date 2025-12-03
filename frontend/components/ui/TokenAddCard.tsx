'use client';
import {
  Paper,
  Typography,
  Grid,
  TextField,
  Button,
  CircularProgress,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import { useState } from 'react';
import { Token } from '@/types/token';
import TokenPickerV2 from './TokenS';
import { useWallet } from '@/context/WalletContext';

interface Props {
  tokens: Token[];
  loading: boolean;
  onAdd: (item: Token & { amount: number; rawAmount?: string }) => void;
}

export default function TokenAddCard({ tokens, loading, onAdd }: Props) {
  const [tokenId, setTokenId] = useState('');
  const [amount,  setAmount]  = useState('');
  const [amountError, setAmountError] = useState<string | null>(null);
  const { address, connect } = useWallet();

  const selected = tokens.find((t) => t.id === tokenId) || null;
  const amountNum = Number(amount);

  const validateDecimals = (v: string) => {
    if (!v) return null;
    const s = v.trim();
    if (/e/i.test(s)) return null; 
    const parts = s.split('.');
    if (parts.length > 1) {
      const decimals = parts[1].length;
      if (decimals > 17) return 'Too many decimal places, maximum allowed is 17';
    }
    return null;
  };

  const handleAdd = () => {
    const err = validateDecimals(amount);
    setAmountError(err);
    if (err) return;
    if (!selected || !amountNum) return;
    onAdd({ ...selected, amount: amountNum, rawAmount: amount });
    setTokenId('');
    setAmount('');
    setAmountError(null);
  };

  return (
    <Paper sx={{ p: 4, borderRadius: 4 }}>


      <Grid container spacing={2}>
        <Grid item xs={12} sm={6}>
          {loading && !tokens.length ? (
            <CircularProgress size={28} />
          ) : (
            <TokenPickerV2
              tokens={tokens}
              selected={selected}
              onAdd={(t) => setTokenId(t.id)}
              onRemove={() => setTokenId('')}
            />
          )}
        </Grid>

        <Grid item xs={12} sm={6}>
          <TextField
            fullWidth
            placeholder="Enter Amount"
            type="number"
            value={amount}
            onChange={(e) => {
              const v = e.target.value;
              setAmount(v);
              setAmountError(validateDecimals(v));
            }}
            inputProps={{ inputMode: 'decimal', step: 'any', min: '0' }}
            sx={{
              '& .MuiOutlinedInput-root': {
                borderRadius: 3,
                fontSize: 15,
                '& fieldset': {
                  borderColor: '#d0d0d0',
                },
                '&:hover fieldset': {
                  borderColor: 'primary.main',
                },
                '&.Mui-focused fieldset': {
                  borderColor: 'primary.main',
                },
              },
              '& .MuiOutlinedInput-input': {
                padding: '10px 16px',
                fontSize: 15,
              },
            }}
            InputProps={{
              endAdornment: selected && (
                <Button
                  size="small"
                  sx={{ ml: 1, minWidth: 0, px: 1, fontSize: 12, textTransform: 'none' }}
                  onClick={() => {
                    const v = selected.balance?.toString() || '';
                    setAmount(v);
                    setAmountError(validateDecimals(v));
                  }}
                  disabled={!selected || !selected.balance}
                >
                  Max
                </Button>
              ),
            }}
            error={!!amountError}
            helperText={amountError || ' '}
          />
          {selected && (
            <Typography variant="caption" color="text.secondary" mt={0.5} display="block">
              Balance: {selected.balance ?? 0} {selected.symbol}
            </Typography>
          )}
        </Grid>
      </Grid>

      {!address ? (
        <>
          <Button
            fullWidth
            onClick={connect}
            sx={{
              mt: 3,
              bgcolor: '#0B7EFF',
              borderRadius: 999,
              color: '#fff',
              textTransform: 'none',
              fontWeight: 700,
              py: 1.5,
              '&:hover': { bgcolor: '#0068ff' },
            }}
          >
            Connect Wallet
          </Button>
          <Typography 
            variant="caption" 
            color="text.secondary" 
            mt={1} 
            display="block"
            textAlign="center"
          >
            You need to connect your wallet before adding tokens to your gift pack.
          </Typography>
        </>
      ) : (
        <Button
          fullWidth
          startIcon={<AddIcon />}
          sx={{
            mt: 3,
            bgcolor: '#0B7EFF',
            borderRadius: 999,
            color: '#fff',
            textTransform: 'none',
            fontWeight: 700,
            py: 1.5,
            '&:hover': { bgcolor: '#0068ff' },
            '&.Mui-disabled': {
              bgcolor: '#9e9e9e',
              color: '#ffffff',
            },
          }}
          disabled={!selected || !amountNum || !!amountError}
          onClick={handleAdd}
        >
          Add Item
        </Button>
      )}
    </Paper>
  );
}
