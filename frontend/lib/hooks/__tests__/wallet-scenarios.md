# Wallet Connection Edge Cases & Negative Scenarios

This document outlines the wallet connection scenarios that have been improved in the WalletContext.

## Scenarios Covered

### 1. **User Rejects Wallet Connection**
- **Status**: ✅ Handled
- **Code**: Error code 4001 or message containing "rejected"
- **Behavior**: 
  - Sets `connectionRejected` state
  - Auto-clears after 5 seconds
  - Shows warning notification instead of throwing
  - No console errors leaked to user

### 2. **No Wallet Provider Installed**
- **Status**: ✅ Handled
- **Behavior**:
  - Checks if window.ethereum exists
  - On mobile: Redirects to MetaMask app via deep link
  - On desktop: Shows clear error "MetaMask not found"

### 3. **Multiple Wallet Providers Detected**
- **Status**: ✅ Handled
- **Code**: window.ethereum.providers array
- **Priority**: MetaMask > Coinbase > Brave > Generic
- **Behavior**: Automatically selects preferred provider

### 4. **Extension Internal Errors**
- **Status**: ✅ Handled
- **Errors**: "selectExtension", "installHook", "unexpected error"
- **Behavior**:
  - Detects extension-specific errors via `looksLikeExtensionInternal()`
  - Retries with 400ms delay (extensions sometimes flaky)
  - Falls back through multiple RPC methods:
    1. eth_requestAccounts via BrowserProvider
    2. raw.request()
    3. raw.enable()
    4. eth_accounts (read-only)
    5. wallet_requestPermissions
  - Suppresses extension errors from Next.js error overlay

### 5. **No Accounts Returned**
- **Status**: ✅ Handled
- **Behavior**:
  - Validates that at least one account is returned
  - Validates account address format (0x + 40 hex chars)
  - Throws clear error if invalid

### 6. **Account Changed Event**
- **Status**: ✅ Improved
- **Before**: Unconditionally reloaded on any change
- **After**: 
  - Logs the change
  - If empty account list: sets state to null (disconnects gracefully)
  - If new account: reloads to reflect change
  - Proper error handling if listener detaches

### 7. **Chain Changed Event**
- **Status**: ✅ Improved
- **Before**: Reloaded page
- **After**:
  - Logs chain change with chainId
  - Still reloads to ensure state consistency
  - Proper error handling

### 8. **Auto-Connect on Page Load**
- **Status**: ✅ Improved
- **Before**: Could fail silently
- **After**:
  - Validates selectedAddress format
  - Verifies network connectivity
  - Gracefully handles failures
  - Clears state if auto-connect fails
  - Properly attaches event listeners

### 9. **Provider becomes unavailable**
- **Status**: ✅ Handled
- **Behavior**:
  - Disconnect clears all state
  - Clears localStorage cache keys
  - Removes all event listeners safely
  - Resets connectionRejected flag

### 10. **Network/RPC Errors During Balance Fetch**
- **Status**: ✅ Improved
- **Location**: WalletWidget ETH balance fetch
- **Before**: Could silently fail
- **After**:
  - Logs warning with error details
  - Sets balance to undefined gracefully
  - UI shows loading or 0.0000 ETH
  - Doesn't interrupt other operations

### 11. **Disconnect Fails**
- **Status**: ✅ Improved
- **Behavior**:
  - Tries to clean up listeners
  - If cleanup fails, still clears state
  - Logs all errors for debugging
  - Ensures UI reflects disconnected state

### 12. **Multiple Connection Attempts in Flight**
- **Status**: ✅ Safe via React state
- **Behavior**:
  - Each connection attempt clears `connectionRejected` state
  - New error replaces old one
  - Race conditions handled by React

## Test Scenarios for Manual Testing

### Desktop (MetaMask Extension)
```
1. Connect normally → ✅ Should connect and show address
2. Reject → ✅ Should show rejection message
3. Connect again → ✅ Should work after rejection cleared
4. Switch account in MetaMask → ✅ Should reload page
5. Switch chain in MetaMask → ✅ Should reload page
6. Disconnect in MetaMask → ✅ Should set address to null
7. Disconnect button → ✅ Should clear state
8. Refresh page with connected account → ✅ Should auto-connect
```

