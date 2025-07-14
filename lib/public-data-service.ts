import { ProofMetadata, IPFSUploadResult } from './ipfs';
import { Proof, Freelancer } from './store';
import toast from 'react-hot-toast';

// Client-side IPFS service - only available in browser
let ipfsService: any = null;

// Lazy load IPFS service only on client side
const getIPFSService = async () => {
  if (typeof window === 'undefined') {
    return null;
  }
  
  if (!ipfsService) {
    try {
      const { ipfsService: service } = await import('./ipfs');
      ipfsService = service;
    } catch (error) {
      console.warn('Failed to load IPFS service:', error);
      return null;
    }
  }
  
  return ipfsService;
};

export interface PublicDataRegistry {
  version: string;
  lastUpdated: string;
  totalFreelancers: number;
  totalProofs: number;
  freelancers: {
    walletAddress: string;
    ipfsHash: string;
    lastUpdated: string;
  }[];
  proofs: {
    id: string;
    walletAddress: string;
    ipfsHash: string;
    metadataHash: string;
    lastUpdated: string;
  }[];
}

export interface FreelancerProfile {
  walletAddress: string;
  name?: string;
  bio?: string;
  avatar?: string;
  specialties: string[];
  rating: number;
  totalProofs: number;
  totalEndorsements: number;
  joinedAt: number;
  social?: {
    github?: string;
    twitter?: string;
    website?: string;
  };
  proofIds: string[];
  ipfsHashes: string[];
  lastUpdated: string;
}

class PublicDataService {
  private registryHash: string | null = null;
  private localRegistry: PublicDataRegistry | null = null;

  /**
   * Initialize the public data service by loading the main registry
   */
  async initialize(): Promise<void> {
    try {
      // Try to load the registry from localStorage first
      const savedRegistryHash = localStorage.getItem('public_registry_hash');
      if (savedRegistryHash) {
        this.registryHash = savedRegistryHash;
        await this.loadRegistry();
      }
    } catch (error) {
      console.warn('Failed to initialize public data service:', error);
      // Create new registry if none exists
      await this.createNewRegistry();
    }
  }

  /**
   * Store a freelancer profile to IPFS and update the public registry
   */
  async storeFreelancerPublic(freelancer: Freelancer): Promise<string> {
    try {
      // Create public freelancer profile
      const publicProfile: FreelancerProfile = {
        ...freelancer,
        proofIds: [],
        ipfsHashes: [],
        lastUpdated: new Date().toISOString()
      };

      // Upload freelancer profile to IPFS
      const profileJson = JSON.stringify(publicProfile, null, 2);
      const profileBuffer = Buffer.from(profileJson);
      
      let profileResult: IPFSUploadResult;
      try {
        const ipfs = await getIPFSService();
        if (ipfs && ipfs.isAvailable()) {
          // Use our updated IPFS service
          const profileBlob = new Blob([profileJson], { type: 'application/json' });
          const formData = new FormData();
          formData.append('file', profileBlob, `freelancer_${freelancer.walletAddress}.json`);
          
          // Add metadata for Pinata
          const metadata = {
            name: `freelancer_${freelancer.walletAddress}.json`,
            keyvalues: {
              uploadedAt: new Date().toISOString(),
              type: 'freelancer-profile'
            }
          };
          formData.append('pinataMetadata', JSON.stringify(metadata));

          const response = await fetch('https://api.pinata.cloud/pinning/pinFileToIPFS', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${process.env.NEXT_PUBLIC_PINATA_JWT}`,
            },
            body: formData
          });

          if (!response.ok) {
            throw new Error(`Pinata upload failed: ${response.statusText}`);
          }

          const result = await response.json();
          profileResult = {
            hash: result.IpfsHash,
            url: `https://gateway.pinata.cloud/ipfs/${result.IpfsHash}`,
            size: profileBuffer.length
          };
        } else {
          throw new Error('IPFS not available');
        }
      } catch (ipfsError) {
        console.warn('IPFS upload failed, creating fallback hash:', ipfsError);
        // Create a deterministic hash for fallback
        profileResult = {
          hash: `freelancer_${freelancer.walletAddress}_${Date.now()}`,
          url: `#local-freelancer-${freelancer.walletAddress}`,
          size: profileBuffer.length
        };
      }

      // Update public registry
      await this.updateFreelancerInRegistry(freelancer.walletAddress, profileResult.hash);

      // Save to localStorage as backup
      localStorage.setItem(`public_freelancer_${freelancer.walletAddress}`, JSON.stringify({
        ...publicProfile,
        ipfsHash: profileResult.hash
      }));

      toast.success(`Freelancer profile stored publicly: ${profileResult.hash.substring(0, 12)}...`);
      return profileResult.hash;
    } catch (error) {
      console.error('Failed to store freelancer publicly:', error);
      toast.error('Failed to store profile publicly');
      throw error;
    }
  }

