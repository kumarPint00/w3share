'use client';

import React, { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Typography,
  Card,
  CardContent,
  Button,
  Grid,
  Chip,
  Alert,
  Stepper,
  Step,
  StepLabel,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  ListItemSecondaryAction,
  IconButton,
  Tooltip,
  Paper,
  styled,
  alpha,
} from '@mui/material';
import {
  Add,
  Delete,
  AccountBalanceWallet,
  Token,
  Image as ImageIcon,
  Lock,
  Share,
  ContentCopy,
  CheckCircle,
  Warning,
  Info,
} from '@mui/icons-material';
import Image from 'next/image';
import { ethers } from 'ethers';
import { useRouter } from 'next/navigation';
import { useWallet } from '@/context/WalletContext';
import { useERC20Balances, useUserNFTs } from '@/hooks/useAssets';
import {
  useCreateSmartContractGift,
  useAddItemToGiftPack,
  useFinalizeSmartContractGift,
  useValidateGiftForLocking,
  useGiftPack,
} from '@/hooks/useGiftPacks';
import {
  GiftPack,
  CreateGiftPackData,
  AddItemToGiftPackData,
  ERC20Balance,
  NFTAsset,
} from '@/lib/api';
import { smartContractGiftUtils } from '@/lib/smartContractGiftUtils';


const StyledCard = styled(Card)(({ theme }) => ({
  background: `linear-gradient(135deg,
    ${alpha(theme.palette.primary.main, 0.02)} 0%,
    ${alpha(theme.palette.secondary.main, 0.01)} 100%)`,
  border: `1px solid ${alpha(theme.palette.primary.main, 0.1)}`,
  borderRadius: 16,
  transition: 'all 0.3s ease',
  '&:hover': {
    transform: 'translateY(-4px)',
    boxShadow: `0 12px 40px ${alpha(theme.palette.primary.main, 0.15)}`,
  },
}));

const GradientButton = styled(Button)(({ theme }) => ({
  background: theme.palette.primary.main,
  color: 'white',
  fontWeight: 600,
  borderRadius: 12,
  padding: '12px 32px',
  textTransform: 'none',
  fontSize: '1.1rem',
  '&:hover': {
    background: theme.palette.primary.dark,
    transform: 'translateY(-2px)',
    boxShadow: `0 8px 25px ${alpha(theme.palette.primary.main, 0.3)}`,
  },
  '&:disabled': {
    background: 'rgba(0, 0, 0, 0.12)',
    color: 'rgba(0, 0, 0, 0.26)',
    transform: 'none',
  },
  transition: 'all 0.3s ease',
}));

interface SelectedAsset {
  type: 'ERC20' | 'ERC721';
  contract: string;
  symbol?: string;
  name?: string;
  amount?: string;
  tokenId?: string;
  image?: string;
  decimals?: number;
}

