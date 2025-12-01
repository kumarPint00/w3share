/**
 * Smart Contract Gift Handler Component
 *
 * This component demonstrates how to handle the condition where created gifts
 * are backed up with smart contracts. It provides a complete flow from creation
 * to claiming with proper validation and error handling.
 */

'use client';
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  useCreateSmartContractGift,
  useFinalizeSmartContractGift,
  useValidateGiftForLocking,
  useGiftPackWithSmartContractStatus,
  useUserGiftPacksWithSmartContractInfo,
  useClaimSmartContractGift,
  useIsGiftPackSmartContractBacked
} from '@/hooks/useGiftPacks';
import { useERC20Balances, useUserNFTs } from '@/hooks/useAssets';
import { GiftPack, CreateGiftPackData, AddItemToGiftPackData, ClaimResponse } from '@/lib/api';
import { CircularProgress } from '@mui/material';
import WETHUnwrapHelper from './WETHUnwrapHelper';

interface SmartContractGiftHandlerProps {
  walletAddress: string;
  userRole: 'creator';
}

export default function SmartContractGiftHandler({
  walletAddress,
  userRole
}: SmartContractGiftHandlerProps) {
  const router = useRouter();
  const [selectedGiftPack, setSelectedGiftPack] = useState<GiftPack | null>(null);
  const [isCreatingGift, setIsCreatingGift] = useState(false);
  const [claimGiftId, setClaimGiftId] = useState<number | null>(null);
  const [claimResponse, setClaimResponse] = useState<ClaimResponse | null>(null);
  const [isNavigating, setIsNavigating] = useState(false);


  const createSmartContractGift = useCreateSmartContractGift();
  const finalizeSmartContractGift = useFinalizeSmartContractGift();
  const claimSmartContractGift = useClaimSmartContractGift();

  const { data: giftPacksWithSmartContract, isLoading: listLoading } = useUserGiftPacksWithSmartContractInfo(walletAddress);
  const { data: validationResult, isLoading: validationLoading } = useValidateGiftForLocking(selectedGiftPack?.id);
  const { data: giftPackWithStatus, isLoading: statusLoading } = useGiftPackWithSmartContractStatus(selectedGiftPack?.id);

  const isSmartContractBacked = useIsGiftPackSmartContractBacked(selectedGiftPack || undefined);

  const handleCreateSmartContractGift = async () => {
    setIsCreatingGift(true);
    try {
      const data: CreateGiftPackData = {
        senderAddress: walletAddress,
        message: 'This is a smart contract-backed gift',
        expiry: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      };

      const newGift = await createSmartContractGift.mutateAsync(data);
      setSelectedGiftPack(newGift);
      console.log('Smart contract gift created:', newGift);
    } catch (error) {
      console.error('Failed to create smart contract gift:', error);
      alert('Failed to create gift. Please try again.');
    } finally {
      setIsCreatingGift(false);
    }
  };


  const handleFinalizeGift = async () => {
    if (!selectedGiftPack) return;
    
    setIsNavigating(true);
    try {
      const result = await finalizeSmartContractGift.mutateAsync({
        id: selectedGiftPack.id,
      });
      setSelectedGiftPack(result.giftPack);      
      router.push(`/gift/create/success?giftId=${result.lockResult.giftId}`);      
    } catch (error) {
      console.error('Failed to finalize gift:', error);
      alert(`Failed to lock gift on blockchain: ${error instanceof Error ? error.message : 'Unknown error'}`);
      setIsNavigating(false);
    }
  };


  const handleClaimGift = async () => {
    if (!claimGiftId) return;

    try {
      const result = await claimSmartContractGift.mutateAsync({
        giftId: claimGiftId,
        claimer: walletAddress,
      });

      console.log('Gift claim data received:', result);
      setClaimResponse(result);

      let message = `Claim data received! Please execute the transaction in your wallet.`;

      if (result.unwrapInfo?.shouldUnwrap) {
        message += `\n\n⚠️ IMPORTANT: This gift contains WETH. See unwrap instructions below.`;
      }

      alert(message);
    } catch (error) {
      console.error('Failed to get claim data:', error);
      alert(`Failed to get claim data: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };


  const canLockGift = (giftPack: GiftPack): boolean => {
    return giftPack.status === 'DRAFT' &&
           giftPack.items.length > 0 &&
           new Date(giftPack.expiry) > new Date();
  };


  const getGiftPackStatusDisplay = (giftPack: GiftPack, onChainStatus?: any) => {
    if (isSmartContractBacked) {
      if (onChainStatus) {
        return `Smart Contract Backed - ${onChainStatus.claimed ? 'CLAIMED' : 'LOCKED'} (OnChain ID: ${onChainStatus.giftId})`;
      }
      return `Smart Contract Backed - ${giftPack.status}`;
    }
    return `Traditional Gift - ${giftPack.status}`;
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">
        Smart Contract Gift Handler - {userRole === 'creator' ? 'Creator' : 'Recipient'} View
      </h1>

      {userRole === 'creator' && (
        <div className="mb-8">
          <h2 className="text-xl font-semibold mb-4">Create Smart Contract-Backed Gift</h2>

          <button
            onClick={handleCreateSmartContractGift}
            disabled={isCreatingGift || createSmartContractGift.isPending}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50 inline-flex items-center gap-2"
          >
            {(isCreatingGift || createSmartContractGift.isPending) && <CircularProgress size={16} />}
            {isCreatingGift ? 'Creating...' : 'Create Smart Contract Gift'}
          </button>

          {selectedGiftPack && (
            <div className="mt-4 p-4 border rounded">
              <h3 className="font-semibold">Selected Gift Pack</h3>
              <p>ID: {selectedGiftPack.id}</p>
              <p className="flex items-center gap-2">Status: {getGiftPackStatusDisplay(selectedGiftPack, giftPackWithStatus?.onChainStatus)} {statusLoading && <CircularProgress size={12} />}</p>
              <p>Items: {selectedGiftPack.items.length}</p>
              <p>Expiry: {new Date(selectedGiftPack.expiry).toLocaleDateString()}</p>

              {validationLoading ? (
                <div className="mt-2 text-sm text-gray-600 flex items-center gap-2"><CircularProgress size={14} /> Validating...</div>
              ) : (
                validationResult && (
                  <div className="mt-2">
                    <p className={`font-semibold ${validationResult.isValid ? 'text-green-600' : 'text-red-600'}`}>
                      Validation: {validationResult.isValid ? 'Valid for locking' : 'Invalid'}
                    </p>
                    {validationResult.errors.length > 0 && (
                      <ul className="text-red-600 text-sm">
                        {validationResult.errors.map((error, index) => (
                          <li key={index}>• {error}</li>
                        ))}
                      </ul>
                    )}
                  </div>
                )
              )}

              {canLockGift(selectedGiftPack) && validationResult?.isValid && (
                <div className="mt-4">
                  <h4 className="font-semibold mb-2">Lock Gift on Blockchain</h4>
                  <button
                    onClick={handleFinalizeGift}
                    disabled={finalizeSmartContractGift.isPending || isNavigating}
                    className="w-full px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 inline-flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {(finalizeSmartContractGift.isPending || isNavigating) && <CircularProgress size={16} />}
                    {finalizeSmartContractGift.isPending 
                      ? 'Locking...' 
                      : isNavigating 
                        ? 'Navigating...' 
                        : 'Lock Gift'}
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      )}


      <div>
        <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
          Your Gift Packs {listLoading && <CircularProgress size={16} />}
        </h2>

        {giftPacksWithSmartContract && giftPacksWithSmartContract.length > 0 ? (
          <div className="space-y-4">
            {giftPacksWithSmartContract.map(({ giftPack, onChainStatus }) => (
              <div
                key={giftPack.id}
                className={`p-4 border rounded cursor-pointer hover:bg-gray-50 ${
                  selectedGiftPack?.id === giftPack.id ? 'border-blue-500 bg-blue-50' : ''
                }`}
                onClick={() => setSelectedGiftPack(giftPack)}
              >
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-semibold">{giftPack.message || 'Untitled Gift'}</h3>
                    <p className="text-sm text-gray-600">ID: {giftPack.id}</p>
                    <p className="text-sm">Status: {getGiftPackStatusDisplay(giftPack, onChainStatus)}</p>
                    <p className="text-sm">Items: {giftPack.items.length}</p>
                    <p className="text-sm">Expiry: {new Date(giftPack.expiry).toLocaleDateString()}</p>
                  </div>

                  <div className="text-right">
                    {isSmartContractBacked && onChainStatus && (
                      <div className="text-sm">
                        <p>OnChain ID: {onChainStatus.giftId}</p>
                        <p>Sender: {onChainStatus.sender.slice(0, 6)}...{onChainStatus.sender.slice(-4)}</p>
                        <p>Anyone with the code can claim</p>
                        <p className={`font-semibold ${onChainStatus.claimed ? 'text-green-600' : 'text-orange-600'}`}>
                          {onChainStatus.claimed ? 'CLAIMED' : 'AVAILABLE'}
                        </p>
                      </div>
                    )}

                    <div className="mt-2">
                      <span className={`px-2 py-1 rounded text-xs ${
                        isSmartContractBacked
                          ? 'bg-blue-100 text-blue-800'
                          : 'bg-gray-100 text-gray-800'
                      }`}>
                        {isSmartContractBacked ? 'Smart Contract' : 'Traditional'}
                      </span>
                    </div>
                  </div>
                </div>

                {giftPack.items.length > 0 && (
                  <div className="mt-3">
                    <h4 className="text-sm font-semibold">Items:</h4>
                    <ul className="text-sm text-gray-600">
                      {giftPack.items.map((item, index) => (
                        <li key={item.id}>
                          • {item.type} - {item.contract.slice(0, 6)}...{item.contract.slice(-4)}
                          {item.amount && ` (${item.amount})`}
                          {item.tokenId && ` #${item.tokenId}`}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <p className="text-gray-500">{listLoading ? 'Loading your gift packs...' : 'No gift packs found.'}</p>
        )}
      </div>

      {/* Claim Gift Section */}
      <div className="bg-white p-6 rounded-lg shadow-md mt-6">
        <h2 className="text-xl font-semibold mb-4">Claim Gift by ID</h2>
        <div className="space-y-4">
          <div className="flex gap-4 items-end">
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Gift ID
              </label>
              <input
                type="number"
                value={claimGiftId || ''}
                onChange={(e) => setClaimGiftId(e.target.value ? Number(e.target.value) : null)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
                placeholder="Enter gift ID to claim"
              />
            </div>
            <button
              onClick={handleClaimGift}
              disabled={!claimGiftId || claimSmartContractGift.isPending}
              className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
            >
              {claimSmartContractGift.isPending ? 'Getting Claim Data...' : 'Get Claim Data'}
            </button>
          </div>

          {claimResponse && claimResponse.unwrapInfo?.shouldUnwrap && (
            <WETHUnwrapHelper
              unwrapInfo={claimResponse.unwrapInfo}
              onUnwrapClick={() => {

                console.log('Unwrap clicked', claimResponse.unwrapInfo);
                alert('Please execute the WETH unwrap transaction manually in your wallet using the contract details provided.');
              }}
            />
          )}
        </div>
      </div>
    </div>
  );
}

export { SmartContractGiftHandler };
