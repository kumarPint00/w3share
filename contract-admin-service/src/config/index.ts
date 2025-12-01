import dotenv from 'dotenv';
import path from 'path';

// Load environment variables from .env file
dotenv.config();

// Define config interface
export interface Config {
  port: number;
  rpcUrl: string;
  privateKey: string;
  contractAddress: string;
  apiKey: string;
  allowedOrigins: string[];
  logLevel: string;
}

// Export configuration object
export const config: Config = {
  port: parseInt(process.env.PORT || '3001', 10),
  rpcUrl: process.env.RPC_URL || 'https://sepolia.infura.io/v3/YOUR_INFURA_PROJECT_ID',
  privateKey: process.env.PRIVATE_KEY || '',
  contractAddress: process.env.CONTRACT_ADDRESS || '',
  apiKey: process.env.API_KEY || '',
  allowedOrigins: (process.env.ALLOWED_ORIGINS || 'http://localhost:3000').split(','),
  logLevel: process.env.LOG_LEVEL || 'info',
};

// Validate configuration
export function validateConfig(): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (!config.rpcUrl || config.rpcUrl.includes('YOUR_')) {
    errors.push('RPC_URL is not configured');
  }

  if (!config.privateKey || config.privateKey === '0xYourDeployerPrivateKeyHere') {
    errors.push('PRIVATE_KEY is not configured');
  }

  if (!config.contractAddress || config.contractAddress === '0xYourGiftEscrowAddressHere') {
    errors.push('CONTRACT_ADDRESS is not configured');
  }

  if (!config.apiKey || config.apiKey === 'your_admin_api_key_here') {
    errors.push('API_KEY is not configured');
  }

  return {
    valid: errors.length === 0,
    errors
  };
}

export default config;
