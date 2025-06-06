import { Connection, PublicKey, Transaction, SystemProgram, LAMPORTS_PER_SOL } from '@solana/web3.js';
import { useWallet } from '@solana/wallet-adapter-react';

// Blockchain network configurations
export const SOLANA_NETWORKS = {
  mainnet: 'https://api.mainnet-beta.solana.com',
  devnet: 'https://api.devnet.solana.com',
  testnet: 'https://api.testnet.solana.com',
};

export const ETHEREUM_NETWORKS = {
  mainnet: 'https://mainnet.infura.io/v3/YOUR_PROJECT_ID',
  goerli: 'https://goerli.infura.io/v3/YOUR_PROJECT_ID',
  sepolia: 'https://sepolia.infura.io/v3/YOUR_PROJECT_ID',
  polygon: 'https://polygon-mainnet.infura.io/v3/YOUR_PROJECT_ID',
};

// Types for blockchain operations
export interface ProofRecord {
  id: string;
  walletAddress: string;
  ipfsHash: string;
  timestamp: number;
  signature: string;
  blockHash?: string;
  transactionHash?: string;
}

export interface EndorsementRecord {
  proofId: string;
  endorserAddress: string;
  message: string;
  timestamp: number;
  signature: string;
  transactionHash?: string;
}

export interface BlockchainService {
  submitProof(ipfsHash: string, metadata: any): Promise<ProofRecord>;
  endorseProof(proofId: string, message: string): Promise<EndorsementRecord>;
  getProofsByWallet(walletAddress: string): Promise<ProofRecord[]>;
  getEndorsementsByProof(proofId: string): Promise<EndorsementRecord[]>;
  verifySignature(message: string, signature: string, address: string): Promise<boolean>;
}

/**
 * Solana Blockchain Service
 */
export class SolanaService implements BlockchainService {
  private connection: Connection;
  private network: string;

  constructor(network: keyof typeof SOLANA_NETWORKS = 'devnet') {
    this.network = network;
    this.connection = new Connection(SOLANA_NETWORKS[network], 'confirmed');
  }

  async submitProof(ipfsHash: string, metadata: any): Promise<ProofRecord> {
    try {
      // In a real implementation, this would interact with a deployed Solana program
      // For now, we'll simulate the process
      
      const walletAddress = 'demo-wallet-address'; // Would come from connected wallet
      const timestamp = Date.now();
      
      // Create a mock transaction (in reality, this would be a program instruction)
      const mockTransaction = {
        id: `proof_${timestamp}_${Math.random().toString(36).substr(2, 9)}`,
        walletAddress,
        ipfsHash,
        timestamp,
        signature: await this.signMessage(`proof:${ipfsHash}:${timestamp}`),
        transactionHash: `solana_tx_${Math.random().toString(36).substr(2, 20)}`,
      };

      return mockTransaction;
    } catch (error) {
      console.error('Solana proof submission failed:', error);
      throw new Error(`Failed to submit proof to Solana: ${(error as Error).message}`);
    }
  }

  async endorseProof(proofId: string, message: string): Promise<EndorsementRecord> {
    try {
      const endorserAddress = 'demo-endorser-address'; // Would come from connected wallet
      const timestamp = Date.now();
      
      const endorsement: EndorsementRecord = {
        proofId,
        endorserAddress,
        message,
        timestamp,
        signature: await this.signMessage(`endorsement:${proofId}:${message}:${timestamp}`),
        transactionHash: `solana_endorsement_${Math.random().toString(36).substr(2, 20)}`,
      };

      return endorsement;
    } catch (error) {
      console.error('Solana endorsement failed:', error);
      throw new Error(`Failed to endorse proof on Solana: ${(error as Error).message}`);
    }
  }

  async getProofsByWallet(walletAddress: string): Promise<ProofRecord[]> {
    try {
      // In a real implementation, this would query the Solana program's accounts
      // For now, return mock data
      return [
        {
          id: 'proof_1',
          walletAddress,
          ipfsHash: 'QmExample1...',
          timestamp: Date.now() - 86400000, // 1 day ago
          signature: 'solana_signature_1',
          transactionHash: 'solana_tx_1',
        },
      ];
    } catch (error) {
      console.error('Failed to get Solana proofs:', error);
      throw new Error(`Failed to get proofs from Solana: ${(error as Error).message}`);
    }
  }

