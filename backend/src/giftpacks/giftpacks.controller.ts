
import {
  Controller, Post, Get, Patch, Delete, Param, Body, UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiParam } from '@nestjs/swagger';
import { GiftpacksService } from './giftpacks.service';
import { AddItemDto } from './dto/add-item.dto';
import { WalletAuthGuard } from '../auth/wallet.guard';
import { CreateGiftpackDto } from './dto/create-giftpack.dto';
import { UpdateGiftpackDto } from './dto/update-giftpacks.dto';
import { GiftPack, GiftItem } from '@prisma/client';

@ApiTags('Giftpacks')
@Controller('giftpacks')
export class GiftpacksController {
  constructor(private readonly service: GiftpacksService) {}

  @Get('code/:giftCode')
  @ApiOperation({ summary: 'Get gift pack by gift code (public, no auth required)' })
  @ApiParam({ name: 'giftCode', description: 'Gift code (unique)' })
  async getGiftByGiftCode(@Param('giftCode') giftCode: string): Promise<GiftPack & { items: GiftItem[] }> {
    return this.service.getGiftByGiftCode(giftCode);
  }


  @ApiBearerAuth()
  @Post()
  @ApiOperation({ summary: 'Create a new draft gift pack' })
  create(@Body() dto: CreateGiftpackDto): Promise<GiftPack> {
    return this.service.createDraft(dto);
  }

  @UseGuards(WalletAuthGuard)
  @ApiBearerAuth()
  @Get(':id')
  @ApiOperation({ summary: 'Get a gift pack by ID' })
  @ApiParam({ name: 'id', description: 'GiftPack ID' })
  get(@Param('id') id: string): Promise<GiftPack & { items: GiftItem[] }> {
    return this.service.getDraft(id);
  }

  @UseGuards(WalletAuthGuard)
  @ApiBearerAuth()
  @Patch(':id')
  @ApiOperation({ summary: 'Update draft gift pack metadata' })
  update(@Param('id') id: string, @Body() dto: UpdateGiftpackDto): Promise<GiftPack> {
    return this.service.updateDraft(id, dto);
  }

  @UseGuards(WalletAuthGuard)
  @ApiBearerAuth()
  @Delete(':id')
  @ApiOperation({ summary: 'Delete a draft gift pack' })
  delete(@Param('id') id: string) {
    return this.service.deleteDraft(id);
  }

  @UseGuards(WalletAuthGuard)
  @ApiBearerAuth()
  @Post(':id/items')
  @ApiOperation({ summary: 'Add item to gift pack' })
  addItem(@Param('id') id: string, @Body() dto: AddItemDto): Promise<GiftItem> {
    return this.service.addItem(id, dto);
  }

  @UseGuards(WalletAuthGuard)
  @ApiBearerAuth()
  @Delete(':id/items/:itemId')
  @ApiOperation({ summary: 'Remove item from gift pack' })
  removeItem(@Param('id') id: string, @Param('itemId') itemId: string) {
    return this.service.removeItem(id, itemId);
  }

  @UseGuards(WalletAuthGuard)
  @ApiBearerAuth()
  @Get(':id/validate')
  @ApiOperation({ summary: 'Validate gift pack for blockchain locking' })
  @ApiParam({ name: 'id', description: 'GiftPack ID' })
  validateGiftPack(@Param('id') id: string) {
    return this.service.validateGiftForLocking(id);
  }

  @UseGuards(WalletAuthGuard)
  @ApiBearerAuth()
  @Post(':id/lock')
  @ApiOperation({ summary: 'Lock gift pack on blockchain (code-only; recipient not required)' })
  @ApiParam({ name: 'id', description: 'GiftPack ID' })
  lockGiftPack(@Param('id') id: string): Promise<any> {
    return this.service.lockGiftPack(id);
  }

  @UseGuards(WalletAuthGuard)
  @ApiBearerAuth()
  @Patch(':id/on-chain')
  @ApiOperation({ summary: 'Update gift pack with on-chain gift ID after frontend locking' })
  @ApiParam({ name: 'id', description: 'GiftPack ID' })
  updateWithOnChainId(
    @Param('id') id: string,
    @Body() data: { onChainGiftId: number; txHash: string }
  ): Promise<GiftPack & { items: GiftItem[] }> {
    return this.service.updateWithOnChainId(id, data.onChainGiftId, data.txHash);
  }

  @UseGuards(WalletAuthGuard)
  @ApiBearerAuth()
  @Get('on-chain/:giftId/status')
  @ApiOperation({ summary: 'Get on-chain gift status' })
  @ApiParam({ name: 'giftId', description: 'On-chain gift ID' })
  getOnChainGiftStatus(@Param('giftId') giftId: string) {
    return this.service.getGiftStatus(parseInt(giftId, 10));
  }

  @UseGuards(WalletAuthGuard)
  @ApiBearerAuth()
  @Get('user/:address')
  @ApiOperation({ summary: 'Get gift packs created by a user' })
  @ApiParam({ name: 'address', description: 'User wallet address' })
  getUserGiftPacks(@Param('address') address: string): Promise<Array<GiftPack & { items: GiftItem[] }>> {
    return this.service.getUserGiftPacks(address);
  }

  @UseGuards(WalletAuthGuard)
  @ApiBearerAuth()
  @Get('claimed/:address')
  @ApiOperation({ summary: 'Get gift packs claimed by a user' })
  @ApiParam({ name: 'address', description: 'User wallet address' })
  getUserClaimedGifts(@Param('address') address: string) {
    return this.service.getUserClaimedGifts(address);
  }

  @Get('smart-contract/status')
  @ApiOperation({ summary: 'Get smart contract configuration status' })
  getSmartContractStatus() {
    return this.service.getSmartContractStatus();
  }

  @Get('smart-contract/enabled')
  @ApiOperation({ summary: 'Check if smart contract features are available' })
  isSmartContractEnabled() {
    return { enabled: this.service.isSmartContractAvailable() };
  }

  @UseGuards(WalletAuthGuard)
  @ApiBearerAuth()
  @Get('on-chain/:giftId')
  @ApiOperation({ summary: 'Get gift pack by on-chain gift ID' })
  @ApiParam({ name: 'giftId', description: 'On-chain gift ID' })
  async getGiftByOnChainId(@Param('giftId') giftId: string): Promise<GiftPack & { items: GiftItem[] }> {
    return this.service.getGiftByOnChainId(Number(giftId));
  }

  @Get('on-chain/:giftId/preview')
  @ApiOperation({ summary: 'Get public gift preview info for claiming (no auth required)' })
  @ApiParam({ name: 'giftId', description: 'On-chain gift ID' })
  async getGiftPreview(@Param('giftId') giftId: string): Promise<any> {
    return this.service.getGiftPreview(Number(giftId));
  }
}
