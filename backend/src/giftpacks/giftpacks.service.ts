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
import { GiftPack, GiftItem, Prisma } from '@prisma/client';

@Injectable()
export class GiftpacksService {
  private provider: JsonRpcProvider | null = null;
  private signer: Wallet | null = null;
  private escrowContract: Contract | null = null;
  private isSmartContractEnabled = false;
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

      if (this.mockMode) {
        console.log('[GiftPacks] Initialized in MOCK MODE');
        this.isSmartContractEnabled = true;
        return;
      }
      const rpcUrl = this.config.get<string>('SEPOLIA_BASE_RPC');
      const privateKey = this.config.get<string>('DEPLOYER_PRIVATE_KEY');
      const escrowAddress = this.config.get<string>('GIFT_ESCROW_ADDRESS');

      console.log('[GiftPacks] Initializing with config:', {
        rpcUrl: rpcUrl ? '✓' : '✗ MISSING',
        privateKey: privateKey ? '✓' : '✗ MISSING',
        escrowAddress: escrowAddress || '✗ MISSING',
      });

      if (!this.isValidConfig(rpcUrl, privateKey, escrowAddress)) {
        console.warn('[GiftPacks] Smart contract configuration incomplete. Smart contract features will be disabled.');
        return;
      }

      this.provider = new JsonRpcProvider(rpcUrl);
      this.signer = new Wallet(privateKey!, this.provider);
      this.escrowContract = new Contract(escrowAddress!, (GiftEscrowArtifact as any).abi, this.signer);
      this.isSmartContractEnabled = true;

