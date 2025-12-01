# 🏗️ Development Setup Guide

## Understanding Contract Deployment

When working with Hardhat's local blockchain, **contracts must be redeployed every time you restart the Hardhat node** because:

- Hardhat runs an **in-memory blockchain** that resets on restart
- All deployed contracts, transactions, and state are lost
- This is normal behavior for local development

## 🚀 Quick Start Options

### Option 1: Automated Setup (Recommended)
```bash
# This script handles everything automatically
./run_dev.sh
```

### Option 2: Manual Setup
```bash
# Terminal 1: Start Hardhat node
cd backend/blockchain
npx hardhat node

# Terminal 2: Deploy contracts (after node starts)
cd backend/blockchain
npx hardhat run scripts/deploy-all.js --network localhost

# Terminal 3: Start backend
cd backend
npm run start:dev

# Terminal 4: Start frontend
cd frontend
npm run dev
```

### Option 3: Just Deploy Contracts
```bash
# If Hardhat is already running, just deploy contracts
./scripts/dev-setup.sh
```

## 🔧 Contract Addresses

After deployment, your contracts will always be deployed to these addresses:
- **GiftEscrow**: `0x5FbDB2315678afecb367f032d93F642f64180aa3`
- **WETH**: `0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512`

These addresses are deterministic and will be the same every time.

## 🚨 Common Issues

### "NO_CONTRACT_CODE" Error
This means the Hardhat node was restarted and contracts need to be redeployed.

**Solution**: Run the deployment script:
```bash
cd backend/blockchain
npx hardhat run scripts/deploy-all.js --network localhost
```

### Hardhat Node Not Responding
**Check if running**:
```bash
curl -X POST http://127.0.0.1:8545 -H "Content-Type: application/json" -d '{"jsonrpc":"2.0","method":"eth_blockNumber","params":[],"id":1}'
```

**Restart if needed**:
```bash
pkill -f hardhat
cd backend/blockchain
npx hardhat node
```

## 📋 Development Workflow

1. **Start Development**: `./run_dev.sh`
2. **Work on your code** - contracts persist until node restart
3. **If you restart Hardhat node**: Re-run contract deployment
4. **Test everything** - your app should work normally

## 🔍 Verification

After deployment, verify contracts are working:
```bash
cd backend/blockchain
npx hardhat run scripts/verify-contracts.js --network localhost
```

## 💡 Production Note

This only applies to local development. On testnets and mainnet, contracts persist until you explicitly delete them or the network is reset (which rarely happens).
