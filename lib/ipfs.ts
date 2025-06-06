import { IPFSHTTPClient } from 'ipfs-http-client';

// IPFS configuration with Pinata support
const getIPFSConfig = (): any => {
  // Check for Pinata configuration first
  if (typeof window !== 'undefined' && process.env.NEXT_PUBLIC_PINATA_JWT) {
    return {
      host: 'api.pinata.cloud',
      port: 443,
      protocol: 'https' as const,
      headers: {
        'Authorization': `Bearer ${process.env.NEXT_PUBLIC_PINATA_JWT}`,
      },
    };
  }

  // Fallback to Infura if configured
  if (typeof window !== 'undefined' && process.env.NEXT_PUBLIC_INFURA_PROJECT_ID) {
    return {
      host: 'ipfs.infura.io',
      port: 5001,
      protocol: 'https' as const,
      headers: {
        authorization: `Basic ${Buffer.from(
          process.env.NEXT_PUBLIC_INFURA_PROJECT_ID + ':' + process.env.NEXT_PUBLIC_INFURA_PROJECT_SECRET
        ).toString('base64')}`
      }
    };
  }

  // Default public gateway
  return {
    host: 'node0.preload.ipfs.io',
    port: 443,
    protocol: 'https' as const,
  };
};

// Alternative public IPFS gateway
const PUBLIC_IPFS_CONFIG = {
  host: 'node0.preload.ipfs.io',
  port: 443,
  protocol: 'https' as const,
};

export interface IPFSUploadResult {
  hash: string;
  url: string;
  size: number;
}

export interface ProofMetadata {
  title: string;
  description: string;
  type: string;
  tags: string[];
  timestamp: string;
  walletAddress: string;
  attachments?: {
    name: string;
    hash: string;
    type: string;
    size: number;
  }[];
  githubRepo?: string;
  liveDemo?: string;
  clientAddress?: string;
}

class IPFSService {
  private client: IPFSHTTPClient | null = null;
  private isInitialized = false;
  private initializationPromise: Promise<void> | null = null;

  constructor() {
    // Only initialize in browser environment
    if (typeof window !== 'undefined') {
      this.initializationPromise = this.initializeClient();
    }
  }

  private async initializeClient(): Promise<void> {
    if (this.isInitialized || typeof window === 'undefined') {
      return;
    }

    try {
      // Dynamic import to avoid SSR issues
      const { create } = await import('ipfs-http-client');
      
      // Try Infura first if credentials are available
      if (process.env.NEXT_PUBLIC_INFURA_PROJECT_ID) {
        try {
          this.client = create(getIPFSConfig());
          // Test connection with a simple call
          const version = await Promise.race([
            this.client.version(),
            new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout')), 5000))
          ]);
          console.log('Connected to Infura IPFS:', version);
          this.isInitialized = true;
          return;
        } catch (error) {
          console.warn('Failed to connect to Infura IPFS:', error);
        }
      }

      // Fallback to public gateway
      try {
        this.client = create(PUBLIC_IPFS_CONFIG);
        console.log('Connected to public IPFS gateway');
        this.isInitialized = true;
      } catch (fallbackError) {
        console.error('Failed to connect to any IPFS gateway:', fallbackError);
        throw new Error('Unable to connect to IPFS network');
      }
    } catch (error) {
      console.error('Failed to initialize IPFS client:', error);
      throw new Error('IPFS client initialization failed');
    }
  }

  private async ensureInitialized(): Promise<void> {
    if (typeof window === 'undefined') {
      throw new Error('IPFS client can only be used in browser environment');
    }

    if (this.isInitialized && this.client) {
      return;
    }

    if (this.initializationPromise) {
      await this.initializationPromise;
    } else {
      this.initializationPromise = this.initializeClient();
      await this.initializationPromise;
    }

    if (!this.client) {
      throw new Error('IPFS client not initialized');
    }
  }

