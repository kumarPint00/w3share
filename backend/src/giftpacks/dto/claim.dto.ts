import { IsNumber, IsOptional, IsString } from 'class-validator';
import { ApiPropertyOptional, ApiProperty } from '@nestjs/swagger';

export class ClaimDto {
  @ApiPropertyOptional({ example: 0, description: 'On-chain giftId to claim (numeric). Optional if giftCode is provided.' })
  @IsOptional()
  @IsNumber()
  giftId?: number;

  @ApiPropertyOptional({ example: 'ABCD-1234-XYZ', description: 'String gift code. Optional if giftId is provided.' })
  @IsOptional()
  @IsString()
  giftCode?: string;

  @ApiProperty({ example: '0xBbA2be6c5336…', description: 'Wallet address of claimer' })
  @IsString()
  claimer: string;
}
