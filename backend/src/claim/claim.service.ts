import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ServiceUnavailableException,
} from '@nestjs/common';
import { ethers, JsonRpcProvider } from 'ethers';
import { GelatoRelay } from '@gelatonetwork/relay-sdk';
import * as GiftEscrowArtifact from './gift-escrow.json';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from 'prisma/prisma.service';
import { ClaimTask } from '@prisma/client';

@Injectable()
export class ClaimService {
  private provider: JsonRpcProvider | null = null;
  private gelato: GelatoRelay | null = null;
  private escrowAddress: string | null = null;
  private isClaimingEnabled: boolean = false;
  private mockClaiming: boolean = false;
  private chainId: bigint = 11155111n;

  constructor(
    private prisma: PrismaService,
    private config: ConfigService,
  ) {
    this.initializeClaimingService();
  }

  private initializeClaimingService() {
    try {
      const rpcUrl = this.config.get<string>('SEPOLIA_BASE_RPC');
      const apiKey = this.config.get<string>('GELATO_API_KEY');
      const escrowAddr = this.config.get<string>('GIFT_ESCROW_ADDRESS');
      const chainIdStr = this.config.get<string>('SEPOLIA_CHAIN_ID') || '11155111';

      try {
        this.chainId = BigInt(chainIdStr);
      } catch {
        this.chainId = 11155111n;
      }

      this.mockClaiming = (this.config.get<string>('CLAIM_MOCK') || '').toLowerCase() === 'true' || this.config.get<string>('CLAIM_MOCK') === '1';

      if (!this.isValidClaimConfig(rpcUrl, apiKey, escrowAddr)) {
        console.warn(
          'Claim service configuration incomplete. Smart contract claiming will be disabled.',
        );
        console.warn('To enable claiming, please configure:');
        console.warn('- SEPOLIA_BASE_RPC: Valid RPC URL');
        console.warn('- GELATO_API_KEY: Valid Gelato API key');
        console.warn('- GIFT_ESCROW_ADDRESS: Valid contract address');
        return;
      }

      this.provider = new JsonRpcProvider(rpcUrl);
      this.gelato = new GelatoRelay();
      this.escrowAddress = escrowAddr!;
      this.isClaimingEnabled = true;

      console.log('Claim service initialized successfully');
      console.log(`- Network: ${rpcUrl}`);
      console.log(`- Contract: ${escrowAddr}`);
      console.log(`- Chain ID: ${this.chainId}`);
      if (this.mockClaiming) {
        console.log(
          '- Mock claiming: ENABLED (no external Gelato calls will be made)',
        );
      }
    } catch (error) {
      const errMsg = error instanceof Error ? error.message : String(error);
      console.error('Failed to initialize claim service:', errMsg);
      console.warn('Smart contract claiming will be disabled.');
      this.isClaimingEnabled = false;
    }
  }

  private isValidClaimConfig(
    rpcUrl?: string,
    apiKey?: string,
    escrowAddr?: string,
  ): boolean {
    if (
      !rpcUrl ||
      rpcUrl.includes('YOUR_') ||
      rpcUrl === 'https://sepolia.infura.io/v3/YOUR_INFURA_PROJECT_ID'
    ) {
      return false;
    }

    if (!apiKey || apiKey === 'your_gelato_api_key_here') {
      return false;
    }

    if (
      !escrowAddr ||
      escrowAddr === '0xYourGiftEscrowAddressHere' ||
      !ethers.isAddress(escrowAddr)
    ) {
      return false;
    }

    return true;
  }

  private throwIfClaimingDisabled(operation: string) {
    if (!this.isClaimingEnabled) {
      throw new ServiceUnavailableException({
        error: 'CLAIMING_DISABLED',
        message: `Claiming operation '${operation}' is not available. Please configure blockchain connection and Gelato settings.`,
      });
    }
  }


