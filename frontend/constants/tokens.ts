export const tokens: Token[] = [
    {
        symbol: "DOGE",
        address: "0x0000000000000000000000000000000000000000",
        decimals: 18,
        name: "Dogecoin",
    },
    {
        symbol: "ETH",
        address: "0xC02aaA39b223FE8D0A0e5C4F27edC2c7C3fA0b",
        decimals: 18,
        name: "Ethereum",
    },

    {
        symbol: "USDT",
        address: "0xdAC17F958D2ee523a2206206994597C13D831ec7",
        decimals: 6,
        name: "Tether USD",
    },
];

export interface Token {
    symbol: string;
    address: string;
    decimals: number;
    name: string;
}

export type TokenSymbol = keyof typeof tokens;