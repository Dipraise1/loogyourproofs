import { supabase } from './supabase';
import { Proof, Freelancer } from './store';
import toast from 'react-hot-toast';

export interface PublicDataRegistry {
  version: string;
  lastUpdated: string;
  totalFreelancers: number;
  totalProofs: number;
  freelancers: {
    walletAddress: string;
    supabaseId: string;
    lastUpdated: string;
  }[];
  proofs: {
    id: string;
    walletAddress: string;
    supabaseId: string;
    metadataId: string;
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
  supabaseIds: string[];
  lastUpdated: string;
}

class PublicDataService {
  private registryId: string | null = null;
  private localRegistry: PublicDataRegistry | null = null;

  /**
   * Initialize the public data service by loading the main registry
   */
  async initialize(): Promise<void> {
    try {
      // Try to load the registry from localStorage first
      const savedRegistryId = localStorage.getItem('public_registry_id');
      if (savedRegistryId) {
        this.registryId = savedRegistryId;
        await this.loadRegistry();
      }
    } catch (error) {
      console.warn('Failed to initialize public data service:', error);
      // Create new registry if none exists
      await this.createNewRegistry();
    }
  }

  /**
   * Store a freelancer profile to Supabase and update the public registry
   */
  async storeFreelancerPublic(freelancer: Freelancer): Promise<string> {
    try {
      // Create public freelancer profile
      const publicProfile: FreelancerProfile = {
        ...freelancer,
        proofIds: [],
        supabaseIds: [],
        lastUpdated: new Date().toISOString()
      };

      // Store freelancer profile in Supabase
      const { data, error } = await supabase
        .from('public_freelancers')
        .upsert({
          wallet_address: freelancer.walletAddress,
          profile_data: publicProfile,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select()
        .single();

      if (error) {
        throw new Error(`Supabase upload failed: ${error.message}`);
      }

      const profileId = data.id;

      // Update public registry
      await this.updateFreelancerInRegistry(freelancer.walletAddress, profileId);

      // Save to localStorage as backup
      localStorage.setItem(`public_freelancer_${freelancer.walletAddress}`, JSON.stringify({
        ...publicProfile,
        supabaseId: profileId
      }));

      toast.success(`Freelancer profile stored publicly: ${profileId.substring(0, 12)}...`);
      return profileId;
    } catch (error) {
      console.error('Failed to store freelancer publicly:', error);
      toast.error('Failed to store profile publicly');
      throw error;
    }
  }

  /**
   * Store a proof to Supabase and update the public registry
   */
  async storeProofPublic(proof: Proof): Promise<{ proofId: string; metadataId: string }> {
    try {
      // Create public proof metadata
      const publicMetadata = {
        title: proof.title,
        description: proof.description,
        type: proof.type,
        tags: proof.tags,
        timestamp: new Date(proof.timestamp).toISOString(),
        walletAddress: proof.walletAddress,
        attachments: proof.attachments?.map(att => ({
          name: att.name,
          url: att.url || '',
          type: att.type,
          size: att.size || 0,
        })) || [],
        githubRepo: proof.githubRepo,
        liveDemo: proof.liveDemo,
        clientAddress: proof.clientAddress,
      };

      // Store metadata in Supabase
      const { data: metadataData, error: metadataError } = await supabase
        .from('public_proof_metadata')
        .upsert({
          proof_id: proof.id,
          metadata: publicMetadata,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select()
        .single();

      if (metadataError) {
        throw new Error(`Supabase metadata upload failed: ${metadataError.message}`);
      }

      const metadataId = metadataData.id;

      // Store complete proof data in Supabase
      const { data: proofData, error: proofError } = await supabase
        .from('public_proofs')
        .upsert({
          proof_id: proof.id,
          wallet_address: proof.walletAddress,
          proof_data: {
            ...proof,
            publicMetadataId: metadataId,
            isPublic: true,
            lastUpdated: new Date().toISOString()
          },
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select()
        .single();

      if (proofError) {
        throw new Error(`Supabase proof upload failed: ${proofError.message}`);
      }

      const proofId = proofData.id;

      // Update public registry
      await this.updateProofInRegistry(proof.id, proof.walletAddress, proofId, metadataId);

      // Save to localStorage as backup
      localStorage.setItem(`public_proof_${proof.id}`, JSON.stringify({
        ...proof,
        proofSupabaseId: proofId,
        metadataSupabaseId: metadataId,
        isPublic: true
      }));

      toast.success(`Proof stored publicly: ${proofId.substring(0, 12)}...`);
      return { 
        proofId: proofId, 
        metadataId: metadataId 
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
          
          // Try to load from Supabase first
          try {
            const { data, error } = await supabase
              .from('public_freelancers')
              .select('profile_data')
              .eq('id', freelancerRef.supabaseId)
              .single();

            if (error) {
              throw new Error(`Supabase query failed: ${error.message}`);
            }

            freelancerData = data.profile_data;
          } catch (supabaseError) {
            // Fallback to localStorage
            const saved = localStorage.getItem(`public_freelancer_${freelancerRef.walletAddress}`);
            if (saved) {
              freelancerData = JSON.parse(saved);
            } else {
              continue;
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
          
          // Try to load from Supabase first
          try {
            const { data, error } = await supabase
              .from('public_proofs')
              .select('proof_data')
              .eq('id', proofRef.supabaseId)
              .single();

            if (error) {
              throw new Error(`Supabase query failed: ${error.message}`);
            }

            proofData = data.proof_data;
          } catch (supabaseError) {
            // Fallback to localStorage
            const saved = localStorage.getItem(`public_proof_${proofRef.id}`);
            if (saved) {
              proofData = JSON.parse(saved);
            } else {
              continue;
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
      if (this.registryId) {
        // Try to load from Supabase first
        try {
          const { data, error } = await supabase
            .from('public_registry')
            .select('registry_data')
            .eq('id', this.registryId)
            .single();

          if (error) {
            throw new Error(`Supabase query failed: ${error.message}`);
          }

          this.localRegistry = data.registry_data;
        } catch (supabaseError) {
          // Fallback to localStorage
          const saved = localStorage.getItem('public_data_registry');
          if (saved) {
            this.localRegistry = JSON.parse(saved);
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

      // Store registry in Supabase
      const { data, error } = await supabase
        .from('public_registry')
        .upsert({
          registry_data: this.localRegistry,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select()
        .single();

      if (error) {
        throw new Error(`Supabase registry save failed: ${error.message}`);
      }

      this.registryId = data.id;
      
      // Save to localStorage as backup
      if (this.registryId) {
        localStorage.setItem('public_registry_id', this.registryId);
      }
      localStorage.setItem('public_data_registry', registryJson);
      
      console.log(`Public registry saved: ${this.registryId}`);
    } catch (error) {
      console.error('Failed to save registry:', error);
    }
  }

  private async updateFreelancerInRegistry(walletAddress: string, supabaseId: string): Promise<void> {
    await this.ensureRegistry();
    
    if (!this.localRegistry) return;

    const existingIndex = this.localRegistry.freelancers.findIndex(f => f.walletAddress === walletAddress);
    const freelancerRef = {
      walletAddress,
      supabaseId,
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

  private async updateProofInRegistry(id: string, walletAddress: string, supabaseId: string, metadataId: string): Promise<void> {
    await this.ensureRegistry();
    
    if (!this.localRegistry) return;

    const existingIndex = this.localRegistry.proofs.findIndex(p => p.id === id);
    const proofRef = {
      id,
      walletAddress,
      supabaseId,
      metadataId,
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
   * Get the current public registry ID (for sharing/verification)
   */
  getRegistryId(): string | null {
    return this.registryId;
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