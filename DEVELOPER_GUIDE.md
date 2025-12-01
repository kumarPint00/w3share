# 🛠️ DogeGift Developer Guide

## Overview

This guide provides comprehensive technical documentation for developers working on the DogeGift platform. Whether you're contributing to the codebase, integrating with our APIs, or building on top of our smart contracts, this guide will help you understand the implementation details.

## 🏗️ Development Environment Setup

### Prerequisites
```bash
# Required software
Node.js >= 20.0.0
PostgreSQL >= 15.0
Git >= 2.30.0
Docker >= 24.0.0
Docker Compose >= 2.20.0
```

### Quick Start
```bash
# Clone the repository
git clone https://github.com/your-org/dogegift.git
cd dogegift

# Install all dependencies
npm run install:all

# Set up environment variables
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env

# Start development environment
npm run dev

# Run tests
npm run test:all
```

### Environment Configuration

#### Backend Environment Variables
```bash
# Database
DATABASE_URL="postgresql://user:password@localhost:5432/dogegift"

# Authentication
JWT_SECRET="your-super-secret-jwt-key-here"

# Blockchain
SEPOLIA_BASE_RPC="https://sepolia.infura.io/v3/YOUR_PROJECT_ID"
DEPLOYER_PRIVATE_KEY="0x..."
GIFT_ESCROW_ADDRESS="0x..."

# Gelato (Gasless transactions)
GELATO_API_KEY="your-gelato-api-key"

# Application
PORT=3000
NODE_ENV=development
```

#### Frontend Environment Variables
```bash
NEXT_PUBLIC_API_URL="http://localhost:3000"
NEXT_PUBLIC_CHAIN_ID=11155111
```

## 🏛️ Backend Architecture

### NestJS Module Structure
```
src/
├── app.module.ts                 # Root application module
├── main.ts                       # Application bootstrap
├── config/                       # Configuration modules
│   ├── database/
│   ├── blockchain/
│   └── auth/
├── auth/                         # Authentication module
│   ├── auth.module.ts
│   ├── auth.service.ts
│   ├── auth.controller.ts
│   ├── siwe.strategy.ts
│   └── dto/
├── assets/                       # Asset management
│   ├── assets.module.ts
│   ├── assets.service.ts
│   ├── assets.controller.ts
│   └── dto/
├── giftpacks/                    # Gift pack management
│   ├── giftpacks.module.ts
│   ├── giftpacks.service.ts
│   ├── giftpacks.controller.ts
│   └── dto/
├── claim/                        # Claim processing
│   ├── claim.module.ts
│   ├── claim.service.ts
│   ├── claim.controller.ts
│   └── dto/
├── common/                       # Shared utilities
│   ├── decorators/
│   ├── guards/
│   ├── interceptors/
│   ├── filters/
│   └── dto/
└── prisma/                       # Database client
    ├── prisma.service.ts
    └── schema.prisma
```

### Core Services

#### GiftpacksService
```typescript
@Injectable()
export class GiftpacksService {
  constructor(
    private prisma: PrismaService,
    private blockchain: BlockchainService,
    private config: ConfigService,
  ) {}

  async createGiftPack(data: CreateGiftPackDto): Promise<GiftPack> {
    return this.prisma.giftPack.create({
      data: {
        senderAddress: data.senderAddress,
        message: data.message,
        expiry: new Date(data.expiry),
        giftCode: data.giftCode,
      },
    });
  }

  async lockGiftPack(id: string): Promise<LockResult> {
    const giftPack = await this.getGiftPack(id);

    // Validate gift pack
    await this.validateForLocking(giftPack);

    // Prepare blockchain data
    const blockchainData = this.prepareBlockchainData(giftPack);

    // Execute blockchain transaction
    const result = await this.blockchain.lockGift(blockchainData);

    // Update database
    await this.prisma.giftPack.update({
      where: { id },
      data: {
        status: GiftStatus.LOCKED,
        giftIdOnChain: result.giftId,
      },
    });

    return result;
  }
}
```

