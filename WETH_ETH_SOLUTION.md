# ETH/WETH Gift Claiming Solution

## Problem Statement
When users claim gifts containing native ETH, they receive WETH (Wrapped ETH) instead of native ETH due to smart contract compatibility requirements.

## Root Cause
The backend automatically converts native ETH to WETH when locking gifts because:
- `SMART_GIFT_NATIVE_POLICY=wrap` in `/backend/.env`
- Smart contract `GiftEscrow.sol` only supports ERC20 tokens, not native ETH
- The contract requires `tokenAddress != address(0)`, preventing native ETH handling

## Solution Implemented
Added automatic WETH unwrapping functionality to provide users with native ETH:

### Backend Changes

1. **Environment Configuration** (`/backend/.env`):
   ```env
   SMART_GIFT_NATIVE_POLICY=wrap
   WRAPPED_NATIVE_ADDRESS=0xdd13E55209Fd76AfE204dBda4007C227904f0a81
   AUTO_UNWRAP_WETH=true
   ```

2. **Claim Service** (`/backend/src/claim/claim.service.ts`):
   - Added unwrap detection logic
   - Provides WETH contract interaction data
   - Returns unwrapping instructions with claim response

3. **API Endpoint** (`/backend/src/claim/claim.controller.ts`):
   - New endpoint: `POST /claim/id/:giftId`
   - Returns claim transaction data with unwrap information

### Frontend Changes

1. **API Types** (`/frontend/lib/api.ts`):
   ```typescript
   interface UnwrapInfo {
     shouldUnwrap: boolean;
     wethContract: string;
     wethAmount: string;
     unwrapData: string;
     message: string;
     instructions: string[];
   }
   ```

2. **WETHUnwrapHelper Component** (`/frontend/components/WETHUnwrapHelper.tsx`):
   - Visual guide for WETH → ETH conversion
   - Step-by-step instructions
   - Transaction data display

3. **Enhanced Claim UI** (`/frontend/components/SmartContractGiftHandler.tsx`):
   - Shows unwrap helper when WETH is detected
   - Provides clear user guidance

## How It Works

1. **Gift Creation**: Native ETH is automatically wrapped to WETH for smart contract compatibility
2. **Gift Claiming**: User receives WETH tokens
3. **Unwrapping Process**: System detects WETH and provides unwrapping instructions
4. **Final Result**: User converts WETH back to native ETH using WETH contract

## User Experience Flow

1. User claims gift containing "ETH"
2. System shows: "Claim data received! This gift contains WETH. See unwrap instructions below."
3. WETHUnwrapHelper component displays:
   - Amount to unwrap (e.g., "0.1000 ETH")
   - WETH contract address
   - Step-by-step instructions
   - "Execute WETH Unwrap Transaction" button

## Technical Details

### WETH Contract Integration
```solidity
// WETH contract method used for unwrapping
function withdraw(uint256 wad) public {
    require(balanceOf(msg.sender) >= wad, "Insufficient balance");
    _burn(msg.sender, wad);
    payable(msg.sender).transfer(wad);
    emit Withdrawal(msg.sender, wad);
}
```

### Smart Contract Limitations
- `GiftEscrow.sol` cannot handle native ETH directly
- Requires ERC20 token interface for all assets
- WETH provides ERC20 compatibility for ETH

## Benefits

1. **Seamless UX**: Users get native ETH as expected
2. **Smart Contract Security**: Maintains blockchain-backed gift integrity
3. **Transparency**: Clear instructions for the unwrapping process
4. **Flexibility**: System handles both ETH and other tokens appropriately

## Files Modified

- `/backend/.env` - Added unwrap configuration
- `/backend/src/claim/claim.service.ts` - Unwrap detection logic
- `/backend/src/claim/claim.controller.ts` - New claim endpoint
- `/frontend/lib/api.ts` - Updated types and API calls
- `/frontend/components/WETHUnwrapHelper.tsx` - New unwrap UI component
- `/frontend/components/SmartContractGiftHandler.tsx` - Integrated unwrap UI
- `/frontend/components/EnhancedClaimPage.tsx` - Display improvements

## Testing

To test the solution:
1. Create a gift with native ETH
2. Lock it on the blockchain (converts to WETH)
3. Claim the gift - system will show unwrap instructions
4. Follow the unwrap process to get native ETH

## Future Enhancements

1. **Automatic Unwrapping**: Implement gasless unwrapping via Gelato
2. **Batch Unwrapping**: Handle multiple WETH amounts in one transaction
3. **Cross-Chain Support**: Handle WETH on different networks
4. **User Preferences**: Allow users to choose ETH vs WETH receipt
