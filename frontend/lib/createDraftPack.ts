import { api } from "./api";

export async function createDraft(senderAddress: string) {
  return api('/giftpacks', {
    method: 'POST',
    body: JSON.stringify({ senderAddress })
  }).then(r => r.json());
}

export async function addItem(id: string, item: { type: 'ERC20' | 'ERC721'; contract: string; tokenId?: string; amount?: string }) {
  return api(`/giftpacks/${id}/items`, {
    method: 'POST',
    body: JSON.stringify(item),
  });
}

export async function updatePack(id: string, message?: string) {
  await api(`/giftpacks/${id}`, {
    method: 'PATCH',
    body: JSON.stringify({ message }),
  });
  return api(`/giftpacks/${id}`).then(r => r.json());
}

export async function lockPackOnChain(id: string) {
  return api(`/giftpacks/${id}/lock`, {
    method: 'POST',
    body: JSON.stringify({}),
  }).then(r => r.json());
}
