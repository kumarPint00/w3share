import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiService, WalletNonceResponse, SiweAuthResponse, WalletSession } from '@/lib/api';

export function useWalletAuth() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ message, signature }: { message: string; signature: string }) =>
      apiService.exchangeSiweSignature(message, signature),
    onSuccess: (data) => {
      localStorage.setItem('auth_token', data.accessToken);
      queryClient.invalidateQueries({ queryKey: ['auth'] });
    },
  });
}

export function useWalletVerification(address?: string) {
  return useQuery({
    queryKey: ['wallet-verification', address],
    queryFn: () => {
      if (!address) throw new Error('Address required');
      return { isVerified: true };
    },
    enabled: !!address,
  });
}

export function useWalletNonce() {
  return useMutation({
    mutationFn: (address: string) => apiService.requestWalletNonce(address),
    onError: (error) => {
      console.error('Failed to get wallet nonce:', error);
    },
  });
}

export function useSiweAuth() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ message, signature }: { message: string; signature: string }) =>
      apiService.exchangeSiweSignature(message, signature),
    onSuccess: (data: SiweAuthResponse) => {
      localStorage.setItem('auth_token', data.accessToken);
      queryClient.invalidateQueries({ queryKey: ['auth-session'] });
    },
    onError: (error) => {
      console.error('SIWE authentication failed:', error);
    },
  });
}

export function useAuthSession() {
  return useQuery({
    queryKey: ['auth-session'],
    queryFn: () => apiService.getCurrentSession(),
    retry: false,
    staleTime: 5 * 60 * 1000,
  });
}

export function useLogout() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      localStorage.removeItem('auth_token');
      return { success: true };
    },
    onSuccess: () => {
      queryClient.clear();
    },
  });
}