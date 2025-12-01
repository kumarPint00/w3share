import { Module } from '@nestjs/common';
import { ClaimController } from './claim.controller';
import { ClaimService } from './claim.service';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from 'prisma/prisma.module';

@Module({
  imports: [PrismaModule, ConfigModule],
  controllers: [ClaimController],
  providers: [ClaimService],
})
export class ClaimModule {}
