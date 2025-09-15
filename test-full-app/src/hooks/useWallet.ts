import { useState, useEffect, useCallback } from 'react';
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
}
