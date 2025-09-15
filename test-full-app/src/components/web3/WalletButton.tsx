import React from 'react';
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
}
