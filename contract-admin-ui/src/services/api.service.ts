import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001/api/v1';

interface ContractStatus {
  isPaused: boolean;
  activeUntil: number;
  isActive: boolean;
  activeTimeRemaining: number;
  humanReadableTimeRemaining?: string;
  activeUntilDate?: string;
  owner?: string;
  isCurrentUserOwner?: boolean;
}

interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data?: T;
  errors?: any[];
}

interface TransactionResult {
  transactionHash: string;
}

class ApiService {
  private apiKey: string | null = null;

  setApiKey(apiKey: string) {
    this.apiKey = apiKey;
  }

  getHeaders() {
    return {
      'Content-Type': 'application/json',
      ...(this.apiKey && { 'x-api-key': this.apiKey })
    };
  }

  // Public endpoints
  async getContractStatus(): Promise<ContractStatus> {
    const response = await axios.get<ApiResponse<ContractStatus>>(`${API_URL}/status`);
    return response.data.data as ContractStatus;
  }

  // Admin endpoints (require API key)
  async getAdminContractStatus(): Promise<ContractStatus> {
    const response = await axios.get<ApiResponse<ContractStatus>>(
      `${API_URL}/admin/status`,
      { headers: this.getHeaders() }
    );
    return response.data.data as ContractStatus;
  }

  async pauseContract(): Promise<TransactionResult> {
    const response = await axios.post<ApiResponse<TransactionResult>>(
      `${API_URL}/admin/pause`,
      {},
      { headers: this.getHeaders() }
    );
    return response.data.data as TransactionResult;
  }

  async unpauseContract(): Promise<TransactionResult> {
    const response = await axios.post<ApiResponse<TransactionResult>>(
      `${API_URL}/admin/unpause`,
      {},
      { headers: this.getHeaders() }
    );
    return response.data.data as TransactionResult;
  }

  async extendContractTimer(days: number): Promise<TransactionResult> {
    const response = await axios.post<ApiResponse<TransactionResult>>(
      `${API_URL}/admin/extend`,
      { days },
      { headers: this.getHeaders() }
    );
    return response.data.data as TransactionResult;
  }

  async setContractEndDate(timestamp: number): Promise<TransactionResult> {
    const response = await axios.post<ApiResponse<TransactionResult>>(
      `${API_URL}/admin/set-end-date`,
      { timestamp },
      { headers: this.getHeaders() }
    );
    return response.data.data as TransactionResult;
  }

  // Helper for validating API key
  async validateApiKey(apiKey: string): Promise<boolean> {
    try {
      const originalKey = this.apiKey;
      this.apiKey = apiKey;
      await this.getAdminContractStatus();
      // If we get here, the API key is valid
      if (!originalKey) {
        // Only restore if there wasn't one
        this.apiKey = originalKey;
      }
      return true;
    } catch (error) {
      return false;
    }
  }
}

export default new ApiService();