### Mobile (MetaMask App)
```
1. No MetaMask installed → ✅ Should redirect to MetaMask app link
2. Open in MetaMask → ✅ Should connect
3. Connection in app → ✅ Should work
4. Account changes in app → ✅ Should reload
```

### Edge Cases
```
1. Slow network during connection → ✅ 10s timeout prevents hanging
2. Provider returns empty accounts → ✅ Shows "No accounts returned" error
3. Invalid address format → ✅ Logs warning, auto-connect skipped
4. Multiple extensions installed → ✅ Selects MetaMask first
5. Extension broken/disabled → ✅ Shows helpful error message
6. Disconnect during connection attempt → ✅ Connection state clears
```

## Code Changes Made

### 1. Enhanced Account Validation
```typescript
// Validate address format before using
if (!/^0x[a-fA-F0-9]{40}$/.test(addr)) {
  throw new Error(`Invalid account address format: ${addr}`);
}
```

### 2. Smarter Account Change Listener
```typescript
onAccountsChanged.current = (accs: string[]) => {
  if (!Array.isArray(accs) || accs.length === 0) {
    // User disconnected from MetaMask
    setAddr(null);
    setProv(null);
  } else {
    // Account switched
    location.reload();
  }
};
```

### 3. Network Verification on Auto-Connect
```typescript
try {
  const network = await p.getNetwork();
  console.log('[WalletContext] Connected to chain:', network.chainId);
} catch (networkErr) {
  console.warn('[WalletContext] Failed to get network during auto-connect');
  // Continue anyway, network might not be reachable yet
}
```

### 4. Better Error Categorization
```typescript
const isNetworkError = errorMessage.includes('network');
const isTimeoutError = errorMessage.includes('timeout');
const isProviderError = errorMessage.includes('provider');
const isUserCanceled = /rejected|user denied/i.test(errorMessage);
```

### 5. Safe Listener Removal
```typescript
try {
  raw.removeListener?.('accountsChanged', onAccountsChanged.current);
  raw.removeListener?.('chainChanged', onChainChanged.current);
} catch (e) {
  console.warn('[WalletContext] Error removing listeners:', e);
}
```

## Debugging Guide

### Enable Debug Logs
Open DevTools Console and look for `[WalletContext]` and `[WalletWidget]` prefixed logs.

### Common Issues

**Issue**: "MetaMask not found" on desktop
- **Check**: Is MetaMask extension installed and enabled?
- **Fix**: Install MetaMask or enable extension

**Issue**: "Wallet connection canceled" appears
- **Check**: Did you click "Cancel" or "Reject"?
- **Fix**: This is expected, click "Connect Wallet" again

**Issue**: Connection seems to hang
- **Check**: Network connection?
- **Fix**: Will timeout after 10 seconds with error

**Issue**: Can't disconnect
- **Check**: Browser console for errors
- **Fix**: Hard refresh page (Cmd/Ctrl + Shift + R)

## Token Price & Logo Improvements

### USD Conversion Fixes
1. **Enhanced CoinGecko ID Mapping**: Added missing tokens (USDT, PEPE, UNI, DOGE)
2. **Better Fallback Logic**: If price fetch fails, gracefully returns 0 instead of breaking
3. **Empty ID Validation**: Filters out invalid/empty CoinGecko IDs before API call
4. **Debug Logging**: Added debug logs to track price fetch status

### Token Logo Fixes
1. **CoinGecko Fallback**: All tokens now have CoinGecko CDN URLs
2. **Smart Path Detection**: Rejects relative paths like `/tokens/xxx.png`
3. **Symbol-Based Lookup**: Uses TOKEN_LOGO_MAP for known tokens
4. **Proper URL Validation**: Only accepts http:// or https:// URLs
5. **Graceful Degradation**: Falls back to Avatar component default if no image

## Files Modified

1. `frontend/lib/tokenList.ts` - Added missing tokens and proper CoinGecko IDs
2. `frontend/lib/prices.ts` - Improved error handling and validation
3. `frontend/lib/hooks/useWalletToken.ts` - Better image URL handling
4. `frontend/components/ClaimGiftForm.tsx` - Comprehensive TOKEN_LOGO_MAP and fallback logic
5. `frontend/components/WalletWidget.tsx` - Better error messages and logging
6. `frontend/context/WalletContext.tsx` - Comprehensive edge case handling