#### BlockchainService
```typescript
@Injectable()
export class BlockchainService {
  private provider: ethers.Provider;
  private signer: ethers.Signer;
  private escrowContract: ethers.Contract;

  constructor(private config: ConfigService) {
    this.initializeProvider();
    this.initializeContracts();
  }

  private initializeProvider() {
    const rpcUrl = this.config.get<string>('SEPOLIA_BASE_RPC');
    this.provider = new ethers.JsonRpcProvider(rpcUrl);
  }

  private initializeContracts() {
    const privateKey = this.config.get<string>('DEPLOYER_PRIVATE_KEY');
    this.signer = new ethers.Wallet(privateKey, this.provider);

    const contractAddress = this.config.get<string>('GIFT_ESCROW_ADDRESS');
    const contractAbi = []; // Load from artifacts
    this.escrowContract = new ethers.Contract(
      contractAddress,
      contractAbi,
      this.signer
    );
  }

  async lockGift(giftData: GiftData): Promise<LockResult> {
    const tx = await this.escrowContract.lockGiftV2(
      giftData.assetType,
      giftData.tokenAddress,
      giftData.tokenId,
      giftData.amount,
      giftData.expiry,
      giftData.message,
      giftData.codeHash
    );

    const receipt = await tx.wait();
    return this.parseLockResult(receipt);
  }
}
```

## 🎨 Frontend Architecture

### Next.js App Router Structure
```
app/
├── layout.tsx                    # Root layout
├── page.tsx                      # Homepage
├── globals.css                   # Global styles
├── (auth)/                       # Authentication routes
│   ├── layout.tsx
│   └── page.tsx
├── gift/                         # Gift creation flow
│   ├── create/
│   │   ├── page.tsx
│   │   └── components/
│   └── [id]/
├── claim/                        # Gift claiming flow
│   ├── [giftId]/
│   │   ├── page.tsx
│   │   └── components/
│   └── status/
├── dashboard/                    # User dashboard
│   ├── page.tsx
│   └── components/
└── api/                          # API routes
    ├── auth/
    ├── assets/
    └── giftpacks/
```

### Custom Hooks Architecture
```typescript
// hooks/useGiftPacks.ts
export function useCreateGiftPack() {
  return useMutation({
    mutationFn: (data: CreateGiftPackData) => apiService.createGiftPack(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['giftpacks'] });
    },
  });
}

export function useLockGiftPack() {
  return useMutation({
    mutationFn: ({ id }: { id: string }) => apiService.lockGiftPack(id),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['giftpack', data.id] });
    },
  });
}

export function useGiftPack(id?: string) {
  return useQuery({
    queryKey: ['giftpack', id],
    queryFn: () => apiService.getGiftPack(id!),
    enabled: !!id,
  });
}
```

