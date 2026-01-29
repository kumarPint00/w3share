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
  IconButton,
  Collapse,
  Paper,
  Tooltip,
} from '@mui/material';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
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

const TOKEN_LOGO_MAP: Record<string, string> = {}; // add known token symbol -> image URL mappings here as needed



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
  const [txRawError, setTxRawError] = useState<any | null>(null);
  const [showErrorDetails, setShowErrorDetails] = useState(false);
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
            image: (() => {
            let img = meta?.image || it.image;
            try {
              const sym = (meta?.symbol || it.symbol || it.name || '').toLowerCase();
              if (!img && sym && TOKEN_LOGO_MAP?.[sym]) img = TOKEN_LOGO_MAP[sym];
              // mismatch heuristic: if image contains another known token logo, prefer symbol logo
              if (img && sym && TOKEN_LOGO_MAP?.[sym]) {
                const imgLower = (img || '').toLowerCase();
                const mismatched = Object.entries(TOKEN_LOGO_MAP).some(([k, v]) => k !== sym && imgLower.includes(v.toLowerCase()));
                if (mismatched) {
                  console.warn('[ClaimGiftForm] Replaced mismatched token image with symbol logo', { symbol: sym, previous: img, new: TOKEN_LOGO_MAP[sym] });
                  img = TOKEN_LOGO_MAP[sym];
                }
              }
            } catch (e) {}
            return img;
          })(),
          };
        });
        console.log('[ClaimGiftForm] Enriched preview items:', enrichedItems.map((i: any) => ({ symbol: i.symbol, name: i.name, image: i.image })));
        setPreviewGift({ ...gift, items: enrichedItems });

        // If any enriched items are still missing images, try fetching token metadata for those contracts as a best-effort fallback
        (async () => {
          try {
            const backendUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';
            const missingContracts = Array.from(new Set(enrichedItems.filter(it => !it.image && it.contract && it.contract !== 'native').map(it => it.contract.toLowerCase())));
            if (missingContracts.length === 0) return;
            const fetched: Record<string, any> = {};
            await Promise.all(missingContracts.map(async (contract) => {
              try {
                const r = await fetch(`${backendUrl}/assets/tokens/metadata?contract=${contract}`);
                if (r.ok) {
                  const meta = await r.json();
                  if (meta?.image) fetched[contract] = meta.image;
                }
              } catch (e) { /* ignore individual failures */ }
            }));
            if (Object.keys(fetched).length > 0) {
              const updated = enrichedItems.map(it => {
                const c = (it.contract || '').toLowerCase();
                if (!it.image && c && fetched[c]) {
                  console.log('[ClaimGiftForm] Filled missing item image from metadata for', c, fetched[c]);
                  return { ...it, image: fetched[c] };
                }
                return it;
              });
              setPreviewGift(prev => prev ? ({ ...prev, items: updated }) : ({ ...gift, items: updated }));
            }
          } catch (e) {
            console.warn('[ClaimGiftForm] Failed to fetch missing token metadata', e);
          }
        })();
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
            // Show a succinct, red helper text when the code is invalid
            setCodeError(prev => prev || 'Invalid Code');
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
    let executedTxHashes: string[] = [];
    setTxError(null);
    setSuccess(false);
    setTxHash(null);
    setTxHashes([]);
    setClaimProgress(null);
    if (!walletAddress) return;
    const validationError = validateCode(giftCodeInput);
    setCodeError(validationError);
    if (validationError) return;
    // Prevent attempting to claim if preview indicates it's already claimed
    const isAlreadyClaimedNow = !!(previewGift?.claimed || onChainStatus?.claimed || onChainStatus?.status === 'CLAIMED' || onChainStatus?.claimer);
    if (isAlreadyClaimedNow) {
      setTxError('This gift has already been claimed. See details above.');
      return;
    }
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
              // Treat manual confirmation cancellation as a transaction cancel so the UI shows a single wallet toast
              // and does not surface inline errors or the "Start New Claim" button.
              throw new Error('Transaction canceled');
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
              // Notify backend that claim was completed
              try {
                await apiService.confirmClaimComplete({ giftCode: code, txHash: tx.hash, claimer: walletAddress });
              } catch (err) {
                console.warn('Failed to notify backend about claim completion:', err);
              }
          } catch (err: any) {
            setClaimProgress({ current: 1, total: 1, name: 'Batch claim', status: 'failed' });
            setTxError(err?.message || 'Batch claim failed');
            throw err;
          } finally {
            setClaimProgress(null);
            if (_txHashes.length > 0) {
              const recorded = [..._txHashes];
              setTxHashes(recorded);
              executedTxHashes = recorded;
            }
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
          const recordedTxHashes = [..._txHashes];
          setTxHashes(recordedTxHashes);
          executedTxHashes = recordedTxHashes;
          // Mark success only if all txs succeeded
          if (_txHashes.length === anyClaim.claimTransactions.length) {
            setSuccess(true);
              // Notify backend about the successful claim (use first tx hash as reference)
              try {
                if (recordedTxHashes.length > 0) {
                  await apiService.confirmClaimComplete({ giftCode: code, txHash: recordedTxHashes[0], claimer: walletAddress });
                }
              } catch (err) {
                console.warn('Failed to notify backend about claim completion:', err);
              }
          }
          setClaimProgress(null);
        }
      } else {
        const tx = await signer.sendTransaction({
          to: anyClaim.contract,
          data: anyClaim.data,
        });
        setTxHash(tx.hash);
        const recordedTxHashes = [tx.hash];
        setTxHashes(recordedTxHashes);
        executedTxHashes = recordedTxHashes;
        await tx.wait();
        setSuccess(true);
        try {
          await apiService.confirmClaimComplete({ giftCode: code, txHash: tx.hash, claimer: walletAddress });
        } catch (err) {
          console.warn('Failed to notify backend about claim completion:', err);
        }
      }

      if (onClaimSuccess) {
        try {
          const giftDetails = await getGiftPackDetails({ giftCode: code });
          onClaimSuccess({
            message: giftDetails?.message,
            items: giftDetails?.items || [],
          });
        } catch (e) {
          onClaimSuccess({});
        }
      }
    } catch (error: any) {
      // Save raw error for developer diagnostics
      setTxRawError(error);

      const rawMsg = (error?.message || error?.reason || (typeof error === 'string' ? error : '') || '').toString();
      const lowerMsg = rawMsg.toLowerCase();

      // Map common on-chain errors to friendly messages
      if (
        lowerMsg.includes('user denied') ||
        lowerMsg.includes('user rejected') ||
        lowerMsg.includes('transaction canceled') ||
        lowerMsg.includes('user cancelled') ||
        lowerMsg.includes('user canceled')
      ) {
        // Use a single bottom-left toast for cancellation and do not show the inline error or Start New Claim button
        try { window.dispatchEvent(new CustomEvent('wallet:notification', { detail: { message: 'Transaction canceled. Your gift is still claimable. You can try again.', type: 'warning' } })); } catch {}
        setTxError(null);
        setTxRawError(null);
        setShowErrorDetails(false);
        return;
      } else if (lowerMsg.includes('gift pack not found') || lowerMsg.includes('no gift') || lowerMsg.includes('gift not found')) {
        setTxError('On-chain error: gift not found. This usually means the gift was already CLAIMED, never locked on-chain or the on-chain ID is invalid. Confirm the gift code or ask the sender to retry locking it.');
        
      } else if (lowerMsg.includes('insufficient') && lowerMsg.includes('funds')) {
        setTxError('Insufficient funds to complete the transaction. Make sure you have enough ETH for gas and try again.');
      } else if (lowerMsg.includes('call_exception') || lowerMsg.includes('execution reverted') || lowerMsg.includes('revert')) {
        setTxError('On-chain call failed. The contract rejected the operation — check that the gift is properly locked on-chain and try again.');
      } else {
        setTxError(error?.message || 'Failed to submit claim.');
      }
    } finally {
      setIsPending(false);
      setClaimProgress(null);
    }
  }, [walletAddress, giftCodeInput, validateCode, onClaimSuccess]);

  const resetForm = useCallback(() => {
    setGiftCodeInput('');
    setCodeError(null);
    setTxError(null);
    setTxHash(null);
    setTxHashes([]);
    setSuccess(false);
    setClaimProgress(null);
    setPreviewGift(null);
    setOnChainStatus(null);
    setIsPending(false);
  }, []);

  // Hide 'Start New Claim' when the error indicates a user-cancelled transaction
  const isCancelError = (msg: string | null) => {
    if (!msg) return false;
    return /transaction canceled/i.test(msg) || /user (?:denied|rejected)/i.test(msg) || /canceled/i.test(msg) && msg.toLowerCase().includes('wallet');
  };
  const showStartNewClaim = success || (txError && !isCancelError(txError));


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
            {previewGift && !previewLoading && (() => {
              const isAlreadyClaimed = !!(previewGift?.claimed || onChainStatus?.claimed || onChainStatus?.status === 'CLAIMED' || onChainStatus?.claimer);
              if (!isAlreadyClaimed) return null;

              const claimer = onChainStatus?.claimer || undefined;
              const giftId = onChainStatus?.giftId || previewGift?.giftIdOnChain;
              const claimPageUrl = giftId ? `${typeof window !== 'undefined' ? window.location.origin : ''}/gift/claim?giftId=${giftId}` : null;

              return (
                <Alert severity="info" sx={{ mb: 2 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <strong>This gift has already been claimed</strong>
                      {claimer && <div style={{ marginTop: 6 }}>Claimed by <code style={{ fontFamily: 'monospace' }}>{claimer}</code></div>}
                      {!claimer && <div style={{ marginTop: 6 }}>The gift was already claimed on-chain.</div>}
                    </div>
                    <div style={{ display: 'flex', gap: 8 }}>
                      {claimPageUrl && (
                        <Button size="small" variant="outlined" href={claimPageUrl} target="_blank" rel="noopener noreferrer" sx={{ textTransform: 'none' }}>
                          View on-chain
                        </Button>
                      )}
                      <Button
                        size="small"
                        variant="contained"
                        onClick={() => {
                          setGiftCodeInput('');
                          setPreviewGift(null);
                          setOnChainStatus(null);
                          setCodeError(null);
                        }}
                        sx={{ textTransform: 'none' }}
                      >
                        Clear
                      </Button>
                    </div>
                  </div>
                </Alert>
              );
            })()}

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
              // const isAlreadyClaimed = !!(previewGift?.claimed || onChainStatus?.claimed || onChainStatus?.status === 'CLAIMED' || onChainStatus?.claimer);
              const isAlreadyClaimed = previewGift?.status === 'CLAIMED' 
              console.log('Determining button state:', { isAlreadyClaimed, previewGift, onChainStatus });
              const isInvalidGift = !previewLoading && giftCodeInput.trim() && !previewGift && !isAlreadyClaimed && !isPending && !codeError ? true : codeError === 'Invalid Code';
              const buttonDisabled = !!codeError || !giftCodeInput.trim() || !walletAddress || isPending || isAlreadyClaimed || isInvalidGift;
              const label = isAlreadyClaimed
                ? 'Gift Already Claimed'
                : isInvalidGift
                  ? 'Invalid Code'
                  : (isPending ? 'Submitting...' : 'Claim Gift');

              const buttonElement = (
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

              // If the gift is already claimed, show the disabled button but still provide a tooltip explaining why
              return (
                !success && (
                  isAlreadyClaimed ? (
                    <Tooltip title="This gift has already been claimed and cannot be redeemed.">
                      <span style={{ display: 'block' }}>{buttonElement}</span>
                    </Tooltip>
                  ) : (
                    buttonElement
                  )
                )
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
              <Box sx={{ mt: 2 }}>
                <Alert
                  severity="error"
                  action={(
                    <>
                      {/* <Button
                        size="small"
                        onClick={() => setShowErrorDetails((s) => !s)}
                        sx={{ textTransform: 'none' }}
                      >
                        {showErrorDetails ? 'Hide details' : 'Show details'}
                      </Button> */}
                      <Button
                        size="small"
                        onClick={() => {
                          setTxError(null);
                          setTxRawError(null);
                          setShowErrorDetails(false);
                        }}
                        sx={{ textTransform: 'none' }}
                      >
                        Dismiss
                      </Button>
                    </>
                  )}
                >
                  <strong>{txError}</strong>
                </Alert>

                <Collapse in={showErrorDetails} sx={{ mt: 1 }}>
                  <Paper variant="outlined" sx={{ p: 1, backgroundColor: '#fff6f6' }}>
                    <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 1 }}>
                      <Tooltip title="Copy details">
                        <IconButton
                          size="small"
                          onClick={() => {
                            try {
                              navigator.clipboard.writeText(JSON.stringify(txRawError || txError, null, 2));
                            } catch {}
                          }}
                        >
                          <ContentCopyIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    </Box>
                    <pre style={{ maxHeight: 300, overflow: 'auto', whiteSpace: 'pre-wrap', wordBreak: 'break-word', margin: 0 }}>
                      {typeof txRawError === 'string' ? txRawError : JSON.stringify(txRawError || txError, null, 2)}
                    </pre>
                  </Paper>
                </Collapse>
              </Box>
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
            {success && (
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
