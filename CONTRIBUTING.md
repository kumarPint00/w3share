# 🤝 Contributing to DogeGift

## Welcome Contributors!

Thank you for your interest in contributing to DogeGift! This document provides guidelines and information for contributors. Whether you're fixing bugs, adding features, improving documentation, or helping with testing, your contributions are valuable and appreciated.

## Table of Contents

- [Code of Conduct](#code-of-conduct)
- [Getting Started](#getting-started)
- [Development Workflow](#development-workflow)
- [Contributing Guidelines](#contributing-guidelines)
- [Pull Request Process](#pull-request-process)
- [Development Setup](#development-setup)
- [Testing](#testing)
- [Documentation](#documentation)
- [Issue Reporting](#issue-reporting)
- [Community](#community)

## Code of Conduct

This project adheres to a code of conduct to ensure a welcoming environment for all contributors. By participating, you agree to:

- **Be respectful**: Treat all contributors with respect and kindness
- **Be inclusive**: Welcome contributors from all backgrounds and skill levels
- **Be collaborative**: Work together to achieve common goals
- **Be patient**: Understand that everyone has different experience levels
- **Be constructive**: Provide helpful feedback and suggestions

## Getting Started

### Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js**: Version 20.x or higher
- **npm**: Version 9.x or higher
- **Git**: Version 2.30 or higher
- **Docker**: Version 20.x or higher (optional, for full development environment)
- **PostgreSQL**: Version 15.x or higher (optional, for local database)

### Quick Start

1. **Fork the repository**
   ```bash
   git clone https://github.com/your-username/dogegift.git
   cd dogegift
   ```

2. **Set up the development environment**
   ```bash
   # Install all dependencies
   npm run install:all

   # Set up environment variables
   cp backend/.env.example backend/.env
   cp frontend/.env.example frontend/.env

   # Start development servers
   npm run dev
   ```

3. **Verify the setup**
   - Frontend: http://localhost:3001
   - Backend: http://localhost:3000
   - Database: Check backend logs for connection status

## Development Workflow

### Branching Strategy

We use a Git flow branching strategy:

```
main (production-ready)
├── develop (latest development)
│   ├── feature/feature-name
│   ├── bugfix/bug-description
│   ├── hotfix/critical-fix
│   └── refactor/refactor-description
```

### Branch Naming Conventions

- **Features**: `feature/description-of-feature`
- **Bug fixes**: `bugfix/description-of-bug`
- **Hotfixes**: `hotfix/description-of-fix`
- **Refactoring**: `refactor/description-of-refactor`

### Commit Message Format

We follow conventional commit format:

```
type(scope): description

[optional body]

[optional footer]
```

**Types:**
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `style`: Code style changes (formatting, etc.)
- `refactor`: Code refactoring
- `test`: Adding or updating tests
- `chore`: Maintenance tasks

**Examples:**
```bash
feat(auth): add SIWE wallet authentication
fix(escrow): resolve gift claiming timeout issue
docs(api): update endpoint documentation
test(frontend): add gift creation form tests
```

## Contributing Guidelines

### Code Style

#### TypeScript/JavaScript
- Use TypeScript for all new code
- Follow ESLint configuration
- Use Prettier for code formatting
- Maximum line length: 100 characters
- Use meaningful variable and function names

#### React Components
```typescript
// ✅ Good
interface GiftCardProps {
  gift: GiftPack;
  onClaim: (giftId: string) => void;
}

export const GiftCard: React.FC<GiftCardProps> = ({ gift, onClaim }) => {
  const handleClaim = useCallback(() => {
    onClaim(gift.id);
  }, [gift.id, onClaim]);

  return (
    <div className="gift-card">
      <h3>{gift.title}</h3>
      <button onClick={handleClaim}>Claim Gift</button>
    </div>
  );
};

// ❌ Avoid
const GiftCard = ({ gift, onClaim }) => {
  return (
    <div>
      <h3>{gift.title}</h3>
      <button onClick={() => onClaim(gift.id)}>Claim</button>
    </div>
  );
};
```

#### Backend Code
```typescript
// ✅ Good
@Injectable()
export class GiftService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly escrowService: EscrowService,
  ) {}

  async createGift(createGiftDto: CreateGiftDto): Promise<GiftPack> {
    // Validate input
    this.validateGiftData(createGiftDto);

    // Create gift pack
    const giftPack = await this.prisma.giftPack.create({
      data: {
        title: createGiftDto.title,
        senderAddress: createGiftDto.senderAddress,
        expiry: createGiftDto.expiry,
      },
    });

    return giftPack;
  }

  private validateGiftData(dto: CreateGiftDto): void {
    if (!dto.title?.trim()) {
      throw new BadRequestException('Gift title is required');
    }
  }
}

// ❌ Avoid
export class GiftService {
  async createGift(dto) {
    const gift = await this.prisma.giftPack.create({
      data: dto,
    });
    return gift;
  }
}
```

### Smart Contract Guidelines

#### Solidity Best Practices
- Use Solidity version ^0.8.0
- Follow OpenZeppelin standards
- Implement proper access controls
- Use SafeMath for arithmetic operations
- Add comprehensive tests
- Document all public functions

```solidity
// ✅ Good
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";

contract GiftEscrow is Ownable, ReentrancyGuard {
    mapping(bytes32 => Gift) public gifts;

    struct Gift {
        address sender;
        address token;
        uint256 amount;
        uint256 expiry;
        bool claimed;
    }

    event GiftLocked(bytes32 indexed giftId, address indexed sender);
    event GiftClaimed(bytes32 indexed giftId, address indexed claimer);

    /**
     * @dev Locks tokens for a gift
     * @param giftId Unique identifier for the gift
     * @param token Token contract address
     * @param amount Amount of tokens to lock
     * @param expiry Expiry timestamp
     */
    function lockGift(
        bytes32 giftId,
        address token,
        uint256 amount,
        uint256 expiry
    ) external nonReentrant {
        require(amount > 0, "Amount must be greater than 0");
        require(expiry > block.timestamp, "Expiry must be in the future");

        gifts[giftId] = Gift({
            sender: msg.sender,
            token: token,
            amount: amount,
            expiry: expiry,
            claimed: false
        });

        // Transfer tokens to contract
        IERC20(token).transferFrom(msg.sender, address(this), amount);

        emit GiftLocked(giftId, msg.sender);
    }
}
```

### Database Guidelines

#### Prisma Schema
- Use descriptive model names
- Add proper indexes for performance
- Use appropriate data types
- Add database constraints
- Document complex relationships

```prisma
// ✅ Good
model GiftPack {
  id          String   @id @default(cuid())
  title       String
  description String?
  senderId    String
  senderAddress String
  status      GiftStatus @default(PENDING)
  expiry      DateTime
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  sender      User     @relation(fields: [senderId], references: [id])
  items       GiftItem[]

  @@index([senderAddress])
  @@index([status])
  @@index([expiry])
  @@map("gift_pack")
}

model GiftItem {
  id          String   @id @default(cuid())
  giftPackId  String
  contract    String
  tokenId     String?
  amount      String
  metadata    Json?

  giftPack    GiftPack @relation(fields: [giftPackId], references: [id], onDelete: Cascade)

  @@index([contract])
  @@index([tokenId])
  @@map("gift_item")
}

// ❌ Avoid
model gift_pack {
  id String @id
  title String
  sender String
  status String
  expiry DateTime
}
```

## Pull Request Process

### Before Submitting

1. **Update your branch**
   ```bash
   git checkout develop
   git pull origin develop
   git checkout your-branch
   git rebase develop
   ```

2. **Run tests and linting**
   ```bash
   npm run test:all
   npm run lint:all
   npm run build:all
   ```

3. **Update documentation**
   - Update relevant documentation files
   - Add JSDoc comments for new functions
   - Update API documentation if needed

4. **Write tests**
   - Add unit tests for new features
   - Add integration tests for API changes
   - Update existing tests if needed

### Creating a Pull Request

1. **Push your branch**
   ```bash
   git push origin your-branch
   ```

2. **Create PR on GitHub**
   - Use descriptive title following commit conventions
   - Fill out the PR template
   - Link related issues
   - Add screenshots for UI changes

3. **PR Template**
   ```markdown
   ## Description
   Brief description of the changes

   ## Type of Change
   - [ ] Bug fix
   - [ ] New feature
   - [ ] Breaking change
   - [ ] Documentation update

   ## Testing
   - [ ] Unit tests added/updated
   - [ ] Integration tests added/updated
   - [ ] Manual testing completed

   ## Screenshots (if applicable)
   Add screenshots of UI changes

   ## Checklist
   - [ ] Code follows style guidelines
   - [ ] Tests pass
   - [ ] Documentation updated
   - [ ] No breaking changes
   ```

### Review Process

1. **Automated Checks**
   - CI/CD pipeline runs tests and linting
   - Code coverage requirements met
   - Security scans pass

2. **Code Review**
   - At least one maintainer reviews the code
   - Review focuses on code quality, security, and functionality
   - Suggestions provided as comments

3. **Approval and Merge**
   - PR approved by required reviewers
   - Squash and merge to develop branch
   - Delete feature branch after merge

## Development Setup

### Local Development Environment

#### Using Docker (Recommended)
```bash
# Start all services
docker-compose up -d

# View logs
docker-compose logs -f

# Stop services
docker-compose down
```

#### Manual Setup
```bash
# Backend setup
cd backend
npm install
cp .env.example .env
npm run start:dev

# Frontend setup
cd ../frontend
npm install
cp .env.example .env
npm run dev

# Database setup
# Install PostgreSQL locally or use Docker
docker run -d --name postgres -p 5432:5432 -e POSTGRES_PASSWORD=password postgres:15
```

### Environment Configuration

#### Backend Environment Variables
```bash
# .env
NODE_ENV=development
PORT=3000
DATABASE_URL=postgresql://user:password@localhost:5432/dogegift
JWT_SECRET=your-development-jwt-secret
SEPOLIA_RPC_URL=https://sepolia.infura.io/v3/YOUR_PROJECT_ID
DEPLOYER_PRIVATE_KEY=0x...
GIFT_ESCROW_ADDRESS=0x...
```

#### Frontend Environment Variables
```bash
# .env.local
NEXT_PUBLIC_API_URL=http://localhost:3000
NEXT_PUBLIC_CHAIN_ID=11155111
NEXT_PUBLIC_INFURA_PROJECT_ID=your-project-id
```

### Database Setup

#### Using Docker
```bash
docker run -d \
  --name dogegift-postgres \
  -p 5432:5432 \
  -e POSTGRES_DB=dogegift \
  -e POSTGRES_USER=dogegift \
  -e POSTGRES_PASSWORD=password \
  postgres:15
```

#### Local Installation
```bash
# macOS with Homebrew
brew install postgresql
brew services start postgresql
createdb dogegift

# Ubuntu/Debian
sudo apt install postgresql postgresql-contrib
sudo -u postgres createdb dogegift
```

#### Database Migrations
```bash
cd backend
npm run prisma:migrate
npm run prisma:generate
npm run prisma:seed
```

## Testing

### Test Structure

```
tests/
├── unit/           # Unit tests
├── integration/   # Integration tests
├── e2e/          # End-to-end tests
└── fixtures/     # Test data
```

### Running Tests

```bash
# Run all tests
npm run test:all

# Run backend tests
npm run test:backend

# Run frontend tests
npm run test:frontend

# Run with coverage
npm run test:coverage

# Run specific test file
npm run test -- tests/unit/gift.service.spec.ts

# Run tests in watch mode
npm run test:watch
```

### Writing Tests

#### Unit Tests (Backend)
```typescript
// gift.service.spec.ts
import { Test, TestingModule } from '@nestjs/testing';
import { GiftService } from './gift.service';
import { PrismaService } from '../prisma/prisma.service';

describe('GiftService', () => {
  let service: GiftService;
  let prisma: PrismaService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [GiftService, PrismaService],
    }).compile();

    service = module.get<GiftService>(GiftService);
    prisma = module.get<PrismaService>(PrismaService);
  });

  describe('createGift', () => {
    it('should create a gift successfully', async () => {
      const createGiftDto = {
        title: 'Test Gift',
        senderAddress: '0x123...',
        expiry: new Date(),
      };

      const result = await service.createGift(createGiftDto);
      expect(result.title).toBe(createGiftDto.title);
    });

    it('should throw error for invalid data', async () => {
      const invalidDto = { title: '' };
      await expect(service.createGift(invalidDto)).rejects.toThrow();
    });
  });
});
```

#### Integration Tests
```typescript
// gift.e2e-spec.ts
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';

describe('Gift (e2e)', () => {
  let app: INestApplication;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  it('/gift (POST) - should create gift', () => {
    return request(app.getHttpServer())
      .post('/gift')
      .send({
        title: 'Test Gift',
        senderAddress: '0x123...',
      })
      .expect(201)
      .expect((res) => {
        expect(res.body.title).toBe('Test Gift');
      });
  });
});
```

#### Frontend Tests
```typescript
// GiftCard.test.tsx
import { render, screen, fireEvent } from '@testing-library/react';
import { GiftCard } from './GiftCard';

const mockGift = {
  id: '1',
  title: 'Test Gift',
  description: 'A test gift',
};

const mockOnClaim = jest.fn();

describe('GiftCard', () => {
  it('renders gift information', () => {
    render(<GiftCard gift={mockGift} onClaim={mockOnClaim} />);

    expect(screen.getByText('Test Gift')).toBeInTheDocument();
    expect(screen.getByText('A test gift')).toBeInTheDocument();
  });

  it('calls onClaim when claim button is clicked', () => {
    render(<GiftCard gift={mockGift} onClaim={mockOnClaim} />);

    const claimButton = screen.getByRole('button', { name: /claim/i });
    fireEvent.click(claimButton);

    expect(mockOnClaim).toHaveBeenCalledWith('1');
  });
});
```

### Test Coverage Requirements

- **Backend**: Minimum 80% coverage
- **Frontend**: Minimum 70% coverage
- **Smart Contracts**: Minimum 95% coverage

## Documentation

### Code Documentation

#### JSDoc Comments
```typescript
/**
 * Creates a new gift pack
 * @param createGiftDto - The gift creation data
 * @returns Promise<GiftPack> - The created gift pack
 * @throws BadRequestException - If validation fails
 */
async createGift(createGiftDto: CreateGiftDto): Promise<GiftPack> {
  // Implementation
}
```

#### API Documentation
```typescript
/**
 * @swagger
 * /gift:
 *   post:
 *     summary: Create a new gift
 *     tags: [Gifts]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateGiftDto'
 *     responses:
 *       201:
 *         description: Gift created successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/GiftPack'
 */
@Post()
async createGift(@Body() createGiftDto: CreateGiftDto): Promise<GiftPack> {
  return this.giftService.createGift(createGiftDto);
}
```

### Documentation Updates

When making changes, update the relevant documentation:

- **API changes**: Update API_DOCUMENTATION.md
- **New features**: Update USER_GUIDE.md and DEVELOPER_GUIDE.md
- **Architecture changes**: Update ARCHITECTURE.md
- **Smart contract changes**: Update SMART_CONTRACTS.md

## Issue Reporting

### Bug Reports

When reporting bugs, please include:

1. **Clear title** describing the issue
2. **Steps to reproduce** the problem
3. **Expected behavior** vs actual behavior
4. **Environment details** (OS, browser, Node version)
5. **Screenshots or error messages**
6. **Code snippets** if applicable

**Bug Report Template:**
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
- OS: [e.g., Ubuntu 20.04]
- Browser: [e.g., Chrome 91]
- Node Version: [e.g., 20.5.0]

**Additional Context:**
Any other relevant information
```

### Feature Requests

For feature requests, please include:

1. **Clear description** of the proposed feature
2. **Use case** and benefits
3. **Implementation suggestions** (optional)
4. **Mockups or examples** (if applicable)

**Feature Request Template:**
```markdown
## Feature Request

**Problem:**
What problem does this feature solve?

**Solution:**
Describe the proposed solution

**Alternatives:**
Any alternative solutions considered?

**Additional Context:**
Any other relevant information
```

## Community

### Communication Channels

- **GitHub Issues**: For bug reports and feature requests
- **GitHub Discussions**: For general questions and discussions
- **Discord**: For real-time community support (if available)

### Getting Help

1. **Check existing documentation** first
2. **Search GitHub Issues** for similar problems
3. **Create a new issue** if no existing solution found
4. **Join community discussions** for help

### Recognition

Contributors are recognized through:

- **GitHub Contributors list**
- **Changelog entries** for significant contributions
- **Social media mentions** for major features
- **Contributor badges** for consistent contributors

## Recognition & Rewards

### Contribution Recognition

We recognize contributions in several ways:

- **GitHub Contributors**: Automatic recognition on the repository
- **Changelog**: Major features and fixes mentioned in release notes
- **Social Media**: Shoutouts for significant contributions
- **Swag**: Digital badges and certificates for top contributors

### Contribution Levels

- **Contributor**: First merged PR
- **Regular Contributor**: 5+ merged PRs
- **Core Contributor**: 20+ merged PRs or significant impact
- **Maintainer**: Commit access and review responsibilities

### Rewards Program

For significant contributions, we offer:

- **Bounties**: Paid rewards for complex features or bug fixes
- **NFT Badges**: Exclusive DogeGift contributor NFTs
- **Priority Support**: Direct access to maintainers
- **Feature Requests**: Input on future development priorities

## License

By contributing to DogeGift, you agree that your contributions will be licensed under the same license as the project (MIT License).

## Acknowledgments

Thank you to all contributors who help make DogeGift better! Your time and expertise are greatly appreciated.

---

Happy contributing! 🎉</content>
<parameter name="filePath">/home/ravi/dogeFull/CONTRIBUTING.md
