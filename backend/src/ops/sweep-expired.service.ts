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

    // Collect all on-chain gift IDs associated with expired packs. Support both
    // legacy single giftIdOnChain and the newer JSON array giftIdsOnChain.
    const ids: number[] = [];
    for (const p of expired) {
      if (typeof p.giftIdOnChain === 'number') ids.push(p.giftIdOnChain);
      if (p.giftIdsOnChain) {
        try {
          const parsed = JSON.parse(p.giftIdsOnChain as string);
          if (Array.isArray(parsed)) {
            for (const v of parsed) if (typeof v === 'number') ids.push(v);
          }
        } catch (err) {
          // ignore malformed JSON and continue
          this.logger.warn(`Failed to parse giftIdsOnChain for pack ${p.id}: ${(err as Error).message}`);
        }
      }
    }

    if (ids.length === 0) {
      this.logger.log('No on-chain gift IDs found for expired packs; nothing to refund on-chain.');
      // Still mark packs as REFUNDED locally so they won't be reprocessed
      for (const p of expired) {
        await this.prisma.giftPack.update({ where: { id: p.id }, data: { status: 'REFUNDED' } });
      }
      return;
    }

    // Call smart-contract refund for all expired on-chain gift ids
    try {
      await this.contract.refundExpired(ids);
      this.logger.log(`Refunded ${ids.length} expired gifts on-chain: ${ids.join(',')}`);

      // Mark corresponding packs as REFUNDED in the database. We match if any of the
      // pack's on-chain ids intersect with the refunded ids.
      const refundedPackIds: string[] = [];
      for (const p of expired) {
        const packIds: number[] = [];
        if (typeof p.giftIdOnChain === 'number') packIds.push(p.giftIdOnChain);
        if (p.giftIdsOnChain) {
          try {
            const parsed = JSON.parse(p.giftIdsOnChain as string);
            if (Array.isArray(parsed)) parsed.forEach((v) => typeof v === 'number' && packIds.push(v));
          } catch {}
        }
        const intersects = packIds.some((v) => ids.includes(v));
        if (intersects) {
          await this.prisma.giftPack.update({ where: { id: p.id }, data: { status: 'REFUNDED' } });
          refundedPackIds.push(p.id);
        }
      }

      this.logger.log(`Marked ${refundedPackIds.length} gift packs as REFUNDED: ${refundedPackIds.join(',')}`);
    } catch (err) {
      this.logger.error('Failed to refund expired gift packs on-chain: ' + (err as Error).message);
      // Don't update DB here so we can retry later; controller/job will run again
    }
  }
}
