'use client';

import {
  Box,
  Button,
  Card,
  CardContent,
  TextField,
  Alert,
  CircularProgress,
  InputAdornment,
  Typography,
} from '@mui/material';
import AccountBalanceWalletIcon from '@mui/icons-material/AccountBalanceWallet';
import ContentPasteIcon from '@mui/icons-material/ContentPaste';
import BackgroundRemoverImage from '@/components/BackgroundRemoverImage';
import { useState, useCallback, useEffect, useRef } from 'react';
import { ethers } from 'ethers';
import { apiService, getGiftPackDetails } from '@/lib/api';
import GiftPreviewCard from '@/components/GiftPreviewCard';
import { GiftItem } from '@/types/gift';
import { useSearchParams } from 'next/navigation';
import { useWallet } from '@/context/WalletContext';



interface ClaimGiftFormProps {
  walletAddress?: string;
  initialGiftId?: number;
  initialGiftCode?: string;
  onClaimSuccess?: (giftDetails: { message?: string; items?: any[] }) => void;
}

export default function ClaimGiftForm({ walletAddress, initialGiftId, initialGiftCode, onClaimSuccess }: ClaimGiftFormProps) {
  const searchParams = useSearchParams();
  const giftCodeFromUrl = searchParams?.get?.('giftCode') || '';
  const { connect } = useWallet();

  const [giftCodeInput, setGiftCodeInput] = useState(initialGiftCode || giftCodeFromUrl || '');

  const hasInitialized = useRef(false);
  useEffect(() => {
    if (!hasInitialized.current) {
      if (initialGiftCode) {
        setGiftCodeInput(initialGiftCode);
      } else if (giftCodeFromUrl) {
        setGiftCodeInput(giftCodeFromUrl);
      }
      hasInitialized.current = true;
    }
  }, [initialGiftCode, giftCodeFromUrl]);
  const [codeError, setCodeError] = useState<string | null>(null);
  const [isPending, setIsPending] = useState(false);
  const [txHash, setTxHash] = useState<string | null>(null);
  const [txHashes, setTxHashes] = useState<string[]>([]);
  const [claimProgress, setClaimProgress] = useState<{ current: number; total: number; name?: string; status?: 'in-progress'|'done'|'failed' } | null>(null);
  const [txError, setTxError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [previewGift, setPreviewGift] = useState<any | null>(null);
  const [onChainStatus, setOnChainStatus] = useState<any | null>(null);
  const [previewLoading, setPreviewLoading] = useState(false);

  useEffect(() => {
    const code = giftCodeInput.trim();
    if (!code) { setPreviewGift(null); setOnChainStatus(null); return; }
    let cancelled = false;
    (async () => {
      setPreviewLoading(true);
      try {
        const gift = await getGiftPackDetails({ giftCode: code });
        if (cancelled) return;
        // Allow-list enrichment
        let allow: any[] = [];
        try {
          const backendUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';
          const r = await fetch(`${backendUrl}/assets/tokens/allow-list`);
          if (r.ok) allow = await r.json();
        } catch { }
        const allowMap: Record<string, string | any> = {};
        allow.forEach(t => { allowMap[t.contract?.toLowerCase?.()] = t; });

        // Find contracts missing metadata and fetch from backend
        const missing = new Set<string>();
        (gift.items || []).forEach((it: any) => {
          const key = (it.contract || '').toLowerCase();
          if (key && key !== 'native' && !allowMap[key]) missing.add(key);
        });
        if (missing.size > 0) {
          try {
            const backendUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';
            await Promise.all(Array.from(missing).map(async (contract) => {
              try {
                const r = await fetch(`${backendUrl}/assets/tokens/metadata?contract=${contract}`);
                if (r.ok) {
                  const meta = await r.json();
                  allowMap[contract] = meta;
                }
              } catch (e) { /* ignore individual failures */ }
            }));
          } catch (e) {
            // ignore overall failures
          }
        }

        const enrichedItems: GiftItem[] = (gift.items || []).map((it: any, idx: number) => {
          const key = (it.contract || '').toLowerCase();
          const meta: any = allowMap[key];
          const decimals = meta?.decimals ?? 18;
          const raw = it.amount || '0';
          const num = Number(raw) / Math.pow(10, decimals);
          const formatted = num >= 1 ? (num >= 1000 ? Intl.NumberFormat('en', { notation: 'compact', maximumFractionDigits: 2 }).format(num) : num.toString()) : num.toPrecision(3);
          return {
            id: it.id || String(idx),
            contract: it.contract || '',
            name: it.contract === 'native' ? 'Ethereum' : (meta?.name || it.name || it.symbol || 'Token'),
            symbol: meta?.symbol || it.symbol,
            type: it.type === 'ERC721' ? 'NFT' : 'ERC20',
            usd: 0,
            amount: Number(raw),
            rawAmount: raw,
            decimals,
            formattedAmount: formatted,
          };
        });
        setPreviewGift({ ...gift, items: enrichedItems });
        if (gift?.claimed) {
          // proactively set success disabled state if code already claimed
          setSuccess(false); // keep success false but disable via claimed flag
        }
        // On-chain status fetch if possible
        if (gift.giftIdOnChain !== undefined && gift.giftIdOnChain !== null) {
          try {
            const backendUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';
            const r = await fetch(`${backendUrl}/giftpacks/on-chain/${gift.giftIdOnChain}/preview`);
            if (r.ok) {
              const d = await r.json();
              if (!cancelled) setOnChainStatus(d.onChainStatus || null);
            }
          } catch { }
        } else {
          setOnChainStatus(null);
        }
      } catch {
        if (!cancelled) {
          setPreviewGift(null);
          setOnChainStatus(null);
          if (giftCodeInput.trim()) {
            setCodeError(prev => prev || 'Invalid gift code');
          }
        }
      } finally {
        if (!cancelled) setPreviewLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [giftCodeInput]);


  const validateCode = useCallback((v: string) => {
    if (!v.trim()) return 'Enter your gift code';
    return null;
  }, []);

  const pasteCodeFromClipboard = useCallback(async () => {
    try {
      const txt = await navigator.clipboard.readText();
      if (txt) {
        setGiftCodeInput(txt.trim());
        setCodeError(validateCode(txt));
      }
    } catch {

    }
  }, [validateCode]);

  const handleSubmitClaim = useCallback(async () => {
    setTxError(null);
    setSuccess(false);
    setTxHash(null);
    if (!walletAddress) return;
    const err = validateCode(giftCodeInput);
    setCodeError(err);
    if (err) return;
    setIsPending(true);
    try {

      const code = giftCodeInput.trim();
      const claimData = await apiService.submitClaim({ giftCode: code, claimer: walletAddress });

      interface EthereumWindow extends Window { ethereum?: any }
      const eth = (window as EthereumWindow).ethereum;
      if (!eth) throw new Error('MetaMask not found');
      const provider = new ethers.BrowserProvider(eth);
      const signer = await provider.getSigner();
      const anyClaim: any = claimData as any; // relax type to allow contract/data

      // Handle multi-token claim responses
      if (anyClaim.isMultiToken && Array.isArray(anyClaim.claimTransactions)) {
        const _txHashes: string[] = [];
        const txs = anyClaim.claimTransactions;

        // If backend provided a single batched claim (and contract supports it), prefer that
        if (anyClaim.batchClaim && anyClaim.batchClaim.data && anyClaim.batchClaim.contract) {
          // Warn user if batch size is large
          const batchSize = Array.isArray(anyClaim.batchClaim.giftIds) ? anyClaim.batchClaim.giftIds.length : 0;
          if (batchSize > 4) {
            const ok = window.confirm(`This gift contains ${batchSize} tokens and will be claimed in a single transaction. This may be expensive in gas. Continue?`);
            if (!ok) {
              setTxError('User cancelled batch claim');
              throw new Error('User cancelled batch claim');
            }
          }
          setClaimProgress({ current: 0, total: 1, name: 'Batch claim', status: 'in-progress' });
          try {
            const c = anyClaim.batchClaim;
            const tx = await signer.sendTransaction({ to: c.contract, data: c.data });
            _txHashes.push(tx.hash);
            setTxHash(tx.hash);
            await tx.wait();
            setClaimProgress({ current: 1, total: 1, name: 'Batch claim', status: 'done' });
            setSuccess(true);
          } catch (err: any) {
            setClaimProgress({ current: 1, total: 1, name: 'Batch claim', status: 'failed' });
            setTxError(err?.message || 'Batch claim failed');
            throw err;
          } finally {
            setClaimProgress(null);
            setTxHashes(_txHashes);
          }
        } else {
          setClaimProgress({ current: 0, total: txs.length, name: undefined, status: 'in-progress' });
          for (let i = 0; i < txs.length; i++) {
            const c = txs[i];
            // Try to resolve a friendly name for the item: use previewGift items if lengths match
            let friendlyName: string | undefined = undefined;
            try {
              if (previewGift?.items && previewGift.items.length === txs.length) {
                const it = previewGift.items[i];
                friendlyName = it?.name || it?.symbol || (it?.contract ? `${it.contract.slice(0,6)}...${it.contract.slice(-4)}` : undefined);
              }
            } catch {}
            setClaimProgress({ current: i + 1, total: txs.length, name: friendlyName, status: 'in-progress' });
            try {
              const tx = await signer.sendTransaction({ to: c.contract, data: c.data });
              _txHashes.push(tx.hash);
              setTxHash(tx.hash);
              setTxError(null);
              // wait for confirmation before proceeding to next
              await tx.wait();
              // update progress
              setClaimProgress({ current: i + 1, total: txs.length, name: friendlyName, status: 'done' });
            } catch (err: any) {
              setClaimProgress({ current: i + 1, total: txs.length, name: friendlyName, status: 'failed' });
              setTxError(err?.message || `Failed to submit claim for giftId ${c.giftId}`);
              // stop processing further transactions on error
              throw err;
            }
          }
          setTxHashes(_txHashes);
          // Mark success only if all txs succeeded
          if (_txHashes.length === anyClaim.claimTransactions.length) {
            setSuccess(true);
          }
          setClaimProgress(null);
        }
      } else {
        const tx = await signer.sendTransaction({
          to: anyClaim.contract,
          data: anyClaim.data,
        });
        setTxHash(tx.hash);
        setTxHashes([tx.hash]);
        await tx.wait();
        setSuccess(true);
      }

      if (onClaimSuccess) {
        try {
          const giftDetails = await getGiftPackDetails({ giftCode: code });
          // provide txHashes if available
          onClaimSuccess({
            message: giftDetails?.message,
            items: giftDetails?.items || [],
            txHashes: txHashes,
          });
        } catch (e) {
          onClaimSuccess({});
        }
      }
    } catch (error: any) {
      setTxError(error?.message || 'Failed to submit claim.');
    } finally {
      setIsPending(false);
    }
  }, [walletAddress, giftCodeInput, validateCode, onClaimSuccess]);

  const resetForm = useCallback(() => {
    setGiftCodeInput('');
    setCodeError(null);
    setTxError(null);
    setTxHash(null);
    setSuccess(false);
  }, []);


  return (
    <Box sx={{ width: '100%', maxWidth: '600px' }}>
      <Card
        sx={{
          borderRadius: 4,
          boxShadow: '0 10px 40px rgba(0, 0, 0, 0.08)',
          background: '#ffffff',
          backdropFilter: 'blur(10px)',
          border: '1px solid rgba(0, 0, 0, 0.05)',
        }}
      >
          <CardContent sx={{ p: { xs: 3, md: 5 } }}>
            <TextField
              fullWidth
              placeholder="Gift Code"
              value={giftCodeInput}
              onChange={(e) => {
                setGiftCodeInput(e.target.value);
                setCodeError(validateCode(e.target.value));
              }}
              onKeyDown={(e) => {
                if (
                  e.key === 'Enter' &&
                  !codeError &&
                  walletAddress &&
                  giftCodeInput.trim()
                ) {
                  handleSubmitClaim();
                }
              }}
              error={!!codeError}
              helperText={codeError || ' '}
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <Button
                      onClick={pasteCodeFromClipboard}
                      sx={{
                        color: '#0B7EFF',
                        textTransform: 'none',
                        fontWeight: 600,
                        fontSize: '0.95rem',
                        minWidth: 'auto',
                        px: 0,
                        '&:hover': {
                          backgroundColor: 'transparent',
                          textDecoration: 'underline',
                        },
                      }}
                    >
                      Paste
                    </Button>
                  </InputAdornment>
                ),
              }}
              sx={{
                mb: 3,
                '& .MuiOutlinedInput-root': {
                  borderRadius: 3,
                  backgroundColor: '#f8f9fa',
                  fontSize: '1.05rem',
                  '& fieldset': {
                    borderColor: 'transparent',
                  },
                  '&:hover fieldset': {
                    borderColor: 'rgba(11, 126, 255, 0.2)',
                  },
                  '&.Mui-focused fieldset': {
                    borderColor: '#0B7EFF',
                    borderWidth: 2,
                  },
                  '& input': {
                    py: 2,
                    px: 2.5,
                    '&::placeholder': {
                      color: '#9ca3af',
                      opacity: 1,
                    },
                  },
                },
              }}
            />
            {previewLoading && giftCodeInput.trim() && (
              <Alert severity="info" sx={{ mb: 2 }}>Checking gift code...</Alert>
            )}
            {previewGift && !previewLoading && (
              <Box mb={2}>
                <GiftPreviewCard giftPack={previewGift} onChainStatus={onChainStatus} showAnimation={true} />
              </Box>
            )}

            {!walletAddress && (
              <Box
                sx={{
                  mb: 3,
                  p: 3,
                  borderRadius: 3,
                  border: '2px dashed rgba(11, 126, 255, 0.2)',
                  backgroundColor: 'rgba(11, 126, 255, 0.02)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  flexDirection: { xs: 'column', sm: 'row' },
                  gap: 2,
                }}
              >
                <Box
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 2,
                  }}
                >
                  <Box
                    sx={{
                      width: 48,
                      height: 48,
                      borderRadius: '50%',
                      backgroundColor: 'rgba(11, 126, 255, 0.1)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <AccountBalanceWalletIcon
                      sx={{ fontSize: 24, color: '#0B7EFF' }}
                    />
                  </Box>
                  <Box>
                    <Typography
                      variant="body1"
                      sx={{
                        fontWeight: 600,
                        color: '#111e54',
                        mb: 0.5,
                      }}
                    >
                      Connect Your Wallet
                    </Typography>
                    <Typography
                      variant="body2"
                      sx={{
                        color: '#64748b',
                        fontSize: '0.9rem',
                      }}
                    >
                      To claim your gift, please connect your wallet
                    </Typography>
                  </Box>
                </Box>
                <Button
                  onClick={connect}
                  variant="contained"
                  sx={{
                    bgcolor: '#0B7EFF',
                    color: '#fff',
                    py: 1.2,
                    px: 3,
                    borderRadius: 2,
                    textTransform: 'none',
                    fontSize: '1rem',
                    fontWeight: 600,
                    boxShadow: 'none',
                    whiteSpace: 'nowrap',
                    '&:hover': {
                      bgcolor: '#0068ff',
                      boxShadow: '0 4px 12px rgba(11, 126, 255, 0.3)',
                    },
                  }}
                >
                  Connect Wallet
                </Button>
              </Box>
            )}

            {(() => {
              const isAlreadyClaimed = !!(previewGift?.claimed || onChainStatus?.claimed || onChainStatus?.status === 'CLAIMED' || onChainStatus?.claimer);
              const isInvalidGift = !previewLoading && giftCodeInput.trim() && !previewGift && !isAlreadyClaimed && !isPending && !success && !codeError ? true : codeError === 'Invalid gift code';
              const buttonDisabled = !!codeError || !giftCodeInput.trim() || !walletAddress || isPending || success || isAlreadyClaimed || isInvalidGift;
              const label = success
                ? 'Gift Claimed'
                : isAlreadyClaimed
                  ? 'Already Claimed'
                  : isInvalidGift
                    ? 'Invalid Code'
                    : (isPending ? 'Submitting...' : 'Claim Gift');
              return (
                <Button
                  variant="contained"
                  size="large"
                  onClick={handleSubmitClaim}
                  disabled={buttonDisabled}
                  startIcon={
                    isPending ? (
                      <CircularProgress size={20} color="inherit" />
                    ) : (
                      <Box sx={{ width: 48 }}>
                        <BackgroundRemoverImage
                          src={buttonDisabled ? "/gift_icon_transparent.png" : "/gift_icon.png"}
                          alt="Gift"
                          width={25}
                          height={25}
                          threshold={255}
                          channelDiff={80}
                          crop
                          cropPadding={1}
                          removeLightNeutral
                          lightnessCutoff={0.88}
                          saturationCutoff={0.22}
                          showSkeleton={false}
                        />
                      </Box>
                    )
                  }
                  fullWidth
                  sx={{
                    py: 2,
                    px: 4,
                    borderRadius: 3,
                    fontSize: '1.05rem',
                    fontWeight: 600,
                    textTransform: 'none',
                    bgcolor: '#0B7EFF',
                    color: '#fff',
                    boxShadow: 'none',
                    '&:hover': {
                      bgcolor: '#0068ff',
                      boxShadow: '0 4px 12px rgba(11, 126, 255, 0.3)',
                    },
                    '&:disabled': {
                      bgcolor: '#e5e7eb',
                      color: '#9ca3af',
                    },
                  }}
                >
                  {label}
                </Button>
              );
            })()}

            {txHashes.length > 0 && (
              <Alert
                severity={success ? 'success' : 'info'}
                sx={{
                  mt: 3,
                  backgroundColor: success ? '#e8f5e8' : '#e3f2fd',
                  color: success ? '#2e7d32' : '#1565c0',
                  fontFamily: 'Arial, sans-serif',
                  fontWeight: 'bold'
                }}
              >
                {success ? (
                  <>
                    Gift claimed successfully!{' '}
                    <div>
                      {txHashes.map((h, i) => {
                        const name = (previewGift?.items && previewGift.items.length === txHashes.length) ? (previewGift.items[i]?.name || previewGift.items[i]?.symbol) : undefined;
                        return (
                          <div key={h} style={{ marginTop: i === 0 ? 6 : 4 }}>
                            <a
                              href={`https://sepolia.etherscan.io/tx/${h}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              style={{ color: '#2e7d32', textDecoration: 'underline' }}
                            >
                              View Tx {i + 1} on Etherscan
                            </a>
                            {name && <span style={{ marginLeft: 8, color: '#2e7d32' }}>• {name}</span>}
                          </div>
                        );
                      })}
                    </div>
                  </>
                ) : (
                  <>
                    Transaction sent:{' '}
                    {txHashes.map((h, i) => (
                      <div key={h} style={{ marginTop: i === 0 ? 6 : 4 }}>
                        <a
                          href={`https://sepolia.etherscan.io/tx/${h}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          style={{ color: '#1565c0', textDecoration: 'underline' }}
                        >
                          {h}
                        </a>
                        {previewGift?.items && previewGift.items.length === txHashes.length && (
                          <span style={{ marginLeft: 8, color: '#1565c0' }}>• {previewGift.items[i]?.name || previewGift.items[i]?.symbol}</span>
                        )}
                      </div>
                    ))}
                  </>
                )}
              </Alert>
            )}
            {txError && (
              <Alert severity="error" sx={{ mt: 2 }}>{txError}</Alert>
            )}
            {claimProgress && (
              <Alert severity="info" sx={{ mt: 2 }}>
                {claimProgress.status === 'in-progress' ? (
                  <>
                    Claiming token {claimProgress.current}/{claimProgress.total}
                    {claimProgress.name ? `: ${claimProgress.name}` : ''}
                    …
                  </>
                ) : claimProgress.status === 'failed' ? (
                  <>{`Failed claiming ${claimProgress.name ?? ''} (${claimProgress.current}/${claimProgress.total})`}</>
                ) : (
                  <>{`Claim ${claimProgress.current}/${claimProgress.total} completed`}</>
                )}
              </Alert>
            )}
            {(success || txError) && (
              <Button
                variant="contained"
                sx={{
                  mt: 2,
                  py: 2,
                  px: 4,
                  borderRadius: 3,
                  fontSize: '1.05rem',
                  fontWeight: 600,
                  textTransform: 'none',
                  bgcolor: '#0B7EFF',
                  color: '#fff',
                  boxShadow: 'none',
                  '&:hover': {
                    bgcolor: '#0068ff',
                    boxShadow: '0 4px 12px rgba(11, 126, 255, 0.3)',
                  },
                }}
                onClick={resetForm}
                fullWidth
              >
                Start New Claim
              </Button>
            )}
          </CardContent>
        </Card>
    </Box>
  );
}
