/**
 * Web3.js Blockchain Integration Blueprint
 * 
 * Sets up complete Web3.js integration for Ethereum blockchain interactions
 * Creates wallet connection, contract interaction, and blockchain utilities
 */

import { Blueprint } from '../../../types/adapter.js';

export const web3Blueprint: Blueprint = {
  id: 'web3-base-setup',
  name: 'Web3.js Base Setup',
  actions: [
    {
      type: 'INSTALL_PACKAGES',
      packages: ['web3']
    },
    {
      type: 'INSTALL_PACKAGES',
      packages: ['@types/web3'],
      isDev: true
    },
    {
      type: 'CREATE_FILE',
      path: 'src/lib/web3/config.ts',
      content: `import Web3 from 'web3';

// Network configurations
export const NETWORKS = {
  mainnet: {
    chainId: 1,
    name: 'Ethereum Mainnet',
    rpcUrl: process.env.MAINNET_RPC_URL || 'https://mainnet.infura.io/v3/YOUR_PROJECT_ID',
    blockExplorer: 'https://etherscan.io'
  },
  sepolia: {
    chainId: 11155111,
    name: 'Sepolia Testnet',
    rpcUrl: process.env.SEPOLIA_RPC_URL || 'https://sepolia.infura.io/v3/YOUR_PROJECT_ID',
    blockExplorer: 'https://sepolia.etherscan.io'
  },
  polygon: {
    chainId: 137,
    name: 'Polygon Mainnet',
    rpcUrl: process.env.POLYGON_RPC_URL || 'https://polygon-rpc.com',
    blockExplorer: 'https://polygonscan.com'
  },
  bsc: {
    chainId: 56,
    name: 'BSC Mainnet',
    rpcUrl: process.env.BSC_RPC_URL || 'https://bsc-dataseed.binance.org',
    blockExplorer: 'https://bscscan.com'
  }
};

// Current network configuration
export const getCurrentNetwork = () => {
  const chainId = parseInt(process.env.CHAIN_ID || '1');
  return Object.values(NETWORKS).find(network => network.chainId === chainId) || NETWORKS.mainnet;
};

// Web3 instance
export const createWeb3Instance = (rpcUrl?: string) => {
  const network = getCurrentNetwork();
  return new Web3(rpcUrl || network.rpcUrl);
};`
    },
    {
      type: 'ADD_ENV_VAR',
      key: 'RPC_URL',
      value: 'https://mainnet.infura.io/v3/YOUR_PROJECT_ID',
      description: 'Primary RPC URL for Web3 connection'
    },
    {
      type: 'ADD_ENV_VAR',
      key: 'CHAIN_ID',
      value: '1',
      description: 'Default chain ID (1 for Ethereum mainnet)'
    },
    {
      type: 'ADD_ENV_VAR',
      key: 'MAINNET_RPC_URL',
      value: 'https://mainnet.infura.io/v3/YOUR_PROJECT_ID',
      description: 'Ethereum mainnet RPC URL'
    },
    {
      type: 'ADD_ENV_VAR',
      key: 'SEPOLIA_RPC_URL',
      value: 'https://sepolia.infura.io/v3/YOUR_PROJECT_ID',
      description: 'Ethereum Sepolia testnet RPC URL'
    },
    {
      type: 'ADD_ENV_VAR',
      key: 'POLYGON_RPC_URL',
      value: 'https://polygon-rpc.com',
      description: 'Polygon network RPC URL'
    },
    {
      type: 'ADD_ENV_VAR',
      key: 'BSC_RPC_URL',
      value: 'https://bsc-dataseed.binance.org',
      description: 'Binance Smart Chain RPC URL'
    }
  ]
};