  async submitClaim(giftId: number, claimer: string) {
    return this.submitClaimById(giftId, claimer);
  }


  async submitClaimById(giftId: number, claimer: string) {
    this.throwIfClaimingDisabled('submitClaimById');

    const pack = await this.prisma.giftPack.findUnique({
      where: { giftIdOnChain: giftId },
      include: { items: true },
    });
    if (!pack || pack.status !== 'LOCKED') {
      throw new NotFoundException({
        message: 'Gift not lockable or already claimed/refunded',
      });
    }

    const giftCode = pack.giftCode ? String(pack.giftCode).trim() : '';
    const useCodePath = giftCode.length > 0;

    // Use the new GiftPack model which stores all assets in a single pack
    // identified by code hash instead of individual gift IDs
    if (useCodePath) {
      const iface = new ethers.Interface(GiftEscrowArtifact.abi);
      const codeHash = ethers.keccak256(ethers.toUtf8Bytes(giftCode));
      const data = iface.encodeFunctionData('claimGiftPackWithCode', [codeHash, giftCode]);

      const unwrapInfo = this.getUnwrapInfo(pack);

      return {
        contract: this.escrowAddress!,
        abi: GiftEscrowArtifact.abi,
        function: 'claimGiftPackWithCode',
        args: [codeHash, giftCode],
        data,
        chainId: this.chainId.toString(),
        message: pack.items.length > 1 
          ? `This gift contains ${pack.items.length} tokens. Claim them all in one transaction.`
          : 'Call this contract method from your wallet to claim.',
        unwrapInfo,
      };
    } else {
      // Non-code path (shouldn't be used with new model, but kept for compatibility)
      const iface = new ethers.Interface(GiftEscrowArtifact.abi);
      const data = iface.encodeFunctionData('claimGift', [giftId]);

      const unwrapInfo = this.getUnwrapInfo(pack);

      return {
        contract: this.escrowAddress!,
        abi: GiftEscrowArtifact.abi,
        function: 'claimGift',
        args: [giftId],
        data,
        chainId: this.chainId.toString(),
        message: 'Call this contract method from your wallet to claim.',
        unwrapInfo,
      };
    }
  }

  private getAllGiftIds(pack: any): number[] {
    // Legacy method - kept for compatibility but not used with new GiftPack model
    // New model uses code hash instead of sequential gift IDs
    if (pack.giftIdsOnChain) {
      try {
        return JSON.parse(pack.giftIdsOnChain);
      } catch {
        return pack.giftIdOnChain ? [pack.giftIdOnChain] : [];
      }
    }
    return pack.giftIdOnChain ? [pack.giftIdOnChain] : [];
  }

  private getUnwrapInfo(pack: any) {
    // Since we're no longer wrapping ETH, there's nothing to unwrap
    // Native ETH is transferred directly from the contract
    return null;
  }





  async submitClaimByCode(giftCode: string, claimer: string) {
    this.throwIfClaimingDisabled('submitClaimByCode');

    const code = (giftCode || '').trim();
    if (!code) {
      throw new BadRequestException({
        message: 'giftCode is required',
      });
    }

    const pack = await this.prisma.giftPack.findFirst({
      where: { giftCode: code },
      include: { items: true },
    });
    if (!pack || pack.status !== 'LOCKED') {
      throw new NotFoundException({
        message: 'Gift not lockable or already claimed/refunded',
      });
    }

    // With the new GiftPack model, we use code hash instead of sequential IDs
    const iface = new ethers.Interface(GiftEscrowArtifact.abi);
    const codeHash = ethers.keccak256(ethers.toUtf8Bytes(code));
    const data = iface.encodeFunctionData('claimGiftPackWithCode', [codeHash, code]);

    const unwrapInfo = this.getUnwrapInfo(pack);

    return {
      contract: this.escrowAddress!,
      abi: GiftEscrowArtifact.abi,
      function: 'claimGiftPackWithCode',
      args: [codeHash, code],
      data,
      chainId: this.chainId.toString(),
      message: pack.items.length > 1 
        ? `This gift contains ${pack.items.length} tokens. Claim them all in one transaction.`
        : 'Call this contract method from your wallet to claim.',
      unwrapInfo,
    };
  }

