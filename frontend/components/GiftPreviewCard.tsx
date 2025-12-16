'use client';
import React from 'react';
import {
  Card,
  CardContent,
  Typography,
  Box,
  Chip,
  Avatar,
  Stack,
  Divider,
  Grid,
  Paper,
  Fade,
  Zoom,
  IconButton,
  Tooltip,
} from '@mui/material';
import {
  AccessTime as TimeIcon,
  AccountCircle as SenderIcon,
  Message as MessageIcon,
  CheckCircle as ClaimedIcon,
  Lock as LockedIcon,
  Error as ExpiredIcon,
  Token as TokenIcon,
  MonetizationOn as MoneyIcon,
} from '@mui/icons-material';
import { GiftPack, GiftItem, GiftPackMeta } from '@/types/gift';

interface GiftPreviewCardProps {
  giftPack: Partial<GiftPack & GiftPackMeta> & { message?: string; items?: GiftItem[] };
  onChainStatus?: {
    giftId: number;
    tokenAddress: string;
    tokenId?: string;
    amount: string;
    sender: string;
    expiryTimestamp: number;
    claimed: boolean;
    status: 'LOCKED' | 'CLAIMED' | 'EXPIRED';
    claimer?: string;
  } | null;
  showAnimation?: boolean;
}

const getStatusColor = (status: string) => {
  switch (status) {
    case 'CLAIMED':
      return { color: '#4caf50', bg: '#e8f5e8', icon: <ClaimedIcon /> };
    case 'EXPIRED':
      return { color: '#f44336', bg: '#ffebee', icon: <ExpiredIcon /> };
    case 'LOCKED':
      return { color: '#2196f3', bg: '#e3f2fd', icon: <LockedIcon /> };
    default:
      return { color: '#9e9e9e', bg: '#f5f5f5', icon: <LockedIcon /> };
  }
};

const formatTokenAmount = (amount: string | number, decimals = 18): string => {
  if (amount === undefined || amount === null) return '0';
  const amt = typeof amount === 'string' ? parseFloat(amount) : amount;
  const num = amt / Math.pow(10, decimals);
  if (num === 0) return '0';
  if (num >= 1) {
    if (num >= 1000) return Intl.NumberFormat('en', { notation: 'compact', maximumFractionDigits: 2 }).format(num);
    return num.toFixed(num >= 10 ? 2 : 4).replace(/\.0+$/,'');
  }
  return num.toPrecision(3);
};

const GiftItemDisplay: React.FC<{ item: GiftItem; index: number , onChainStatus?: any }> = ({ item, index , onChainStatus }) => {
  const isERC20 = item.type === 'ERC20';
  const isNFT = item.type === 'NFT';

  return (
    <Zoom in={true} style={{ transitionDelay: `${index * 100}ms` }}>
      <Paper
        elevation={2}
        sx={{
          p: 2,
          borderRadius: 2,
          background: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)',
          border: '1px solid #e0e0e0',
          transition: 'transform 0.2s ease-in-out',
          '&:hover': {
            transform: 'translateY(-2px)',
            boxShadow: 4,
          },
        }}
      >
        <Stack direction="row" alignItems="center" spacing={2}>
          <Avatar
            sx={{
              bgcolor: isNFT ? '#ff9800' : '#4caf50',
              width: 40,
              height: 40,
            }}
          >
            {isNFT ? <TokenIcon /> : <MoneyIcon />}
          </Avatar>

          <Box flex={1}>
            {/** Prefer name, then symbol, then contract short */}
            {(() => {
              const contractShort = item.contract ? `${item.contract.slice(0,6)}...${item.contract.slice(-4)}` : null;
              const displayName = item.name || item.symbol || contractShort || 'Unknown Token';
              return (
                <Typography variant="subtitle1" fontWeight={700} sx={{ mb: 0.5 }}>
                  {displayName}
                </Typography>
              );
            })()}
            {item.symbol && item.symbol !== item.name && (
              <Typography variant="body2" color="primary" fontWeight={500} sx={{ mb: 0.5 }}>
                {item.symbol}
              </Typography>
            )}
            <Typography variant="body2" color="text.secondary">
              {isERC20 && (item.rawAmount || item.amount !== undefined) && (
                `Amount: ${item.formattedAmount || formatTokenAmount(item.rawAmount || item.amount || 0, item.decimals ?? 18)}${item.symbol ? ' ' + item.symbol : ''}`
              )}
              {isNFT && item.amount && `Token ID: ${item.amount}`}
              {!isERC20 && !isNFT && !item.amount && 'No amount specified'}
            </Typography>
            {/* <Typography variant="caption" color="text.secondary">
              ${typeof item.usd === 'number' ? item.usd.toFixed(2) : '0.00'} USD
            </Typography> */}
          </Box>
         
        </Stack>
            {/* Show per-item token address (use contract/address on the item) */}
            {item.contract && (
              <Grid item xs={12}>
                <Typography variant="caption" color="text.secondary">Token Address</Typography>
                <Typography
                  variant="body2"
                  sx={{ fontFamily: 'monospace', wordBreak: 'break-all', overflowWrap: 'anywhere' }}
                >
                  {item.contract}
                </Typography>
              </Grid>
            )}
      </Paper>
    </Zoom>
  );
};

