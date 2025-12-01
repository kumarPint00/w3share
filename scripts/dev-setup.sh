#!/bin/bash

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${YELLOW}🚀 Starting development environment...${NC}"

# Check if Hardhat node is running
if ! curl -s -X POST http://127.0.0.1:8545 -H "Content-Type: application/json" -d '{"jsonrpc":"2.0","method":"eth_blockNumber","params":[],"id":1}' > /dev/null 2>&1; then
    echo -e "${RED}❌ Hardhat node is not running. Please start it first with:${NC}"
    echo -e "${YELLOW}cd backend/blockchain && npx hardhat node${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Hardhat node is running${NC}"

# Deploy contracts
echo -e "${YELLOW}📦 Deploying contracts...${NC}"
cd backend/blockchain
npx hardhat run scripts/deploy-all.js --network localhost

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Contracts deployed successfully!${NC}"
    echo -e "${YELLOW}🎉 Development environment is ready!${NC}"
else
    echo -e "${RED}❌ Contract deployment failed${NC}"
    exit 1
fi
