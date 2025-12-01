import { IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class SiweLoginDto {
  @ApiProperty({
    description: 'Full SIWE message (stringified JSON)',
    example:
      '{"domain":"localhost:3000","address":"0xBbA2be6…","statement":"Sign-in with Ethereum.","uri":"http://localhost:3000","version":"1","chainId":1,"nonce":"0x123456789","issuedAt":"2025-06-09T11:00:00.000Z"}',
  })
  @IsString()
  message: string;

  @ApiProperty({
    description: 'Signature for the SIWE message',
    example: '0x6c6b…b57f',
  })
  @IsString()
  signature: string;
}