### API Client Architecture
```typescript
// lib/api.ts
class ApiService {
  private baseURL: string;
  private token?: string;

  constructor(baseURL: string) {
    this.baseURL = baseURL;
  }

  setToken(token: string) {
    this.token = token;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.baseURL}${endpoint}`;
    const headers = {
      'Content-Type': 'application/json',
      ...(this.token && { Authorization: `Bearer ${this.token}` }),
      ...options.headers,
    };

    const response = await fetch(url, { ...options, headers });

    if (!response.ok) {
      throw new Error(`API Error: ${response.status}`);
    }

    return response.json();
  }

  // Gift pack methods
  async createGiftPack(data: CreateGiftPackData): Promise<GiftPack> {
    return this.request('/giftpacks', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async lockGiftPack(id: string): Promise<LockResult> {
    return this.request(`/giftpacks/${id}/lock`, {
      method: 'POST',
    });
  }
}

export const apiService = new ApiService(
  process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'
);
```

## 🛢️ Database Design

### Prisma Schema
```prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

generator client {
  provider = "prisma-client-js"
}

model WalletNonce {
  id        String   @id @default(uuid())
  nonce     String   @unique
  address   String   @db.VarChar(42)
  expiresAt DateTime
  createdAt DateTime @default(now())
}

model GiftPack {
  id            String      @id @default(uuid())
  senderAddress String      @db.VarChar(42)
  message       String?     @db.Text
  expiry        DateTime    @default(now())
  status        GiftStatus  @default(DRAFT)
  giftIdOnChain Int?        @unique
  giftCode      String?     @unique
  items         GiftItem[]
  claimTasks    ClaimTask[]
  createdAt     DateTime    @default(now())
  updatedAt     DateTime    @updatedAt
}

model GiftItem {
  id         String    @id @default(uuid())
  giftPack   GiftPack  @relation(fields: [giftPackId], references: [id], onDelete: Cascade)
  giftPackId String
  type       AssetType
  contract   String
  tokenId    String?
  amount     String?
  createdAt  DateTime  @default(now())
}

model ClaimTask {
  id          String     @id @default(uuid())
  giftPack    GiftPack   @relation(fields: [giftPackId], references: [id], onDelete: Cascade)
  giftPackId  String
  taskId      String     @unique
  status      TaskStatus @default(PENDING)
  submittedAt DateTime   @default(now())
  updatedAt   DateTime   @updatedAt
}

enum GiftStatus {
  DRAFT
  LOCKED
  CLAIMED
  EXPIRED
  REFUNDED
}

enum AssetType {
  ERC20
  ERC721
}

enum TaskStatus {
  PENDING
  PROCESSING
  COMPLETED
  FAILED
}
```

### Database Migrations
```bash
# Generate Prisma client
npx prisma generate

# Create and apply migrations
npx prisma migrate dev --name init

# Reset database (development only)
npx prisma migrate reset

# View database
npx prisma studio
```

## 🔗 Smart Contract Integration

### Contract Deployment
```typescript
// scripts/deploy.ts
import { ethers } from 'hardhat';

async function main() {
  const GiftEscrow = await ethers.getContractFactory('GiftEscrow');
  const giftEscrow = await GiftEscrow.deploy();

  await giftEscrow.deployed();

  console.log('GiftEscrow deployed to:', giftEscrow.address);

  // Save deployment address
  const fs = require('fs');
  fs.writeFileSync(
    './deployments/sepolia.json',
    JSON.stringify({
      GiftEscrow: giftEscrow.address,
    }, null, 2)
  );
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
```

### Contract Interaction
```typescript
// lib/contracts.ts
import { ethers } from 'ethers';
import GiftEscrowABI from '../artifacts/contracts/GiftEscrow.sol/GiftEscrow.json';

export function getGiftEscrowContract(
  address: string,
  signerOrProvider: ethers.Signer | ethers.Provider
) {
  return new ethers.Contract(address, GiftEscrowABI.abi, signerOrProvider);
}

// Usage
const contract = getGiftEscrowContract(
  process.env.GIFT_ESCROW_ADDRESS!,
  signer
);

// Call contract methods
const giftId = await contract.lockGiftV2(
  assetType,
  tokenAddress,
  tokenId,
  amount,
  expiryTimestamp,
  message,
  codeHash
);
```

## 🧪 Testing Strategy

### Unit Tests
```typescript
// backend/src/giftpacks/giftpacks.service.spec.ts
describe('GiftpacksService', () => {
  let service: GiftpacksService;
  let prisma: PrismaService;
  let blockchain: BlockchainService;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [
        GiftpacksService,
        {
          provide: PrismaService,
          useValue: mockPrisma,
        },
        {
          provide: BlockchainService,
          useValue: mockBlockchain,
        },
      ],
    }).compile();

    service = module.get<GiftpacksService>(GiftpacksService);
  });

  it('should create a gift pack', async () => {
    const result = await service.createGiftPack(mockData);
    expect(result).toBeDefined();
  });
});
```

### Integration Tests
```typescript
// backend/test/giftpacks.e2e-spec.ts
describe('Giftpacks (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;

  beforeEach(async () => {
    const moduleFixture = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();

    prisma = app.get(PrismaService);
  });

  it('/giftpacks (POST)', () => {
    return request(app.getHttpServer())
      .post('/giftpacks')
      .send(mockGiftPackData)
      .expect(201);
  });
});
```

### Smart Contract Tests
```typescript
// blockchain/test/GiftEscrow.test.js
describe('GiftEscrow', function () {
  let giftEscrow;
  let owner;
  let addr1;
  let testToken;

  beforeEach(async function () {
    [owner, addr1] = await ethers.getSigners();

    const TestToken = await ethers.getContractFactory('TestToken');
    testToken = await TestToken.deploy();
    await testToken.deployed();

    const GiftEscrow = await ethers.getContractFactory('GiftEscrow');
    giftEscrow = await GiftEscrow.deploy();
    await giftEscrow.deployed();
  });

  describe('Locking Gifts', function () {
    it('Should lock a gift successfully', async function () {
      // Test implementation
    });
  });
});
```

## 🔒 Authentication & Security

### SIWE Implementation
```typescript
// backend/src/auth/siwe.strategy.ts
@Injectable()
export class SiweStrategy extends PassportStrategy(Strategy) {
  constructor(private authService: AuthService) {
    super();
  }

