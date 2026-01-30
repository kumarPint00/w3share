/**
 * Smart Contract Gift Utilities
 *
 * This utility module provides helper functions to determine when and how to handle
 * gifts that should be backed by smart contracts.
 */

import { GiftPack, SmartContractGiftStatus } from '@/lib/api';
import { ethers } from 'ethers';

export interface SmartContractGiftConfig {

  minValueThreshold: number;

  supportedContracts: string[];

  maxItemsPerGift: number;

  maxExpiryDays: number;

  forceSmartContract: boolean;

  wrappedNativeAddress?: string;

  nativeTokenPolicy?: 'wrap' | 'allow' | 'disallow';
}

const defaultConfig: SmartContractGiftConfig = {
  minValueThreshold: 100,
  supportedContracts: [],
  maxItemsPerGift: 10,
  maxExpiryDays: 365,
  forceSmartContract: false,
  wrappedNativeAddress: undefined,
  nativeTokenPolicy: 'wrap',
};

export class SmartContractGiftUtils {
  private config: SmartContractGiftConfig;

  constructor(config: Partial<SmartContractGiftConfig> = {}) {
    this.config = { ...defaultConfig, ...config } as SmartContractGiftConfig;
  }

  /**
   * Determines if a gift pack should be backed by a smart contract
   */
  shouldUseSmartContract(giftPack: GiftPack): {
    shouldUse: boolean;
    reason: string;
    isRequired: boolean;
  } {

    if (this.config.forceSmartContract) {
      return {
        shouldUse: true,
        reason: 'Smart contract backing is required for all gifts',
        isRequired: true,
      };
    }


    if (giftPack.items.length === 0) {
      return {
        shouldUse: false,
        reason: 'Gift pack has no items',
        isRequired: false,
      };
    }


    const hasHighValueItems = this.hasHighValueItems(giftPack);
    if (hasHighValueItems) {
      return {
        shouldUse: true,
        reason: 'Gift contains high-value items requiring secure storage',
        isRequired: true,
      };
    }


    const expiryDays = this.getExpiryDays(giftPack);
    if (expiryDays > 30) {
      return {
        shouldUse: true,
        reason: 'Long expiry period benefits from smart contract security',
        isRequired: false,
      };
    }


    if (giftPack.items.length > 3) {
      return {
        shouldUse: true,
        reason: 'Multiple items benefit from atomic smart contract operations',
        isRequired: false,
      };
    }


    const hasNFTs = giftPack.items.some(item => item.type === 'ERC721');
    if (hasNFTs) {
      return {
        shouldUse: true,
        reason: 'NFTs require smart contract for secure transfer',
        isRequired: true,
      };
    }


    return {
      shouldUse: false,
      reason: 'Gift can be handled traditionally',
      isRequired: false,
    };
  }

  /**
   * Validates if a gift pack can be used with smart contracts
   */
  validateForSmartContract(giftPack: GiftPack): {
    isValid: boolean;
    errors: string[];
    warnings: string[];
  } {
    const errors: string[] = [];
    const warnings: string[] = [];


    const expiryDays = this.getExpiryDays(giftPack);
    if (expiryDays <= 0) {
      errors.push('Gift pack has already expired');
    } else if (expiryDays > this.config.maxExpiryDays) {
      errors.push(`Expiry exceeds maximum allowed days (${this.config.maxExpiryDays})`);
    }


    if (giftPack.items.length === 0) {
      errors.push('Gift pack must contain at least one item');
    } else if (giftPack.items.length > this.config.maxItemsPerGift) {
      errors.push(`Too many items (max: ${this.config.maxItemsPerGift})`);
    }


    if (!ethers.isAddress(giftPack.senderAddress)) {
      errors.push('Invalid sender address');
    }


    for (const item of giftPack.items) {
      const rawContract = (item.contract || '').toString();
      const isNative = rawContract.toLowerCase() === 'native';


      if (isNative) {

        if (item.type !== 'ERC20') {
          errors.push('Native token items must be of type ERC20');
        }

        const policy = this.config.nativeTokenPolicy || 'wrap';
        if (policy === 'disallow') {
          errors.push('Native token is not supported for smart contract gifts');
        }
      }


      const resolvedContract = isNative && this.config.nativeTokenPolicy !== 'disallow'
        ? (this.config.wrappedNativeAddress || undefined)
        : rawContract;


      if (!isNative) {
        if (!ethers.isAddress(resolvedContract)) {
          errors.push(`Invalid contract address: ${rawContract}`);
        }
      } else {

        if ((this.config.nativeTokenPolicy || 'wrap') === 'wrap') {
          if (!this.config.wrappedNativeAddress) {
            warnings.push('Native token detected. Configure wrappedNativeAddress to interact with ERC20 interfaces on-chain.');
          } else if (!ethers.isAddress(this.config.wrappedNativeAddress)) {
            warnings.push(`Configured wrappedNativeAddress is invalid: ${this.config.wrappedNativeAddress}`);
          }
        }
      }


      if (item.type === 'ERC20') {
        if (!item.amount || (() => { try { return BigInt(item.amount) <= 0n; } catch { return true; } })()) {
          errors.push('ERC20 items must have a valid amount');
        }
      } else if (item.type === 'ERC721') {
        if (!item.tokenId) {
          errors.push('ERC721 items must have a token ID');
        }
      }


      if (this.config.supportedContracts.length > 0) {

        if (isNative) {
          if (this.config.wrappedNativeAddress && ethers.isAddress(this.config.wrappedNativeAddress)) {
            if (!this.config.supportedContracts.includes(this.config.wrappedNativeAddress.toLowerCase())) {
              warnings.push(`Wrapped native token ${this.config.wrappedNativeAddress} may not be supported`);
            }
          } else {

            warnings.push('Native token may not be supported by the smart contract. Consider configuring wrappedNativeAddress.');
          }
        } else if (resolvedContract && ethers.isAddress(resolvedContract)) {
          if (!this.config.supportedContracts.includes(resolvedContract.toLowerCase())) {
            warnings.push(`Contract ${resolvedContract} may not be supported`);
          }
        }
      }
    }


    if (giftPack.status !== 'DRAFT') {
      errors.push('Only draft gift packs can be locked on smart contracts');
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
    };
  }

