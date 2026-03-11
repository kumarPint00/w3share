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
      const rpcUrl = this.config.get<string>('MAINNET_RPC') || this.config.get<string>('SEPOLIA_BASE_RPC');
      const apiKey = this.config.get<string>('GELATO_API_KEY');
      const escrowAddr = this.config.get<string>('GIFT_ESCROW_ADDRESS');
      const chainIdStr = this.config.get<string>('GIFT_ESCROW_CHAIN_ID') || this.config.get<string>('SEPOLIA_CHAIN_ID') || '1';

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
        console.warn('- MAINNET_RPC: Valid RPC URL');
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

    // Code-based path: use commit-reveal scheme
    if (useCodePath) {
      return this.buildCommitData(giftCode, claimer, ethers.hexlify(ethers.randomBytes(32)));
    } else {
      throw new BadRequestException({ message: 'giftCode is required for claiming' });
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
      throw new BadRequestException({ message: 'giftCode is required' });
    }
    if (!claimer || !ethers.isAddress(claimer)) {
      throw new BadRequestException({ message: 'valid claimer address is required' });
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

    // Phase 1 – return commit calldata. The frontend supplies the nonce and
    // computes the commitment client-side; we just encode the calldata.
    // nonce is supplied by the caller via buildCommitData; this endpoint is
    // kept for backward compat but now delegates to buildCommitData.
    // (The frontend should call POST /claim/commit directly for the full flow.)
    return this.buildCommitData(code, claimer, ethers.hexlify(ethers.randomBytes(32)));
  }

  /**
   * Build commit-phase calldata for the commit-reveal MEV protection scheme.
   * commitment = keccak256(abi.encodePacked(claimer, code, nonce))
   */
  async buildCommitData(giftCode: string, claimer: string, nonce: string) {
    this.throwIfClaimingDisabled('buildCommitData');

    const code = (giftCode || '').trim();
    if (!code) throw new BadRequestException({ message: 'giftCode is required' });
    if (!claimer || !ethers.isAddress(claimer)) {
      throw new BadRequestException({ message: 'valid claimer address is required' });
    }
    if (!nonce || !/^0x[0-9a-fA-F]{64}$/.test(nonce)) {
      throw new BadRequestException({ message: 'nonce must be a 0x-prefixed 32-byte hex string' });
    }

    const pack = await this.prisma.giftPack.findFirst({
      where: { giftCode: code },
      include: { items: true },
    });
    if (!pack || pack.status !== 'LOCKED') {
      throw new NotFoundException({ message: 'Gift not lockable or already claimed/refunded' });
    }

    const codeHash = ethers.keccak256(ethers.toUtf8Bytes(code));
    const commitment = ethers.solidityPackedKeccak256(
      ['address', 'string', 'bytes32'],
      [claimer, code, nonce],
    );

    const iface = new ethers.Interface(GiftEscrowArtifact.abi);
    const data = iface.encodeFunctionData('commitClaim', [codeHash, commitment]);

    return {
      contract: this.escrowAddress!,
      function: 'commitClaim',
      args: [codeHash, commitment],
      data,
      chainId: this.chainId.toString(),
      commitRevealDelay: 1,
      message: 'Step 1 of 2: Reserve your claim. Sign this transaction to commit.',
    };
  }

  /**
   * Build reveal-phase calldata for the commit-reveal MEV protection scheme.
   * The nonce must match the one used when committing.
   */
  async buildRevealData(giftCode: string, nonce: string) {
    this.throwIfClaimingDisabled('buildRevealData');

    const code = (giftCode || '').trim();
    if (!code) throw new BadRequestException({ message: 'giftCode is required' });
    if (!nonce || !/^0x[0-9a-fA-F]{64}$/.test(nonce)) {
      throw new BadRequestException({ message: 'nonce must be a 0x-prefixed 32-byte hex string' });
    }

    const pack = await this.prisma.giftPack.findFirst({
      where: { giftCode: code },
      include: { items: true },
    });
    if (!pack) throw new NotFoundException({ message: 'Gift not found' });
    if (pack.status === 'CLAIMED') throw new BadRequestException({ message: 'Gift already claimed' });

    const codeHash = ethers.keccak256(ethers.toUtf8Bytes(code));
    const iface = new ethers.Interface(GiftEscrowArtifact.abi);
    const data = iface.encodeFunctionData('revealAndClaim', [codeHash, code, nonce]);

    return {
      contract: this.escrowAddress!,
      function: 'revealAndClaim',
      args: [codeHash, code, nonce],
      data,
      chainId: this.chainId.toString(),
      message: pack.items.length > 1
        ? `Step 2 of 2: Claim ${pack.items.length} tokens in one transaction.`
        : 'Step 2 of 2: Complete your claim.',
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
