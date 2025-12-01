'use client';
import { Box, Typography, IconButton } from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import { GiftItem } from '@/types/gift';

interface Props {
  items: GiftItem[];
  onRemove: (id: string) => void;
}
export default function SelectedList({ items, onRemove }: Props) {
  return (
    <Box>
      {items.map(i => (
        <Box key={i.id} display="flex" alignItems="center" justifyContent="space-between" my={0.5}>
          <Typography>{i.name}</Typography>
          <IconButton size="small" onClick={() => onRemove(i.id)}><DeleteIcon fontSize="small" /></IconButton>
        </Box>
      ))}
    </Box>
  );
}
