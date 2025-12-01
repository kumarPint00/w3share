import useSWR from 'swr';
import { api } from '@/lib/api';

export default function useBackendTokens(address: string | null) {
  return useSWR(
    address ? ['erc20', address] : null,
    () => api(`/assets/erc20?address=${address}`).then(r => r.json()),
  );
}