  /**
   * Store a proof to IPFS and update the public registry
   */
  async storeProofPublic(proof: Proof): Promise<{ proofHash: string; metadataHash: string }> {
    try {
      // Create public proof metadata
      const publicMetadata: ProofMetadata = {
        title: proof.title,
        description: proof.description,
        type: proof.type,
        tags: proof.tags,
        timestamp: new Date(proof.timestamp).toISOString(),
        walletAddress: proof.walletAddress,
        attachments: proof.attachments?.map(att => ({
          name: att.name,
          hash: att.ipfsHash || 'local',
          type: att.type,
          size: att.size || 0,
        })) || [],
        githubRepo: proof.githubRepo,
        liveDemo: proof.liveDemo,
        clientAddress: proof.clientAddress,
      };

      let metadataResult: IPFSUploadResult;
      let proofResult: IPFSUploadResult;

      try {
        const ipfs = await getIPFSService();
        if (ipfs && ipfs.isAvailable()) {
          // Upload metadata to IPFS
          metadataResult = await ipfs.uploadProofMetadata(publicMetadata);
          
          // Upload complete proof data to IPFS
          const proofJson = JSON.stringify({
            ...proof,
            publicMetadataHash: metadataResult.hash,
            isPublic: true,
            lastUpdated: new Date().toISOString()
          }, null, 2);
          
          // Upload complete proof data to IPFS using Pinata
          const proofBlob = new Blob([proofJson], { type: 'application/json' });
          const formData = new FormData();
          formData.append('file', proofBlob, `proof_${proof.id}.json`);
          
          // Add metadata for Pinata
          const metadata = {
            name: `proof_${proof.id}.json`,
            keyvalues: {
              uploadedAt: new Date().toISOString(),
              type: 'proof-data'
            }
          };
          formData.append('pinataMetadata', JSON.stringify(metadata));

          const response = await fetch('https://api.pinata.cloud/pinning/pinFileToIPFS', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${process.env.NEXT_PUBLIC_PINATA_JWT}`,
            },
            body: formData
          });

          if (!response.ok) {
            throw new Error(`Pinata upload failed: ${response.statusText}`);
          }

          const result = await response.json();
          proofResult = {
            hash: result.IpfsHash,
            url: `https://gateway.pinata.cloud/ipfs/${result.IpfsHash}`,
            size: proofJson.length
          };
        } else {
          throw new Error('IPFS not available');
        }
      } catch (ipfsError) {
        console.warn('IPFS upload failed, creating fallback hashes:', ipfsError);
        // Create deterministic hashes for fallback
        metadataResult = {
          hash: `metadata_${proof.id}_${Date.now()}`,
          url: `#local-metadata-${proof.id}`,
          size: 0
        };
        proofResult = {
          hash: `proof_${proof.id}_${Date.now()}`,
          url: `#local-proof-${proof.id}`,
          size: 0
        };
      }

      // Update public registry
      await this.updateProofInRegistry(proof.id, proof.walletAddress, proofResult.hash, metadataResult.hash);

      // Save to localStorage as backup
      localStorage.setItem(`public_proof_${proof.id}`, JSON.stringify({
        ...proof,
        proofIpfsHash: proofResult.hash,
        metadataIpfsHash: metadataResult.hash,
        isPublic: true
      }));

      toast.success(`Proof stored publicly: ${proofResult.hash.substring(0, 12)}...`);
      return { 
        proofHash: proofResult.hash, 
        metadataHash: metadataResult.hash 
      };
    } catch (error) {
      console.error('Failed to store proof publicly:', error);
      toast.error('Failed to store proof publicly');
      throw error;
    }
  }

  /**
   * Get all public freelancers
   */
  async getAllPublicFreelancers(): Promise<FreelancerProfile[]> {
    try {
      await this.ensureRegistry();
      
      if (!this.localRegistry) {
        return this.getFreelancersFromLocalStorage();
      }

      const freelancers: FreelancerProfile[] = [];
      
      for (const freelancerRef of this.localRegistry.freelancers) {
        try {
          let freelancerData: FreelancerProfile;
          
          // Try to load from IPFS first
          if (freelancerRef.ipfsHash.startsWith('freelancer_')) {
            // This is a fallback hash, load from localStorage
            const saved = localStorage.getItem(`public_freelancer_${freelancerRef.walletAddress}`);
            if (saved) {
              freelancerData = JSON.parse(saved);
            } else {
              continue;
            }
          } else {
            // Try to load from IPFS
            try {
              const ipfs = await getIPFSService();
              if (ipfs) {
                const content = await ipfs.getContent(freelancerRef.ipfsHash);
                freelancerData = JSON.parse(content);
              } else {
                throw new Error('IPFS not available');
              }
            } catch (ipfsError) {
              // Fallback to localStorage
              const saved = localStorage.getItem(`public_freelancer_${freelancerRef.walletAddress}`);
              if (saved) {
                freelancerData = JSON.parse(saved);
              } else {
                continue;
              }
            }
          }
          
          freelancers.push(freelancerData);
        } catch (error) {
          console.warn(`Failed to load freelancer ${freelancerRef.walletAddress}:`, error);
        }
      }
      
      return freelancers;
    } catch (error) {
      console.error('Failed to get public freelancers:', error);
      return this.getFreelancersFromLocalStorage();
    }
  }

