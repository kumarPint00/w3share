export async function getUsdPrices(ids: string[]) {
  const query = ids.join(',');
  const url   = `https://api.coingecko.com/api/v3/simple/price?ids=${query}&vs_currencies=usd`;
  const res   = await fetch(url, { cache: 'no-store' });
  if (!res.ok) throw new Error('price fetch');
  return res.json() as Promise<Record<string, { usd: number }>>;
}
