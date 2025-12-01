import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { GiftpacksService } from './giftpacks.service';
import { PurgeDraftsService } from './purge-drafts.service';
import { GiftpacksController } from './giftpacks.controller';
import { PrismaModule } from 'prisma/prisma.module';
@Module({
  imports: [
    PrismaModule,
    ScheduleModule.forRoot(),
  ],
  providers: [GiftpacksService, PurgeDraftsService],
  controllers: [GiftpacksController],
})
export class GiftpacksModule {}