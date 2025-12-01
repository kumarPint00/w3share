'use client';

import { Card, CardContent, Typography, Button, Box, CircularProgress } from '@mui/material';
import Image from 'next/image';

interface SealGiftCardProps {
  loading: boolean;
  disabled: boolean;
  secretCode: string;
  onGenerate: () => void;
}

export default function SealGiftCard({ loading, disabled, secretCode, onGenerate }: SealGiftCardProps) {
  return (
    <Card sx={{ borderRadius: 3, border: '1px solid', borderColor: 'divider' }}>
            <CardContent sx={{ p: 3 }}>

        {secretCode && (
          <Box
            sx={{
              p: 2,
              backgroundColor: 'success.light',
              color: 'success.contrastText',
              borderRadius: 2,
              mb: 2,
              fontFamily: 'monospace',
              fontSize: '1.2rem',
              fontWeight: 700,
              textAlign: 'center'
            }}
          >
            {secretCode}
          </Box>
        )}

  <Button
          variant="contained"
          onClick={onGenerate}
          disabled={disabled || loading}
          startIcon={loading ? <CircularProgress size={20} color="inherit" /> : <Image src="/gift_icon.png" alt="Gift" width={20} height={20} style={{ objectFit: 'contain' }} />}
          fullWidth
          sx={{ 
            borderRadius: 2, 
            py: 1.5,
            textTransform: 'none',
            fontWeight: 600,
            bgcolor: '#0B7EFF',
            '&:hover': {
              bgcolor: '#0068ff',
            },
            '&:disabled': {
              background: '#9e9e9e',
              color: '#ffffff'
            }
          }}
        >
          {loading ? 'Generating...' : secretCode ? 'Regenerate Gift Code' : 'Generate Secret Gift Code'}
        </Button>
        </CardContent>
    </Card>
  );
}
