# DogeGift Contract Admin System

A standalone microservice architecture to manage DogeGift platform's smart contract operations.

## Components

1. **Contract Admin Service** - Backend REST API that interfaces with the blockchain
2. **Contract Admin UI** - React-based web interface for administrators

## Features

- **Simple Contract Management**: View status and control contract operations
- **Three Core Actions**: Start, pause, and stop contract operations
- **Security**: API key authentication and ownership verification
- **Independent Deployment**: Can be run separately from the main application

## Quick Start

### Prerequisites
- Docker and Docker Compose installed
- Environment variables configured

### Environment Setup

1. Configure Contract Admin Service:
   ```bash
   cd contract-admin-service
   cp .env.example .env
   # Edit .env file with your configuration:
   # - RPC_URL: Ethereum RPC URL
   # - PRIVATE_KEY: Admin wallet private key
   # - CONTRACT_ADDRESS: GiftEscrowPausable contract address
   # - API_KEY: Secret key for admin authentication
   ```

2. Configure Contract Admin UI:
   ```bash
   cd contract-admin-ui
   cp .env.example .env
   # Edit .env file with your configuration:
   # - REACT_APP_API_URL: URL for the admin service API
   ```

### Running with Docker

Start both services with a single command:

```bash
docker-compose -f docker-compose.admin.yml up -d
```

This will:
1. Build and start the Contract Admin Service (backend)
2. Build and start the Contract Admin UI (frontend)

### Accessing the Admin UI

Open your browser and navigate to:
```
http://localhost:3002
```

Log in using the API key configured in the backend service.

## Manual Setup

If you prefer to run the services directly:

1. Start the Contract Admin Service:
   ```bash
   cd contract-admin-service
   npm install
   npm run build
   npm start
   ```

2. Start the Contract Admin UI:
   ```bash
   cd contract-admin-ui
   npm install
   npm start
   ```

## Usage

1. **Login**: Enter your API key on the login screen
2. **Dashboard**: View contract status and control operations with three buttons:
   - **Start**: Resume contract operations
   - **Pause**: Temporarily suspend contract operations
   - **Stop**: Completely stop contract operations

## Security Notes

- The admin service requires API key authentication
- Contract functions are protected by the `onlyOwner` modifier
- The backend verifies caller is the contract owner before executing operations
