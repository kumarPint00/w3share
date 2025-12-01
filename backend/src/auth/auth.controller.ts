import {
  Body,
  Controller,
  Get,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiBody,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { WalletNonceDto } from './dto/wallet-nonce.dto';
import { SiweLoginDto } from './dto/siwe-login.dto';
import { WalletAuthGuard } from './wallet.guard';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly auth: AuthService) {}

  /* ---------- 1. request nonce ---------- */
  @Post('wallet-nonce')
  @ApiOperation({ summary: 'Request a SIWE nonce' })
  @ApiBody({ type: WalletNonceDto })
  @ApiCreatedResponse({
    description: 'Nonce generated',
    schema: { example: { nonce: '0xabc123...' } },
  })
  async walletNonce(@Body() dto: WalletNonceDto) {
    return { nonce: await this.auth.generateNonce(dto.address) };
  }

  /* ---------- 2. verify SIWE ---------- */
  @Post('siwe')
  @ApiOperation({ summary: 'Exchange SIWE signature for JWT' })
  @ApiBody({ type: SiweLoginDto })
  @ApiOkResponse({
    description: 'JWT issued',
    schema: { example: { accessToken: 'eyJhbGciOiJIUzI1NiIsInR5cCI6...' } },
  })
  async siweLogin(@Body() dto: SiweLoginDto) {
    const token = await this.auth.validateSiwe(dto.message, dto.signature);
    return { accessToken: token };
  }

  /* ---------- 3. session ---------- */
  @Get('session')
  @UseGuards(WalletAuthGuard)
  @ApiOperation({ summary: 'Get current wallet session' })
  @ApiBearerAuth()
  @ApiOkResponse({
    schema: {
      example: {
        address: '0xBbA2be6c533645b6A51463a12ca31c60E24b6f52',
        loginAt: '2025-06-09T11:05:00.000Z',
      },
    },
  })
  session(@Req() req) {
    return { address: req.user.address, loginAt: new Date().toISOString() };
  }
}
