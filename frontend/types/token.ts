export interface Token {
    address: string;
    symbol: string;
    name: string;
    decimals: number;
    totalSupply?: string;
    logoURI?: string;
    chainId: number;
    usd: number;
    balance: number;
    id: string;
    image?: string;
    isNative?: boolean;
    type?: 'ERC20' | 'ERC721' | 'ERC1155';
    isSelected?: boolean;
    amount?: number;
    priceChange24h?: number;
    marketCap?: number;
    priceUsd?: number;
}


export type TokenAmount = {
    token: Token;
    amount: string;
};


export type TokenList = {
    name: string;
    tokens: Token[];
};