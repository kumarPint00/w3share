export function notifyWallet(message: string, type: 'info' | 'warning' | 'error' = 'info') {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('wallet:notification', { detail: { message, type } }));
  }
}
