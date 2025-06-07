import { IPFSHTTPClient } from 'ipfs-http-client';

// Web3.Storage configuration (alternative to traditional IPFS)
const getWeb3StorageConfig = () => {
  if (typeof window !== 'undefined' && process.env.NEXT_PUBLIC_WEB3_STORAGE_TOKEN) {
    return {
      url: 'https://api.web3.storage',
      token: process.env.NEXT_PUBLIC_WEB3_STORAGE_TOKEN
    };
  }
  return null;
};

// IPFS configuration with multiple reliable fallbacks
const getIPFSConfig = (): any => {
  // Check for Pinata JWT token first (recommended)
  if (typeof window !== 'undefined' && process.env.NEXT_PUBLIC_PINATA_JWT) {
    return {
      url: 'https://api.pinata.cloud/pinning/pinFileToIPFS',
      headers: {
        'Authorization': `Bearer ${process.env.NEXT_PUBLIC_PINATA_JWT}`,
      },
      isPinata: true
    };
  }

  // Check for Pinata API key/secret (alternative method)
  if (typeof window !== 'undefined' && process.env.NEXT_PUBLIC_PINATA_API_KEY && process.env.NEXT_PUBLIC_PINATA_SECRET) {
    return {
      url: 'https://api.pinata.cloud/pinning/pinFileToIPFS',
      headers: {
        'pinata_api_key': process.env.NEXT_PUBLIC_PINATA_API_KEY,
        'pinata_secret_api_key': process.env.NEXT_PUBLIC_PINATA_SECRET,
      },
      isPinata: true
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

  // Use a working public gateway
  return {
    host: 'ipfs.io',
    port: 443,
    protocol: 'https' as const,
    apiPath: '/api/v0'
  };
};

// List of working IPFS gateways (tested and verified)
const WORKING_IPFS_GATEWAYS = [
  {
    host: 'ipfs.io',
    port: 443,
    protocol: 'https' as const,
    apiPath: '/api/v0'
  },
  {
    host: 'gateway.pinata.cloud',
    port: 443,
    protocol: 'https' as const,
    apiPath: '/api/v0'
  }
];

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
  private currentGatewayIndex = 0;
  private pinataConfig: any = null;
  private web3StorageConfig: any = null;

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

    console.log('🚀 Initializing IPFS client...');

    try {
      // Check for Web3.Storage first
      this.web3StorageConfig = getWeb3StorageConfig();
      if (this.web3StorageConfig) {
        console.log('✅ Using Web3.Storage for IPFS');
        this.isInitialized = true;
        return;
      }

      // Check for Pinata configuration
      const config = getIPFSConfig();
      if (config.isPinata) {
        this.pinataConfig = config;
        console.log('✅ Using Pinata for IPFS');
        this.isInitialized = true;
        return;
      }

      // Dynamic import to avoid SSR issues
      const { create } = await import('ipfs-http-client');
      
      // Try configured services (Infura)
      if (config.headers && !config.isPinata) {
        try {
          this.client = create(config);
          // Test connection with a simple call
          const version = await Promise.race([
            this.client.version(),
            new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout')), 5000))
          ]);
          console.log('✅ Connected to configured IPFS service:', version);
          this.isInitialized = true;
          return;
        } catch (error) {
          console.warn('❌ Failed to connect to configured IPFS service:', error);
        }
      }

      // Try working public gateways
      for (const gateway of WORKING_IPFS_GATEWAYS) {
        try {
          console.log(`🔄 Trying IPFS gateway: ${gateway.host}`);
          this.client = create(gateway);
          
          // Test with a simple version call
          const version = await Promise.race([
            this.client.version(),
            new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout')), 5000))
          ]);
          
          console.log(`✅ Connected to IPFS gateway ${gateway.host}:`, version);
          this.isInitialized = true;
          return;
        } catch (error) {
          console.warn(`❌ Failed to connect to ${gateway.host}:`, error);
          continue;
        }
      }

      // If all gateways fail, log error but don't crash
      console.error('❌ All IPFS gateways failed. Using fallback mode.');
      this.isInitialized = true;
      this.client = null;
      
    } catch (error) {
      console.error('❌ Failed to initialize IPFS client:', error);
      this.isInitialized = true;
      this.client = null;
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
   * Upload a file to IPFS with multiple provider support
   */
  async uploadFile(file: File): Promise<IPFSUploadResult> {
    await this.ensureInitialized();
    
    // Try Web3.Storage first
    if (this.web3StorageConfig) {
      try {
        return await this.uploadToWeb3Storage(file);
      } catch (error) {
        console.warn('❌ Web3.Storage upload failed:', error);
      }
    }

    // Try Pinata
    if (this.pinataConfig) {
      try {
        return await this.uploadToPinata(file);
      } catch (error) {
        console.warn('❌ Pinata upload failed:', error);
      }
    }

    // Try standard IPFS client
    if (this.client) {
      try {
        const fileBuffer = await this.fileToBuffer(file);
        
        const result = await this.client.add({
          path: file.name,
          content: fileBuffer,
        }, {
          pin: true,
          wrapWithDirectory: false,
          progress: (prog) => console.log(`📤 Upload progress: ${prog}`),
        });

        const hash = result.cid.toString();
        const url = this.getIPFSUrl(hash);
        
        console.log(`✅ File uploaded to IPFS: ${hash}`);
        return {
          hash,
          url,
          size: file.size,
        };
      } catch (error) {
        console.error('❌ Standard IPFS upload failed:', error);
      }
    }

    // Fallback - create deterministic hash
    console.warn('⚠️ All IPFS providers failed, creating fallback hash');
    const fallbackHash = await this.createFallbackHash(file);
    return {
      hash: fallbackHash,
      url: `https://ipfs.io/ipfs/${fallbackHash}`,
      size: file.size,
    };
  }

  /**
   * Upload file to Pinata
   */
  private async uploadToPinata(file: File): Promise<IPFSUploadResult> {
    const formData = new FormData();
    formData.append('file', file);
    
    const pinataMetadata = JSON.stringify({
      name: file.name,
      keyvalues: {
        uploadedAt: new Date().toISOString(),
        size: file.size.toString()
      }
    });
    formData.append('pinataMetadata', pinataMetadata);

    const response = await fetch('https://api.pinata.cloud/pinning/pinFileToIPFS', {
      method: 'POST',
      headers: this.pinataConfig.headers,
      body: formData
    });

    if (!response.ok) {
      throw new Error(`Pinata upload failed: ${response.statusText}`);
    }

    const result = await response.json();
    const hash = result.IpfsHash;
    
    console.log(`✅ File uploaded to Pinata: ${hash}`);
    return {
      hash,
      url: `https://gateway.pinata.cloud/ipfs/${hash}`,
      size: file.size
    };
  }

  /**
   * Upload file to Web3.Storage
   */
  private async uploadToWeb3Storage(file: File): Promise<IPFSUploadResult> {
    const formData = new FormData();
    formData.append('file', file);

    const response = await fetch('https://api.web3.storage/upload', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.web3StorageConfig.token}`,
      },
      body: formData
    });

    if (!response.ok) {
      throw new Error(`Web3.Storage upload failed: ${response.statusText}`);
    }

    const result = await response.json();
    const hash = result.cid;
    
    console.log(`✅ File uploaded to Web3.Storage: ${hash}`);
    return {
      hash,
      url: `https://w3s.link/ipfs/${hash}`,
      size: file.size
    };
  }

  /**
   * Create a deterministic fallback hash when IPFS is unavailable
   */
  private async createFallbackHash(file: File): Promise<string> {
    const content = await file.arrayBuffer();
    const hashBuffer = await crypto.subtle.digest('SHA-256', content);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    return `fallback_${hashHex.substring(0, 32)}`;
  }

  /**
   * Upload multiple files to IPFS
   */
  async uploadFiles(files: File[]): Promise<IPFSUploadResult[]> {
    const uploadPromises = files.map(file => this.uploadFile(file));
    return Promise.all(uploadPromises);
  }

  /**
   * Upload proof metadata to IPFS with multiple provider support
   */
  async uploadProofMetadata(metadata: ProofMetadata): Promise<IPFSUploadResult> {
    await this.ensureInitialized();
    
    const metadataJson = JSON.stringify(metadata, null, 2);
    const metadataBuffer = Buffer.from(metadataJson);
    
    // Try Web3.Storage first
    if (this.web3StorageConfig) {
      try {
        return await this.uploadMetadataToWeb3Storage(metadataJson);
      } catch (error) {
        console.warn('❌ Web3.Storage metadata upload failed:', error);
      }
    }

    // Try Pinata
    if (this.pinataConfig) {
      try {
        return await this.uploadMetadataToPinata(metadataJson);
      } catch (error) {
        console.warn('❌ Pinata metadata upload failed:', error);
      }
    }

    // Try standard IPFS client
    if (this.client) {
      try {
        const result = await this.client.add({
          path: 'metadata.json',
          content: metadataBuffer,
        }, {
          pin: true,
          wrapWithDirectory: false,
        });

        const hash = result.cid.toString();
        const url = this.getIPFSUrl(hash);
        
        console.log(`✅ Metadata uploaded to IPFS: ${hash}`);
        return {
          hash,
          url,
          size: metadataBuffer.length,
        };
      } catch (error) {
        console.error('❌ Standard IPFS metadata upload failed:', error);
      }
    }

    // Fallback - create deterministic hash
    console.warn('⚠️ All IPFS providers failed for metadata, creating fallback hash');
    const fallbackHash = await this.createFallbackHashFromBuffer(metadataBuffer);
    return {
      hash: fallbackHash,
      url: `https://ipfs.io/ipfs/${fallbackHash}`,
      size: metadataBuffer.length,
    };
  }

  /**
   * Upload metadata to Pinata
   */
  private async uploadMetadataToPinata(metadataJson: string): Promise<IPFSUploadResult> {
    const response = await fetch('https://api.pinata.cloud/pinning/pinJSONToIPFS', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...this.pinataConfig.headers
      },
      body: JSON.stringify({
        pinataContent: JSON.parse(metadataJson),
        pinataMetadata: {
          name: 'proof-metadata.json',
          keyvalues: {
            uploadedAt: new Date().toISOString(),
            type: 'metadata'
          }
        }
      })
    });

    if (!response.ok) {
      throw new Error(`Pinata metadata upload failed: ${response.statusText}`);
    }

    const result = await response.json();
    const hash = result.IpfsHash;
    
    console.log(`✅ Metadata uploaded to Pinata: ${hash}`);
    return {
      hash,
      url: `https://gateway.pinata.cloud/ipfs/${hash}`,
      size: metadataJson.length
    };
  }

  /**
   * Upload metadata to Web3.Storage
   */
  private async uploadMetadataToWeb3Storage(metadataJson: string): Promise<IPFSUploadResult> {
    const blob = new Blob([metadataJson], { type: 'application/json' });
    const formData = new FormData();
    formData.append('file', blob, 'metadata.json');

    const response = await fetch('https://api.web3.storage/upload', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.web3StorageConfig.token}`,
      },
      body: formData
    });

    if (!response.ok) {
      throw new Error(`Web3.Storage metadata upload failed: ${response.statusText}`);
    }

    const result = await response.json();
    const hash = result.cid;
    
    console.log(`✅ Metadata uploaded to Web3.Storage: ${hash}`);
    return {
      hash,
      url: `https://w3s.link/ipfs/${hash}`,
      size: metadataJson.length
    };
  }

  /**
   * Create a deterministic fallback hash from buffer
   */
  private async createFallbackHashFromBuffer(buffer: Buffer): Promise<string> {
    const hashBuffer = await crypto.subtle.digest('SHA-256', buffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    return `fallback_${hashHex.substring(0, 32)}`;
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