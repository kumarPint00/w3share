import { useEffect, useState } from 'react';
import { getUsdPrices } from '@/lib/prices';
import { getEthBalance } from '../balance';
import { getWalletNfts } from '../nft';
import { useWallet } from '@/context/WalletContext';

export default function useWalletData() {
  const { provider, address, connect } = useWallet();
  const [ethBal, setEthBal] = useState<number>();
  const [prices, setPrices] = useState<Record<string, number>>({});
  const [nfts, setNfts] = useState<any[]>([]);

  useEffect(() => {
    if (!provider || !address) return;
    (async () => {
      setEthBal(await getEthBalance(provider, address));
      const priceMap = await getUsdPrices(['ethereum', 'dogecoin']);
      setPrices({ eth: priceMap.ethereum.usd, doge: priceMap.dogecoin.usd });
      try {
        const list = await getWalletNfts(address);
        const mapped = list.map((n: any) => ({
          contract: { address: n.contract?.address },
          tokenId: n.tokenId || n.id?.tokenId,
          media: [{ gateway: n.image?.cachedUrl || n.image?.originalUrl || n.metadata?.image || '' }],
          title: n.name || n.title,
        }));
        setNfts(mapped);
      } catch {
        setNfts([]);
      }
    })();
  }, [provider, address]);

  return { connect, connected: !!address, address: address || '', ethBal, prices, nfts };
}
