#!/bin/bash

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${YELLOW}🔄 Resetting Hardhat node and deploying contracts...${NC}"

# Kill any existing Hardhat processes
echo -e "${YELLOW}🛑 Stopping existing Hardhat processes...${NC}"
pkill -f "hardhat node" || true
sleep 2

# Start fresh Hardhat node in background
echo -e "${YELLOW}🚀 Starting fresh Hardhat node...${NC}"
cd backend/blockchain
npx hardhat node > ../../hardhat.log 2>&1 &
HARDHAT_PID=$!
cd ../..

# Wait for node to start
echo -e "${YELLOW}⏳ Waiting for Hardhat node to start...${NC}"
sleep 5

# Check if node is running
if ! curl -s -X POST http://127.0.0.1:8545 -H "Content-Type: application/json" -d '{"jsonrpc":"2.0","method":"eth_blockNumber","params":[],"id":1}' > /dev/null 2>&1; then
    echo -e "${RED}❌ Failed to start Hardhat node${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Hardhat node is running${NC}"

# Deploy contracts
echo -e "${YELLOW}📦 Deploying contracts...${NC}"
cd backend/blockchain
npx hardhat run scripts/deploy-all.js --network localhost

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Contracts deployed successfully!${NC}"
    echo -e "${YELLOW}📋 Contract addresses should now be:${NC}"
    echo -e "  • GiftEscrow: 0x5FbDB2315678afecb367f032d93F642f64180aa3"
    echo -e "  • WETH: 0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512"
    echo -e "${GREEN}🎉 Ready for testing!${NC}"
else
    echo -e "${RED}❌ Contract deployment failed${NC}"
    exit 1
fi
