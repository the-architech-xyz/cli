import { ethers } from 'ethers';
import { walletManager } from './wallet';

export interface TransactionState {
  hash: string;
  status: 'pending' | 'confirmed' | 'failed';
  gasUsed?: string;
  gasPrice?: string;
  blockNumber?: number;
  confirmations: number;
}

export class TransactionManager {
  private transactions: Map<string, TransactionState> = new Map();

  async sendTransaction(
    to: string,
    value: string = '0',
    data: string = '0x',
    gasLimit?: string
  ): Promise<TransactionState> {
    const signer = walletManager.getSigner();
    if (!signer) throw new Error('No wallet connected');

    try {
      const tx = await signer.sendTransaction({
        to,
        value: ethers.utils.parseEther(value),
        data,
        gasLimit: gasLimit ? ethers.BigNumber.from(gasLimit) : undefined
      });

      const transactionState: TransactionState = {
        hash: tx.hash,
        status: 'pending',
        confirmations: 0
      };

      this.transactions.set(tx.hash, transactionState);
      this.waitForConfirmation(tx.hash);
      
      return transactionState;
    } catch (error) {
      console.error('Transaction failed:', error);
      throw error;
    }
  }

  async waitForConfirmation(txHash: string): Promise<void> {
    const provider = walletManager.getProvider();
    if (!provider) return;

    try {
      const receipt = await provider.waitForTransaction(txHash);
      const transaction = this.transactions.get(txHash);
      
      if (transaction) {
        transaction.status = receipt.status === 1 ? 'confirmed' : 'failed';
        transaction.gasUsed = receipt.gasUsed.toString();
        transaction.gasPrice = receipt.gasPrice?.toString();
        transaction.blockNumber = receipt.blockNumber;
        transaction.confirmations = receipt.confirmations;
      }
    } catch (error) {
      const transaction = this.transactions.get(txHash);
      if (transaction) {
        transaction.status = 'failed';
      }
    }
  }

  getTransaction(txHash: string): TransactionState | undefined {
    return this.transactions.get(txHash);
  }

  getAllTransactions(): TransactionState[] {
    return Array.from(this.transactions.values());
  }

  async getTransactionHistory(address: string, limit: number = 10): Promise<any[]> {
    const provider = walletManager.getProvider();
    if (!provider) throw new Error('No provider available');

    // This would typically query a block explorer API
    // For now, return empty array
    return [];
  }
}

export const transactionManager = new TransactionManager();
