
export async function getGiftPackDetails({ giftCode }: { giftCode: string }) {
  const backendUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';
  const res = await fetch(`${backendUrl}/giftpacks/code/${giftCode}`);
  if (!res.ok) throw new Error('Failed to fetch gift details');
  return await res.json();
}
import { ethers } from "ethers";

export class ApiError extends Error {
  status: number;
  data?: any;
  constructor(status: number, message: string, data?: any) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.data = data;
  }
}

let JWT = '';
if (typeof window !== 'undefined') {
  try {
    const t = localStorage.getItem('auth_token');
    if (t) JWT = t;
  } catch {}
}

export async function walletLogin(provider: ethers.BrowserProvider) {
  const signer = await provider.getSigner();
  const addr   = await signer.getAddress();


  const baseURL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

  const { nonce } = await fetch(`${baseURL}/auth/wallet-nonce`, {
    method: 'POST',
    body: JSON.stringify({ address: addr }),
    headers: { 'Content-Type': 'application/json' },
  }).then(r => r.json());


  const { chainId } = await provider.getNetwork();
  const domain = typeof window !== 'undefined' ? window.location.host : 'localhost';
  const origin = typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000';
  const issuedAt = new Date().toISOString();
  const statement = 'Sign in with DogeGiFty';

  const siweMessage = `${domain} wants you to sign in with your Ethereum account:\n${addr}\n\n${statement}\n\nURI: ${origin}\nVersion: 1\nChain ID: ${Number(chainId)}\nNonce: ${nonce}\nIssued At: ${issuedAt}`;

  const sig   = await signer.signMessage(siweMessage);

  const { accessToken } = await fetch(`${baseURL}/auth/siwe`, {
    method: 'POST',
    body: JSON.stringify({ message: siweMessage, signature: sig }),
    headers: { 'Content-Type': 'application/json' },
  }).then(r => r.json());

  JWT = accessToken;
  try {
    localStorage.setItem('auth_token', accessToken);
  } catch {

  }
  return addr;
}

