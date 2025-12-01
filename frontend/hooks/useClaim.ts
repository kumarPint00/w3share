import { useMutation, useQuery, useQueryClient, Query } from '@tanstack/react-query';
import { apiService, ClaimRequest, ClaimStatus } from '@/lib/api';

export function useSubmitClaim() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (claimData: ClaimRequest) => apiService.submitClaim(claimData),
    onSuccess: (_, variables) => {
      const giftRef = variables.giftCode ?? variables.giftId;
      queryClient.invalidateQueries({ queryKey: ['claim-status', giftRef] });
      queryClient.invalidateQueries({ queryKey: ['user-claimed-gifts'] });
    },
  });
}

export function useClaimStatus(giftRef?: string | number) {
  return useQuery({
    queryKey: ['claim-status', giftRef],
    queryFn: () => apiService.getClaimStatus(giftRef!),
    enabled: giftRef !== undefined && giftRef !== null && String(giftRef).trim() !== '',
    refetchInterval: (query) => {
      const data = (query as unknown as Query<ClaimStatus>).state.data as ClaimStatus | undefined;
      const status = data?.status;
      if (status === 'CLAIMED' || status === 'FAILED') {
        return false;
      }
      return 5000;
    },
  });
}