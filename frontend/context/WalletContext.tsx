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
  connectionRejected: boolean;
  clearConnectionRejection: () => void;
}

/** Detect MetaMask / extension-internal failures (selectExtension, installHook, evmAsk, etc.) */
const looksLikeExtensionInternal = (e: any) => {
  const m = String(e?.message || e || '').toLowerCase();
  return /selectextension|installhook|unexpected error|^me:/i.test(m);
};

/* default stub */
const Ctx = createContext<WalletCtx>({
  provider: null,
  address:  null,
  connect:  async () => {},
  disconnect: () => {},
  connectionRejected: false,
  clearConnectionRejection: () => {},
});

export function WalletProvider({ children }: { children: ReactNode }) {
  const [provider, setProv] = useState<ethers.BrowserProvider | null>(null);
  const [address,  setAddr] = useState<string | null>(null);
  const [connectionRejected, setConnectionRejected] = useState(false);
  const rawProvRef = useRef<any | null>(null);
  const onAccountsChanged = useRef<((accs: string[]) => void) | null>(null);
  const onChainChanged = useRef<((chainId: string) => void) | null>(null);
  
  const connect = async () => {
    try {
      console.log('[WalletContext] Starting wallet connection...');
      setConnectionRejected(false);  // Clear rejection state on new attempt
      
      // Direct access to window.ethereum instead of using detect-provider
      if (typeof window === 'undefined') {
        throw new Error('Not in browser environment');
      }
      
      const injected = (window as any).ethereum;
      // If multiple injected providers are present (window.ethereum.providers), pick a sane default
      let raw = injected;
      if (Array.isArray(injected?.providers)) {
        const preferred = injected.providers.find((p: any) => p.isMetaMask)
          || injected.providers.find((p: any) => p.isCoinbaseWallet)
          || injected.providers.find((p: any) => p.isBraveWallet)
          || injected.providers.find((p: any) => typeof p.request === 'function');
        if (preferred) {
          raw = preferred;
          console.log('[WalletContext] Multiple injected providers detected — using selected provider:', preferred?.isMetaMask ? 'metamask' : preferred?.isCoinbaseWallet ? 'coinbase' : 'other');
        }
      }
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
      
      console.log('[WalletContext] Requesting accounts (with fallbacks)...');
      let accounts: string[] = [];

      try {
        // Primary request (ethers BrowserProvider)
        try {
          const result = await p.send('eth_requestAccounts', []);
          accounts = Array.isArray(result) ? result : (result ? [String(result)] : []);
        } catch (err1) {
          console.warn('[WalletContext] p.send failed — will try fallbacks', err1);

          // If extension internals threw, give it a short pause and retry once (some extensions are flaky)
          if (looksLikeExtensionInternal(err1)) {
            await new Promise((res) => setTimeout(res, 400));
            try {
              const retry = await p.send('eth_requestAccounts', []);
              accounts = Array.isArray(retry) ? retry : (retry ? [String(retry)] : []);
            } catch (retryErr) {
              console.warn('[WalletContext] Retry after extension-internal error failed', retryErr);
            }
          }

          // Try provider-level request / enable
          if (!accounts.length) {
            try {
              if (typeof raw?.request === 'function') {
                const res = await raw.request({ method: 'eth_requestAccounts' });
                accounts = Array.isArray(res) ? res : (res ? [String(res)] : []);
              } else if (typeof raw?.enable === 'function') {
                const res = await raw.enable();
                accounts = Array.isArray(res) ? res : (res ? [String(res)] : []);
              } else {
                throw err1;
              }
            } catch (err2) {
              console.warn('[WalletContext] raw.request/enable also failed — trying eth_accounts', err2);

              // last-resort: read eth_accounts
              try {
                const res = await raw.request?.({ method: 'eth_accounts' }) ?? [];
                accounts = Array.isArray(res) ? res : (res ? [String(res)] : []);
              } catch (err3) {
                console.warn('[WalletContext] eth_accounts failed — trying wallet_requestPermissions', err3);

                // permission-based fallback (some wallets prefer explicit permissions)
                try {
                  if (typeof raw?.request === 'function') {
                    await raw.request({ method: 'wallet_requestPermissions', params: [{ eth_accounts: {} }] });
                    const res2 = await raw.request({ method: 'eth_accounts' });
                    accounts = Array.isArray(res2) ? res2 : (res2 ? [String(res2)] : []);
                  } else {
                    throw err3;
                  }
                } catch (err4) {
                  console.error('[WalletContext] All account request fallbacks failed', err1, err2, err3, err4);
                  // Normalize error so UI mapping can detect extension-internal failures
                  const root = err1 || err2 || err3 || err4;
                  const message = root?.message || String(root) || 'Wallet provider error';
                  throw new Error(message);
                }
              }
            }
          }
        }
      } catch (finalErr) {
        // bubble up so WalletWidget can map and show a friendly message; ensure message content is preserved
        throw finalErr;
      }

      const addr = accounts[0];
      if (!addr) {
        throw new Error('No accounts returned by wallet provider');
      }
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
    } catch (error: any) {
      console.error('[WalletContext] Connection failed:', error);

      // If this looks like an extension-internal failure (selectExtension / installHook / evmAsk),
      // surface a friendly notification and do NOT rethrow the raw provider error (prevents noisy console logs).
      if (looksLikeExtensionInternal(error)) {
        try {
          window.dispatchEvent(new CustomEvent('wallet:notification', { detail: { message: 'Wallet extension failed to respond. Try disabling other wallet extensions, refresh the page, or use the MetaMask mobile app.', type: 'error' } }));
        } catch {}
        return;
      }

      // Check if user rejected the request (MetaMask error code 4001)
      if (
        error?.code === 4001 ||
        (typeof error?.message === 'string' && /rejected|user denied|user rejected/i.test(error.message))
      ) {
        console.log('[WalletContext] User rejected wallet connection');
        setConnectionRejected(true);
        // auto-clear rejection state after a slightly longer timeout so the user can see the UI
        setTimeout(() => setConnectionRejected(false), 5000);
        // notify global UI (use warning level for cancellations)
        try { window.dispatchEvent(new CustomEvent('wallet:notification', { detail: { message: 'Wallet connection canceled', type: 'warning' } })); } catch {}
        // Swallow the error for user-initiated cancellations so callers don't need to handle raw exceptions
        return;
      }
      // Unexpected errors should still bubble up
      throw error;
    }
  };

  const clearConnectionRejection = () => {
    console.log('[WalletContext] Clearing connection rejection state');
    setConnectionRejected(false);
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

  /* Suppress MetaMask/extension unhandled rejections (selectExtension, installHook, etc.)
     that can bubble up to Next.js's error overlay during extension initialisation */
  useEffect(() => {
    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      const msg = String(event?.reason?.message || event?.reason || '').toLowerCase();
      if (/selectextension|installhook|unexpected error|^me:/i.test(msg)) {
        event.preventDefault();
        console.warn('[WalletContext] Suppressed extension-internal unhandled rejection:', event.reason);
      }
    };
    window.addEventListener('unhandledrejection', handleUnhandledRejection);
    return () => window.removeEventListener('unhandledrejection', handleUnhandledRejection);
  }, []);

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
    <Ctx.Provider value={{ provider, address, connect, disconnect, connectionRejected, clearConnectionRejection }}>
      {children}
    </Ctx.Provider>
  );
}

/* convenient hook */
export function useWallet() {
  return useContext(Ctx);
}
