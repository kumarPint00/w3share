# Multi-Network API Reference

## Overview
The DogeGift backend now supports **ERC-20 token and NFT fetching from 13+ blockchain networks**. All endpoints accept an optional `chainId` query parameter to specify the target network.

## Networks

### Mainnets (Production)
| Network | Chain ID | Name |
|---------|----------|------|
| Ethereum | 1 | Ethereum Mainnet |
| Polygon | 137 | Polygon Mainnet |
| Arbitrum | 42161 | Arbitrum Mainnet |
| Optimism | 10 | Optimism Mainnet |
| Base | 8453 | Base Mainnet |
| Avalanche | 43114 | Avalanche Mainnet |

### Testnets (Development)
| Network | Chain ID | Name |
|---------|----------|------|
| Ethereum | 11155111 | Ethereum Sepolia ⭐ |
| Ethereum | 5 | Ethereum Goerli (Legacy) |
| Polygon | 80001 | Polygon Mumbai |
| Arbitrum | 421614 | Arbitrum Sepolia |
| Optimism | 11155420 | Optimism Sepolia |
| Base | 84532 | Base Sepolia |
| Avalanche | 43113 | Avalanche Fuji |

⭐ **Current smart contract deployment** - gifting only works on Sepolia

## API Endpoints

### 1. Get Supported Networks

Returns list of all supported networks with metadata.

**Endpoint:** `GET /assets/supported-networks`

**Query Parameters:** None

**Example Request:**
```bash
curl http://localhost:4000/assets/supported-networks
```

**Example Response:**
```json
{
  "networks": [
    {
      "chainId": 1,
      "name": "Ethereum Mainnet",
      "type": "mainnet"
    },
    {
      "chainId": 11155111,
      "name": "Ethereum Sepolia",
      "type": "testnet"
    },
    {
      "chainId": 137,
      "name": "Polygon Mainnet",
      "type": "mainnet"
    },
    {
      "chainId": 80001,
      "name": "Polygon Mumbai",
      "type": "testnet"
    },
    {
      "chainId": 42161,
      "name": "Arbitrum Mainnet",
      "type": "mainnet"
    },
    {
      "chainId": 421614,
      "name": "Arbitrum Sepolia",
      "type": "testnet"
    },
    {
      "chainId": 10,
      "name": "Optimism Mainnet",
      "type": "mainnet"
    },
    {
      "chainId": 11155420,
      "name": "Optimism Sepolia",
      "type": "testnet"
    },
    {
      "chainId": 8453,
      "name": "Base Mainnet",
      "type": "mainnet"
    },
    {
      "chainId": 84532,
      "name": "Base Sepolia",
      "type": "testnet"
    },
    {
      "chainId": 43114,
      "name": "Avalanche Mainnet",
      "type": "mainnet"
    },
    {
      "chainId": 43113,
      "name": "Avalanche Fuji",
      "type": "testnet"
    },
    {
      "chainId": 5,
      "name": "Ethereum Goerli",
      "type": "testnet"
    }
  ]
}
```

---

### 2. Get ERC-20 Token Balances

Fetch all ERC-20 tokens held by a wallet address on specified network.

**Endpoint:** `GET /assets/erc20`

**Query Parameters:**
| Parameter | Type | Required | Default | Example | Description |
|-----------|------|----------|---------|---------|-------------|
| `address` | string | ✅ Yes | - | `0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48` | Wallet address to query |
| `chainId` | number | ❌ No | 11155111 | `1` | Target blockchain network |

**Example Requests:**

Ethereum Mainnet:
```bash
curl "http://localhost:4000/assets/erc20?address=0xYourWalletAddress&chainId=1"
```

Polygon Mainnet:
```bash
curl "http://localhost:4000/assets/erc20?address=0xYourWalletAddress&chainId=137"
```

Arbitrum Mainnet:
```bash
curl "http://localhost:4000/assets/erc20?address=0xYourWalletAddress&chainId=42161"
```

Ethereum Sepolia (default):
```bash
curl "http://localhost:4000/assets/erc20?address=0xYourWalletAddress"
```

