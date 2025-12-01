import { IsOptional, IsString, IsISO8601 } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateGiftpackDto {
  @ApiProperty({ description: 'Optional message for recipient', required: false })
  @IsOptional()
  @IsString()
  message?: string;

  @IsString()
  senderAddress: string;
  @ApiProperty({ description: 'Sender wallet address', example: '0xBbA2be6c5336…' })
  @IsString()

  @ApiProperty({ description: 'ISO8601 expiry datetime', example: '2025-07-16T00:00:00Z' })
  @IsISO8601()
  expiry: string;

  @ApiPropertyOptional({ description: 'Optional human-friendly gift code (must be unique)', example: 'DOGE-2025-AB12' })
  @IsOptional()
  @IsString()
  giftCode?: string;
}