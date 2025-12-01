import { useQuery } from '@tanstack/react-query';
import { apiService } from '@/lib/api';

export function useSupportedTokens() {
  return useQuery({
    queryKey: ['supported-tokens'],
    queryFn: () => apiService.getSupportedTokens(),
    staleTime: 30 * 60 * 1000,
  });
}

export function useTokenPrice(tokenAddress?: string) {
  return useQuery({
    queryKey: ['token-price', tokenAddress],
    queryFn: () => {
      if (!tokenAddress) throw new Error('Token address required');

      return { price: 0, symbol: 'Unknown' };
    },
    enabled: !!tokenAddress,
    staleTime: 1 * 60 * 1000,
  });
}

export function useUserNFTs(address?: string) {
  return useQuery({
    queryKey: ['user-nfts', address],
    queryFn: () => apiService.getUserNFTs(address!),
    enabled: !!address,
    staleTime: 5 * 60 * 1000,
  });
}

export function useTokenValidation(tokenAddress?: string) {
  return useQuery({
    queryKey: ['token-validation', tokenAddress],
    queryFn: () => {
      if (!tokenAddress) throw new Error('Token address required');

      return { isValid: true, metadata: {} };
    },
    enabled: !!tokenAddress,
  });
}