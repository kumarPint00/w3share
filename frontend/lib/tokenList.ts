export type Erc20Meta = {
  symbol: string;
  name: string;
  address: string;
  decimals: number;
  coingeckoId: string;
  image?: string;
  chainId?: number;
};


export const ERC20_LIST: Erc20Meta[] = [
  // Mainnet tokens
  {
    symbol: 'USDC',
    name: 'USD Coin',
    address: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48',
    decimals: 6,
    coingeckoId: 'usd-coin',
    image: 'https://assets.coingecko.com/coins/images/6319/large/usdc.png',
    chainId: 1,
  },
  {
    symbol: 'DAI',
    name: 'Dai',
    address: '0x6B175474E89094C44Da98b954EedeAC495271d0F',
    decimals: 18,
    coingeckoId: 'dai',
    image: 'https://assets.coingecko.com/coins/images/9956/large/dai-multi-collateral-mcd.png',
    chainId: 1,
  },
  {
    symbol: 'LINK',
    name: 'Chainlink',
    address: '0x514910771AF9Ca656af840dff83E8264EcF986CA',
    decimals: 18,
    coingeckoId: 'chainlink',
    image: 'https://assets.coingecko.com/coins/images/877/large/chainlink-new-logo.png',
    chainId: 1,
  },
  {
    symbol: 'WETH',
    name: 'Wrapped Ether',
    address: '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2',
    decimals: 18,
    coingeckoId: 'weth',
    image: 'https://assets.coingecko.com/coins/images/279/large/ethereum.png',
    chainId: 1,
  },
  // Sepolia testnet tokens
  {
    symbol: 'USDC',
    name: 'USD Coin (Sepolia)',
    address: '0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238',
    decimals: 6,
    coingeckoId: 'usd-coin',
    image: 'https://assets.coingecko.com/coins/images/6319/large/usdc.png',
    chainId: 11155111,
  },
  {
    symbol: 'LINK',
    name: 'Chainlink (Sepolia)',
    address: '0x779877A7B0D9E8603169DdbD7836e478b4624789',
    decimals: 18,
    coingeckoId: 'chainlink',
    image: 'https://assets.coingecko.com/coins/images/877/large/chainlink-new-logo.png',
    chainId: 11155111,
  },
  {
    symbol: 'WETH',
    name: 'Wrapped Ether (Sepolia)',
    address: '0xfFf9976782d46CC05630D1f6eBAb18b2324d6B14',
    decimals: 18,
    coingeckoId: 'weth',
    image: 'https://assets.coingecko.com/coins/images/279/large/ethereum.png',
    chainId: 11155111,
  },
];
