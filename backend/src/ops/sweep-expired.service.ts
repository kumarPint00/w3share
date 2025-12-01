import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '../prisma/prisma.service';
import { ethers } from 'ethers';
import GiftEscrowArtifact from '../../../contracts/artifacts/contracts/GiftEscrow.sol/GiftEscrow.json';

@Injectable()
export class SweepExpiredService {
  private readonly logger = new Logger(SweepExpiredService.name);
  private provider = new ethers.providers.JsonRpcProvider(process.env.SEPOLIA_BASE_RPC);
  private signer = new ethers.Wallet(process.env.DEPLOYER_PRIVATE_KEY!, this.provider);
  private contract = new ethers.Contract(process.env.GIFT_ESCROW_ADDRESS!, GiftEscrowArtifact.abi, this.signer);

  constructor(private prisma: PrismaService) {}

  @Cron(CronExpression.EVERY_DAY)
  async handleCron() {

    const expired = await this.prisma.giftPack.findMany({
      where: { status: 'LOCKED', expiry: { lt: new Date() } },
    });
    if (expired.length === 0) return;

    const ids = expired.map((p) => p.giftIdOnChain!);
    await this.contract.refundExpired(ids);
    this.logger.log(`Refunded ${ids.length} expired gifts: ${ids.join(',')}`);
  }
}
