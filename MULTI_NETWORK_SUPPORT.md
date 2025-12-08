# Multi-Network Token Support

## Overview
The DogeGift platform now supports tokens and NFTs from **13+ blockchain networks**, including both mainnet and testnet chains.

## Supported Networks

### Ethereum Layer 1
- **Ethereum Mainnet** (chainId: 1) - Production network
- **Ethereum Sepolia** (chainId: 11155111) - Primary testnet
- **Ethereum Goerli** (chainId: 5) - Deprecated testnet (legacy support)

### Layer 2 & Alternative L1s

#### Polygon
- **Polygon Mainnet** (chainId: 137) - Production
- **Polygon Mumbai** (chainId: 80001) - Testnet

#### Arbitrum
- **Arbitrum Mainnet** (chainId: 42161) - Production
- **Arbitrum Sepolia** (chainId: 421614) - Testnet

#### Optimism
- **Optimism Mainnet** (chainId: 10) - Production
- **Optimism Sepolia** (chainId: 11155420) - Testnet

#### Base
- **Base Mainnet** (chainId: 8453) - Production
- **Base Sepolia** (chainId: 84532) - Testnet

#### Avalanche
- **Avalanche Mainnet** (chainId: 43114) - Production
- **Avalanche Fuji** (chainId: 43113) - Testnet

## Architecture

### Backend API Endpoints

#### Get Supported Networks
```bash
GET /assets/supported-networks
```
Response:
```json
{
  "networks": [
    { "chainId": 1, "name": "Ethereum Mainnet", "type": "mainnet" },
    { "chainId": 11155111, "name": "Ethereum Sepolia", "type": "testnet" },
    // ... additional networks
  ]
}
```

#### Get ERC-20 Token Balances
```bash
GET /assets/erc20?address=0x...&chainId=1
```

#### Get NFTs
```bash
GET /assets/nft?address=0x...&chainId=137
```

### Implementation Details

#### Backend (`src/assets/assets.service.ts`)
- **getAlchemyNetwork(chainId)**: Maps chain IDs to Alchemy Network enum
  - Supports all major networks with fallback to Sepolia
  - Gracefully logs warnings for unknown networks
  
- **getAlchemy(chainId)**: Factory method to get/create Alchemy instance
  - Caches instances per network for efficiency
  - Uses `ALCHEMY_BASE_KEY` environment variable

- **getSupportedNetworks()**: Returns list of all supported networks

#### Frontend (`lib/hooks/useWalletToken.ts`)
- Detects user's connected wallet's network via `provider.getNetwork()`
- Passes `chainId` to all backend API calls
- Handles network mismatches gracefully

#### Smart Contract Considerations
- **GiftEscrow.sol** currently deployed on **Sepolia testnet** only
- Contract needs to be deployed to production networks:
  - Ethereum Mainnet (priority)
  - Polygon Mainnet
  - Arbitrum Mainnet
  - Optimism Mainnet
  - Base Mainnet

## Usage Flow

### 1. User Connects Wallet
```typescript
const provider = await detectEthereumProvider();
const network = await provider.getNetwork();
const chainId = network.chainId; // Auto-detected
```

### 2. Frontend Fetches User Assets
```typescript
// Automatically includes chainId
GET /assets/erc20?address=0x...&chainId=137
```

### 3. Backend Returns Network-Specific Assets
- Uses Alchemy SDK to fetch from specified network
- Returns tokens/NFTs with metadata
- All values are correctly scaled by decimals

### 4. User Creates Gift Pack
- Selects assets from any supported network
- Frontend validates against smart contract on that network
- Gift locked on-chain with `lockGiftV2()`

## Environment Configuration

### Backend
```bash
# .env
ALCHEMY_BASE_KEY=your_alchemy_api_key  # Works for all networks
```

### Frontend
```bash
# .env.local
NEXT_PUBLIC_GIFT_ESCROW_ADDRESS=0x3585CBBAaeaBedfdF5ce89b73E7F6e22A571A483  # Sepolia only
NEXT_PUBLIC_API_URL=http://localhost:4000
```

## Testing Multi-Network Support

### Test Token Fetching
```bash
# Ethereum Mainnet USDC
curl http://localhost:4000/assets/erc20?address=0x1234...&chainId=1

# Polygon Mumbai Test Token
curl http://localhost:4000/assets/erc20?address=0x1234...&chainId=80001

# Arbitrum Mainnet Token
curl http://localhost:4000/assets/erc20?address=0x1234...&chainId=42161
```

### Get Supported Networks
```bash
curl http://localhost:4000/assets/supported-networks
```

## Deployment Strategy

### Phase 1 (Current)
✅ Backend supports all 13+ networks for token/NFT fetching
✅ Frontend auto-detects user's network
✅ API endpoints accept chainId parameter

### Phase 2 (Recommended Next)
- Deploy GiftEscrow to Ethereum Mainnet
- Deploy to Polygon Mainnet (fastest/cheapest for testing)
- Update `NEXT_PUBLIC_GIFT_ESCROW_ADDRESS` for multi-network (different address per chain)

### Phase 3
- Deploy to all remaining networks
- Update smart contract to support cross-chain gifting (optional)
- Add network-aware contract deployment in frontend

## Limitations & Future Enhancements

### Current Limitations
1. Smart contract deployed on Sepolia only
2. Token transfers only work on networks with deployed contract
3. Single contract address in environment variable

### Future Enhancements
1. Multi-contract deployment per network
2. Dynamic contract address based on detected chainId
3. Cross-chain gifting via bridges (LayerZero, Stargate, etc.)
4. Wrapped token support (WETH on different networks)
5. Network switching prompts in UI
6. One-click network switching for MetaMask

## Error Handling

### Unknown Network
```
"Unknown chain ID 999, defaulting to Sepolia"
```
- Backend logs warning
- Defaults to Sepolia for safety
- Frontend displays error to user

### Missing Alchemy Key
```
"Alchemy API key not configured"
```
- Token fetching returns empty array
- Gift creation still works (backend validation)

### Contract Not Deployed
- Frontend shows "Network not supported for gifting"
- But token fetching still works for all networks

## Common Integration Tasks

### Adding a New Network
1. Add case to `getAlchemyNetwork()` switch statement
2. Add to `getSupportedNetworks()` array
3. Deploy smart contract to that network
4. Update frontend environment config
5. Test with real wallet on that network

### Switching Networks at Runtime
```typescript
// User switches network in MetaMask
// Frontend automatically detects and updates
const newNetwork = await provider.getNetwork();
// useWalletToken hook re-fetches with new chainId
```

### Deploying Contract to New Network
```bash
cd backend/blockchain
npx hardhat run scripts/deploy.ts --network polygon  # Requires config
```

## API Documentation

All endpoints now accept optional `chainId` query parameter:

| Endpoint | Default ChainId | Supported Values |
|----------|-----------------|------------------|
| `/assets/erc20` | 11155111 | 1, 5, 10, 11155111, 11155420, 42161, 421614, 8453, 84532, 137, 80001, 43114, 43113 |
| `/assets/nft` | 11155111 | Same as above |

## Questions & Support

For multi-network issues:
1. Check `ALCHEMY_BASE_KEY` is set in backend `.env`
2. Verify wallet is connected to supported network
3. Confirm user has assets on that network
4. Check backend logs for "Unknown chain ID" warnings
5. Test with `/assets/supported-networks` endpoint first
