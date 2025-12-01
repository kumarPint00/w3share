# Smart Contract-Backed Gift Handling Guide

This guide explains how the DogeGift application handles the condition where created gifts are backed up with smart contracts, providing enhanced security, automation, and trust for valuable or complex gifts.

## Overview

The DogeGift application supports two types of gifts:

1. **Traditional Gifts**: Simple gifts stored in the database with basic functionality
2. **Smart Contract-Backed Gifts**: Gifts secured and automated through blockchain smart contracts

## When to Use Smart Contract Backing

The application automatically determines when to recommend smart contract backing based on several criteria:

### Automatic Recommendations

The system analyzes gift packs and recommends smart contract backing when:

- **High-Value Items**: Gifts containing valuable assets (configurable threshold)
- **NFTs**: Any gift containing ERC721 tokens (NFTs) 
- **Multiple Items**: Complex gifts with multiple assets
- **Long Expiry**: Gifts with extended validity periods (>30 days)
- **Large Token Amounts**: ERC20 transfers above certain thresholds

### Required Smart Contract Backing

Smart contract backing is **required** for:

- Gifts containing NFTs (ERC721 tokens)
- High-value token transfers (above configured threshold)
- Gifts with specific compliance requirements

## Implementation Components

### 1. Enhanced API Service (`lib/api.ts`)

The API service has been enhanced with smart contract-specific methods:

```typescript
// Smart contract-specific gift creation
async createSmartContractGift(data: CreateGiftPackData): Promise<GiftPack>

// Lock gift pack on blockchain (code-only; no recipient address)
async lockGiftPack(id: string): Promise<LockGiftResponse>

// Validate gift pack for smart contract deployment
async validateGiftForLocking(id: string): Promise<GiftValidationResult>

// Get on-chain gift status
async getOnChainGiftStatus(giftId: number): Promise<SmartContractGiftStatus>

// Enhanced claiming for smart contract gifts
async claimSmartContractGift(giftId: number, claimer: string): Promise<{ taskId: string }>
```

### 2. Smart Contract Utilities (`lib/smartContractGiftUtils.ts`)

Utility functions for smart contract decision-making:

```typescript
// Determine if a gift should use smart contracts
shouldUseSmartContract(giftPack: GiftPack): {
  shouldUse: boolean;
  reason: string;
  isRequired: boolean;
}

// Validate gift pack for smart contract deployment
validateForSmartContract(giftPack: GiftPack): {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

// Estimate gas costs
estimateGasCost(giftPack: GiftPack): {
  estimatedGas: number;
  costInEth: string;
  costInUsd?: number;
}
```

### 3. Enhanced React Hooks (`hooks/useGiftPacks.ts`)

New hooks for smart contract functionality:

```typescript
// Create smart contract-backed gifts
useCreateSmartContractGift()
useFinalizeSmartContractGift()

// Validation and status checking
useValidateGiftForLocking(id?: string)
useGiftPackWithSmartContractStatus(id?: string)
useOnChainGiftStatus(giftId?: number)

// Enhanced user data with smart contract info
useUserGiftPacksWithSmartContractInfo(address?: string)

// Smart contract-aware claiming
useClaimSmartContractGift()
```

### 4. Components

#### EnhancedGiftCreator (`components/EnhancedGiftCreator.tsx`)
- Automatically determines when to use smart contracts
- Provides validation feedback
- Shows gas cost estimates
- Handles the complete flow from creation to deployment

#### SmartContractGiftHandler (`components/SmartContractGiftHandler.tsx`)
- Demonstrates smart contract gift handling
- Shows different views for creators vs recipients
- Handles claiming flow for smart contract gifts

## Gift Creation Flow

### Traditional Flow (Non-Smart Contract)

1. **Create Draft**: `POST /giftpacks`
2. **Add Items**: `POST /giftpacks/:id/items`
3. **Update Metadata**: `PATCH /giftpacks/:id`
4. **Share**: Direct database-based sharing

### Smart Contract Flow (Code-only)

1. **Create Draft**: `POST /giftpacks` (marked for smart contract; include a unique giftCode)
2. **Add Items**: `POST /giftpacks/:id/items`
3. **Validation**: `GET /giftpacks/:id/validate`
4. **Lock on Blockchain**: `POST /giftpacks/:id/lock` (recipient is zero-address on-chain; protected by gift code)
5. **Monitor Status**: `GET /giftpacks/on-chain/:giftId/status`

## Backend Smart Contract Integration

### Service Layer (`giftpacks.service.ts`)

The backend service handles smart contract interactions:

```typescript
// Validate gift pack for blockchain deployment
async validateGiftForLocking(id: string): Promise<GiftValidationResult>

// Deploy gift pack to smart contract (code-only)
async lockGiftPack(id: string): Promise<LockGiftResponse>

// Query on-chain gift status
async getGiftStatus(giftId: number): Promise<SmartContractGiftStatus>
```

### Smart Contract Configuration

Environment variables required:

```env
SEPOLIA_BASE_RPC=<blockchain_rpc_url>
DEPLOYER_PRIVATE_KEY=<deployer_wallet_private_key>
GIFT_ESCROW_ADDRESS=<deployed_contract_address>
GELATO_API_KEY=<gelato_relay_api_key>
```

## Claiming Smart Contract Gifts

### Smart Contract Claims (Code-only)
- Blockchain transaction required
- Gasless claiming via Gelato relay
- Automatic asset transfer on success
- Claim by giftId or giftCode; if gift is code-protected, anyone with the code can claim

