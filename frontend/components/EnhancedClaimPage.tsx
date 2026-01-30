'use client';

import React, { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Typography,
  Card,
  CardContent,
  Button,
  Grid,
  Alert,
  TextField,
  ToggleButtonGroup,
  ToggleButton,
  InputAdornment,
  CircularProgress,
  Chip,
  Divider,
  Paper,
  styled,
  alpha,
} from '@mui/material';
import { useSearchParams } from 'next/navigation';
import { ethers } from 'ethers';
import { useWallet } from '@/context/WalletContext';
import { useGiftPreview } from '@/hooks/useGiftPacks';
import { useSubmitClaim, useClaimStatus } from '@/hooks/useClaim';



const GradientCard = styled(Card)(({ theme }) => ({
  background: `linear-gradient(135deg,
    ${alpha(theme.palette.primary.main, 0.02)} 0%,
    ${alpha(theme.palette.secondary.main, 0.01)} 100%)`,
  border: `1px solid ${alpha(theme.palette.primary.main, 0.1)}`,
  borderRadius: 20,
  boxShadow: `0 8px 32px ${alpha(theme.palette.primary.main, 0.1)}`,
  transition: 'all 0.3s ease',
  '&:hover': {
    transform: 'translateY(-2px)',
    boxShadow: `0 12px 40px ${alpha(theme.palette.primary.main, 0.15)}`,
  },
}));

const ClaimButton = styled(Button)(({ theme }) => ({
  background: theme.palette.primary.main,
  color: 'white',
  fontWeight: 600,
  borderRadius: 16,
  padding: '16px 32px',
  fontSize: '1.2rem',
  textTransform: 'none',
  '&:hover': {
    background: theme.palette.primary.dark,
    transform: 'translateY(-3px)',
    boxShadow: `0 12px 30px ${alpha(theme.palette.primary.main, 0.3)}`,
  },
  '&:disabled': {
    background: 'rgba(0, 0, 0, 0.12)',
    color: 'rgba(0, 0, 0, 0.26)',
    transform: 'none',
  },
  transition: 'all 0.3s ease',
}));

const LoadingSkeleton = styled(Box)(({ theme }) => ({
  height: 60,
  background: `linear-gradient(90deg,
    ${alpha(theme.palette.grey[300], 0.3)} 25%,
    ${alpha(theme.palette.grey[300], 0.5)} 50%,
    ${alpha(theme.palette.grey[300], 0.3)} 75%)`,
  backgroundSize: '200% 100%',
  borderRadius: 12,
  animation: 'shimmer 1.5s infinite',
  '@keyframes shimmer': {
    '0%': { backgroundPosition: '-200% 0' },
    '100%': { backgroundPosition: '200% 0' },
  },
}));

