import React from 'react';
import { Box, Typography, Button } from '@mui/material';
import Image from 'next/image';
import { GiftItem } from '@/types/gift';

interface CardProps {
  nft: GiftItem;
  added: boolean;
  onToggle: (n: GiftItem) => void;
}

const NftCard = React.memo(function NftCard({ nft, added, onToggle }: CardProps) {
  return (
    <Box textAlign="center">
      <Box
        sx={{
          mb: 1.5,
          borderRadius: 3,
          overflow: 'hidden',
          boxShadow: added ? 4 : 1,
        }}
      >
        <Image
          src={nft.image || '/placeholder.png'}
          alt={nft.name}
          width={160}
          height={160}
          style={{ width: '100%', height: 'auto' }}
        />
      </Box>

      <Typography fontSize={14} fontWeight={600} noWrap>
        {nft.name}
      </Typography>
      <Typography fontSize={13} color="text.secondary" mb={1}>
        ${typeof nft.usd === 'number' ? nft.usd.toFixed(2) : '0.00'}
      </Typography>

      <Button
        fullWidth
        variant="contained"
        size="small"
        sx={{
          bgcolor: added ? 'error.main' : '#0B7EFF',
          borderRadius: 999,
          textTransform: 'none',
          fontWeight: 700,
          '&:hover': { bgcolor: added ? 'error.dark' : '#0068ff' },
        }}
        onClick={() => onToggle(nft)}
      >
        {added ? 'Remove' : 'Add'}
      </Button>
    </Box>
  );
});


export default NftCard;