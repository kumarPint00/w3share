# DogeGift AI Agent Instructions

## Project Overview
**DogeGift** is a multi-chain gift distribution platform combining Web3 wallet authentication (SIWE), smart contracts for escrow/claiming, and a modern web interface. The stack uses NestJS backend, Next.js frontend, Hardhat for blockchain, and PostgreSQL with Prisma ORM.

## Architecture Essentials

### Core Components
1. **Backend (NestJS)** - API server at port 4000
   - SIWE authentication with JWT tokens (nonces expire in 10 minutes)
   - Gift pack lifecycle management (DRAFT → LOCKED → CLAIMED)
   - Smart contract interaction via ethers.js with mock mode support
   - Prisma database layer with type-safe queries
   - Modules: `auth`, `giftpacks`, `claim`, `assets`, `health`

2. **Frontend (Next.js)** - Web UI at port 3000
   - Wallet connection via MetaMask/providers with `@metamask/detect-provider`
   - Gift creation & claiming flows with steppers and forms
   - Material-UI components with Emotion CSS-in-JS styling
   - React Query for server state, SWR for simple queries
   - Zod for client-side validation

3. **Smart Contracts (Hardhat)** - Multi-chain deployment
   - GiftEscrow contract handles token locking/claiming
   - Supports ERC20, ERC721, native tokens
   - Deployed on Sepolia (testnet), mainnet, Polygon, BSC via Alchemy RPC

4. **Contract Admin Service (Express)** - Admin operations at port 5000
   - Manages contract function calls requiring elevated privileges
   - Configuration validation, helmet security, CORS with API key auth

5. **Contract Admin UI (React)** - Admin dashboard
   - Contract parameter management
   - Configuration UI for smart contract operations

### Data Flow Patterns
- **Gift Creation**: Frontend → Backend validates/stores → Locked on-chain via escrow (ethers.Contract)
- **Claiming**: Gasless via Gelato Relay → Signature validation → Token transfer → Status update to CLAIMED
- **Authentication**: SIWE message signature (ethers.verifyMessage) → Nonce validation → JWT issued

## Critical Developer Workflows

### Startup
```bash
# Development: Both backend and frontend with live reload
./start-dev.sh  # Checks node_modules, installs deps, creates .env from .example, runs concurrently

# Docker production setup
docker-compose up -d  # Spins up: PostgreSQL, NestJS, Next.js, admin services

# Manual backend-only
cd backend && npm run start:dev  # Runs prisma generate + nest start --watch
```

### Database Management
- **Prisma migrations**: `npx prisma migrate dev --name <migration>`
- **Schema updates**: Modify `backend/prisma/schema.prisma` → `npx prisma generate` → restart
- **Data models**: `GiftPack` (statuses: DRAFT/LOCKED/CLAIMED), `GiftItem` (ERC20/ERC721), `ClaimTask` (Gelato), `WalletNonce`

### Blockchain Setup
- **Test deployment**: Sepolia testnet via Alchemy RPC
- **Hardhat config**: `backend/blockchain/hardhat.config.ts` - 4 networks (sepolia/mainnet/polygon/bsc)
- **Contract ABIs**: Stored in `backend/src/contracts/abi/` as JSON artifacts
- **Mock mode**: Set `CLAIM_MOCK=true` to skip contract calls for testing

### Testing Commands
```bash
# Backend tests
cd backend && npm run test              # Jest unit tests
npm run test:cov                        # Coverage report
npm run test:e2e                        # End-to-end tests

# Linting/Format
npm run lint                            # ESLint fix
npm run format                          # Prettier format

# Strip comments (custom script)
npm run strip:comments                  # Removes line comments from JS/TS files
```

## Key Code Patterns & Conventions

### NestJS Service Structure
Services use dependency injection with Prisma and ConfigService:
```typescript
constructor(
  private readonly prisma: PrismaService,
  private readonly config: ConfigService,
) {}
```
Error handling: Throw NestJS exceptions (`BadRequestException`, `ForbiddenException`, `NotFoundException`).

Blockchain initialization in services (e.g., `giftpacks.service.ts`):
```typescript
private initializeBlockchainConnection() {
  const mockMode = this.config.get<string>('CLAIM_MOCK') === 'true';
  if (mockMode) return;
  this.provider = new JsonRpcProvider(rpcUrl);
  this.signer = new Wallet(privateKey, this.provider);
  this.escrowContract = new Contract(address, abi, this.signer);
}
```