  async validate(payload: SiweMessage): Promise<User> {
    // Verify SIWE message
    const { address, nonce } = payload;

    // Check nonce validity
    const storedNonce = await this.authService.getStoredNonce(address);
    if (storedNonce !== nonce) {
      throw new UnauthorizedException('Invalid nonce');
    }

    // Create or update user
    return this.authService.findOrCreateUser(address);
  }
}
```

### JWT Token Management
```typescript
// backend/src/auth/auth.service.ts
@Injectable()
export class AuthService {
  constructor(
    private jwtService: JwtService,
    private config: ConfigService,
  ) {}

  async generateJwt(payload: JwtPayload): Promise<string> {
    return this.jwtService.sign(payload, {
      secret: this.config.get('JWT_SECRET'),
      expiresIn: '7d',
    });
  }

  async validateJwt(token: string): Promise<JwtPayload> {
    try {
      return this.jwtService.verify(token, {
        secret: this.config.get('JWT_SECRET'),
      });
    } catch (error) {
      throw new UnauthorizedException('Invalid token');
    }
  }
}
```

## 🚀 Deployment & DevOps

### Docker Configuration
```dockerfile
# backend/Dockerfile
FROM node:20-alpine AS builder

WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production

FROM node:20-alpine AS runner
WORKDIR /app
COPY --from=builder /app/node_modules ./node_modules
COPY . .

EXPOSE 3000
CMD ["npm", "run", "start:prod"]
```

### Docker Compose
```yaml
# docker-compose.yml
version: '3.8'
services:
  database:
    image: postgres:15
    environment:
      POSTGRES_DB: dogegift
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: postgres
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data

  backend:
    build: ./backend
    ports:
      - "3000:3000"
    environment:
      DATABASE_URL: postgresql://postgres:postgres@database:5432/dogegift
    depends_on:
      - database

  frontend:
    build: ./frontend
    ports:
      - "3001:3000"
    environment:
      NEXT_PUBLIC_API_URL: http://localhost:3000
    depends_on:
      - backend
```

### CI/CD Pipeline
```yaml
# .github/workflows/ci.yml
name: CI/CD Pipeline

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '20'

      - name: Install dependencies
        run: npm run install:all

      - name: Run tests
        run: npm run test:all

      - name: Build applications
        run: npm run build:all

  deploy:
    needs: test
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main'
    steps:
      - uses: actions/checkout@v3
      - name: Deploy to production
        run: npm run deploy
```

## 📊 Monitoring & Logging

### Application Logging
```typescript
// backend/src/common/logger.service.ts
@Injectable()
export class LoggerService {
  private logger = winston.createLogger({
    level: process.env.LOG_LEVEL || 'info',
    format: winston.format.combine(
      winston.format.timestamp(),
      winston.format.errors({ stack: true }),
      winston.format.json()
    ),
    transports: [
      new winston.transports.Console({
        format: winston.format.simple(),
      }),
      new winston.transports.File({
        filename: 'logs/error.log',
        level: 'error',
      }),
      new winston.transports.File({
        filename: 'logs/combined.log',
      }),
    ],
  });

  log(level: string, message: string, meta?: any) {
    this.logger.log(level, message, meta);
  }

