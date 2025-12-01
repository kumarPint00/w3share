# DogeGifty - Docker Setup

This guide explains how to run the DogeGifty application using Docker and docker-compose.

## Prerequisites

- Docker and Docker Compose installed on your system
- Your smart contract deployed on Sepolia testnet
- Environment variables configured (see Configuration section)

## Quick Start

1. **Clone and navigate to the project directory:**
   ```bash
   cd /home/ravi/dogeFull
   ```

2. **Configure environment variables:**
   - Copy the backend environment template:
     ```bash
     cp backend/.env.template backend/.env
     ```
   - Edit `backend/.env` and update the following required variables:
     - `SEPOLIA_BASE_RPC`: Your Alchemy or Infura RPC URL
     - `DEPLOYER_PRIVATE_KEY`: Your wallet's private key (64 hex characters)
     - `GIFT_ESCROW_ADDRESS`: Your deployed smart contract address
     - `WRAPPED_NATIVE_ADDRESS`: WETH address on Sepolia

3. **Build and start all services:**
   ```bash
   docker-compose up --build
   ```

4. **Access the application:**
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:4000
   - Database: localhost:5432

## Configuration

### Smart Contract Configuration

Update these variables in `backend/.env`:

```bash
# Blockchain Network Configuration
SEPOLIA_BASE_RPC=https://eth-sepolia.g.alchemy.com/v2/YOUR_ALCHEMY_KEY
SEPOLIA_CHAIN_ID=11155111
SEPOLIA_EXPLORER_URL=https://sepolia.etherscan.io

# Deployer Wallet Configuration
DEPLOYER_PRIVATE_KEY=0xYOUR_ACTUAL_PRIVATE_KEY_HERE

# Gift Escrow Contract Configuration
GIFT_ESCROW_ADDRESS=0xYOUR_ACTUAL_CONTRACT_ADDRESS_HERE

# Wrapped Native Token Address (WETH on Sepolia)
WRAPPED_NATIVE_ADDRESS=0xfFf9976782d46CC05630D1f6eBAb18b2324d6B14
```

### Database Configuration

The PostgreSQL database is automatically configured with:
- Host: `db` (internal) / `localhost` (external)
- Port: `5432`
- Database: `dogegf`
- Username: `postgres`
- Password: `postgres`

## Docker Services

### Frontend (Next.js)
- **Port**: 3000
- **Build context**: `./frontend`
- **Dependencies**: backend service

### Backend (NestJS)
- **Port**: 4000
- **Build context**: `./backend`
- **Dependencies**: database service
- **Auto-migrations**: Runs Prisma migrations on startup

### Database (PostgreSQL)
- **Port**: 5432
- **Image**: postgres:15-alpine
- **Persistent storage**: `postgres_data` volume

## Development Commands

### Start services in detached mode:
```bash
docker-compose up -d
```

### View logs:
```bash
# All services
docker-compose logs -f

# Specific service
docker-compose logs -f backend
docker-compose logs -f frontend
docker-compose logs -f db
```

### Stop services:
```bash
docker-compose down
```

### Stop and remove volumes (⚠️ This will delete all data):
```bash
docker-compose down -v
```

### Rebuild specific service:
```bash
docker-compose up --build backend
```

### Execute commands in running containers:
```bash
# Backend shell
docker-compose exec backend sh

# Database shell
docker-compose exec db psql -U postgres -d dogegf

# Frontend shell
docker-compose exec frontend sh
```

## Troubleshooting

### Database Connection Issues
If you see database connection errors:
1. Wait for the database health check to pass
2. Check logs: `docker-compose logs db`
3. Restart services: `docker-compose restart`

### Smart Contract Issues
If smart contract interactions fail:
1. Verify your contract is deployed on Sepolia
2. Check that your private key has sufficient ETH
3. Verify the contract address is correct
4. Ensure RPC URL is working

### Port Conflicts
If ports 3000, 4000, or 5432 are already in use:
1. Stop other services using those ports
2. Or modify the port mappings in `docker-compose.yml`

### Environment Variables
Make sure all required environment variables are set in `backend/.env`.
The application will not work properly without correct smart contract configuration.

## Production Deployment

For production deployment:
1. Use a managed database service instead of the Docker database
2. Set secure values for `JWT_SECRET` and database credentials
3. Configure proper CORS origins
4. Use environment-specific configuration files
5. Set up proper SSL/TLS certificates
6. Configure monitoring and logging

## Data Persistence

- **Database data**: Stored in `postgres_data` Docker volume
- **Backend uploads**: Stored in `backend_data` Docker volume

Volumes persist between container restarts but are removed when using `docker-compose down -v`.
