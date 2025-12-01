import detectEthereumProvider from '@metamask/detect-provider';
import { ethers } from 'ethers';

export type MetaMaskProvider = ethers.BrowserProvider;

const isMobile = () =>
  typeof navigator !== 'undefined' &&
  /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);

export async function connectWallet() {
  const raw = (await detectEthereumProvider()) as any;

  if (!raw) {
    if (isMobile() && typeof window !== 'undefined') {
      const dapp = `https://metamask.app.link/dapp/${location.host}${location.pathname}`;
      location.href = dapp;
      throw new Error('Redirecting to MetaMask');
    }
    throw new Error('MetaMask not found');
  }

  const provider = new ethers.BrowserProvider(raw);
  const [address] = await provider.send('eth_requestAccounts', []);

  raw.on?.('accountsChanged', () => location.reload());
  raw.on?.('chainChanged', () => location.reload());

  return { provider, address };
}

export const formatAddress = (a: string) => a.slice(0, 6) + '…' + a.slice(-4);
