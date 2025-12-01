import { Controller, Post, Body, Get, Param, BadRequestException } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiParam, ApiOkResponse } from '@nestjs/swagger';
import { ClaimService } from './claim.service';
import { ClaimDto } from '../giftpacks/dto/claim.dto';

@ApiTags('Claim')
@Controller('claim')
export class ClaimController {
  constructor(private readonly claimService: ClaimService) {}

  @Post()
  @ApiOperation({ summary: 'Submit a gasless claim for a gift' })
  @ApiOkResponse({ schema: { example: { taskId: '0xabc123' } } })
  async submit(@Body() dto: ClaimDto & { giftId?: number | string; giftCode?: string }) {
    if (!dto) throw new BadRequestException('Body required');

    const hasNumeric = dto.giftId !== undefined && dto.giftId !== null && `${dto.giftId}`.trim() !== '';
    const hasCode = typeof dto.giftCode === 'string' && dto.giftCode.trim().length > 0;

    if (!hasNumeric && !hasCode) {
      throw new BadRequestException('Provide either giftId (number) or giftCode (string)');
    }

    if (!dto.claimer || typeof dto.claimer !== 'string') {
      throw new BadRequestException('claimer is required');
    }

    if (hasNumeric) {
      const n = typeof dto.giftId === 'string' ? Number.parseInt(dto.giftId as any, 10) : (dto.giftId as number);
      if (!Number.isFinite(n)) throw new BadRequestException('giftId must be a number');
      return this.claimService.submitClaimById(n, dto.claimer);
    }

    return this.claimService.submitClaimByCode(dto.giftCode!.trim(), dto.claimer);
  }

  @Post('id/:giftId')
  @ApiOperation({ summary: 'Get claim transaction data for a gift by ID' })
  @ApiParam({ name: 'giftId', description: 'On-chain gift ID (number)' })
  @ApiOkResponse({
    schema: {
      example: {
        contract: '0x...',
        abi: [],
        function: 'claimGift',
        args: [123],
        data: '0x...',
        chainId: '11155111',
        message: 'Call this contract method from your wallet to claim.',
        unwrapInfo: null,
      },
    },
  })
  async getClaimDataById(
    @Param('giftId') giftId: string,
    @Body() dto: { claimer: string },
  ) {
    const n = Number.parseInt(giftId, 10);
    if (!Number.isFinite(n)) {
      throw new BadRequestException('giftId must be a number');
    }
    if (!dto.claimer || typeof dto.claimer !== 'string') {
      throw new BadRequestException('claimer is required');
    }
    return this.claimService.submitClaimById(n, dto.claimer);
  }

  @Get('status/:giftRef')
  @ApiOperation({ summary: 'Check claim status for a gift' })
  @ApiParam({ name: 'giftRef', description: 'On-chain gift ID (number) or string gift code' })
  @ApiOkResponse({ schema: { example: { status: 'CLAIMED', taskId: '0xabc123' } } })
  async status(@Param('giftRef') giftRef: string) {
    if (/^\d+$/.test(giftRef)) {
      return this.claimService.getStatusById(Number.parseInt(giftRef, 10));
    }
    return this.claimService.getStatusByCode(giftRef);
  }
}
