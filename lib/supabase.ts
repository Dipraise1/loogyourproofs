import { createClient } from '@supabase/supabase-js';

// Supabase configuration
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-key';

// Create Supabase client
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Database types
export interface ProofRecord {
  id: string;
  wallet_address: string;
  title: string;
  description: string;
  type: string;
  tags: string[];
  attachments: any[];
  github_repo?: string;
  live_demo?: string;
  client_address?: string;
  ipfs_hash?: string;
  timestamp: number;
  status: 'pending' | 'uploading' | 'completed' | 'failed';
  blockchain_record?: any;
  endorsements: any[];
  created_at?: string;
  updated_at?: string;
}

export interface FreelancerRecord {
  wallet_address: string;
  name?: string;
  bio?: string;
  avatar?: string;
  specialties: string[];
  rating: number;
  total_proofs: number;
  total_endorsements: number;
  joined_at: number;
  social?: {
    github?: string;
    twitter?: string;
    website?: string;
  };
  created_at?: string;
  updated_at?: string;
}

export interface EndorsementRecord {
  id: string;
  proof_id: string;
  endorser_address: string;
  message: string;
  timestamp: number;
  signature?: string;
  transaction_hash?: string;
  created_at?: string;
}

export interface AttachmentRecord {
  id: string;
  proof_id: string;
  name: string;
  type: 'image' | 'document' | 'link';
  url?: string;
  file_data?: string; // Base64 encoded file data
  size?: number;
  created_at?: string;
}

class SupabaseService {
  /**
   * Check if Supabase is properly configured
   */
  isConfigured(): boolean {
    return Boolean(supabaseUrl && supabaseAnonKey);
  }

  /**
   * Test Supabase connection
   */
  async testConnection(): Promise<boolean> {
    try {
      const { data, error } = await supabase.from('proofs').select('count').limit(1);
      return !error;
    } catch (error) {
      console.error('Supabase connection test failed:', error);
      return false;
    }
  }

  /**
   * Save proof to Supabase
   */
  async saveProof(proof: ProofRecord): Promise<ProofRecord> {
    try {
      const { data, error } = await supabase
        .from('proofs')
        .upsert({
          id: proof.id,
          wallet_address: proof.wallet_address,
          title: proof.title,
          description: proof.description,
          type: proof.type,
          tags: proof.tags,
          attachments: proof.attachments,
          github_repo: proof.github_repo,
          live_demo: proof.live_demo,
          client_address: proof.client_address,
          ipfs_hash: proof.ipfs_hash,
          timestamp: proof.timestamp,
          status: proof.status,
          blockchain_record: proof.blockchain_record,
          endorsements: proof.endorsements,
          updated_at: new Date().toISOString()
        })
        .select()
        .single();

      if (error) {
        throw new Error(`Failed to save proof: ${error.message}`);
      }

      console.log('✅ Proof saved to Supabase:', data.id);
      return data;
    } catch (error) {
      console.error('❌ Failed to save proof to Supabase:', error);
      throw error;
    }
  }

  /**
   * Get proofs by wallet address
   */
  async getProofsByWallet(walletAddress: string): Promise<ProofRecord[]> {
    try {
      const { data, error } = await supabase
        .from('proofs')
        .select('*')
        .eq('wallet_address', walletAddress)
        .order('timestamp', { ascending: false });

      if (error) {
        throw new Error(`Failed to get proofs: ${error.message}`);
      }

      return data || [];
    } catch (error) {
      console.error('❌ Failed to get proofs from Supabase:', error);
      return [];
    }
  }

  /**
   * Get all proofs
   */
  async getAllProofs(): Promise<ProofRecord[]> {
    try {
      const { data, error } = await supabase
        .from('proofs')
        .select('*')
        .order('timestamp', { ascending: false });

      if (error) {
        throw new Error(`Failed to get all proofs: ${error.message}`);
      }

      return data || [];
    } catch (error) {
      console.error('❌ Failed to get all proofs from Supabase:', error);
      return [];
    }
  }

  /**
   * Search proofs
   */
  async searchProofs(query: string): Promise<ProofRecord[]> {
    try {
      const { data, error } = await supabase
        .from('proofs')
        .select('*')
        .or(`title.ilike.%${query}%,description.ilike.%${query}%`)
        .order('timestamp', { ascending: false });

      if (error) {
        throw new Error(`Failed to search proofs: ${error.message}`);
      }

      return data || [];
    } catch (error) {
      console.error('❌ Failed to search proofs in Supabase:', error);
      return [];
    }
  }

  /**
   * Save freelancer profile
   */
  async saveFreelancer(freelancer: FreelancerRecord): Promise<FreelancerRecord> {
    try {
      const { data, error } = await supabase
        .from('freelancers')
        .upsert({
          wallet_address: freelancer.wallet_address,
          name: freelancer.name,
          bio: freelancer.bio,
          avatar: freelancer.avatar,
          specialties: freelancer.specialties,
          rating: freelancer.rating,
          total_proofs: freelancer.total_proofs,
          total_endorsements: freelancer.total_endorsements,
          joined_at: freelancer.joined_at,
          social: freelancer.social,
          updated_at: new Date().toISOString()
        })
        .select()
        .single();

      if (error) {
        throw new Error(`Failed to save freelancer: ${error.message}`);
      }

      console.log('✅ Freelancer saved to Supabase:', data.wallet_address);
      return data;
    } catch (error) {
      console.error('❌ Failed to save freelancer to Supabase:', error);
      throw error;
    }
  }