  async getEndorsementsByProof(proofId: string): Promise<EndorsementRecord[]> {
    try {
      // Mock implementation
      return [
        {
          proofId,
          endorserAddress: 'demo_endorser',
          message: 'Great work!',
          timestamp: Date.now() - 3600000, // 1 hour ago
          signature: 'solana_endorsement_signature',
          transactionHash: 'solana_endorsement_tx',
        },
      ];
    } catch (error) {
      console.error('Failed to get Solana endorsements:', error);
      throw new Error(`Failed to get endorsements from Solana: ${(error as Error).message}`);
    }
  }

  async verifySignature(message: string, signature: string, address: string): Promise<boolean> {
    try {
      // In a real implementation, this would verify the signature using Solana's crypto library
      // For now, return true for demo purposes
      return true;
    } catch (error) {
      console.error('Solana signature verification failed:', error);
      return false;
    }
  }

  private async signMessage(message: string): Promise<string> {
    // In a real implementation, this would use the connected wallet to sign
    // For now, return a mock signature
    return `solana_signature_${Date.now()}_${Math.random().toString(36).substr(2, 10)}`;
  }

  async getBalance(address: string): Promise<number> {
    try {
      const publicKey = new PublicKey(address);
      const balance = await this.connection.getBalance(publicKey);
      return balance / LAMPORTS_PER_SOL;
    } catch (error) {
      console.error('Failed to get Solana balance:', error);
      return 0;
    }
  }
}

/**
 * Ethereum Blockchain Service
 */
export class EthereumService implements BlockchainService {
  private network: string;
  private provider: any; // Would be ethers provider in real implementation

  constructor(network: keyof typeof ETHEREUM_NETWORKS = 'sepolia') {
    this.network = network;
    // In a real implementation, would initialize ethers provider here
    this.provider = null;
  }

  async submitProof(ipfsHash: string, metadata: any): Promise<ProofRecord> {
    try {
      // Mock implementation for Ethereum
      const walletAddress = 'demo-eth-wallet'; // Would come from connected wallet
      const timestamp = Date.now();
      
      const mockTransaction: ProofRecord = {
        id: `eth_proof_${timestamp}_${Math.random().toString(36).substr(2, 9)}`,
        walletAddress,
        ipfsHash,
        timestamp,
        signature: await this.signMessage(`proof:${ipfsHash}:${timestamp}`),
        transactionHash: `0x${Math.random().toString(16).substr(2, 64)}`,
      };

      return mockTransaction;
    } catch (error) {
      console.error('Ethereum proof submission failed:', error);
      throw new Error(`Failed to submit proof to Ethereum: ${(error as Error).message}`);
    }
  }

  async endorseProof(proofId: string, message: string): Promise<EndorsementRecord> {
    try {
      const endorserAddress = 'demo-eth-endorser';
      const timestamp = Date.now();
      
      const endorsement: EndorsementRecord = {
        proofId,
        endorserAddress,
        message,
        timestamp,
        signature: await this.signMessage(`endorsement:${proofId}:${message}:${timestamp}`),
        transactionHash: `0x${Math.random().toString(16).substr(2, 64)}`,
      };

      return endorsement;
    } catch (error) {
      console.error('Ethereum endorsement failed:', error);
      throw new Error(`Failed to endorse proof on Ethereum: ${(error as Error).message}`);
    }
  }

  async getProofsByWallet(walletAddress: string): Promise<ProofRecord[]> {
    try {
      // Mock implementation
      return [
        {
          id: 'eth_proof_1',
          walletAddress,
          ipfsHash: 'QmEthExample1...',
          timestamp: Date.now() - 172800000, // 2 days ago
          signature: 'eth_signature_1',
          transactionHash: '0xeth_tx_1',
        },
      ];
    } catch (error) {
      console.error('Failed to get Ethereum proofs:', error);
      throw new Error(`Failed to get proofs from Ethereum: ${(error as Error).message}`);
    }
  }

