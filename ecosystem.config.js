module.exports = {
  apps: [
    {
      name: 'dogegift-backend',
      script: 'dist/src/main.js',
      cwd: './backend',
      instances: 1,
      exec_mode: 'fork',  // Changed from cluster to fork for single instance
      autorestart: true,
      watch: false,
      max_memory_restart: '1G',
      env: {
        NODE_ENV: 'production',
        PORT: 4000,
        DATABASE_URL: 'postgresql://postgres:mynewpassword@localhost:5434/dogegf',
        JWT_SECRET: 'supersecret_string_here',
        SEPOLIA_BASE_RPC: 'https://eth-sepolia.g.alchemy.com/v2/gGyT5UVlni23o2468AIZN',
        SEPOLIA_CHAIN_ID: '11155111',
        ALCHEMY_BASE_KEY: 'gGyT5UVlni23o2468AIZN',
        DEPLOYER_PRIVATE_KEY: '0x4567890123456789012345678901234567890123456789012345678901234567',
        GIFT_ESCROW_ADDRESS: '0x2345678901234567890123456789012345678901',
        CORS_ORIGINS: 'http://localhost:3000,http://192.168.1.3:3000',
        FRONTEND_URL: 'http://192.168.1.3:3000',
      },
    },
    {
      name: 'dogegift-frontend',
      script: 'node_modules/next/dist/bin/next',
      args: 'start -p 3000',
      cwd: './frontend',
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '1G',
      env: {
        NODE_ENV: 'production',
        PORT: 3000,
        NEXT_PUBLIC_API_URL: 'http://192.168.1.3:4000',
      },
    },
  ],
};
