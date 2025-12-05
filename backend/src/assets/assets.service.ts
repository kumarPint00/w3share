import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Alchemy, Network } from 'alchemy-sdk';
import { isAddress } from 'ethers';

@Injectable()
export class AssetsService {
  private readonly alchemyKey: string;

  constructor(private readonly config: ConfigService) {
    this.alchemyKey = this.config.get<string>('ALCHEMY_BASE_KEY') || '';
  }

  // Map chain IDs to Alchemy networks
  private getAlchemyNetwork(chainId: number): Network {
    switch (chainId) {
      // Ethereum networks
      case 1:
        return Network.ETH_MAINNET;
      case 11155111:
        return Network.ETH_SEPOLIA;
      case 5:
        return Network.ETH_GOERLI;
      // Polygon networks
      case 137:
        return Network.MATIC_MAINNET;
      case 80001:
        return Network.MATIC_MUMBAI;
      // Arbitrum networks
      case 42161:
        return Network.ARB_MAINNET;
      case 421614:
        return Network.ARB_SEPOLIA;
      // Optimism networks
      case 10:
        return Network.OPT_MAINNET;
      case 11155420:
        return Network.OPT_SEPOLIA;
      // Base networks
      case 8453:
        return Network.BASE_MAINNET;
      case 84532:
        return Network.BASE_SEPOLIA;
      // Avalanche
      case 43114:
        return Network.AVAX_MAINNET;
      case 43113:
        return Network.AVAX_FUJI;
      default:
        // Default to Ethereum Sepolia for unknown networks
        console.warn(`Unknown chain ID ${chainId}, defaulting to Sepolia`);
        return Network.ETH_SEPOLIA;
    }
  }

  private getAlchemy(chainId: number): Alchemy {
    return new Alchemy({
      apiKey: this.alchemyKey,
      network: this.getAlchemyNetwork(chainId),
    });
  }

  // Get list of supported networks
  getSupportedNetworks() {
    const networks = [
      { chainId: 1, name: 'Ethereum Mainnet', type: 'mainnet' },
      { chainId: 11155111, name: 'Ethereum Sepolia', type: 'testnet' },
      { chainId: 5, name: 'Ethereum Goerli', type: 'testnet' },
      { chainId: 137, name: 'Polygon Mainnet', type: 'mainnet' },
      { chainId: 80001, name: 'Polygon Mumbai', type: 'testnet' },
      { chainId: 42161, name: 'Arbitrum Mainnet', type: 'mainnet' },
      { chainId: 421614, name: 'Arbitrum Sepolia', type: 'testnet' },
      { chainId: 10, name: 'Optimism Mainnet', type: 'mainnet' },
      { chainId: 11155420, name: 'Optimism Sepolia', type: 'testnet' },
      { chainId: 8453, name: 'Base Mainnet', type: 'mainnet' },
      { chainId: 84532, name: 'Base Sepolia', type: 'testnet' },
      { chainId: 43114, name: 'Avalanche Mainnet', type: 'mainnet' },
      { chainId: 43113, name: 'Avalanche Fuji', type: 'testnet' },
    ];
    return { networks };
  }

  /* --- ERC-20 balances --- */
  async getErc20Balances(address: string, chainId: number = 11155111) {
    if (!isAddress(address)) {
      throw new HttpException('Invalid Ethereum address', HttpStatus.BAD_REQUEST);
    }
    const alchemy = this.getAlchemy(chainId);
    const resp = await alchemy.core.getTokenBalances(address);
    return Promise.all(
      resp.tokenBalances.map(async (tb) => {
        const meta = await alchemy.core.getTokenMetadata(tb.contractAddress);
        // Convert hex balance to decimal
        const rawBalance = BigInt(tb.tokenBalance || '0x0');
        const decimals = meta.decimals || 18;
        const balance = Number(rawBalance) / Math.pow(10, decimals);
        
        return {
          contract: tb.contractAddress,
          contractAddress: tb.contractAddress,
          symbol: meta.symbol || 'UNKNOWN',
          name: meta.name || meta.symbol || 'Unknown Token',
          decimals: decimals,
          balance: tb.tokenBalance, // Keep raw hex for frontend conversion
          balanceFormatted: balance, // Provide formatted version
          logoURI: meta.logo || `/tokens/${meta.symbol?.toLowerCase()}.png`,
          chainId,
        };
      }),
    );
  }

  /* --- NFTs --- */
  async getNfts(address: string, pageKey?: string, chainId: number = 11155111) {
    if (!isAddress(address)) {
      throw new HttpException('Invalid Ethereum address', HttpStatus.BAD_REQUEST);
    }
    const alchemy = this.getAlchemy(chainId);
    const resp = await alchemy.nft.getNftsForOwner(address, {
      pageKey,
      pageSize: 25,
    });
    return {
      nfts: resp.ownedNfts.map((nft) => ({
        contract: nft.contract.address,
        tokenId: nft.tokenId,
        chainId,
      })),
      pageKey: resp.pageKey,
    };
  }

  /* --- Allow-list --- */
  getAllowList() {
    return require('../config/allowedToken.json');
  }
}
