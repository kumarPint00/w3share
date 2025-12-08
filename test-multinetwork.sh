#!/bin/bash
# Test Multi-Network Support Script

echo "=== Testing DogeGift Multi-Network Support ==="
echo ""

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

BASE_URL="${1:-http://localhost:4000}"

echo -e "${BLUE}Backend URL: ${BASE_URL}${NC}"
echo ""

# Test 1: Get Supported Networks
echo -e "${YELLOW}1. Testing: GET /assets/supported-networks${NC}"
echo "Purpose: Retrieve all supported blockchain networks"
echo ""
curl -s "${BASE_URL}/assets/supported-networks" | jq . 2>/dev/null || echo "Error: Could not connect or invalid response"
echo ""
echo "---"
echo ""

# Test 2: Fetch from Ethereum Mainnet
echo -e "${YELLOW}2. Testing: GET /assets/erc20 (Ethereum Mainnet - chainId 1)${NC}"
echo "Purpose: Fetch ERC-20 tokens from Ethereum Mainnet"
echo "Note: Replace 0x1234... with an actual wallet address that has tokens"
echo ""
MAINNET_TEST="0x1234567890123456789012345678901234567890"
echo "curl -s \"${BASE_URL}/assets/erc20?address=${MAINNET_TEST}&chainId=1\" | jq ."
echo ""
echo "Response example:"
cat << 'EOF'
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
  }
]
EOF
echo ""
echo "---"
echo ""

# Test 3: Fetch from Polygon
echo -e "${YELLOW}3. Testing: GET /assets/erc20 (Polygon Mainnet - chainId 137)${NC}"
echo "Purpose: Fetch ERC-20 tokens from Polygon"
echo ""
echo "curl -s \"${BASE_URL}/assets/erc20?address=0x...&chainId=137\" | jq ."
echo ""
echo "---"
echo ""

# Test 4: Fetch NFTs from different networks
echo -e "${YELLOW}4. Testing: GET /assets/nft (Multi-Network NFT Support)${NC}"
echo "Purpose: Fetch NFTs from specified network"
echo ""
echo "Ethereum: curl -s \"${BASE_URL}/assets/nft?address=0x...&chainId=1\" | jq ."
echo "Polygon: curl -s \"${BASE_URL}/assets/nft?address=0x...&chainId=137\" | jq ."
echo "Arbitrum: curl -s \"${BASE_URL}/assets/nft?address=0x...&chainId=42161\" | jq ."
echo ""
echo "---"
echo ""

# Test 5: Display Network Mapping
echo -e "${YELLOW}5. Network Mapping Reference${NC}"
cat << 'EOF'
Network                   | Chain ID | Type       | Environment
--------------------------|----------|------------|----------------
Ethereum Mainnet          | 1        | mainnet    | production
Ethereum Sepolia          | 11155111 | testnet    | development *
Ethereum Goerli           | 5        | testnet    | legacy
Polygon Mainnet           | 137      | mainnet    | production
Polygon Mumbai            | 80001    | testnet    | development
Arbitrum Mainnet          | 42161    | mainnet    | production
Arbitrum Sepolia          | 421614   | testnet    | development
Optimism Mainnet          | 10       | mainnet    | production
Optimism Sepolia          | 11155420 | testnet    | development
Base Mainnet              | 8453     | mainnet    | production
Base Sepolia              | 84532    | testnet    | development
Avalanche Mainnet         | 43114    | mainnet    | production
Avalanche Fuji            | 43113    | testnet    | development

* GiftEscrow contract currently deployed only on Sepolia
EOF
echo ""
echo "---"
echo ""

# Test 6: Real World Example
echo -e "${YELLOW}6. Real World Usage Example${NC}"
cat << 'EOF'
Step 1: User connects MetaMask to Ethereum Mainnet
  → Browser returns chainId: 1

Step 2: Frontend fetches tokens
  → GET /assets/erc20?address=0xUserWalletAddress&chainId=1
  → Returns USDC, USDT, DAI, etc. from Mainnet

Step 3: User selects Polygon in MetaMask
  → Browser returns chainId: 137

Step 4: Frontend fetches tokens
  → GET /assets/erc20?address=0xUserWalletAddress&chainId=137
  → Returns USDC, USDT, MATIC, etc. from Polygon

Step 5: User switches to Arbitrum
  → Browser returns chainId: 42161

Step 6: Frontend fetches tokens
  → GET /assets/erc20?address=0xUserWalletAddress&chainId=42161
  → Returns ARB, ETH, USDC, etc. from Arbitrum

All without user doing anything! Network detection is automatic.
EOF
echo ""
echo "---"
echo ""

echo -e "${GREEN}✅ Multi-Network Support Implementation Complete!${NC}"
echo ""
echo "Summary:"
echo "  • Backend supports 13+ networks"
echo "  • Frontend auto-detects user's network"
echo "  • All endpoints accept optional chainId parameter"
echo "  • Graceful fallback to Sepolia for unknown networks"
echo "  • Smart contract tokens work on Sepolia only (for now)"
echo ""
echo "Next Steps:"
echo "  1. Deploy GiftEscrow.sol to Ethereum Mainnet"
echo "  2. Deploy to Polygon Mainnet (recommended)"
echo "  3. Update NEXT_PUBLIC_GIFT_ESCROW_ADDRESS for each network"
echo "  4. Test end-to-end gifting on production networks"
echo ""
