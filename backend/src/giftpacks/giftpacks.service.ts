import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
  ServiceUnavailableException,
  HttpException,
  HttpStatus,
  ConflictException,
} from '@nestjs/common';
import { AddItemDto, AssetType } from './dto/add-item.dto';
import { PrismaService } from 'prisma/prisma.service';
import { CreateGiftpackDto } from './dto/create-giftpack.dto';
import { UpdateGiftpackDto } from './dto/update-giftpacks.dto';
import { ConfigService } from '@nestjs/config';
import { ethers, JsonRpcProvider, Wallet, Contract } from 'ethers';
import GiftEscrowArtifact from '../claim/gift-escrow.json';

@Injectable()
export class GiftpacksService {
  private provider: JsonRpcProvider | null = null;
  private signer: Wallet | null = null;
  private escrowContract: Contract | null = null;
  private isSmartContractEnabled = false;
  private nativeTokenPolicy: 'wrap' | 'allow' | 'disallow' = 'wrap';
  private wrappedNativeAddress?: string;
  private mockMode = false;

  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
  ) {
    this.initializeBlockchainConnection();
  }

  private initializeBlockchainConnection() {
    try {
      this.mockMode =
        (this.config.get<string>('CLAIM_MOCK') || '').toLowerCase() === 'true' ||
        this.config.get<string>('CLAIM_MOCK') === '1';
      const nativePolicy = (this.config.get<string>('SMART_GIFT_NATIVE_POLICY') || 'wrap').toLowerCase();
      if (nativePolicy === 'wrap' || nativePolicy === 'allow' || nativePolicy === 'disallow') {
        this.nativeTokenPolicy = nativePolicy as typeof this.nativeTokenPolicy;
      } else {
        console.warn(`Invalid SMART_GIFT_NATIVE_POLICY: ${nativePolicy}. Falling back to 'wrap'.`);
        this.nativeTokenPolicy = 'wrap';
      }
      const wNative = this.config.get<string>('WRAPPED_NATIVE_ADDRESS');
      this.wrappedNativeAddress = wNative && ethers.isAddress(wNative) ? wNative : undefined;

      if (this.mockMode) {
        console.log('GiftPacks service initialized in MOCK MODE');
        this.isSmartContractEnabled = true;
        return;
      }
      const rpcUrl = this.config.get<string>('SEPOLIA_BASE_RPC');
      const privateKey = this.config.get<string>('DEPLOYER_PRIVATE_KEY');
      const escrowAddress = this.config.get<string>('GIFT_ESCROW_ADDRESS');

      if (!this.isValidConfig(rpcUrl, privateKey, escrowAddress)) {
        console.warn('Smart contract configuration incomplete. Smart contract features will be disabled.');
        return;
      }

      this.provider = new JsonRpcProvider(rpcUrl);
      this.signer = new Wallet(privateKey!, this.provider);
      this.escrowContract = new Contract(escrowAddress!, (GiftEscrowArtifact as any).abi, this.signer);
      this.isSmartContractEnabled = true;

      console.log('Smart contract integration initialized successfully');
    } catch (error: any) {
      console.error('Failed to initialize smart contract connection:', error?.message || error);
      this.isSmartContractEnabled = false;
    }
  }

  private isValidConfig(rpcUrl?: string, privateKey?: string, escrowAddress?: string): boolean {
    if (
      !rpcUrl ||
      rpcUrl.includes('YOUR_') ||
      rpcUrl === 'https://sepolia.infura.io/v3/YOUR_INFURA_PROJECT_ID'
    ) {
      return false;
    }
    if (
      !privateKey ||
      privateKey === '0xYourDeployerPrivateKeyHere' ||
      !this.isValidPrivateKey(privateKey)
    ) {
      return false;
    }
    if (
      !escrowAddress ||
      escrowAddress === '0xYourGiftEscrowAddressHere' ||
      !ethers.isAddress(escrowAddress)
    ) {
      return false;
    }
    return true;
  }

  private isValidPrivateKey(privateKey: string): boolean {
    try {
      const cleanKey = privateKey.startsWith('0x') ? privateKey.slice(2) : privateKey;
      return /^[0-9a-fA-F]{64}$/.test(cleanKey);
    } catch {
      return false;
    }
  }

  private throwIfSmartContractDisabled(operation: string) {
    if (!this.isSmartContractEnabled && !this.mockMode) {
      throw new BadRequestException({
        error: 'BLOCKCHAIN_DISABLED',
        message: `Smart contract operation '${operation}' is not available. Configure RPC/private key/contract address or enable mock mode.`,
      });
    }
  }

  async createDraft(dto: CreateGiftpackDto) {
    const expiryDate = new Date(dto.expiry);
    const data: any = {
      message: dto.message,
      expiry: expiryDate,
      status: 'DRAFT',
      senderAddress: dto.senderAddress,
    };
    if (dto.giftCode) data.giftCode = dto.giftCode;

    try {
      return await this.prisma.giftPack.create({ data });
    } catch (e: any) {
      if (e?.code === 'P2002') {
        throw new ConflictException({
          error: 'DUPLICATE',
          message: 'A gift with this giftCode already exists.',
          meta: e?.meta,
        });
      }
      throw this.toHttpUnknown(e);
    }
  }

  async getDraft(id: string) {
    const pack = await this.prisma.giftPack.findUnique({
      where: { id },
      include: { items: true },
    });
    if (!pack) throw new NotFoundException({ error: 'NOT_FOUND', message: 'GiftPack not found' });
    return pack;
  }

  async updateDraft(id: string, dto: UpdateGiftpackDto) {
    try {
      return await this.prisma.giftPack.update({ where: { id }, data: { ...dto } });
    } catch (e) {
      throw this.toHttpUnknown(e);
    }
  }

  async deleteDraft(id: string) {
    try {
      await this.prisma.giftPack.delete({ where: { id } });
      return { success: true };
    } catch (e: any) {
      if (e?.code === 'P2025') {
        throw new NotFoundException({ error: 'NOT_FOUND', message: 'GiftPack not found' });
      }
      throw this.toHttpUnknown(e);
    }
  }

  async addItem(id: string, dto: AddItemDto) {
    const pack = await this.getDraft(id);
    try {
      return await this.prisma.giftItem.create({
        data: {
          giftPackId: pack.id,
          type: dto.type,
          contract: dto.contract,
          tokenId: dto.tokenId,
          amount: dto.amount,
        },
      });
    } catch (e) {
      throw this.toHttpUnknown(e);
    }
  }

  async removeItem(id: string, itemId: string) {
    await this.getDraft(id);
    try {
      await this.prisma.giftItem.delete({ where: { id: itemId } });
      return { success: true };
    } catch (e: any) {
      if (e?.code === 'P2025') {
        throw new NotFoundException({ error: 'NOT_FOUND', message: 'Gift item not found' });
      }
      throw this.toHttpUnknown(e);
    }
  }

  async getUserGiftPacks(address: string) {
    return this.prisma.giftPack.findMany({
      where: { senderAddress: address },
      include: { items: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getUserClaimedGifts(address: string) {
  return [];
  }

  async validateGiftForLocking(id: string): Promise<{ isValid: boolean; errors: string[] }> {
    this.throwIfSmartContractDisabled('validateGiftForLocking');

    const pack = await this.getDraft(id);
    const errors: string[] = [];

    if (pack.status !== 'DRAFT') errors.push('Gift pack must be in DRAFT status');
    if (!pack.items || pack.items.length === 0) errors.push('Gift pack must contain at least one item');
    if (new Date(pack.expiry) <= new Date()) errors.push('Gift pack expiry must be in the future');

    for (const item of pack.items) {
      const raw = String(item.contract || '');
      const isNative = raw.toLowerCase() === 'native';
      if (isNative) {
        if (item.type !== 'ERC20') errors.push('Native token items must be of type ERC20');
        if (this.nativeTokenPolicy === 'disallow') {
          errors.push('Native token is not supported for smart contract gifts');
        } else if (this.nativeTokenPolicy === 'wrap' || this.nativeTokenPolicy === 'allow') {
          if (!this.wrappedNativeAddress) {
            errors.push('WRAPPED_NATIVE_ADDRESS is not configured but native token was provided');
          }
        }
      } else if (!ethers.isAddress(raw)) {
        errors.push(`Invalid contract address: ${item.contract}`);
      }

      if (item.type === 'ERC20' && (!item.amount || BigInt(item.amount) <= 0)) {
        errors.push('ERC20 items must have a valid amount');
      }
      if (item.type === 'ERC721' && !item.tokenId) {
        errors.push('ERC721 items must have a token ID');
      }
    }

    return { isValid: errors.length === 0, errors };
  }

  async updateWithOnChainId(id: string, onChainGiftId: number, txHash: string) {
    const pack = await this.prisma.giftPack.findUnique({
      where: { id },
      include: { items: true }
    });

    if (!pack) {
      throw new NotFoundException('Gift pack not found');
    }

    const updated = await this.prisma.giftPack.update({
      where: { id },
      data: {
        giftIdOnChain: onChainGiftId,
        status: 'LOCKED',
      },
      include: { items: true }
    });

    return updated;
  }

  async lockGiftPack(id: string) {
    this.throwIfSmartContractDisabled('lockGiftPack');

    const validation = await this.validateGiftForLocking(id);
    if (!validation.isValid) {
      throw new BadRequestException({
        error: 'VALIDATION_FAILED',
        message: 'Gift pack is not valid for locking',
        details: validation.errors,
      });
    }

    const pack = await this.getDraft(id);

    const giftCode = (pack as any).giftCode as string | undefined;
    if (!giftCode || !giftCode.trim()) {
      throw new BadRequestException({
        error: 'GIFT_CODE_REQUIRED',
        message: 'Gift code is required for locking in code-only mode. Create the draft with a unique giftCode.',
      });
    }

    try {
      const firstItem = pack.items[0];

      const raw = String(firstItem.contract || '');
      const isNative = raw.toLowerCase() === 'native';
      let tokenAddress = raw;
      if (isNative) {
        if (this.nativeTokenPolicy === 'disallow') {
          throw new BadRequestException({
            error: 'NATIVE_NOT_ALLOWED',
            message: 'Native token is not supported for smart contract gifts',
          });
        }
        if (this.nativeTokenPolicy === 'allow') {
          // For smart contract compatibility, we still need to wrap ETH to WETH
          // but we allow users to specify "native" in the frontend
          if (!this.wrappedNativeAddress) {
            throw new BadRequestException({
              error: 'WRAPPED_ADDRESS_MISSING',
              message: 'WRAPPED_NATIVE_ADDRESS is not configured but native token was provided',
            });
          }
          tokenAddress = this.wrappedNativeAddress;
        } else if (this.nativeTokenPolicy === 'wrap') {
          if (!this.wrappedNativeAddress) {
            throw new BadRequestException({
              error: 'WRAPPED_ADDRESS_MISSING',
              message: 'WRAPPED_NATIVE_ADDRESS is not configured but native token was provided',
            });
          }
          tokenAddress = this.wrappedNativeAddress;
        }
      }

      const assetTypeNum = this.assetTypeToNumber(firstItem.type as AssetType);
      const amount = BigInt(firstItem.amount ?? 0);
      const tokenId = BigInt(firstItem.tokenId ?? 0);
      const expiryTs = Math.floor(new Date(pack.expiry).getTime() / 1000);

      const escrowAddress = this.getEscrowAddress();
      await this.ensureApproval(firstItem.type as AssetType, tokenAddress, escrowAddress, amount, tokenId);

      const codeHash = ethers.keccak256(ethers.toUtf8Bytes(giftCode));
      const message = (pack as any).message || '';


      // Debug: Check balance and approval
      if (firstItem.type === 'ERC20') {
        const erc20 = new Contract(
          tokenAddress,
          ['function balanceOf(address) view returns (uint256)', 'function allowance(address,address) view returns (uint256)'],
          this.signer,
        );
        const balance = await erc20.balanceOf(this.signer!.address);
        const allowance = await erc20.allowance(this.signer!.address, escrowAddress);
        console.log('[DEBUG] WETH balance:', balance.toString(), 'Allowance:', allowance.toString(), 'Required:', amount.toString());
        
        if (balance < amount) {
          // If user doesn't have enough WETH but has native ETH, wrap it automatically
          if (isNative && this.nativeTokenPolicy === 'allow') {
            console.log('[DEBUG] Attempting to wrap ETH to WETH automatically');
            await this.wrapEthToWeth(amount);
            
            // Check balance again after wrapping
            const newBalance = await erc20.balanceOf(this.signer!.address);
            if (newBalance < amount) {
              throw new BadRequestException({
                error: 'INSUFFICIENT_BALANCE_AFTER_WRAP',
                message: `Failed to wrap enough ETH to WETH. Have: ${newBalance.toString()}, Need: ${amount.toString()}`,
              });
            }
          } else {
            throw new BadRequestException({
              error: 'INSUFFICIENT_BALANCE',
              message: `Insufficient WETH balance. Have: ${balance.toString()}, Need: ${amount.toString()}`,
            });
          }
        }
        if (allowance < amount) {
          throw new BadRequestException({
            error: 'INSUFFICIENT_ALLOWANCE',
            message: `Insufficient WETH allowance. Have: ${allowance.toString()}, Need: ${amount.toString()}`,
          });
        }
      }
      try {
        const [isValid, reason] = await this.escrowContract!.validateGiftForLocking(
          assetTypeNum,
          tokenAddress,
          tokenId,
          amount,
          expiryTs,
          message,
          codeHash,
        );
        if (!isValid) {
          throw new BadRequestException({
            error: 'CONTRACT_VALIDATION_FAILED',
            message: `Contract validation failed: ${reason}`,
          });
        }
      } catch (validationError: any) {
        if (validationError?.error === 'CONTRACT_VALIDATION_FAILED') {
          throw validationError;
        }
        console.warn('Contract validation call failed, proceeding with lock attempt:', validationError?.message);
      }

      const escrow: any = this.escrowContract!;

      console.log('[GiftEscrow] lockGiftV2 params:', {
        assetTypeNum,
        tokenAddress,
        tokenId,
        amount,
        expiryTs,
        message,
        codeHash,
      });

      let tx;
      if (typeof escrow.lockGiftV2 === 'function') {

        try {
          await (escrow.lockGiftV2 as any).estimateGas(
            assetTypeNum,
            tokenAddress,
            tokenId,
            amount,
            expiryTs,
            message,
            codeHash,
          );
        } catch (estimateError: any) {
          console.error('Gas estimation failed:', estimateError);
          throw new BadRequestException({
            error: 'GAS_ESTIMATION_FAILED',
            message: `Transaction would fail: ${estimateError?.reason || estimateError?.message || 'Unknown error'}`,
          });
        }

        tx = await (escrow.lockGiftV2 as any)(
          assetTypeNum,
          tokenAddress,
          tokenId,
          amount,
          expiryTs,
          message,
          codeHash,
        );
      } else if (
        typeof escrow.lockGift === 'function' ||
        typeof escrow.lock === 'function' ||
        typeof escrow.createGift === 'function' ||
        typeof escrow.lockAssets === 'function'
      ) {
        const lockFn: ((...args: any[]) => Promise<any>) | undefined =
          escrow.lockGift || escrow.lock || escrow.createGift || escrow.lockAssets;
        if (!lockFn) {
          throw new ServiceUnavailableException({
            error: 'ABI_MISMATCH',
            message: 'Escrow contract ABI mismatch: missing lockGiftV2/lockGift/lock/createGift/lockAssets method',
          });
        }
        try {
          tx = await lockFn(assetTypeNum, tokenAddress, tokenId, amount, expiryTs);
        } catch {
          tx = await lockFn(tokenAddress, assetTypeNum, tokenId, amount, expiryTs);
        }
      } else {
        throw new ServiceUnavailableException({
          error: 'ABI_MISMATCH',
          message: 'Escrow contract ABI mismatch: missing lockGiftV2/lockGift/lock/createGift/lockAssets method',
        });
      }

      const receipt = await tx.wait();
      let giftIdOnChain: number | null = null;
      try {
        const iface = (this.escrowContract as any)?.interface;
        if (iface && receipt?.logs?.length) {
          for (const log of receipt.logs) {
            try {
              const parsed = iface.parseLog(log);
              if (parsed && parsed.name === 'GiftLocked' && parsed.args?.giftId != null) {
                const g = parsed.args.giftId;
                giftIdOnChain = typeof g === 'bigint' ? Number(g) : Number(g.toString());
                break;
              }
            } catch {}
          }
        }
      } catch {}

      try {
        await this.prisma.giftPack.update({
          where: { id: pack.id },
          data: {
            status: 'LOCKED',
            giftIdOnChain: giftIdOnChain ?? undefined,
            giftCode: giftCode,
          },
        });
      } catch (error: any) {
        if (error.code === 'P2002' && error.meta?.target?.includes('giftIdOnChain')) {
          await this.prisma.giftPack.updateMany({
            where: { giftIdOnChain: giftIdOnChain },
            data: { giftIdOnChain: null, status: 'DRAFT' },
          });
          await this.prisma.giftPack.update({
            where: { id: pack.id },
            data: {
              status: 'LOCKED',
              giftIdOnChain: giftIdOnChain ?? undefined,
            },
          });
        } else {
          throw error;
        }
      }

      return {
        success: true,
        giftId: giftIdOnChain ?? undefined,
        transactionHash: tx.hash,
        txHash: tx.hash,
        blockNumber: receipt?.blockNumber,
        giftCode,
        message,
        amount: amount.toString(),
        tokenId: tokenId ? tokenId.toString() : undefined,
        tokenType: firstItem.type,
        tokenAddress,
      };
    } catch (error: any) {
      if (error?.code) {
        throw this.toHttpFromEthers(error);
      }
      throw this.toHttpUnknown(error);
    }
  }

  async getGiftByOnChainId(giftIdOnChain: number) {
    const pack = await this.prisma.giftPack.findFirst({
      where: { giftIdOnChain },
      include: { items: true },
    });
    if (!pack) throw new NotFoundException({ error: 'NOT_FOUND', message: 'GiftPack not found for this on-chain gift ID' });
    return pack;
  }

  async getGiftByGiftCode(giftCode: string) {
    const pack = await this.prisma.giftPack.findFirst({
      where: { giftCode },
      include: { items: true },
    });
    if (!pack) throw new NotFoundException({ error: 'NOT_FOUND', message: 'GiftPack not found for this gift code' });
    return pack;
  }

  private getEscrowAddress(): string {
    const c = this.escrowContract as any;
    return (c?.target as string) || (c?.address as string);
  }

  private assetTypeToNumber(t: AssetType): number {
    switch (t) {
      case 'ERC20':
        return 0;
      case 'ERC721':
        return 1;
      default:
        return 0;
    }
  }

  private async wrapEthToWeth(amount: bigint) {
    if (!this.signer || !this.wrappedNativeAddress) {
      throw new ServiceUnavailableException({
        error: 'WRAPPING_NOT_AVAILABLE',
        message: 'ETH to WETH wrapping is not available',
      });
    }

    const wethContract = new Contract(
      this.wrappedNativeAddress,
      ['function deposit() payable'],
      this.signer,
    );

    console.log(`[WRAP] Wrapping ${amount} wei of ETH to WETH`);
    const tx = await wethContract.deposit({ value: amount });
    await tx.wait();
    console.log(`[WRAP] Successfully wrapped ETH to WETH, tx: ${tx.hash}`);
  }

  private async ensureApproval(
    type: AssetType,
    tokenAddress: string,
    spender: string,
    amount: bigint,
    tokenId: bigint,
  ) {
    if (!this.signer) {
      throw new ServiceUnavailableException({
        error: 'SIGNER_MISSING',
        message: 'Signer not initialized',
      });
    }

    const tokenRaw = String(tokenAddress || '');

    if (!ethers.isAddress(tokenRaw)) {
      if (/^native$/i.test(tokenRaw)) return;
      throw new BadRequestException({
        error: 'INVALID_TOKEN_ADDRESS',
        message: `Invalid token address for approval: ${tokenRaw}`,
      });
    }

    const provider = this.signer.provider as JsonRpcProvider;
    const code = await provider.getCode(tokenRaw);
    if (!code || code === '0x') {
      throw new BadRequestException({
        error: 'NO_CONTRACT_CODE',
        message: `No contract code at ${tokenRaw} on the connected network. Check chain and address.`,
      });
    }

    if (type === 'ERC20') {
      const erc20 = new Contract(
        tokenRaw,
        [
          'function allowance(address owner, address spender) view returns (uint256)',
          'function approve(address spender, uint256 amount) returns (bool)',
        ],
        this.signer,
      );
      const current: bigint = await erc20.allowance(this.signer.address, spender);
      if (current < amount) {
        const tx = await erc20.approve(spender, ethers.MaxUint256);
        await tx.wait();
      }
      return;
    }

    if (type === 'ERC721') {
      const erc721 = new Contract(
        tokenRaw,
        [
          'function isApprovedForAll(address owner, address operator) view returns (bool)',
          'function setApprovalForAll(address operator, bool approved)',
        ],
        this.signer,
      );
      const approvedForAll: boolean = await erc721.isApprovedForAll(this.signer.address, spender);
      if (!approvedForAll) {
        const tx = await erc721.setApprovalForAll(spender, true);
        await tx.wait();
      }
      return;
    }
  }

  getSmartContractStatus() {
    const status: any = {
      enabled: this.isSmartContractEnabled,
      mockMode: this.mockMode,
      nativeTokenPolicy: this.nativeTokenPolicy,
      wrappedNativeAddress: this.wrappedNativeAddress || null,
    };

    if (this.mockMode) {
      status.mode = 'MOCK';
      status.description = 'Smart contracts use mock responses - no blockchain connection required';
    } else if (this.isSmartContractEnabled) {
      status.mode = 'REAL';
      status.escrowAddress = this.getEscrowAddress();
      status.signerAddress = this.signer?.address || null;
      status.rpcConnected = !!this.provider;
    } else {
      status.mode = 'DISABLED';
      status.reason = 'Configuration incomplete or failed to initialize';
    }
    return status;
  }

  isSmartContractAvailable(): boolean {
    return this.isSmartContractEnabled;
  }

  async getGiftStatus(giftId: number) {
    this.throwIfSmartContractDisabled('getGiftStatus');

    const escrow: any = this.escrowContract!;

    try {
      if (typeof escrow.getGift === 'function') {
        const giftData = await escrow.getGift(giftId);
        return {
          giftId: giftId,
          tokenAddress: giftData.tokenAddress,
          tokenId: giftData.tokenId?.toString(),
          amount: giftData.amount?.toString(),
          sender: giftData.sender,
          expiryTimestamp: Number(giftData.expiryTimestamp),
          claimed: giftData.claimed,
        };
      }
    } catch (error: any) {
      if (error?.reason?.includes('No gift') || error?.message?.includes('No gift')) {
        throw new NotFoundException({
          error: 'GIFT_NOT_FOUND',
          message: `Gift with ID ${giftId} does not exist on the blockchain`,
        });
      }
    }

    const candidates: Array<() => Promise<any>> = [];
    if (typeof escrow.getGiftStatus === 'function') candidates.push(() => escrow.getGiftStatus(giftId));
    if (typeof escrow.giftStatus === 'function') candidates.push(() => escrow.giftStatus(giftId));
    if (typeof escrow.gifts === 'function') candidates.push(() => escrow.gifts(giftId));

    for (const fn of candidates) {
      try {
        const res = await fn();
        return { id: giftId, status: res };
      } catch {}
    }

    throw new NotFoundException({
      error: 'GIFT_NOT_FOUND',
      message: `Gift with ID ${giftId} does not exist on the blockchain`,
    });
  }

  async getGiftPreview(giftIdOnChain: number) {
    const giftPack = await this.prisma.giftPack.findFirst({
      where: { giftIdOnChain },
      include: { items: true },
    });

    if (!giftPack) {
      throw new BadRequestException({
        error: 'GIFT_NOT_FOUND',
        message: `No gift found with on-chain ID ${giftIdOnChain}`,
      });
    }

    let onChainStatus: any = null;

    this.throwIfSmartContractDisabled('getGiftPreview');

    try {
      const escrow: any = this.escrowContract!;
      if (escrow && typeof escrow.getGift === 'function') {
        try {
          const giftData = await escrow.getGift(giftIdOnChain);
          const expiryTimestamp = Number(giftData.expiryTimestamp);
          const isExpired = expiryTimestamp > 0 && Date.now() / 1000 > expiryTimestamp;

          onChainStatus = {
            giftId: giftIdOnChain,
            tokenAddress: giftData.tokenAddress,
            tokenId: giftData.tokenId?.toString(),
            amount: giftData.amount?.toString(),
            sender: giftData.sender,
            expiryTimestamp: expiryTimestamp,
            claimed: giftData.claimed,
            status: giftData.claimed ? 'CLAIMED' : isExpired ? 'EXPIRED' : 'LOCKED',
          };
        } catch (error: any) {
          if (error?.reason?.includes('No gift') || error?.message?.includes('No gift')) {
            throw new BadRequestException({
              error: 'GIFT_NOT_ON_CHAIN',
              message: `Gift with ID ${giftIdOnChain} does not exist on the blockchain`,
            });
          }
        }
      } else {
        throw new ServiceUnavailableException({
          error: 'CONTRACT_METHOD_MISSING',
          message: 'Smart contract does not have getGift method',
        });
      }
    } catch (error: any) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new ServiceUnavailableException({
        error: 'BLOCKCHAIN_ERROR',
        message: `Failed to fetch gift data from blockchain: ${error?.message || 'Unknown error'}`,
      });
    }

    return {
      giftPack,
      onChainStatus,
    };
  }

  private toHttpFromEthers(e: any): HttpException {
    const code = e?.code as string | undefined;
    const rawMsg =
      e?.reason ||
      e?.shortMessage ||
      e?.info?.error?.message ||
      e?.message ||
      'Blockchain error';

    switch (code) {
      case 'INSUFFICIENT_FUNDS':
        return new BadRequestException({
          error: 'INSUFFICIENT_FUNDS',
          message: 'Insufficient funds to pay gas for transaction.',
          hint: 'Fund the signer with test ETH and retry.',
        });
      case 'ACTION_REJECTED':
        return new ForbiddenException({ error: 'ACTION_REJECTED', message: rawMsg });
      case 'NETWORK_ERROR':
        return new ServiceUnavailableException({
          error: 'NETWORK_ERROR',
          message: rawMsg,
          hint: 'RPC may be down or misconfigured.',
        });
      case 'CALL_EXCEPTION':
      case 'UNPREDICTABLE_GAS_LIMIT':
      case 'INVALID_ARGUMENT':
      case 'UNSUPPORTED_OPERATION':
        return new BadRequestException({ error: code, message: rawMsg });
      default:
        return new BadRequestException({ error: code || 'BLOCKCHAIN_ERROR', message: rawMsg });
    }
  }

  private toHttpUnknown(e: any): HttpException {
    if (e instanceof HttpException) return e;
    const message = e?.message || 'Unexpected error';
    return new HttpException(
      { error: e?.code || 'UNKNOWN_ERROR', message },
      HttpStatus.BAD_REQUEST,
    );
  }
}