      console.log('[GiftPacks] Smart contract initialized successfully:', {
        escrowAddress,
        signerAddress: this.signer.address,
      });
    } catch (error: any) {
      console.error('[GiftPacks] Failed to initialize smart contract connection:', {
        message: error?.message || error,
        code: error?.code,
        details: error?.toString(),
      });
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

  async createDraft(dto: CreateGiftpackDto): Promise<GiftPack> {
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

  async getDraft(id: string): Promise<GiftPack & { items: GiftItem[] }> {
    const pack = await this.prisma.giftPack.findUnique({
      where: { id },
      include: { items: true },
    });
    if (!pack) throw new NotFoundException({ error: 'NOT_FOUND', message: 'GiftPack not found' });
    return pack;
  }

  async updateDraft(id: string, dto: UpdateGiftpackDto): Promise<GiftPack> {
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

  async addItem(id: string, dto: AddItemDto): Promise<GiftItem> {
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

  async getUserGiftPacks(address: string): Promise<Array<GiftPack & { items: GiftItem[] }>> {
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
        // Native ETH is supported directly - no wrapping needed
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

  async updateWithOnChainId(id: string, onChainGiftId: number, txHash: string): Promise<GiftPack & { items: GiftItem[] }> {
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

  async updateWithMultipleOnChainIds(id: string, giftIds: number[]): Promise<GiftPack & { items: GiftItem[] }> {
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
        giftIdOnChain: giftIds[0], // Primary gift ID for compatibility
        giftIdsOnChain: JSON.stringify(giftIds), // All gift IDs
        status: 'LOCKED',
      },
      include: { items: true }
    });

    return updated;
  }

  async lockGiftPack(id: string): Promise<any> {
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
      const escrow: any = this.escrowContract!;
      const expiryTs = Math.floor(new Date(pack.expiry).getTime() / 1000);
      const codeHash = ethers.keccak256(ethers.toUtf8Bytes(giftCode));
      const message = (pack as any).message || '';
      const escrowAddress = this.getEscrowAddress();

      // Step 1: Validate all items (address validity, amount format)
      // IMPORTANT: Do NOT execute approvals here. The user MUST approve tokens from their own wallet.
      // The backend is only a transaction data generator, not the executor.
      for (const it of pack.items) {
        const raw = String(it.contract || '');
        const isNative = raw.toLowerCase() === 'native';
        let tokenAddress = raw;
        let assetTypeNum: number;

        if (isNative) {
          // For native ETH, use type 2 and ZeroAddress for tokenAddress
          tokenAddress = ethers.ZeroAddress;
          assetTypeNum = 2; // ETH type
        } else {
          // For ERC20/ERC721, use the contract type
          assetTypeNum = this.assetTypeToNumber(it.type as AssetType);
        }

        const amount = BigInt(it.amount ?? 0);
        const tokenId = BigInt(it.tokenId ?? 0);

        // Validate contract address format
        if (!isNative && !ethers.isAddress(raw)) {
          throw new BadRequestException({
            error: 'INVALID_ADDRESS',
            message: `Invalid contract address: ${it.contract}`,
          });
        }

        // Validate amount for ERC20
        if (it.type === 'ERC20' && amount <= 0n) {
          throw new BadRequestException({
            error: 'INVALID_AMOUNT',
            message: 'ERC20 items must have a positive amount',
          });
        }

        // Validate tokenId for ERC721
        if (it.type === 'ERC721' && tokenId === 0n) {
          throw new BadRequestException({
            error: 'INVALID_TOKEN_ID',
            message: 'ERC721 items must have a valid token ID',
          });
        }

        console.log('[GiftEscrow] Validated item:', {
          type: it.type,
          address: tokenAddress,
          amount: amount.toString(),
          tokenId: tokenId.toString(),
        });
      }

      console.log('[GiftEscrow] Generating transaction data for Gift Pack with params:', {
        expiryTs,
        message,
        codeHash,
        escrowAddress: this.getEscrowAddress(),
        signerAddress: this.signer?.address,
      });

      // Generate transaction data without executing
      // Step 1: Create the gift pack
      const iface = (this.escrowContract as any).interface;
      console.log('[GiftEscrow] Creating encoded function data for createGiftPack');
      const createData = iface.encodeFunctionData('createGiftPack', [expiryTs, message, codeHash]);
      console.log('[GiftEscrow] createGiftPack encoded successfully:', { dataLength: createData.length });
      
      console.log('[GiftEscrow] Generated createGiftPack transaction:', {
        selector: createData.slice(0, 10),
        dataLength: createData.length,
        codeHashHex: codeHash,
      });

      // Step 2: Add all assets to the gift pack (collect all in a list)
      const addAssetCalls: Array<{ data: string; value: string }> = [];
      for (const it of pack.items) {
        const raw = String(it.contract || '');
        const isNative = raw.toLowerCase() === 'native';
        let tokenAddress = raw;
        let assetTypeNum: number;

        if (isNative) {
          // For native ETH, use type 2 and ZeroAddress for tokenAddress
          tokenAddress = ethers.ZeroAddress;
          assetTypeNum = 2; // ETH type
        } else {
          // For ERC20/ERC721, use the contract type
          assetTypeNum = this.assetTypeToNumber(it.type as AssetType);
        }

        const amount = BigInt(it.amount ?? 0);
        const tokenId = BigInt(it.tokenId ?? 0);

        const addAssetData = iface.encodeFunctionData('addAssetToGiftPack', [
          codeHash,
          assetTypeNum,
          tokenAddress,
          tokenId,
          amount,
        ]);

        addAssetCalls.push({
          data: addAssetData,
          value: isNative ? amount.toString() : '0',
        });
      }

      // Step 3: Lock the gift pack
      const lockData = iface.encodeFunctionData('lockGiftPack', [codeHash]);

      // Update database with locked status (will be marked truly locked after user executes)
      await this.prisma.giftPack.update({
        where: { id: pack.id },
        data: {
          status: 'LOCKED',
          giftCode: giftCode,
        },
      });

      return {
        success: true,
        message: 'Gift pack transactions prepared - sign and execute from your wallet',
        giftCode,
        transactions: [
          {
            to: escrowAddress,
            data: createData,
            value: '0',
            description: 'Create gift pack',
          },
          ...addAssetCalls.map((call, idx) => ({
            to: escrowAddress,
            data: call.data,
            value: call.value,
            description: `Add asset ${idx + 1}`,
          })),
          {
            to: escrowAddress,
            data: lockData,
            value: '0',
            description: 'Lock gift pack',
          },
        ],
      };
    } catch (error: any) {
      if (error?.code) {
        throw this.toHttpFromEthers(error);
      }
      throw this.toHttpUnknown(error);
    }
  }

  async getGiftByOnChainId(giftIdOnChain: number): Promise<GiftPack & { items: GiftItem[] }> {
    const pack = await this.prisma.giftPack.findFirst({
      where: { giftIdOnChain },
      include: { items: true },
    });
    if (!pack) throw new NotFoundException({ error: 'NOT_FOUND', message: 'GiftPack not found for this on-chain gift ID' });
    return pack;
  }

  async getGiftByGiftCode(giftCode: string): Promise<GiftPack & { items: GiftItem[] }> {
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

  getSmartContractStatus() {
    const status: any = {
      enabled: this.isSmartContractEnabled,
      mockMode: this.mockMode,
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

  async getGiftPreview(giftIdOnChain: number): Promise<any> {
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
