const KEY = process.env.NEXT_PUBLIC_ALCHEMY_KEY || 'demo';
const BASE = `https://eth-mainnet.g.alchemy.com/nft/v3/${KEY}/getNFTsForOwner`;

export async function getWalletNfts(address: string) {
  const params = new URLSearchParams({ owner: address, pageSize: '30', withMetadata: 'true' });
  const url = `${BASE}?${params.toString()}`;
  const res = await fetch(url, { cache: 'no-store' });
  if (!res.ok) throw new Error(`NFT fetch ${res.status}`);
  const json = await res.json();
  return (json.ownedNfts || []) as any[];
}
