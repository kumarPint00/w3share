import { IsEthereumAddress } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class WalletNonceDto {
  @ApiProperty({
    example: '0xBbA2be6c533645b6A51463a12ca31c60E24b6f52',
    description: 'Wallet address requesting a nonce',
  })
  @IsEthereumAddress()
  address: string;
}
