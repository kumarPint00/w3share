#!/bin/bash

# DogeGift Contract Admin System Launcher
echo "Starting DogeGift Contract Admin System..."

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    echo "Error: Docker is not installed. Please install Docker first."
    exit 1
fi

# Check if docker-compose is installed
if ! command -v docker-compose &> /dev/null; then
    echo "Error: docker-compose is not installed. Please install docker-compose first."
    exit 1
fi

# Check if environment files exist
if [ ! -f "./contract-admin-service/.env" ]; then
    echo "Warning: No .env file found for contract-admin-service."
    echo "Please create one using the template in contract-admin-service/.env.example"
fi

if [ ! -f "./contract-admin-ui/.env" ]; then
    echo "Warning: No .env file found for contract-admin-ui."
    echo "Please create one using the template in contract-admin-ui/.env.example"
fi

# Start the services
echo "Launching Admin Service and UI..."
docker-compose -f docker-compose.admin.yml up -d

# Check if services started successfully
if [ $? -eq 0 ]; then
    echo ""
    echo "✅ DogeGift Contract Admin System is running!"
    echo ""
    echo "Access the admin UI at: http://localhost:3002"
    echo "Admin Service API is available at: http://localhost:3001"
    echo ""
    echo "To stop the services, run: docker-compose -f docker-compose.admin.yml down"
else
    echo ""
    echo "❌ Failed to start DogeGift Contract Admin System."
    echo "Please check the logs for more information."
fi
