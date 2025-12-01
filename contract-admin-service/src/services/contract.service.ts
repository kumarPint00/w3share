import { ethers } from 'ethers';
import { config } from '../config';
import GiftEscrowPausableABI from '../contracts/GiftEscrowPausable.json';
import logger from '../config/logger';

export class ContractService {
  private provider: ethers.JsonRpcProvider;
  private signer: ethers.Wallet;
  private contract: ethers.Contract;

  constructor() {
    try {
      // Initialize provider, signer, and contract
      this.provider = new ethers.JsonRpcProvider(config.rpcUrl);
      this.signer = new ethers.Wallet(config.privateKey, this.provider);
      this.contract = new ethers.Contract(
        config.contractAddress,
        GiftEscrowPausableABI.abi,
        this.signer
      );

      logger.info('Contract service initialized successfully');
    } catch (error: any) {
      logger.error('Failed to initialize contract service:', error?.message || error);
      throw new Error('Contract service initialization failed');
    }
  }

  /**
   * Get the current contract status
   * @returns Contract status (isPaused, activeUntil, isActive)
   */
  async getContractStatus(): Promise<{
    isPaused: boolean;
    activeUntil: number;
    isActive: boolean;
    activeTimeRemaining: number;
  }> {
    try {
      const [isPaused, activeUntil, isActive] = await this.contract.getContractStatus();
      const activeTimeRemaining = await this.contract.getActiveTimeRemaining();
      
      return {
        isPaused,
        activeUntil: Number(activeUntil),
        isActive,
        activeTimeRemaining: Number(activeTimeRemaining)
      };
    } catch (error: any) {
      logger.error('Failed to get contract status:', error?.message || error);
      throw new Error(`Failed to get contract status: ${error?.message || 'Unknown error'}`);
    }
  }

  /**
   * Pause the contract
   */
  async pauseContract(): Promise<{ transactionHash: string }> {
    try {
      const tx = await this.contract.pause();
      const receipt = await tx.wait();
      
      logger.info(`Contract paused successfully, transaction hash: ${receipt.hash}`);
      return { transactionHash: receipt.hash };
    } catch (error: any) {
      logger.error('Failed to pause contract:', error?.message || error);
      throw new Error(`Failed to pause contract: ${error?.message || 'Unknown error'}`);
    }
  }

  /**
   * Unpause the contract
   */
  async unpauseContract(): Promise<{ transactionHash: string }> {
    try {
      const tx = await this.contract.unpause();
      const receipt = await tx.wait();
      
      logger.info(`Contract unpaused successfully, transaction hash: ${receipt.hash}`);
      return { transactionHash: receipt.hash };
    } catch (error: any) {
      logger.error('Failed to unpause contract:', error?.message || error);
      throw new Error(`Failed to unpause contract: ${error?.message || 'Unknown error'}`);
    }
  }

  /**
   * Extend the contract's active timer
   * @param days Number of days to extend
   */
  async extendActiveTimer(days: number): Promise<{ transactionHash: string }> {
    try {
      if (days <= 0) {
        throw new Error('Extension days must be greater than 0');
      }
      
      const tx = await this.contract.extendActiveTimer(days);
      const receipt = await tx.wait();
      
      logger.info(`Contract timer extended by ${days} days, transaction hash: ${receipt.hash}`);
      return { transactionHash: receipt.hash };
    } catch (error: any) {
      logger.error('Failed to extend contract timer:', error?.message || error);
      throw new Error(`Failed to extend contract timer: ${error?.message || 'Unknown error'}`);
    }
  }

  /**
   * Set a specific end date for the contract
   * @param timestamp Unix timestamp for the new end date
   */
  async setActiveTimerEnd(timestamp: number): Promise<{ transactionHash: string }> {
    try {
      // Validate timestamp is in the future
      const currentTimestamp = Math.floor(Date.now() / 1000);
      if (timestamp <= currentTimestamp) {
        throw new Error('End timestamp must be in the future');
      }
      
      const tx = await this.contract.setActiveTimerEnd(timestamp);
      const receipt = await tx.wait();
      
      logger.info(`Contract end timestamp set to ${timestamp}, transaction hash: ${receipt.hash}`);
      return { transactionHash: receipt.hash };
    } catch (error: any) {
      logger.error('Failed to set contract end timestamp:', error?.message || error);
      throw new Error(`Failed to set contract end timestamp: ${error?.message || 'Unknown error'}`);
    }
  }

  /**
   * Get the current owner of the contract
   */
  async getContractOwner(): Promise<string> {
    try {
      const owner = await this.contract.owner();
      return owner;
    } catch (error: any) {
      logger.error('Failed to get contract owner:', error?.message || error);
      throw new Error(`Failed to get contract owner: ${error?.message || 'Unknown error'}`);
    }
  }

  /**
   * Check if the connected wallet is the contract owner
   */
  async isContractOwner(): Promise<boolean> {
    try {
      const owner = await this.getContractOwner();
      return owner.toLowerCase() === this.signer.address.toLowerCase();
    } catch (error) {
      return false;
    }
  }
}

export default new ContractService();
