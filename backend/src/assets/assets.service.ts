import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Alchemy, Network } from 'alchemy-sdk';
import { isAddress } from 'ethers';

@Injectable()
export class AssetsService {
  private readonly alchemy: Alchemy;

  constructor(private readonly config: ConfigService) {
    this.alchemy = new Alchemy({
      apiKey: this.config.get<string>('ALCHEMY_BASE_KEY'),
      network: Network.ETH_SEPOLIA, // ✅ Fixed to Sepolia testnet
    });
  }

  /* --- ERC-20 balances --- */
  async getErc20Balances(address: string) {
    if (!isAddress(address)) {
      throw new HttpException('Invalid Ethereum address', HttpStatus.BAD_REQUEST);
    }
    const resp = await this.alchemy.core.getTokenBalances(address);
    return Promise.all(
      resp.tokenBalances.map(async (tb) => {
        const meta = await this.alchemy.core.getTokenMetadata(tb.contractAddress);
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
        };
      }),
    );
  }

  /* --- NFTs --- */
  async getNfts(address: string, pageKey?: string) {
    if (!isAddress(address)) {
      throw new HttpException('Invalid Ethereum address', HttpStatus.BAD_REQUEST);
    }
    const resp = await this.alchemy.nft.getNftsForOwner(address, {
      pageKey,
      pageSize: 25,
    });
    return {
      nfts: resp.ownedNfts.map((nft) => ({
        contract: nft.contract.address,
        tokenId: nft.tokenId,


      })),
      pageKey: resp.pageKey,
    };
  }

  /* --- Allow-list --- */
  getAllowList() {
    return require('../config/allowedToken.json');
  }
}
