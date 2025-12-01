import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from 'prisma/prisma.service';

@Injectable()
export class PurgeDraftsService {
  private readonly logger = new Logger(PurgeDraftsService.name);

  constructor(private readonly prisma: PrismaService) {}

  @Cron(CronExpression.EVERY_HOUR)
  async handleCron() {
    const cutoff = new Date(Date.now() - 24 * 3600 * 1000);
    const deleted = await this.prisma.giftPack.deleteMany({
      where: { status: 'DRAFT', createdAt: { lt: cutoff } },
    });
    if (deleted.count > 0) {
      this.logger.log(`Purged ${deleted.count} stale drafts`);
    }
  }
}
