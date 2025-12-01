# 🚀 DogeGift Deployment Guide

## Overview

This guide covers the complete deployment process for DogeGift, from development to production. It includes infrastructure setup, configuration management, and operational procedures.

## Prerequisites

### System Requirements
- **OS**: Ubuntu 20.04+ or CentOS 7+
- **CPU**: 2+ cores
- **RAM**: 4GB+ minimum, 8GB+ recommended
- **Storage**: 20GB+ SSD
- **Network**: 100Mbps+ connection

### Software Dependencies
```bash
# Required packages
sudo apt update
sudo apt install -y curl wget git unzip

# Node.js 20.x
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs

# Docker & Docker Compose
sudo apt install -y docker.io docker-compose
sudo systemctl enable docker
sudo systemctl start docker

# PostgreSQL (if not using Docker)
sudo apt install -y postgresql postgresql-contrib
```

### Network Requirements
- **Inbound**: Ports 80, 443 (HTTP/HTTPS), 22 (SSH)
- **Outbound**: Access to blockchain RPC endpoints
- **DNS**: Domain name with SSL certificate

## Development Environment

### Local Setup
```bash
# Clone repository
git clone https://github.com/your-org/dogegift.git
cd dogegift

# Install dependencies
npm run install:all

# Set up environment
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env

# Configure local settings
echo "DATABASE_URL=postgresql://postgres:password@localhost:5432/dogegift" >> backend/.env
echo "NEXT_PUBLIC_API_URL=http://localhost:3000" >> frontend/.env

# Start services
npm run dev
```

### Docker Development
```bash
# Build and run with Docker Compose
docker-compose -f docker-compose.dev.yml up --build

# Or use the development script
./scripts/dev-setup.sh
```

## Staging Environment

### Infrastructure Setup
```bash
# Create staging server (example with AWS EC2)
aws ec2 run-instances \
  --image-id ami-0abcdef1234567890 \
  --count 1 \
  --instance-type t3.medium \
  --key-name your-key-pair \
  --security-groups sg-12345678 \
  --tag-specifications 'ResourceType=instance,Tags=[{Key=Name,Value=dogegift-staging}]'
```

### Database Setup
```bash
# Create PostgreSQL database
sudo -u postgres psql
CREATE DATABASE dogegift_staging;
CREATE USER dogegift_user WITH PASSWORD 'secure_password';
GRANT ALL PRIVILEGES ON DATABASE dogegift_staging TO dogegift_user;
\q

# Run migrations
cd backend
npm run prisma:migrate
npm run prisma:seed
```

### Application Deployment
```bash
# Clone and setup
git clone https://github.com/your-org/dogegift.git /opt/dogegift
cd /opt/dogegift

# Install dependencies
npm run install:all

# Configure environment
cp backend/.env.staging backend/.env
cp frontend/.env.staging frontend/.env

# Build applications
npm run build:all

# Start with PM2
npm run pm2:start
```

## Production Environment

### Infrastructure Architecture

#### Recommended Setup
```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Load Balancer │    │   Web Servers   │    │   Database      │
│   (Nginx/HAProxy)│    │   (Node.js)     │    │   (PostgreSQL)  │
├─────────────────┤    ├─────────────────┤    ├─────────────────┤
│ - SSL Termination│    │ - App Server    │    │ - Primary DB    │
│ - Request Routing│    │ - API Gateway   │    │ - Read Replicas │
│ - DDoS Protection│    │ - File Storage  │    │ - Backup        │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         ▼                       ▼                       ▼
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Redis Cache   │    │   Monitoring    │    │   Blockchain    │
│   (Sessions)    │    │   (Prometheus)  │    │   (RPC Nodes)   │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

#### Cloud Provider Options

**AWS (Recommended)**
```bash
# EC2 instances
- t3.large (2 vCPU, 8GB RAM) x 2 for web servers
- t3.medium (2 vCPU, 4GB RAM) x 1 for database
- t3.small (1 vCPU, 2GB RAM) x 1 for Redis