  /**
   * Estimates gas cost for smart contract operations
   */
  estimateGasCost(giftPack: GiftPack): {
    estimatedGas: number;
    costInEth: string;
    costInUsd?: number;
  } {

    let estimatedGas = 100000;


    estimatedGas += giftPack.items.length * 50000;


    const nftCount = giftPack.items.filter(item => item.type === 'ERC721').length;
    estimatedGas += nftCount * 30000;


    const gasPrice = 20;
    const costInEth = ethers.formatEther(BigInt(estimatedGas) * BigInt(gasPrice * 1e9));

    return {
      estimatedGas,
      costInEth,

    };
  }


  /**
   * Checks if a smart contract gift can be claimed
   */
  canClaimGift(onChainStatus: SmartContractGiftStatus, claimerAddress: string): {
    canClaim: boolean;
    reason: string;
  } {
    if (onChainStatus.claimed) {
      return { canClaim: false, reason: 'Gift has already been claimed' };
    }

    if (onChainStatus.expiryTimestamp * 1000 < Date.now()) {
      return { canClaim: false, reason: 'Gift has expired' };
    }

  return { canClaim: true, reason: 'Gift is available for claiming' };

    return { canClaim: true, reason: 'Gift is available for claiming' };
  }

  /**
   * Formats smart contract gift status for display
   */
  formatGiftStatus(giftPack: GiftPack, onChainStatus?: SmartContractGiftStatus): {
    status: string;
    color: 'green' | 'yellow' | 'red' | 'blue' | 'gray';
    description: string;
  } {
    if (!onChainStatus) {
      switch (giftPack.status) {
        case 'DRAFT':
          return { status: 'Draft', color: 'gray', description: 'Gift is being prepared' };
        case 'LOCKED':
          return { status: 'Locked', color: 'blue', description: 'Gift is locked on blockchain' };
        case 'CLAIMED':
          return { status: 'Claimed', color: 'green', description: 'Gift has been claimed' };
        case 'REFUNDED':
          return { status: 'Refunded', color: 'red', description: 'Gift has been refunded' };
        default:
          return { status: 'Unknown', color: 'gray', description: 'Unknown status' };
      }
    }

    if (onChainStatus.claimed) {
      return { status: 'Claimed', color: 'green', description: 'Gift has been successfully claimed' };
    }

    if (onChainStatus.expiryTimestamp * 1000 < Date.now()) {
      return { status: 'Expired', color: 'red', description: 'Gift has expired and can be refunded' };
    }

    return { status: 'Available', color: 'blue', description: 'Gift is available for claiming' };
  }

  private hasHighValueItems(giftPack: GiftPack): boolean {


    return giftPack.items.some(item => {
      if (item.type === 'ERC20' && item.amount) {
        try {
          const amount = BigInt(item.amount);

          return amount > BigInt(1000 * 1e18);
        } catch {
          return false;
        }
      }

      return item.type === 'ERC721';
    });
  }

  private getExpiryDays(giftPack: GiftPack): number {
    const expiryTime = new Date(giftPack.expiry).getTime();
    const currentTime = Date.now();
    return Math.ceil((expiryTime - currentTime) / (1000 * 60 * 60 * 24));
  }
}


export const smartContractGiftUtils = new SmartContractGiftUtils();


export const shouldUseSmartContract = (giftPack: GiftPack) =>
  smartContractGiftUtils.shouldUseSmartContract(giftPack);

export const validateForSmartContract = (giftPack: GiftPack) =>
  smartContractGiftUtils.validateForSmartContract(giftPack);

export const canClaimGift = (onChainStatus: SmartContractGiftStatus, claimerAddress: string) =>
  smartContractGiftUtils.canClaimGift(onChainStatus, claimerAddress);

export const formatGiftStatus = (giftPack: GiftPack, onChainStatus?: SmartContractGiftStatus) =>
  smartContractGiftUtils.formatGiftStatus(giftPack, onChainStatus);
