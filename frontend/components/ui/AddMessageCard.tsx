'use client';
import { Paper, Typography, TextField } from '@mui/material';
import { ChangeEvent } from 'react';

interface Props {
  value: string;
  onChange: (msg: string) => void;
}

export default function AddMessageCard({ value, onChange }: Props) {
  const handle = (e: ChangeEvent<HTMLInputElement>) => onChange(e.target.value);

  return (
    <Paper sx={{ p: 4, borderRadius: 4 }}>
      {/* headline + (Optional) */}
      <Typography fontWeight={700} fontSize={24} mb={0.5}>
        Add a Message&nbsp;
      </Typography>

      {/* helper copy */}
      <Typography fontSize={15} color="text.secondary" mb={3}>
        Write something meaningful, playful, or mysterious. It’s your message, your vibe.
      </Typography>

      {/* rounded textarea */}
      <TextField
        fullWidth
        multiline
        rows={4}
        placeholder="You’ve been amazing lately. Here’s a little surprise."
        value={value}
        onChange={handle}
        sx={{
          '& .MuiOutlinedInput-root': {
            borderRadius: 3,
            bgcolor: '#fafafa',
          },
        }}
      />
    </Paper>
  );
}
