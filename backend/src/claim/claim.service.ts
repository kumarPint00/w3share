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

@Injectable()
export class ClaimService {
  private provider: JsonRpcProvider | null = null;
  private gelato: GelatoRelay | null = null;
  private escrowAddress: string | null = null;
  private isClaimingEnabled: boolean = false;
  private mockClaiming: boolean = false;
  private chainId: bigint = 11155111n;
  private wrappedNativeAddress: string | null = null;
  private autoUnwrapWeth: boolean = false;

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
      this.wrappedNativeAddress = this.config.get<string>('WRAPPED_NATIVE_ADDRESS') || null;
      this.autoUnwrapWeth = (this.config.get<string>('AUTO_UNWRAP_WETH') || '').toLowerCase() === 'true';

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
    });
    if (!pack || pack.status !== 'LOCKED') {
      throw new NotFoundException({
        message: 'Gift not lockable or already claimed/refunded',
      });
    }

    const giftCode = pack.giftCode ? String(pack.giftCode).trim() : '';
    const useCodePath = giftCode.length > 0;
    const iface = new ethers.Interface(GiftEscrowArtifact.abi);
    const data = useCodePath
      ? iface.encodeFunctionData('claimGiftWithCode', [giftId, giftCode])
      : iface.encodeFunctionData('claimGift', [giftId]);


    const unwrapInfo = this.getUnwrapInfo(pack);

    return {
      contract: this.escrowAddress!,
      abi: GiftEscrowArtifact.abi,
      function: useCodePath ? 'claimGiftWithCode' : 'claimGift',
      args: useCodePath ? [giftId, giftCode] : [giftId],
      data,
      chainId: this.chainId.toString(),
      message: 'Call this contract method from your wallet to claim.',
      unwrapInfo,
    };
  }

  private getUnwrapInfo(pack: any) {
    if (!this.autoUnwrapWeth || !this.wrappedNativeAddress) {
      return null;
    }


    const hasWETH = pack.items?.some((item: any) =>
      item.contract?.toLowerCase() === this.wrappedNativeAddress!.toLowerCase(),
    );

    if (!hasWETH) {
      return null;
    }


    const wethAbi = ['function withdraw(uint256 wad) public'];
    const wethInterface = new ethers.Interface(wethAbi);
    const wethItem = pack.items.find((item: any) =>
      item.contract?.toLowerCase() === this.wrappedNativeAddress!.toLowerCase(),
    );

    if (wethItem) {
      return {
        shouldUnwrap: true,
        wethContract: this.wrappedNativeAddress,
        wethAmount: wethItem.amount,
        unwrapData: wethInterface.encodeFunctionData('withdraw', [
          wethItem.amount,
        ]),
        message:
          'After claiming, call withdraw() on WETH contract to convert WETH to ETH',
        instructions: [
          '1. First claim your gift from the GiftEscrow contract',
          '2. Then call withdraw() on the WETH contract to convert WETH to ETH',
          '3. You will receive native ETH in your wallet',
        ],
      };
    }

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
    });
    if (!pack || pack.status !== 'LOCKED') {
      throw new NotFoundException({
        message: 'Gift not lockable or already claimed/refunded',
      });
    }

    if (pack.giftIdOnChain == null) {
      throw new BadRequestException({
        message: 'Gift is not linked to an on-chain giftId',
      });
    }

    return this.submitClaimById(pack.giftIdOnChain, claimer);
  }

  async getStatusById(giftId: number) {
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

  async getStatusByCode(giftCode: string) {
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
