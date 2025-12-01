"use client";
import useSWR from 'swr';

const ALCHEMY = process.env.NEXT_PUBLIC_ALCHEMY_KEY || 'demo';

function toHttp(u?: string) {
  if (!u) return '';
  if (u.startsWith('ipfs://')) return `https://ipfs.io/ipfs/${u.slice(7)}`;
  return u;
}

function hexToDecMaybe(id: any) {
  if (!id) return '';
  const s = String(id);
  return s.startsWith('0x') ? (() => {
    try { return BigInt(s).toString(10); } catch { return s; }
  })() : s;
}

async function fetchNfts(addr: string) {
  const base = `https://eth-mainnet.g.alchemy.com/nft/v3/${ALCHEMY}/getNFTsForOwner`;
  const params = new URLSearchParams({ owner: addr, pageSize: '40', withMetadata: 'true' });
  const url = `${base}?${params.toString()}`;
  const res = await fetch(url, { cache: 'no-store' });
  if (!res.ok) throw new Error(`NFT fetch failed: ${res.status}`);
  const json = await res.json();
  const list = json.ownedNfts || json.ownedNftsV2 || [];

  return list.map((n: any) => {
    const tokenId = hexToDecMaybe(n.tokenId || n.id?.tokenId);
    const contract = n.contract?.address || n.contractAddress || n.collection?.address || '';
    const img =
      n.image?.cachedUrl ||
      n.image?.originalUrl ||
      n.media?.[0]?.gateway ||
      n.media?.[0]?.raw ||
      n.metadata?.image ||
      n.rawMetadata?.image ||
      '';
    const name =
      n.title ||
      n.name ||
      n.tokenName ||
      n.metadata?.name ||
      n.rawMetadata?.name ||
      `#${tokenId || '?'}`;

    return {
      id: `${contract}:${tokenId || '?'}`,
      name,
      image: toHttp(img) || '/placeholder.png',
      usd: 0,
    };
  });
}

export default function useWalletNfts(addr: string | null) {
  const { data, error, isLoading } = useSWR(
    addr ? ['nfts', addr] : null,
    () => fetchNfts(addr!),
    { refreshInterval: 3 * 60_000 }
  );

  return { nfts: data ?? [], error, loading: isLoading };
}
