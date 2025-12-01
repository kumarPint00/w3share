# GiftEscrow with Timer and Pause/Resume Functionality

This document explains the enhanced version of the GiftEscrow contract that includes timer and pause/resume capabilities.

## Features Added

1. **Pause/Resume Functionality**
   - Contract operations can be paused by the owner in case of emergencies
   - Operations can be resumed when it's safe to continue
   - Claiming and refund operations still work when paused to ensure users can access their funds

2. **Contract Timer**
   - The contract has a built-in timer that defines how long it remains active
   - Default active period is 365 days from deployment
   - Owner can extend the active period as needed
   - Owner can set a specific end date for the contract operations
   - After the timer expires, no new gifts can be created, but claiming and refunds still work

3. **Emergency Operations**
   - Emergency withdrawal functions for the owner to handle critical situations
   - Contract status can be checked via a dedicated function

## Contract Changes

The new contract `GiftEscrowPausable.sol` extends the original `GiftEscrow.sol` with the following additions:

1. Inherits from OpenZeppelin's `Pausable` and `Ownable` contracts
2. Added `contractActiveUntil` state variable for timer functionality
3. Added `whenActive` modifier to check if the contract is still within its active period
4. New functions:
   - `pause()` and `unpause()` for pausing/resuming operations
   - `extendActiveTimer()` to extend the active period
   - `setActiveTimerEnd()` to set a specific end date
   - `getActiveTimeRemaining()` to check remaining time
   - `getContractStatus()` to get full contract status
   - Emergency withdrawal functions

## Deployment Instructions

1. Deploy the new contract:

```bash
npx hardhat run scripts/deploy-gift-escrow-pausable.ts --network <network_name>
```

2. Update your environment variables with the new contract address.

3. Update any services or frontend components to use the new contract address.

## Using the Contract Timer

### As a Contract Owner

1. Check the contract status:
```solidity
// Returns (isPaused, activeUntil, isActive)
contract.getContractStatus();
```

2. Extend the active period:
```solidity
// Extend by 30 days
contract.extendActiveTimer(30);
```

3. Set a specific end date:
```solidity
// Set specific timestamp (Unix timestamp format)
contract.setActiveTimerEnd(1672531200); // e.g., December 31, 2023
```

4. Pause/Resume operations:
```solidity
// Pause all operations
contract.pause();

// Resume operations
contract.unpause();
```

### As a User

Users will experience these changes in the following ways:

1. If the contract is paused:
   - Cannot create new gifts
   - Can still claim gifts
   - Can still refund expired gifts

2. If the contract timer has expired:
   - Cannot create new gifts
   - Can still claim gifts
   - Can still refund expired gifts

## Backend Integration

Update your backend services to handle the new contract status:

1. Check if the contract is operational before allowing gift creation:

```typescript
const [isPaused, activeUntil, isActive] = await giftEscrowContract.getContractStatus();

if (isPaused || !isActive) {
  throw new Error('Contract operations are currently disabled');
}
```

2. Add admin routes to control contract status:

```typescript
// Pause contract
app.post('/admin/contract/pause', async (req, res) => {
  await giftEscrowContract.pause();
  res.send({ status: 'paused' });
});

// Resume contract
app.post('/admin/contract/unpause', async (req, res) => {
  await giftEscrowContract.unpause();
  res.send({ status: 'active' });
});

// Extend contract timer
app.post('/admin/contract/extend', async (req, res) => {
  const { days } = req.body;
  await giftEscrowContract.extendActiveTimer(days);
  res.send({ status: 'extended' });
});
```

## Frontend Integration

Update the frontend to show contract status to users:

1. Add a contract status indicator:

```typescript
// In your dashboard component
useEffect(() => {
  const checkContractStatus = async () => {
    const [isPaused, activeUntil, isActive] = await giftEscrowContract.getContractStatus();
    setContractStatus({ isPaused, activeUntil, isActive });
  };
  
  checkContractStatus();
}, []);
```

2. Display notice to users when contract is paused:

```jsx
{contractStatus.isPaused && (
  <Alert severity="warning">
    Gift creation is temporarily paused for maintenance. You can still claim existing gifts.
  </Alert>
)}
```

3. Disable gift creation UI when contract is inactive:

```jsx
<Button 
  variant="contained" 
  disabled={contractStatus.isPaused || !contractStatus.isActive}
  onClick={handleCreateGift}
>
  Create Gift
</Button>
```

## Testing

Run the comprehensive test suite to verify the new functionality:

```bash
npx hardhat test test/GiftEscrowPausable.test.ts
```

## Migration from Old Contract

To migrate from the old contract to the new pausable version:

1. Deploy the new contract
2. Add a notice to users about the contract upgrade
3. Gradually phase out the old contract by:
   - Disabling new gift creation on the old contract
   - Allowing existing gifts to be claimed or refunded
   - Eventually deactivating the old contract completely
