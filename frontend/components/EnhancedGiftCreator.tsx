/**
 * Enhanced Gift Creator Component
 *
 * This component automatically determines when to use smart contract backing
 * for gifts based on various criteria like value, complexity, and user preferences.
 */

import React, { useState, useEffect } from 'react';
import {
  useCreateGiftPack,
  useCreateSmartContractGift,
  useAddItemToGiftPack,
  useFinalizeSmartContractGift,
  useValidateGiftForLocking,
  useGiftPack
} from '@/hooks/useGiftPacks';
import { useERC20Balances, useUserNFTs } from '@/hooks/useAssets';
import {
  GiftPack,
  CreateGiftPackData,
  AddItemToGiftPackData,
  ERC20Balance,
  NFTAsset
} from '@/lib/api';
import {
  shouldUseSmartContract,
  validateForSmartContract,
  SmartContractGiftUtils,
  formatGiftStatus
} from '@/lib/smartContractGiftUtils';
import { ethers } from 'ethers';
import { CircularProgress } from '@mui/material';

interface EnhancedGiftCreatorProps {
  walletAddress: string;
  onGiftCreated?: (giftPack: GiftPack) => void;
}

interface SelectedAsset {
  type: 'ERC20' | 'ERC721';
  contract: string;
  symbol?: string;
  name?: string;
  amount?: string;
  tokenId?: string;
  balance?: string;
  logoURI?: string;
}