  error(message: string, error?: Error, meta?: any) {
    this.logger.error(message, { error: error?.stack, ...meta });
  }
}
```

### Performance Monitoring
```typescript
// backend/src/common/metrics.service.ts
@Injectable()
export class MetricsService {
  private registry = new promClient.Registry();

  constructor() {
    // Default metrics
    promClient.collectDefaultMetrics({ register: this.registry });

    // Custom metrics
    this.httpRequestDuration = new promClient.Histogram({
      name: 'http_request_duration_seconds',
      help: 'Duration of HTTP requests in seconds',
      labelNames: ['method', 'route', 'status_code'],
      buckets: [0.1, 0.5, 1, 2, 5],
    });
  }

  recordHttpRequest(method: string, route: string, statusCode: number, duration: number) {
    this.httpRequestDuration
      .labels(method, route, statusCode.toString())
      .observe(duration);
  }
}
```

## 🔧 Development Workflow

### Code Quality
```json
// .eslintrc.js
module.exports = {
  parser: '@typescript-eslint/parser',
  extends: [
    'eslint:recommended',
    '@typescript-eslint/recommended',
    'prettier',
  ],
  plugins: ['@typescript-eslint', 'prettier'],
  rules: {
    'prettier/prettier': 'error',
    '@typescript-eslint/no-unused-vars': 'error',
    '@typescript-eslint/explicit-function-return-type': 'warn',
  },
};
```

### Pre-commit Hooks
```bash
# .husky/pre-commit
#!/bin/sh
. "$(dirname "$0")/_/husky.sh"

npm run lint
npm run test
npm run build
```

### Git Workflow
```bash
# Feature branch workflow
git checkout -b feature/new-gift-type
# Make changes
git add .
git commit -m "feat: add support for ERC1155 tokens"
git push origin feature/new-gift-type

# Create pull request
# Code review and merge
```

## 🐛 Debugging

### Backend Debugging
```typescript
// Add debug logging
import { Logger } from '@nestjs/common';

@Injectable()
export class GiftpacksService {
  private readonly logger = new Logger(GiftpacksService.name);

  async createGiftPack(data: CreateGiftPackDto) {
    this.logger.debug('Creating gift pack', { data });

    try {
      const result = await this.prisma.giftPack.create({ data });
      this.logger.log('Gift pack created', { id: result.id });
      return result;
    } catch (error) {
      this.logger.error('Failed to create gift pack', error);
      throw error;
    }
  }
}
```

### Frontend Debugging
```typescript
// React Query DevTools
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';

function App() {
  return (
    <>
      <YourApp />
      <ReactQueryDevtools initialIsOpen={false} />
    </>
  );
}

// Console logging
const { data, error, isLoading } = useQuery({
  queryKey: ['giftpack', id],
  queryFn: () => apiService.getGiftPack(id),
  onSuccess: (data) => console.log('Gift pack loaded:', data),
  onError: (error) => console.error('Failed to load gift pack:', error),
});
```

## 📚 API Documentation

### OpenAPI/Swagger
```typescript
// backend/src/main.ts
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  const config = new DocumentBuilder()
    .setTitle('DogeGift API')
    .setDescription('API for DogeGift decentralized gifting platform')
    .setVersion('1.0')
    .addTag('giftpacks', 'Gift pack management')
    .addTag('assets', 'Asset management')
    .addTag('auth', 'Authentication')
    .addBearerAuth()
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('docs', app, document);

  await app.listen(3000);
}
```

### API Testing
```bash
# Test authentication
curl -X POST http://localhost:3000/auth/wallet-nonce \
  -H "Content-Type: application/json" \
  -d '{"address":"0x..."}'

# Test gift pack creation
curl -X POST http://localhost:3000/giftpacks \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{"senderAddress":"0x...","message":"Happy Birthday!"}'
```

## 🚀 Performance Optimization

### Database Optimization
```sql
-- Add indexes for performance
CREATE INDEX idx_gift_pack_sender ON gift_pack(sender_address);
CREATE INDEX idx_gift_pack_status ON gift_pack(status);
CREATE INDEX idx_gift_pack_expiry ON gift_pack(expiry);
CREATE INDEX idx_gift_item_contract ON gift_item(contract);

