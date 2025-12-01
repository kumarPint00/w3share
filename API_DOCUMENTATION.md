# 📡 DogeGift API Documentation

## Overview

The DogeGift API provides a comprehensive REST interface for managing digital gifts on the blockchain. This documentation covers all endpoints, request/response formats, and integration examples.

## Base URL
```
Production: https://api.dogegift.com
Development: http://localhost:3000
```

## Authentication

### SIWE (Sign-In with Ethereum)

DogeGift uses Ethereum wallet signatures for authentication via the Sign-In with Ethereum (SIWE) standard.

#### Request Nonce
```http
POST /auth/wallet-nonce
Content-Type: application/json

{
  "address": "0x742d35Cc6634C0532925a3b8D0D78E4C2bDBe5C1"
}
```

**Response:**
```json
{
  "nonce": "abcd1234-5678-90ef-ghij-klmnopqrstuv"
}
```

#### Authenticate with Signature
```http
POST /auth/siwe
Content-Type: application/json

{
  "message": "dogegift.com wants you to sign in with your Ethereum account:\n0x742d35Cc6634C0532925a3b8D0D78E4C2bDBe5C1\n\nSign in to DogeGift\n\nURI: https://dogegift.com\nVersion: 1\nChain ID: 1\nNonce: abcd1234-5678-90ef-ghij-klmnopqrstuv\nIssued At: 2024-01-01T00:00:00.000Z\nExpiration Time: 2024-01-01T01:00:00.000Z\nNot Before: 2024-01-01T00:00:00.000Z\nRequest ID: 12345678-90ab-cdef-1234-567890abcdef\nResources:\n- https://dogegift.com/terms\n- https://dogegift.com/privacy",
  "signature": "0x1234567890abcdef..."
}
```

**Response:**
```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "address": "0x742d35Cc6634C0532925a3b8D0D78E4C2bDBe5C1"
  }
}
```

#### Get Session
```http
GET /auth/session
Authorization: Bearer <access_token>
```

**Response:**
```json
{
  "address": "0x742d35Cc6634C0532925a3b8D0D78E4C2bDBe5C1",
  "loginAt": "2024-01-01T00:00:00.000Z"
}
```

## Assets API

### Get ERC20 Token Balances
Retrieve ERC20 token balances for a wallet address.

```http
GET /assets/erc20?address=0x742d35Cc6634C0532925a3b8D0D78E4C2bDBe5C1
Authorization: Bearer <access_token>
```

**Query Parameters:**
- `address` (required): Ethereum wallet address
- `pageKey` (optional): For pagination

**Response:**
```json
{
  "balances": [
    {
      "contract": "0xA0b86a33E6441e88C5F2712C3E9b74Ec6F6e6e88",
      "name": "USD Coin",
      "symbol": "USDC",
      "decimals": 6,
      "balance": "1000000000",
      "formattedBalance": "1000.00"
    }
  ],
  "pageKey": "next_page_key"
}
```

### Get NFT Holdings
Retrieve NFTs owned by a wallet address.

```http
GET /assets/nft?address=0x742d35Cc6634C0532925a3b8D0D78E4C2bDBe5C1
Authorization: Bearer <access_token>
```

**Query Parameters:**
- `address` (required): Ethereum wallet address
- `pageKey` (optional): For pagination

**Response:**
```json
{
  "nfts": [
    {
      "contract": "0xBC4CA0EdA7647A8aB7C2061c2E118A18a936f13D",
      "tokenId": "1234",
      "name": "Bored Ape Yacht Club",
      "symbol": "BAYC",
      "image": "https://ipfs.io/ipfs/...",
      "description": "A bored ape..."
    }
  ],
  "pageKey": "next_page_key"
}
```

### Get Supported Tokens
Retrieve the allowlist of supported tokens.

```http
GET /assets/tokens/allow-list
```

**Response:**
```json
{
  "tokens": [
    {
      "contract": "0xA0b86a33E6441e88C5F2712C3E9b74Ec6F6e6e88",
      "name": "USD Coin",
      "symbol": "USDC",
      "decimals": 6,
      "logo": "https://assets.coingecko.com/coins/images/6319/thumb/USD_Coin_icon.png"
    }
  ]
}
```

## Gift Packs API

### Create Gift Pack
Create a new draft gift pack.

