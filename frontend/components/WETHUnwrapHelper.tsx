'use client';
import React from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Alert,
  List,
  ListItem,
  ListItemText,
  Chip,
  Stack
} from '@mui/material';
import { ethers } from 'ethers';
import { UnwrapInfo } from '@/lib/api';

interface WETHUnwrapHelperProps {
  unwrapInfo: UnwrapInfo;
  onUnwrapClick?: () => void;
}

export default function WETHUnwrapHelper({ unwrapInfo, onUnwrapClick }: WETHUnwrapHelperProps) {
  const formatAmount = (amount: string) => {
    try {
      return `${parseFloat(ethers.formatEther(amount)).toFixed(4)} ETH`;
    } catch {
      return amount;
    }
  };

  return (
    <Card sx={{ mt: 2, border: '2px solid', borderColor: 'warning.main' }}>
      <CardContent>
        <Stack direction="row" alignItems="center" spacing={1} mb={2}>
          <Chip label="WETH → ETH" color="warning" size="small" />
          <Typography variant="h6" color="warning.main">
            Unwrap WETH to ETH
          </Typography>
        </Stack>

        <Alert severity="info" sx={{ mb: 2 }}>
          {unwrapInfo.message}
        </Alert>

        <Box mb={2}>
          <Typography variant="body2" color="text.secondary" gutterBottom>
            Amount to unwrap: <strong>{formatAmount(unwrapInfo.wethAmount)}</strong>
          </Typography>
          <Typography variant="body2" color="text.secondary" gutterBottom>
            WETH Contract: <code>{unwrapInfo.wethContract}</code>
          </Typography>
        </Box>

        <Typography variant="subtitle2" gutterBottom>
          Instructions:
        </Typography>
        <List dense>
          {unwrapInfo.instructions.map((instruction, index) => (
            <ListItem key={index} sx={{ py: 0.5 }}>
              <ListItemText
                primary={instruction}
                primaryTypographyProps={{ variant: 'body2' }}
              />
            </ListItem>
          ))}
        </List>

        {onUnwrapClick && (
          <Button
            variant="contained"
            color="warning"
            onClick={onUnwrapClick}
            sx={{ mt: 2 }}
            fullWidth
          >
            Execute WETH Unwrap Transaction
          </Button>
        )}

        <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
          💡 Tip: After claiming your gift, you&apos;ll receive WETH tokens. Use the unwrap function to convert them back to native ETH.
        </Typography>
      </CardContent>
    </Card>
  );
}
