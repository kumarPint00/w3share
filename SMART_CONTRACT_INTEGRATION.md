# Smart Contract Integration for Gift Creation

This document explains how the DogeGift application now integrates with smart contracts to back up created gifts on the blockchain.

## Overview

The gift creation process now has two stages:
1. **Draft Stage**: Gifts are stored in the database and can be modified
2. **Locked Stage**: Gifts are deployed to the smart contract and become immutable

## Architecture

### Backend Integration

**Files Modified:**
- `src/giftpacks/giftpacks.service.ts` - Added smart contract integration
- `src/giftpacks/giftpacks.controller.ts` - Added lock endpoint

**Key Features:**
- Smart contract connection using ethers.js
- Automatic gift deployment to blockchain
- On-chain status checking
- Event parsing for gift IDs

### Frontend Integration

**Files Modified:**
- `lib/api.ts` - Added lock and status APIs
- `hooks/useGiftPacks.ts` - Added lock and status hooks
- `lib/createDraftPack.ts` - Updated flow

**New Components:**
- `SmartContractGiftCreator.tsx` - Complete gift creation UI

## Gift Creation Flow

### Step 1: Create Draft
```typescript
// Create a draft gift pack (stored in database only)
const giftPack = await apiService.createGiftPack({
  senderAddress: walletAddress,
  message: "Happy Birthday!",
  expiry: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
  giftCode: 'MYCODE123' // for code-only claim flow
});
```

### Step 2: Add Items
```typescript
// Add ERC20 token
await apiService.addItemToGiftPack(giftPackId, {
  type: 'ERC20',
  contract: '0x...', // Token contract address
  amount: '1000000'  // Amount in wei
});

// Add NFT
await apiService.addItemToGiftPack(giftPackId, {
  type: 'ERC721',
  contract: '0x...', // NFT contract address
  tokenId: '123'     // Token ID
});
```

### Step 3: Lock on Blockchain
```typescript
// Deploy to smart contract and lock the gift (code-only; no recipient address)
const result = await apiService.lockGiftPack(giftPackId);
// Returns: { giftId: number, transactionHash: string }
```

### Step 4: Check Status
```typescript
// Check on-chain status
const status = await apiService.getOnChainGiftStatus(giftId);
// Returns gift details from blockchain
```

## Smart Contract Integration

### Contract Methods Used

**lockGiftV2()**: Creates a new gift on the blockchain
```solidity
function lockGiftV2(
    address recipient,
    uint8 assetType,
    address tokenAddress,
    uint256 tokenId,
    uint256 amount,
    uint256 expiryTimestamp,
    string memory message,
    bytes32 codeHash
) external returns (uint256 giftId)
```

**gifts()**: Gets gift details from blockchain
```solidity
function gifts(uint256 giftId) external view returns (Gift memory)
```

### Event Handling

The service listens for `GiftLocked` events to extract the on-chain gift ID:
```solidity
event GiftLocked(uint256 indexed giftId, address indexed sender, address indexed recipient, uint256 at, address tokenAddress, uint256 tokenId, uint256 amount, uint256 expiryTimestamp);
```

## Environment Configuration

### Backend Environment Variables
```env
# Blockchain connection
SEPOLIA_BASE_RPC=https://sepolia.base.org
DEPLOYER_PRIVATE_KEY=0x...
GIFT_ESCROW_ADDRESS=0x...

# Gelato for gasless transactions
GELATO_API_KEY=...
```

### Frontend Environment Variables
```env
NEXT_PUBLIC_API_URL=http://localhost:3000
```

## API Endpoints

### Endpoints

**POST /giftpacks/:id/lock**
- Locks a gift pack on the blockchain (code-only)
- Body: `{}`
- Response: `{ giftId: number, transactionHash: string }`

**GET /giftpacks/status/:giftId**
- Gets on-chain status of a gift
- Response: Gift details from blockchain

## Usage Examples

### Basic Usage with Hooks
```tsx
import { useLockGiftPack, useOnChainGiftStatus } from '@/hooks/useGiftPacks';

function GiftCreator() {
  const lockGiftPack = useLockGiftPack();
  const { data: status } = useOnChainGiftStatus(giftId);

  const handleLock = async () => {
    const result = await lockGiftPack.mutateAsync({
      id: giftPackId,
    });
    console.log('Locked with gift ID:', result.giftId);
  };

  return (
    <div>
      <button onClick={handleLock}>Lock Gift on Blockchain</button>
      {status && <div>Status: {status.claimed ? 'Claimed' : 'Available'}</div>}
    </div>
  );
}
```

### Complete Integration Component
```tsx
import SmartContractGiftCreator from '@/components/SmartContractGiftCreator';

function App() {
  return (
    <SmartContractGiftCreator walletAddress="0x..." />
  );
}
```

## Database Schema Updates

The existing schema already supports smart contract integration:
- `giftIdOnChain` - Links database record to blockchain gift
- `status` - Tracks gift state (DRAFT → LOCKED → CLAIMED)
- `recipientHash` - Optional historical field; not required for code-only flow

## Security Considerations

1. **Private Key Management**: Backend uses environment variables for private keys
2. **Address Validation**: All addresses are validated using ethers.js
3. **Transaction Verification**: Gifts are only marked as locked after blockchain confirmation
4. **Error Handling**: Comprehensive error handling for blockchain failures

## Error Handling

### Common Errors and Solutions

**"Missing GIFT_ESCROW_ADDRESS"**
- Ensure contract address is set in environment variables

**"Failed to lock gift pack on blockchain"**
- Check if wallet has sufficient balance for gas
- Verify contract address is correct
- Ensure RPC endpoint is accessible

**"Gift not lockable"**
- Gift must be in DRAFT status
- Gift must have at least one item
- Gift must have a non-empty giftCode for code-only claim

## Testing

### Manual Testing Steps

1. Create a draft gift pack
2. Add ERC20 tokens or NFTs
3. Lock the gift pack (no recipient address)
4. Verify on-chain status matches database
5. Test claim functionality using giftId or giftCode

### Integration Testing
```bash
# Test the API integration
npm run test:integration

# Test smart contract deployment
npm run test:contracts
```

## Monitoring

### Blockchain Events
Monitor these events for gift lifecycle:
- `GiftLocked` - Gift created
- `GiftClaimed` - Gift claimed
- `GiftRefunded` - Gift expired and refunded

### Database Sync
Ensure database status matches blockchain state:
- Regular status checks
- Event-based updates
- Manual reconciliation tools

## Deployment

### Contract Deployment
1. Deploy `GiftEscrow.sol` to target network
2. Update `GIFT_ESCROW_ADDRESS` in environment
3. Fund deployer wallet for gas fees

### Application Deployment
1. Set all required environment variables
2. Run database migrations
3. Deploy backend and frontend
4. Test end-to-end flow

## Future Enhancements

1. **Multi-Asset Gifts**: Support multiple tokens in one gift
2. **Batch Operations**: Lock multiple gifts in one transaction
3. **Cross-Chain Support**: Deploy to multiple networks
4. **Advanced Scheduling**: Time-locked gifts
5. **Gasless Claims**: Implement gasless claiming for recipients
