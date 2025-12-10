
const { ethers } = require('ethers');

async function checkWallet() {
  const privateKey = '';
  const provider = new ethers.JsonRpcProvider('https://eth-mainnet.g.alchemy.com/v2/gGyT5UVlni23o2468AIZN');
  const wallet = new ethers.Wallet(privateKey, provider);
  
  console.log('Wallet Address:', wallet.address);
  const balance = await provider.getBalance(wallet.address);
  console.log('ETH Balance:', ethers.formatEther(balance));
}

checkWallet().catch(console.error);

