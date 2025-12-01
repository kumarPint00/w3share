# 🔄 Development Workflow Guide

## The Problem You Encountered

When developing with local blockchain + persistent database, you get this conflict:

1. **Blockchain resets** → Gift IDs start from 0 again
2. **Database persists** → Still has old records with those Gift IDs  
3. **Unique constraint fails** → Can't insert duplicate `giftIdOnChain`

## 🚀 Recommended Development Workflows

### Option 1: Full Reset (Clean Slate) ⭐ Recommended
```bash
# Complete reset - database + blockchain
./scripts/fresh-dev-start.sh
```
**Use when:** Starting fresh development session, testing from scratch

### Option 2: Keep Database, Reset Blockchain Only
```bash
# 1. Stop Hardhat
pkill -f hardhat

# 2. Restart Hardhat  
cd backend/blockchain && npx hardhat node &

# 3. Deploy contracts
npx hardhat run scripts/deploy-all.js --network localhost

# 4. Continue development
```
**Use when:** You want to keep your test data but need fresh blockchain

### Option 3: Smart Conflict Resolution (Already Implemented)
The code now automatically handles this conflict:
- Detects duplicate `giftIdOnChain` 
- Clears conflicting records
- Continues with the operation

**Use when:** You want seamless development without manual resets

## 🎯 Testing Strategies

### For Feature Development
```bash
# Start clean every time
./scripts/fresh-dev-start.sh

# Develop your feature
# Test end-to-end
# When satisfied, commit your changes
```

### For Bug Fixing  
```bash
# Use existing data if relevant to the bug
./run_dev.sh  # Just redeploy contracts

# Or start fresh if you need clean state
./scripts/fresh-dev-start.sh
```

### For Integration Testing
```bash
# Method 1: Fresh environment
./scripts/fresh-dev-start.sh

# Method 2: Use testnet (more realistic)
# Update .env to point to actual testnet
# Deploy contracts to testnet once
# Test against persistent testnet state
```

## 🌐 Moving to Testnet

For more realistic testing, consider using a testnet:

### Sepolia Testnet Setup
```bash
# 1. Get testnet ETH from faucet
# 2. Update .env:
GIFT_ESCROW_CHAIN_ID=11155111
GIFT_ESCROW_RPC_URL=https://sepolia.infura.io/v3/YOUR_KEY
WRAPPED_NATIVE_ADDRESS=0x7b79995e5f793A07Bc00c21412e50Ecae098E7f9

# 3. Deploy once to testnet
cd backend/blockchain
npx hardhat run scripts/deploy-all.js --network sepolia

# 4. Update .env with new addresses
# 5. Test - contracts persist between sessions!
```

## 📊 Current State

Your app now handles the blockchain reset gracefully:
- ✅ Contracts deploy to same addresses
- ✅ Database conflicts are automatically resolved  
- ✅ You can develop without manual address updates
- ✅ Choose between fresh start or continue with data

## 🔧 Quick Commands

```bash
# Fresh everything
./scripts/fresh-dev-start.sh

# Just restart with existing data  
./run_dev.sh

# Check if services are running
curl http://localhost:4000/health
curl http://localhost:3000
curl -X POST http://127.0.0.1:8545 -d '{"jsonrpc":"2.0","method":"eth_blockNumber","id":1}'
```
