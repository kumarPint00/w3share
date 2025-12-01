# API Integration Setup Guide

This guide explains how to set up and configure the DogeGift application with the integrated frontend and backend APIs.

## Prerequisites

- Node.js 20+
- PostgreSQL database
- Git

## Backend Setup

1. **Navigate to backend directory:**
```bash
cd doge_backend
```

2. **Install dependencies:**
```bash
npm install
```

3. **Set up environment variables:**
Create a `.env` file with the following variables:
```env
DATABASE_URL="postgresql://username:password@localhost:5432/dogegift"
JWT_SECRET="your-super-secret-jwt-key"
```

4. **Set up the database:**
```bash
# Generate Prisma client
npx prisma generate

# Run database migrations
npx prisma migrate dev

# (Optional) Seed the database
npx prisma db seed
```

5. **Start the backend:**
```bash
# Development mode
npm run start:dev

# Production mode
npm run start:prod
```

The backend will be available at:
- API: http://localhost:3000
- Swagger docs: http://localhost:3000/docs

## Frontend Setup

1. **Navigate to frontend directory:**
```bash
cd doge_frontend
```

2. **Install dependencies:**
```bash
npm install
```

3. **Set up environment variables:**
Create a `.env.local` file with:
```env
NEXT_PUBLIC_API_URL=http://localhost:3000
```

4. **Start the frontend:**
```bash
# Development mode
npm run dev

# Build for production
npm run build
npm start
```

The frontend will be available at http://localhost:3001

## Nginx Configuration (Production)

For production deployment, set up nginx to proxy API calls:

```nginx
server {
    listen 80;
    server_name yourdomain.com;

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
        proxy_cache_bypass $http_upgrade;
    }

    # Backend API
    location /api/ {
        rewrite ^/api/(.*) /$1 break;
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # Backend health check
    location /healthz {
        proxy_pass http://localhost:3000/healthz;
    }

    # Swagger docs
    location /docs {
        proxy_pass http://localhost:3000/docs;
    }
}
```

## Docker Setup

### Backend Dockerfile
```dockerfile
# Use the existing Dockerfile in doge_backend/
# It's already configured for production deployment
```

### Frontend Dockerfile
```dockerfile
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
EXPOSE 3000
CMD ["node", "server.js"]
```

### Docker Compose
```yaml
version: '3.8'
services:
  database:
    image: postgres:15
    environment:
      POSTGRES_DB: dogegift
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: password
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data

  backend:
    build: ./doge_backend
    ports:
      - "3000:3000"
    environment:
      DATABASE_URL: postgresql://postgres:password@database:5432/dogegift
      JWT_SECRET: your-super-secret-jwt-key
    depends_on:
      - database

  frontend:
    build: ./doge_frontend
    ports:
      - "3001:3000"
    environment:
      NEXT_PUBLIC_API_URL: http://localhost:3000
    depends_on:
      - backend

volumes:
  postgres_data:
```

## Testing the Integration

1. **Use the API Integration Test component:**
   Import and use the `ApiIntegrationTest` component in your frontend app to verify all endpoints are working.

2. **Manual API testing with curl:**
```bash
# Health check
curl http://localhost:3000/healthz

# Request nonce
curl -X POST http://localhost:3000/auth/wallet-nonce \
  -H "Content-Type: application/json" \
  -d '{"address":"0x742d35Cc6634C0532925a3b8D0D78E4C2bDBe5C1"}'

# Get supported tokens
curl http://localhost:3000/assets/tokens/allow-list

# Check Swagger docs
open http://localhost:3000/docs
```

3. **Frontend integration test:**
   Visit your frontend app and navigate to the API test page to run automated tests.

## Troubleshooting

### Common Issues

1. **CORS errors:**
   - Ensure the backend allows requests from your frontend domain
   - Check that `NEXT_PUBLIC_API_URL` is correctly set

2. **Database connection issues:**
   - Verify PostgreSQL is running
   - Check `DATABASE_URL` format and credentials
   - Run `npx prisma migrate dev` to ensure schema is up to date

3. **JWT authentication errors:**
   - Verify `JWT_SECRET` is set in backend environment
   - Check that the frontend is sending the Authorization header correctly

4. **API endpoint not found:**
   - Verify the backend is running on the correct port
   - Check that the API routes are properly registered in the app module

### Debug Tips

1. **Enable debug logging:**
```bash
# Backend
DEBUG=* npm run start:dev

# Frontend
npm run dev -- --debug
```

2. **Check database state:**
```bash
cd doge_backend
npx prisma studio
```

3. **Monitor API calls:**
   - Use browser dev tools Network tab
   - Check backend logs for request processing
   - Use the API Integration Test component for systematic testing

## API Documentation

- **Swagger UI:** http://localhost:3000/docs
- **API Integration Summary:** See `API_INTEGRATION.md`
- **Postman Collection:** Export from Swagger UI or create from the documented endpoints

## Security Considerations

1. **JWT Secret:** Use a strong, random secret in production
2. **CORS:** Configure allowed origins properly
3. **Rate Limiting:** Consider implementing rate limiting for public endpoints
4. **Input Validation:** All DTOs have validation decorators - ensure they're properly applied
5. **HTTPS:** Use HTTPS in production for all API communication

## Performance Optimization

1. **Database indexing:** Add indexes for frequently queried fields
2. **API caching:** Implement caching for read-heavy endpoints
3. **Connection pooling:** Configure PostgreSQL connection pooling
4. **Frontend caching:** Use React Query cache configuration optimally
5. **CDN:** Serve static assets through a CDN in production
