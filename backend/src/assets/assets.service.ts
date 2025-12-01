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
        return {
          contract: tb.contractAddress,
          symbol: meta.symbol,
          decimals: meta.decimals,
          balance: tb.tokenBalance,
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