export default function EnhancedGiftCreator({
  walletAddress,
  onGiftCreated
}: EnhancedGiftCreatorProps) {
  const [giftPack, setGiftPack] = useState<GiftPack | null>(null);
  const [message, setMessage] = useState('');
  const [expiryDays, setExpiryDays] = useState(7);
  const [selectedAssets, setSelectedAssets] = useState<SelectedAsset[]>([]);
  const [shouldUseSmartContractBacking, setShouldUseSmartContractBacking] = useState(false);
  const [smartContractRecommendation, setSmartContractRecommendation] = useState<{
    shouldUse: boolean;
    reason: string;
    isRequired: boolean;
  } | null>(null);


  const createTraditionalGift = useCreateGiftPack();
  const createSmartContractGift = useCreateSmartContractGift();
  const addItemToGiftPack = useAddItemToGiftPack();
  const finalizeSmartContractGift = useFinalizeSmartContractGift();

  const { data: erc20Balances, isLoading: balancesLoading } = useERC20Balances(walletAddress);
  const { data: nfts, isLoading: nftsLoading } = useUserNFTs(walletAddress);
  const { data: giftPackData, isFetching: giftPackFetching } = useGiftPack(giftPack?.id);
  const { data: validationResult, isLoading: validationLoading } = useValidateGiftForLocking(giftPack?.id);

  const smartContractUtils = new SmartContractGiftUtils();


  useEffect(() => {
    if (giftPackData) {
      const recommendation = shouldUseSmartContract(giftPackData);
      setSmartContractRecommendation(recommendation);


      if (recommendation.isRequired) {
        setShouldUseSmartContractBacking(true);
      }
    }
  }, [giftPackData]);


  const handleCreateGift = async () => {
    try {
      const expiryDate = new Date();
      expiryDate.setDate(expiryDate.getDate() + expiryDays);

      const data: CreateGiftPackData = {
        senderAddress: walletAddress,
        message: message || undefined,
        expiry: expiryDate.toISOString(),
      };

      let newGift: GiftPack;
      if (shouldUseSmartContractBacking) {
        newGift = await createSmartContractGift.mutateAsync(data);
      } else {
        newGift = await createTraditionalGift.mutateAsync(data);
      }

      setGiftPack(newGift);
      console.log('Gift pack created:', newGift);
    } catch (error) {
      console.error('Failed to create gift pack:', error);
      alert('Failed to create gift pack. Please try again.');
    }
  };


  const handleAddAsset = async (asset: SelectedAsset) => {
    if (!giftPack) return;

    try {
      const itemData: AddItemToGiftPackData = {
        type: asset.type,
        contract: asset.contract,
        tokenId: asset.tokenId,
        amount: asset.amount,
      };

      await addItemToGiftPack.mutateAsync({
        id: giftPack.id,
        item: itemData,
      });

      console.log('Asset added to gift pack:', asset);
    } catch (error) {
      console.error('Failed to add asset:', error);
      alert('Failed to add asset to gift pack.');
    }
  };


  const handleFinalizeGift = async () => {
    if (!giftPack) return;

    try {
      const result = await finalizeSmartContractGift.mutateAsync({
        id: giftPack.id,
      });

      console.log('Gift finalized:', result);
      alert(`Gift successfully locked on blockchain! Gift ID: ${result.lockResult.giftId}`);

      if (onGiftCreated) {
        onGiftCreated(result.giftPack);
      }
    } catch (error) {
      console.error('Failed to finalize gift:', error);
      alert(`Failed to finalize gift: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };


  const handleSelectERC20 = (balance: ERC20Balance, amount: string) => {
    if (!amount || parseFloat(amount) <= 0) {
      alert('Please enter a valid amount');
      return;
    }

    const asset: SelectedAsset = {
      type: 'ERC20',
      contract: balance.contractAddress,
      symbol: balance.symbol,
      name: balance.name,
      amount: ethers.parseUnits(amount, balance.decimals).toString(),
      balance: balance.balance,
      logoURI: balance.logoURI,
    };

    setSelectedAssets([...selectedAssets, asset]);
  };

  const handleSelectNFT = (nft: NFTAsset) => {
    const asset: SelectedAsset = {
      type: 'ERC721',
      contract: nft.contractAddress,
      name: nft.name,
      tokenId: nft.tokenId,
    };

    setSelectedAssets([...selectedAssets, asset]);
  };


  const handleRemoveAsset = (index: number) => {
    setSelectedAssets(selectedAssets.filter((_, i) => i !== index));
  };


  const getValidationStatus = () => {
    if (!giftPackData) return null;

    const validation = validateForSmartContract(giftPackData);
    return validation;
  };


  const getGasCostEstimate = () => {
    if (!giftPackData || !shouldUseSmartContractBacking) return null;

    return smartContractUtils.estimateGasCost(giftPackData);
  };

  const validationStatus = getValidationStatus();
  const gasCostEstimate = getGasCostEstimate();

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Enhanced Gift Creator</h1>

      {/* Step 1: Basic Gift Information */}
      {!giftPack && (
        <div className="mb-8 p-6 border rounded-lg">
          <h2 className="text-xl font-semibold mb-4">1. Gift Information</h2>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">Message (Optional)</label>
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Enter a message for the recipient..."
                className="w-full p-3 border rounded-lg resize-none"
                rows={3}
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Expiry (Days from now)</label>
              <input
                type="number"
                value={expiryDays}
                onChange={(e) => setExpiryDays(parseInt(e.target.value) || 7)}
                min="1"
                max="365"
                className="w-full p-3 border rounded-lg"
              />
            </div>

            <div className="p-4 bg-gray-50 rounded-lg">
              <h3 className="font-semibold mb-2">Smart Contract Backing</h3>
              <div className="flex items-center space-x-3">
                <input
                  type="checkbox"
                  id="smartContract"
                  checked={shouldUseSmartContractBacking}
                  onChange={(e) => setShouldUseSmartContractBacking(e.target.checked)}
                  className="rounded"
                />
                <label htmlFor="smartContract" className="text-sm">
                  Use smart contract for enhanced security
                </label>
              </div>
              <p className="text-sm text-gray-600 mt-2">
                Smart contracts provide enhanced security and automated execution but require gas fees.
              </p>
            </div>

            <button
              onClick={handleCreateGift}
              disabled={createTraditionalGift.isPending || createSmartContractGift.isPending}
              className="w-full py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 flex items-center justify-center"
            >
              {(createTraditionalGift.isPending || createSmartContractGift.isPending) && (
                <CircularProgress size={16} sx={{ mr: 1 }} />
              )}
              {(createTraditionalGift.isPending || createSmartContractGift.isPending)
                ? 'Creating...'
                : 'Create Gift Pack'}
            </button>
          </div>
        </div>
      )}

      {/* Step 2: Add Assets */}
      {giftPack && (
        <div className="mb-8 p-6 border rounded-lg">
          <h2 className="text-xl font-semibold mb-4">2. Add Assets to Gift</h2>

          {/* Smart Contract Recommendation */}
          {smartContractRecommendation && (
            <div className={`p-4 rounded-lg mb-4 ${
              smartContractRecommendation.isRequired
                ? 'bg-red-50 border-red-200'
                : smartContractRecommendation.shouldUse
                  ? 'bg-yellow-50 border-yellow-200'
                  : 'bg-green-50 border-green-200'
            }`}>
              <h3 className="font-semibold mb-2">
                {smartContractRecommendation.isRequired ? '⚠️ Smart Contract Required' :
                 smartContractRecommendation.shouldUse ? '💡 Smart Contract Recommended' :
                 '✅ Traditional Gift Suitable'}
              </h3>
              <p className="text-sm">{smartContractRecommendation.reason}</p>
            </div>
          )}

          {/* Current Gift Pack Status */}
          <div className="p-4 bg-gray-50 rounded-lg mb-4">
            <h3 className="font-semibold mb-2">Gift Pack Status</h3>
            <p><strong>ID:</strong> {giftPack.id}</p>
            <p className="flex items-center gap-2">
              <strong>Status:</strong> {formatGiftStatus(giftPack).status}
              {giftPackFetching && <CircularProgress size={12} />}
            </p>
            <p><strong>Items:</strong> {giftPackData?.items.length || 0}</p>
            <p><strong>Type:</strong> {shouldUseSmartContractBacking ? 'Smart Contract' : 'Traditional'}</p>
          </div>

          {/* Validation Status */}
          {shouldUseSmartContractBacking && (
            <>
              {validationLoading ? (
                <div className="p-4 rounded-lg mb-4 bg-gray-50 border border-gray-200 flex items-center gap-2 text-sm text-gray-700">
                  <CircularProgress size={16} /> Validating gift for locking...
                </div>
              ) : (
                validationStatus && (
                  <div className={`p-4 rounded-lg mb-4 ${
                    validationStatus.isValid ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'
                  }`}>
                    <h3 className="font-semibold mb-2">
                      {validationStatus.isValid ? '✅ Validation Passed' : '❌ Validation Failed'}
                    </h3>
                    {validationStatus.errors.length > 0 && (
                      <ul className="text-sm text-red-600 mb-2">
                        {validationStatus.errors.map((error, index) => (
                          <li key={index}>• {error}</li>
                        ))}
                      </ul>
                    )}
                    {validationStatus.warnings.length > 0 && (
                      <ul className="text-sm text-yellow-600">
                        {validationStatus.warnings.map((warning, index) => (
                          <li key={index}>• {warning}</li>
                        ))}
                      </ul>
                    )}
                  </div>
                )
              )}
            </>
          )}

          {/* Gas Cost Estimate */}
          {gasCostEstimate && (
            <div className="p-4 bg-blue-50 border-blue-200 rounded-lg mb-4">
              <h3 className="font-semibold mb-2">⛽ Estimated Gas Cost</h3>
              <p className="text-sm">
                <strong>Gas:</strong> {gasCostEstimate.estimatedGas.toLocaleString()} units<br/>
                <strong>Cost:</strong> ~{gasCostEstimate.costInEth} ETH
                {gasCostEstimate.costInUsd && ` (~$${gasCostEstimate.costInUsd})`}
              </p>
            </div>
          )}

          {/* Selected Assets */}
          {selectedAssets.length > 0 && (
            <div className="mb-4">
              <h3 className="font-semibold mb-2">Selected Assets</h3>
              <div className="space-y-2">
                {selectedAssets.map((asset, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-gray-100 rounded-lg">
                    <div className="flex items-center space-x-3">
                      {asset.logoURI && (
                        <img src={asset.logoURI} alt={asset.symbol} className="w-6 h-6 rounded-full" />
                      )}
                      <span className="font-medium">
                        {asset.type === 'ERC20'
                          ? `${asset.amount && ethers.formatUnits(asset.amount, 18)} ${asset.symbol}`
                          : `${asset.name} #${asset.tokenId}`
                        }
                      </span>
                      <span className="text-sm text-gray-500">{asset.type}</span>
                    </div>
                    <div className="flex space-x-2">
                      <button
                        onClick={() => handleAddAsset(asset)}
                        disabled={addItemToGiftPack.isPending}
                        className="px-3 py-1 bg-green-500 text-white text-sm rounded hover:bg-green-600 disabled:opacity-50"
                      >
                        Add
                      </button>
                      <button
                        onClick={() => handleRemoveAsset(index)}
                        className="px-3 py-1 bg-red-500 text-white text-sm rounded hover:bg-red-600"
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Asset Selection */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* ERC20 Tokens */}
            <div>
              <h3 className="font-semibold mb-3">ERC20 Tokens</h3>
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {balancesLoading ? (
                  <div className="flex items-center gap-2 text-sm text-gray-600"><CircularProgress size={16} /> Loading tokens...</div>
                ) : (erc20Balances && erc20Balances.length > 0 ? (
                  erc20Balances.map((balance) => (
                    <ERC20AssetSelector
                      key={balance.contractAddress}
                      balance={balance}
                      onSelect={handleSelectERC20}
                    />
                  ))
                ) : (
                  <div className="text-sm text-gray-500">No tokens found.</div>
                ))}
              </div>
            </div>

            {/* NFTs */}
            <div>
              <h3 className="font-semibold mb-3">NFTs</h3>
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {nftsLoading ? (
                  <div className="flex items-center gap-2 text-sm text-gray-600"><CircularProgress size={16} /> Loading NFTs...</div>
                ) : (nfts && nfts.length > 0 ? (
                  nfts.map((nft: NFTAsset) => (
                    <NFTAssetSelector
                      key={`${nft.contractAddress}-${nft.tokenId}`}
                      nft={nft}
                      onSelect={handleSelectNFT}
                    />
                  ))
                ) : (
                  <div className="text-sm text-gray-500">No NFTs found.</div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Step 3: Finalize Gift */}
      {giftPack && shouldUseSmartContractBacking && (
        <div className="p-6 border rounded-lg">
          <h2 className="text-xl font-semibold mb-4">3. Finalize Smart Contract Gift</h2>

          <div className="space-y-4">
            <button
              onClick={handleFinalizeGift}
              disabled={
                !validationStatus?.isValid ||
                finalizeSmartContractGift.isPending
              }
              className="w-full py-3 bg-green-500 text-white rounded-lg hover:bg-green-600 disabled:opacity-50 flex items-center justify-center"
            >
              {finalizeSmartContractGift.isPending && (
                <CircularProgress size={16} sx={{ mr: 1 }} />
              )}
              {finalizeSmartContractGift.isPending
                ? 'Finalizing...'
                : 'Lock Gift on Blockchain'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}


function ERC20AssetSelector({
  balance,
  onSelect
}: {
  balance: ERC20Balance;
  onSelect: (balance: ERC20Balance, amount: string) => void;
}) {
  const [amount, setAmount] = useState('');

  return (
    <div className="p-3 border rounded-lg">
      <div className="flex items-center space-x-3 mb-2">
        {balance.logoURI && (
          <img src={balance.logoURI} alt={balance.symbol} className="w-6 h-6 rounded-full" />
        )}
        <div>
          <div className="font-medium">{balance.symbol}</div>
          <div className="text-sm text-gray-500">
            Balance: {ethers.formatUnits(balance.balance, balance.decimals)}
          </div>
        </div>
      </div>
      <div className="flex space-x-2">
        <input
          type="number"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          placeholder="Amount"
          className="flex-1 p-2 text-sm border rounded"
          step="any"
        />
        <button
          onClick={() => onSelect(balance, amount)}
          disabled={!amount}
          className="px-3 py-2 bg-blue-500 text-white text-sm rounded hover:bg-blue-600 disabled:opacity-50"
        >
          Select
        </button>
      </div>
    </div>
  );
}

function NFTAssetSelector({
  nft,
  onSelect
}: {
  nft: NFTAsset;
  onSelect: (nft: NFTAsset) => void;
}) {
  return (
    <div className="p-3 border rounded-lg">
      <div className="flex items-center space-x-3">
        {nft.image && (
          <img src={nft.image} alt={nft.name} className="w-12 h-12 rounded object-cover" />
        )}
        <div className="flex-1">
          <div className="font-medium">{nft.name}</div>
          <div className="text-sm text-gray-500">Token ID: {nft.tokenId}</div>
          {nft.collection?.name && (
            <div className="text-sm text-gray-500">Collection: {nft.collection.name}</div>
          )}
        </div>
        <button
          onClick={() => onSelect(nft)}
          className="px-3 py-2 bg-blue-500 text-white text-sm rounded hover:bg-blue-600"
        >
          Select
        </button>
      </div>
    </div>
  );
}

export { EnhancedGiftCreator };