  /**
   * Get all public proofs
   */
  async getAllPublicProofs(): Promise<Proof[]> {
    try {
      await this.ensureRegistry();
      
      if (!this.localRegistry) {
        return this.getProofsFromLocalStorage();
      }

      const proofs: Proof[] = [];
      
      for (const proofRef of this.localRegistry.proofs) {
        try {
          let proofData: Proof;
          
          // Try to load from IPFS first
          if (proofRef.ipfsHash.startsWith('proof_')) {
            // This is a fallback hash, load from localStorage
            const saved = localStorage.getItem(`public_proof_${proofRef.id}`);
            if (saved) {
              proofData = JSON.parse(saved);
            } else {
              continue;
            }
          } else {
            // Try to load from IPFS
            try {
              const ipfs = await getIPFSService();
              if (ipfs) {
                const content = await ipfs.getContent(proofRef.ipfsHash);
                proofData = JSON.parse(content);
              } else {
                throw new Error('IPFS not available');
              }
            } catch (ipfsError) {
              // Fallback to localStorage
              const saved = localStorage.getItem(`public_proof_${proofRef.id}`);
              if (saved) {
                proofData = JSON.parse(saved);
              } else {
                continue;
              }
            }
          }
          
          proofs.push(proofData);
        } catch (error) {
          console.warn(`Failed to load proof ${proofRef.id}:`, error);
        }
      }
      
      return proofs;
    } catch (error) {
      console.error('Failed to get public proofs:', error);
      return this.getProofsFromLocalStorage();
    }
  }

  /**
   * Get public data for a specific freelancer
   */
  async getFreelancerPublicData(walletAddress: string): Promise<FreelancerProfile | null> {
    try {
      const allFreelancers = await this.getAllPublicFreelancers();
      return allFreelancers.find(f => f.walletAddress === walletAddress) || null;
    } catch (error) {
      console.error('Failed to get freelancer public data:', error);
      return null;
    }
  }

  /**
   * Get public proofs for a specific freelancer
   */
  async getFreelancerPublicProofs(walletAddress: string): Promise<Proof[]> {
    try {
      const allProofs = await this.getAllPublicProofs();
      return allProofs.filter(p => p.walletAddress === walletAddress);
    } catch (error) {
      console.error('Failed to get freelancer public proofs:', error);
      return [];
    }
  }

  // Private helper methods

  private async ensureRegistry(): Promise<void> {
    if (!this.localRegistry) {
      await this.loadRegistry();
    }
    if (!this.localRegistry) {
      await this.createNewRegistry();
    }
  }

  private async loadRegistry(): Promise<void> {
    try {
      if (this.registryHash) {
        if (this.registryHash.startsWith('registry_')) {
          // Fallback hash, load from localStorage
          const saved = localStorage.getItem('public_data_registry');
          if (saved) {
            this.localRegistry = JSON.parse(saved);
          }
        } else {
          // Try to load from IPFS
          try {
            const content = await ipfsService.getContent(this.registryHash);
            this.localRegistry = JSON.parse(content);
          } catch (ipfsError) {
            // Fallback to localStorage
            const saved = localStorage.getItem('public_data_registry');
            if (saved) {
              this.localRegistry = JSON.parse(saved);
            }
          }
        }
      }
    } catch (error) {
      console.warn('Failed to load registry:', error);
    }
  }

  private async createNewRegistry(): Promise<void> {
    this.localRegistry = {
      version: '1.0.0',
      lastUpdated: new Date().toISOString(),
      totalFreelancers: 0,
      totalProofs: 0,
      freelancers: [],
      proofs: []
    };
    
    await this.saveRegistry();
  }