**Example Response:**
```json
[
  {
    "contract": "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48",
    "contractAddress": "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48",
    "symbol": "USDC",
    "name": "USDC Coin",
    "decimals": 6,
    "balance": "0x5a0f180",
    "balanceFormatted": 95.0,
    "logoURI": "/tokens/usdc.png",
    "chainId": 1
  },
  {
    "contract": "0xdAC17F958D2ee523a2206206994597C13D831ec7",
    "contractAddress": "0xdAC17F958D2ee523a2206206994597C13D831ec7",
    "symbol": "USDT",
    "name": "Tether USD",
    "decimals": 6,
    "balance": "0x1b7a000",
    "balanceFormatted": 450.0,
    "logoURI": "/tokens/usdt.png",
    "chainId": 1
  }
]
```

**Response Fields:**
- `contract` - Token contract address (checksummed)
- `contractAddress` - Token contract address (duplicate for compatibility)
- `symbol` - Token symbol (e.g., USDC, USDT)
- `name` - Full token name
- `decimals` - Number of decimal places
- `balance` - Raw balance in hex format
- `balanceFormatted` - Human-readable balance (already scaled by decimals)
- `logoURI` - URL to token logo
- `chainId` - The network this token is from

**Error Responses:**

Invalid Address:
```json
{
  "statusCode": 400,
  "message": "Invalid Ethereum address",
  "error": "Bad Request"
}
```

Unknown Network (falls back to Sepolia):
```bash
# Backend logs: "Unknown chain ID 999, defaulting to Sepolia"
# Returns tokens from Sepolia instead
```

---

### 3. Get NFTs

Fetch all NFTs owned by a wallet address on specified network.

**Endpoint:** `GET /assets/nft`

**Query Parameters:**
| Parameter | Type | Required | Default | Example | Description |
|-----------|------|----------|---------|---------|-------------|
| `address` | string | ✅ Yes | - | `0x742d35Cc6634C0532925a3b844Bc151e5c75B6fA` | Wallet address to query |
| `chainId` | number | ❌ No | 11155111 | `1` | Target blockchain network |
| `pageKey` | string | ❌ No | - | `abc123def456` | Pagination key for next page |

**Example Requests:**

Ethereum Mainnet (with pagination):
```bash
curl "http://localhost:4000/assets/nft?address=0xYourWalletAddress&chainId=1"
```

Polygon Mainnet:
```bash
curl "http://localhost:4000/assets/nft?address=0xYourWalletAddress&chainId=137"
```

Get next page:
```bash
curl "http://localhost:4000/assets/nft?address=0xYourWalletAddress&chainId=1&pageKey=abc123"
```

**Example Response:**
```json
{
  "nfts": [
    {
      "contract": "0xBC4CA0EdA7647A8aB7C2061c2E118A18a936f13D",
      "tokenId": "1234",
      "name": "Bored Ape Yacht Club #1234",
      "description": "The Bored Ape Yacht Club is a collection of 10,000...",
      "image": "ipfs://QmRRPWG96cmgTn2JSvM4GGVfM2v24kebtSnMntvg4HST7",
      "tokenType": "ERC721",
      "contractName": "BoredApeYachtClub",
      "totalSupply": "10000",
      "chainId": 1
    },
    {
      "contract": "0x00000000006c3852cbEf3e08E8dF289169EdE581",
      "tokenId": "5678",
      "name": "OpenSea Collection Item",
      "image": "https://api.opensea.io/...",
      "tokenType": "ERC1155",
      "contractName": "OpenSeaContract",
      "chainId": 1
    }
  ],
  "pageKey": "next_page_key_if_more_results"
}
```

**Response Fields:**
- `nfts` - Array of NFT objects
  - `contract` - NFT contract address
  - `tokenId` - Unique token identifier
  - `name` - NFT name/title
  - `description` - NFT description (if available)
  - `image` - URL/IPFS link to image
  - `tokenType` - ERC721 or ERC1155
  - `contractName` - Collection name
  - `totalSupply` - Total supply of collection
  - `chainId` - The network this NFT is on
- `pageKey` - Key for next page (if more results exist)

---

## Usage in Frontend

### React Hook Example