# RDS PostgreSQL
- db.t3.medium (2 vCPU, 4GB RAM)
- Multi-AZ deployment
- Automated backups

# ELB Application Load Balancer
- SSL termination
- Health checks
- Auto scaling
```

**DigitalOcean**
```bash
# Droplets
- 2GB RAM, 1 vCPU x 2 (App servers)
- 2GB RAM, 1 vCPU x 1 (Database)
- 1GB RAM, 1 vCPU x 1 (Redis)

# Managed Database
- PostgreSQL 15
- 2GB RAM, 1 vCPU
- Daily backups
```

### Security Configuration

#### SSL/TLS Setup
```bash
# Install Certbot for Let's Encrypt
sudo apt install certbot python3-certbot-nginx

# Get SSL certificate
sudo certbot --nginx -d yourdomain.com

# Configure SSL settings
sudo nano /etc/nginx/sites-available/dogegift
```

#### Nginx Configuration
```nginx
# /etc/nginx/sites-available/dogegift
server {
    listen 80;
    server_name yourdomain.com;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name yourdomain.com;

    # SSL configuration
    ssl_certificate /etc/letsencrypt/live/yourdomain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/yourdomain.com/privkey.pem;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-RSA-AES256-GCM-SHA512:DHE-RSA-AES256-GCM-SHA512;

    # Security headers
    add_header X-Frame-Options DENY;
    add_header X-Content-Type-Options nosniff;
    add_header X-XSS-Protection "1; mode=block";
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains";

    # Frontend
    location / {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # Backend API
    location /api/ {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # Health check
    location /healthz {
        proxy_pass http://localhost:3000/healthz;
        access_log off;
    }
}
```

#### Firewall Configuration
```bash
# UFW firewall rules
sudo ufw allow OpenSSH
sudo ufw allow 'Nginx Full'
sudo ufw --force enable

# Verify firewall status
sudo ufw status
```

### Database Configuration

#### PostgreSQL Production Setup
```bash
# Edit postgresql.conf
sudo nano /etc/postgresql/15/main/postgresql.conf

# Production settings
shared_buffers = 256MB
effective_cache_size = 1GB
maintenance_work_mem = 64MB
checkpoint_completion_target = 0.9
wal_buffers = 16MB
default_statistics_target = 100

# Restart PostgreSQL
sudo systemctl restart postgresql
```

#### Connection Pooling
```typescript
// backend/src/config/database.config.ts
export const databaseConfig = {
  type: 'postgres' as const,
  host: process.env.DB_HOST,
  port: parseInt(process.env.DB_PORT || '5432'),
  username: process.env.DB_USERNAME,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  entities: ['dist/**/*.entity{.ts,.js}'],
  synchronize: false, // Use migrations in production
  logging: process.env.NODE_ENV === 'development',
  poolSize: 10, // Connection pool size
  extra: {
    max: 20, // Maximum connections
    min: 5,  // Minimum connections
  },
};
```

### Application Deployment

#### PM2 Process Management
```json
// ecosystem.config.js
module.exports = {
  apps: [
    {
      name: 'dogegift-backend',
      script: 'dist/main.js',
      instances: 'max',
      exec_mode: 'cluster',
      env: {
        NODE_ENV: 'production',
        PORT: 3000,
      },
      env_production: {
        NODE_ENV: 'production',
        PORT: 3000,
      },
      error_file: './logs/err.log',
      out_file: './logs/out.log',
      log_file: './logs/combined.log',
      time: true,
    },
    {
      name: 'dogegift-frontend',
      script: 'server.js',
      instances: 1,
      cwd: './frontend',
      env: {
        NODE_ENV: 'production',
        PORT: 3001,
      },
    },
  ],
};
```

#### Deployment Script
```bash
#!/bin/bash
# deploy.sh

# Exit on error
set -e

echo "🚀 Starting DogeGift deployment..."

# Update codebase
git pull origin main

# Install dependencies
npm run install:all

# Run database migrations
cd backend
npm run prisma:migrate

# Build applications
cd ..
npm run build:all

# Reload PM2 processes
pm2 reload ecosystem.config.js

# Health check
sleep 10
curl -f http://localhost:3000/healthz
curl -f http://localhost:3001

echo "✅ Deployment completed successfully!"
```

### Environment Configuration

#### Production Environment Variables
```bash
# Backend .env
NODE_ENV=production
PORT=3000
DATABASE_URL=postgresql://user:password@db-host:5432/dogegift
JWT_SECRET=your-super-secure-jwt-secret-here
SEPOLIA_BASE_RPC=https://mainnet.infura.io/v3/YOUR_PROJECT_ID
DEPLOYER_PRIVATE_KEY=0x...
GIFT_ESCROW_ADDRESS=0x...
GELATO_API_KEY=your-gelato-api-key
REDIS_URL=redis://redis-host:6379
LOG_LEVEL=info

# Frontend .env
NEXT_PUBLIC_API_URL=https://api.yourdomain.com
NEXT_PUBLIC_CHAIN_ID=1
```

#### Secrets Management
```bash
# Use environment variables or secret managers
# AWS Secrets Manager
aws secretsmanager create-secret \
  --name dogegift/prod/database \
  --secret-string '{"username":"dbuser","password":"dbpass"}'

# Access in application
const secrets = await awsSecrets.getSecretValue({
  SecretId: 'dogegift/prod/database'
});
```

## Blockchain Configuration

### Smart Contract Deployment
```bash
# Deploy to mainnet
cd backend/blockchain
npx hardhat run scripts/deploy.js --network mainnet

# Verify contract
npx hardhat verify --network mainnet CONTRACT_ADDRESS

# Update environment
echo "GIFT_ESCROW_ADDRESS=0x..." >> .env
```

### RPC Configuration
```typescript
// Multiple RPC providers for redundancy
export const rpcProviders = {
  mainnet: [
    'https://mainnet.infura.io/v3/YOUR_PROJECT_ID',
    'https://eth-mainnet.g.alchemy.com/v2/YOUR_API_KEY',
    'https://rpc.ankr.com/eth',
  ],
  sepolia: [
    'https://sepolia.infura.io/v3/YOUR_PROJECT_ID',
    'https://eth-sepolia.g.alchemy.com/v2/YOUR_API_KEY',
  ],
};
```

## Monitoring & Observability

### Application Monitoring
```typescript
// backend/src/common/metrics.service.ts
@Injectable()
export class MetricsService {
  private registry = new promClient.Registry();

  constructor() {
    // Application metrics
    this.httpRequestTotal = new promClient.Counter({
      name: 'http_requests_total',
      help: 'Total number of HTTP requests',
      labelNames: ['method', 'route', 'status_code'],
    });

    this.httpRequestDuration = new promClient.Histogram({
      name: 'http_request_duration_seconds',
      help: 'HTTP request duration in seconds',
      labelNames: ['method', 'route'],
      buckets: [0.1, 0.5, 1, 2, 5],
    });
  }

  recordHttpRequest(method: string, route: string, statusCode: number, duration: number) {
    this.httpRequestTotal.labels(method, route, statusCode.toString()).inc();
    this.httpRequestDuration.labels(method, route).observe(duration);
  }
}
```

### Infrastructure Monitoring
```yaml
# docker-compose.monitoring.yml
version: '3.8'
services:
  prometheus:
    image: prom/prometheus
    ports:
      - "9090:9090"
    volumes:
      - ./monitoring/prometheus.yml:/etc/prometheus/prometheus.yml

  grafana:
    image: grafana/grafana
    ports:
      - "3000:3000"
    environment:
      - GF_SECURITY_ADMIN_PASSWORD=admin
    volumes:
      - grafana_data:/var/lib/grafana

  node-exporter:
    image: prom/node-exporter
    ports:
      - "9100:9100"
```

### Logging Configuration
```typescript
// Winston logger configuration
const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  transports: [
    new winston.transports.Console({
      format: winston.format.simple(),
    }),
    new winston.transports.File({
      filename: 'logs/error.log',
      level: 'error',
    }),
    new winston.transports.File({
      filename: 'logs/combined.log',
    }),
  ],
});
```

## Backup & Recovery

### Database Backup
```bash
# Automated backup script
#!/bin/bash
BACKUP_DIR="/opt/backups"
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="$BACKUP_DIR/dogegift_$DATE.sql"

