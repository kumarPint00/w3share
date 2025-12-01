export type TokenType = 'ERC20' | 'NFT';

export interface GiftItem {
  id: string;
  name: string;
  symbol?: string;
  type: TokenType;
  usd: number;
  balance?: number;
  /** Raw on-chain (stringified) amount if available */
  amount?: number; // legacy numeric amount usage in some flows
  /** ERC20 decimals (if known) */
  decimals?: number;
  /** Original raw amount string (wei / smallest unit) */
  rawAmount?: string;
  /** Pre-formatted human friendly amount (already divided by decimals) */
  formattedAmount?: string;
  image?: string;
  /** Future extension fields can go here */
}

export interface GiftPackMeta {
  id?: string;
  senderAddress?: string;
  message?: string;
  expiry?: string; // ISO string from backend
  status?: string;
  giftIdOnChain?: number;
  giftCode?: string;
  createdAt?: string;
  updatedAt?: string;
  items?: GiftItem[];
}

export interface GiftPack {
  items: GiftItem[];
  message: string;
  sealedAt: number;
}
