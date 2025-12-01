# DogeGift Deployment Information

## Deployment Date
December 1, 2025

## Deployment Status
✅ **Successfully Deployed**

## Application URLs

### Frontend (Next.js)
- **URL**: `http://192.168.1.3:3000`
- **Status**: ✅ Online
- **Process Manager**: PM2 (dogegift-frontend)
- **Auto-restart**: Enabled

### Backend (NestJS API)
- **URL**: `http://192.168.1.3:4000`
- **Status**: ✅ Online
- **Process Manager**: PM2 (dogegift-backend)
- **API Documentation**: `http://192.168.1.3:4000/docs` (Swagger)
- **Auto-restart**: Enabled

### Database (PostgreSQL)
- **Host**: localhost
- **Port**: 5434
- **Database**: dogegf
- **Status**: ✅ Running (Docker container)

## Access Information

### Local Network Access
Both applications are accessible from any device on the local network (192.168.1.x):
- Frontend: `http://192.168.1.3:3000`
- Backend API: `http://192.168.1.3:4000`

### Public Internet Access
To make the application accessible from the internet, you have several options:

#### Option 1: Port Forwarding (Easiest)
1. Log into your router admin panel
2. Forward ports 3000 and 4000 to 192.168.1.3
3. Access via: `http://YOUR_PUBLIC_IP:3000`
4. Find your public IP: `curl ifconfig.me`

#### Option 2: Cloudflare Tunnel (Recommended for Security)
```bash
# Install cloudflared
wget -q https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-amd64.deb
sudo dpkg -i cloudflared-linux-amd64.deb

# Create tunnel
cloudflared tunnel login
cloudflared tunnel create dogegift
cloudflared tunnel route dns dogegift yourdomain.com
```

#### Option 3: ngrok (Quick Testing)
```bash
# Install ngrok
curl -s https://ngrok-agent.s3.amazonaws.com/ngrok.asc | sudo tee /etc/apt/trusted.gpg.d/ngrok.asc >/dev/null
echo "deb https://ngrok-agent.s3.amazonaws.com buster main" | sudo tee /etc/apt/sources.list.d/ngrok.list
sudo apt update && sudo apt install ngrok

# Expose frontend
ngrok http 3000

# In another terminal, expose backend
ngrok http 4000
```

## PM2 Management Commands

### View Status
```bash
pm2 list
pm2 status
```

### View Logs
```bash
pm2 logs                      # All logs
pm2 logs dogegift-frontend    # Frontend logs only
pm2 logs dogegift-backend     # Backend logs only
```

### Restart Applications
```bash
pm2 restart all               # Restart all
pm2 restart dogegift-frontend # Restart frontend only
pm2 restart dogegift-backend  # Restart backend only
```

### Stop Applications
```bash
pm2 stop all                  # Stop all
pm2 stop dogegift-frontend    # Stop frontend only
pm2 stop dogegift-backend     # Stop backend only
```

### Monitor Resources
```bash
pm2 monit
```

## Docker Management Commands

### Database Container
```bash
# View database logs
docker logs dogefull-db-1

# Restart database
docker restart dogefull-db-1

# Stop database
docker stop dogefull-db-1

# Start database
docker start dogefull-db-1

# Access PostgreSQL CLI
docker exec -it dogefull-db-1 psql -U postgres -d dogegf
```

## Environment Configuration

### Backend Environment Variables
Located in PM2 ecosystem config (`ecosystem.config.js`):
- `PORT`: 4000
- `DATABASE_URL`: postgresql://postgres:mynewpassword@localhost:5434/dogegf
- `CORS_ORIGINS`: http://localhost:3000,http://192.168.1.3:3000
- `SEPOLIA_BASE_RPC`: Ethereum Sepolia testnet RPC
- `GIFT_ESCROW_ADDRESS`: Smart contract address

### Frontend Environment Variables
- `PORT`: 3000
- `NEXT_PUBLIC_API_URL`: http://192.168.1.3:4000

## Health Checks

### Frontend Health Check
```bash
curl http://192.168.1.3:3000
# Should return HTML content
```

### Backend Health Check
```bash
curl http://192.168.1.3:4000
# Should return: "Hello from DogeGift Backend!"
```

### Database Health Check
```bash
docker exec dogefull-db-1 pg_isready -U postgres -d dogegf
# Should return: accepting connections
```

## Troubleshooting

### Application Not Accessible
1. Check PM2 status: `pm2 list`
2. Check logs: `pm2 logs --lines 50`
3. Restart: `pm2 restart all`

### Database Connection Issues
1. Check database is running: `docker ps | grep postgres`
2. Restart database: `docker restart dogefull-db-1`
3. Check logs: `docker logs dogefull-db-1`

### Port Already in Use
```bash
# Check what's using a port
sudo lsof -i :3000
sudo lsof -i :4000

# Kill process if needed
sudo kill -9 <PID>
```

## Security Recommendations

### Before Making Public
1. **Update Environment Variables**:
   - Change `JWT_SECRET` to a strong random value
   - Update `DATABASE_PASSWORD` in docker-compose.yml
   - Never expose private keys in production

2. **Enable HTTPS**:
   - Use Let's Encrypt for SSL certificates
   - Configure nginx as reverse proxy
   - Redirect HTTP to HTTPS

3. **Firewall Rules**:
   - Only open necessary ports (80, 443)
   - Use fail2ban for SSH protection
   - Enable UFW firewall

4. **Database Security**:
   - Don't expose PostgreSQL port publicly
   - Use strong passwords
   - Regular backups

## Backup Commands

### Database Backup
```bash
docker exec dogefull-db-1 pg_dump -U postgres dogegf > backup_$(date +%Y%m%d_%H%M%S).sql
```

### Restore Database
```bash
cat backup_file.sql | docker exec -i dogefull-db-1 psql -U postgres -d dogegf
```

## System Requirements Met
- ✅ Node.js v22.21.1
- ✅ PostgreSQL 15 (Docker)
- ✅ PM2 process manager
- ✅ Docker & Docker Compose v2.40.3

## Next Steps

1. **Set up domain name** (optional):
   - Purchase a domain from a registrar
   - Point A record to your server IP

2. **Install and configure Nginx** (recommended):
   ```bash
   sudo apt install nginx
   # Configure reverse proxy for better performance and SSL
   ```

3. **Enable HTTPS with Let's Encrypt**:
   ```bash
   sudo apt install certbot python3-certbot-nginx
   sudo certbot --nginx -d yourdomain.com
   ```

4. **Set up monitoring** (optional):
   - PM2 Plus for application monitoring
   - Prometheus + Grafana for metrics
   - Uptime monitoring service

## Support

For issues or questions:
- Check logs: `pm2 logs`
- Review documentation in `/home/ravi/dogeFull/`
- Check API docs: http://192.168.1.3:4000/docs

---

**Deployment completed successfully on December 1, 2025**
