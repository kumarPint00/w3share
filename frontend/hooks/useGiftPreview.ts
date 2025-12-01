'use client';
import { useState, useEffect } from 'react';
import { GiftPack } from '@/types/gift';

interface GiftPreviewData {
  giftPack: GiftPack | null;
  onChainStatus: any | null;
  loading: boolean;
  error: string | null;
}

export function useGiftPreview(giftId: string | null): GiftPreviewData {
  const [giftPack, setGiftPack] = useState<GiftPack | null>(null);
  const [onChainStatus, setOnChainStatus] = useState<any | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!giftId) return;

    const fetchGiftPreview = async () => {
      setLoading(true);
      setError(null);

      try {
        const response = await fetch(`/api/gift/preview/${giftId}`);
        if (!response.ok) {
          throw new Error('Failed to fetch gift preview');
        }

        const data = await response.json();
        setGiftPack(data.giftPack);
        setOnChainStatus(data.onChainStatus);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        setLoading(false);
      }
    };

    fetchGiftPreview();
  }, [giftId]);

  return { giftPack, onChainStatus, loading, error };
}
