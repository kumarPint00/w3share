'use client';
import {
  createContext,
  useContext,
  useState,
  ReactNode,
  useEffect,
  useRef,
} from 'react';
import { ethers } from 'ethers';

interface WalletCtx {
  provider: ethers.BrowserProvider | null;
  address:  string | null;
  connect:  () => Promise<void>;
  disconnect: () => void;
}

/* default stub */
const Ctx = createContext<WalletCtx>({
  provider: null,
  address:  null,
  connect:  async () => {},
  disconnect: () => {},
});

export function WalletProvider({ children }: { children: ReactNode }) {
  const [provider, setProv] = useState<ethers.BrowserProvider | null>(null);
  const [address,  setAddr] = useState<string | null>(null);
  const rawProvRef = useRef<any | null>(null);
  const onAccountsChanged = useRef<((accs: string[]) => void) | null>(null);
  const onChainChanged = useRef<((chainId: string) => void) | null>(null);
  const connect = async () => {
    try {
      console.log('[WalletContext] Starting wallet connection...');
      
      // Direct access to window.ethereum instead of using detect-provider
      if (typeof window === 'undefined') {
        throw new Error('Not in browser environment');
      }
      
      const raw = (window as any).ethereum;
      console.log('[WalletContext] Provider detected:', !!raw);
      
      if (!raw) {
        console.error('[WalletContext] No Ethereum provider found');
        
        // Check if on mobile and redirect to MetaMask
        if (/iPhone|iPad|iPod|Android/i.test(navigator.userAgent)) {
          console.log('[WalletContext] Mobile detected, redirecting to MetaMask app...');
          const metamaskDeepLink = `https://metamask.app.link/dapp/${window.location.host}${window.location.pathname}`;
          window.location.href = metamaskDeepLink;
          throw new Error('Redirecting to MetaMask app...');
        }
        
        throw new Error('MetaMask not found. Please install MetaMask extension.');
      }
      
      console.log('[WalletContext] Creating BrowserProvider...');
      const p = new ethers.BrowserProvider(raw);
      
      console.log('[WalletContext] Requesting accounts...');
      const [addr] = await p.send('eth_requestAccounts', []);
      console.log('[WalletContext] Account received:', addr);
      
      setProv(p);
      setAddr(addr);
      rawProvRef.current = raw;
      
      console.log('[WalletContext] Removing old listeners...');
      try {
        raw.removeListener?.('accountsChanged', onAccountsChanged.current as any);
        raw.removeListener?.('chainChanged', onChainChanged.current as any);
      } catch (e) {
        console.warn('[WalletContext] Error removing listeners:', e);
      }

      onAccountsChanged.current = () => location.reload();
      onChainChanged.current = () => location.reload();

      console.log('[WalletContext] Attaching event listeners...');
      raw.on?.('accountsChanged', onAccountsChanged.current);
      raw.on?.('chainChanged', onChainChanged.current);
      
      console.log('[WalletContext] Connection successful!');
    } catch (error) {
      console.error('[WalletContext] Connection failed:', error);
      throw error;
    }
  };

  const clearCachedConnectors = () => {
    try {
      localStorage.removeItem('auth_token');
      const keys = [
        'walletconnect',
        'WALLETCONNECT_DEEPLINK_CHOICE',
        'wagmi.store',
        'web3modal',
        'web3_onboard_last_wallet',
      ];
      keys.forEach((k) => localStorage.removeItem(k));
    } catch {}
  };

  const removeProviderListeners = () => {
    const raw = rawProvRef.current;
    if (!raw) return;
    try {
      raw.removeListener?.('accountsChanged', onAccountsChanged.current as any);
      raw.removeListener?.('chainChanged', onChainChanged.current as any);
    } catch {}
    onAccountsChanged.current = null;
    onChainChanged.current = null;
  };

  const disconnect = () => {
    clearCachedConnectors();
    removeProviderListeners();
    setAddr(null);
    setProv(null);
    rawProvRef.current = null;
  };

  /* auto-connect if already authorised */
  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    (async () => {
      try {
        console.log('[WalletContext] Checking for existing connection...');
        
        const raw: any = (window as any).ethereum;
        
        if (!raw) {
          console.log('[WalletContext] No provider found for auto-connect');
          return;
        }
        
        console.log('[WalletContext] Provider found, selectedAddress:', raw.selectedAddress);
        
        if (raw && raw.selectedAddress) {
          console.log('[WalletContext] Auto-connecting with address:', raw.selectedAddress);
          const p = new ethers.BrowserProvider(raw);
          setProv(p);
          setAddr(raw.selectedAddress);
          rawProvRef.current = raw;

          try {
            raw.removeListener?.('accountsChanged', onAccountsChanged.current as any);
            raw.removeListener?.('chainChanged', onChainChanged.current as any);
          } catch (e) {
            console.warn('[WalletContext] Error removing listeners on auto-connect:', e);
          }
          
          onAccountsChanged.current = () => location.reload();
          onChainChanged.current = () => location.reload();
          raw.on?.('accountsChanged', onAccountsChanged.current);
          raw.on?.('chainChanged', onChainChanged.current);
          
          console.log('[WalletContext] Auto-connect successful!');
        }
      } catch (error) {
        console.error('[WalletContext] Auto-connect error:', error);
      }
    })();

    return () => {
      removeProviderListeners();
    };
  }, []);

  return (
    <Ctx.Provider value={{ provider, address, connect, disconnect }}>
      {children}
    </Ctx.Provider>
  );
}

/* convenient hook */
export function useWallet() {
  return useContext(Ctx);
}
