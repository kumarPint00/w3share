import { Controller, Post, Body, Get, Param, BadRequestException } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiParam, ApiOkResponse, ApiBody } from '@nestjs/swagger';
import { ClaimService } from './claim.service';
import { ClaimDto } from '../giftpacks/dto/claim.dto';

@ApiTags('Claim')
@Controller('claim')
export class ClaimController {
  constructor(private readonly claimService: ClaimService) {}

  @Post()
  @ApiOperation({ summary: 'Submit a claim commitment (phase 1 of commit-reveal)' })
  @ApiOkResponse({
    schema: {
      example: {
        contract: '0x...',
        function: 'commitClaim',
        args: ['0x...codeHash', '0x...commitment'],
        data: '0x...',
        chainId: '11155111',
        commitRevealDelay: 1,
        message: 'Step 1 of 2: Reserve your claim.',
      },
    },
  })
  async submit(@Body() dto: ClaimDto & { giftCode?: string }) {
    if (!dto) throw new BadRequestException('Body required');

    const hasCode = typeof dto.giftCode === 'string' && dto.giftCode.trim().length > 0;
    if (!hasCode) throw new BadRequestException('giftCode is required');
    if (!dto.claimer || typeof dto.claimer !== 'string') {
      throw new BadRequestException('claimer is required');
    }

    return this.claimService.submitClaimByCode(dto.giftCode!.trim(), dto.claimer);
  }

  @Post('commit')
  @ApiOperation({
    summary: 'Phase 1 – build commitClaim calldata (MEV-resistant commit-reveal)',
    description:
      'Returns calldata to call commitClaim(codeHash, commitment) on the escrow contract. ' +
      'The frontend generates a random nonce, computes commitment = keccak256(abi.encodePacked(claimer, code, nonce)), ' +
      'then passes nonce here. The code is never revealed on-chain in this step.',
  })
  @ApiBody({
    schema: {
      example: { giftCode: 'ABC123', claimer: '0x...', nonce: '0x...32bytes...' },
    },
  })
  async buildCommit(
    @Body() dto: { giftCode: string; claimer: string; nonce: string },
  ) {
    if (!dto?.giftCode) throw new BadRequestException('giftCode is required');
    if (!dto?.claimer) throw new BadRequestException('claimer is required');
    if (!dto?.nonce) throw new BadRequestException('nonce is required');
    return this.claimService.buildCommitData(dto.giftCode.trim(), dto.claimer, dto.nonce);
  }

  @Post('reveal')
  @ApiOperation({
    summary: 'Phase 2 – build revealAndClaim calldata (MEV-resistant commit-reveal)',
    description:
      'Returns calldata to call revealAndClaim(codeHash, code, nonce) on the escrow contract. ' +
      'Must be called at least 1 block after the commitClaim tx was mined. ' +
      'Front-running is impossible because the commitment already binds msg.sender.',
  })
  @ApiBody({
    schema: {
      example: { giftCode: 'ABC123', nonce: '0x...32bytes...' },
    },
  })
  async buildReveal(@Body() dto: { giftCode: string; nonce: string }) {
    if (!dto?.giftCode) throw new BadRequestException('giftCode is required');
    if (!dto?.nonce) throw new BadRequestException('nonce is required');
    return this.claimService.buildRevealData(dto.giftCode.trim(), dto.nonce);
  }

  @Post('code/:giftCode')
  @ApiOperation({ summary: 'Get commit calldata for a gift by code (phase 1)' })
  @ApiParam({ name: 'giftCode', description: 'Gift code (string)' })
  async getClaimDataByCode(
    @Param('giftCode') giftCode: string,
    @Body() dto: { claimer: string; nonce?: string },
  ) {
    const code = (giftCode || '').trim();
    if (!code) throw new BadRequestException('giftCode is required');
    if (!dto.claimer || typeof dto.claimer !== 'string') {
      throw new BadRequestException('claimer is required');
    }
    const nonce = dto.nonce || require('ethers').ethers.hexlify(require('ethers').ethers.randomBytes(32));
    return this.claimService.buildCommitData(code, dto.claimer, nonce);
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

  @Post('confirm')
  @ApiOperation({ summary: 'Confirm a client-executed claim (mark gift as CLAIMED)' })
  async confirm(@Body() dto: { giftCode?: string; giftId?: number; txHash?: string; claimer?: string }) {
    if (!dto) throw new BadRequestException('Body required');
    if (!dto.txHash || typeof dto.txHash !== 'string') throw new BadRequestException('txHash is required');

    if (dto.giftCode && typeof dto.giftCode === 'string') {
      return this.claimService.confirmClaimByCode(dto.giftCode.trim(), dto.txHash, dto.claimer);
    }

    if (dto.giftId && typeof dto.giftId === 'number') {
      return this.claimService.confirmClaimById(dto.giftId, dto.txHash, dto.claimer);
    }

    throw new BadRequestException('giftCode or giftId required');
  }
}
