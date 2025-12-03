'use client';
import useSWR from 'swr';
import { ethers, Contract } from 'ethers';
import { ERC20_LIST, type Erc20Meta } from '@/lib/tokenList';
import erc20Abi from '@/lib/erc20Abi.json';
import { getUsdPrices } from '@/lib/prices';

import { Token } from '@/types/token';

async function getEthEntry(provider: ethers.BrowserProvider, address: string, ethUsd: number): Promise<Token> {
  const network = await provider.getNetwork();
  const wei = await provider.getBalance(address);
  const balance = Number(ethers.formatEther(wei));
  const chainIdNum = Number(network.chainId);
  return {
    id: `eth-native-${chainIdNum}`,
    name: chainIdNum === 11155111 ? 'Ethereum Sepolia' : 'Ethereum',
    symbol: 'ETH',
    address: 'native',
    decimals: 18,
    chainId: chainIdNum,
    balance,
    usd: balance * (ethUsd || 0),
    image: '/eth.png',
    type: 'ERC20',
    isNative: true,
    priceUsd: ethUsd || 0,
  };
}

async function getErc20Entry(p: ethers.BrowserProvider, wallet: string, meta: Erc20Meta, usdPrice: number): Promise<Token | null> {
  try {
    const network = await p.getNetwork();
    const chainIdNum = Number(network.chainId);

    if (chainIdNum !== 11155111 && chainIdNum !== 1) return null;
    const c = new Contract(meta.address, erc20Abi, p);
    const balRaw = await c.balanceOf(wallet);
    const balance = parseFloat(ethers.formatUnits(balRaw, meta.decimals));
    if (balance <= 0) return null;
    return {
      id: meta.address.toLowerCase() + '-' + chainIdNum,
      name: meta.name + (chainIdNum === 11155111 ? ' (Sepolia)' : ''),
      symbol: meta.symbol,
      address: meta.address,
      decimals: meta.decimals,
      chainId: chainIdNum,
      balance,
      usd: balance * (usdPrice || 0),
      image: meta.image,
      type: 'ERC20',
      priceUsd: usdPrice || 0,
    };
  } catch {
    return null;
  }
}

async function fetchWalletTokens(provider: ethers.BrowserProvider, address: string): Promise<Token[]> {
  const network = await provider.getNetwork();
  const chainIdNum = Number(network.chainId);

  if (chainIdNum !== 11155111 && chainIdNum !== 1) {

    return [];
  }
  // First try backend endpoint which can return the actual tokens present on the chain (including Sepolia addresses)
  try {
    const backendUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';
    const res = await fetch(`${backendUrl}/assets/erc20?address=${encodeURIComponent(address)}`);
    if (res.ok) {
      const body: Array<any> = await res.json();
      // attempt to fetch price map for listed tokens (coingecko ids from our ERC20_LIST)
      const ids = ['ethereum', ...Array.from(new Set(ERC20_LIST.map(t => t.coingeckoId)))];
      const priceMap = await getUsdPrices(ids);
      const ethUsd = priceMap?.ethereum?.usd ?? 0;

      const ethEntry = await getEthEntry(provider, address, ethUsd);

      const erc20sFromBackend: Token[] = body.map((b: any) => {
        const decimals = Number(b.decimals ?? 18);
        const chainId = Number(b.chainId ?? chainIdNum);
        
        // Convert hex balance to proper decimal
        let balance = 0;
        if (b.balance && b.balance !== '0x0') {
          const rawBalance = BigInt(b.balance);
          balance = Number(rawBalance) / Math.pow(10, decimals);
        }
        
        // Find matching token in static list for metadata
        const staticToken = ERC20_LIST.find(t => 
          t.address.toLowerCase() === (b.contractAddress || '').toLowerCase()
        );
        
        const coingeckoId = staticToken?.coingeckoId;
        const price = coingeckoId ? (priceMap?.[coingeckoId]?.usd ?? 0) : 0;
        
        return {
          id: `${(b.contractAddress || 'native').toLowerCase()}-${chainId}`,
          name: staticToken?.name || b.name || b.symbol || 'Unknown Token',
          symbol: staticToken?.symbol || b.symbol || 'TKN',
          address: (b.contractAddress || '').toLowerCase(),
          decimals,
          chainId,
          balance: balance,
          usd: balance * (price || 0),
          image: staticToken?.image || b.logoURI || '/tokens/default.png',
          type: 'ERC20',
          priceUsd: price || 0,
        } as Token;
      });

      const list = [ethEntry, ...erc20sFromBackend].sort((a, b) => (b.usd || 0) - (a.usd || 0));
      return list;
    }
  } catch (e) {
    // fallback to client-side static list scanning
    console.warn('Backend token fetch failed, falling back to static list', e);
  }

  // Fallback: use the static ERC20_LIST (mainnet addresses) where possible
  const ids = ['ethereum', ...Array.from(new Set(ERC20_LIST.map(t => t.coingeckoId)))];
  const priceMap = await getUsdPrices(ids);
  const ethUsd = priceMap?.ethereum?.usd ?? 0;

  const [ethEntry, erc20s] = await Promise.all([
    getEthEntry(provider, address, ethUsd),
    Promise.all(
      ERC20_LIST
        .filter(meta => !meta.chainId || meta.chainId === chainIdNum)
        .map(async (meta) =>
          getErc20Entry(provider, address, meta, priceMap?.[meta.coingeckoId]?.usd ?? 0)
        )
    ),
  ]);

  const list = [ethEntry, ...erc20s.filter(Boolean) as Token[]].sort((a, b) => (b.usd || 0) - (a.usd || 0));
  return list;
}

export default function useWalletTokens(
  provider: ethers.BrowserProvider | null,
  address: string | null,
) {
  const shouldFetch = !!provider && !!address;
  const { data, error, isLoading } = useSWR(
    shouldFetch ? ['wallet-tokens', address] : null,
    () => fetchWalletTokens(provider!, address!),
    { refreshInterval: 60_000 }
  );

  return { tokens: data ?? [], error, loading: isLoading };
}
