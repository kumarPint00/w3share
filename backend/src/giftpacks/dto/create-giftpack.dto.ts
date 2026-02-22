import { IsOptional, IsString } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateGiftpackDto {
  @ApiProperty({ description: 'Optional message for recipient', required: false })
  @IsOptional()
  @IsString()
  message?: string;

  @ApiProperty({ description: 'Sender wallet address', example: '0xBbA2be6c5336…' })
  @IsString()
  senderAddress: string;

  @ApiPropertyOptional({ description: 'Optional human-friendly gift code (must be unique)', example: 'DOGE-2025-AB12' })
  @IsOptional()
  @IsString()
  giftCode?: string;
}