/**
 * Smart Contract Gift Creation Component
 *
 * This component handles the complete flow of creating a gift pack that is backed by smart contracts.
 * It includes draft creation, item addition, and blockchain deployment.
 */

import React, { useState } from 'react';
import { ethers } from 'ethers';
import {
  useCreateGiftPack,
  useAddItemToGiftPack,
  useLockGiftPack,
  useGiftPack,
  useOnChainGiftStatus
} from '@/hooks/useGiftPacks';
import { useERC20Balances, useUserNFTs } from '@/hooks/useAssets';
import { CreateGiftPackData, AddItemToGiftPackData } from '@/lib/api';

interface SmartContractGiftCreatorProps {
  walletAddress: string;
}

export default function SmartContractGiftCreator({ walletAddress }: SmartContractGiftCreatorProps) {
  const [giftPackId, setGiftPackId] = useState<string | null>(null);
  const [message, setMessage] = useState('');
  const [onChainGiftId, setOnChainGiftId] = useState<number | null>(null);


  const createGiftPack = useCreateGiftPack();
  const addItem = useAddItemToGiftPack();
  const lockGiftPack = useLockGiftPack();
  const { data: giftPack } = useGiftPack(giftPackId || undefined);
  const { data: erc20Balances } = useERC20Balances(walletAddress);
  const { data: nfts } = useUserNFTs(walletAddress);
  const { data: onChainStatus } = useOnChainGiftStatus(onChainGiftId || undefined);


  const handleCreateDraft = async () => {
    try {
      const data: CreateGiftPackData = {
        senderAddress: walletAddress,
        message,
        expiry: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      };
      const newPack = await createGiftPack.mutateAsync(data);
      setGiftPackId(newPack.id);
    } catch (error) {
      console.error('Failed to create gift pack:', error);
    }
  };


  const handleAddToken = async (contractAddress: string, amount: string) => {
    if (!giftPackId) return;

    try {
      const itemData: AddItemToGiftPackData = {
        type: 'ERC20',
        contract: contractAddress,
        amount,
      };
      await addItem.mutateAsync({ id: giftPackId, item: itemData });
    } catch (error) {
      console.error('Failed to add token:', error);
    }
  };


  const handleAddNFT = async (contractAddress: string, tokenId: string) => {
    if (!giftPackId) return;

    try {
      const itemData: AddItemToGiftPackData = {
        type: 'ERC721',
        contract: contractAddress,
        tokenId,
      };
      await addItem.mutateAsync({ id: giftPackId, item: itemData });
    } catch (error) {
      console.error('Failed to add NFT:', error);
    }
  };


  const handleLockOnChain = async () => {
    if (!giftPackId) return;

    try {
      const result = await lockGiftPack.mutateAsync({ id: giftPackId });
      
      // Get user's wallet
      if (!window.ethereum) {
        throw new Error('MetaMask not installed');
      }

      const accounts = await window.ethereum.request({ method: 'eth_accounts' });
      if (!accounts || accounts.length === 0) {
        throw new Error('No wallet connected');
      }

      const userAddress = accounts[0];
      const web3Provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await web3Provider.getSigner();

      console.log('[Lock] Executing transactions for gift pack:', result.giftCode);
      console.log('[Lock] Number of transactions:', result.transactions.length);

      const transactionHashes: string[] = [];

      // Execute each transaction
      for (let i = 0; i < result.transactions.length; i++) {
        const tx = result.transactions[i];
        console.log(`[Lock] Executing transaction ${i + 1}/${result.transactions.length}: ${tx.description}`);

        const txData = {
          to: tx.to,
          data: tx.data,
          value: tx.value === '0' ? '0' : BigInt(tx.value),
        };

        const txResponse = await signer.sendTransaction(txData);
        console.log(`[Lock] Transaction ${i + 1} sent:`, txResponse.hash);
        transactionHashes.push(txResponse.hash);

        // Wait for transaction to be mined
        const receipt = await txResponse.wait();
        if (!receipt) {
          throw new Error(`Transaction ${i + 1} failed to be mined`);
        }
        console.log(`[Lock] Transaction ${i + 1} mined:`, receipt.hash);
      }

      alert(`Gift pack locked successfully! Transaction hashes:\n${transactionHashes.join('\n')}`);
    } catch (error) {
      console.error('Failed to lock gift pack on blockchain:', error);
      alert(`Error: ${error instanceof Error ? error.message : 'Unknown error occurred'}`);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <h1 className="text-3xl font-bold">Smart Contract Gift Creator</h1>

      {/* Step 1: Create Draft */}
      {!giftPackId && (
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-xl font-semibold mb-4">Step 1: Create Gift Pack Draft</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">Message (Optional)</label>
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-md"
                placeholder="Add a personal message..."
                rows={3}
              />
            </div>
            <button
              onClick={handleCreateDraft}
              disabled={createGiftPack.isPending}
              className="bg-blue-500 text-white px-6 py-2 rounded-md hover:bg-blue-600 disabled:opacity-50"
            >
              {createGiftPack.isPending ? 'Creating...' : 'Create Draft'}
            </button>
          </div>
        </div>
      )}

      {/* Step 2: Add Items */}
      {giftPackId && giftPack?.status === 'DRAFT' && (
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-xl font-semibold mb-4">Step 2: Add Items to Gift Pack</h2>

          {/* Current Items */}
          {giftPack?.items && giftPack.items.length > 0 && (
            <div className="mb-6">
              <h3 className="text-lg font-medium mb-2">Current Items:</h3>
              <ul className="space-y-2">
                {giftPack.items.map((item) => (
                  <li key={item.id} className="p-3 bg-gray-50 rounded-md">
                    <div className="font-medium">{item.type}</div>
                    <div className="text-sm text-gray-600">Contract: {item.contract}</div>
                    {item.tokenId && <div className="text-sm text-gray-600">Token ID: {item.tokenId}</div>}
                    {item.amount && <div className="text-sm text-gray-600">Amount: {item.amount}</div>}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Add ERC20 Tokens */}
          <div className="mb-6">
            <h3 className="text-lg font-medium mb-2">Available ERC20 Tokens:</h3>
            {erc20Balances && erc20Balances.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {erc20Balances.map((token) => (
                  <div key={token.contractAddress} className="p-3 border border-gray-200 rounded-md">
                    <div className="font-medium">{token.symbol}</div>
                    <div className="text-sm text-gray-600">Balance: {token.balance}</div>
                    <button
                      onClick={() => handleAddToken(token.contractAddress, '1000000')}
                      disabled={addItem.isPending}
                      className="mt-2 bg-green-500 text-white px-4 py-1 rounded text-sm hover:bg-green-600"
                    >
                      Add Token
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500">No ERC20 tokens found in your wallet.</p>
            )}
          </div>

          {/* Add NFTs */}
          <div className="mb-6">
            <h3 className="text-lg font-medium mb-2">Available NFTs:</h3>
            {nfts && nfts.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {nfts.map((nft) => (
                  <div key={`${nft.contractAddress}-${nft.tokenId}`} className="p-3 border border-gray-200 rounded-md">
                    {nft.image && (
                      <img src={nft.image} alt={nft.name} className="w-full h-32 object-cover rounded mb-2" />
                    )}
                    <div className="font-medium">{nft.name || `Token #${nft.tokenId}`}</div>
                    <div className="text-sm text-gray-600">ID: {nft.tokenId}</div>
                    <button
                      onClick={() => handleAddNFT(nft.contractAddress, nft.tokenId)}
                      disabled={addItem.isPending}
                      className="mt-2 bg-purple-500 text-white px-4 py-1 rounded text-sm hover:bg-purple-600"
                    >
                      Add NFT
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500">No NFTs found in your wallet.</p>
            )}
          </div>
        </div>
      )}

      {/* Step 3: Lock on Blockchain */}
      {giftPackId && giftPack?.status === 'DRAFT' && giftPack?.items.length > 0 && (
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-xl font-semibold mb-4">Step 3: Lock Gift on Blockchain</h2>
          <div className="space-y-4">
            <button
              onClick={handleLockOnChain}
              disabled={lockGiftPack.isPending}
              className="bg-red-500 text-white px-6 py-2 rounded-md hover:bg-red-600 disabled:opacity-50"
            >
              {lockGiftPack.isPending ? 'Locking on Blockchain...' : 'Lock Gift Pack on Blockchain'}
            </button>
          </div>
        </div>
      )}

      {/* Step 4: Blockchain Status */}
      {onChainGiftId && onChainStatus && (
        <div className="bg-green-50 p-6 rounded-lg shadow-md">
          <h2 className="text-xl font-semibold mb-4">🎉 Gift Successfully Locked on Blockchain!</h2>
          <div className="space-y-2">
            <div><strong>OnChain Gift ID:</strong> {onChainStatus.giftId}</div>
            <div><strong>Sender:</strong> {onChainStatus.sender}</div>
            <div><strong>Recipient:</strong> {
              (!onChainStatus.recipient || onChainStatus.recipient === '0x0000000000000000000000000000000000000000')
                ? '🌍 Anyone can claim'
                : onChainStatus.recipient
            }</div>
            <div><strong>Token Address:</strong> {onChainStatus.tokenAddress}</div>
            <div><strong>Amount:</strong> {onChainStatus.amount}</div>
            <div><strong>Expiry:</strong> {new Date(onChainStatus.expiryTimestamp * 1000).toLocaleString()}</div>
            <div><strong>Status:</strong> {onChainStatus.claimed ? 'Claimed' : 'Available for Claim'}</div>
          </div>
        </div>
      )}

      {/* Loading States */}
      {(createGiftPack.isPending || addItem.isPending || lockGiftPack.isPending) && (
        <div className="bg-yellow-50 p-4 rounded-md">
          <div className="text-yellow-700">Processing blockchain transaction...</div>
        </div>
      )}

      {/* Error States */}
      {(createGiftPack.error || addItem.error || lockGiftPack.error) && (
        <div className="bg-red-50 p-4 rounded-md">
          <div className="text-red-700">
            Error: {createGiftPack.error?.message || addItem.error?.message || (lockGiftPack.error as any)?.message}
          </div>
        </div>
      )}
    </div>
  );
}