export default function EnhancedClaimPage() {
  const searchParams = useSearchParams();
  const { provider, address, connect } = useWallet();
  const initialGiftId = searchParams?.get('giftId');
  const initialCode = searchParams?.get('code');
  const [mode, setMode] = useState<'id' | 'code'>(initialGiftId ? 'id' : 'code');
  const [giftIdInput, setGiftIdInput] = useState(initialGiftId || '');
  const [giftCodeInput, setGiftCodeInput] = useState(initialCode || '');
  const [giftIdNum, setGiftIdNum] = useState<number | undefined>(initialGiftId ? parseInt(initialGiftId, 10) : undefined);
  const inputRef = React.useRef<HTMLInputElement>(null);
  useEffect(() => {
    if (initialGiftId) {
      setGiftIdInput(initialGiftId);
      setMode('id');
      setGiftIdNum(parseInt(initialGiftId, 10));
      inputRef.current?.focus();
    } else if (initialCode) {
      setGiftCodeInput(initialCode);
      setMode('code');
      inputRef.current?.focus();
    }
  }, [initialGiftId, initialCode]);


  const [claimSubmitted, setClaimSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [idError, setIdError] = useState<string | null>(null);
  const [codeError, setCodeError] = useState<string | null>(null);
  const [claimSuccess, setClaimSuccess] = useState(false);
  const [claimTxHash, setClaimTxHash] = useState<string | null>(null);


  const giftRef = mode === 'id' ? giftIdNum : giftCodeInput.trim();
  const enablePreview = (mode === 'id' && !!giftIdNum) || (mode === 'code' && !!giftCodeInput.trim() && !codeError);
  const {
    data: giftPreview,
    isLoading: giftPreviewLoading,
    isError: giftPreviewError,
    error: giftPreviewErrObj
  } = useGiftPreview(enablePreview && mode === 'id' ? giftIdNum : undefined);

  const isAlreadyClaimedPreview = !!(
    giftPreview?.giftPack?.status === 'CLAIMED' ||
    giftPreview?.giftPack?.claimed ||
    giftPreview?.onChainStatus?.claimed ||
    giftPreview?.onChainStatus?.status === 'CLAIMED' ||
    giftPreview?.onChainStatus?.claimer
  );

  const isExpiredPreview = (() => {
    try {
      if (!giftPreview) return false;
      const now = Date.now();
      if (giftPreview.giftPack?.expiry && new Date(giftPreview.giftPack.expiry).getTime() < now) return true;
      if (giftPreview.onChainStatus?.expiryTimestamp && (giftPreview.onChainStatus.expiryTimestamp * 1000) < now) return true;
    } catch {}
    return false;
  })();

  const isRefundedPreview = !!(
    giftPreview?.giftPack?.status === 'REFUNDED' ||
    giftPreview?.onChainStatus?.status === 'REFUNDED'
  );

  console.log('Gift Preview:', giftPreview);

  const {
    data: claimStatus,
    isFetching: claimStatusFetching
  } = useClaimStatus(claimSubmitted ? giftRef : undefined);

  const submitClaim = useSubmitClaim();


  useEffect(() => {
    if (initialGiftId && !giftIdNum) {
      const parsed = parseInt(initialGiftId, 10);
      if (!isNaN(parsed)) {
        setGiftIdNum(parsed);
        setGiftIdInput(initialGiftId);
      }
    }
  }, [initialGiftId, giftIdNum]);


  const validateId = (v: string) => {
    if (!v.trim()) return 'Enter the OnChain gift ID';
    const n = parseInt(v, 10);
    if (Number.isNaN(n) || n <= 0) return 'Enter a valid positive number';
    return null;
  };

  const validateCode = (v: string) => {
    if (!v.trim()) return 'Enter your gift code';
    if (v.trim().length < 4) return 'Gift code must be at least 4 characters';
    return null;
  };




  const onChainErrorText = React.useMemo(() => {
    if (!giftPreviewError) return '';
    const msg = (giftPreviewErrObj as any)?.message || 'Failed to fetch gift preview';

    if (String(msg).toLowerCase().includes('401') || String(msg).toLowerCase().includes('unauthorized')) {
      return 'Please connect your wallet to preview OnChain gift details.';
    }
    return 'Could not load gift details. You can still submit the claim.';
  }, [giftPreviewError, giftPreviewErrObj]);

  const handleConnectWallet = async () => {
    try {
      setError(null);
      await connect();
    } catch (error: any) {
      setError('Failed to connect wallet. Please try again.');
    }
  };

  const pasteCodeFromClipboard = async () => {
    try {
      const txt = await navigator.clipboard.readText();
      if (txt) {
        setGiftCodeInput(txt.trim());
        setCodeError(validateCode(txt));
      }
    } catch {

    }
  };

  const handleSubmitClaim = async () => {
    if (!address) {
      setError('Please connect your wallet first');
      return;
    }
    try {
      setError(null);
      setClaimSuccess(false);
      setClaimTxHash(null);
      if (mode === 'id') {
        const err = validateId(giftIdInput || (giftIdNum !== undefined ? String(giftIdNum) : ''));
        setIdError(err);
        if (err) return;
        const parsed = giftIdNum ?? parseInt(giftIdInput, 10);
        if (!parsed || Number.isNaN(parsed)) return;
        const result = await submitClaim.mutateAsync({ giftId: parsed, claimer: address });
        setGiftIdNum(parsed);
        if (result?.txHash) setClaimTxHash(result.txHash);
      } else {
        const err = validateCode(giftCodeInput);
        setCodeError(err);
        if (err) return;
        const code = giftCodeInput.trim();
        const result = await submitClaim.mutateAsync({ giftCode: code, claimer: address });
        if (result?.txHash) setClaimTxHash(result.txHash);
      }
      setClaimSubmitted(true);
      setClaimSuccess(true);
    } catch (error: any) {
      let msg = error?.message || '';
      const lowerMsg = msg.toLowerCase();
      const reason = error?.reason?.toLowerCase?.() || '';
      const revertArgs = error?.revert?.args?.[0]?.toLowerCase?.() || '';

      // If the user explicitly rejected the transaction in their wallet, show a bottom-left notification
      // and do not transition to the post-submission UI (so no "Start New Claim" or similar buttons appear).
      try {
        if (
          error?.code === 4001 ||
          lowerMsg.includes('user denied') ||
          lowerMsg.includes('rejected') ||
          lowerMsg.includes('user cancelled') ||
          lowerMsg.includes('user canceled') ||
          lowerMsg.includes('transaction canceled')
        ) {
          notifyWallet('Transaction canceled', 'warning');
          // keep the form visible so the user can correct or retry; do not mark as submitted
          setClaimSubmitted(false);
          setClaimSuccess(false);
          setError(null);
          return;
        }
      } catch {}

      if (
        lowerMsg.includes('already claimed') ||
        reason.includes('already claimed') ||
        revertArgs.includes('already claimed') ||
        lowerMsg.includes('already claimed/refunded')
      ) {
        msg = 'This gift has already been claimed or refunded.';
        setError(msg);
      } else if (
        lowerMsg.includes('missing revert data') ||
        reason.includes('missing revert data') ||
        revertArgs.includes('missing revert data')
      ) {
        setError('Unable to process your claim at the moment. Please try again after some time.');
      } else {
        setError(`Failed to submit claim: ${msg}`);
      }

      setClaimSubmitted(true);
      setClaimSuccess(false);
    }
  };

  const resetForm = () => {
    setClaimSubmitted(false);
    setIdError(null);
    setCodeError(null);
    setError(null);
  };

  const formatTokenAmount = (item: any) => {
    if (!item) return 'N/A';

    if (item.type === 'ERC721') {
      return `#${item.tokenId || 'N/A'}`;
    }

    if (item.amount) {
      try {

        const isWETH = item.contract?.toLowerCase() === '0xc02aaa39b223fe8d0a0e5c4f27eadc2c7c3fa0b'.toLowerCase() ||
                       item.contract?.toLowerCase() === '0xe7f1725e7734ce288f8367e1bb143e90bb3f0512'.toLowerCase();

        if (item.contract === 'native' || isWETH) {
          const ethValue = ethers.formatEther(item.amount);
          return `${parseFloat(ethValue).toFixed(4)} ETH`;
        } else {

          const decimals = item.decimals || 18;
          const tokenValue = ethers.formatUnits(item.amount, decimals);
          const symbol = isWETH ? 'ETH' : (item.symbol || 'Token');
          return `${parseFloat(tokenValue).toFixed(4)} ${symbol}`;
        }
      } catch (e) {
        return item.amount;
      }
    }

    return 'N/A';
  };

  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      <Typography variant="h3" align="center" sx={{ mb: 2, fontWeight: 'bold' }}>
        Claim Your Gift
      </Typography>

      <Typography variant="h6" align="center" sx={{ mb: 4, color: 'text.secondary' }}>
        Enter your gift details to claim your crypto assets
      </Typography>

      <GradientCard>
        <CardContent sx={{ p: 4 }}>
          {!claimSubmitted ? (
            <>
              {/* Mode Toggle */}
              <ToggleButtonGroup
                color="primary"
                exclusive
                value={mode}
                onChange={(_, v) => v && setMode(v)}
                sx={{
                  mb: 4,
                  width: '100%',
                  '& .MuiToggleButton-root': {
                    flex: 1,
                    borderRadius: 2,
                    px: 3,
                    py: 2,
                    fontSize: '1rem',
                    fontWeight: 600,
                    textTransform: 'none',
                    border: '2px solid',
                    borderColor: 'divider',
                    '&.Mui-selected': {
                      background: (theme) => theme.palette.primary.main,
                      color: 'white',
                      borderColor: 'transparent',
                      '&:hover': {
                        background: (theme) => theme.palette.primary.dark,
                      }
                    }
                  }
                }}
              >
                <ToggleButton value="id">🔗 Use OnChain Gift ID</ToggleButton>
                <ToggleButton value="code">🎫 Use Gift Code</ToggleButton>
              </ToggleButtonGroup>

              {/* Input Fields */}
              {mode === 'id' ? (
                <TextField
                  fullWidth
                  label="OnChain Gift ID"
                  value={giftIdNum !== undefined ? String(giftIdNum) : giftIdInput}
                  inputRef={mode === 'id' ? inputRef : undefined}
                  onChange={(e) => {
                    const v = e.target.value;
                    setGiftIdInput(v);
                    const n = parseInt(v, 10);
                    setGiftIdNum(Number.isNaN(n) ? undefined : n);
                    setIdError(validateId(v));
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !idError && address && (giftIdNum !== undefined || giftIdInput.trim())) {
                      handleSubmitClaim();
                    }
                  }}
                  placeholder="Enter the OnChain gift ID (e.g., 12345)..."
                  error={!!idError}
                  helperText={idError || ' '}
                  sx={{
                    mb: 3,
                    '& .MuiOutlinedInput-root': {
                      borderRadius: 3,
                      '& fieldset': {
                        borderWidth: 2,
                      }
                    }
                  }}
                />
              ) : (
                <TextField
                  fullWidth
                  label="Gift Code"
                  value={giftCodeInput}
                  inputRef={mode === 'code' ? inputRef : undefined}
                  onChange={(e) => {
                    setGiftCodeInput(e.target.value);
                    setCodeError(validateCode(e.target.value));
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !codeError && address && giftCodeInput.trim()) {
                      handleSubmitClaim();
                    }
                  }}
                  placeholder="Enter your gift code (e.g., 8F2KX9)..."
                  error={!!codeError}
                  helperText={codeError || ' '}
                  InputProps={{
                    endAdornment: (
                      <InputAdornment position="end">
                        <Button
                          size="small"
                          onClick={pasteCodeFromClipboard}
                          sx={{
                            borderRadius: 2,
                            textTransform: 'none',
                            fontSize: '0.85rem'
                          }}
                        >
                          📋 Paste
                        </Button>
                      </InputAdornment>
                    )
                  }}
                  sx={{
                    mb: 3,
                    '& .MuiOutlinedInput-root': {
                      borderRadius: 3,
                      '& fieldset': {
                        borderWidth: 2,
                      }
                    }
                  }}
                />
              )}

              {/* Wallet Connection Alert */}
              {!address && (
                <Alert
                  severity="info"
                  sx={{
                    mb: 3,
                    borderRadius: 3,
                    '& .MuiAlert-icon': {
                      fontSize: '1.5rem'
                    }
                  }}
                  action={
                    <Button color="inherit" size="small" onClick={handleConnectWallet}>
                      Connect
                    </Button>
                  }
                >
                  Connect your wallet to preview gift details and submit claims.
                </Alert>
              )}

              {/* Preview Loading */}
              {giftPreviewLoading && enablePreview && (
                <Paper sx={{ p: 3, mb: 3, borderRadius: 3 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    <CircularProgress size={24} sx={{ mr: 2 }} />
                    <Typography variant="h6" color="text.secondary">
                      Loading gift details...
                    </Typography>
                  </Box>
                  <Box sx={{ display: 'grid', gap: 2 }}>
                    {[1, 2, 3].map((i) => (
                      <LoadingSkeleton key={i} />
                    ))}
                  </Box>
                </Paper>
              )}

              {/* Preview Error */}
              {giftPreviewError && enablePreview && (
                <Alert
                  severity="error"
                  sx={{
                    mb: 3,
                    borderRadius: 3,
                    '& .MuiAlert-icon': {
                      fontSize: '1.5rem'
                    }
                  }}
                  icon={<span>⚠️</span>}
                >
                  {onChainErrorText}
                </Alert>
              )}

              {/* Gift Preview */}
              {giftPreview && enablePreview && (
                <GradientCard
                  sx={{
                    mb: 3,
                    background: (theme) => `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.primary.dark} 100%)`,
                    color: 'white',
                    position: 'relative',
                    overflow: 'hidden'
                  }}
                >
                  {/* Decorative Background Elements */}
                  <Box
                    sx={{
                      position: 'absolute',
                      top: -50,
                      right: -50,
                      width: 200,
                      height: 200,
                      background: 'rgba(255, 255, 255, 0.1)',
                      borderRadius: '50%',
                      zIndex: 0
                    }}
                  />
                  <Box
                    sx={{
                      position: 'absolute',
                      bottom: -30,
                      left: -30,
                      width: 150,
                      height: 150,
                      background: 'rgba(255, 255, 255, 0.05)',
                      borderRadius: '50%',
                      zIndex: 0
                    }}
                  />

                  <CardContent sx={{ position: 'relative', zIndex: 1 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                      <Box
                        sx={{
                          width: 48,
                          height: 48,
                          borderRadius: '50%',
                          background: 'rgba(255, 255, 255, 0.2)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          mr: 2,
                          fontSize: '1.5rem'
                        }}
                      >
                        🎁
                      </Box>
                      <Typography variant="h5" sx={{ fontWeight: 'bold' }}>
                        Gift Preview
                      </Typography>
                    </Box>

                    <Grid container spacing={2}>
                      <Grid item xs={12}>
                        <Paper
                          sx={{
                            background: 'rgba(255, 255, 255, 0.1)',
                            borderRadius: 2,
                            p: 2,
                            backdropFilter: 'blur(10px)'

                          }}
                        >
                          <Typography variant="body2" sx={{ opacity: 0.8, mb: 0.5 }}>
                            From
                          </Typography>
                          <Typography
                            variant="body1"
                            sx={{
                              fontFamily: 'monospace',
                              fontSize: '0.9rem',
                              wordBreak: 'break-all'
                            }}
                          >
                            {giftPreview.giftPack.senderAddress}
                          </Typography>
                        </Paper>
                      </Grid>

                      <Grid item xs={12}>
                        <Paper
                          sx={{
                            background: 'rgba(255, 255, 255, 0.1)',
                            borderRadius: 2,
                            p: 2,
                            backdropFilter: 'blur(10px)'
                          }}
                        >
                          <Typography variant="body2" sx={{ opacity: 0.8, mb: 0.5 }}>
                            Anyone with the code can claim
                          </Typography>
                        </Paper>
                      </Grid>

                      <Grid item xs={6}>
                        <Paper
                          sx={{
                            background: 'rgba(255, 255, 255, 0.1)',
                            borderRadius: 2,
                            p: 2,
                            backdropFilter: 'blur(10px)'
                          }}
                        >
                          <Typography variant="body2" sx={{ opacity: 0.8, mb: 0.5 }}>
                            Asset Type
                          </Typography>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            {giftPreview.giftPack.items[0]?.type === 'ERC721' ? '🖼️' : '🪙'}
                            <Typography variant="body1" sx={{ fontWeight: 'bold' }}>
                              {giftPreview.giftPack.items[0]?.type === 'ERC721' ? 'NFT' : 'Token'}
                            </Typography>
                          </Box>
                        </Paper>
                      </Grid>

                      <Grid item xs={6}>
                        <Paper
                          sx={{
                            background: 'rgba(255, 255, 255, 0.1)',
                            borderRadius: 2,
                            p: 2,
                            backdropFilter: 'blur(10px)'
                          }}
                        >
                          <Typography variant="body2" sx={{ opacity: 0.8, mb: 0.5 }}>
                            Amount
                          </Typography>
                          <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                            {formatTokenAmount(giftPreview.giftPack.items[0])}
                          </Typography>
                        </Paper>
                      </Grid>

                      {giftPreview.giftPack.message && (
                        <Grid item xs={12}>
                          <Paper
                            sx={{
                              background: 'rgba(255, 255, 255, 0.1)',
                              borderRadius: 2,
                              p: 2,
                              backdropFilter: 'blur(10px)'
                            }}
                          >
                            <Typography variant="body2" sx={{ opacity: 0.8, mb: 0.5 }}>
                              Message
                            </Typography>
                            <Typography variant="body1" sx={{ fontStyle: 'italic' }}>
                              &quot;{giftPreview.giftPack.message}&quot;
                            </Typography>
                          </Paper>
                        </Grid>
                      )}
                    </Grid>
                  </CardContent>
                </GradientCard>
              )}

              {/* Error Display */}
              {error && (
                <Alert severity="error" sx={{ mb: 3, borderRadius: 3 }}>
                  {error}
                </Alert>
              )}

              {/* Claim Button */}
              <Box textAlign="center">
                <ClaimButton
                  onClick={handleSubmitClaim}
                  disabled={
                    (mode === 'id' ? !!idError || !giftIdNum : !!codeError || !giftCodeInput.trim()) ||
                    !address ||
                    submitClaim.isPending ||
                    isAlreadyClaimedPreview ||
                    isExpiredPreview ||
                    isRefundedPreview
                  }
                  startIcon={submitClaim.isPending ? <CircularProgress size={24} color="inherit" /> : null}
                  size="large"
                >
                  {submitClaim.isPending ? 'Submitting...' : isAlreadyClaimedPreview ? 'Gift Already Claimed' : isRefundedPreview ? 'Gift Refunded' : isExpiredPreview ? 'Gift Expired' : '🎁 Claim Gift'}
                </ClaimButton>
              </Box>
              {isAlreadyClaimedPreview && (
                <Alert severity="info" sx={{ mt: 2 }}>
                  This gift has already been claimed on-chain.
                  {giftPreview?.onChainStatus?.claimer && (
                    <div style={{ marginTop: 6 }}>Claimed by <code style={{ fontFamily: 'monospace' }}>{giftPreview.onChainStatus.claimer}</code></div>
                  )}
                </Alert>
              )}

              {(isExpiredPreview || isRefundedPreview) && (
                <Alert severity="error" sx={{ mt: 2 }}>
                  {isRefundedPreview ? 'This gift has been refunded to the sender and is no longer claimable.' : 'This gift has expired and is no longer claimable. The tokens will be refunded to the sender.'}
                </Alert>
              )}
            </>
          ) : (
            <Box textAlign="center" sx={{ py: 6 }}>
              {claimSuccess ? (
                <Alert severity="success" sx={{ mb: 3, borderRadius: 3, fontSize: '1.1rem' }}>
                  🎉 Gift claimed successfully!
                  {claimTxHash && (
                    <Box mt={1}>
                      <a href={`https://sepolia.etherscan.io/tx/${claimTxHash}`} target="_blank" rel="noopener noreferrer">
                        View Transaction on Etherscan
                      </a>
                    </Box>
                  )}
                  {/* Show message and items if available */}
                  {giftPreview?.giftPack?.message && (
                    <Box mt={2}>
                      <Typography variant="subtitle1" fontWeight={700}>Message:</Typography>
                      <Typography variant="body1" sx={{ fontStyle: 'italic' }}>
                        &quot;{giftPreview?.giftPack?.message}&quot;
                      </Typography>
                    </Box>
                  )}
                  {giftPreview?.giftPack?.items?.length && giftPreview.giftPack.items.length > 0 && (
                    <Box mt={2}>
                      <Typography variant="subtitle1" fontWeight={700}>Gift Pack Items:</Typography>
                      <ul style={{ margin: 0, paddingLeft: 20 }}>
                        {giftPreview?.giftPack?.items?.map((item: any, idx: number) => {

                          const isWETH = item.contract?.toLowerCase() === '0xc02aaa39b223fe8d0a0e5c4f27eadc2c7c3fa0b'.toLowerCase() ||
                                         item.contract?.toLowerCase() === '0xe7f1725e7734ce288f8367e1bb143e90bb3f0512'.toLowerCase();
                          const displayName = isWETH ? 'ETH' : (item.name || item.symbol || 'Token');

                          return (
                            <li key={idx}>
                              {displayName}
                              {item.amount ? ` × ${formatTokenAmount(item)}` : ''}
                            </li>
                          );
                        })}
                      </ul>
                    </Box>
                  )}
                </Alert>
              ) : (
                <Alert severity="error" sx={{ mb: 3, borderRadius: 3, fontSize: '1.1rem' }}>
                  ❌ Claim failed.<br />
                  {error}
                </Alert>
              )}
              {/* Only show Try Again button for failed claims, not for successful ones */}
              {!claimSuccess && (
                <Button
                  variant="contained"
                  sx={{ mt: 2, borderRadius: 2, fontWeight: 600, textTransform: 'none' }}
                  onClick={() => {
                    setClaimSubmitted(false);
                    setClaimSuccess(false);
                    setClaimTxHash(null);
                    setError(null);
                  }}
                >
                  Try Again
                </Button>
              )}
            </Box>
          )}
        </CardContent>
      </GradientCard>
    </Container>
  );
}