```typescript
import { useEffect, useState } from 'react';

function TokenFetcher({ address }: { address: string }) {
  const [tokens, setTokens] = useState([]);
  const [chainId, setChainId] = useState(11155111);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchTokens = async () => {
      setLoading(true);
      try {
        const response = await fetch(
          `http://localhost:4000/assets/erc20?address=${address}&chainId=${chainId}`
        );
        const data = await response.json();
        setTokens(data);
      } catch (error) {
        console.error('Failed to fetch tokens:', error);
      } finally {
        setLoading(false);
      }
    };

    if (address) {
      fetchTokens();
    }
  }, [address, chainId]);

  return (
    <div>
      <h2>Tokens on Network {chainId}</h2>
      {loading && <p>Loading...</p>}
      {tokens.map((token) => (
        <div key={token.contract}>
          <h3>{token.symbol}</h3>
          <p>{token.balanceFormatted} {token.symbol}</p>
        </div>
      ))}
    </div>
  );
}
```

### Auto-Detect Network

```typescript
import { BrowserProvider } from 'ethers';

async function autoDetectNetwork() {
  const provider = new BrowserProvider(window.ethereum);
  const network = await provider.getNetwork();
  const chainId = network.chainId;
  
  // Use chainId in API calls
  const response = await fetch(
    `/assets/erc20?address=${walletAddress}&chainId=${chainId}`
  );
  return response.json();
}
```

---

## Error Handling

### Common Error Scenarios

**Invalid Address:**
```
Status: 400
{
  "statusCode": 400,
  "message": "Invalid Ethereum address",
  "error": "Bad Request"
}
```

**Unknown Network:**
- No error thrown
- Backend logs warning: "Unknown chain ID 999, defaulting to Sepolia"
- Returns tokens from Sepolia
- Frontend should display warning to user

**Rate Limit (from Alchemy):**
```
Status: 429
{
  "statusCode": 429,
  "message": "Too Many Requests"
}
```

**Alchemy API Key Missing:**
```
Status: 500
{
  "statusCode": 500,
  "message": "Internal Server Error"
}
```

---

## Rate Limiting & Performance

- **Alchemy Rate Limit:** 350 req/s (standard plan)
- **Recommendation:** Cache responses for 5-10 minutes per address/chainId combination
- **Pagination:** NFT endpoint returns up to 25 items per request

---

## Migration from Single Network to Multi-Network

### Old Code (Single Network)
```typescript
const tokens = await fetch(
  `/assets/erc20?address=${address}`
);
```

### New Code (Multi-Network)
```typescript
// Detect network automatically
const provider = new BrowserProvider(window.ethereum);
const network = await provider.getNetwork();

const tokens = await fetch(
  `/assets/erc20?address=${address}&chainId=${network.chainId}`
);
```

### With Type Safety
```typescript
interface TokenResponse {
  contract: string;
  symbol: string;
  balanceFormatted: number;
  chainId: number;
}

const tokens: TokenResponse[] = await fetch(
  `/assets/erc20?address=${address}&chainId=${chainId}`
).then(r => r.json());
```

---

## FAQ

**Q: Which network should I use by default?**
A: Ethereum Sepolia (11155111) for development. For production, use Ethereum Mainnet (1) or the network where your smart contract is deployed.

**Q: What if the user has tokens on multiple networks?**
A: Make separate API calls for each network and merge the results in your frontend.

**Q: Can I get all tokens from all networks in one call?**
A: No, you need to make separate calls per network. Consider caching results.

**Q: What happens if I pass an invalid chainId?**
A: Backend logs a warning and defaults to Sepolia, returning Sepolia tokens instead.

**Q: Do the endpoints require authentication?**
A: Yes, they require Bearer token authentication (SIWE). Add to request headers: `Authorization: Bearer <JWT_TOKEN>`

**Q: Can I gift tokens on networks other than Sepolia?**
A: Not yet. Smart contract is only deployed on Sepolia. Deploy to other networks first.

**Q: How often should I refresh token balances?**
A: Every 10-30 seconds is reasonable. Cache results to reduce API calls.

---

## Support

For issues with multi-network support:
1. Check `ALCHEMY_BASE_KEY` environment variable is set
2. Verify chain ID is in supported list
3. Ensure wallet has assets on that network
4. Check backend logs for "Unknown chain ID" warnings
5. Test with `/assets/supported-networks` endpoint first