# Create backup
pg_dump -h localhost -U dogegift_user dogegift > "$BACKUP_FILE"

# Compress
gzip "$BACKUP_FILE"

# Upload to S3
aws s3 cp "$BACKUP_FILE.gz" s3://dogegift-backups/

# Clean old backups (keep last 7 days)
find "$BACKUP_DIR" -name "*.gz" -mtime +7 -delete
```

### Application Backup
```bash
# Backup user uploads and configs
tar -czf /opt/backups/app_$DATE.tar.gz \
  /opt/dogegift/uploads \
  /opt/dogegift/config \
  /opt/dogegift/logs
```

### Disaster Recovery
```bash
# Recovery procedure
# 1. Spin up new infrastructure
# 2. Restore database from backup
pg_restore -h localhost -U dogegift_user -d dogegift /path/to/backup.sql

# 3. Deploy application
./deploy.sh

# 4. Update DNS if needed
# 5. Verify application functionality
curl -f https://yourdomain.com/healthz
```

## Performance Optimization

### Database Optimization
```sql
-- Create indexes for performance
CREATE INDEX CONCURRENTLY idx_gift_pack_sender ON gift_pack(sender_address);
CREATE INDEX CONCURRENTLY idx_gift_pack_status ON gift_pack(status);
CREATE INDEX CONCURRENTLY idx_gift_pack_expiry ON gift_pack(expiry);
CREATE INDEX CONCURRENTLY idx_gift_item_contract ON gift_item(contract);

