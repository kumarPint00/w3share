import { IsEnum, IsOptional, IsNumberString, IsString, Matches } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export enum AssetType { ERC20='ERC20', ERC721='ERC721' }

export class AddItemDto {
  @ApiProperty({ enum: AssetType })
  @IsEnum(AssetType)
  type: AssetType;

  @ApiProperty({ description: 'Token contract address or "native"' })
  @IsString()
  @Matches(/^(native|0x[a-fA-F0-9]{40})$/, { message: 'contract must be "native" or a valid Ethereum address' })
  contract: string;

  @ApiProperty({ description: 'Token ID for ERC721', required: false })
  @IsOptional()
  @IsNumberString()
  tokenId?: string;

  @ApiProperty({ description: 'Amount for ERC20 in wei', required: false })
  @IsOptional()
  @IsNumberString()
  amount?: string;
}