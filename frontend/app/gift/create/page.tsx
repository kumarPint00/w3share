'use client';

import { Container, Typography, Stack, Snackbar, Alert, Button, InputAdornment, IconButton, Tooltip, Box, Paper, TextField } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import { useContext, useMemo, useState, useEffect } from 'react';
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

// Helper function to execute backend-generated transactions with user's wallet
async function executeBackendTransactions(
  transactions: Array<{ to: string; data: string; value: string; description: string }>,
  giftCode: string
) {
  if (!window.ethereum) {
    throw new Error('MetaMask not installed');
  }

  const accounts = await window.ethereum.request({ method: 'eth_accounts' });
  if (!accounts || accounts.length === 0) {
    throw new Error('No wallet connected');
  }

  const web3Provider = new ethers.BrowserProvider(window.ethereum);
  const signer = await web3Provider.getSigner();

  console.log('[ExecuteTx] Executing transactions for gift pack:', giftCode);
  console.log('[ExecuteTx] Number of transactions:', transactions.length);

  const transactionHashes: string[] = [];

  for (let i = 0; i < transactions.length; i++) {
    const tx = transactions[i];
    console.log(`[ExecuteTx] Executing transaction ${i + 1}/${transactions.length}: ${tx.description}`);

    const txData = {
      to: tx.to,
      data: tx.data,
      value: tx.value === '0' ? '0' : BigInt(tx.value),
    };

    const txResponse = await signer.sendTransaction(txData);
    console.log(`[ExecuteTx] Transaction ${i + 1} sent:`, txResponse.hash);
    transactionHashes.push(txResponse.hash);

    // Wait for transaction to be mined
    const receipt = await txResponse.wait();
    if (!receipt) {
      throw new Error(`Transaction ${i + 1} (${tx.description}) failed to be mined`);
    }
    console.log(`[ExecuteTx] Transaction ${i + 1} mined:`, receipt.hash);
  }

  return transactionHashes;
}

