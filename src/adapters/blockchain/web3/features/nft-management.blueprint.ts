/**
 * NFT Management Feature Blueprint
 * 
 * Mint, transfer, and manage NFTs (ERC721, ERC1155)
 */

import { Blueprint } from '../../../../types/adapter.js';

const nftManagementBlueprint: Blueprint = {
  id: 'web3-nft-management',
  name: 'NFT Management',
  actions: [
    {
      type: 'CREATE_FILE',
      path: 'src/lib/web3/nft.ts',
      content: `import Web3 from 'web3';
import { contractManager } from './contracts.js';

export interface NFTMetadata {
  name: string;
  description: string;
  image: string;
  attributes?: Array<{
    trait_type: string;
    value: string | number;
  }>;
}

export interface NFTToken {
  tokenId: string;
  owner: string;
  metadata?: NFTMetadata;
  contractAddress: string;
}

export class NFTManager {
  private web3: Web3;

  constructor(web3?: Web3) {
    this.web3 = web3 || new Web3();
  }

  /**
   * Get NFT metadata from IPFS or HTTP URL
   */
  async getNFTMetadata(tokenURI: string): Promise<NFTMetadata> {
    try {
      const response = await fetch(tokenURI);
      if (!response.ok) {
        throw new Error('Failed to fetch NFT metadata');
      }
      return await response.json();
    } catch (error) {
      console.error('Error fetching NFT metadata:', error);
      throw error;
    }
  }

  /**
   * Get all NFTs owned by an address
   */
  async getOwnedNFTs(contractAddress: string, ownerAddress: string): Promise<NFTToken[]> {
    try {
      const balance = await contractManager.getNFTBalance(contractAddress, ownerAddress);
      const nfts: NFTToken[] = [];

      // For ERC721, we need to iterate through token IDs
      // This is a simplified version - in practice, you'd use events or indexing
      for (let i = 0; i < Math.min(balance, 100); i++) {
        try {
          const tokenId = i.toString();
          const owner = await contractManager.getNFTOwner(contractAddress, tokenId);
          
          if (owner.toLowerCase() === ownerAddress.toLowerCase()) {
            const tokenURI = await contractManager.getNFTTokenURI(contractAddress, tokenId);
            let metadata: NFTMetadata | undefined;
            
            try {
              metadata = await this.getNFTMetadata(tokenURI);
            } catch (error) {
              console.warn('Failed to fetch metadata for token', tokenId);
            }

            nfts.push({
              tokenId,
              owner,
              metadata,
              contractAddress
            });
          }
        } catch (error) {
          // Token might not exist, continue
          continue;
        }
      }

      return nfts;
    } catch (error) {
      console.error('Error getting owned NFTs:', error);
      throw error;
    }
  }

  /**
   * Transfer NFT to another address
   */
  async transferNFT(
    contractAddress: string,
    fromAddress: string,
    toAddress: string,
    tokenId: string
  ): Promise<string> {
    try {
      const contract = contractManager.createContract(contractAddress, [
        {
          "constant": false,
          "inputs": [
            {"name": "_to", "type": "address"},
            {"name": "_tokenId", "type": "uint256"}
          ],
          "name": "transferFrom",
          "outputs": [],
          "type": "function"
        }
      ]);

      return new Promise((resolve, reject) => {
        contract.methods.transferFrom(fromAddress, toAddress, tokenId)
          .send({ from: fromAddress })
          .on('transactionHash', (hash: string) => resolve(hash))
          .on('error', (error: any) => reject(error));
      });
    } catch (error) {
      console.error('Error transferring NFT:', error);
      throw error;
    }
  }

  /**
   * Mint a new NFT (requires contract with mint function)
   */
  async mintNFT(
    contractAddress: string,
    toAddress: string,
    tokenURI: string,
    fromAddress: string
  ): Promise<string> {
    try {
      const contract = contractManager.createContract(contractAddress, [
        {
          "constant": false,
          "inputs": [
            {"name": "_to", "type": "address"},
            {"name": "_tokenURI", "type": "string"}
          ],
          "name": "mint",
          "outputs": [{"name": "", "type": "uint256"}],
          "type": "function"
        }
      ]);

      return new Promise((resolve, reject) => {
        contract.methods.mint(toAddress, tokenURI)
          .send({ from: fromAddress })
          .on('transactionHash', (hash: string) => resolve(hash))
          .on('error', (error: any) => reject(error));
      });
    } catch (error) {
      console.error('Error minting NFT:', error);
      throw error;
    }
  }

  /**
   * Get NFT collection info
   */
  async getCollectionInfo(contractAddress: string): Promise<{
    name: string;
    symbol: string;
    totalSupply: number;
  }> {
    try {
      const contract = contractManager.createContract(contractAddress, [
        {
          "constant": true,
          "inputs": [],
          "name": "name",
          "outputs": [{"name": "", "type": "string"}],
          "type": "function"
        },
        {
          "constant": true,
          "inputs": [],
          "name": "symbol",
          "outputs": [{"name": "", "type": "string"}],
          "type": "function"
        },
        {
          "constant": true,
          "inputs": [],
          "name": "totalSupply",
          "outputs": [{"name": "", "type": "uint256"}],
          "type": "function"
        }
      ]);

      const [name, symbol, totalSupply] = await Promise.all([
        contract.methods.name().call(),
        contract.methods.symbol().call(),
        contract.methods.totalSupply().call()
      ]);

      return {
        name,
        symbol,
        totalSupply: parseInt(totalSupply)
      };
    } catch (error) {
      console.error('Error getting collection info:', error);
      throw error;
    }
  }
}

// Global NFT manager instance
export const nftManager = new NFTManager();`
    },
    {
      type: 'CREATE_FILE',
      path: 'src/components/web3/NFTGallery.tsx',
      content: `import React, { useState, useEffect } from 'react';
import { useWallet } from '../../hooks/web3/useWallet.js';
import { nftManager, NFTToken } from '../../lib/web3/nft.js';
import { Button } from '../ui/button.js';
import { Input } from '../ui/input.js';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card.js';

interface NFTGalleryProps {
  contractAddress: string;
}

export const NFTGallery: React.FC<NFTGalleryProps> = ({ contractAddress }) => {
  const { address, isConnected } = useWallet();
  const [nfts, setNfts] = useState<NFTToken[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>('');
  const [collectionInfo, setCollectionInfo] = useState<{
    name: string;
    symbol: string;
    totalSupply: number;
  } | null>(null);

  // Load collection info
  useEffect(() => {
    const loadCollectionInfo = async () => {
      try {
        const info = await nftManager.getCollectionInfo(contractAddress);
        setCollectionInfo(info);
      } catch (err) {
        console.error('Failed to load collection info:', err);
      }
    };

    if (contractAddress) {
      loadCollectionInfo();
    }
  }, [contractAddress]);

  // Load owned NFTs
  const loadOwnedNFTs = async () => {
    if (!address || !isConnected) return;

    setLoading(true);
    setError('');

    try {
      const ownedNFTs = await nftManager.getOwnedNFTs(contractAddress, address);
      setNfts(ownedNFTs);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load NFTs');
    } finally {
      setLoading(false);
    }
  };

  // Transfer NFT
  const transferNFT = async (tokenId: string, toAddress: string) => {
    if (!address || !isConnected) return;

    setLoading(true);
    setError('');

    try {
      const txHash = await nftManager.transferNFT(contractAddress, address, toAddress, tokenId);
      setError('');
      // Reload NFTs after transfer
      await loadOwnedNFTs();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to transfer NFT');
    } finally {
      setLoading(false);
    }
  };

  if (!isConnected) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>NFT Gallery</CardTitle>
          <CardDescription>
            Please connect your wallet to view NFTs
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>NFT Gallery</CardTitle>
        <CardDescription>
          {collectionInfo ? \`\${collectionInfo.name} (\${collectionInfo.symbol})\` : 'Loading collection info...'}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Button onClick={loadOwnedNFTs} disabled={loading} className="w-full">
          {loading ? 'Loading...' : 'Load My NFTs'}
        </Button>

        {error && (
          <div className="p-3 bg-red-100 border border-red-300 rounded-md">
            <p className="text-red-700 text-sm">{error}</p>
          </div>
        )}

        {nfts.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {nfts.map((nft) => (
              <Card key={nft.tokenId} className="overflow-hidden">
                {nft.metadata?.image && (
                  <div className="aspect-square bg-gray-100">
                    <img
                      src={nft.metadata.image}
                      alt={nft.metadata.name || \`NFT #\${nft.tokenId}\`}
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}
                <CardContent className="p-4">
                  <h3 className="font-semibold text-lg">
                    {nft.metadata?.name || \`NFT #\${nft.tokenId}\`}
                  </h3>
                  {nft.metadata?.description && (
                    <p className="text-sm text-gray-600 mt-1">
                      {nft.metadata.description}
                    </p>
                  )}
                  <p className="text-xs text-gray-500 mt-2">
                    Token ID: {nft.tokenId}
                  </p>
                  
                  <div className="mt-3 space-y-2">
                    <Input
                      placeholder="Transfer to address"
                      id={\`transfer-\${nft.tokenId}\`}
                    />
                    <Button
                      size="sm"
                      className="w-full"
                      onClick={() => {
                        const input = document.getElementById(\`transfer-\${nft.tokenId}\`) as HTMLInputElement;
                        const toAddress = input?.value;
                        if (toAddress) {
                          transferNFT(nft.tokenId, toAddress);
                        }
                      }}
                    >
                      Transfer
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {nfts.length === 0 && !loading && (
          <div className="text-center py-8 text-gray-500">
            No NFTs found. Click "Load My NFTs" to check your collection.
          </div>
        )}
      </CardContent>
    </Card>
  );
};`
    }
  ]
};
export default nftManagementBlueprint;
