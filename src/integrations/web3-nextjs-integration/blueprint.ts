import { Blueprint } from '../../types/adapter.js';

export const blueprint: Blueprint = {
  id: 'web3-nextjs-integration',
  name: 'Web3 Next.js Integration',
  description: 'Complete Web3 integration for Next.js applications',
  version: '1.0.0',
  actions: [
    {
      type: 'CREATE_FILE',
      path: 'src/lib/web3/wallet.ts',
      content: `import { ethers } from 'ethers';
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

export const walletManager = new WalletManager();`
    },
    {
      type: 'CREATE_FILE',
      path: 'src/lib/web3/contracts.ts',
      content: `import { ethers, Contract } from 'ethers';
import { walletManager } from './wallet';

export interface ContractConfig {
  address: string;
  abi: any[];
  chainId: number;
}

export class ContractManager {
  private contracts: Map<string, Contract> = new Map();

  async deployContract(bytecode: string, abi: any[], constructorArgs: any[] = []): Promise<string> {
    const signer = walletManager.getSigner();
    if (!signer) throw new Error('No wallet connected');

    const factory = new ethers.ContractFactory(abi, bytecode, signer);
    const contract = await factory.deploy(...constructorArgs);
    await contract.deployed();

    return contract.address;
  }

  async getContract(address: string, abi: any[]): Promise<Contract> {
    const signer = walletManager.getSigner();
    if (!signer) throw new Error('No wallet connected');

    const contract = new ethers.Contract(address, abi, signer);
    this.contracts.set(address, contract);
    return contract;
  }

  async callContractMethod(
    contractAddress: string,
    methodName: string,
    args: any[] = [],
    options: any = {}
  ): Promise<any> {
    const contract = this.contracts.get(contractAddress);
    if (!contract) throw new Error('Contract not found');

    return await contract[methodName](...args, options);
  }

  async sendTransaction(
    contractAddress: string,
    methodName: string,
    args: any[] = [],
    options: any = {}
  ): Promise<any> {
    const contract = this.contracts.get(contractAddress);
    if (!contract) throw new Error('Contract not found');

    const tx = await contract[methodName](...args, options);
    return await tx.wait();
  }

  async estimateGas(
    contractAddress: string,
    methodName: string,
    args: any[] = []
  ): Promise<ethers.BigNumber> {
    const contract = this.contracts.get(contractAddress);
    if (!contract) throw new Error('Contract not found');

    return await contract.estimateGas[methodName](...args);
  }

  onContractEvent(contractAddress: string, eventName: string, callback: Function): void {
    const contract = this.contracts.get(contractAddress);
    if (!contract) throw new Error('Contract not found');

    contract.on(eventName, callback);
  }

  offContractEvent(contractAddress: string, eventName: string, callback: Function): void {
    const contract = this.contracts.get(contractAddress);
    if (!contract) throw new Error('Contract not found');

    contract.off(eventName, callback);
  }
}

export const contractManager = new ContractManager();`
    },
    {
      type: 'CREATE_FILE',
      path: 'src/lib/web3/transactions.ts',
      content: `import { ethers } from 'ethers';
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

export const transactionManager = new TransactionManager();`
    },
    {
      type: 'CREATE_FILE',
      path: 'src/lib/web3/network.ts',
      content: `import { ethers } from 'ethers';

export interface NetworkConfig {
  chainId: number;
  name: string;
  rpcUrl: string;
  blockExplorer: string;
  nativeCurrency: {
    name: string;
    symbol: string;
    decimals: number;
  };
}

export const SUPPORTED_NETWORKS: Record<number, NetworkConfig> = {
  1: {
    chainId: 1,
    name: 'Ethereum Mainnet',
    rpcUrl: 'https://mainnet.infura.io/v3/YOUR_PROJECT_ID',
    blockExplorer: 'https://etherscan.io',
    nativeCurrency: {
      name: 'Ether',
      symbol: 'ETH',
      decimals: 18
    }
  },
  5: {
    chainId: 5,
    name: 'Goerli Testnet',
    rpcUrl: 'https://goerli.infura.io/v3/YOUR_PROJECT_ID',
    blockExplorer: 'https://goerli.etherscan.io',
    nativeCurrency: {
      name: 'Goerli Ether',
      symbol: 'ETH',
      decimals: 18
    }
  },
  137: {
    chainId: 137,
    name: 'Polygon Mainnet',
    rpcUrl: 'https://polygon-rpc.com',
    blockExplorer: 'https://polygonscan.com',
    nativeCurrency: {
      name: 'Polygon',
      symbol: 'MATIC',
      decimals: 18
    }
  },
  80001: {
    chainId: 80001,
    name: 'Polygon Mumbai',
    rpcUrl: 'https://rpc-mumbai.maticvigil.com',
    blockExplorer: 'https://mumbai.polygonscan.com',
    nativeCurrency: {
      name: 'Mumbai',
      symbol: 'MATIC',
      decimals: 18
    }
  }
};

export class NetworkManager {
  private currentNetwork: NetworkConfig | null = null;

  async getCurrentNetwork(): Promise<NetworkConfig | null> {
    if (typeof window.ethereum !== 'undefined') {
      try {
        const chainId = await window.ethereum.request({ method: 'eth_chainId' });
        const networkId = parseInt(chainId, 16);
        this.currentNetwork = SUPPORTED_NETWORKS[networkId] || null;
        return this.currentNetwork;
      } catch (error) {
        console.error('Failed to get current network:', error);
        return null;
      }
    }
    return null;
  }

  async switchNetwork(chainId: number): Promise<void> {
    if (typeof window.ethereum !== 'undefined') {
      try {
        await window.ethereum.request({
          method: 'wallet_switchEthereumChain',
          params: [{ chainId: \`0x\${chainId.toString(16)}\` }],
        });
        this.currentNetwork = SUPPORTED_NETWORKS[chainId] || null;
      } catch (error) {
        // If the network doesn't exist, try to add it
        if (error.code === 4902) {
          await this.addNetwork(chainId);
        } else {
          throw error;
        }
      }
    }
  }

  async addNetwork(chainId: number): Promise<void> {
    const network = SUPPORTED_NETWORKS[chainId];
    if (!network) throw new Error('Unsupported network');

    if (typeof window.ethereum !== 'undefined') {
      try {
        await window.ethereum.request({
          method: 'wallet_addEthereumChain',
          params: [{
            chainId: \`0x\${chainId.toString(16)}\`,
            chainName: network.name,
            rpcUrls: [network.rpcUrl],
            blockExplorerUrls: [network.blockExplorer],
            nativeCurrency: network.nativeCurrency
          }],
        });
      } catch (error) {
        console.error('Failed to add network:', error);
        throw error;
      }
    }
  }

  getSupportedNetworks(): NetworkConfig[] {
    return Object.values(SUPPORTED_NETWORKS);
  }

  isNetworkSupported(chainId: number): boolean {
    return chainId in SUPPORTED_NETWORKS;
  }
}

export const networkManager = new NetworkManager();`
    },
    {
      type: 'CREATE_FILE',
      path: 'src/hooks/useWallet.ts',
      content: `import { useState, useEffect, useCallback } from 'react';
import { walletManager, WalletState } from '@/lib/web3/wallet';

export function useWallet() {
  const [walletState, setWalletState] = useState<WalletState>({
    address: null,
    balance: null,
    chainId: null,
    isConnected: false,
    provider: null
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const connectWallet = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const state = await walletManager.connectWallet();
      setWalletState(state);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to connect wallet');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const disconnectWallet = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      await walletManager.disconnectWallet();
      setWalletState({
        address: null,
        balance: null,
        chainId: null,
        isConnected: false,
        provider: null
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to disconnect wallet');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const switchNetwork = useCallback(async (chainId: number) => {
    setIsLoading(true);
    setError(null);
    
    try {
      await walletManager.switchNetwork(chainId);
      // Refresh wallet state after network switch
      const state = await walletManager.connectWallet();
      setWalletState(state);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to switch network');
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Listen for account changes
  useEffect(() => {
    if (typeof window.ethereum !== 'undefined') {
      const handleAccountsChanged = (accounts: string[]) => {
        if (accounts.length === 0) {
          disconnectWallet();
        } else {
          connectWallet();
        }
      };

      const handleChainChanged = (chainId: string) => {
        window.location.reload();
      };

      window.ethereum.on('accountsChanged', handleAccountsChanged);
      window.ethereum.on('chainChanged', handleChainChanged);

      return () => {
        window.ethereum.removeListener('accountsChanged', handleAccountsChanged);
        window.ethereum.removeListener('chainChanged', handleChainChanged);
      };
    }
  }, [connectWallet, disconnectWallet]);

  return {
    ...walletState,
    isLoading,
    error,
    connectWallet,
    disconnectWallet,
    switchNetwork
  };
}`
    },
    {
      type: 'CREATE_FILE',
      path: 'src/lib/web3/WalletProvider.tsx',
      content: `import React, { createContext, useContext, ReactNode } from 'react';
import { useWallet } from '@/hooks/useWallet';
import { WalletState } from '@/lib/web3/wallet';

interface WalletContextType extends WalletState {
  isLoading: boolean;
  error: string | null;
  connectWallet: () => Promise<void>;
  disconnectWallet: () => Promise<void>;
  switchNetwork: (chainId: number) => Promise<void>;
}

const WalletContext = createContext<WalletContextType | undefined>(undefined);

interface WalletProviderProps {
  children: ReactNode;
}

export function WalletProvider({ children }: WalletProviderProps) {
  const wallet = useWallet();

  return (
    <WalletContext.Provider value={wallet}>
      {children}
    </WalletContext.Provider>
  );
}

export function useWalletContext() {
  const context = useContext(WalletContext);
  if (context === undefined) {
    throw new Error('useWalletContext must be used within a WalletProvider');
  }
  return context;
}`
    },
    {
      type: 'CREATE_FILE',
      path: 'src/components/web3/WalletButton.tsx',
      content: `import React from 'react';
import { useWalletContext } from '@/lib/web3/WalletProvider';

interface WalletButtonProps {
  className?: string;
  children?: React.ReactNode;
}

export function WalletButton({ className = '', children }: WalletButtonProps) {
  const { 
    isConnected, 
    address, 
    isLoading, 
    error, 
    connectWallet, 
    disconnectWallet 
  } = useWalletContext();

  if (isLoading) {
    return (
      <button 
        className={\`px-4 py-2 bg-gray-500 text-white rounded disabled:opacity-50 \${className}\`}
        disabled
      >
        Connecting...
      </button>
    );
  }

  if (error) {
    return (
      <button 
        className={\`px-4 py-2 bg-red-500 text-white rounded \${className}\`}
        onClick={connectWallet}
      >
        Retry Connection
      </button>
    );
  }

  if (isConnected && address) {
    return (
      <div className="flex items-center gap-2">
        <span className="text-sm text-gray-600">
          {address.slice(0, 6)}...{address.slice(-4)}
        </span>
        <button 
          className={\`px-4 py-2 bg-red-500 text-white rounded \${className}\`}
          onClick={disconnectWallet}
        >
          Disconnect
        </button>
      </div>
    );
  }

  return (
    <button 
      className={\`px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 \${className}\`}
      onClick={connectWallet}
    >
      {children || 'Connect Wallet'}
    </button>
  );
}`
    }
  ]
};
