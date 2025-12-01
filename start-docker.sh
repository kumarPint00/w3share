#!/bin/bash

# DogeGifty Docker Startup Script
set -e

echo "🐕 Starting DogeGifty Docker Stack..."

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    echo "❌ Docker is not running. Please start Docker and try again."
    exit 1
fi

# Check if docker-compose is available
if ! command -v docker-compose > /dev/null 2>&1; then
    echo "❌ docker-compose is not installed. Please install docker-compose and try again."
    exit 1
fi

# Function to check if required environment variables are set
check_env() {
    local env_file="backend/.env"
    
    if [ ! -f "$env_file" ]; then
        echo "❌ Backend environment file not found: $env_file"
        echo "   Please copy backend/.env.template to backend/.env and configure it"
        echo "   Run: cp backend/.env.template backend/.env"
        exit 1
    fi
    
    # Check for placeholder values
    if grep -q "YOUR_ALCHEMY_KEY\|YOUR_ACTUAL_PRIVATE_KEY_HERE\|YOUR_ACTUAL_CONTRACT_ADDRESS_HERE" "$env_file"; then
        echo "⚠️  Warning: Found placeholder values in $env_file"
        echo "   Please update the following variables with real values:"
        echo "   - SEPOLIA_BASE_RPC (your Alchemy/Infura RPC URL)"
        echo "   - DEPLOYER_PRIVATE_KEY (your wallet private key)"
        echo "   - GIFT_ESCROW_ADDRESS (your deployed contract address)"
        echo ""
        read -p "Do you want to continue anyway? (y/N): " -n 1 -r
        echo
        if [[ ! $REPLY =~ ^[Yy]$ ]]; then
            exit 1
        fi
    fi
}

# Parse command line arguments
BUILD=false
DETACHED=false
LOGS=false

while [[ $# -gt 0 ]]; do
    case $1 in
        --build)
            BUILD=true
            shift
            ;;
        --detached|-d)
            DETACHED=true
            shift
            ;;
        --logs)
            LOGS=true
            shift
            ;;
        --help|-h)
            echo "Usage: $0 [options]"
            echo "Options:"
            echo "  --build     Force rebuild of Docker images"
            echo "  --detached  Run in detached mode"
            echo "  --logs      Show logs after starting"
            echo "  --help      Show this help message"
            exit 0
            ;;
        *)
            echo "Unknown option: $1"
            echo "Use --help for usage information"
            exit 1
            ;;
    esac
done

# Check environment configuration
check_env

echo "✅ Environment configuration looks good"

# Build command
DOCKER_CMD="docker-compose up"

if [ "$BUILD" = true ]; then
    DOCKER_CMD="$DOCKER_CMD --build"
    echo "🔨 Building images..."
fi

if [ "$DETACHED" = true ]; then
    DOCKER_CMD="$DOCKER_CMD -d"
    echo "🚀 Starting services in detached mode..."
else
    echo "🚀 Starting services..."
fi

# Start the services
eval $DOCKER_CMD

if [ "$DETACHED" = true ]; then
    echo ""
    echo "✅ Services started successfully!"
    echo ""
    echo "📱 Frontend: http://localhost:3000"
    echo "🔧 Backend API: http://localhost:4000"
    echo "🗄️  Database: localhost:5432"
    echo ""
    echo "📋 Check status: docker-compose ps"
    echo "📜 View logs: docker-compose logs -f"
    echo "🛑 Stop services: docker-compose down"
    
    if [ "$LOGS" = true ]; then
        echo ""
        echo "📜 Showing logs (Ctrl+C to exit):"
        docker-compose logs -f
    fi
else
    echo ""
    echo "Services are running. Press Ctrl+C to stop."
fi