```http
POST /giftpacks
Authorization: Bearer <access_token>
Content-Type: application/json

{
  "senderAddress": "0x742d35Cc6634C0532925a3b8D0D78E4C2bDBe5C1",
  "message": "Happy Birthday! Hope you have an amazing day! 🎉",
  "expiry": "2024-12-31T23:59:59.000Z",
  "giftCode": "BIRTHDAY2024"
}
```

**Request Body:**
- `senderAddress` (required): Ethereum address of the sender
- `message` (optional): Personal message for the recipient
- `expiry` (required): ISO 8601 date string for gift expiry
- `giftCode` (optional): Secret code for claiming (auto-generated if not provided)

**Response:**
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "senderAddress": "0x742d35Cc6634C0532925a3b8D0D78E4C2bDBe5C1",
  "message": "Happy Birthday! Hope you have an amazing day! 🎉",
  "expiry": "2024-12-31T23:59:59.000Z",
  "status": "DRAFT",
  "giftCode": "BIRTHDAY2024",
  "createdAt": "2024-01-01T00:00:00.000Z",
  "updatedAt": "2024-01-01T00:00:00.000Z"
}
```

### Get Gift Pack
Retrieve details of a specific gift pack.

```http
GET /giftpacks/{id}
Authorization: Bearer <access_token>
```

**Path Parameters:**
- `id` (required): Gift pack UUID

**Response:**
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "senderAddress": "0x742d35Cc6634C0532925a3b8D0D78E4C2bDBe5C1",
  "message": "Happy Birthday! Hope you have an amazing day! 🎉",
  "expiry": "2024-12-31T23:59:59.000Z",
  "status": "DRAFT",
  "giftCode": "BIRTHDAY2024",
  "items": [
    {
      "id": "660e8400-e29b-41d4-a716-446655440001",
      "type": "ERC20",
      "contract": "0xA0b86a33E6441e88C5F2712C3E9b74Ec6F6e6e88",
      "amount": "1000000000",
      "createdAt": "2024-01-01T00:00:00.000Z"
    }
  ],
  "createdAt": "2024-01-01T00:00:00.000Z",
  "updatedAt": "2024-01-01T00:00:00.000Z"
}
```

### Update Gift Pack
Update metadata of a draft gift pack.

```http
PATCH /giftpacks/{id}
Authorization: Bearer <access_token>
Content-Type: application/json

{
  "message": "Updated message for the gift!",
  "expiry": "2024-12-25T23:59:59.000Z"
}
```

**Response:**
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "message": "Updated message for the gift!",
  "expiry": "2024-12-25T23:59:59.000Z",
  "updatedAt": "2024-01-01T00:05:00.000Z"
}
```

### Delete Gift Pack
Delete a draft gift pack.

```http
DELETE /giftpacks/{id}
Authorization: Bearer <access_token>
```

**Response:**
```json
{
  "message": "Gift pack deleted successfully"
}
```

### Add Item to Gift Pack
Add an asset to a draft gift pack.

```http
POST /giftpacks/{id}/items
Authorization: Bearer <access_token>
Content-Type: application/json

