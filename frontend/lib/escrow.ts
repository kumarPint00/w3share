
export function generateSecretCode(): string {
  throw new Error('generateSecretCode is deprecated. Use backend-driven flow.');
}

export async function sealPack(): Promise<never> {
  throw new Error('sealPack is deprecated. Use apiService.createGiftPack + lockGiftPack.');
}

export async function claimPack(): Promise<never> {
  throw new Error('claimPack is deprecated. Use ClaimGiftForm and backend /claim APIs.');
}
