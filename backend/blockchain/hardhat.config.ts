import path from "path";
import * as dotenv from "dotenv";

dotenv.config({ path: path.resolve(__dirname, ".env") });
dotenv.config({ path: path.resolve(__dirname, "../.env") });

import { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-ethers";
import "@nomicfoundation/hardhat-chai-matchers";

const { 
  SEPOLIA_BASE_RPC, 
  DEPLOYER_PRIVATE_KEY,
  MAINNET_RPC,
  MAINNET_PRIVATE_KEY,
  POLYGON_RPC,
  POLYGON_PRIVATE_KEY,
  BSC_RPC,
  BSC_PRIVATE_KEY
} = process.env;

const config: HardhatUserConfig = {
  solidity: {
    version: "0.8.28",
    settings: {
      optimizer: {
        enabled: true,
        runs: 200,
      },
      viaIR: true,
    },
  },
  networks: {
    sepolia: {
      url: SEPOLIA_BASE_RPC || "https://ethereum-sepolia-rpc.publicnode.com",
      accounts: DEPLOYER_PRIVATE_KEY ? [DEPLOYER_PRIVATE_KEY] : [],
    },
    mainnet: {
      url: MAINNET_RPC || "https://eth-mainnet.g.alchemy.com/v2/your-api-key",
      accounts: MAINNET_PRIVATE_KEY ? [MAINNET_PRIVATE_KEY] : [],
      gasPrice: "auto",
    },
    polygon: {
      url: POLYGON_RPC || "https://polygon-mainnet.g.alchemy.com/v2/your-api-key",
      accounts: POLYGON_PRIVATE_KEY ? [POLYGON_PRIVATE_KEY] : [],
      gasPrice: 50000000000, // 50 gwei
    },
    bsc: {
      url: BSC_RPC || "https://bsc-dataseed.binance.org/",
      accounts: BSC_PRIVATE_KEY ? [BSC_PRIVATE_KEY] : [],
      gasPrice: 5000000000, // 5 gwei
    },
  },
};

export default config;