const CreatePack: React.FC = () => {
  const router = useRouter();
  const [state, dispatch] = useContext(EscrowContext)!;

  const [msg, setMsg] = useState<string>(state.message);
  const [code, setCode] = useState<string>('');
  const [busy, setBusy] = useState<boolean>(false);
  const [lockBusy, setLockBusy] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState<{ open: boolean; msg: string; severity: 'success'|'error' } | null>(null);
  const [packId, setPackId] = useState<string | null>(null);

  const { provider, address, connect } = useWallet();
  const { nfts, loading: nftsLoading } = useWalletNfts(address);
  const { tokens, loading: tokLoading } = useWalletTokens(provider, address);
  const { approveToken, lockGiftOnChain, checkTokenApproval, checkEthBalance, isAvailable: isContractAvailable, isLoading: contractLoading, error: contractError } = useDirectContractInteraction();

  // Debug: log tokens from useWalletTokens
  console.log('CreatePack - useWalletTokens result:', { tokensCount: tokens.length, loading: tokLoading, provider: !!provider, address });

  // Ensure a fresh state when landing on the Create screen.
  // Reset leftover items from a previous flow so Gift Preview is empty on a new create.
  useEffect(() => {
    if (state.items && state.items.length > 0) {
      dispatch({ type: 'reset' });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleAddToken = (token: Token & { amount: number }) => {

    const balance = Number(token.balance || 0);
    const totalUsd = Number(token.usd || 0);
    const unitUsd = balance > 0 ? (totalUsd / balance) : (token.priceUsd || 0);
    const itemUsd = Number(token.amount || 0) * unitUsd;

    // Ensure proper contract address mapping
    const contractAddress = token.contract || token.address;
    
    console.log('Adding token to gift pack:', {
      symbol: token.symbol,
      contract: token.contract,
      address: token.address,
      resolvedContract: contractAddress,
      amount: token.amount,
      isNative: token.isNative
    });

    dispatch({
      type: 'add',
      item: {
        ...token,
        type: 'ERC20',
        contract: contractAddress, // Ensure contract field is set
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
      try {
        await connect();
      } catch (e: any) {
        if (e?.code === 4001 || e?.message?.includes('rejected')) {
          throw new Error('Wallet connection rejected. Please connect your wallet to continue.');
        }
        throw new Error('Failed to connect wallet. Please try again.');
      }
      
      if (!provider || !address) {
        throw new Error('Failed to connect wallet. Please try again.');
      }
    }
    
    try {
      await walletLogin(provider);
    } catch (e: any) {
      if (e?.code === 4001 || e?.message?.includes('rejected')) {
        throw new Error('Signature rejected. Please sign the message to continue.');
      }
      throw new Error('Failed to sign message. Please try again.');
    }
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

        // Try multiple fields to find contract address
        let contract = (it as any).contract || (it as any).address;
        let tokenId: string | undefined;
        
        if (!contract && isNft) {
          // For NFTs, try to extract from ID
          const [c, t] = (it.id || '').split(':');
          if (c && t) {
            contract = c;
            tokenId = t;
          }
        }
        
        // Special handling for native ETH
        if (!contract && ((it as any).isNative || (it as any).symbol === 'ETH')) {
          contract = 'native';
        }
        
        if (!contract) {
          console.error('Missing contract address for item:', it);
          throw new Error(`Missing contract address for ${it.symbol || 'unknown token'}`);
        }

        console.log(`Processing item ${it.symbol}: contract=${contract}, isNft=${isNft}`);

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
    setError(null);
    try {
      await ensureAuth();
      setLockBusy(true);

      // Step 1: Validate the gift pack
      const validation = await apiService.validateGiftForLocking(packId);
      if (!validation.isValid) throw new Error(validation.errors.join(', '));

      // Step 2: Get gift pack details to handle token approval and locking
      const pack = await apiService.getGiftPack(packId);
      const firstItem = pack.items[0];
      
      // Check if direct contract interaction is available for all ERC20 tokens (excluding native ETH)
      const allERC20 = state.items.every(item => item.type === 'ERC20');
      const hasNativeEth = state.items.some(item => {
        const isNativeEth = item.contract === 'native' || 
                           item.contract === '0x0000000000000000000000000000000000000000' ||
                           (item.address === 'native') ||
                           (item.symbol === 'ETH' && item.isNative === true);
        return isNativeEth;
      });
      
      // Always use backend flow - it handles approvals correctly before transfers
      // Direct contract interaction is disabled because it doesn't handle ERC20 approvals properly
      if (false && allERC20 && state.items.length > 0 && isContractAvailable() && !hasNativeEth) {
        try {
        console.log('Multi-token gift pack items:', state.items.map(item => ({
          contract: item.contract,
          amount: item.amount,
          type: typeof item.amount,
          rawAmount: (item as any).rawAmount,
          symbol: item.symbol
        })));
        
        const giftIds: number[] = [];
        let totalEthUsed = BigInt(0);
        
        // Check total ETH balance first (for gas + ETH gifts)
        setToast({ open: true, msg: 'Checking balances for multi-token gift...', severity: 'info' });
        const ethCheck = await checkEthBalance();
        
        // Calculate total ETH needed (gas + any ETH amounts)
        let totalEthNeeded = ethers.parseEther('0.002'); // Base gas for multiple transactions
        const ethItems = state.items.filter(item => {
          const isNativeEth = item.contract === 'native' || 
                             item.contract === '0x0000000000000000000000000000000000000000' ||
                             (item.address === 'native') ||
                             (item.symbol === 'ETH' && item.isNative === true);
          console.log(`Token ${item.symbol} (${item.contract}) - isNativeEth: ${isNativeEth}`);
          return isNativeEth;
        });
        
        for (const ethItem of ethItems) {
          const amountToUse = (ethItem as any).rawAmount || '0';
          if (!amountToUse || amountToUse === '0') {
            throw new Error(`Invalid ETH amount for ${ethItem.symbol}: ${amountToUse}`);
          }
          totalEthNeeded += ethers.parseEther(amountToUse);
        }
        
        if (ethCheck.balance < totalEthNeeded) {
          const neededEth = parseFloat(ethers.formatEther(totalEthNeeded));
          throw new Error(`Insufficient ETH. Need ${neededEth.toFixed(4)} ETH total (${ethItems.length} ETH gifts + gas), have ${ethCheck.balanceEth.toFixed(4)} ETH`);
        }
        
        // Process each token individually
        for (let i = 0; i < state.items.length; i++) {
          const item = state.items[i];
          setToast({ open: true, msg: `Processing ${item.symbol} (${i+1}/${state.items.length})...`, severity: 'info' });
          
          const isNativeEth = item.contract === 'native' || 
                             item.contract === '0x0000000000000000000000000000000000000000' ||
                             (item.address === 'native') ||
                             (item.symbol === 'ETH' && item.isNative === true);
          
          console.log(`Processing ${item.symbol} - contract: ${item.contract}, isNativeEth: ${isNativeEth}`);
        
          if (isNativeEth) {
            // Handle native ETH gifting
            const amountToUse = (item as any).rawAmount || '0';
            
            if (!amountToUse || amountToUse === '0') {
              throw new Error(`Invalid ETH amount for ${item.symbol}: ${amountToUse}`);
            }
            
            setToast({ open: true, msg: `Locking ${amountToUse} ETH...`, severity: 'info' });
            
            // Lock native ETH on blockchain
            const lockResult = await lockGiftOnChain(
              '0x0000000000000000000000000000000000000000', // Special address for ETH
              amountToUse,
              pack.message || 'A gift for you!',
              code,
              7,
              true // isEth flag
            );
            
            if (lockResult?.success && lockResult.giftId) {
              giftIds.push(lockResult.giftId);
              totalEthUsed += ethers.parseEther(amountToUse);
            } else {
              throw new Error(`Failed to lock ETH gift: ${item.symbol}`);
            }
          } else {
            // Handle ERC20 token - need frontend approval and locking
            const amountToUse = (item as any).rawAmount || item.amount.toString();
            
            // Check if token has valid contract address
            const contractAddress = item.contract || item.address;
            if (!contractAddress || !ethers.isAddress(contractAddress)) {
              console.warn(`Token ${item.symbol} missing contract address, falling back to backend`);
              throw new Error(`FALLBACK_TO_BACKEND: ${item.symbol} requires backend processing`);
            }
            
            // STEP 1: Check current approval status
            setToast({ open: true, msg: `Checking ${item.symbol} approval...`, severity: 'info' });
            
            try {
              const approvalStatus = await checkTokenApproval(contractAddress, amountToUse);
              
              // STEP 2: If approval not granted, request it from user
              if (!approvalStatus.hasApproval) {
                setToast({ open: true, msg: `Requesting approval for ${item.symbol}...`, severity: 'info' });
                console.log(`[Approval] Token ${item.symbol} needs approval`, {
                  currentAllowance: approvalStatus.currentAllowance.toString(),
                  requiredAmount: approvalStatus.requiredAmount.toString(),
                  decimals: approvalStatus.decimals
                });
                
                await approveToken(contractAddress, amountToUse);
                
                // VERIFICATION: Double-check approval was set
                setToast({ open: true, msg: `Verifying ${item.symbol} approval...`, severity: 'info' });
                const verifyApproval = await checkTokenApproval(contractAddress, amountToUse);
                
                if (!verifyApproval.hasApproval) {
                  throw new Error(
                    `Approval verification failed for ${item.symbol}. ` +
                    `Please try again or approve manually in your wallet. ` +
                    `Approved: ${verifyApproval.currentAllowance.toString()}, Required: ${verifyApproval.requiredAmount.toString()}`
                  );
                }
                
                setToast({ open: true, msg: `${item.symbol} approved! Proceeding with lock...`, severity: 'success' });
              } else {
                setToast({ open: true, msg: `${item.symbol} already approved. Proceeding with lock...`, severity: 'info' });
                console.log(`[Approval] Token ${item.symbol} already has sufficient approval`, {
                  currentAllowance: approvalStatus.currentAllowance.toString(),
                  requiredAmount: approvalStatus.requiredAmount.toString()
                });
              }
            } catch (approvalError: any) {
              console.error(`[Approval] Failed to check/grant approval for ${item.symbol}:`, approvalError);
              throw new Error(`Approval failed for ${item.symbol}: ${approvalError.message}`);
            }
            
            // STEP 3: Lock gift on blockchain directly (after approval is confirmed)
            setToast({ open: true, msg: `Locking ${item.symbol}...`, severity: 'info' });
            
            const lockResult = await lockGiftOnChain(
              contractAddress,
              amountToUse,
              pack.message || 'A gift for you!',
              code,
              7,
              false // not ETH
            );
            
            if (lockResult?.success && lockResult.giftId) {
              giftIds.push(lockResult.giftId);
              setToast({ open: true, msg: `${item.symbol} locked successfully!`, severity: 'success' });
            } else {
              throw new Error(`Failed to lock ${item.symbol} gift`);
            }
          }
        }
        
        // All tokens processed successfully
        if (giftIds.length > 0) {
          // For multi-token gifts, store all giftIds
          if (giftIds.length > 1) {
            // Store all gift IDs as JSON array for multi-token claiming
            await apiService.updateGiftPackWithMultipleOnChainIds(packId, giftIds);
          } else {
            // Single token - use existing method
            await apiService.updateGiftPackWithOnChainId(packId, giftIds[0], '');
          }
          
          setToast({ 
            open: true, 
            msg: `Multi-token gift created! ${giftIds.length} tokens locked successfully.`, 
            severity: 'success' 
          });
          // Build success URL with transaction hash from multi-token gifts
          const params = new URLSearchParams({
            giftCode: code,
            giftId: giftIds[0].toString()
          });
          // Note: For multi-token gifts, we could collect all transaction hashes
          // but for simplicity, we'll show the first one if available
          router.push(`/gift/create/success?${params.toString()}`);
        } else {
          throw new Error('No tokens were successfully locked');
        }
        } catch (directError: any) {
          console.warn('Direct contract interaction failed, checking error type:', directError.message);
          
          // Check if it's an approval-related error
          const isApprovalError = 
            directError.message?.includes('Approval') ||
            directError.message?.includes('approval') ||
            directError.message?.includes('approve') ||
            directError.message?.includes('User denied') ||
            directError.message?.includes('insufficient allowance');
          
          if (isApprovalError) {
            setToast({ 
              open: true, 
              msg: `Approval issue: ${directError.message}. Please approve tokens in your wallet.`, 
              severity: 'error' 
            });
            console.error('[Approval Error]', directError);
            throw directError; // Don't fall back to backend for approval errors
          }
          
          // If it's a fallback error or any contract interaction error, use backend
          if (directError.message.includes('FALLBACK_TO_BACKEND') || 
              directError.message.includes('Invalid token contract') ||
              directError.message.includes('Token contract error')) {
            console.log('Using backend fallback for problematic tokens');
            const lockRes = await apiService.lockGiftPack(packId);
            
            // Execute the transactions from user's wallet
            await executeBackendTransactions(lockRes.transactions, lockRes.giftCode);
            
            setToast({ open: true, msg: 'Gift locked successfully via backend!', severity: 'success' });
            
            // Redirect to success page
            const params = new URLSearchParams({
              giftCode: lockRes.giftCode
            });
            router.push(`/gift/create/success?${params.toString()}`);
            return; // Important: exit here to prevent double processing
          }
          
          // Re-throw other errors
          throw directError;
        }
      } else {
        // Fallback to backend for multi-token gifts, NFTs, native ETH, or if direct contract interaction fails
        console.log('Using backend flow - Reason:', {
          hasFirstItem: !!firstItem,
          itemType: firstItem?.type,
          isContractAvailable: isContractAvailable(),
          itemCount: state.items.length,
          allERC20,
          hasNativeEth,
          reason: hasNativeEth ? 'Native ETH detected - using backend' : 'Other reason',
          items: state.items.map(item => ({
            symbol: item.symbol,
            contract: item.contract,
            address: item.address,
            type: item.type
          }))
        });
        // Add specific messaging for ETH gifts
        if (hasNativeEth) {
          setToast({ open: true, msg: 'Processing ETH gift via secure backend...', severity: 'info' });
        }
        
        try {
          const lockRes = await apiService.lockGiftPack(packId);
          
          // Execute the transactions from user's wallet
          await executeBackendTransactions(lockRes.transactions, lockRes.giftCode);
          
          const successMsg = hasNativeEth 
            ? 'ETH gift locked successfully!' 
            : 'Gift locked successfully via backend!';
          setToast({ open: true, msg: successMsg, severity: 'success' });
          
          // Build success URL with gift code
          const params = new URLSearchParams({ giftCode: lockRes.giftCode });
          router.push(`/gift/create/success?${params.toString()}`);
        } catch (backendError: any) {
          console.error('Backend gift creation failed:', backendError);
          // For ETH gifts, show specific error about testnet requirements
          if (hasNativeEth) {
            setError(`ETH gift failed: Backend requires Sepolia testnet WETH, but you provided mainnet amounts. Please use testnet tokens or convert to WETH on Sepolia. Error: ${backendError.message}`);
          } else {
            setError(`Backend gift creation failed: ${backendError.message}`);
          }
          throw backendError; // Re-throw to be caught by outer catch
        }
      }
    } catch (e: any) {
      console.error('Lock gift error:', e);
      
      // Enhanced error messaging
      let errorMessage = e?.message || 'Failed to lock gift on blockchain';
      
      if (errorMessage.includes('missing revert data')) {
        errorMessage = 'Smart contract call failed. This usually means: (1) Tokens not approved, (2) Insufficient balance, or (3) Contract issue. Try approving tokens manually in MetaMask first.';
      } else if (errorMessage.includes('User denied')) {
        errorMessage = 'You rejected the transaction. Please try again and approve the transaction in your wallet.';
      } else if (errorMessage.includes('Insufficient')) {
        errorMessage = `${errorMessage} - Make sure you have enough tokens AND enough gas (ETH).`;
      } else if (errorMessage.includes('Approval')) {
        errorMessage = `Approval failed: ${errorMessage} - Try approving with a higher gas limit in MetaMask.`;
      }
      
      setToast({ open: true, msg: errorMessage, severity: 'error' });
      // Also surface the error in-page for clarity
      setError(errorMessage);
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
          {error && (
            <Alert severity="error" sx={{ mt: 3 }} onClose={() => setError(null)}>
              {error}
            </Alert>
          )}
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
                              {(item as any).image ? (
                                <Box
                                  component="img"
                                  src={(item as any).image}
                                  alt={item.symbol}
                                  sx={{
                                    width: 32,
                                    height: 32,
                                    borderRadius: '50%',
                                    objectFit: 'contain',
                                  }}
                                />
                              ) : (
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
                              )}
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
