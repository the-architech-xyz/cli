/**
 * Smart Contracts Feature Blueprint
 * 
 * Deploy and interact with smart contracts (ERC20, ERC721, ERC1155)
 */

import { Blueprint } from '../../../../types/adapter.js';

const smartContractsBlueprint: Blueprint = {
  id: 'web3-smart-contracts',
  name: 'Smart Contracts Integration',
  actions: [
    {
      type: 'CREATE_FILE',
      path: 'src/lib/web3/contracts.ts',
      content: `import Web3 from 'web3';
import { createWeb3Instance } from './config.js';

// Contract ABIs
export const CONTRACTS = {
  erc20: {
    abi: [
      {
        "constant": true,
        "inputs": [{"name": "_owner", "type": "address"}],
        "name": "balanceOf",
        "outputs": [{"name": "balance", "type": "uint256"}],
        "type": "function"
      },
      {
        "constant": false,
        "inputs": [
          {"name": "_to", "type": "address"},
          {"name": "_value", "type": "uint256"}
        ],
        "name": "transfer",
        "outputs": [{"name": "", "type": "bool"}],
        "type": "function"
      },
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
        "name": "decimals",
        "outputs": [{"name": "", "type": "uint8"}],
        "type": "function"
      }
    ]
  },
  erc721: {
    abi: [
      {
        "constant": true,
        "inputs": [{"name": "_tokenId", "type": "uint256"}],
        "name": "ownerOf",
        "outputs": [{"name": "", "type": "address"}],
        "type": "function"
      },
      {
        "constant": true,
        "inputs": [{"name": "_owner", "type": "address"}],
        "name": "balanceOf",
        "outputs": [{"name": "", "type": "uint256"}],
        "type": "function"
      },
      {
        "constant": false,
        "inputs": [
          {"name": "_to", "type": "address"},
          {"name": "_tokenId", "type": "uint256"}
        ],
        "name": "transferFrom",
        "outputs": [],
        "type": "function"
      },
      {
        "constant": true,
        "inputs": [{"name": "_tokenId", "type": "uint256"}],
        "name": "tokenURI",
        "outputs": [{"name": "", "type": "string"}],
        "type": "function"
      }
    ]
  },
  erc1155: {
    abi: [
      {
        "constant": true,
        "inputs": [
          {"name": "account", "type": "address"},
          {"name": "id", "type": "uint256"}
        ],
        "name": "balanceOf",
        "outputs": [{"name": "", "type": "uint256"}],
        "type": "function"
      },
      {
        "constant": false,
        "inputs": [
          {"name": "from", "type": "address"},
          {"name": "to", "type": "address"},
          {"name": "id", "type": "uint256"},
          {"name": "amount", "type": "uint256"},
          {"name": "data", "type": "bytes"}
        ],
        "name": "safeTransferFrom",
        "outputs": [],
        "type": "function"
      }
    ]
  }
};

export class ContractManager {
  private web3: Web3;

  constructor(web3?: Web3) {
    this.web3 = web3 || createWeb3Instance();
  }

  /**
   * Create a contract instance
   */
  createContract(contractAddress: string, abi: any[]) {
    return new this.web3.eth.Contract(abi, contractAddress);
  }

  /**
   * Get ERC20 token balance
   */
  async getERC20Balance(tokenAddress: string, walletAddress: string): Promise<string> {
    const contract = this.createContract(tokenAddress, CONTRACTS.erc20.abi);
    const balance = await contract.methods.balanceOf(walletAddress).call();
    return this.web3.utils.fromWei(balance, 'ether');
  }

  /**
   * Transfer ERC20 tokens
   */
  async transferERC20(
    tokenAddress: string,
    fromAddress: string,
    toAddress: string,
    amount: string,
    privateKey?: string
  ): Promise<string> {
    const contract = this.createContract(tokenAddress, CONTRACTS.erc20.abi);
    const amountWei = this.web3.utils.toWei(amount, 'ether');

    if (privateKey) {
      // Direct transaction with private key
      const tx = contract.methods.transfer(toAddress, amountWei);
      const gas = await tx.estimateGas({ from: fromAddress });
      const gasPrice = await this.web3.eth.getGasPrice();

      const txData = {
        from: fromAddress,
        gas,
        gasPrice,
        data: tx.encodeABI()
      };

      const signedTx = await this.web3.eth.accounts.signTransaction(txData, privateKey);
      const receipt = await this.web3.eth.sendSignedTransaction(signedTx.rawTransaction!);
      return receipt.transactionHash;
    } else {
      // MetaMask transaction
      return new Promise((resolve, reject) => {
        contract.methods.transfer(toAddress, amountWei)
          .send({ from: fromAddress })
          .on('transactionHash', (hash: string) => resolve(hash))
          .on('error', (error: any) => reject(error));
      });
    }
  }

  /**
   * Get ERC721 NFT owner
   */
  async getNFTOwner(nftAddress: string, tokenId: string): Promise<string> {
    const contract = this.createContract(nftAddress, CONTRACTS.erc721.abi);
    return await contract.methods.ownerOf(tokenId).call();
  }

  /**
   * Get ERC721 NFT balance
   */
  async getNFTBalance(nftAddress: string, walletAddress: string): Promise<number> {
    const contract = this.createContract(nftAddress, CONTRACTS.erc721.abi);
    const balance = await contract.methods.balanceOf(walletAddress).call();
    return parseInt(balance);
  }

  /**
   * Get ERC721 token URI
   */
  async getNFTTokenURI(nftAddress: string, tokenId: string): Promise<string> {
    const contract = this.createContract(nftAddress, CONTRACTS.erc721.abi);
    return await contract.methods.tokenURI(tokenId).call();
  }

  /**
   * Get ERC1155 balance
   */
  async getERC1155Balance(contractAddress: string, walletAddress: string, tokenId: string): Promise<number> {
    const contract = this.createContract(contractAddress, CONTRACTS.erc1155.abi);
    const balance = await contract.methods.balanceOf(walletAddress, tokenId).call();
    return parseInt(balance);
  }

  /**
   * Get transaction details
   */
  async getTransaction(txHash: string) {
    return await this.web3.eth.getTransaction(txHash);
  }

  /**
   * Get transaction receipt
   */
  async getTransactionReceipt(txHash: string) {
    return await this.web3.eth.getTransactionReceipt(txHash);
  }

  /**
   * Get block information
   */
  async getBlock(blockNumber: number | string) {
    return await this.web3.eth.getBlock(blockNumber);
  }

  /**
   * Get current gas price
   */
  async getGasPrice(): Promise<string> {
    const gasPrice = await this.web3.eth.getGasPrice();
    return this.web3.utils.fromWei(gasPrice, 'gwei');
  }

  /**
   * Estimate gas for a transaction
   */
  async estimateGas(txData: any): Promise<number> {
    return await this.web3.eth.estimateGas(txData);
  }
}

// Global contract manager instance
export const contractManager = new ContractManager();`
    },
    {
      type: 'CREATE_FILE',
      path: 'src/components/web3/ContractInteraction.tsx',
      content: `import React, { useState } from 'react';
import { useWallet } from '../../hooks/web3/useWallet.js';
import { contractManager } from '../../lib/web3/contracts.js';
import { Button } from '../ui/button.js';
import { Input } from '../ui/input.js';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card.js';

interface ContractInteractionProps {
  contractAddress: string;
  contractType: 'erc20' | 'erc721' | 'erc1155';
}

export const ContractInteraction: React.FC<ContractInteractionProps> = ({
  contractAddress,
  contractType
}) => {
  const { address, isConnected } = useWallet();
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<string>('');
  const [error, setError] = useState<string>('');

  // ERC20 specific state
  const [transferTo, setTransferTo] = useState('');
  const [transferAmount, setTransferAmount] = useState('');

  // ERC721/ERC1155 specific state
  const [tokenId, setTokenId] = useState('');

  const handleERC20Balance = async () => {
    if (!address) return;
    
    setLoading(true);
    setError('');
    
    try {
      const balance = await contractManager.getERC20Balance(contractAddress, address);
      setResult(\`Balance: \${balance} tokens\`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to get balance');
    } finally {
      setLoading(false);
    }
  };

  const handleERC20Transfer = async () => {
    if (!address || !transferTo || !transferAmount) return;
    
    setLoading(true);
    setError('');
    
    try {
      const txHash = await contractManager.transferERC20(
        contractAddress,
        address,
        transferTo,
        transferAmount
      );
      setResult(\`Transfer successful! TX: \${txHash}\`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to transfer tokens');
    } finally {
      setLoading(false);
    }
  };

  const handleERC721Owner = async () => {
    if (!tokenId) return;
    
    setLoading(true);
    setError('');
    
    try {
      const owner = await contractManager.getNFTOwner(contractAddress, tokenId);
      setResult(\`Owner of token \${tokenId}: \${owner}\`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to get NFT owner');
    } finally {
      setLoading(false);
    }
  };

  const handleERC721Balance = async () => {
    if (!address) return;
    
    setLoading(true);
    setError('');
    
    try {
      const balance = await contractManager.getNFTBalance(contractAddress, address);
      setResult(\`You own \${balance} NFTs\`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to get NFT balance');
    } finally {
      setLoading(false);
    }
  };

  const handleERC1155Balance = async () => {
    if (!address || !tokenId) return;
    
    setLoading(true);
    setError('');
    
    try {
      const balance = await contractManager.getERC1155Balance(contractAddress, address, tokenId);
      setResult(\`You own \${balance} of token \${tokenId}\`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to get ERC1155 balance');
    } finally {
      setLoading(false);
    }
  };

  if (!isConnected) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Contract Interaction</CardTitle>
          <CardDescription>
            Please connect your wallet to interact with contracts
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Contract Interaction</CardTitle>
        <CardDescription>
          Interact with {contractType.toUpperCase()} contract: {contractAddress.slice(0, 10)}...
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {contractType === 'erc20' && (
          <div className="space-y-4">
            <div className="space-y-2">
              <Button onClick={handleERC20Balance} disabled={loading} className="w-full">
                {loading ? 'Loading...' : 'Get Token Balance'}
              </Button>
            </div>
            
            <div className="space-y-2">
              <Input
                placeholder="Recipient address"
                value={transferTo}
                onChange={(e) => setTransferTo(e.target.value)}
              />
              <Input
                placeholder="Amount to transfer"
                value={transferAmount}
                onChange={(e) => setTransferAmount(e.target.value)}
              />
              <Button onClick={handleERC20Transfer} disabled={loading} className="w-full">
                {loading ? 'Transferring...' : 'Transfer Tokens'}
              </Button>
            </div>
          </div>
        )}

        {contractType === 'erc721' && (
          <div className="space-y-4">
            <div className="space-y-2">
              <Button onClick={handleERC721Balance} disabled={loading} className="w-full">
                {loading ? 'Loading...' : 'Get NFT Balance'}
              </Button>
            </div>
            
            <div className="space-y-2">
              <Input
                placeholder="Token ID"
                value={tokenId}
                onChange={(e) => setTokenId(e.target.value)}
              />
              <Button onClick={handleERC721Owner} disabled={loading} className="w-full">
                {loading ? 'Loading...' : 'Get NFT Owner'}
              </Button>
            </div>
          </div>
        )}

        {contractType === 'erc1155' && (
          <div className="space-y-4">
            <div className="space-y-2">
              <Input
                placeholder="Token ID"
                value={tokenId}
                onChange={(e) => setTokenId(e.target.value)}
              />
              <Button onClick={handleERC1155Balance} disabled={loading} className="w-full">
                {loading ? 'Loading...' : 'Get ERC1155 Balance'}
              </Button>
            </div>
          </div>
        )}

        {result && (
          <div className="p-3 bg-green-100 border border-green-300 rounded-md">
            <p className="text-green-700 text-sm">{result}</p>
          </div>
        )}

        {error && (
          <div className="p-3 bg-red-100 border border-red-300 rounded-md">
            <p className="text-red-700 text-sm">{error}</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};`
    }
  ]
};
export default smartContractsBlueprint;
