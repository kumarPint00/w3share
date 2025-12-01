/**
 * Format a timestamp into a human-readable date and time
 */
export const formatDate = (timestamp: number): string => {
  return new Date(timestamp * 1000).toLocaleString();
};

/**
 * Format seconds into a human-readable string
 */
export const formatTimeRemaining = (seconds: number): string => {
  if (seconds <= 0) return 'Contract inactive';
  
  const days = Math.floor(seconds / 86400);
  const hours = Math.floor((seconds % 86400) / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  
  let result = '';
  if (days > 0) result += `${days} day${days !== 1 ? 's' : ''} `;
  if (hours > 0) result += `${hours} hour${hours !== 1 ? 's' : ''} `;
  if (minutes > 0) result += `${minutes} minute${minutes !== 1 ? 's' : ''} `;
  
  return result.trim() || 'Less than a minute';
};

/**
 * Truncate an Ethereum address for display
 */
export const shortenAddress = (address: string): string => {
  return `${address.substring(0, 6)}...${address.substring(address.length - 4)}`;
};

/**
 * Format a transaction hash with link to Etherscan
 */
export const getEtherscanLink = (hash: string, network: string = 'sepolia'): string => {
  return `https://${network === 'mainnet' ? '' : network + '.'}etherscan.io/tx/${hash}`;
};
