# Copilot Instructions for DogeGift

## Project Overview
DogeGift is a decentralized gifting platform for ERC20 tokens and NFTs. The architecture uses a **hybrid approach**: PostgreSQL for UX optimization + blockchain smart contracts for asset security.

**Core stack:**
- Frontend: Next.js 14 (App Router), Material-UI v5, TanStack Query, Ethers.js
- Backend: NestJS, Prisma ORM, SIWE authentication
- Smart Contracts: Solidity (GiftEscrow), deployed on Sepolia testnet
- Database: PostgreSQL with Prisma migrations

## Architecture & Data Flow

### Gift Creation Flow
1. User selects assets → Frontend calls `POST /giftpacks/draft` (NestJS)
2. Backend creates `GiftPack` record (status: DRAFT) in PostgreSQL
3. User approves tokens → Frontend calls contract `lockGiftV2()` directly
4. Contract escrows assets, returns `giftIdOnChain`
5. Backend updates DB: `DRAFT` → `LOCKED`, stores `giftIdOnChain` + `giftCode` (secret hash)

### Claiming Flow (Gasless via Gelato)
1. Recipient enters code → Frontend calls `POST /claim/initiate` with code
2. Backend verifies code, prepares relay transaction via `GelatoRelay.sponsoredCallERC2771()`
3. Gelato relays `claimGiftWithCode()` to contract (recipient pays no gas)
4. Backend receives Gelato webhook → Updates DB: `LOCKED` → `CLAIMED`

**Key principle:** Backend orchestrates workflow, but **assets never touch backend** — all transfers happen on-chain.

## Key Directories

```
frontend/
├── app/                    # Next.js App Router pages
│   ├── gift/               # Gift creation flow (/gift/create, /gift/claim)
│   ├── api/                # Next.js API routes (minimal, mostly proxy)
├── components/             # UI components (SmartContractGiftCreator, ClaimGiftForm)
├── context/                # React Context (WalletContext, EscrowContext)
├── hooks/                  # Custom hooks (useGiftPacks, useClaim, useAssets)
└── lib/                    # Web3 utilities, theme, API client

backend/
├── src/
│   ├── auth/               # SIWE authentication (WalletNonce model)
│   ├── giftpacks/          # GiftPack CRUD, contract interaction
│   ├── claim/              # Gelato relay integration
│   ├── assets/             # Alchemy SDK for token balances
│   └── config/             # Environment config
├── prisma/                 # DB schema + migrations
└── blockchain/             # Hardhat environment (contracts/, test/, scripts/)
    └── contracts/          # GiftEscrow.sol, GiftEscrowPausable.sol, GiftEscrowWithFees.sol
```

## Developer Workflows

### Setup & Development
```bash
# Full setup (installs frontend + backend deps)
npm run install:all

# Environment files
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env

# Start both servers (frontend :3000, backend :3001 typical)
npm run dev

# Backend only (watch mode, auto-generates Prisma client)
cd backend && npm run start:dev

# Frontend only
cd frontend && npm run dev
```

### Database Migrations (Prisma)
```bash
cd backend
npx prisma migrate dev --name description_of_changes
npx prisma generate  # Regenerates Prisma client after schema changes
npx prisma studio    # GUI to inspect DB
```

### Smart Contract Development (Hardhat)
```bash
cd backend/blockchain
npx hardhat compile                       # Compile contracts
npx hardhat test                          # Run tests
npx hardhat run scripts/deploy.ts --network sepolia  # Deploy
```

**Note:** Contract ABI is exported to `backend/contracts/abi/` for backend imports.

### Code Cleanup Utility
```bash
# Removes // comments from codebase (destructive, commit first!)
node scripts/strip_line_comments.js /home/ravi/dogeFull
```

## Project-Specific Patterns

### Authentication: SIWE (Sign-In with Ethereum)
- No passwords, no email. Users sign EIP-4361 messages with their wallet.
- Flow: `POST /auth/wallet-nonce` → frontend signs message → `POST /auth/siwe` → JWT token
- `WalletNonce` model stores one-time nonces (10-min expiry)
- See `backend/src/auth/auth.service.ts` for signature verification

### Gift Codes: Hashed Secrets
- Gifts are **not** sent to specific addresses. Instead, they're protected by a secret code.
- Backend hashes the code (`keccak256`) before passing to contract's `lockGiftV2()`
- Claiming requires the plaintext code; contract verifies the hash
- This enables "anyone with the code can claim" semantics

### Gasless Claims via Gelato Relay
- Gelato's `GelatoRelay` SDK sponsors transaction fees for claimers
- Backend constructs the relay request in `claim.service.ts`: `sponsoredCallERC2771()`
- Gelato webhook (`/webhooks/gelato`) updates `ClaimTask` status in DB
- **Mock mode:** If `GELATO_API_KEY` is missing, backend simulates claims (dev only)

### Database Schema (Prisma)
- **GiftPack**: Draft gifts with `status` enum (DRAFT, LOCKED, CLAIMED, REFUNDED)
- **GiftItem**: Child assets (ERC20 or ERC721) linked to a GiftPack
- **ClaimTask**: Tracks Gelato relay tasks (`taskId`, `status`)
- **WalletNonce**: One-time SIWE nonces

### Frontend State Management
- **TanStack Query (React Query):** All async data fetching (see `hooks/useGiftPacks.ts`, `hooks/useClaim.ts`)
  - Automatic caching, refetching, optimistic updates
  - Query keys: `['giftPacks', id]`, `['assets', address]`
- **React Context:** Global state for wallet (`WalletContext`) and escrow contract instance (`EscrowContext`)
- **Material-UI:** ThemeProvider wraps app, custom theme in `lib/theme.ts`

