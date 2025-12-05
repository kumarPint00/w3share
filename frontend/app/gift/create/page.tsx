'use client';

import { Container, Typography, Stack, Snackbar, Alert, Button, InputAdornment, IconButton, Tooltip, Box, Paper, TextField } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import { useContext, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';

import Section from '@/components/Section';
import EscrowContext from '@/context/EscrowContext';
import { useWallet } from '@/context/WalletContext';
import useWalletNfts from '@/lib/hooks/useWalletNft';

import ReadyToSendCard from '@/components/ui/ReadyToSendCard';
import AddMessageCard from '@/components/ui/AddMessageCard';
import NftGallery from '@/components/ui/NftGallary';
import SealGiftCard from '@/components/ui/SealGiftCard';
import TokenAddCard from '@/components/ui/TokenAddCard';
import SelectedItemsCard from '@/components/ui/SelectedItemCard';

import { GiftItem } from '@/types/gift';
import { Token } from '@/types/token';
import useWalletTokens from '@/lib/hooks/useWalletToken';
import { apiService, walletLogin } from '@/lib/api';
import { ethers } from 'ethers';
import { useDirectContractInteraction } from '@/lib/hooks/useDirectContractInteraction';
import Image from 'next/image';

const CreatePack: React.FC = () => {
  const router = useRouter();
  const [state, dispatch] = useContext(EscrowContext)!;

  const [msg, setMsg] = useState<string>(state.message);
  const [code, setCode] = useState<string>('');
  const [busy, setBusy] = useState<boolean>(false);
  const [lockBusy, setLockBusy] = useState<boolean>(false);
  const [toast, setToast] = useState<{ open: boolean; msg: string; severity: 'success'|'error' } | null>(null);
  const [packId, setPackId] = useState<string | null>(null);

  const { provider, address, connect } = useWallet();
  const { nfts, loading: nftsLoading } = useWalletNfts(address);
  const { tokens, loading: tokLoading } = useWalletTokens(provider, address);
  const { approveToken, lockGiftOnChain, checkTokenApproval, checkEthBalance, isAvailable: isContractAvailable, isLoading: contractLoading, error: contractError } = useDirectContractInteraction();

  // Debug: log tokens from useWalletTokens
  console.log('CreatePack - useWalletTokens result:', { tokensCount: tokens.length, loading: tokLoading, provider: !!provider, address });

  const handleAddToken = (token: Token & { amount: number }) => {

    const balance = Number(token.balance || 0);
    const totalUsd = Number(token.usd || 0);
    const unitUsd = balance > 0 ? (totalUsd / balance) : (token.priceUsd || 0);
    const itemUsd = Number(token.amount || 0) * unitUsd;

    dispatch({
      type: 'add',
      item: {
        ...token,
        type: 'ERC20',
        amount: token.amount,

        rawAmount: String(token.amount),
        usd: isFinite(itemUsd) ? itemUsd : 0,
      } as unknown as GiftItem,
    });

    setToast({
      open: true,
      msg: `${token.amount} ${token.symbol} added to gift!`,
      severity: 'success',
    });
  };

  const handleRemoveToken = (id: string) => {
    dispatch({ type: 'remove', id });
  };

  const handleNftToggle = (nft: GiftItem) => {
    dispatch({
      type: state.items.find((i) => i.id === nft.id) ? 'remove' : 'add',
      id: nft.id,
      item: nft,
    });
  };

  function genCode() {
    return Math.random().toString(36).slice(2, 8).toUpperCase();
  }

  const ensureAuth = async () => {
    if (!provider || !address) {
      await connect();
      if (!provider || !address) throw new Error('Connect wallet to continue');
    }
    await walletLogin(provider);
  };

  const handleGenerateCode = async () => {
    if (!state.items.length) return;

    setBusy(true);
    try {
      await ensureAuth();


      const expiry = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
      const newCode = genCode();
      const draft = await apiService.createGiftPack({
        senderAddress: address!,
        message: msg || undefined,
        expiry,
        giftCode: newCode,
      });


      for (const it of state.items) {
        const isNft = it.type === 'NFT';


        let contract = (it as any).address as string | undefined;
        let tokenId: string | undefined;
        if (!contract && isNft) {

          const [c, t] = (it.id || '').split(':');
          if (c && t) {
            contract = c;
            tokenId = t;
          }
        }
        if (!contract) {
          throw new Error('Missing contract address for item');
        }

        const decimals = (it as any).decimals ?? 18;

        const rawAmountStr = it.rawAmount ?? String((it as any).amount || 0);

        const addItem = {
          type: (isNft ? 'ERC721' : 'ERC20') as 'ERC20' | 'ERC721',
          contract,
          tokenId: tokenId,
          amount: !isNft
            ? ethers.parseUnits(rawAmountStr, decimals).toString()
            : undefined,
        };
        await apiService.addItemToGiftPack(draft.id, addItem);
      }


      setCode(newCode);
      setPackId(draft.id);
      dispatch({ type: 'setCode', code: newCode });
      setToast({ open: true, msg: 'Gift pack created! Ready to lock.', severity: 'success' });
    } catch (e: any) {
      setToast({ open: true, msg: e?.message || 'Failed to create gift', severity: 'error' });
    } finally {
      setBusy(false);
    }
  };

  const handleConfirmAndLock = async () => {
    if (!packId || !code) return;
    
    try {
      await ensureAuth();
      setLockBusy(true);

      // Step 1: Validate the gift pack
      const validation = await apiService.validateGiftForLocking(packId);
      if (!validation.isValid) throw new Error(validation.errors.join(', '));

      // Step 2: Get gift pack details to handle token approval and locking
      const pack = await apiService.getGiftPack(packId);
      const firstItem = pack.items[0];
      
      // Check if direct contract interaction is available
      if (firstItem && firstItem.type === 'ERC20' && isContractAvailable()) {
        console.log('Gift pack item details:', {
          contract: firstItem.contract,
          amount: firstItem.amount,
          type: typeof firstItem.amount,
          rawAmount: (firstItem as any).rawAmount
        });
        
        // Check if it's native ETH (address is "native" or similar)
        const isNativeEth = !firstItem.contract || 
                           firstItem.contract.toLowerCase() === 'native' || 
                           firstItem.contract === '0x0000000000000000000000000000000000000000';
        
        if (isNativeEth) {
          // Native ETH cannot be locked via ERC20 flow
          throw new Error('Native ETH gifting is not supported yet. Please select an ERC20 token like USDC, LINK, or WETH.');
        }
        
        // Handle ERC20 token - need frontend approval and locking
        
        // First check if user has enough ETH for gas fees
        setToast({ open: true, msg: 'Checking gas fee balance...', severity: 'info' });
        const ethCheck = await checkEthBalance();
        if (!ethCheck.hasEnoughForGas) {
          throw new Error(`Insufficient ETH for gas fees. You have ${ethCheck.balanceEth.toFixed(4)} ETH, need at least 0.001 ETH`);
        }

        setToast({ open: true, msg: 'Please approve token in your wallet...', severity: 'info' });
        
        // Use rawAmount if available (user input), otherwise use amount (wei format)
        const amountToUse = (firstItem as any).rawAmount || firstItem.amount.toString();
        
        // Approve token
        await approveToken(firstItem.contract, amountToUse);
        setToast({ open: true, msg: 'Token approved! Locking gift...', severity: 'info' });
        
        // Lock gift on blockchain directly
        const lockResult = await lockGiftOnChain(
          firstItem.contract,
          amountToUse,
          pack.message || 'A gift for you!',
          code,
          7
        );
        
        if (lockResult.success) {
          // Notify backend about successful locking
          await apiService.updateGiftPackWithOnChainId(packId, lockResult.giftId, lockResult.txHash);
        }
        
        setToast({ open: true, msg: 'Gift locked successfully!', severity: 'success' });
        router.push(`/gift/create/success?giftCode=${code}&giftId=${lockResult.giftId}`);
      } else {
        // Fallback to backend for non-ERC20 or if direct contract interaction fails
        const lockRes = await apiService.lockGiftPack(packId);
        setToast({ open: true, msg: 'Gift locked successfully!', severity: 'success' });
        router.push(`/gift/create/success?giftCode=${lockRes.giftCode}`);
      }
    } catch (e: any) {
      console.error('Lock gift error:', e);
      setToast({ open: true, msg: e?.message || 'Failed to lock gift on blockchain', severity: 'error' });
    } finally {
      setLockBusy(false);
    }
  };



  const selectedNftIds = state.items
    .filter((i) => i.type === 'NFT')
    .map((i) => i.id);

  const currencyFormatter = useMemo(
    () =>
      new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }),
    []
  );

  const formatTokenAmount = (item: GiftItem) => {
    if (item.formattedAmount) return item.formattedAmount;
    if (typeof item.amount === 'number' && !Number.isNaN(item.amount)) {
      const hasFraction = Math.abs(item.amount % 1) > 0;
      return item.amount.toLocaleString(undefined, {
        minimumFractionDigits: hasFraction ? 2 : 0,
        maximumFractionDigits: 6,
      });
    }
    return null;
  };


  return (
    <Section 
      sx={{ 
        minHeight: '100vh',
        background: 'linear-gradient(180deg, #cde5ff 0%, #f4f7ff 100%)',
        display: 'flex',
        alignItems: 'flex-start',
        justifyContent: 'center',
        position: 'relative',
        overflow: 'hidden',
        '&::before': {
          content: '""',
          position: 'absolute',
          top: '-18%',
          right: '-12%',
          width: { xs: '240px', md: '360px' },
          height: { xs: '240px', md: '360px' },
          background: 'radial-gradient(circle, rgba(255,255,255,0.7) 0%, rgba(255,255,255,0) 70%)',
        },
        '&::after': {
          content: '""',
          position: 'absolute',
          bottom: '-20%',
          left: '-15%',
          width: { xs: '260px', md: '420px' },
          height: { xs: '260px', md: '420px' },
          background: 'radial-gradient(circle, rgba(255,255,255,0.55) 0%, rgba(255,255,255,0) 65%)',
        }
      }}
    >
      <Container maxWidth="md" sx={{ py: { xs: 4, md: 6 }, position: 'relative', zIndex: 1 }}>
        {/* Header Section */}
        <Box textAlign="center" mb={{ xs: 4, md: 6 }}>
        
            <Image
              src="/dogegifty_logo_without_text.png"
              alt="Dogegifty Logo"
              width={164}
              height={164}
              style={{ objectFit: 'contain' }}
            />
          <Typography 
            variant="h3" 
            fontWeight={800} 
            mb={1.5}
            sx={{ 
              fontSize: { xs: '2rem', md: '2.6rem' },
              color: '#111e54',
              letterSpacing: '-0.015em',
            }}
          >
            What&apos;s in your pack?
          </Typography>
          <Typography 
            variant="h2" 
            sx={{ 
              fontSize: { xs: '1rem', md: '1.1rem' },
              color: '#4b5563',
              maxWidth: '420px',
              mx: 'auto',
              lineHeight: 1.6,
              fontWeight: 500,
            }}
          >
            Choose what you want to include in your gift.
          </Typography>
        </Box>

  <Stack spacing={{ xs: 3, md: 4 }}>
          {/* Step 1: Add a Message */}
          <Paper 
            elevation={0}
            sx={{ 
              p: { xs: 3, md: 4 },
              borderRadius: '28px',
              backgroundColor: '#ffffff',
              border: '1px solid #dfe5ff',
              boxShadow: '0 18px 36px rgba(17, 30, 84, 0.08)',
              transition: 'transform 0.2s ease',
              '&:hover': {
                transform: 'translateY(-4px)',
              }
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
              <Box
                sx={{
                  width: 46,
                  height: 46,
                  borderRadius: '50%',
                  backgroundColor: '#ffe5f1',
                  color: '#ff5a7c',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '1.2rem',
                  boxShadow: '0 10px 20px rgba(255, 90, 124, 0.15)',
                }}
              >
                ✏️
              </Box>
              <Box>
                <Typography variant="h6" fontWeight={700} sx={{ color: '#111e54', mb: 0.5 }}>
                  STEP 1: Add a Message*
                </Typography>
                <Typography variant="caption" sx={{ color: '#ff5a7c', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  Required
                </Typography>
              </Box>
            </Box>

            <Typography 
              variant="body2" 
              sx={{ color: '#5b6478', mb: 2, fontSize: '0.95rem', lineHeight: 1.5 }}
            >
              Write something meaningful, playful, or mysterious. It&apos;s your message, your vibe. This is required to seal your gift.
            </Typography>

            <TextField
              fullWidth
              multiline
              rows={4}
              placeholder="Hey, this is a gift for you. 💝"
              value={msg}
              onChange={(e) => setMsg(e.target.value)}
              sx={{
                '& .MuiOutlinedInput-root': {
                  borderRadius: '18px',
                  backgroundColor: '#ffffff',
                  border: '1px solid #d7dff3',
                  fontSize: '1rem',
                  fontWeight: 500,
                  transition: 'border-color 0.2s ease, box-shadow 0.2s ease',
                  '&:hover': {
                    borderColor: '#b7c0e9',
                    boxShadow: '0 4px 12px rgba(17, 30, 84, 0.08)',
                  },
                  '&.Mui-focused': {
                    borderColor: '#4f63ff',
                    boxShadow: '0 0 0 3px rgba(79, 99, 255, 0.15)',
                    backgroundColor: '#ffffff',
                  },
                  '& fieldset': {
                    border: 'none',
                  },
                  '& textarea': {
                    '&::placeholder': {
                      color: '#9aa3ba',
                      fontWeight: 400,
                    }
                  }
                },
              }}
            />
          </Paper>

          {/* Step 2: Select Items */}
          <Paper 
            elevation={0}
            sx={{ 
              p: { xs: 3, md: 4 },
              borderRadius: '28px',
              backgroundColor: '#ffffff',
              border: '1px solid #e5e7eb',
              boxShadow: '0 10px 30px rgba(17, 30, 84, 0.12)',
              transition: 'transform 0.2s ease, box-shadow 0.2s ease',
              '&:hover': {
                transform: 'translateY(-2px)',
                boxShadow: '0 14px 36px rgba(17, 30, 84, 0.16)',
              }
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
              <Box
                sx={{
                  width: 46,
                  height: 46,
                  borderRadius: '50%',
                  backgroundColor: state.items.length > 0 ? '#d5f5eb' : '#f1f5fb',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: state.items.length > 0 ? '0 10px 20px rgba(15, 157, 122, 0.12)' : '0 10px 20px rgba(107, 114, 128, 0.12)',
                }}
              >
                <Image
                  src="/gift_icon.png"
                  alt="Gift"
                  width={28}
                  height={28}
                  style={{ objectFit: 'contain' }}
                />
              </Box>
              <Box>
                <Typography variant="h6" fontWeight={700} sx={{ color: '#111e54', mb: 0.5 }}>
                  STEP 2: Select Items
                </Typography>
                <Typography 
                  variant="caption" 
                  sx={{ color: state.items.length > 0 ? '#0f9d7a' : '#ff5a7c', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}
                >
                  {state.items.length > 0 ? `${state.items.length} items added` : 'Required'}
                </Typography>
              </Box>
            </Box>

            <Typography 
              variant="body2" 
              sx={{ color: '#5b6478', mb: 2.5, fontSize: '0.95rem', lineHeight: 1.5 }}
            >
              Add some tokens to your gift pack.
            </Typography>

            <Box sx={{ mb: 2.5 }}>
              <TokenAddCard tokens={tokens} loading={tokLoading} onAdd={handleAddToken} />
            </Box>
          </Paper>

          {/* Gift Preview */}
          <Paper 
            elevation={0}
            sx={{ 
              p: { xs: 3, md: 4 },
              borderRadius: '28px',
              backgroundColor: '#ffffff',
              border: '1px solid #dfe5ff',
              boxShadow: '0 18px 36px rgba(17, 30, 84, 0.08)'
            }}
          >
            <Typography variant="h6" fontWeight={700} sx={{ color: '#111e54', mb: 3 }}>
              Gift Preview
            </Typography>

            <Box
              sx={{
                borderRadius: '22px',
                border: '1px solid #e2e7fb',
                overflow: 'hidden',
              }}
            >
              <Box sx={{ display: 'flex', backgroundColor: '#f8faff', py: 1.5, px: 3 }}>
                <Typography sx={{ flex: 1, color: '#5b6478', fontWeight: 600, fontSize: '0.9rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Message
                </Typography>
                <Typography sx={{ flex: 1, color: '#5b6478', fontWeight: 600, fontSize: '0.9rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Items
                </Typography>
              </Box>
              <Box sx={{ display: 'flex', px: 3, py: 2.5, gap: 2, flexDirection: { xs: 'column', md: 'row' } }}>
                <Typography sx={{ flex: 1, color: '#111e54', fontWeight: 500 }}>
                  {msg || 'Hey, this is a gift for you'}
                </Typography>
                <Box sx={{ flex: 1 }}>
                  {state.items.length > 0 ? (
                    <Stack spacing={1.5}>
                      {state.items.map((item) => {
                        const amountText = formatTokenAmount(item);
                        const tokenLabel = (item.symbol || item.name || '').trim();
                        const tokenInitial = tokenLabel ? tokenLabel.charAt(0).toUpperCase() : '?';
                        const metaParts: string[] = [];

                        if (amountText) {
                          metaParts.push(
                            `${amountText}${item.symbol ? ` ${item.symbol}` : ''}`.trim()
                          );
                        }

                        if (typeof item.usd === 'number' && !Number.isNaN(item.usd)) {
                          metaParts.push(currencyFormatter.format(item.usd));
                        }

                        return (
                          <Box key={item.id} sx={{ display: 'flex', alignItems: 'center', gap: 1.5, justifyContent: 'space-between' }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                              <Box
                                sx={{
                                  width: 32,
                                  height: 32,
                                  borderRadius: '50%',
                                  backgroundColor: '#eef2ff',
                                  color: '#4f63ff',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  fontWeight: 700,
                                  fontSize: '0.85rem',
                                }}
                              >
                                {tokenInitial}
                              </Box>
                              <Box>
                                <Typography sx={{ fontSize: '0.95rem', color: '#111e54', fontWeight: 600 }}>
                                  {item.symbol || item.name}
                                </Typography>
                                {metaParts.length > 0 && (
                                  <Typography sx={{ fontSize: '0.85rem', color: '#647196', fontWeight: 500 }}>
                                    {metaParts.join(' • ')}
                                  </Typography>
                                )}
                              </Box>
                            </Box>
                            <IconButton
                              size="small"
                              onClick={() => handleRemoveToken(item.id)}
                              sx={{
                                color: '#ff5a7c',
                                '&:hover': {
                                  backgroundColor: '#ffe5f1',
                                },
                              }}
                            >
                              <CloseIcon fontSize="small" />
                            </IconButton>
                          </Box>
                        );
                      })}
                    </Stack>
                  ) : (
                    <Typography sx={{ fontSize: '0.95rem', color: '#9aa3ba' }}>
                      No items yet
                    </Typography>
                  )}
                </Box>
              </Box>
            </Box>
          </Paper>

          {/* Step 3: Seal Your Gift */}
          {(state.items.length > 0 && msg.trim()) && (
            <Paper 
              elevation={0}
              sx={{ 
                p: { xs: 3, md: 4 },
                borderRadius: '28px',
                backgroundColor: '#ffffff',
                border: '1px solid #e5e7eb',
                boxShadow: '0 10px 30px rgba(17, 30, 84, 0.12)',
                transition: 'transform 0.2s ease, box-shadow 0.2s ease',
                '&:hover': {
                  transform: 'translateY(-2px)',
                  boxShadow: '0 14px 36px rgba(17, 30, 84, 0.16)',
                }
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
                <Box
                  sx={{
                    width: 46,
                    height: 46,
                    borderRadius: '50%',
                    backgroundColor: '#e1e9ff',
                    color: '#4f63ff',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '1.1rem',
                  }}
                >
                  🔐
                </Box>
                <Box>
                  <Typography variant="h6" fontWeight={700} sx={{ color: '#111e54', mb: 0.5 }}>
                    STEP 3: Seal Your Gift
                  </Typography>
                  <Typography variant="caption" sx={{ color: '#4f63ff', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                    Required
                  </Typography>
                </Box>
              </Box>

              <Typography 
                variant="body2" 
                sx={{ color: '#5b6478', mb: 2.5, fontSize: '0.95rem', lineHeight: 1.5 }}
              >
                Generate a secret gift code to seal your gift pack. This code will be required to claim the gift.
              </Typography>
              
              <SealGiftCard 
                loading={busy} 
                disabled={!state.items.length || !msg.trim()} 
                secretCode={code} 
                onGenerate={handleGenerateCode} 
              />
            </Paper>
          )}

          {/* Step 4: Ready to Send */}
          {code && (
            <Paper 
              elevation={0}
              sx={{ 
                p: { xs: 3, md: 4 },
                borderRadius: '28px',
                backgroundColor: '#ffffff',
                border: '1px solid #e5e7eb',
                boxShadow: '0 10px 30px rgba(17, 30, 84, 0.12)',
                transition: 'transform 0.2s ease, box-shadow 0.2s ease',
                '&:hover': {
                  transform: 'translateY(-2px)',
                  boxShadow: '0 14px 36px rgba(17, 30, 84, 0.16)',
                }
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
                <Box
                  sx={{
                    width: 46,
                    height: 46,
                    borderRadius: '50%',
                    backgroundColor: '#d5f5eb',
                    color: '#0f9d7a',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '1.2rem',
                  }}
                >
                  🚀
                </Box>
                <Box>
                  <Typography variant="h6" fontWeight={700} sx={{ color: '#111e54', mb: 0.5 }}>
                    STEP 4: Ready to Send
                  </Typography>
                  <Typography variant="caption" sx={{ color: '#0f9d7a', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                    Final Step
                  </Typography>
                </Box>
              </Box>

              <ReadyToSendCard
                items={state.items}
                message={msg}
                secretCode={code}
                onConfirm={handleConfirmAndLock}
                disabled={lockBusy || contractLoading}
                isLoading={lockBusy || contractLoading}
              />
            </Paper>
          )}
        </Stack>
      </Container>

      <Snackbar open={!!toast?.open} autoHideDuration={4000} onClose={() => setToast(null)}>
        <Alert severity={toast?.severity || 'success'} variant="filled">
          {toast?.msg || ''}
        </Alert>
      </Snackbar>
    </Section>
  );
};

export default CreatePack;