  /**
   * Upload a file to IPFS
   */
  async uploadFile(file: File): Promise<IPFSUploadResult> {
    await this.ensureInitialized();
    
    if (!this.client) {
      throw new Error('IPFS client not available');
    }

    try {
      const fileBuffer = await this.fileToBuffer(file);
      
      const result = await this.client.add({
        path: file.name,
        content: fileBuffer,
      }, {
        pin: true,
        wrapWithDirectory: false,
        progress: (prog) => console.log(`Upload progress: ${prog}`),
      });

      const hash = result.cid.toString();
      const url = this.getIPFSUrl(hash);

      return {
        hash,
        url,
        size: file.size,
      };
    } catch (error) {
      console.error('File upload failed:', error);
      throw new Error(`Failed to upload file: ${(error as Error).message}`);
    }
  }

  /**
   * Upload multiple files to IPFS
   */
  async uploadFiles(files: File[]): Promise<IPFSUploadResult[]> {
    const uploadPromises = files.map(file => this.uploadFile(file));
    return Promise.all(uploadPromises);
  }

  /**
   * Upload proof metadata to IPFS
   */
  async uploadProofMetadata(metadata: ProofMetadata): Promise<IPFSUploadResult> {
    await this.ensureInitialized();
    
    if (!this.client) {
      throw new Error('IPFS client not available');
    }

    try {
      const metadataJson = JSON.stringify(metadata, null, 2);
      const metadataBuffer = Buffer.from(metadataJson);

      const result = await this.client.add({
        path: 'metadata.json',
        content: metadataBuffer,
      }, {
        pin: true,
        wrapWithDirectory: false,
      });

      const hash = result.cid.toString();
      const url = this.getIPFSUrl(hash);

      return {
        hash,
        url,
        size: metadataBuffer.length,
      };
    } catch (error) {
      console.error('Metadata upload failed:', error);
      throw new Error(`Failed to upload metadata: ${(error as Error).message}`);
    }
  }

  /**
   * Retrieve content from IPFS
   */
  async getContent(hash: string): Promise<string> {
    await this.ensureInitialized();
    
    if (!this.client) {
      throw new Error('IPFS client not available');
    }

    try {
      const chunks = [];
      for await (const chunk of this.client.cat(hash)) {
        chunks.push(chunk);
      }
      
      return Buffer.concat(chunks).toString();
    } catch (error) {
      console.error('Failed to retrieve content:', error);
      throw new Error(`Failed to retrieve content: ${(error as Error).message}`);
    }
  }

  /**
   * Retrieve and parse proof metadata from IPFS
   */
  async getProofMetadata(hash: string): Promise<ProofMetadata> {
    try {
      const content = await this.getContent(hash);
      return JSON.parse(content);
    } catch (error) {
      console.error('Failed to parse metadata:', error);
      throw new Error(`Failed to parse metadata: ${(error as Error).message}`);
    }
  }

  /**
   * Pin content to IPFS (keep it available)
   */
  async pinContent(hash: string): Promise<void> {
    await this.ensureInitialized();
    
    if (!this.client) {
      throw new Error('IPFS client not available');
    }

    try {
      await this.client.pin.add(hash);
      console.log(`Content pinned: ${hash}`);
    } catch (error) {
      console.error('Failed to pin content:', error);
      throw new Error(`Failed to pin content: ${(error as Error).message}`);
    }
  }

  /**
   * Unpin content from IPFS
   */
  async unpinContent(hash: string): Promise<void> {
    await this.ensureInitialized();
    
    if (!this.client) {
      throw new Error('IPFS client not available');
    }

    try {
      await this.client.pin.rm(hash);
      console.log(`Content unpinned: ${hash}`);
    } catch (error) {
      console.error('Failed to unpin content:', error);
      throw new Error(`Failed to unpin content: ${(error as Error).message}`);
    }
  }

  /**
   * Get IPFS gateway URL for a hash
   */
  getIPFSUrl(hash: string): string {
    // Use multiple gateways for redundancy
    const gateways = [
      'https://ipfs.io/ipfs/',
      'https://gateway.pinata.cloud/ipfs/',
      'https://cloudflare-ipfs.com/ipfs/',
      'https://dweb.link/ipfs/',
    ];
    
    // Return the first gateway URL (could be randomized for load balancing)
    return `${gateways[0]}${hash}`;
  }

