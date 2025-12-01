export const API_ENDPOINTS = {
  GIFT_PACKS: '/api/gift-packs',
  AUTH: '/api/auth',
  TOKENS: '/api/tokens',
  NFTS: '/api/nfts',
  ESCROW: '/api/escrow',
  NOTIFICATIONS: '/api/notifications',
  ANALYTICS: '/api/analytics',
} as const;

export const SUPPORTED_CHAINS = {
  ETHEREUM: 1,
  POLYGON: 137,
  BSC: 56,
  ARBITRUM: 42161,
} as const;

export const QUERY_KEYS = {
  GIFT_PACKS: 'gift-packs',
  USER_GIFT_PACKS: 'user-gift-packs',
  SUPPORTED_TOKENS: 'supported-tokens',
  TOKEN_PRICE: 'token-price',
  USER_NFTS: 'user-nfts',
  GIFT_PACK_STATS: 'gift-pack-stats',
  AUTH: 'auth',
} as const;

export const DEFAULT_TOKEN_DECIMALS = 18;
export const MAX_GIFT_PACK_MESSAGE_LENGTH = 500;
export const GIFT_CODE_LENGTH = 12;