  /**
   * Get freelancer by wallet address
   */
  async getFreelancer(walletAddress: string): Promise<FreelancerRecord | null> {
    try {
      const { data, error } = await supabase
        .from('freelancers')
        .select('*')
        .eq('wallet_address', walletAddress)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          return null; // Not found
        }
        throw new Error(`Failed to get freelancer: ${error.message}`);
      }

      return data;
    } catch (error) {
      console.error('❌ Failed to get freelancer from Supabase:', error);
      return null;
    }
  }

  /**
   * Get all freelancers
   */
  async getAllFreelancers(): Promise<FreelancerRecord[]> {
    try {
      const { data, error } = await supabase
        .from('freelancers')
        .select('*')
        .order('joined_at', { ascending: false });

      if (error) {
        throw new Error(`Failed to get all freelancers: ${error.message}`);
      }

      return data || [];
    } catch (error) {
      console.error('❌ Failed to get all freelancers from Supabase:', error);
      return [];
    }
  }

  /**
   * Search freelancers
   */
  async searchFreelancers(query: string): Promise<FreelancerRecord[]> {
    try {
      const { data, error } = await supabase
        .from('freelancers')
        .select('*')
        .or(`name.ilike.%${query}%,bio.ilike.%${query}%,wallet_address.ilike.%${query}%`)
        .order('joined_at', { ascending: false });

      if (error) {
        throw new Error(`Failed to search freelancers: ${error.message}`);
      }

      return data || [];
    } catch (error) {
      console.error('❌ Failed to search freelancers in Supabase:', error);
      return [];
    }
  }

  /**
   * Add endorsement to proof
   */
  async addEndorsement(endorsement: EndorsementRecord): Promise<EndorsementRecord> {
    try {
      const { data, error } = await supabase
        .from('endorsements')
        .insert({
          id: endorsement.id,
          proof_id: endorsement.proof_id,
          endorser_address: endorsement.endorser_address,
          message: endorsement.message,
          timestamp: endorsement.timestamp,
          signature: endorsement.signature,
          transaction_hash: endorsement.transaction_hash
        })
        .select()
        .single();

      if (error) {
        throw new Error(`Failed to add endorsement: ${error.message}`);
      }

      // Update the proof's endorsements array
      await this.updateProofEndorsements(endorsement.proof_id);

      console.log('✅ Endorsement added to Supabase:', data.id);
      return data;
    } catch (error) {
      console.error('❌ Failed to add endorsement to Supabase:', error);
      throw error;
    }
  }

  /**
   * Update proof's endorsements array
   */
  private async updateProofEndorsements(proofId: string): Promise<void> {
    try {
      // Get all endorsements for this proof
      const { data: endorsements, error: endorsementsError } = await supabase
        .from('endorsements')
        .select('*')
        .eq('proof_id', proofId);

      if (endorsementsError) {
        throw new Error(`Failed to get endorsements: ${endorsementsError.message}`);
      }

      // Update the proof with the endorsements array
      const { error: updateError } = await supabase
        .from('proofs')
        .update({ endorsements: endorsements || [] })
        .eq('id', proofId);

      if (updateError) {
        throw new Error(`Failed to update proof endorsements: ${updateError.message}`);
      }
    } catch (error) {
      console.error('❌ Failed to update proof endorsements:', error);
    }
  }

  /**
   * Upload file to Supabase Storage
   */
  async uploadFile(file: File, bucket: string = 'proof-attachments'): Promise<{ url: string; path: string }> {
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}.${fileExt}`;
      const filePath = `proofs/${fileName}`;

      const { data, error } = await supabase.storage
        .from(bucket)
        .upload(filePath, file);

      if (error) {
        throw new Error(`Failed to upload file: ${error.message}`);
      }

      // Get public URL
      const { data: urlData } = supabase.storage
        .from(bucket)
        .getPublicUrl(filePath);

      console.log('✅ File uploaded to Supabase Storage:', filePath);
      return {
        url: urlData.publicUrl,
        path: filePath
      };
    } catch (error) {
      console.error('❌ Failed to upload file to Supabase Storage:', error);
      throw error;
    }
  }

  /**
   * Delete file from Supabase Storage
   */
  async deleteFile(path: string, bucket: string = 'proof-attachments'): Promise<void> {
    try {
      const { error } = await supabase.storage
        .from(bucket)
        .remove([path]);

      if (error) {
        throw new Error(`Failed to delete file: ${error.message}`);
      }

      console.log('✅ File deleted from Supabase Storage:', path);
    } catch (error) {
      console.error('❌ Failed to delete file from Supabase Storage:', error);
      throw error;
    }
  }
}

// Export singleton instance
export const supabaseService = new SupabaseService();

// Utility functions
export const formatWalletAddress = (address: string): string => {
  if (address.length <= 12) return address;
  return `${address.substring(0, 6)}...${address.substring(address.length - 4)}`;
};

export const validateWalletAddress = (address: string): boolean => {
  // Basic validation for wallet addresses
  return Boolean(address && address.length > 10);
};