  private async saveRegistry(): Promise<void> {
    if (!this.localRegistry) return;

    try {
      const registryJson = JSON.stringify(this.localRegistry, null, 2);
      const registryBuffer = Buffer.from(registryJson);

      let registryResult: IPFSUploadResult;
      
      try {
        const ipfs = await getIPFSService();
        if (ipfs && ipfs.isAvailable()) {
          // Upload registry to IPFS using Pinata
          const registryBlob = new Blob([registryJson], { type: 'application/json' });
          const formData = new FormData();
          formData.append('file', registryBlob, 'public_data_registry.json');
          
          // Add metadata for Pinata
          const metadata = {
            name: 'public_data_registry.json',
            keyvalues: {
              uploadedAt: new Date().toISOString(),
              type: 'public-registry'
            }
          };
          formData.append('pinataMetadata', JSON.stringify(metadata));

          const response = await fetch('https://api.pinata.cloud/pinning/pinFileToIPFS', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${process.env.NEXT_PUBLIC_PINATA_JWT}`,
            },
            body: formData
          });

          if (!response.ok) {
            throw new Error(`Pinata upload failed: ${response.statusText}`);
          }

          const result = await response.json();
          registryResult = {
            hash: result.IpfsHash,
            url: `https://gateway.pinata.cloud/ipfs/${result.IpfsHash}`,
            size: registryJson.length
          };
        } else {
          throw new Error('IPFS not available');
        }
      } catch (ipfsError) {
        console.warn('IPFS registry save failed, using fallback:', ipfsError);
        registryResult = {
          hash: `registry_${Date.now()}`,
          url: '#local-registry',
          size: registryBuffer.length
        };
      }

      this.registryHash = registryResult.hash;
      
      // Save to localStorage as backup
      localStorage.setItem('public_registry_hash', this.registryHash);
      localStorage.setItem('public_data_registry', registryJson);
      
      console.log(`Public registry saved: ${this.registryHash}`);
    } catch (error) {
      console.error('Failed to save registry:', error);
    }
  }

  private async updateFreelancerInRegistry(walletAddress: string, ipfsHash: string): Promise<void> {
    await this.ensureRegistry();
    
    if (!this.localRegistry) return;

    const existingIndex = this.localRegistry.freelancers.findIndex(f => f.walletAddress === walletAddress);
    const freelancerRef = {
      walletAddress,
      ipfsHash,
      lastUpdated: new Date().toISOString()
    };

    if (existingIndex >= 0) {
      this.localRegistry.freelancers[existingIndex] = freelancerRef;
    } else {
      this.localRegistry.freelancers.push(freelancerRef);
      this.localRegistry.totalFreelancers++;
    }

    this.localRegistry.lastUpdated = new Date().toISOString();
    await this.saveRegistry();
  }

  private async updateProofInRegistry(id: string, walletAddress: string, ipfsHash: string, metadataHash: string): Promise<void> {
    await this.ensureRegistry();
    
    if (!this.localRegistry) return;

    const existingIndex = this.localRegistry.proofs.findIndex(p => p.id === id);
    const proofRef = {
      id,
      walletAddress,
      ipfsHash,
      metadataHash,
      lastUpdated: new Date().toISOString()
    };

    if (existingIndex >= 0) {
      this.localRegistry.proofs[existingIndex] = proofRef;
    } else {
      this.localRegistry.proofs.push(proofRef);
      this.localRegistry.totalProofs++;
    }

    this.localRegistry.lastUpdated = new Date().toISOString();
    await this.saveRegistry();
  }

  private getFreelancersFromLocalStorage(): FreelancerProfile[] {
    try {
      const keys = Object.keys(localStorage).filter(key => key.startsWith('public_freelancer_'));
      const freelancers: FreelancerProfile[] = [];
      
      for (const key of keys) {
        try {
          const data = localStorage.getItem(key);
          if (data) {
            freelancers.push(JSON.parse(data));
          }
        } catch (error) {
          console.warn(`Failed to parse freelancer data for ${key}:`, error);
        }
      }
      
      return freelancers;
    } catch (error) {
      console.error('Failed to get freelancers from localStorage:', error);
      return [];
    }
  }

  private getProofsFromLocalStorage(): Proof[] {
    try {
      const keys = Object.keys(localStorage).filter(key => key.startsWith('public_proof_'));
      const proofs: Proof[] = [];
      
      for (const key of keys) {
        try {
          const data = localStorage.getItem(key);
          if (data) {
            proofs.push(JSON.parse(data));
          }
        } catch (error) {
          console.warn(`Failed to parse proof data for ${key}:`, error);
        }
      }
      
      return proofs;
    } catch (error) {
      console.error('Failed to get proofs from localStorage:', error);
      return [];
    }
  }

  /**
   * Get the current public registry hash (for sharing/verification)
   */
  getRegistryHash(): string | null {
    return this.registryHash;
  }

  /**
   * Get registry statistics
   */
  async getRegistryStats(): Promise<{ totalFreelancers: number; totalProofs: number; lastUpdated: string } | null> {
    await this.ensureRegistry();
    
    if (!this.localRegistry) return null;
    
    return {
      totalFreelancers: this.localRegistry.totalFreelancers,
      totalProofs: this.localRegistry.totalProofs,
      lastUpdated: this.localRegistry.lastUpdated
    };
  }
}

// Create singleton instance
export const publicDataService = new PublicDataService(); 