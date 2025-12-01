#!/bin/bash
# Quick Public Access Setup for DogeGift
# This script provides options to make your application publicly accessible

echo "╔════════════════════════════════════════════════════════════════╗"
echo "║        DogeGift - Public Access Configuration Tool            ║"
echo "╚════════════════════════════════════════════════════════════════╝"
echo ""
echo "Current Status:"
echo "  Frontend: http://192.168.1.3:3000"
echo "  Backend:  http://192.168.1.3:4000"
echo ""
echo "Choose a method to make your app publicly accessible:"
echo ""
echo "1. Check Public IP (for manual port forwarding)"
echo "2. Install & Setup ngrok (Quick temporary access)"
echo "3. Instructions for Router Port Forwarding"
echo "4. Exit"
echo ""
read -p "Enter your choice (1-4): " choice

case $choice in
    1)
        echo ""
        echo "Your Public IP Address:"
        PUBLIC_IP=$(curl -s ifconfig.me)
        echo "  $PUBLIC_IP"
        echo ""
        echo "To make accessible publicly:"
        echo "1. Log into your router (usually 192.168.1.1 or 192.168.0.1)"
        echo "2. Find 'Port Forwarding' or 'Virtual Server' settings"
        echo "3. Add these rules:"
        echo "   - External Port: 3000 → Internal IP: 192.168.1.3, Internal Port: 3000 (Frontend)"
        echo "   - External Port: 4000 → Internal IP: 192.168.1.3, Internal Port: 4000 (Backend)"
        echo "4. Access your app at: http://$PUBLIC_IP:3000"
        ;;
    2)
        echo ""
        echo "Installing ngrok..."
        if command -v ngrok &> /dev/null; then
            echo "✓ ngrok is already installed"
        else
            curl -s https://ngrok-agent.s3.amazonaws.com/ngrok.asc | sudo tee /etc/apt/trusted.gpg.d/ngrok.asc >/dev/null
            echo "deb https://ngrok-agent.s3.amazonaws.com buster main" | sudo tee /etc/apt/sources.list.d/ngrok.list
            sudo apt update && sudo apt install ngrok -y
        fi
        echo ""
        echo "⚠️  You need an ngrok account. Sign up at: https://dashboard.ngrok.com/signup"
        read -p "Enter your ngrok authtoken: " authtoken
        ngrok authtoken $authtoken
        echo ""
        echo "Starting ngrok tunnel for frontend (port 3000)..."
        echo "Opening in background... Check ngrok dashboard for the public URL"
        nohup ngrok http 3000 > /tmp/ngrok-frontend.log 2>&1 &
        sleep 3
        echo ""
        echo "Your public URLs will be shown in the ngrok dashboard:"
        echo "https://dashboard.ngrok.com/endpoints/status"
        echo ""
        echo "Note: Update NEXT_PUBLIC_API_URL in frontend to match your backend ngrok URL"
        ;;
    3)
        echo ""
        echo "╔════════════════════════════════════════════════════════════════╗"
        echo "║              Router Port Forwarding Instructions              ║"
        echo "╚════════════════════════════════════════════════════════════════╝"
        echo ""
        PUBLIC_IP=$(curl -s ifconfig.me)
        echo "Your Public IP: $PUBLIC_IP"
        echo ""
        echo "Step 1: Access Your Router"
        echo "  - Open browser and go to: http://192.168.1.1 (or http://192.168.0.1)"
        echo "  - Login with your router admin credentials"
        echo ""
        echo "Step 2: Find Port Forwarding Settings"
        echo "  - Look for sections named:"
        echo "    • Port Forwarding"
        echo "    • Virtual Server"
        echo "    • NAT Forwarding"
        echo "    • Applications & Gaming"
        echo ""
        echo "Step 3: Add Port Forwarding Rules"
        echo "  Rule 1 - Frontend:"
        echo "    Service Name: DogeGift-Frontend"
        echo "    External Port: 3000"
        echo "    Internal IP: 192.168.1.3"
        echo "    Internal Port: 3000"
        echo "    Protocol: TCP"
        echo ""
        echo "  Rule 2 - Backend API:"
        echo "    Service Name: DogeGift-Backend"
        echo "    External Port: 4000"
        echo "    Internal IP: 192.168.1.3"
        echo "    Internal Port: 4000"
        echo "    Protocol: TCP"
        echo ""
        echo "Step 4: Save and Test"
        echo "  - Save the settings"
        echo "  - Access from outside: http://$PUBLIC_IP:3000"
        echo ""
        echo "⚠️  SECURITY WARNING:"
        echo "  - This exposes your app directly to the internet"
        echo "  - Recommended: Set up HTTPS with SSL certificate"
        echo "  - Consider using Cloudflare or nginx reverse proxy"
        echo ""
        ;;
    4)
        echo "Exiting..."
        exit 0
        ;;
    *)
        echo "Invalid choice. Exiting..."
        exit 1
        ;;
esac
