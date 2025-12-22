# DogeGift AI Agent Coding Instructions

## Architecture Overview

**DogeGift** is a Web3 gift-sharing platform with three main services:

1. **Backend (NestJS)** - `/backend/src`: REST API handling SIWE auth, gift pack management, blockchain claims, and asset querying
2. **Frontend (Next.js)** - `/frontend`: React UI for creating/claiming gasless gifts with wallet integration  
3. **Contract Admin Service (Express)** - `/contract-admin-service`: Separate microservice for contract state management

**Key data flow**: Frontend → NestJS API (with JWT auth) → Prisma ORM → PostgreSQL + Gelato/blockchain

## Critical Patterns & Conventions

### Authentication (SIWE + JWT)
- **Flow**: Request nonce → Sign with wallet (SIWE) → Exchange for JWT → Use Bearer token
- **Location**: `backend/src/auth/`
- **Key files**: `auth.service.ts` (SIWE validation), `jwt.strategy.ts` (Bearer extraction), `wallet.guard.ts` (endpoint protection)
- **Frontend hook**: `frontend/hooks/useAuth.ts` - `useWalletNonce()`, `useSiweAuth()`, `useAuthSession()`
- **API**: `POST /auth/wallet-nonce`, `POST /auth/siwe`, `GET /auth/session` (protected)

### Database Model (Prisma)
- **Schema**: `backend/prisma/schema.prisma`
- **Core entities**: `GiftPack` (DRAFT/LOCKED/CLAIMED/REFUNDED), `GiftItem` (ERC20/ERC721), `WalletNonce`, `ClaimTask`
- **Cascading deletes**: GiftItems and ClaimTasks cascade with GiftPack
- **Migrations**: Run automatically on startup; always regenerate Prisma client: `npx prisma generate`

### Gift Pack Lifecycle
- **Create**: POST `/giftpacks` (auth required) - creates DRAFT with items
- **Lock**: PATCH `/giftpacks/{id}` - transitions to LOCKED (calls blockchain escrow)
- **Claim**: POST `/claim/gasless/{giftCode}` - uses Gelato relay, marks CLAIMED
- **Public access**: GET `/giftpacks/code/{giftCode}` - no auth required, returns gift details

### Gasless Claims (Gelato Integration)
- **Location**: `backend/src/claim/claim.service.ts`
- **Flow**: Validate gift → Build tx data → Submit via GelatoRelay → Poll status → Update db
- **Config**: `GELATO_API_KEY`, `GIFT_ESCROW_ADDRESS`, `SEPOLIA_BASE_RPC`, `SEPOLIA_CHAIN_ID`
- **Fallback**: Mock mode when Gelato unavailable (config-driven)

### Frontend State Management
- **Data fetching**: TanStack React Query with `useQuery`/`useMutation` hooks
- **JWT storage**: `localStorage.auth_token` (set by `useAuth.ts` hooks)
- **API client**: `frontend/lib/api.ts` - ApiService singleton with auto Bearer header injection
- **Environment**: `NEXT_PUBLIC_API_URL`, `NEXT_PUBLIC_CHAIN_ID`, `NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID`

### Security (frontend/lib/security.ts)
- **Input sanitization**: `sanitizeUserInput()` - strips scripts and HTML entities
- **Nonce generation**: `generateNonce()` - 36-char random string
- **Validations**: `validateWalletAddress()` (0x + 40 hex), `validateEmail()` (basic regex)

## Development Workflows

### Local Development
```bash
# Full stack setup
bash start-dev.sh  # Runs backend (port 4000) + frontend (port 3000) concurrently

# Backend only (watch mode)
cd backend && npm run start:dev  # Includes Prisma client generation

# Frontend only
cd frontend && npm run dev
```

### Database Operations
```bash
# Generate Prisma types after schema changes
npx prisma generate

# Create migration (from backend/)
npx prisma migrate dev --name <name>

# Reset database (development only)
npx prisma migrate reset
```

### Docker Compose
- **Services**: PostgreSQL (port 5434), Backend (4000), Frontend (3000), Admin Service
- **Start**: `docker-compose up` - builds and runs all services
- **Env file**: Backend reads from `.env` (DATABASE_URL, JWT_SECRET, GELATO_API_KEY, etc.)

### Testing & Quality
- **Backend tests**: `npm run test` (Jest), `npm run test:e2e` (integration)
- **Linting**: `npm run lint` (auto-fix with `--fix`)
- **Format**: `npm run format` (Prettier on src/ and test/)

## Module Organization

**Backend NestJS structure**:
- `auth/` - SIWE/JWT (module exports AuthService, JwtStrategy)
- `giftpacks/` - Gift CRUD (GiftpacksService, GiftpacksController)
- `claim/` - Gasless claims (ClaimService, ClaimController)
- `assets/` - ERC20/NFT querying (Alchemy SDK integration)
- `health/` - Readiness checks
- `common/filters/` - Exception handling (AllExceptionsFilter)
- `config/` - allowedToken.json (whitelisted ERC20s)
- `swaggers/` - Swagger/OpenAPI setup

**Global imports**: `ConfigModule.forRoot({ isGlobal: true })`, `CacheModule.register({ ttl: 60 })` in AppModule

## Key Integration Points

### External Dependencies
- **Wallet connection**: `@metamask/detect-provider` (frontend), ethers.js v6 for signing
- **Blockchain RPC**: Alchemy SDK, Ethers JsonRpcProvider
- **Gasless execution**: Gelato Relay SDK (`@gelatonetwork/relay-sdk`)
- **State management**: TanStack React Query (caching, deduplication, retry logic)

### Environment Variables
- **Backend**: DATABASE_URL, JWT_SECRET, GELATO_API_KEY, SEPOLIA_BASE_RPC, GIFT_ESCROW_ADDRESS
- **Frontend**: NEXT_PUBLIC_API_URL, NEXT_PUBLIC_CHAIN_ID, NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID
- **Both**: CORS_ORIGINS, PORT

### API Response Format
```typescript
// Success: { data: T }
// Error: { error: string, code: string }
// Swagger documented at /api/docs (NestJS default)
```

## Common Pitfalls to Avoid

1. **JWT not included in requests**: Use `frontend/lib/api.ts` for automatic header injection; don't fetch directly
2. **Prisma client not regenerated**: Always run `npx prisma generate` after schema changes
3. **Address case sensitivity**: Compare addresses with `.toLowerCase()` (done in auth.service.ts)
4. **CORS failures**: Check `CORS_ORIGINS` env var matches frontend origin
5. **Nonce expiry**: 10-minute expiration set in `generateNonce()`; reuse prevention on validation
6. **Gelato mock mode**: Enable `MOCK_CLAIMING=true` to test claim flow without actual relay

## New Feature Checklist

- [ ] Add Prisma model + migration if persisting data
- [ ] Create NestJS DTO (class-validator + ApiProperty decorators) for input validation
- [ ] Add controller endpoint with @UseGuards(WalletAuthGuard) if auth-required
- [ ] Document in Swagger with @ApiOperation, @ApiParam, etc.
- [ ] Add frontend hook using TanStack React Query (useQuery/useMutation)
- [ ] Update `frontend/lib/api.ts` ApiService with new endpoints
- [ ] Add environment variables to `.env.example` files