  /**
   * Confirm a claim that was executed by the client (wallet-signed tx).
   * This marks the GiftPack as CLAIMED and records a ClaimTask with the txHash.
   */
  async confirmClaimByCode(giftCode: string, txHash: string, claimer?: string) {
    const code = (giftCode || '').trim();
    if (!code) throw new BadRequestException({ message: 'giftCode is required' });
    if (!txHash || typeof txHash !== 'string') throw new BadRequestException({ message: 'txHash is required' });

    const pack = await this.prisma.giftPack.findFirst({ where: { giftCode: code } });
    if (!pack) throw new NotFoundException({ message: 'Gift not found' });
    if (pack.status !== 'LOCKED') {
      throw new BadRequestException({ message: 'Gift not in LOCKED state' });
    }

    // Create a ClaimTask record and mark gift pack as CLAIMED
    await this.prisma.$transaction(async (tx) => {
      await tx.claimTask.create({
        data: {
          giftPackId: pack.id,
          taskId: txHash,
          status: 'CLAIMED',
        },
      });

      await tx.giftPack.update({
        where: { id: pack.id },
        data: { status: 'CLAIMED' },
      });
    });

    return { ok: true };
  }

  async confirmClaimById(giftId: number, txHash: string, claimer?: string) {
    if (!txHash || typeof txHash !== 'string') throw new BadRequestException({ message: 'txHash is required' });

    const pack = await this.prisma.giftPack.findUnique({ where: { giftIdOnChain: giftId } });
    if (!pack) throw new NotFoundException({ message: 'Gift not found' });
    if (pack.status !== 'LOCKED') {
      throw new BadRequestException({ message: 'Gift not in LOCKED state' });
    }

    await this.prisma.$transaction(async (tx) => {
      await tx.claimTask.create({
        data: {
          giftPackId: pack.id,
          taskId: txHash,
          status: 'CLAIMED',
        },
      });

      await tx.giftPack.update({
        where: { id: pack.id },
        data: { status: 'CLAIMED' },
      });
    });

    return { ok: true };
  }

  async getStatusById(giftId: number): Promise<{ status: string; taskId: string | null }> {
    const record = await this.prisma.claimTask.findFirst({
      where: { giftPack: { giftIdOnChain: giftId } },
      include: { giftPack: true },
    });
    if (!record) {
      throw new NotFoundException({
        message: 'No claim in progress',
      });
    }
    return { status: record.status, taskId: record.taskId };
  }

  async getStatusByCode(giftCode: string): Promise<any> {
    const code = (giftCode || '').trim();
    if (!code) {
      throw new BadRequestException({
        message: 'giftCode is required',
      });
    }

    const pack = await this.prisma.giftPack.findFirst({
      where: { giftCode: code },
    });
    if (!pack) {
      throw new NotFoundException({
        message: 'Gift not found',
      });
    }

    const record = await this.prisma.claimTask.findFirst({
      where: { giftPackId: pack.id },
    });
    if (!record) {
      throw new NotFoundException({
        message: 'No claim in progress',
      });
    }

    return { status: record.status, taskId: record.taskId };
  }

  /** Called by /webhooks/gelato on task success/fail */
  async handleGelatoCallback(taskId: string, succeeded: boolean) {
    const task = await this.prisma.claimTask.update({
      where: { taskId },
      data: { status: succeeded ? 'CLAIMED' : 'FAILED' },
    });
    await this.prisma.giftPack.update({
      where: { id: task.giftPackId },
      data: { status: succeeded ? 'CLAIMED' : 'DRAFT' },
    });
  }
}