export default function GiftPreviewCard({
  giftPack,
  onChainStatus,
  showAnimation = true,
}: GiftPreviewCardProps) {
  const status = onChainStatus?.status || 'LOCKED';
  const statusInfo = getStatusColor(status);
  const isExpired = status === 'EXPIRED';
  const isClaimed = status === 'CLAIMED';

  const expiryDate = giftPack.expiry ? new Date(giftPack.expiry) : (giftPack.sealedAt ? new Date(giftPack.sealedAt) : undefined);
  const isNearExpiry = expiryDate && !isExpired && !isClaimed &&
    (Date.now() - expiryDate.getTime()) < (24 * 60 * 60 * 1000); // Created within last 24 hours

  return (
    <Fade in={showAnimation} timeout={600}>
      <Card
        sx={{
          maxWidth: 600,
          mx: 'auto',
          borderRadius: 3,
          boxShadow: '0 8px 32px rgba(0,0,0,0.1)',
          border: '1px solid #e0e0e0',
          overflow: 'hidden',
          position: 'relative',
        }}
      >
        {/* Status Banner */}
        <Box
          sx={{
            background: statusInfo.bg,
            color: statusInfo.color,
            p: 1.5,
            display: 'flex',
            alignItems: 'center',
            gap: 1,
          }}
        >
          {statusInfo.icon}
          <Typography variant="subtitle2" fontWeight={600}>
            Gift Status: {status}
          </Typography>
          {isNearExpiry && (
            <Chip
              label="Expires Soon"
              size="small"
              sx={{
                bgcolor: '#ff9800',
                color: 'white',
                ml: 'auto',
              }}
            />
          )}
        </Box>

        <CardContent sx={{ p: 3 }}>
          {/* Header */}
          <Box display="flex" alignItems="center" mb={3}>
            <Box display="flex" alignItems="center" gap={2}>
              <Avatar
                src="/gift_icon.png"
                alt="Gift"
                sx={{ width: 30, height: 30, bgcolor: 'transparent' }}
              />
              <Typography variant="h5" fontWeight={700} color="primary">
                Gift Preview
              </Typography>
            </Box>
          </Box>

          {/* Gift Message */}
          {giftPack.message && (
            <Box mb={3}>
              <Box display="flex" alignItems="center" mb={1}>
                <MessageIcon sx={{ mr: 1, color: 'text.secondary' }} />
                <Typography variant="subtitle1" fontWeight={600}>
                  Message
                </Typography>
              </Box>
              <Paper
                sx={{
                  p: 2,
                  bgcolor: '#f8f9fa',
                  borderRadius: 2,
                  border: '1px solid #e9ecef',
                }}
              >
                <Typography variant="body1" sx={{ fontStyle: 'italic' }}>
                  &ldquo;{giftPack.message}&rdquo;
                </Typography>
              </Paper>
            </Box>
          )}

          {/* Gift Identification */}
          <Box mb={3}>
            <Grid container spacing={2}>
              {giftPack.giftCode && (
                <Grid item xs={6}>
                  <Typography variant="caption" color="text.secondary">Gift Code</Typography>
                  <Typography variant="body2" fontWeight={600}>{giftPack.giftCode}</Typography>
                </Grid>
              )}
              {giftPack.giftIdOnChain !== undefined && (
                <Grid item xs={6}>
                  <Typography variant="caption" color="text.secondary">Onchain ID</Typography>
                  <Typography variant="body2" fontWeight={600}>#{giftPack.giftIdOnChain}</Typography>
                </Grid>
              )}
             
            </Grid>
          </Box>

          {/* Gift Items */}
          <Box mb={3}>
            <Box display="flex" alignItems="center" mb={2}>
              <TokenIcon sx={{ mr: 1, color: 'text.secondary' }} />
              <Typography variant="subtitle1" fontWeight={600}>
                Gift Contents
              </Typography>
            </Box>

            <Stack spacing={2}>
              {giftPack.items?.map((item, index) => (
                <GiftItemDisplay key={item.id || index} item={item} index={index} onChainStatus={onChainStatus}/>
              )) || (
                <Typography variant="body2" color="text.secondary" sx={{ fontStyle: 'italic' }}>
                  No items in this gift
                </Typography>
              )}
            
            </Stack>
          </Box>

          <Divider sx={{ my: 3 }} />

          {/* Gift Details */}
          <Grid container spacing={2}>
            <Grid item xs={6}>
              <Box display="flex" alignItems="center" mb={1}>
                <SenderIcon sx={{ mr: 1, color: 'text.secondary', fontSize: 18 }} />
                <Typography variant="body2" fontWeight={500}>
                  From
                </Typography>
              </Box>
              <Typography variant="body2" color="text.secondary">
                {giftPack.senderAddress ? `${giftPack.senderAddress.slice(0,6)}...${giftPack.senderAddress.slice(-4)}` : (onChainStatus?.sender ? `${onChainStatus.sender.slice(0,6)}...${onChainStatus.sender.slice(-4)}` : 'Unknown')}
              </Typography>
            </Grid>

            <Grid item xs={6}>
              <Box display="flex" alignItems="center" mb={1}>
                <TimeIcon sx={{ mr: 1, color: 'text.secondary', fontSize: 18 }} />
                <Typography variant="body2" fontWeight={500}>
                  {expiryDate ? 'Expires' : 'Created'}
                </Typography>
              </Box>
              <Typography variant="body2" color={isExpired ? 'error.main' : isNearExpiry ? 'warning.main' : 'text.secondary'}>
                {expiryDate ? expiryDate.toLocaleString() : 'Unknown'} 
              </Typography>
            </Grid>
          </Grid>

          {/* Onchain Info
          {onChainStatus && (
            <Box mt={3} p={2} bgcolor="#f8f9fa" borderRadius={2}>
              <Typography variant="subtitle2" fontWeight={600} mb={1}>
                Onchain Details
              </Typography>
              <Stack spacing={0.5}>
                <Typography variant="caption" color="text.secondary">
                  Gift ID: {onChainStatus.giftId}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Token: {onChainStatus.tokenAddress?.slice(0, 10)}...{onChainStatus.tokenAddress?.slice(-6)}
                </Typography>
                {onChainStatus.amount && (
                  <Typography variant="caption" color="text.secondary">
                    Raw Amount: {onChainStatus.amount}
                  </Typography>
                )}
                {onChainStatus.tokenId && (
                  <Typography variant="caption" color="text.secondary">
                    Token ID: {onChainStatus.tokenId}
                  </Typography>
                )}
              </Stack>
            </Box>
          )} */}

          {/* Claim Status */}
          {/* {isClaimed && onChainStatus?.claimer && (
            <Box mt={2} p={2} bgcolor="#e8f5e8" borderRadius={2}>
              <Typography variant="body2" color="success.main">
                ✅ Claimed by: {onChainStatus.claimer?.slice(0, 6)}...{onChainStatus.claimer?.slice(-4)}
              </Typography>
            </Box>
          )} */}
        </CardContent>
      </Card>
    </Fade>
  );
}
