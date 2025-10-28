import { Connection, PublicKey, Transaction, SystemProgram, LAMPORTS_PER_SOL } from '@solana/web3.js';
import { ethers } from 'ethers';
import toast from 'react-hot-toast';

export interface PaymentResult {
  success: boolean;
  transactionHash?: string;
  amount?: string;
  error?: string;
}

export interface EscrowData {
  taskId: string;
  amount: string;
  freelancerAddress: string;
  clientAddress: string;
  tokenAddress?: string; // For ERC-20 tokens
}

class PaymentService {
  private static instance: PaymentService;
  private solanaConnection: Connection;
  private ethereumProvider: any;

  constructor() {
    this.solanaConnection = new Connection(
      process.env.NEXT_PUBLIC_SOLANA_RPC_URL || 'https://api.devnet.solana.com',
      'confirmed'
    );
    
    if (typeof window !== 'undefined' && window.ethereum) {
      this.ethereumProvider = new ethers.BrowserProvider(window.ethereum);
    }
  }

  public static getInstance(): PaymentService {
    if (!PaymentService.instance) {
      PaymentService.instance = new PaymentService();
    }
    return PaymentService.instance;
  }

  /**
   * Create escrow payment for Solana
   */
  async createSolanaEscrow(escrowData: EscrowData): Promise<PaymentResult> {
    try {
      const { amount, freelancerAddress, clientAddress } = escrowData;
      const amountInLamports = parseFloat(amount) * LAMPORTS_PER_SOL;

      // Create escrow account (simplified - in production you'd use a program)
      const escrowAccount = new PublicKey(freelancerAddress);
      const clientPublicKey = new PublicKey(clientAddress);

      // Create transaction to send SOL to escrow
      const transaction = new Transaction().add(
        SystemProgram.transfer({
          fromPubkey: clientPublicKey,
          toPubkey: escrowAccount,
          lamports: amountInLamports,
        })
      );

      // Get recent blockhash
      const { blockhash } = await this.solanaConnection.getLatestBlockhash();
      transaction.recentBlockhash = blockhash;
      transaction.feePayer = clientPublicKey;

      // Sign transaction (this would be done by the wallet)
      const signature = await this.signSolanaTransaction(transaction, clientPublicKey);
      
      // Send transaction
      const txHash = await this.solanaConnection.sendRawTransaction(transaction.serialize());
      
      // Confirm transaction
      await this.solanaConnection.confirmTransaction(txHash);

      return {
        success: true,
        transactionHash: txHash,
        amount: amount
      };
    } catch (error) {
      console.error('Solana escrow creation failed:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Release escrow payment for Solana
   */
  async releaseSolanaEscrow(escrowData: EscrowData): Promise<PaymentResult> {
    try {
      const { amount, freelancerAddress, clientAddress } = escrowData;
      const amountInLamports = parseFloat(amount) * LAMPORTS_PER_SOL;

      const freelancerPublicKey = new PublicKey(freelancerAddress);
      const clientPublicKey = new PublicKey(clientAddress);

      // In a real implementation, this would interact with an escrow program
      // For now, we'll simulate the release
      const transaction = new Transaction().add(
        SystemProgram.transfer({
          fromPubkey: clientPublicKey,
          toPubkey: freelancerPublicKey,
          lamports: amountInLamports,
        })
      );

      const { blockhash } = await this.solanaConnection.getLatestBlockhash();
      transaction.recentBlockhash = blockhash;
      transaction.feePayer = clientPublicKey;

      const signature = await this.signSolanaTransaction(transaction, clientPublicKey);
      const txHash = await this.solanaConnection.sendRawTransaction(transaction.serialize());
      
      await this.solanaConnection.confirmTransaction(txHash);

      return {
        success: true,
        transactionHash: txHash,
        amount: amount
      };
    } catch (error) {
      console.error('Solana escrow release failed:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Create escrow payment for Ethereum
   */
  async createEthereumEscrow(escrowData: EscrowData): Promise<PaymentResult> {
    try {
      if (!this.ethereumProvider) {
        throw new Error('Ethereum provider not available');
      }

      const { amount, freelancerAddress, clientAddress } = escrowData;
      const signer = await this.ethereumProvider.getSigner();
      
      // Convert amount to wei
      const amountInWei = ethers.parseEther(amount);

      // Create transaction
      const transaction = {
        to: freelancerAddress,
        value: amountInWei,
        gasLimit: 21000,
      };

      // Send transaction
      const tx = await signer.sendTransaction(transaction);
      
      // Wait for confirmation
      const receipt = await tx.wait();

      return {
        success: true,
        transactionHash: receipt.hash,
        amount: amount
      };
    } catch (error) {
      console.error('Ethereum escrow creation failed:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Release escrow payment for Ethereum
   */
  async releaseEthereumEscrow(escrowData: EscrowData): Promise<PaymentResult> {
    try {
      if (!this.ethereumProvider) {
        throw new Error('Ethereum provider not available');
      }

      const { amount, freelancerAddress, clientAddress } = escrowData;
      const signer = await this.ethereumProvider.getSigner();
      
      const amountInWei = ethers.parseEther(amount);

      const transaction = {
        to: freelancerAddress,
        value: amountInWei,
        gasLimit: 21000,
      };

      const tx = await signer.sendTransaction(transaction);
      const receipt = await tx.wait();

      return {
        success: true,
        transactionHash: receipt.hash,
        amount: amount
      };
    } catch (error) {
      console.error('Ethereum escrow release failed:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Process payment based on wallet type
   */
  async processPayment(escrowData: EscrowData, walletType: 'phantom' | 'metamask' | 'solflare'): Promise<PaymentResult> {
    try {
      let result: PaymentResult;

      if (walletType === 'phantom' || walletType === 'solflare') {
        result = await this.createSolanaEscrow(escrowData);
      } else if (walletType === 'metamask') {
        result = await this.createEthereumEscrow(escrowData);
      } else {
        throw new Error('Unsupported wallet type');
      }

      if (result.success) {
        toast.success(`Payment processed successfully! TX: ${result.transactionHash?.slice(0, 8)}...`);
      } else {
        toast.error(`Payment failed: ${result.error}`);
      }

      return result;
    } catch (error) {
      console.error('Payment processing failed:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Release payment based on wallet type
   */
  async releasePayment(escrowData: EscrowData, walletType: 'phantom' | 'metamask' | 'solflare'): Promise<PaymentResult> {
    try {
      let result: PaymentResult;

      if (walletType === 'phantom' || walletType === 'solflare') {
        result = await this.releaseSolanaEscrow(escrowData);
      } else if (walletType === 'metamask') {
        result = await this.releaseEthereumEscrow(escrowData);
      } else {
        throw new Error('Unsupported wallet type');
      }

      if (result.success) {
        toast.success(`Payment released successfully! TX: ${result.transactionHash?.slice(0, 8)}...`);
      } else {
        toast.error(`Payment release failed: ${result.error}`);
      }

      return result;
    } catch (error) {
      console.error('Payment release failed:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Get wallet balance
   */
  async getWalletBalance(address: string, walletType: 'phantom' | 'metamask' | 'solflare'): Promise<string> {
    try {
      if (walletType === 'phantom' || walletType === 'solflare') {
        const publicKey = new PublicKey(address);
        const balance = await this.solanaConnection.getBalance(publicKey);
        return (balance / LAMPORTS_PER_SOL).toString();
      } else if (walletType === 'metamask') {
        if (!this.ethereumProvider) {
          throw new Error('Ethereum provider not available');
        }
        const balance = await this.ethereumProvider.getBalance(address);
        return ethers.formatEther(balance);
      }
      
      throw new Error('Unsupported wallet type');
    } catch (error) {
      console.error('Failed to get wallet balance:', error);
      return '0';
    }
  }

  /**
   * Sign Solana transaction (placeholder - would integrate with wallet)
   */
  private async signSolanaTransaction(transaction: Transaction, publicKey: PublicKey): Promise<string> {
    // In a real implementation, this would integrate with Phantom/Solflare
    // For now, we'll return a mock signature
    return `mock_signature_${Date.now()}`;
  }

  /**
   * Verify transaction on blockchain
   */
  async verifyTransaction(transactionHash: string, walletType: 'phantom' | 'metamask' | 'solflare'): Promise<boolean> {
    try {
      if (walletType === 'phantom' || walletType === 'solflare') {
        const signature = await this.solanaConnection.getSignatureStatus(transactionHash);
        return signature.value?.confirmationStatus === 'confirmed';
      } else if (walletType === 'metamask') {
        if (!this.ethereumProvider) {
          return false;
        }
        const receipt = await this.ethereumProvider.getTransactionReceipt(transactionHash);
        return receipt && receipt.status === 1;
      }
      
      return false;
    } catch (error) {
      console.error('Transaction verification failed:', error);
      return false;
    }
  }
}

export const paymentService = PaymentService.getInstance();
