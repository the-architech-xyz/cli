import { ethers } from 'ethers';
import { Web3Provider } from '@ethersproject/providers';

export interface WalletState {
  address: string | null;
  balance: string | null;
  chainId: number | null;
  isConnected: boolean;
  provider: Web3Provider | null;
}

export class WalletManager {
  private provider: Web3Provider | null = null;
  private signer: ethers.Signer | null = null;

  async connectWallet(): Promise<WalletState> {
    if (typeof window.ethereum !== 'undefined') {
      try {
        await window.ethereum.request({ method: 'eth_requestAccounts' });
        this.provider = new Web3Provider(window.ethereum);
        this.signer = this.provider.getSigner();
        
        const address = await this.signer.getAddress();
        const balance = await this.provider.getBalance(address);
        const network = await this.provider.getNetwork();
        
        return {
          address,
          balance: ethers.utils.formatEther(balance),
          chainId: network.chainId,
          isConnected: true,
          provider: this.provider
        };
      } catch (error) {
        console.error('Failed to connect wallet:', error);
        throw error;
      }
    } else {
      throw new Error('No Web3 provider found');
    }
  }

  async disconnectWallet(): Promise<void> {
    this.provider = null;
    this.signer = null;
  }

  async switchNetwork(chainId: number): Promise<void> {
    if (this.provider) {
      try {
        await window.ethereum.request({
          method: 'wallet_switchEthereumChain',
          params: [{ chainId: \`0x\${chainId.toString(16)}\` }],
        });
      } catch (error) {
        console.error('Failed to switch network:', error);
        throw error;
      }
    }
  }

  getProvider(): Web3Provider | null {
    return this.provider;
  }

  getSigner(): ethers.Signer | null {
    return this.signer;
  }
}

export const walletManager = new WalletManager();