-- Analyze query performance
EXPLAIN (ANALYZE, BUFFERS)
SELECT gp.*, gi.*
FROM gift_pack gp
LEFT JOIN gift_item gi ON gp.id = gi.gift_pack_id
WHERE gp.sender_address = $1
ORDER BY gp.created_at DESC
LIMIT 10;
```

### Caching Strategy
```typescript
// Redis caching for frequently accessed data
@Injectable()
export class CacheService {
  constructor(@Inject('REDIS_CLIENT') private redis: Redis) {}

  async getGiftPack(id: string): Promise<GiftPack | null> {
    const cached = await this.redis.get(`giftpack:${id}`);
    if (cached) {
      return JSON.parse(cached);
    }

    const giftPack = await this.prisma.giftPack.findUnique({
      where: { id },
      include: { items: true },
    });

    if (giftPack) {
      await this.redis.setex(
        `giftpack:${id}`,
        300, // 5 minutes
        JSON.stringify(giftPack)
      );
    }

    return giftPack;
  }
}
```

### CDN Configuration
```typescript
// Next.js image optimization with CDN
// next.config.js
module.exports = {
  images: {
    domains: ['your-cdn.com'],
    loader: 'imgix',
    path: 'https://your-cdn.com/_next/image',
  },
};
```

## Scaling Strategies

### Horizontal Scaling
```bash
# PM2 cluster mode
pm2 start ecosystem.config.js --instances max

# Nginx load balancing
upstream backend {
    server localhost:3000;
    server localhost:3001;
    server localhost:3002;
}

server {
    location /api/ {
        proxy_pass http://backend;
    }
}
```

### Database Scaling
```bash
# Read replicas
# Configure in PostgreSQL
# Application automatically uses read replicas for SELECT queries

