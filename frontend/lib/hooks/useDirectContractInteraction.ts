'use client';

import { useState } from 'react';
import { ethers, Contract } from 'ethers';
import { useWallet } from '@/context/WalletContext';

const ERC20_ABI = [
  'function allowance(address owner, address spender) view returns (uint256)',
  'function approve(address spender, uint256 amount) returns (bool)',
  'function balanceOf(address account) view returns (uint256)',
  'function decimals() view returns (uint8)',
  'function symbol() view returns (string)',
];

const ESCROW_ABI = [
  'function lockGiftV2(uint8 assetType, address tokenAddress, uint256 tokenId, uint256 amount, uint256 expiryTimestamp, string calldata message, bytes32 codeHash) external returns (uint256 giftId)',
  'event GiftLocked(uint256 indexed giftId, address indexed sender, uint8 assetType, address tokenAddress, uint256 tokenId, uint256 amount, uint256 expiryTimestamp)',
];

const ESCROW_ADDRESS = process.env.NEXT_PUBLIC_GIFT_ESCROW_ADDRESS;

export function useDirectContractInteraction() {
  const { provider, address } = useWallet();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const checkTokenApproval = async (tokenAddress: string, amount: string) => {
    if (!provider || !address) throw new Error('Wallet not connected');
    if (!ethers.isAddress(tokenAddress)) throw new Error('Invalid token address');
    
    const signer = await provider.getSigner();
    const tokenContract = new Contract(tokenAddress, ERC20_ABI, signer);
    
    try {
      const allowance = await tokenContract.allowance(address, ESCROW_ADDRESS);
      
      let decimals = 18;
      try {
        decimals = await tokenContract.decimals();
      } catch (decimalsError) {
        console.warn('Could not get decimals, using 18:', decimalsError);
      }
      
      const requiredAmount = decimals === 0 ? BigInt(amount) : ethers.parseUnits(amount, decimals);
      
      return {
        hasApproval: allowance >= requiredAmount,
        currentAllowance: allowance,
        requiredAmount,
        decimals
      };
    } catch (error: any) {
      console.error('Token contract interaction failed:', error);
      throw new Error(`Token contract error: ${error.message}`);
    }
  };

  const approveToken = async (tokenAddress: string, amount: string) => {
    if (!provider || !address) throw new Error('Wallet not connected');
    
    setIsLoading(true);
    setError(null);
    
    try {
      const signer = await provider.getSigner();
      const tokenContract = new Contract(tokenAddress, ERC20_ABI, signer);
      
      // Get decimals with fallback
      let decimals = 18; // Default fallback
      try {
        decimals = await tokenContract.decimals();
      } catch (decimalsError) {
        console.warn('Could not get decimals from contract, using default 18:', decimalsError);
        // Try to get decimals from the amount if it's already in wei format
        if (amount.length > 10) {
          // If amount is very large, assume it's already in wei
          decimals = 0;
        }
      }
      
      const amountToApprove = decimals === 0 ? BigInt(amount) : ethers.parseUnits(amount, decimals);
      
      console.log('Approving token:', {
        tokenAddress,
        spender: ESCROW_ADDRESS,
        amount: amountToApprove.toString(),
        decimals,
        originalAmount: amount
      });
      
      const tx = await tokenContract.approve(ESCROW_ADDRESS, amountToApprove);
      const receipt = await tx.wait();
      
      console.log('Token approval successful:', receipt.hash);
      return { success: true, txHash: receipt.hash };
    } catch (err: any) {
      const errorMsg = err.reason || err.message || 'Token approval failed';
      setError(errorMsg);
      console.error('Token approval error:', err);
      throw new Error(errorMsg);
    } finally {
      setIsLoading(false);
    }
  };

  const checkEthBalance = async () => {
    if (!provider || !address) throw new Error('Wallet not connected');
    
    const balance = await provider.getBalance(address);
    const balanceEth = parseFloat(ethers.formatEther(balance));
    
    return {
      balance,
      balanceEth,
      hasEnoughForGas: balanceEth > 0.001 // At least 0.001 ETH for gas
    };
  };

  const lockGiftOnChain = async (
    tokenAddress: string,
    amount: string,
    message: string,
    giftCode: string,
    expiryDays: number = 7
  ) => {
    if (!provider || !address) throw new Error('Wallet not connected');
    if (!ESCROW_ADDRESS) throw new Error('Escrow contract address not configured');
    
    setIsLoading(true);
    setError(null);
    
    try {
      // Check ETH balance for gas fees
      const ethCheck = await checkEthBalance();
      if (!ethCheck.hasEnoughForGas) {
        throw new Error(`Insufficient ETH for gas fees. You have ${ethCheck.balanceEth.toFixed(4)} ETH, need at least 0.001 ETH`);
      }
      const signer = await provider.getSigner();
      const escrowContract = new Contract(ESCROW_ADDRESS, ESCROW_ABI, signer);
      
      // Get token decimals with fallback
      const tokenContract = new Contract(tokenAddress, ERC20_ABI, signer);
      let decimals = 18; // Default fallback
      try {
        decimals = await tokenContract.decimals();
      } catch (decimalsError) {
        console.warn('Could not get decimals from contract, using default 18:', decimalsError);
        if (amount.length > 10) {
          decimals = 0; // Assume already in wei
        }
      }
      
      const amountWei = decimals === 0 ? BigInt(amount) : ethers.parseUnits(amount, decimals);
      
      // Calculate expiry timestamp
      const expiryTimestamp = Math.floor(Date.now() / 1000) + (expiryDays * 24 * 60 * 60);
      
      // Hash the gift code
      const codeHash = ethers.keccak256(ethers.toUtf8Bytes(giftCode));
      
      console.log('Locking gift on chain:', {
        assetType: 0, // ERC20
        tokenAddress,
        tokenId: 0,
        amount: amountWei.toString(),
        expiryTimestamp,
        message,
        codeHash
      });
      
      // Call lockGiftV2 on the contract
      const tx = await escrowContract.lockGiftV2(
        0, // assetType: ERC20
        tokenAddress,
        0, // tokenId (not used for ERC20)
        amountWei,
        expiryTimestamp,
        message,
        codeHash
      );
      
      console.log('Transaction sent:', tx.hash);
      const receipt = await tx.wait();
      console.log('Transaction confirmed:', receipt.hash);
      
      // Parse the GiftLocked event to get the gift ID
      const giftLockedEvent = receipt.logs.find((log: any) => {
        try {
          const parsed = escrowContract.interface.parseLog(log);
          return parsed?.name === 'GiftLocked';
        } catch {
          return false;
        }
      });
      
      let giftId = null;
      if (giftLockedEvent) {
        const parsed = escrowContract.interface.parseLog(giftLockedEvent);
        giftId = parsed?.args[0]?.toString();
      }
      
      return {
        success: true,
        txHash: receipt.hash,
        giftId: giftId ? Number(giftId) : null
      };
    } catch (err: any) {
      const errorMsg = err.reason || err.message || 'Failed to lock gift on blockchain';
      setError(errorMsg);
      console.error('Lock gift error:', err);
      throw new Error(errorMsg);
    } finally {
      setIsLoading(false);
    }
  };

  const getTokenBalance = async (tokenAddress: string) => {
    if (!provider || !address) throw new Error('Wallet not connected');
    
    const signer = await provider.getSigner();
    const tokenContract = new Contract(tokenAddress, ERC20_ABI, signer);
    
    const [balance, decimals, symbol] = await Promise.all([
      tokenContract.balanceOf(address),
      tokenContract.decimals(),
      tokenContract.symbol()
    ]);
    
    return {
      balance,
      decimals,
      symbol,
      balanceFormatted: ethers.formatUnits(balance, decimals)
    };
  };

  return {
    checkTokenApproval,
    approveToken,
    lockGiftOnChain,
    getTokenBalance,
    checkEthBalance,
    isLoading,
    error
  };
}