export default function EnhancedGiftCreationPage() {
  const router = useRouter();
  const { provider, address, connect } = useWallet();


  const [currentStep, setCurrentStep] = useState(0);
  const [giftPack, setGiftPack] = useState<GiftPack | null>(null);
  const [giftMessage, setGiftMessage] = useState('');
  const [expiryDays, setExpiryDays] = useState(7);
  const [selectedAssets, setSelectedAssets] = useState<SelectedAsset[]>([]);


  const [showAssetDialog, setShowAssetDialog] = useState(false);
  const [showShareDialog, setShowShareDialog] = useState(false);
  const [assetType, setAssetType] = useState<'ERC20' | 'ERC721'>('ERC20');
  const [selectedToken, setSelectedToken] = useState<ERC20Balance | null>(null);
  const [selectedNFT, setSelectedNFT] = useState<NFTAsset | null>(null);
  const [tokenAmount, setTokenAmount] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [shareUrl, setShareUrl] = useState('');


  const { data: erc20Balances, isLoading: balancesLoading } = useERC20Balances(address || undefined);
  const { data: nfts, isLoading: nftsLoading } = useUserNFTs(address || undefined);
  const { data: giftPackData } = useGiftPack(giftPack?.id);
  const { data: validationResult } = useValidateGiftForLocking(giftPack?.id);


  const createGift = useCreateSmartContractGift();
  const addItem = useAddItemToGiftPack();
  const finalizeGift = useFinalizeSmartContractGift();

  const steps = [
    'Connect Wallet',
    'Create Gift Pack',
    'Add Assets',
    'Lock & Share'
  ];


  useEffect(() => {
    if (address && currentStep === 0) {
      setCurrentStep(1);
    }
  }, [address, currentStep]);


  useEffect(() => {
    if (giftPackData) {
      setGiftPack(giftPackData);
    }
  }, [giftPackData]);

  const handleConnectWallet = async () => {
    try {
      setError(null);
      await connect();
    } catch (error: any) {
      setError('Failed to connect wallet. Please try again.');
    }
  };

  const handleCreateGift = async () => {
    if (!address) return;

    try {
      setError(null);
      const expiryDate = new Date();
      expiryDate.setDate(expiryDate.getDate() + expiryDays);

      const data: CreateGiftPackData = {
        senderAddress: address,
        message: giftMessage || undefined,
        expiry: expiryDate.toISOString(),
      };

      const newGift = await createGift.mutateAsync(data);
  setGiftPack(newGift);
  setSelectedAssets([]);
  setCurrentStep(2);
    } catch (error: any) {
      setError(`Failed to create gift pack: ${error.message}`);
    }
  };


  const handleAddAsset = async (keepOpen = false) => {
    if (!giftPack) return;

    try {
      setError(null);
      let itemData: AddItemToGiftPackData;

      if (assetType === 'ERC20' && selectedToken && tokenAmount) {

        const amount = parseFloat(tokenAmount);
        const balance = parseFloat(selectedToken.balance);

        if (amount <= 0) {
          throw new Error('Amount must be greater than 0');
        }

        if (amount > balance) {
          throw new Error('Insufficient balance');
        }

        const amountWei = ethers.parseUnits(tokenAmount, selectedToken.decimals);
        itemData = {
          type: 'ERC20',
          contract: selectedToken.contractAddress,
          amount: amountWei.toString(),
        };


        const newAsset: SelectedAsset = {
          type: 'ERC20',
          contract: selectedToken.contractAddress,
          symbol: selectedToken.symbol,
          name: selectedToken.name,
          amount: amountWei.toString(),
          decimals: selectedToken.decimals,
        };
        setSelectedAssets([...selectedAssets, newAsset]);

      } else if (assetType === 'ERC721' && selectedNFT) {
        itemData = {
          type: 'ERC721',
          contract: selectedNFT.contractAddress,
          tokenId: selectedNFT.tokenId,
        };


        const newAsset: SelectedAsset = {
          type: 'ERC721',
          contract: selectedNFT.contractAddress,
          name: selectedNFT.name,
          tokenId: selectedNFT.tokenId,
          image: selectedNFT.image,
        };
        setSelectedAssets([...selectedAssets, newAsset]);

      } else {
        throw new Error('Please select a valid asset and amount');
      }

      await addItem.mutateAsync({ id: giftPack.id, item: itemData });


  if (!keepOpen) setShowAssetDialog(false);
  setSelectedToken(null);
  setSelectedNFT(null);
  setTokenAmount('');

    } catch (error: any) {
      setError(`Failed to add asset: ${error.message}`);
    }
  };

  const handleRemoveAsset = (index: number) => {
    const newAssets = selectedAssets.filter((_, i) => i !== index);
    setSelectedAssets(newAssets);
  };

  const handleLockGift = async () => {
    if (!giftPack) return;

    try {
      setError(null);
      const result = await finalizeGift.mutateAsync({
        id: giftPack.id,
      });

      const giftId = result.lockResult.giftId;
      const baseUrl = typeof window !== 'undefined' ? window.location.origin : '';
      const code = result.giftPack?.giftCode || giftPack?.giftCode;
      const url = code ? `${baseUrl}/claim?code=${encodeURIComponent(code)}` : `${baseUrl}/claim?giftId=${giftId}`;

      setShareUrl(url);
      setGiftPack(result.giftPack);
      setShowShareDialog(true);
      setCurrentStep(3);

    } catch (error: any) {
      const msg = error?.message?.toLowerCase?.() || '';
      const reason = error?.reason?.toLowerCase?.() || '';
      const revertArgs = error?.revert?.args?.[0]?.toLowerCase?.() || '';
      if (
        msg.includes('missing revert data') ||
        reason.includes('missing revert data') ||
        revertArgs.includes('missing revert data')
      ) {
        setError('Unable to lock the gift at the moment. Please try again after some time.');
      } else {
        setError(`Failed to lock gift: ${error.message}`);
      }
    }
  };

  const handleCopyShareUrl = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);

    } catch (error) {
      console.error('Failed to copy URL:', error);
    }
  };

  const getSmartContractRecommendation = () => {
    if (!giftPackData) return null;
    return smartContractGiftUtils.shouldUseSmartContract(giftPackData);
  };

  const recommendation = getSmartContractRecommendation();

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Typography variant="h3" align="center" sx={{ mb: 2, fontWeight: 'bold' }}>
        Create a Gift
      </Typography>

      <Typography variant="h6" align="center" sx={{ mb: 4, color: 'text.secondary' }}>
        Send crypto assets and NFTs securely on the blockchain
      </Typography>

      {/* Progress Stepper */}
      <StyledCard sx={{ mb: 4 }}>
        <CardContent>
          <Stepper activeStep={currentStep} alternativeLabel>
            {steps.map((label) => (
              <Step key={label}>
                <StepLabel>{label}</StepLabel>
              </Step>
            ))}
          </Stepper>
        </CardContent>
      </StyledCard>

      {/* Error Display */}
      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {/* Smart Contract Recommendation */}
      {recommendation && (
        <Alert
          severity={recommendation.isRequired ? 'error' : recommendation.shouldUse ? 'warning' : 'info'}
          icon={recommendation.isRequired ? <Warning /> : recommendation.shouldUse ? <Info /> : <CheckCircle />}
          sx={{ mb: 3 }}
        >
          <Typography variant="subtitle2" sx={{ fontWeight: 'bold' }}>
            {recommendation.isRequired ? 'Smart Contract Required' :
             recommendation.shouldUse ? 'Smart Contract Recommended' :
             'Traditional Gift Suitable'}
          </Typography>
          <Typography variant="body2">
            {recommendation.reason}
          </Typography>
        </Alert>
      )}

      {/* Main Content */}
      <Grid container spacing={4}>
        <Grid item xs={12} md={8}>
          <StyledCard>
            <CardContent sx={{ p: 4 }}>
              {/* Step 0: Connect Wallet */}
              {currentStep === 0 && (
                <Box textAlign="center">
                  <AccountBalanceWallet sx={{ fontSize: 80, color: 'primary.main', mb: 3 }} />
                  <Typography variant="h4" sx={{ mb: 2 }}>
                    Connect Your Wallet
                  </Typography>
                  <Typography variant="body1" sx={{ mb: 4, color: 'text.secondary' }}>
                    Connect your wallet to start creating gifts on the blockchain
                  </Typography>
                  <GradientButton onClick={handleConnectWallet} size="large">
                    Connect Wallet
                  </GradientButton>
                </Box>
              )}

              {/* Step 1: Create Gift Pack */}
              {currentStep === 1 && address && (
                <Box>
                  <Typography variant="h4" sx={{ mb: 3 }}>
                    Gift Pack Details
                  </Typography>

                  <Grid container spacing={3}>
                    <Grid item xs={12}>
                      <TextField
                        fullWidth
                        label="Gift Message (Optional)"
                        multiline
                        rows={3}
                        value={giftMessage}
                        onChange={(e) => setGiftMessage(e.target.value)}
                        placeholder="Add a personal message for the recipient..."
                        variant="outlined"
                      />
                    </Grid>

                    <Grid item xs={12} sm={6}>
                      <FormControl fullWidth>
                        <InputLabel>Expiry Period</InputLabel>
                        <Select
                          value={expiryDays}
                          onChange={(e) => setExpiryDays(Number(e.target.value))}
                        >
                          <MenuItem value={1}>1 Day</MenuItem>
                          <MenuItem value={7}>1 Week</MenuItem>
                          <MenuItem value={30}>1 Month</MenuItem>
                          <MenuItem value={90}>3 Months</MenuItem>
                          <MenuItem value={365}>1 Year</MenuItem>
                        </Select>
                      </FormControl>
                    </Grid>

                    <Grid item xs={12}>
                      <Box textAlign="center" sx={{ mt: 2 }}>
                        <GradientButton
                          onClick={handleCreateGift}
                          disabled={createGift.isPending}
                          startIcon={createGift.isPending ? <CircularProgress size={20} /> : <Add />}
                        >
                          {createGift.isPending ? 'Creating...' : 'Create Gift Pack'}
                        </GradientButton>
                      </Box>
                    </Grid>
                  </Grid>
                </Box>
              )}

              {/* Step 2: Add Assets */}
              {currentStep === 2 && giftPack && (
                <Box>
                  <Typography variant="h4" sx={{ mb: 3 }}>
                    Add Assets to Gift
                  </Typography>

                  {/* Selected Assets List */}
                  {selectedAssets.length > 0 && (
                    <Box sx={{ mb: 3 }}>
                      <Typography variant="h6" sx={{ mb: 2 }}>
                        Selected Assets:
                      </Typography>
                      <List>
                        {selectedAssets.map((asset, index) => (
                          <ListItem key={index} divider>
                            <ListItemIcon>
                              {asset.type === 'ERC20' ? <Token /> : <ImageIcon />}
                            </ListItemIcon>
                            <ListItemText
                              primary={asset.name || asset.symbol || 'Unknown Asset'}
                              secondary={
                                asset.type === 'ERC20'
                                  ? `${ethers.formatUnits(asset.amount || '0', asset.decimals || 18)} ${asset.symbol}`
                                  : `Token ID: ${asset.tokenId}`
                              }
                            />
                            <ListItemSecondaryAction>
                              <IconButton onClick={() => handleRemoveAsset(index)}>
                                <Delete />
                              </IconButton>
                            </ListItemSecondaryAction>
                          </ListItem>
                        ))}
                      </List>
                    </Box>
                  )}

                  <Box textAlign="center">
                    <GradientButton
                      onClick={() => setShowAssetDialog(true)}
                      startIcon={<Add />}
                      sx={{ mr: 2 }}
                    >
                      Add Asset
                    </GradientButton>

                    {selectedAssets.length > 0 && (
                      <Button
                        variant="outlined"
                        onClick={() => setCurrentStep(3)}
                        sx={{ ml: 2 }}
                      >
                        Continue to Lock
                      </Button>
                    )}
                  </Box>
                </Box>
              )}

              {/* Step 3: Lock & Share */}
              {currentStep === 3 && (
                <Box textAlign="center">
                  <Typography variant="h4" sx={{ mb: 3 }}>
                    Lock Gift on Blockchain
                  </Typography>

                  <Alert severity="error" sx={{ mb: 3, textAlign: 'left' }}>
                    Once locked, the gift cannot be modified and will be secured on the blockchain.
                  </Alert>

                  {validationResult && !validationResult.isValid && (
                    <Alert severity="error" sx={{ mb: 3, textAlign: 'left' }}>
                      Cannot lock gift: {validationResult.errors.join(', ')}
                    </Alert>
                  )}

                  <GradientButton
                    onClick={handleLockGift}
                    disabled={finalizeGift.isPending || !validationResult?.isValid}
                    startIcon={finalizeGift.isPending ? <CircularProgress size={20} /> : <Lock />}
                    size="large"
                  >
                    {finalizeGift.isPending ? 'Locking on Blockchain...' : 'Lock Gift'}
                  </GradientButton>
                </Box>
              )}
            </CardContent>
          </StyledCard>
        </Grid>

        {/* Sidebar */}
        <Grid item xs={12} md={4}>
          <StyledCard>
            <CardContent>
              <Typography variant="h6" sx={{ mb: 2 }}>
                Gift Summary
              </Typography>

              {giftPack ? (
                <Box>
                  <Typography variant="body2" color="text.secondary">
                    Gift ID: {giftPack.id}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Status: <Chip label={giftPack.status} size="small" />
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                    Expires: {new Date(giftPack.expiry).toLocaleDateString()} 
                  </Typography>

                  {giftPack.message && (
                    <Box sx={{ mt: 2, p: 2, bgcolor: 'background.paper', borderRadius: 1 }}>
                      <Typography variant="body2">
                        &quot;{giftPack.message}&quot;
                      </Typography>
                    </Box>
                  )}

                  {selectedAssets.length > 0 && (
                    <Box sx={{ mt: 2 }}>
                      <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                        Assets: {selectedAssets.length}
                      </Typography>
                    </Box>
                  )}

                </Box>
              ) : (
                <Typography variant="body2" color="text.secondary">
                  No gift pack created yet
                </Typography>
              )}
            </CardContent>
          </StyledCard>
        </Grid>
      </Grid>

      {/* Asset Selection Dialog */}
      <Dialog open={showAssetDialog} onClose={() => setShowAssetDialog(false)} maxWidth="md" fullWidth>
        <DialogTitle>Add Asset to Gift</DialogTitle>
        <DialogContent>
          <FormControl fullWidth sx={{ mb: 3, mt: 1 }}>
            <InputLabel>Asset Type</InputLabel>
            <Select
              value={assetType}
              onChange={(e) => setAssetType(e.target.value as 'ERC20' | 'ERC721')}
            >
              <MenuItem value="ERC20">ERC20 Token</MenuItem>
              <MenuItem value="ERC721">NFT (ERC721)</MenuItem>
            </Select>
          </FormControl>

          {assetType === 'ERC20' && (
            <>
              <FormControl fullWidth sx={{ mb: 3 }}>
                <InputLabel>Select Token</InputLabel>
                <Select
                  value={selectedToken?.contractAddress || ''}
                  onChange={(e) => {
                    const token = erc20Balances?.find(t => t.contractAddress === e.target.value);
                    setSelectedToken(token || null);
                  }}
                  disabled={balancesLoading}
                  renderValue={(selected) => {
                    const token = erc20Balances?.find(t => t.contractAddress === selected);
                    return token ? (
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        {token.logoURI && (
                          <Image src={token.logoURI} alt={token.symbol} width={24} height={24} style={{ borderRadius: 12 }} />
                        )}
                        <span>{token.symbol}</span>
                        <span style={{ color: '#888', fontSize: 12 }}>({token.balance})</span>
                      </Box>
                    ) : selected;
                  }}
                >
                  {erc20Balances?.map((token) => (
                    <MenuItem key={token.contractAddress} value={token.contractAddress}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        {token.logoURI && (
                          <Image src={token.logoURI} alt={token.symbol} width={24} height={24} style={{ borderRadius: 12 }} />
                        )}
                        <span style={{ fontWeight: 600 }}>{token.symbol}</span>
                        <span style={{ color: '#888', fontSize: 12 }}>({token.balance})</span>
                      </Box>
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

              {selectedToken && (
                <TextField
                  fullWidth
                  label="Amount"
                  type="number"
                  value={tokenAmount}
                  onChange={(e) => setTokenAmount(e.target.value)}
                  helperText={`Available: ${selectedToken.balance} ${selectedToken.symbol}`}
                  inputProps={{ step: 'any', min: '0' }}
                />
              )}
            </>
          )}

          {assetType === 'ERC721' && (
            <FormControl fullWidth>
              <InputLabel>Select NFT</InputLabel>
              <Select
                value={selectedNFT ? `${selectedNFT.contractAddress}:${selectedNFT.tokenId}` : ''}
                onChange={(e) => {
                  const [contract, tokenId] = e.target.value.split(':');
                  const nft = nfts?.find(n => n.contractAddress === contract && n.tokenId === tokenId);
                  setSelectedNFT(nft || null);
                }}
                disabled={nftsLoading}
              >
                {nfts?.map((nft) => (
                  <MenuItem key={`${nft.contractAddress}:${nft.tokenId}`} value={`${nft.contractAddress}:${nft.tokenId}`}>
                    {nft.name || `Token #${nft.tokenId}`}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          )}
        </DialogContent>
        <DialogActions sx={{ justifyContent: 'space-between' }}>
          <Button onClick={() => setShowAssetDialog(false)}>
            Cancel
          </Button>
          <Button
            onClick={() => handleAddAsset(false)}
            disabled={
              addItem.isPending ||
              (assetType === 'ERC20' && (!selectedToken || !tokenAmount)) ||
              (assetType === 'ERC721' && !selectedNFT)
            }
            variant="contained"
            size="medium"
            sx={{ minWidth: 'auto', px: 2 }}
          >
            {addItem.isPending
              ? 'Adding...'
              : selectedAssets.length === 0
                ? 'Add Item'
                : 'Add Another Item'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Share Dialog */}
      <Dialog open={showShareDialog} onClose={() => setShowShareDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <CheckCircle color="success" />
            Gift Locked Successfully!
          </Box>
        </DialogTitle>
        <DialogContent>
          <Alert severity="success" sx={{ mb: 3 }}>
            Your gift has been locked on the blockchain and is ready to be claimed!
          </Alert>

          <Typography variant="subtitle1" sx={{ mb: 2 }}>
            Share this link with the recipient:
          </Typography>

          <Paper sx={{ p: 2, bgcolor: 'grey.100', borderRadius: 2 }}>
            <TextField
              fullWidth
              value={shareUrl}
              InputProps={{
                readOnly: true,
                style: { fontFamily: 'monospace', fontSize: '0.9rem' }
              }}
              size="small"
            />
          </Paper>

          {giftPack?.giftIdOnChain && (
            <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
              OnChain Gift ID: {giftPack.giftIdOnChain}
            </Typography>
          )}
          {giftPack?.giftCode && (
            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
              Gift Code: {giftPack.giftCode}
            </Typography>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCopyShareUrl} startIcon={<ContentCopy />}>
            Copy Link
          </Button>
          <Button onClick={() => {
            setGiftPack(null);
            setGiftMessage('');
            setExpiryDays(7);
            setSelectedAssets([]);
            setCurrentStep(1);
            setShowAssetDialog(false);
            setShowShareDialog(false);
            setAssetType('ERC20');
            setSelectedToken(null);
            setSelectedNFT(null);
            setTokenAmount('');
            setError(null);
          }} variant="contained">
            Create Another Gift
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
}