{
  "type": "ERC20",
  "contract": "0xA0b86a33E6441e88C5F2712C3E9b74Ec6F6e6e88",
  "amount": "500000000"
}
```

**Request Body:**
- `type` (required): "ERC20" or "ERC721"
- `contract` (required): Token contract address
- `amount` (required for ERC20): Amount in wei/smallest unit
- `tokenId` (required for ERC721): NFT token ID

**Response:**
```json
{
  "id": "660e8400-e29b-41d4-a716-446655440001",
  "type": "ERC20",
  "contract": "0xA0b86a33E6441e88C5F2712C3E9b74Ec6F6e6e88",
  "amount": "500000000",
  "createdAt": "2024-01-01T00:10:00.000Z"
}
```

### Remove Item from Gift Pack
Remove an item from a draft gift pack.

```http
DELETE /giftpacks/{id}/items/{itemId}
Authorization: Bearer <access_token>
```

**Response:**
```json
{
  "message": "Item removed successfully"
}
```

### Get User Gift Packs
Retrieve gift packs created by a user.

```http
GET /giftpacks/user/{address}
Authorization: Bearer <access_token>
```

**Query Parameters:**
- `status` (optional): Filter by status (DRAFT, LOCKED, CLAIMED, EXPIRED)
- `limit` (optional): Number of results (default: 10)
- `offset` (optional): Pagination offset (default: 0)

**Response:**
```json
{
  "giftpacks": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "status": "LOCKED",
      "giftIdOnChain": 123,
      "expiry": "2024-12-31T23:59:59.000Z",
      "createdAt": "2024-01-01T00:00:00.000Z"
    }
  ],
  "total": 1,
  "limit": 10,
  "offset": 0
}
```

### Get User Claimed Gifts
Retrieve gift packs claimed by a user.

```http
GET /giftpacks/claimed/{address}
Authorization: Bearer <access_token>
```

**Response:**
```json
{
  "claimedGifts": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "giftIdOnChain": 123,
      "claimedAt": "2024-01-02T00:00:00.000Z",
      "items": [
        {
          "type": "ERC20",
          "contract": "0xA0b86a33E6441e88C5F2712C3E9b74Ec6F6e6e88",
          "amount": "1000000000"
        }
      ]
    }
  ]
}
```

### Lock Gift Pack
Deploy a gift pack to the blockchain (irreversible).

```http
POST /giftpacks/{id}/lock
Authorization: Bearer <access_token>
```

**Response:**
```json
{
  "giftId": 123,
  "transactionHash": "0xabcdef1234567890...",
  "blockNumber": 18500000,
  "gasUsed": "250000"
}
```

### Validate Gift Pack
Validate a gift pack before locking.

```http
GET /giftpacks/{id}/validate
Authorization: Bearer <access_token>
```

**Response:**
```json
{
  "isValid": true,
  "errors": [],
  "warnings": [],
  "estimatedGas": "200000",
  "estimatedCost": "0.01"
}
```

### Get On-Chain Gift Status
Retrieve status of a gift from the blockchain.

```http
GET /giftpacks/status/{giftId}
```

**Path Parameters:**
- `giftId` (required): On-chain gift ID (number)

**Response:**
```json
{
  "exists": true,
  "claimed": false,
  "sender": "0x742d35Cc6634C0532925a3b8D0D78E4C2bDBe5C1",
  "expiryTimestamp": 1735689599,
  "assetType": "ERC20",
  "tokenAddress": "0xA0b86a33E6441e88C5F2712C3E9b74Ec6F6e6e88",
  "amount": "1000000000"
}
```

## Claims API

### Submit Claim
Submit a gasless claim for a gift.

```http
POST /claim
Authorization: Bearer <access_token>
Content-Type: application/json

{
  "giftId": 123,
  "claimer": "0x1234567890123456789012345678901234567890"
}
```

**Request Body (Alternative 1 - by Gift ID):**
- `giftId` (required): On-chain gift ID
- `claimer` (required): Ethereum address of the claimer

**Request Body (Alternative 2 - by Gift Code):**
- `giftCode` (required): Secret gift code
- `claimer` (required): Ethereum address of the claimer

**Response:**
```json
{
  "taskId": "0x1234567890abcdef...",
  "estimatedCompletion": "30 seconds"
}
```

### Get Claim Status
Check the status of a claim.

```http
GET /claim/status/{taskId}
Authorization: Bearer <access_token>
```

**Path Parameters:**
- `taskId` (required): Gelato task ID from claim submission

**Response:**
```json
{
  "status": "COMPLETED",
  "transactionHash": "0xabcdef1234567890...",
  "completedAt": "2024-01-01T00:05:00.000Z",
  "gasUsed": "150000"
}
```

## Health Check API

### Health Check
Check if the API is running properly.

```http
GET /healthz
```

**Response:**
```json
{
  "status": "ok",
  "timestamp": "2024-01-01T00:00:00.000Z",
  "version": "1.0.0"
}
```

## Error Responses

All API endpoints follow consistent error response formats:

### Authentication Error
```json
{
  "statusCode": 401,
  "message": "Unauthorized",
  "error": "Unauthorized"
}
```

### Validation Error
```json
{
  "statusCode": 400,
  "message": [
    "senderAddress must be a valid Ethereum address",
    "expiry must be a valid ISO 8601 date string"
  ],
  "error": "Bad Request"
}
```

### Not Found Error
```json
{
  "statusCode": 404,
  "message": "Gift pack not found",
  "error": "Not Found"
}
```

### Blockchain Error
```json
{
  "statusCode": 500,
  "message": "Transaction failed: insufficient funds for gas",
  "error": "Internal Server Error"
}
```

## Rate Limiting

API endpoints are rate limited to prevent abuse:

- **Authenticated requests**: 100 requests per minute
- **Asset queries**: 50 requests per minute
- **Health checks**: Unlimited

Rate limit headers are included in responses:
```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 99
X-RateLimit-Reset: 1704067200
```

## Webhooks

### Claim Completion Webhook
DogeGift can send webhooks when claims are completed.

**Configuration:**
Set the webhook URL in your environment:
```bash
CLAIM_WEBHOOK_URL=https://your-app.com/webhooks/claim
```

**Payload:**
```json
{
  "event": "claim.completed",
  "taskId": "0x1234567890abcdef...",
  "giftId": 123,
  "claimer": "0x1234567890123456789012345678901234567890",
  "transactionHash": "0xabcdef1234567890...",
  "completedAt": "2024-01-01T00:05:00.000Z"
}
```

## SDKs and Libraries

### JavaScript SDK
```javascript
import { DogeGiftAPI } from '@dogegift/sdk';

