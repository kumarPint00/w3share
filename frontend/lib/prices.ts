export async function getUsdPrices(ids: string[]) {
  try {
    const query = ids.join(',');
    const url   = `https://api.coingecko.com/api/v3/simple/price?ids=${query}&vs_currencies=usd`;
    const res   = await fetch(url, { 
      cache: 'no-store',
      // Add timeout to prevent hanging requests
      signal: AbortSignal.timeout(10000) // 10 second timeout
    });
    
    if (!res.ok) {
      // Handle rate limiting gracefully
      if (res.status === 429) {
        console.warn('[Prices] Rate limited by CoinGecko API, returning empty prices');
        return {};
      }
      console.warn('[Prices] Price fetch failed:', res.status, res.statusText);
      return {};
    }
    
    return res.json() as Promise<Record<string, { usd: number }>>;
  } catch (error: any) {
    console.warn('[Prices] Price fetch error:', error.message);
    // Return empty object instead of throwing to prevent interfering with other processes
    return {};
  }
}
