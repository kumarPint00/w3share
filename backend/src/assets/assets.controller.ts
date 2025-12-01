import { Controller, Get, Query } from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiQuery,
  ApiOkResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { AssetsService } from './assets.service';

@ApiTags('Assets')
@ApiBearerAuth()
@Controller('assets')
export class AssetsController {
  constructor(private readonly assets: AssetsService) {}

  /* ---------- ERC-20 balances ---------- */
  @Get('erc20')
  @ApiOperation({ summary: 'Get ERC-20 token balances for a wallet' })
  @ApiQuery({ name: 'address', required: true, example: '0xBbA2be6c53…' })
  @ApiOkResponse({
    description: 'Array of token balances',
    schema: {
      example: [
        {
          contract: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48',
          symbol: 'USDC',
          decimals: 6,
          balance: '15000000',
        },
      ],
    },
  })
  async erc20(@Query('address') address: string) {
    return this.assets.getErc20Balances(address);
  }

  /* ---------- NFTs ---------- */
  @Get('nft')
  @ApiOperation({ summary: 'Get NFTs owned by a wallet' })
  @ApiQuery({ name: 'address', required: true, example: '0xBbA2be6c53…' })
  @ApiQuery({ name: 'pageKey', required: false })
  @ApiOkResponse({
    schema: {
      example: {
        nfts: [
          {
            contract: '0x1234…',
            tokenId: '42',
            name: 'Cool NFT',
            image: 'https://ipfs.io/ipfs/xyz.png',
          },
        ],
        pageKey: 'abc123',
      },
    },
  })
  async nft(@Query('address') address: string, @Query('pageKey') pageKey?: string) {
    return this.assets.getNfts(address, pageKey);
  }

  /* ---------- allow-list ---------- */
  @Get('/tokens/allow-list')
  @ApiOperation({ summary: 'Get supported token allow list' })
  @ApiOkResponse({
    schema: {
      example: [
        { contract: '0xA0b8…eB48', symbol: 'USDC', decimals: 6 },
        { contract: '0xdAC1…ec7', symbol: 'USDT', decimals: 6 },
      ],
    },
  })
  allowList() {
    return this.assets.getAllowList();
  }
}
