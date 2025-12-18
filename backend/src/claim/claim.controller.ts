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

    const hasCode = typeof dto.giftCode === 'string' && dto.giftCode.trim().length > 0;

    if (!hasCode) {
      throw new BadRequestException('giftCode is required');
    }

    if (!dto.claimer || typeof dto.claimer !== 'string') {
      throw new BadRequestException('claimer is required');
    }

    // Use giftCode to look up the gift and claim it
    return this.claimService.submitClaimByCode(dto.giftCode!.trim(), dto.claimer);
  }

  @Post('code/:giftCode')
  @ApiOperation({ summary: 'Get claim transaction data for a gift by code' })
  @ApiParam({ name: 'giftCode', description: 'Gift code (string)' })
  @ApiOkResponse({
    schema: {
      example: {
        contract: '0x...',
        abi: [],
        function: 'claimGiftPackWithCode',
        args: ['0x...', 'giftcode'],
        data: '0x...',
        chainId: '11155111',
        message: 'Call this contract method from your wallet to claim.',
        unwrapInfo: null,
      },
    },
  })
  async getClaimDataByCode(
    @Param('giftCode') giftCode: string,
    @Body() dto: { claimer: string },
  ) {
    const code = (giftCode || '').trim();
    if (!code) {
      throw new BadRequestException('giftCode is required');
    }
    if (!dto.claimer || typeof dto.claimer !== 'string') {
      throw new BadRequestException('claimer is required');
    }
    return this.claimService.submitClaimByCode(code, dto.claimer);
  }

  @Get('status/:giftRef')
  @ApiOperation({ summary: 'Check claim status for a gift' })
  @ApiParam({ name: 'giftRef', description: 'On-chain gift ID (number) or string gift code' })
  @ApiOkResponse({ schema: { example: { status: 'CLAIMED', taskId: '0xabc123' } } })
  async status(@Param('giftRef') giftRef: string): Promise<any> {
    if (/^\d+$/.test(giftRef)) {
      return this.claimService.getStatusById(Number.parseInt(giftRef, 10));
    }
    return this.claimService.getStatusByCode(giftRef);
  }
}
