export async function getUsdPrices(ids: string[]) {
  try {
    if (!ids || ids.length === 0) {
      return {};
    }
    
    // Filter out invalid/empty IDs
    const validIds = ids.filter(id => id && typeof id === 'string' && id.trim().length > 0);
    if (validIds.length === 0) {
      return {};
    }
    
    const query = validIds.join(',');
    const url   = `https://api.coingecko.com/api/v3/simple/price?ids=${query}&vs_currencies=usd`;
    
    console.debug('[Prices] Fetching prices for:', validIds);
    
    const res   = await fetch(url, { 
      cache: 'no-store',
      // Add timeout to prevent hanging requests
      signal: AbortSignal.timeout(10000) // 10 second timeout
    });
    
    if (!res.ok) {
      // Handle rate limiting gracefully
      if (res.status === 429) {
        console.warn('[Prices] Rate limited by CoinGecko API (429), returning empty prices');
        return {};
      }
      console.warn('[Prices] Price fetch failed:', res.status, res.statusText, 'URL:', url);
      return {};
    }
    
    const data = await res.json();
    console.debug('[Prices] Successfully fetched prices:', Object.keys(data).length, 'tokens');
    return data as Record<string, { usd: number }>;
  } catch (error: any) {
    console.warn('[Prices] Price fetch error:', error.message || error);
    // Return empty object instead of throwing to prevent interfering with other processes
    return {};
  }
}
