'use client';
import {
  Box,
  Button,
  Menu,
  MenuItem,
  ListItemIcon,
  Typography,
  Paper
} from '@mui/material';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import KeyboardArrowUpIcon from '@mui/icons-material/KeyboardArrowUp';
import { useState, MouseEvent } from 'react';
import Image from 'next/image';
// Removed unused imports since we're using tokens prop

import { Token } from '@/types/token';

// Helper functions for formatting and styling
function formatBalance(balance: number | string): string {
  const num = typeof balance === 'string' ? parseFloat(balance) : balance;
  if (num === 0) return '0';
  if (num < 0.001) return '<0.001';
  if (num < 1) return num.toFixed(3);
  if (num < 1000) return num.toFixed(2);
  if (num < 1000000) return (num / 1000).toFixed(1) + 'K';
  return (num / 1000000).toFixed(1) + 'M';
}

function formatUsdValue(usd: number | string): string {
  const num = typeof usd === 'string' ? parseFloat(usd) : usd;
  if (num === 0) return '0.00';
  if (num < 0.01) return '<0.01';
  if (num < 1000) return num.toFixed(2);
  if (num < 1000000) return (num / 1000).toFixed(1) + 'K';
  return (num / 1000000).toFixed(1) + 'M';
}

function getTokenColor(symbol: string): string {
  const colors: Record<string, string> = {
    'ETH': '#627EEA',
    'USDC': '#2775CA',
    'USDT': '#26A17B',
    'LINK': '#375BD2',
    'WETH': '#627EEA',
    'DAI': '#F4B731',
    'UNI': '#FF007A',
    'COMP': '#00D395',
  };
  return colors[symbol.toUpperCase()] || '#667eea';
}

interface Props {
  tokens: Token[];
  selected: Token | null;
  onAdd: (t: Token) => void;
  onRemove: (id: string) => void;
}

export default function TokenPickerV2({
  tokens,
  selected,
  onAdd,
  onRemove,
}: Props) {
  const [anchor, setAnchor] = useState<null | HTMLElement>(null);
  const open = Boolean(anchor);
  const handle = (e: MouseEvent<HTMLDivElement>) => setAnchor(e.currentTarget);
  const close = () => setAnchor(null);
  // Removed local token fetching - using tokens prop instead

  return (
    <>
      {/* input look-alike */}
      <Paper
        elevation={0}
        onClick={handle}
        sx={{
          display: 'flex',
          alignItems: 'center',
          border: '1px solid #d0d0d0',
          borderRadius: 3,
          px: 2,
          py: 1.25,
          cursor: 'pointer',
          '&:hover': { borderColor: 'primary.main' },
        }}
      >
        <Typography
          fontSize={15}
          color={selected ? 'text.primary' : 'text.secondary'}
          sx={{ flexGrow: 1 }}
        >
          {selected ? selected.name : 'Select Token'}
        </Typography>
        {open ? <KeyboardArrowUpIcon /> : <KeyboardArrowDownIcon />}
      </Paper>

      {/* dropdown */}
      <Menu
        anchorEl={anchor}
        open={open}
        onClose={close}
        PaperProps={{
          sx: {
            width: 340,
            p: 0,
            borderRadius: 2,
            overflow: 'hidden',
          },
        }}
      >
        {tokens.map((t, idx) => {
          const added = selected?.id === t.id;

          // Debug logging for first few tokens
          if (idx < 3) {
            console.log(`TokenS Debug ${t.symbol}:`, {
              tokenId: t.id,
              selectedId: selected?.id,
              added,
              selectedToken: selected ? { id: selected.id, symbol: selected.symbol } : null
            });
          }

          return (
            <MenuItem
              key={t.id}
              onClick={() => {
                if (added) {
                  onRemove(t.id);
                } else {
                  onAdd(t);
                }
                close();
              }}
              sx={{
                py: 1.5,
                px: 2,
                display: 'flex',
                alignItems: 'center',
                columnGap: 1.5,
                cursor: 'pointer',
              }}
            >
              {/* avatar */}
              <ListItemIcon sx={{ minWidth: 36 }}>
                {t.image && t.image !== '/gift-icon.png' ? (
                  <Image
                    src={t.image}
                    alt={t.symbol}
                    width={28}
                    height={28}
                    style={{ borderRadius: '50%' }}
                    onError={(e) => {
                      // Fallback to generated icon on error
                      e.currentTarget.style.display = 'none';
                    }}
                  />
                ) : (
                  <Box
                    sx={{
                      width: 28,
                      height: 28,
                      borderRadius: '50%',
                      bgcolor: getTokenColor(t.symbol),
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: 'white',
                      fontWeight: 'bold',
                      fontSize: '12px',
                    }}
                  >
                    {t.symbol.substring(0, 2)}
                  </Box>
                )}
              </ListItemIcon>

              {/* name + price block */}
              <Box sx={{ flexGrow: 1 }}>
                <Typography fontSize={15} fontWeight={600}>
                  {t.symbol} {/* Show symbol instead of full name */}
                </Typography>
                <Typography fontSize={11} color="text.secondary">
                  {formatBalance(t.balance)} {t.symbol} • ${formatUsdValue(t.usd)}
                </Typography>
              </Box>

              {/* action pill */}
              <Button
                size="small"
                variant="contained"
                onClick={(e) => {
                  e.stopPropagation();
                  if (added) {
                    onRemove(t.id);
                  } else {
                    onAdd(t);
                  }
                  close();
                }}
                sx={{
                  bgcolor: added ? 'error.main' : '#0B7EFF',
                  minWidth: 72,
                  textTransform: 'none',
                  fontWeight: 700,
                  borderRadius: 2,
                  '&:hover': { bgcolor: added ? 'error.dark' : '#0068ff' },
                }}
              >
                {added ? 'Remove' : 'Add'}
              </Button>
            </MenuItem>
          );
        })}
      </Menu>
    </>
  );
}
