#!/bin/bash

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${YELLOW}🚀 Starting development environment...${NC}"

# Check if Hardhat node is running
echo -e "${YELLOW}🔍 Checking Hardhat node...${NC}"
if ! curl -s -X POST http://127.0.0.1:8545 -H "Content-Type: application/json" -d '{"jsonrpc":"2.0","method":"eth_blockNumber","params":[],"id":1}' > /dev/null 2>&1; then
    echo -e "${RED}❌ Hardhat node is not running. Starting it now...${NC}"
    echo -e "${YELLOW}📡 Starting Hardhat node in background...${NC}"
    cd backend/blockchain
    npx hardhat node > ../../hardhat.log 2>&1 &
    HARDHAT_PID=$!
    cd ../..
    
    # Wait for Hardhat node to start
    echo -e "${YELLOW}⏳ Waiting for Hardhat node to start...${NC}"
    sleep 5
    
    # Check if it started successfully
    if ! curl -s -X POST http://127.0.0.1:8545 -H "Content-Type: application/json" -d '{"jsonrpc":"2.0","method":"eth_blockNumber","params":[],"id":1}' > /dev/null 2>&1; then
        echo -e "${RED}❌ Failed to start Hardhat node${NC}"
        exit 1
    fi
fi

echo -e "${GREEN}✅ Hardhat node is running${NC}"

# Deploy contracts
echo -e "${YELLOW}📦 Deploying contracts...${NC}"
cd backend/blockchain
npx hardhat run scripts/deploy-all.js --network localhost
if [ $? -ne 0 ]; then
    echo -e "${RED}❌ Contract deployment failed${NC}"
    exit 1
fi
cd ../..

echo -e "${GREEN}✅ Contracts deployed successfully!${NC}"

# Start backend
echo -e "${YELLOW}🔧 Starting backend...${NC}"
cd backend
npm install
npm run start:dev > ../backend.log 2>&1 &
BACKEND_PID=$!
cd ..

# Start frontend
echo -e "${YELLOW}🎨 Starting frontend...${NC}"
cd frontend
npm install
npm run dev > ../frontend.log 2>&1 &
FRONTEND_PID=$!
cd ..

echo -e "${GREEN}🎉 Development environment is ready!${NC}"
echo -e "${YELLOW}📊 Services running:${NC}"
echo -e "  • Hardhat node: http://127.0.0.1:8545"
echo -e "  • Backend: http://localhost:4000"
echo -e "  • Frontend: http://localhost:3000"
echo -e ""
echo -e "${YELLOW}📋 Logs:${NC}"
echo -e "  • Hardhat: tail -f hardhat.log"
echo -e "  • Backend: tail -f backend.log"
echo -e "  • Frontend: tail -f frontend.log"
echo -e ""
echo -e "${YELLOW}🛑 To stop all services: pkill -f 'hardhat\|npm run\|next'${NC}"