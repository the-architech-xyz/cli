/**
 * Wallet Integration Feature Blueprint
 * 
 * MetaMask, WalletConnect and other wallet integrations
 */

import { Blueprint } from '../../../../types/adapter.js';

const walletIntegrationBlueprint: Blueprint = {
  id: 'web3-wallet-integration',
  name: 'Wallet Integration',
  actions: [
    {
      type: 'INSTALL_PACKAGES',
      packages: ['@walletconnect/web3-provider', '@walletconnect/modal']
    },
    {
      type: 'CREATE_FILE',
      path: 'src/lib/web3/wallet.ts',
      content: `import Web3 from 'web3';
import { createWeb3Instance, getCurrentNetwork } from './config.js';

export interface WalletState {
  address: string | null;
  balance: string | null;
  chainId: number | null;
  isConnected: boolean;
  web3: Web3 | null;
}

export class WalletManager {
  private web3: Web3 | null = null;
  private walletState: WalletState = {
    address: null,
    balance: null,
    chainId: null,
    isConnected: false,
    web3: null
  };

  constructor() {
    this.initializeWeb3();
  }

  private initializeWeb3() {
    if (typeof window !== 'undefined' && window.ethereum) {
      this.web3 = new Web3(window.ethereum);
      this.walletState.web3 = this.web3;
    } else {
      this.web3 = createWeb3Instance();
      this.walletState.web3 = this.web3;
    }
  }

  async connectWallet(): Promise<WalletState> {
    if (!window.ethereum) {
      throw new Error('No wallet detected. Please install MetaMask or another Web3 wallet.');
    }

    try {
      // Request account access
      const accounts = await window.ethereum.request({
        method: 'eth_requestAccounts'
      });

      if (accounts.length > 0) {
        this.walletState.address = accounts[0];
        this.walletState.isConnected = true;
        
        // Get chain ID
        const chainId = await window.ethereum.request({
          method: 'eth_chainId'
        });
        this.walletState.chainId = parseInt(chainId, 16);

        // Get balance
        await this.updateBalance();

        // Listen for account changes
        window.ethereum.on('accountsChanged', this.handleAccountsChanged.bind(this));
        window.ethereum.on('chainChanged', this.handleChainChanged.bind(this));
      }

      return this.walletState;
    } catch (error) {
      console.error('Failed to connect wallet:', error);
      throw error;
    }
  }

  async disconnectWallet(): Promise<void> {
    this.walletState = {
      address: null,
      balance: null,
      chainId: null,
      isConnected: false,
      web3: null
    };
  }

  async updateBalance(): Promise<void> {
    if (!this.walletState.address || !this.web3) return;

    try {
      const balance = await this.web3.eth.getBalance(this.walletState.address);
      this.walletState.balance = this.web3.utils.fromWei(balance, 'ether');
    } catch (error) {
      console.error('Failed to update balance:', error);
    }
  }

  async switchNetwork(chainId: number): Promise<void> {
    if (!window.ethereum) return;

    try {
      await window.ethereum.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: '0x' + chainId.toString(16) }]
      });
    } catch (error) {
      console.error('Failed to switch network:', error);
      throw error;
    }
  }

  private handleAccountsChanged(accounts: string[]) {
    if (accounts.length === 0) {
      this.disconnectWallet();
    } else {
      this.walletState.address = accounts[0];
      this.updateBalance();
    }
  }

  private handleChainChanged(chainId: string) {
    this.walletState.chainId = parseInt(chainId, 16);
    this.updateBalance();
  }

  getWalletState(): WalletState {
    return { ...this.walletState };
  }
}

// Global wallet manager instance
export const walletManager = new WalletManager();`
    },
    {
      type: 'CREATE_FILE',
      path: 'src/hooks/web3/useWallet.ts',
      content: `import { useState, useEffect, useCallback } from 'react';
import { walletManager, WalletState } from '../../lib/web3/wallet.js';

export const useWallet = () => {
  const [walletState, setWalletState] = useState<WalletState>({
    address: null,
    balance: null,
    chainId: null,
    isConnected: false,
    web3: null
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Initialize wallet state
  useEffect(() => {
    const currentState = walletManager.getWalletState();
    setWalletState(currentState);
  }, []);

  // Connect wallet
  const connect = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      const newState = await walletManager.connectWallet();
      setWalletState(newState);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to connect wallet');
    } finally {
      setLoading(false);
    }
  }, []);

  // Disconnect wallet
  const disconnect = useCallback(async () => {
    setLoading(true);
    
    try {
      await walletManager.disconnectWallet();
      setWalletState({
        address: null,
        balance: null,
        chainId: null,
        isConnected: false,
        web3: null
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to disconnect wallet');
    } finally {
      setLoading(false);
    }
  }, []);

  // Update balance
  const updateBalance = useCallback(async () => {
    try {
      await walletManager.updateBalance();
      const newState = walletManager.getWalletState();
      setWalletState(newState);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update balance');
    }
  }, []);

  // Switch network
  const switchNetwork = useCallback(async (chainId: number) => {
    setLoading(true);
    setError(null);
    
    try {
      await walletManager.switchNetwork(chainId);
      const newState = walletManager.getWalletState();
      setWalletState(newState);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to switch network');
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    ...walletState,
    loading,
    error,
    connect,
    disconnect,
    updateBalance,
    switchNetwork
  };
};`
    },
    {
      type: 'CREATE_FILE',
      path: 'src/components/web3/WalletConnect.tsx',
      content: `import React from 'react';
import { useWallet } from '../../hooks/web3/useWallet.js';
import { Button } from '../ui/button.js';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card.js';

export const WalletConnect: React.FC = () => {
  const { 
    address, 
    balance, 
    chainId, 
    isConnected, 
    loading, 
    error, 
    connect, 
    disconnect, 
    updateBalance 
  } = useWallet();

  const formatAddress = (addr: string) => {
    return \`\${addr.slice(0, 6)}...\${addr.slice(-4)}\`;
  };

  const formatBalance = (bal: string) => {
    return parseFloat(bal).toFixed(4);
  };

  if (!isConnected) {
    return (
      <Card className="w-full max-w-md mx-auto">
        <CardHeader>
          <CardTitle>Connect Wallet</CardTitle>
          <CardDescription>
            Connect your Web3 wallet to interact with the blockchain
          </CardDescription>
        </CardHeader>
        <CardContent>
          {error && (
            <div className="mb-4 p-3 bg-red-100 border border-red-300 rounded-md">
              <p className="text-red-700 text-sm">{error}</p>
            </div>
          )}
          <Button 
            onClick={connect} 
            disabled={loading}
            className="w-full"
          >
            {loading ? 'Connecting...' : 'Connect Wallet'}
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle>Wallet Connected</CardTitle>
        <CardDescription>
          Your wallet is connected and ready to use
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <span className="text-sm font-medium">Address:</span>
            <span className="text-sm font-mono">{formatAddress(address!)}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm font-medium">Balance:</span>
            <span className="text-sm">{formatBalance(balance!)} ETH</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm font-medium">Chain ID:</span>
            <span className="text-sm">{chainId}</span>
          </div>
        </div>
        
        <div className="flex space-x-2">
          <Button 
            onClick={updateBalance} 
            variant="outline" 
            size="sm"
            className="flex-1"
          >
            Refresh Balance
          </Button>
          <Button 
            onClick={disconnect} 
            variant="destructive" 
            size="sm"
            className="flex-1"
          >
            Disconnect
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};`
    }
  ]
};
export default walletIntegrationBlueprint;