### Contract Interaction Patterns
- **Backend:** Uses ethers.js `Contract` with signer for write operations (e.g., `lockGiftV2()`)
- **Frontend:** Uses ethers.js `BrowserProvider` + MetaMask signer for user-initiated transactions
- **Contract address:** Loaded from `GIFT_ESCROW_ADDRESS` env var
- **ABI:** Imported from `backend/contracts/abi/GiftEscrow.json`

### Multi-Contract Variants
The project has 3 GiftEscrow variants in `blockchain/contracts/`:
- `GiftEscrow.sol`: Base contract
- `GiftEscrowPausable.sol`: Admin pause functionality
- `GiftEscrowWithFees.sol`: Platform fee mechanism (see `FEE_SYSTEM_README.md`)

**Current deployment:** Check `.env` for which contract address is active.

## Integration Points

### Blockchain (Ethers.js + Sepolia)
- **RPC:** `SEPOLIA_BASE_RPC` env var (Infura or Alchemy)
- **Deployer wallet:** `DEPLOYER_PRIVATE_KEY` for backend contract interactions
- **Chain ID:** 11155111 (Sepolia testnet)

### Token Balances (Alchemy SDK)
- `AssetsService` uses `alchemy-sdk` for `getTokenBalances()` and `getTokenMetadata()`
- Endpoint: `GET /assets/erc20?address=0x...`
- Handles pagination with `pageKey` parameter

### Wallet Integration (MetaMask)
- Frontend uses `@metamask/detect-provider` to inject provider
- `WalletContext` manages connection state, account switching, network changes
- `useAuth()` hook triggers SIWE flow on wallet connect

### Docker Deployment
- `docker-compose.yml`: Main stack (frontend, backend, PostgreSQL)
- `docker-compose.admin.yml`: Admin service for contract management
- `contract-admin-service/` and `contract-admin-ui/`: Separate admin dashboard

## Code Conventions

### NestJS Module Structure
- Each feature has a module folder: `auth/`, `giftpacks/`, `claim/`, `assets/`
- Standard files: `*.module.ts`, `*.service.ts`, `*.controller.ts`, `dto/`
- DTOs use `class-validator` decorators for validation

### Frontend Component Organization
- Page components in `app/[route]/page.tsx` (Next.js convention)
- Reusable components in `components/` (UI primitives in `components/ui/`)
- Complex forms: `SmartContractGiftCreator`, `ClaimGiftForm`

### Error Handling
- Backend: Throw NestJS exceptions (`UnauthorizedException`, `BadRequestException`)
- Frontend: TanStack Query captures errors; display via `useNotifications()` hook

### TypeScript Conventions
- Strict mode enabled in both `tsconfig.json` files
- Shared types: Frontend imports from backend when possible (API DTOs)
- Contract types: Generated from ABIs using `typechain` (if configured)

## Testing

### Smart Contracts
```bash
cd backend/blockchain
npx hardhat test                   # All tests
npx hardhat test test/GiftEscrow.test.js  # Specific file
```
Uses Hardhat + Chai matchers (`@nomicfoundation/hardhat-chai-matchers`)

### Backend (Jest)
```bash
cd backend
npm run test        # Unit tests
npm run test:e2e    # E2E tests (if configured)
npm run test:cov    # Coverage report
```

### Frontend
(Testing framework not fully configured in this codebase — add Vitest/Playwright if needed)

## Common Tasks

### Adding a New Gift Asset Type
1. Update `AssetType` enum in `prisma/schema.prisma`
2. Run `npx prisma migrate dev --name add_asset_type`
3. Update contract logic in `GiftEscrow.sol` (add new case)
4. Redeploy contract, update `GIFT_ESCROW_ADDRESS`
5. Update frontend `CreateGiftpackDto` validation

### Changing Contract Escrow Logic
1. Edit `backend/blockchain/contracts/GiftEscrow.sol`
2. Write/update tests in `backend/blockchain/test/`
3. Deploy with `npx hardhat run scripts/deploy.ts --network sepolia`
4. Update `GIFT_ESCROW_ADDRESS` in all `.env` files
5. Update ABI in `backend/contracts/abi/`
6. Restart backend (Prisma regenerates types)

### Adding a New API Endpoint
1. Generate NestJS resource: `cd backend && nest g resource feature-name`
2. Update `feature-name.controller.ts` with endpoint logic
3. Add DTOs in `dto/` folder with validation decorators
4. Update `feature-name.service.ts` with business logic
5. Document in `API_DOCUMENTATION.md`

## Documentation References
- `DEVELOPER_GUIDE.md`: Extended technical setup and patterns
- `API_DOCUMENTATION.md`: REST API reference with examples
- `SMART_CONTRACTS.md`: Contract functions, events, deployment
- `ARCHITECTURE.md`: System design and component diagrams
- `DEPLOYMENT.md`: Production deployment guide

## Troubleshooting

### "Nonce expired" SIWE errors
- Nonces expire after 10 minutes. Re-request via `POST /auth/wallet-nonce`
- Check system clock sync between client and server

### Gelato claims failing
- Verify `GELATO_API_KEY` is set in `backend/.env`
- Check Gelato dashboard for relay quota/balance
- Enable mock mode (unset `GELATO_API_KEY`) for local testing

### Contract interaction errors
- Ensure `GIFT_ESCROW_ADDRESS` matches deployed contract on Sepolia
- Verify RPC endpoint is reachable: `curl $SEPOLIA_BASE_RPC -X POST -H "Content-Type: application/json" -d '{"jsonrpc":"2.0","method":"eth_blockNumber","params":[],"id":1}'`
- Check signer has sufficient ETH for gas fees