# Connection string with multiple hosts
DATABASE_URL="postgresql://user:pass@primary:5432,read1:5432,read2:5432/dogegift?targetServerType=primary"
```

### Microservices Migration (Future)
```typescript
// Separate services for different domains
// 1. Auth Service
// 2. Gift Service
// 3. Asset Service
// 4. Notification Service

// API Gateway routes requests
const routes = {
  '/auth/*': 'auth-service:3001',
  '/gifts/*': 'gift-service:3002',
  '/assets/*': 'asset-service:3003',
};
```

## Security Hardening

### Server Security
```bash
# SSH hardening
sudo sed -i 's/#PermitRootLogin yes/PermitRootLogin no/' /etc/ssh/sshd_config
sudo sed -i 's/#PasswordAuthentication yes/PasswordAuthentication no/' /etc/ssh/sshd_config
sudo systemctl restart sshd

# Fail2Ban for SSH protection
sudo apt install fail2ban
sudo systemctl enable fail2ban
sudo systemctl start fail2ban

# Automatic security updates
sudo apt install unattended-upgrades
sudo dpkg-reconfigure unattended-upgrades
```

### Application Security
```typescript
// Rate limiting
@Injectable()
export class RateLimitGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const ip = request.ip;

    // Implement rate limiting logic
    const requests = this.redis.incr(`rate_limit:${ip}`);
    if (requests > 100) {
      throw new HttpException('Too many requests', HttpStatus.TOO_MANY_REQUESTS);
    }

    return true;
  }
}

// CORS configuration
const corsOptions = {
  origin: process.env.ALLOWED_ORIGINS?.split(','),
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization'],
};
```

## Maintenance Procedures

### Regular Maintenance
```bash
# Weekly tasks
# 1. Update dependencies
npm audit fix
npm update

# 2. Rotate logs
logrotate /etc/logrotate.d/dogegift

# 3. Database maintenance
vacuumdb --analyze --verbose dogegift

# 4. Backup verification
# Restore backup to staging environment
# Run integration tests
```

### Emergency Procedures
```bash
# Application crash
pm2 restart all
pm2 logs --lines 100

# Database issues
sudo systemctl restart postgresql
# Check logs: sudo tail -f /var/log/postgresql/postgresql-15-main.log

# High CPU usage
htop  # Identify problematic processes
pm2 monit  # Monitor PM2 processes
```

## Troubleshooting

### Common Issues

#### Application Won't Start
```bash
# Check logs
pm2 logs dogegift-backend --lines 50

# Check environment variables
pm2 show dogegift-backend

# Verify database connection
psql -h localhost -U dogegift_user -d dogegift -c "SELECT 1"
```

#### High Memory Usage
```bash
# Check memory usage
pm2 monit

# Restart application
pm2 restart dogegift-backend

# Check for memory leaks
npm run test:memory
```

#### Database Connection Issues
```bash
# Check PostgreSQL status
sudo systemctl status postgresql

# Check connection
psql -h localhost -U dogegift_user -d dogegift

# Check connection pool
# Monitor with pg_stat_activity
```

#### SSL Certificate Issues
```bash
# Renew certificate
sudo certbot renew

# Check certificate
openssl s_client -connect yourdomain.com:443 -servername yourdomain.com

# Reload nginx
sudo systemctl reload nginx
```

## Rollback Procedures

### Application Rollback
```bash
# Rollback to previous version
git log --oneline -10
git checkout <previous-commit-hash>
npm run build:all
pm2 reload ecosystem.config.js

# Verify rollback
curl -f https://yourdomain.com/healthz
```

### Database Rollback
```bash
# Rollback migration
cd backend
npm run prisma:migrate:down

