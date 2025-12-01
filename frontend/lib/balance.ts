import { ethers, Contract } from 'ethers';
import erc20Abi from './erc20Abi.json';
export async function getEthBalance(
  provider: ethers.BrowserProvider,
  address: string
) {
  const wei = await provider.getBalance(address);
  return Number(ethers.formatEther(wei));
}

export async function getErc20Balance(
  provider: ethers.BrowserProvider,
  tokenAddress: string,
  wallet: string
) {
  const c = new Contract(tokenAddress, erc20Abi, provider);
  const bal = await c.balanceOf(wallet);
  const decimals = await c.decimals();
  return Number(bal) / 10 ** decimals;
}
