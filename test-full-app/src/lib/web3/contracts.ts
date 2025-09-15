import { ethers, Contract } from 'ethers';
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

export const contractManager = new ContractManager();