# Or restore from backup
pg_restore -h localhost -U dogegift_user -d dogegift /path/to/backup.sql
```

## Performance Benchmarks

### Target Metrics
- **Response Time**: <200ms for API calls
- **Uptime**: 99.9% SLA
- **Concurrent Users**: 10,000+
- **Database Queries**: <50ms average
- **Error Rate**: <0.1%

### Monitoring Dashboards
```typescript
// Key metrics to monitor
const metrics = {
  // Application metrics
  httpRequestsPerSecond: 'rate(http_requests_total[5m])',
  averageResponseTime: 'histogram_quantile(0.95, rate(http_request_duration_seconds_bucket[5m]))',

  // System metrics
  cpuUsage: '100 - (avg by (instance) (irate(node_cpu_seconds_total{mode="idle"}[5m])) * 100)',
  memoryUsage: '100 - ((node_memory_MemAvailable_bytes / node_memory_MemTotal_bytes) * 100)',

  // Database metrics
  activeConnections: 'pg_stat_activity_count{state="active"}',
  databaseSize: 'pg_database_size_bytes{datname="dogegift"}',

  // Blockchain metrics
  gasPrice: 'eth_gas_price_gwei',
  blockTime: 'eth_block_time_seconds',
};
```

## Cost Optimization

### Cloud Cost Management
```bash
# AWS Cost Explorer
# Monitor EC2, RDS, ELB costs
# Set up billing alerts

# Reserved instances for predictable workloads
aws ec2 purchase-reserved-instances-offering \
  --reserved-instances-offering-id offering-id \
  --instance-count 1

# Auto scaling for variable loads
aws autoscaling create-auto-scaling-group \
  --auto-scaling-group-name dogegift-asg \
  --launch-template LaunchTemplateId=lt-1234567890 \
  --min-size 2 \
  --max-size 10 \
  --desired-capacity 3
```

### Database Cost Optimization
```sql
-- Archive old data
CREATE TABLE gift_pack_archive AS
SELECT * FROM gift_pack
WHERE created_at < NOW() - INTERVAL '1 year';

DELETE FROM gift_pack
WHERE created_at < NOW() - INTERVAL '1 year';

-- Use appropriate instance sizes
-- Monitor query performance
-- Implement connection pooling
```

## Compliance & Legal

### GDPR Compliance
```typescript
// Data retention
@Injectable()
export class DataRetentionService {
  @Cron('0 0 * * *') // Daily at midnight
  async cleanupOldData() {
    const oneYearAgo = new Date();
    oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);

    await this.prisma.giftPack.deleteMany({
      where: {
        createdAt: {
          lt: oneYearAgo,
        },
        status: 'CLAIMED',
      },
    });
  }
}

// User data export
async exportUserData(userId: string): Promise<UserData> {
  const giftPacks = await this.prisma.giftPack.findMany({
    where: { senderId: userId },
    include: { items: true },
  });

  return {
    userId,
    giftPacks,
    exportDate: new Date(),
  };
}
```

### Security Audits
```bash
# Regular security scans
# Dependency vulnerability checks
npm audit

# SAST (Static Application Security Testing)
# DAST (Dynamic Application Security Testing)
# Container image scanning
docker scan dogegift-backend:latest
```

## Support & Maintenance

### Team Structure
- **DevOps Engineer**: Infrastructure and deployment
- **Backend Developer**: API and database maintenance
- **Frontend Developer**: UI/UX updates and bug fixes
- **Security Engineer**: Security monitoring and incident response
- **Database Administrator**: Database performance and backups

### On-Call Rotation
```bash
# PagerDuty or similar
# Alert channels: Email, SMS, Slack
# Escalation policy:
# - Level 1: Initial response within 15 minutes
# - Level 2: Engineering team within 1 hour
# - Level 3: Management within 4 hours
```

### Documentation Maintenance
```bash
# Update runbooks after changes
# Keep infrastructure as code updated
# Regular security assessments
# Performance monitoring and optimization
```

---

This deployment guide provides comprehensive instructions for setting up DogeGift in production environments. Regular updates and improvements should be made based on operational experience and user feedback.</content>
<parameter name="filePath">/home/ravi/dogeFull/DEPLOYMENT.md
