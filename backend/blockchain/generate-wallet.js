const { ethers } = require('ethers');

// Generate a new wallet
const wallet = ethers.Wallet.createRandom();

console.log('=== NEW MAINNET WALLET ===');
console.log('Address:', wallet.address);
console.log('Private Key:', wallet.privateKey);
console.log('Mnemonic:', wallet.mnemonic?.phrase);
console.log('');
console.log('⚠️  SECURITY WARNING:');
console.log('1. Save this private key SECURELY');
console.log('2. Never share it with anyone');
console.log('3. Fund this wallet with ~0.1 ETH for deployment');
console.log('4. Add to .env as MAINNET_PRIVATE_KEY');