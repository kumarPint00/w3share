'use client';
import useSWR from 'swr';

export function useAllowList() {
  const backendUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';
  
  const { data: allowList = [], isLoading, error } = useSWR(
    `${backendUrl}/assets/tokens/allow-list`,
    async (url) => {
      const res = await fetch(url);
      if (!res.ok) return [];
      return res.json();
    },
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: false,
      dedupingInterval: 60000, // 1 minute
    }
  );

  return { allowList, isLoading, error };
}
