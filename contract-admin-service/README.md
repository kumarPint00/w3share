# DogeGift Contract Admin Service

A microservice for managing the DogeGift platform's smart contract timer functionality, enabling administrators to pause/resume operations and control the contract's active time period.

## Features

- **Contract Status Monitoring**: Check if the contract is paused, active, and view time remaining
- **Pause/Unpause Controls**: Toggle the contract's operational state
- **Timer Management**: Extend the contract's active period or set a specific end date
- **RESTful API**: Simple HTTP endpoints for all contract management functions
- **Security**: API key authentication and owner-only access control for sensitive operations
- **Independent Architecture**: Works standalone without dependencies on the main application

## API Endpoints

### Public Endpoints

- `GET /api/v1/status` - Get basic contract status information

### Admin Endpoints (Requires API Key)

- `GET /api/v1/admin/status` - Get detailed contract status with owner information
- `POST /api/v1/admin/pause` - Pause the contract
- `POST /api/v1/admin/unpause` - Unpause the contract
- `POST /api/v1/admin/extend` - Extend the contract active timer (requires `days` parameter)
- `POST /api/v1/admin/set-end-date` - Set a specific end date for the contract (requires `timestamp` parameter)

## Setup and Installation

### Prerequisites

- Node.js v18+ and npm
- Ethereum wallet with owner permissions on the deployed GiftEscrowPausable contract
- Access to Sepolia testnet (or other network where contract is deployed)

### Installation

1. Clone the repository
2. Install dependencies:
   ```
   npm install
   ```
3. Copy `.env.example` to `.env` and configure:
   ```
   cp .env.example .env
   ```
4. Configure environment variables in `.env`:
   - `RPC_URL`: Ethereum RPC URL (e.g., Infura or Alchemy endpoint)
   - `PRIVATE_KEY`: Private key of the wallet with owner permissions
   - `CONTRACT_ADDRESS`: Address of the deployed GiftEscrowPausable contract
   - `API_KEY`: Secret key for admin API authentication
   - `ALLOWED_ORIGINS`: Comma-separated list of allowed CORS origins

5. Build the application:
   ```
   npm run build
   ```

6. Start the server:
   ```
   npm start
   ```

### Docker Deployment

You can also run this service using Docker:

```bash
# Build and start the container
docker-compose up -d

# View logs
docker-compose logs -f
```

## Usage Examples

### Get Contract Status

```bash
curl -X GET http://localhost:3001/api/v1/status
```

### Pause the Contract

```bash
curl -X POST http://localhost:3001/api/v1/admin/pause \
  -H "x-api-key: your_admin_api_key_here" \
  -H "Content-Type: application/json"
```

### Extend Contract Timer

```bash
curl -X POST http://localhost:3001/api/v1/admin/extend \
  -H "x-api-key: your_admin_api_key_here" \
  -H "Content-Type: application/json" \
  -d '{"days": 30}'
```

### Set Specific End Date

```bash
curl -X POST http://localhost:3001/api/v1/admin/set-end-date \
  -H "x-api-key: your_admin_api_key_here" \
  -H "Content-Type: application/json" \
  -d '{"timestamp": 1738774400}'  # Example: 2025-01-01T00:00:00Z
```

## Security Considerations

This service implements two levels of security:

1. **API Key Authentication**: Required for all admin endpoints
2. **Contract Owner Verification**: The wallet associated with the private key must be the contract owner

## Integration with DogeGift Platform

This microservice is designed to run independently but can be easily integrated with the DogeGift frontend:

1. Deploy this service separately with its own configuration
2. Create an admin panel in the DogeGift frontend that makes API calls to this service
3. Secure the communication between the main application and this service using the API key

## License

[MIT](LICENSE)
