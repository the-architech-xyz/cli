import Web3 from 'web3';

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
};