  async getEndorsementsByProof(proofId: string): Promise<EndorsementRecord[]> {
    try {
      // Mock implementation
      return [
        {
          proofId,
          endorserAddress: 'demo_eth_endorser',
          message: 'Excellent quality work!',
          timestamp: Date.now() - 7200000, // 2 hours ago
          signature: 'eth_endorsement_signature',
          transactionHash: '0xeth_endorsement_tx',
        },
      ];
    } catch (error) {
      console.error('Failed to get Ethereum endorsements:', error);
      throw new Error(`Failed to get endorsements from Ethereum: ${(error as Error).message}`);
    }
  }

  async verifySignature(message: string, signature: string, address: string): Promise<boolean> {
    try {
      // In a real implementation, would use ethers.js to verify signature
      return true;
    } catch (error) {
      console.error('Ethereum signature verification failed:', error);
      return false;
    }
  }

  private async signMessage(message: string): Promise<string> {
    // In a real implementation, would use connected wallet to sign
    return `eth_signature_${Date.now()}_${Math.random().toString(36).substr(2, 10)}`;
  }

  async getBalance(address: string): Promise<number> {
    try {
      // In a real implementation, would query ETH balance
      return 0;
    } catch (error) {
      console.error('Failed to get Ethereum balance:', error);
      return 0;
    }
  }
}

/**
 * Multi-chain service that can work with different blockchains
 */
export class MultiChainService {
  private solanaService: SolanaService;
  private ethereumService: EthereumService;
  private currentChain: 'solana' | 'ethereum';

  constructor(defaultChain: 'solana' | 'ethereum' = 'solana') {
    this.solanaService = new SolanaService();
    this.ethereumService = new EthereumService();
    this.currentChain = defaultChain;
  }

  switchChain(chain: 'solana' | 'ethereum') {
    this.currentChain = chain;
  }

  getCurrentService(): BlockchainService {
    return this.currentChain === 'solana' ? this.solanaService : this.ethereumService;
  }

  async submitProof(ipfsHash: string, metadata: any): Promise<ProofRecord> {
    return this.getCurrentService().submitProof(ipfsHash, metadata);
  }

  async endorseProof(proofId: string, message: string): Promise<EndorsementRecord> {
    return this.getCurrentService().endorseProof(proofId, message);
  }

  async getProofsByWallet(walletAddress: string): Promise<ProofRecord[]> {
    return this.getCurrentService().getProofsByWallet(walletAddress);
  }

  async getEndorsementsByProof(proofId: string): Promise<EndorsementRecord[]> {
    return this.getCurrentService().getEndorsementsByProof(proofId);
  }

  async verifySignature(message: string, signature: string, address: string): Promise<boolean> {
    return this.getCurrentService().verifySignature(message, signature, address);
  }

  getChainExplorerUrl(transactionHash: string): string {
    if (this.currentChain === 'solana') {
      return `https://explorer.solana.com/tx/${transactionHash}?cluster=devnet`;
    } else {
      return `https://sepolia.etherscan.io/tx/${transactionHash}`;
    }
  }
}

// Export singleton instance
export const blockchainService = new MultiChainService();

// Utility functions
export const formatWalletAddress = (address: string): string => {
  if (address.length <= 12) return address;
  return `${address.substring(0, 6)}...${address.substring(address.length - 4)}`;
};

export const validateWalletAddress = (address: string, chain: 'solana' | 'ethereum'): boolean => {
  if (chain === 'solana') {
    // Solana addresses are base58 encoded and 32-44 characters long
    return /^[A-HJ-NP-Za-km-z1-9]{32,44}$/.test(address);
  } else {
    // Ethereum addresses are hex and 42 characters long (including 0x)
    return /^0x[a-fA-F0-9]{40}$/.test(address);
  }
};

export const getChainName = (chain: 'solana' | 'ethereum'): string => {
  return chain === 'solana' ? 'Solana' : 'Ethereum';
};

export const getChainIcon = (chain: 'solana' | 'ethereum'): string => {
  return chain === 'solana' ? '◎' : 'Ξ';
}; 