### Claim Flow

1. **Validate Claim**: Check on-chain gift status
2. **Submit Claim**: `POST /claim` with either gift ID or gift code and claimer address
3. **Relay Transaction**: Gelato processes the blockchain transaction
4. **Monitor Status**: `GET /claim/status/:giftRef` (giftId or giftCode)
5. **Update Database**: Webhook updates gift status on completion

## Security Features

### Smart Contract Benefits

1. **Immutable Storage**: Gifts cannot be tampered with once locked
2. **Automated Execution**: Claims are processed automatically
3. **Expiry Handling**: Automatic refunds after expiry
4. **Atomic Operations**: All-or-nothing asset transfers
5. **Transparency**: All transactions are publicly verifiable

### Validation Layers

1. **Frontend Validation**: Real-time feedback and error prevention
2. **Backend Validation**: Server-side security checks
3. **Smart Contract Validation**: On-chain enforcement of rules
4. **Code Protection**: Gifts may be protected by a secret code instead of a fixed recipient

## Gas Cost Management

### Cost Estimation
The system provides gas cost estimates before deployment:

```typescript
const estimate = smartContractUtils.estimateGasCost(giftPack);
console.log(`Estimated gas: ${estimate.estimatedGas}`);
console.log(`Estimated cost: ${estimate.costInEth} ETH`);
```

### Gas Optimization
- Batch multiple items in single transaction
- Use efficient data structures
- Minimize external contract calls
- Implement gas limit safeguards

## Error Handling

### Common Errors and Solutions

1. **Insufficient Gas**
   - Solution: Increase gas limit or reduce gift complexity

2. **Expired Gift**
   - Solution: Check expiry before attempting operations

3. **Insufficient Token Balance**
   - Solution: Verify token approvals and balances

4. **Contract Not Deployed**
   - Solution: Verify contract address and network

5. **Invalid Gift Code**
   - Solution: Ensure the correct gift code is used for claims

### Error Recovery

```typescript
try {
  await apiService.finalizeSmartContractGift(id);
} catch (error) {
  if (error.message.includes('insufficient gas')) {
    // Handle gas issues
  } else if (error.message.includes('Invalid gift code')) {
    // Handle code validation
  } else {
    // Generic error handling
  }
}
```

## Monitoring and Analytics

### Gift Pack Status Tracking

The system tracks comprehensive status information:

```typescript
interface SmartContractGiftStatus {
  giftId: number;
  tokenAddress: string;
  tokenId: string;
  amount: string;
  sender: string;
  recipient: string; // May be zero-address for code-only gifts
  expiryTimestamp: number;
  claimed: boolean;
}
```

### Event Monitoring

Smart contracts emit events that are tracked:

- `GiftSent`: When a gift is locked on-chain
- `GiftClaimed` / `GiftClaimedWithCode`: When a gift is claimed
- `GiftRefunded` (Expired): When an expired gift is refunded

## Best Practices

### For Gift Creators

1. **Validate Before Locking**: Always validate gift packs before blockchain deployment
2. **Check Gas Costs**: Review estimated costs before proceeding
3. **Share Gift Code Securely**: Share the secret code via a trusted channel
4. **Set Reasonable Expiry**: Choose appropriate expiry periods
5. **Monitor Status**: Track gift status after deployment

### For Recipients

1. **Verify Gift Details**: Check gift contents before claiming
2. **Keep the Gift Code Safe**: Treat the code like a password
3. **Claim Promptly**: Don't wait until near expiry
4. **Monitor Transaction**: Track claim transaction status

### For Developers

1. **Handle Async Operations**: Smart contract operations are asynchronous
2. **Implement Proper Error Handling**: Account for blockchain-specific errors
3. **Cache Blockchain Data**: Reduce RPC calls with appropriate caching
4. **Test on Testnets**: Always test with Sepolia before mainnet deployment
5. **Monitor Gas Prices**: Implement gas price monitoring and optimization

## Future Enhancements

### Planned Features

1. **Multi-Chain Support**: Deploy gifts across different blockchains
2. **Batch Operations**: Create multiple gifts in single transaction
3. **Scheduled Gifts**: Time-locked gifts with future unlock dates
4. **Conditional Claims**: Claims based on external conditions
5. **Cross-Chain Claims**: Claim gifts on different chains than creation

### Scalability Improvements

1. **Layer 2 Integration**: Deploy on Layer 2 solutions for cheaper transactions
2. **State Channels**: Off-chain gift preparation with on-chain settlement
3. **IPFS Integration**: Store large gift metadata on IPFS
4. **Merkle Trees**: Batch multiple gifts efficiently

## Troubleshooting

### Common Issues

1. **Transaction Pending**: Wait for blockchain confirmation or increase gas price
2. **Gift Not Found**: Verify gift ID and blockchain network
3. **Claim Failed**: Check gift code and gift expiry
4. **High Gas Costs**: Consider simplifying gift or waiting for lower gas prices

### Support Resources

- Check transaction status on blockchain explorer
- Verify contract deployment and ABI
- Review event logs for detailed error information
- Contact support with transaction hashes for investigation

## Conclusion

Smart contract-backed gifts provide enhanced security and automation for valuable digital assets. With code-only claim/lock, creators do not need a recipient address; instead, gifts can be claimed securely by anyone who has the secret code. The application provides validation, error handling, and monitoring for a smooth experience.
