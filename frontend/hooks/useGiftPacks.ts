import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  apiService,
  GiftPack,
  CreateGiftPackData,
  UpdateGiftPackData,
  AddItemToGiftPackData
} from '@/lib/api';

export function useCreateGiftPack() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateGiftPackData) => apiService.createGiftPack(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-gift-packs'] });
    },
  });
}

export function useGiftPack(id?: string) {
  return useQuery({
    queryKey: ['gift-pack', id],
    queryFn: () => apiService.getGiftPack(id!),
    enabled: !!id,
    staleTime: 1 * 60 * 1000,
  });
}

export function useUpdateGiftPack() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateGiftPackData }) =>
      apiService.updateGiftPack(id, data),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ['gift-pack', id] });
      queryClient.invalidateQueries({ queryKey: ['user-gift-packs'] });
    },
  });
}

export function useDeleteGiftPack() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => apiService.deleteGiftPack(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-gift-packs'] });
    },
  });
}

export function useAddItemToGiftPack() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, item }: { id: string; item: AddItemToGiftPackData }) =>
      apiService.addItemToGiftPack(id, item),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ['gift-pack', id] });
    },
  });
}

export function useRemoveItemFromGiftPack() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, itemId }: { id: string; itemId: string }) =>
      apiService.removeItemFromGiftPack(id, itemId),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ['gift-pack', id] });
    },
  });
}

export function useLockGiftPack() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id }: { id: string }) =>
      apiService.lockGiftPack(id),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ['gift-pack', id] });
      queryClient.invalidateQueries({ queryKey: ['user-gift-packs'] });
    },
  });
}

export function useOnChainGiftStatus(giftId?: number) {
  return useQuery({
    queryKey: ['on-chain-gift-status', giftId],
    queryFn: () => apiService.getOnChainGiftStatus(giftId!),
    enabled: !!giftId,
    staleTime: 1 * 60 * 1000,
  });
}

export function useUserGiftPacks(address?: string) {
  return useQuery({
    queryKey: ['user-gift-packs', address],
    queryFn: () => apiService.getUserGiftPacks(address!),
    enabled: !!address,
    staleTime: 2 * 60 * 1000,
  });
}

export function useUserClaimedGifts(address?: string) {
  return useQuery({
    queryKey: ['user-claimed-gifts', address],
    queryFn: () => apiService.getUserClaimedGifts(address!),
    enabled: !!address,
    staleTime: 2 * 60 * 1000,
  });
}



export function useCreateSmartContractGift() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateGiftPackData) => apiService.createSmartContractGift(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-gift-packs'] });
    },
  });
}

export function useFinalizeSmartContractGift() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id }: { id: string }) =>
      apiService.finalizeSmartContractGift(id),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ['gift-pack', id] });
      queryClient.invalidateQueries({ queryKey: ['user-gift-packs'] });
      queryClient.invalidateQueries({ queryKey: ['user-gift-packs-with-smart-contract'] });
    },
  });
}

export function useValidateGiftForLocking(id?: string) {
  return useQuery({
    queryKey: ['validate-gift-for-locking', id],
    queryFn: () => apiService.validateGiftForLocking(id!),
    enabled: !!id,
    staleTime: 30 * 1000,
  });
}

export function useGiftPackWithSmartContractStatus(id?: string) {
  return useQuery({
    queryKey: ['gift-pack-with-smart-contract-status', id],
    queryFn: () => apiService.getGiftPackWithSmartContractStatus(id!),
    enabled: !!id,
    staleTime: 1 * 60 * 1000,
  });
}

export function useUserGiftPacksWithSmartContractInfo(address?: string) {
  return useQuery({
    queryKey: ['user-gift-packs-with-smart-contract', address],
    queryFn: () => apiService.getUserGiftPacksWithSmartContractInfo(address!),
    enabled: !!address,
    staleTime: 2 * 60 * 1000,
  });
}

export function useClaimSmartContractGift() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ giftId, claimer }: { giftId: number; claimer: string }) =>
      apiService.claimSmartContractGift(giftId, claimer),
    onSuccess: (_, { giftId }) => {
      queryClient.invalidateQueries({ queryKey: ['on-chain-gift-status', giftId] });
      queryClient.invalidateQueries({ queryKey: ['user-gift-packs'] });
      queryClient.invalidateQueries({ queryKey: ['user-gift-packs-with-smart-contract'] });
      queryClient.invalidateQueries({ queryKey: ['user-claimed-gifts'] });
    },
  });
}

export function useValidateMultipleGiftsForLocking() {
  return useMutation({
    mutationFn: (ids: string[]) => apiService.validateMultipleGiftsForLocking(ids),
  });
}


export function useIsGiftPackSmartContractBacked(giftPack?: GiftPack) {
  return giftPack ? apiService.isGiftPackSmartContractBacked(giftPack) : false;
}

export function useGiftPackByOnChainId(giftId?: number) {
  return useQuery({
    queryKey: ['gift-pack-by-chain-id', giftId],
    queryFn: () => apiService.getGiftPackByOnChainId(giftId!),
    enabled: !!giftId && giftId > 0,
    staleTime: 1 * 60 * 1000,
  });
}

export function useGiftPreview(giftId?: number) {
  return useQuery({
    queryKey: ['gift-preview', giftId],
    queryFn: () => apiService.getGiftPreview(giftId!),
    enabled: !!giftId && giftId > 0,
    staleTime: 1 * 60 * 1000,
  });
}