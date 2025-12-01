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
import useWalletNfts from '@/lib/hooks/useWalletNft';
import useWalletTokens from '@/lib/hooks/useWalletToken';
import { useWallet } from '@/context/WalletContext';

import { Token } from '@/types/token';

interface Props {
  selected: Token | null;
  onAdd: (t: Token) => void;
  onRemove: (id: string) => void;
}

export default function TokenPickerV2({
  selected,
  onAdd,
  onRemove,
}: Props) {
  const [anchor, setAnchor] = useState<null | HTMLElement>(null);
  const open = Boolean(anchor);
  const handle = (e: MouseEvent<HTMLDivElement>) => setAnchor(e.currentTarget);
  const close = () => setAnchor(null);
  const { provider, address } = useWallet();
  const { tokens } = useWalletTokens(provider, address);
  const { nfts } = useWalletNfts(address);

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

          return (
            <MenuItem
              key={t.id}
              onClick={() => {
                added ? onRemove(t.id) : onAdd(t);
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
                <Image
                  src={t.image || '/placeholder.png'}
                  alt={t.symbol}
                  width={28}
                  height={28}
                  style={{ borderRadius: '50%' }}
                />
              </ListItemIcon>

              {/* name + price block */}
              <Box sx={{ flexGrow: 1 }}>
                <Typography fontSize={15} fontWeight={600}>
                  {t.name}
                </Typography>
                <Typography fontSize={11} color="text.secondary">
                  {typeof t.balance === 'number' ? t.balance.toFixed(3) : '0.000'} &nbsp;&nbsp;
                  ${typeof t.usd === 'number' ? t.usd.toFixed(2) : '0.00'}
                </Typography>
              </Box>

              {/* action pill */}
              <Button
                size="small"
                variant="contained"
                onClick={(e) => {
                  e.stopPropagation();
                  added ? onRemove(t.id) : onAdd(t);
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