### Environment Configuration
- **Critical vars**: `DATABASE_URL`, `JWT_SECRET`, `SEPOLIA_BASE_RPC`, `DEPLOYER_PRIVATE_KEY`, `GIFT_ESCROW_ADDRESS`, `GELATO_API_KEY`
- **Fallbacks**: Mock modes (`CLAIM_MOCK=true`) disable smart contract calls
- **CORS**: Configured per service; update in docker-compose.yml, .env files, NestJS guards

### Blockchain Integration (ethers.js)
- Services initialize provider/signer/contract on boot with config validation
- Mock mode for testing without contracts
- Contract interactions: Use `Contract` class with artifact ABIs
- SIWE auth: `ethers.verifyMessage(siwe.prepareMessage(), signature)`
- Gasless claims: Gelato Relay SDK for sponsored transactions

### Frontend State Management
- **Server state**: React Query (`@tanstack/react-query`) with mutations for API calls
- **Simple fetching**: SWR (`swr`) for lightweight queries
- **UI Framework**: Material-UI with Emotion CSS-in-JS (styled components)
- **Routing**: Next.js App Router with dynamic routes in `app/[dynamic]` folders
- **Validation**: Zod schemas for form validation

### DTO Validation
- Input validation via `class-validator` in DTOs (e.g., `backend/src/giftpacks/dto/add-item.dto.ts`)
- Controllers use `@Body()` decorators with typed DTOs
- Prisma type-safe queries (no raw SQL); use generated types like `GiftPack`, `GiftItem`

## Integration Points & Dependencies

### External Services
- **Alchemy RPC**: Ethereum/testnets via `SEPOLIA_BASE_RPC` env var
- **Gelato Relay**: Gasless transactions via `@gelatonetwork/relay-sdk`
- **PostgreSQL**: Schema-driven by Prisma, health checks in docker-compose
- **JWT**: `jsonwebtoken` for token signing; secret in env

### Cross-Service Communication
- **Backend ↔ Contracts**: ethers.js provider + signer + Contract class
- **Frontend ↔ Backend**: REST API at `NEXT_PUBLIC_API_URL` (default: `http://localhost:4000`)
- **Admin Service ↔ Contracts**: Direct ethers.js calls with API key auth

### Blockchain Considerations
- **Gas/Fees**: Handled by signer wallet (`DEPLOYER_PRIVATE_KEY`); Gelato for gasless claims
- **Chain IDs**: Sepolia=11155111, mainnet=1, polygon=137, bsc=56
- **Token Types**: ERC20 (amount), ERC721 (tokenId), native (ETH/MATIC/BNB)
- **Multi-chain**: Hardhat config supports switching networks via env vars

## Common Pitfalls

1. **Nonce Expiration**: SIWE nonces expire in 10 minutes; regenerate on auth failure
2. **Smart Contract Mode**: When `CLAIM_MOCK=false`, contract must be deployed; verify `GIFT_ESCROW_ADDRESS`
3. **CORS**: Update all CORS configs when changing frontend URL (docker-compose, .env, NestJS guards)
4. **Prisma Client**: Always run `npx prisma generate` after schema changes before build/restart
5. **JWT Secret**: Must match between backend and any JWT-consuming services; update in docker-compose and .env
6. **Chain Switching**: Hardhat config has 4 networks; ensure RPC URLs and private keys are valid before deployment
7. **Mock Mode**: Use `CLAIM_MOCK=true` for development/testing without blockchain; disable for production
8. **Dependencies**: Run `npm install` in backend/frontend after pulling changes; start-dev.sh handles this

## File Reference Guide

| Path | Purpose |
|------|---------|
| `backend/src/auth/` | SIWE validation, JWT generation (`auth.service.ts`) |
| `backend/src/giftpacks/` | Gift lifecycle, contract interaction (`giftpacks.service.ts`) |
| `backend/src/claim/` | Claim processing, Gelato integration (`claim.service.ts`) |
| `backend/prisma/schema.prisma` | Database schemas (GiftPack, GiftItem, etc.) |
| `frontend/app/` | Next.js pages and layouts (`page.tsx`, `gift/`, `claim/`) |
| `frontend/components/` | Reusable React components (Material-UI based) |
| `backend/blockchain/` | Hardhat config, smart contract artifacts |
| `contract-admin-service/` | Express API for admin operations (`index.ts`) |
| `ecosystem.config.js` | PM2 production config (ports, env) |
| `start-dev.sh` | Development startup script (installs deps, starts services) |
| `docker-compose.yml` | Production container setup (PostgreSQL, services) |