  /**
   * Convert File to Buffer
   */
  private async fileToBuffer(file: File): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        if (reader.result instanceof ArrayBuffer) {
          resolve(Buffer.from(reader.result));
        } else {
          reject(new Error('Failed to read file as ArrayBuffer'));
        }
      };
      reader.onerror = () => reject(reader.error);
      reader.readAsArrayBuffer(file);
    });
  }

  /**
   * Check if IPFS content is available
   */
  async isContentAvailable(hash: string): Promise<boolean> {
    try {
      await this.ensureInitialized();
      
      if (!this.client) {
        return false;
      }

      // Try to get just the first byte to check availability
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 second timeout
      
      for await (const chunk of this.client.cat(hash, { 
        signal: controller.signal,
        length: 1 
      })) {
        clearTimeout(timeoutId);
        return true;
      }
      return false;
    } catch (error) {
      console.warn(`Content not available: ${hash}`, error);
      return false;
    }
  }

  /**
   * Upload complete proof with files and metadata
   */
  async uploadCompleteProof(
    metadata: Omit<ProofMetadata, 'attachments'>,
    files: File[]
  ): Promise<{
    metadataHash: string;
    metadataUrl: string;
    attachments: IPFSUploadResult[];
    totalSize: number;
  }> {
    try {
      // Upload files first
      const attachments = await this.uploadFiles(files);
      
      // Create complete metadata with attachment info
      const completeMetadata: ProofMetadata = {
        ...metadata,
        attachments: attachments.map((attachment, index) => ({
          name: files[index].name,
          hash: attachment.hash,
          type: files[index].type,
          size: attachment.size,
        })),
      };

      // Upload metadata
      const metadataResult = await this.uploadProofMetadata(completeMetadata);
      
      const totalSize = attachments.reduce((sum, att) => sum + att.size, 0) + metadataResult.size;

      return {
        metadataHash: metadataResult.hash,
        metadataUrl: metadataResult.url,
        attachments,
        totalSize,
      };
    } catch (error) {
      console.error('Complete proof upload failed:', error);
      throw new Error(`Failed to upload complete proof: ${(error as Error).message}`);
    }
  }

  /**
   * Check if IPFS is available
   */
  isAvailable(): boolean {
    return typeof window !== 'undefined' && this.isInitialized && this.client !== null;
  }
}

// Create singleton instance - but only initialize when needed
let ipfsServiceInstance: IPFSService | null = null;

export const ipfsService = new Proxy({} as IPFSService, {
  get(target, prop) {
    if (!ipfsServiceInstance) {
      ipfsServiceInstance = new IPFSService();
    }
    return ipfsServiceInstance[prop as keyof IPFSService];
  }
});

// Export utility functions
export const formatIPFSHash = (hash: string): string => {
  if (hash.length <= 12) return hash;
  return `${hash.substring(0, 8)}...${hash.substring(hash.length - 4)}`;
};

export const validateIPFSHash = (hash: string): boolean => {
  // Basic IPFS hash validation (CIDv0 and CIDv1)
  const ipfsHashRegex = /^(Qm[a-zA-Z0-9]{44}|ba[a-z2-7]{57}|b[a-z2-7]{58,})$/;
  return ipfsHashRegex.test(hash);
};

export const getFileTypeFromName = (filename: string): string => {
  const extension = filename.split('.').pop()?.toLowerCase();
  
  const imageTypes = ['jpg', 'jpeg', 'png', 'gif', 'svg', 'webp'];
  const documentTypes = ['pdf', 'doc', 'docx', 'txt', 'md'];
  const codeTypes = ['js', 'ts', 'jsx', 'tsx', 'py', 'sol', 'rs', 'go'];
  
  if (imageTypes.includes(extension || '')) return 'image';
  if (documentTypes.includes(extension || '')) return 'document';
  if (codeTypes.includes(extension || '')) return 'code';
  
  return 'file';
}; 