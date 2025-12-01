#!/bin/bash

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}🏗️  Full Development Reset${NC}"
echo -e "${YELLOW}This will reset both blockchain and database for a clean development environment${NC}"

# Stop all running processes
echo -e "${YELLOW}🛑 Stopping all processes...${NC}"
pkill -f "hardhat" 2>/dev/null || true
pkill -f "npm run start:dev" 2>/dev/null || true
pkill -f "npm run dev" 2>/dev/null || true
sleep 2

# Reset database
echo -e "${YELLOW}🗃️  Resetting database...${NC}"
cd backend
npx prisma db push --force-reset --accept-data-loss
cd ..

# Start fresh Hardhat node
echo -e "${YELLOW}📡 Starting fresh Hardhat node...${NC}"
cd backend/blockchain
npx hardhat node > ../../hardhat.log 2>&1 &
HARDHAT_PID=$!
cd ../..

# Wait for Hardhat to start
echo -e "${YELLOW}⏳ Waiting for Hardhat node...${NC}"
sleep 5

# Verify Hardhat is running
if ! curl -s -X POST http://127.0.0.1:8545 -H "Content-Type: application/json" -d '{"jsonrpc":"2.0","method":"eth_blockNumber","params":[],"id":1}' > /dev/null 2>&1; then
    echo -e "${RED}❌ Failed to start Hardhat node${NC}"
    exit 1
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
npm run start:dev > ../backend.log 2>&1 &
BACKEND_PID=$!
cd ..

# Start frontend
echo -e "${YELLOW}🎨 Starting frontend...${NC}"
cd frontend
npm run dev > ../frontend.log 2>&1 &
FRONTEND_PID=$!
cd ..

echo -e "${GREEN}🎉 Clean development environment is ready!${NC}"
echo -e "${BLUE}📊 Fresh state:${NC}"
echo -e "  • Database: Reset (no old data)"
echo -e "  • Blockchain: Reset (block 0)"
echo -e "  • Contracts: Freshly deployed"
echo -e "  • Gift IDs: Start from 0"
echo -e ""
echo -e "${YELLOW}📋 Services:${NC}"
echo -e "  • Hardhat: http://127.0.0.1:8545"
echo -e "  • Backend: http://localhost:4000"
echo -e "  • Frontend: http://localhost:3000"
echo -e ""
echo -e "${YELLOW}📄 Logs:${NC}"
echo -e "  • Hardhat: tail -f hardhat.log"
echo -e "  • Backend: tail -f backend.log"
echo -e "  • Frontend: tail -f frontend.log"