export function api(path: string, init?: RequestInit) {
  return fetch(path, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${JWT}`,
      ...(init?.headers || {}),
    },
  });
}

export interface WalletNonceResponse {
  nonce: string;
  message: string;
}

export interface SiweAuthResponse {
  accessToken: string;
}

export interface WalletSession {
  address: string;
  loginAt: string;
}

export interface ERC20Balance {
  contractAddress: string;
  symbol: string;
  name: string;
  balance: string;
  decimals: number;
  logoURI?: string;
}

export interface NFTAsset {
  tokenId: string;
  contractAddress: string;
  name: string;
  description?: string;
  image?: string;
  metadata?: any;
  collection?: {
    name: string;
    description?: string;
  };
}

export interface AllowedToken {
  contractAddress: string;
  symbol: string;
  name: string;
  decimals: number;
  chainId: number;
  logoURI?: string;
  isActive: boolean;
}

export interface GiftPack {
  id: string;
  senderAddress: string;
  message?: string;
  expiry: string;
  status: 'DRAFT' | 'LOCKED' | 'CLAIMED' | 'REFUNDED';
  giftIdOnChain?: number;
  items: GiftPackItem[];
  createdAt: string;
  updatedAt: string;
  giftCode?: string;
}

export interface GiftPackItem {
  id: string;
  type: 'ERC20' | 'ERC721';
  contract: string;
  tokenId?: string;
  amount?: string;
  createdAt: string;
}

export interface CreateGiftPackData {
  senderAddress: string;
  message?: string;
  expiry?: string;
  giftCode?: string;
}

export interface UpdateGiftPackData {
  message?: string;
  expiry?: string;
}

export interface AddItemToGiftPackData {
  type: 'ERC20' | 'ERC721';
  contract: string;
  tokenId?: string;
  amount?: string;
}

export interface ClaimRequest {
  giftId?: number | string;
  giftCode?: string;
  claimer: string;
}

export interface UnwrapInfo {
  shouldUnwrap: boolean;
  wethContract: string;
  wethAmount: string;
  unwrapData: string;
  message: string;
  instructions: string[];
}

export interface ClaimResponse {
  contract: string;
  abi: any[];
  function: string;
  args: any[];
  data: string;
  chainId: string;
  message: string;
  unwrapInfo?: UnwrapInfo | null;
}

export interface ClaimStatus {
  giftId?: number;
  status: 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'CLAIMED' | 'FAILED';
  taskId?: string;
  transactionHash?: string;
}

export interface SmartContractGiftStatus {
  giftId: number;
  tokenAddress: string;
  tokenId: string;
  amount: string;
  sender: string;
  recipient: string;
  expiryTimestamp: number;
  claimed: boolean;
}

export interface LockGiftResponse {
  success: boolean;
  message: string;
  giftCode: string;
  transactions: Array<{
    to: string;
    data: string;
    value: string;
    description: string;
  }>;
}

export interface GiftValidationResult {
  isValid: boolean;
  errors: string[];
}

class ApiService {
  private baseURL: string;

  constructor() {
    this.baseURL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.baseURL}${endpoint}`;

    const config: RequestInit = {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    };

    const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null;
    if (token) {
      config.headers = {
        ...config.headers,
        'Authorization': `Bearer ${token}`,
      };
    }

    const response = await fetch(url, config);

    if (!response.ok) {
      const text = await response.text();
      let body: any = undefined;
      try { body = text ? JSON.parse(text) : undefined; } catch {}
      const message = (body && (body.message || body.error)) || text || response.statusText || 'API Error';
      throw new ApiError(response.status, String(message), body);
    }

    return response.json();
  }

  async requestWalletNonce(address: string): Promise<WalletNonceResponse> {
    return this.request('/auth/wallet-nonce', {
      method: 'POST',
      body: JSON.stringify({ address }),
    });
  }

  async exchangeSiweSignature(message: string, signature: string): Promise<SiweAuthResponse> {
    return this.request('/auth/siwe', {
      method: 'POST',
      body: JSON.stringify({ message, signature }),
    });
  }

  async getCurrentSession(): Promise<WalletSession> {
    return this.request('/auth/session');
  }

  async getERC20Balances(address: string): Promise<ERC20Balance[]> {
    return this.request(`/assets/erc20?address=${encodeURIComponent(address)}`);
  }


  async getUserNFTs(address: string): Promise<NFTAsset[]> {
    const { nfts } = await this.getNFTsOwned(address);
    return nfts;
  }

  async getNFTsOwned(address: string, pageKey?: string): Promise<{ nfts: NFTAsset[]; pageKey?: string }> {
    const params = new URLSearchParams({ address });
    if (pageKey) params.append('pageKey', pageKey);
    return this.request(`/assets/nft?${params.toString()}`);
  }

  async getSupportedTokens(): Promise<AllowedToken[]> {
    return this.request('/assets/tokens/allow-list');
  }

  async createGiftPack(data: CreateGiftPackData): Promise<GiftPack> {
    return this.request('/giftpacks', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }


  async getUserGiftPacks(address: string): Promise<GiftPack[]> {
    return this.request(`/giftpacks/user/${encodeURIComponent(address)}`);
  }


  async getUserClaimedGifts(address: string): Promise<GiftPack[]> {
    return this.request(`/giftpacks/claimed/${encodeURIComponent(address)}`);
  }

  async getGiftPack(id: string): Promise<GiftPack> {
    return this.request(`/giftpacks/${id}`);
  }

  async updateGiftPack(id: string, data: UpdateGiftPackData): Promise<GiftPack> {
    return this.request(`/giftpacks/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  }

  async deleteGiftPack(id: string): Promise<{ success: boolean }> {
    return this.request(`/giftpacks/${id}`, {
      method: 'DELETE',
    });
  }

  async addItemToGiftPack(id: string, item: AddItemToGiftPackData): Promise<GiftPack> {
    return this.request(`/giftpacks/${id}/items`, {
      method: 'POST',
      body: JSON.stringify(item),
    });
  }

  async getGiftPack(id: string): Promise<GiftPack> {
    return this.request(`/giftpacks/${id}`);
  }

  async updateGiftPackWithOnChainId(id: string, onChainGiftId: number, txHash: string): Promise<GiftPack & { items: GiftItem[] }> {
    return this.request(`/giftpacks/${id}/on-chain`, {
      method: 'PATCH',
      body: JSON.stringify({ onChainGiftId, txHash }),
    });
  }

  async updateGiftPackWithMultipleOnChainIds(id: string, giftIds: number[]): Promise<GiftPack & { items: GiftItem[] }> {
    return this.request(`/giftpacks/${id}/multi-on-chain`, {
      method: 'PATCH',
      body: JSON.stringify({ giftIds }),
    });
  }

  async removeItemFromGiftPack(id: string, itemId: string): Promise<GiftPack> {
    return this.request(`/giftpacks/${id}/items/${itemId}`, {
      method: 'DELETE',
    });
  }


  async submitClaim(claim: ClaimRequest): Promise<{ taskId: string }> {
    return this.request('/claim', {
      method: 'POST',
      body: JSON.stringify(claim),
    });
  }


  async getClaimStatus(giftRef: string | number): Promise<ClaimStatus> {
    return this.request(`/claim/status/${giftRef}`);
  }

  async confirmClaimComplete(payload: { giftCode?: string; giftId?: number; txHash: string; claimer?: string }) {
    return this.request('/claim/confirm', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }

  async lockGiftPack(id: string): Promise<LockGiftResponse> {
    return this.request(`/giftpacks/${id}/lock`, {
      method: 'POST',
      body: JSON.stringify({}),
    });
  }

  async validateGiftForLocking(id: string): Promise<GiftValidationResult> {
    return this.request(`/giftpacks/${id}/validate`);
  }

  async getOnChainGiftStatus(giftId: number): Promise<SmartContractGiftStatus> {
    return this.request(`/giftpacks/on-chain/${giftId}/status`);
  }


  async createSmartContractGift(data: CreateGiftPackData): Promise<GiftPack> {

    const giftPack = await this.createGiftPack(data);


    const enhancedGiftPack = {
      ...giftPack,
      isSmartContractBacked: true,
    } as GiftPack & { isSmartContractBacked: boolean };

    return enhancedGiftPack;
  }

  async finalizeSmartContractGift(id: string): Promise<{
    giftPack: GiftPack;
    lockResult: LockGiftResponse;
  }> {

    const validation = await this.validateGiftForLocking(id);
    if (!validation.isValid) {
      throw new Error(`Cannot lock gift pack: ${validation.errors.join(', ')}`);
    }


    const lockResult = await this.lockGiftPack(id);


    const giftPack = await this.getGiftPack(id);

    return {
      giftPack,
      lockResult,
    };
  }


  isGiftPackSmartContractBacked(giftPack: GiftPack): boolean {
    return giftPack.status === 'LOCKED' && giftPack.giftIdOnChain !== undefined && giftPack.giftIdOnChain !== null;
  }


  async getGiftPackWithSmartContractStatus(id: string): Promise<{
    giftPack: GiftPack;
    onChainStatus?: SmartContractGiftStatus;
  }> {
    const giftPack = await this.getGiftPack(id);

    let onChainStatus: SmartContractGiftStatus | undefined;
    if (this.isGiftPackSmartContractBacked(giftPack)) {
      try {
        onChainStatus = await this.getOnChainGiftStatus(giftPack.giftIdOnChain!);
      } catch (error) {
        console.warn('Failed to fetch on-chain status:', error);
      }
    }

    return {
      giftPack,
      onChainStatus,
    };
  }


  async claimSmartContractGift(giftId: number, claimer: string): Promise<ClaimResponse> {

    try {
      const onChainStatus = await this.getOnChainGiftStatus(giftId);
      if (onChainStatus.claimed) {
        throw new Error('Gift has already been claimed');
      }

      if (onChainStatus.expiryTimestamp * 1000 < Date.now()) {
        throw new Error('Gift has expired');
      }
    } catch (error) {
      if (error instanceof Error && (error.message === 'Gift has already been claimed' || error.message === 'Gift has expired')) {
        throw error;
      }

      console.warn('Could not verify on-chain status before claiming:', error);
    }


    return this.request(`/claim/id/${giftId}`, {
      method: 'POST',
      body: JSON.stringify({ claimer }),
    });
  }


  async getUserGiftPacksWithSmartContractInfo(address: string): Promise<Array<{
    giftPack: GiftPack;
    onChainStatus?: SmartContractGiftStatus;
  }>> {
    const giftPacks = await this.getUserGiftPacks(address);

    const enhanced = await Promise.all(
      giftPacks.map(async (giftPack: GiftPack) => {
        let onChainStatus: SmartContractGiftStatus | undefined;
        if (this.isGiftPackSmartContractBacked(giftPack)) {
          try {
            onChainStatus = await this.getOnChainGiftStatus(giftPack.giftIdOnChain!);
          } catch (error) {
            console.warn(`Failed to fetch on-chain status for gift ${giftPack.id}:`, error);
          }
        }

        return {
          giftPack,
          onChainStatus,
        };
      })
    );

    return enhanced;
  }


  async validateMultipleGiftsForLocking(ids: string[]): Promise<Record<string, GiftValidationResult>> {
    const results = await Promise.all(
      ids.map(async (id) => {
        try {
          const validation = await this.validateGiftForLocking(id);
          return { id, validation };
        } catch (error) {
          return {
            id,
            validation: {
              isValid: false,
              errors: [`Validation failed: ${error instanceof Error ? error.message : 'Unknown error'}`],
            },
          };
        }
      })
    );

    return results.reduce((acc, { id, validation }) => {
      acc[id] = validation;
      return acc;
    }, {} as Record<string, GiftValidationResult>);
  }


  async checkTransactionStatus(transactionHash: string): Promise<{
    confirmed: boolean;
    blockNumber?: number;
    gasUsed?: string;
  }> {


    throw new Error('Transaction status checking not implemented in backend');
  }


  async getGiftPackHistory(id: string): Promise<Array<{
    timestamp: string;
    event: 'CREATED' | 'ITEM_ADDED' | 'ITEM_REMOVED' | 'LOCKED' | 'CLAIMED' | 'REFUNDED';
    details: any;
    transactionHash?: string;
  }>> {

    throw new Error('Gift pack history not implemented in backend');
  }

  async getGiftPackByOnChainId(giftId: number): Promise<GiftPack> {
    return this.request(`/giftpacks/on-chain/${giftId}`);
  }

  async getGiftPreview(giftId: number): Promise<{ giftPack: GiftPack; onChainStatus: SmartContractGiftStatus | null }> {
    return this.request(`/giftpacks/on-chain/${giftId}/preview`);
  }

  async getGiftPackByCode(giftCode: string): Promise<GiftPack> {
    return this.request(`/giftpacks/code/${giftCode}`);
  }
}

export const apiService = new ApiService();