const client = new DogeGiftAPI({
  baseURL: 'https://api.dogegift.com',
  apiKey: 'your-api-key'
});

// Authenticate
const { accessToken } = await client.auth.siwe(message, signature);

// Create gift pack
const giftPack = await client.giftpacks.create({
  senderAddress: '0x...',
  message: 'Happy Birthday!',
  expiry: '2024-12-31T23:59:59.000Z'
});

// Add item
await client.giftpacks.addItem(giftPack.id, {
  type: 'ERC20',
  contract: '0xA0b86a33E6441e88C5F2712C3E9b74Ec6F6e6e88',
  amount: '1000000000'
});

// Lock on blockchain
const result = await client.giftpacks.lock(giftPack.id);
```

### Python SDK
```python
from dogegift import DogeGiftAPI

client = DogeGiftAPI(
    base_url='https://api.dogegift.com',
    api_key='your-api-key'
)

# Authenticate
token = client.auth.siwe(message, signature)

# Create and lock gift
gift_pack = client.giftpacks.create({
    'sender_address': '0x...',
    'message': 'Happy Birthday!',
    'expiry': '2024-12-31T23:59:59.000Z'
})

client.giftpacks.add_item(gift_pack['id'], {
    'type': 'ERC20',
    'contract': '0xA0b86a33E6441e88C5F2712C3E9b74Ec6F6e6e88',
    'amount': '1000000000'
})

result = client.giftpacks.lock(gift_pack['id'])
```

## Testing

### Testnet Endpoints
Use these endpoints for testing on Sepolia testnet:

```
Base URL: https://api-testnet.dogegift.com
Chain ID: 11155111
```

### Test Tokens
```javascript
// Get test ETH from faucet
// https://sepoliafaucet.com/

// Test token addresses on Sepolia
const TEST_TOKENS = {
  USDC: '0x1234567890123456789012345678901234567890',
  DAI: '0x0987654321098765432109876543210987654321'
};
```

## Changelog

### Version 1.0.0
- Initial release
- Basic gift creation and claiming
- ERC20 and ERC721 support
- Gasless claims via Gelato

### Version 1.1.0 (Upcoming)
- Multi-asset gifts
- Bulk operations
- Enhanced validation
- Webhook support

## Support

### Documentation
- [User Guide](./USER_GUIDE.md)
- [Developer Guide](./DEVELOPER_GUIDE.md)
- [Smart Contracts](./SMART_CONTRACTS.md)

### Community
- **Discord**: [Join our community](https://discord.gg/dogegift)
- **GitHub Issues**: [Report API issues](https://github.com/dogegift/dogegift/issues)
- **Email**: api-support@dogegift.com

### Status Page
- **API Status**: [status.dogegift.com](https://status.dogegift.com)
- **Uptime**: 99.9% SLA
- **Response Time**: <200ms average

---

**Last updated:** January 1, 2024
**API Version:** 1.0.0</content>
<parameter name="filePath">/home/ravi/dogeFull/API_DOCUMENTATION.md
