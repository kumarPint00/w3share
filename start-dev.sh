#!/bin/bash

# DogeGift Development Startup Script
# Starts both backend and frontend servers concurrently

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${BLUE}===========================================${NC}"
echo -e "${BLUE}   DogeGift Development Environment${NC}"
echo -e "${BLUE}===========================================${NC}"
echo ""

# Check if node_modules exist
if [ ! -d "backend/node_modules" ]; then
    echo -e "${YELLOW}Backend dependencies not found. Installing...${NC}"
    cd backend && npm install && cd ..
fi

if [ ! -d "frontend/node_modules" ]; then
    echo -e "${YELLOW}Frontend dependencies not found. Installing...${NC}"
    cd frontend && npm install && cd ..
fi

# Check if .env files exist
if [ ! -f "backend/.env" ]; then
    echo -e "${YELLOW}Warning: backend/.env not found!${NC}"
    if [ -f "backend/.env.example" ]; then
        echo -e "${YELLOW}Creating backend/.env from .env.example${NC}"
        cp backend/.env.example backend/.env
    fi
fi

if [ ! -f "frontend/.env.local" ]; then
    echo -e "${YELLOW}Warning: frontend/.env.local not found!${NC}"
fi

echo -e "${GREEN}Starting Backend (NestJS) on port 4000...${NC}"
echo -e "${GREEN}Starting Frontend (Next.js) on port 3000...${NC}"
echo ""
echo -e "${YELLOW}Press Ctrl+C to stop both servers${NC}"
echo ""

# Start both servers using npm-run-all if available, otherwise use background processes
if command -v npm-run-all &> /dev/null; then
    npx npm-run-all --parallel backend frontend
else
    # Fallback: run in background with process group
    trap 'kill 0' EXIT
    
    cd backend && npm run start:dev &
    BACKEND_PID=$!
    
    cd ../frontend && npm run dev &
    FRONTEND_PID=$!
    
    # Wait for both processes
    wait $BACKEND_PID $FRONTEND_PID
fi
