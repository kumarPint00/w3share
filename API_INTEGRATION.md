# API Integration Summary

This document outlines the integrated APIs between the DogeGift frontend and backend.

## Authentication APIs

### POST /auth/wallet-nonce
- **Purpose**: Request a SIWE nonce for wallet authentication
- **Frontend**: `apiService.requestWalletNonce(address: string)`
- **Backend**: `AuthController.walletNonce()`
- **Body**: `{ address: string }`
- **Response**: `{ nonce: string }`

### POST /auth/siwe
- **Purpose**: Exchange SIWE signature for JWT token
- **Frontend**: `apiService.exchangeSiweSignature(message: string, signature: string)`
- **Backend**: `AuthController.siweLogin()`
- **Body**: `{ message: string, signature: string }`
- **Response**: `{ accessToken: string }`

### GET /auth/session
- **Purpose**: Get current wallet session
- **Frontend**: `apiService.getCurrentSession()`
- **Backend**: `AuthController.session()`
- **Response**: `{ address: string, loginAt: string }`

## Assets APIs

### GET /assets/erc20?address={address}
- **Purpose**: Get ERC-20 token balances for a wallet
- **Frontend**: `apiService.getERC20Balances(address: string)`
- **Backend**: `AssetsController.erc20()`
- **Response**: Array of token balances

### GET /assets/nft?address={address}&pageKey={pageKey?}
- **Purpose**: Get NFTs owned by a wallet
- **Frontend**: `apiService.getNFTsOwned(address: string, pageKey?: string)`
- **Backend**: `AssetsController.nft()`
- **Response**: `{ nfts: NFTAsset[], pageKey?: string }`

### GET /assets/tokens/allow-list
- **Purpose**: Get supported token allow list
- **Frontend**: `apiService.getSupportedTokens()`
- **Backend**: `AssetsController.allowList()`
- **Response**: Array of allowed tokens

## Gift Packs APIs

### POST /giftpacks
- **Purpose**: Create a new draft gift pack
- **Frontend**: `apiService.createGiftPack(data: CreateGiftPackData)`
- **Backend**: `GiftpacksController.create()`
- **Body**: `{ senderAddress: string, message?: string, expiry?: string, giftCode?: string }`

### GET /giftpacks/{id}
- **Purpose**: Get a gift pack by ID
- **Frontend**: `apiService.getGiftPack(id: string)`
- **Backend**: `GiftpacksController.get()`

### PATCH /giftpacks/{id}
- **Purpose**: Update draft gift pack metadata
- **Frontend**: `apiService.updateGiftPack(id: string, data: UpdateGiftPackData)`
- **Backend**: `GiftpacksController.update()`

### DELETE /giftpacks/{id}
- **Purpose**: Delete a draft gift pack
- **Frontend**: `apiService.deleteGiftPack(id: string)`
- **Backend**: `GiftpacksController.delete()`

### POST /giftpacks/{id}/items
- **Purpose**: Add item to gift pack
- **Frontend**: `apiService.addItemToGiftPack(id: string, item: AddItemToGiftPackData)`
- **Backend**: `GiftpacksController.addItem()`
- **Body**: `{ type: 'ERC20' | 'ERC721', contract: string, tokenId?: string, amount?: string }`

### DELETE /giftpacks/{id}/items/{itemId}
- **Purpose**: Remove item from gift pack
- **Frontend**: `apiService.removeItemFromGiftPack(id: string, itemId: string)`
- **Backend**: `GiftpacksController.removeItem()`

### GET /giftpacks/user/{address}
- **Purpose**: Get gift packs created by a user
- **Frontend**: `apiService.getUserGiftPacks(address: string)`
- **Backend**: `GiftpacksController.getUserGiftPacks()`

### GET /giftpacks/claimed/{address}
- **Purpose**: Get gift packs claimed by a user
- **Frontend**: `apiService.getUserClaimedGifts(address: string)`
- **Backend**: `GiftpacksController.getUserClaimedGifts()`

## Claim APIs

### POST /claim
- **Purpose**: Submit a gasless claim for a gift
- **Frontend**: `apiService.submitClaim(claimData: ClaimRequest)`
- **Backend**: `ClaimController.submit()`
- **Body**: `{ giftId?: number, giftCode?: string, claimer: string }`
- **Response**: `{ taskId: string }`

### GET /claim/status/{giftRef}
- **Purpose**: Check claim status for a gift (by on-chain ID or gift code)
- **Frontend**: `apiService.getClaimStatus(giftRef: number | string)`
- **Backend**: `ClaimController.status()`
- **Response**: `{ status: 'PENDING' | 'CLAIMED' | 'FAILED', taskId?: string }`

## Health Check

### GET /healthz
- **Purpose**: Health check endpoint
- **Backend**: `HealthController.ping()`
- **Response**: `{ status: 'ok' }`

## Frontend Hooks

### Authentication
- `useWalletAuth()` - SIWE authentication
- `useWalletNonce()` - Request nonce
- `useSiweAuth()` - Exchange signature for token
- `useAuthSession()` - Get current session
- `useLogout()` - Clear authentication

### Assets
- `useERC20Balances(address)` - Get token balances
- `useUserNFTs(address)` - Get user NFTs
- `useSupportedTokens()` - Get allowed tokens

### Gift Packs
- `useCreateGiftPack()` - Create gift pack
- `useGiftPack(id)` - Get gift pack details
- `useUpdateGiftPack()` - Update gift pack
- `useDeleteGiftPack()` - Delete gift pack
- `useAddItemToGiftPack()` - Add item to pack
- `useRemoveItemFromGiftPack()` - Remove item from pack
- `useUserGiftPacks(address)` - Get user's created packs
- `useUserClaimedGifts(address)` - Get user's claimed packs

### Claims
- `useSubmitClaim()` - Submit claim (by giftId or giftCode)
- `useClaimStatus(giftRef)` - Check claim status

## Data Types

### Core Interfaces
- `GiftPack` - Gift pack data structure
- `GiftPackItem` - Individual items in gift pack
- `ERC20Balance` - Token balance information
- `NFTAsset` - NFT metadata
- `ClaimRequest` - Claim submission data
- `ClaimStatus` - Claim status information

### API Request/Response Types
- `WalletNonceResponse` - Nonce response
- `SiweAuthResponse` - Authentication response
- `WalletSession` - Session information
- `CreateGiftPackData` - Gift pack creation data
- `UpdateGiftPackData` - Gift pack update data
- `AddItemToGiftPackData` - Item addition data

## Environment Configuration

### Frontend
- `NEXT_PUBLIC_API_URL` - Backend API base URL (default: http://localhost:3001)

### Backend
- `DATABASE_URL` - PostgreSQL connection string
- `JWT_SECRET` - JWT signing secret
- Application runs on port 3000
- Swagger docs available at `/docs`

## Status

✅ **Implemented and Integrated:**
- Authentication flow (SIWE)
- Asset balance queries
- Gift pack CRUD operations
- Claim submission and status (by ID or code)

⚠️ **Placeholder Implementations:**
- Token price queries (frontend expects but backend doesn't provide)
- Token validation (frontend expects but backend doesn't provide)
- Some wallet verification features

🔄 **Areas for Enhancement:**
- Real-time claim status updates
- Enhanced error handling
- Pagination for large datasets
- Caching strategies