-- Query optimization
EXPLAIN ANALYZE
SELECT gp.*, gi.*
FROM gift_pack gp
LEFT JOIN gift_item gi ON gp.id = gi.gift_pack_id
WHERE gp.sender_address = $1
  AND gp.status = 'LOCKED'
ORDER BY gp.created_at DESC
LIMIT 10;
```

### Caching Strategy
```typescript
// Redis caching
@Injectable()
export class CacheService {
  constructor(@Inject('REDIS_CLIENT') private redis: Redis) {}

  async get<T>(key: string): Promise<T | null> {
    const cached = await this.redis.get(key);
    return cached ? JSON.parse(cached) : null;
  }

  async set(key: string, value: any, ttl = 300): Promise<void> {
    await this.redis.setex(key, ttl, JSON.stringify(value));
  }
}
```

### Frontend Optimization
```typescript
// Code splitting
const GiftCreator = lazy(() => import('./components/GiftCreator'));

// Image optimization
import Image from 'next/image';
<Image src="/hero.jpg" alt="Hero" width={800} height={600} priority />

// Bundle analysis
import { BundleAnalyzerPlugin } from 'webpack-bundle-analyzer';
```

## 🔐 Security Best Practices

### Input Validation
```typescript
// DTO validation
export class CreateGiftPackDto {
  @IsNotEmpty()
  @IsEthereumAddress()
  senderAddress: string;

  @IsOptional()
  @IsString()
  @Length(1, 500)
  message?: string;

  @IsDateString()
  expiry: string;

  @IsOptional()
  @Matches(/^[a-zA-Z0-9_-]+$/)
  giftCode?: string;
}
```

### Rate Limiting
```typescript
// API rate limiting
@Injectable()
export class RateLimitGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const rateLimit = this.reflector.get<number>('rateLimit', context.getHandler());
    // Implement rate limiting logic
    return true;
  }
}
```

### Environment Security
```bash
# Use strong secrets
JWT_SECRET="your-super-secure-random-string-here"
DATABASE_URL="postgresql://user:securepassword@localhost:5432/dogegift"

# Never commit secrets
echo ".env" >> .gitignore
echo "backend/.env" >> .gitignore
echo "frontend/.env" >> .gitignore
```

## 📝 Contributing Guidelines

### Code Style
```json
// .prettierrc
{
  "semi": true,
  "trailingComma": "es5",
  "singleQuote": true,
  "printWidth": 80,
  "tabWidth": 2,
  "useTabs": false
}
```

### Commit Convention
```bash
# Format: type(scope): description
git commit -m "feat(giftpacks): add support for ERC1155 tokens"
git commit -m "fix(auth): resolve SIWE validation issue"
git commit -m "docs(api): update gift pack endpoints"
git commit -m "test(blockchain): add contract integration tests"
```

### Pull Request Process
1. Create feature branch from `main`
2. Make changes and add tests
3. Ensure all tests pass
4. Update documentation if needed
5. Create pull request with description
6. Code review and approval
7. Merge to `main`

## 🐛 Issue Reporting

### Bug Reports
```markdown
## Bug Report

**Description:**
Brief description of the bug

**Steps to Reproduce:**
1. Go to '...'
2. Click on '...'
3. See error

**Expected Behavior:**
What should happen

**Actual Behavior:**
What actually happens

**Environment:**
- OS: [e.g., macOS, Windows]
- Browser: [e.g., Chrome 91]
- Node Version: [e.g., 20.0.0]
- Contract Address: [e.g., 0x...]
```

### Feature Requests
```markdown
## Feature Request

**Problem:**
What's the problem this feature would solve?

**Solution:**
Describe the solution you'd like

**Alternatives:**
Any alternative solutions considered?

**Additional Context:**
Any other context or screenshots
```

This comprehensive developer guide provides everything needed to work effectively with the DogeGift codebase, from initial setup to advanced development practices.</content>
<parameter name="filePath">/home/ravi/dogeFull/DEVELOPER_GUIDE.md
