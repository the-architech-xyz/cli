import { ethers } from 'ethers';

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

export const networkManager = new NetworkManager();
