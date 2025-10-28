import { useWallet } from '@solana/wallet-adapter-react';
import { ProofRecord } from './supabase';
import { SolanaService } from './blockchain';
import { Proof, Attachment, useAppStore } from './store';
import { supabaseService } from './supabase';
import toast from 'react-hot-toast';

export interface SubmissionData {
  title: string;
  description: string;
  type: 'project' | 'design' | 'audit' | 'consultation' | 'other';
  tags: string[];
  attachments: Attachment[];
  githubRepo?: string;
  liveDemo?: string;
  clientAddress?: string;
}

export class SupabaseProofService {
  private blockchainService: SolanaService;

  constructor() {
    this.blockchainService = new SolanaService('devnet');
  }

  async submitProof(
    submissionData: SubmissionData,
    walletAddress: string,
    signMessage?: (message: string) => Promise<string>
  ): Promise<Proof> {
    const { 
      addProof, 
      updateProof,
      addFreelancer,
      updateFreelancer 
    } = useAppStore.getState();

    // Create initial proof record
    const proofId = `proof_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const initialProof: Proof = {
      id: proofId,
      ...submissionData,
      walletAddress,
      timestamp: Date.now(),
      status: 'uploading',
      endorsements: [],
    };

    // Add to store immediately for UI feedback
    addProof(initialProof);

    try {
      // Step 1: Upload attachments to Supabase Storage
      toast.loading('Uploading files to Supabase...', { id: proofId });
      const uploadedAttachments = await this.uploadAttachments(submissionData.attachments);
      
      updateProof(proofId, { 
        attachments: uploadedAttachments,
        status: 'uploading' 
      });

      // Step 2: Create blockchain record (optional for now)
      toast.loading('Creating blockchain record...', { id: proofId });
      let blockchainRecord;
      try {
        blockchainRecord = await this.blockchainService.submitProof(
          proofId, // Use proof ID as hash for now
          {
            title: submissionData.title,
            description: submissionData.description,
            type: submissionData.type,
            tags: submissionData.tags,
            timestamp: new Date().toISOString(),
            walletAddress,
            githubRepo: submissionData.githubRepo,
            liveDemo: submissionData.liveDemo,
            clientAddress: submissionData.clientAddress,
          }
        );

        // Sign the transaction if wallet is available
        if (signMessage) {
          try {
            const message = `Proof submission: ${proofId}`;
            const signature = await signMessage(message);
            blockchainRecord.signature = signature;
          } catch (error) {
            console.warn('Failed to sign message:', error as Error);
          }
        }
      } catch (blockchainError) {
        console.warn('Blockchain record creation failed, continuing without it:', blockchainError);
        blockchainRecord = undefined;
      }

      // Step 3: Save to Supabase
      toast.loading('Saving to database...', { id: proofId });
      
      const proofRecord: ProofRecord = {
        id: proofId,
        wallet_address: walletAddress,
        title: submissionData.title,
        description: submissionData.description,
        type: submissionData.type,
        tags: submissionData.tags,
        attachments: uploadedAttachments,
        github_repo: submissionData.githubRepo,
        live_demo: submissionData.liveDemo,
        client_address: submissionData.clientAddress,
        ipfs_hash: proofId, // Use proof ID as hash for now
        timestamp: Date.now(),
        status: 'completed',
        blockchain_record: blockchainRecord,
        endorsements: [],
      };

      await supabaseService.saveProof(proofRecord);

      // Update proof with final data
      const completedProof: Proof = {
        ...initialProof,
        attachments: uploadedAttachments,
        ipfsHash: proofId,
        status: 'completed',
        blockchainRecord,
      };

      updateProof(proofId, completedProof);

      // Update freelancer stats
      await this.updateFreelancerStats(walletAddress);

      // Save to localStorage for offline access
      this.saveProofToStorage(completedProof);

      toast.success('Proof submitted successfully!', { id: proofId });
      return completedProof;

    } catch (error) {
      console.error('Proof submission failed:', error);
      updateProof(proofId, { status: 'failed' });
      toast.error(`Submission failed: ${(error as Error).message}`, { id: proofId });
      throw error;
    }
  }

  private async uploadAttachments(attachments: Attachment[]): Promise<Attachment[]> {
    const uploadPromises = attachments.map(async (attachment) => {
      if (attachment.type === 'link') {
        // Links don't need upload
        return {
          ...attachment,
          ipfsHash: 'link_' + attachment.url,
        };
      }

      if (attachment.file) {
        try {
          const result = await supabaseService.uploadFile(attachment.file);
          return {
            ...attachment,
            ipfsHash: result.path,
            url: result.url,
          };
        } catch (error) {
          console.error(`Failed to upload ${attachment.name}:`, error);
          // Don't fail the entire submission for one file
          return {
            ...attachment,
            ipfsHash: `failed_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            url: '#upload-failed',
          };
        }
      }

      return attachment;
    });

    return Promise.all(uploadPromises);
  }

  private async updateFreelancerStats(walletAddress: string) {
    const { freelancers, addFreelancer, updateFreelancer } = useAppStore.getState();
    
    const existingFreelancer = freelancers.find(f => f.walletAddress === walletAddress);
    
    if (existingFreelancer) {
      const updatedFreelancer = {
        ...existingFreelancer,
        totalProofs: existingFreelancer.totalProofs + 1,
      };
      
      updateFreelancer(walletAddress, updatedFreelancer);
      
      // Save to Supabase
      try {
        await supabaseService.saveFreelancer({
          wallet_address: updatedFreelancer.walletAddress,
          name: updatedFreelancer.name,
          bio: updatedFreelancer.bio,
          avatar: updatedFreelancer.avatar,
          specialties: updatedFreelancer.specialties,
          rating: updatedFreelancer.rating,
          total_proofs: updatedFreelancer.totalProofs,
          total_endorsements: updatedFreelancer.totalEndorsements,
          joined_at: updatedFreelancer.joinedAt,
          social: updatedFreelancer.social,
        });
      } catch (error) {
        console.warn('Failed to save freelancer to Supabase:', error);
      }
    } else {
      // Create new freelancer
      const newFreelancer = {
        walletAddress,
        name: `Freelancer ${walletAddress.slice(0, 6)}...${walletAddress.slice(-4)}`,
        bio: 'New to SolGigs',
        avatar: undefined,
        specialties: [],
        rating: 0,
        totalProofs: 1,
        totalEndorsements: 0,
        joinedAt: Date.now(),
        social: {},
      };
      
      addFreelancer(newFreelancer);
      
      // Save to Supabase
      try {
        await supabaseService.saveFreelancer({
          wallet_address: newFreelancer.walletAddress,
          name: newFreelancer.name,
          bio: newFreelancer.bio,
          avatar: newFreelancer.avatar,
          specialties: newFreelancer.specialties,
          rating: newFreelancer.rating,
          total_proofs: newFreelancer.totalProofs,
          total_endorsements: newFreelancer.totalEndorsements,
          joined_at: newFreelancer.joinedAt,
          social: newFreelancer.social,
        });
      } catch (error) {
        console.warn('Failed to save new freelancer to Supabase:', error);
      }
    }
  }

  private saveProofToStorage(proof: Proof) {
    try {
      // Save to user's proof list
      const userProofsKey = `proofs_${proof.walletAddress}`;
      const existingProofs = JSON.parse(localStorage.getItem(userProofsKey) || '[]');
      const updatedProofs = [...existingProofs.filter((p: Proof) => p.id !== proof.id), proof];
      localStorage.setItem(userProofsKey, JSON.stringify(updatedProofs));

      // Save to global proof list
      const allProofs = JSON.parse(localStorage.getItem('all_proofs') || '[]');
      const updatedAllProofs = [...allProofs.filter((p: Proof) => p.id !== proof.id), proof];
      localStorage.setItem('all_proofs', JSON.stringify(updatedAllProofs));
      
    } catch (error) {
      console.error('Failed to save proof to storage:', error);
    }
  }

  async endorseProof(
    proofId: string,
    message: string,
    endorserAddress: string,
    signMessage?: (message: string) => Promise<string>
  ) {
    const { addEndorsement, updateFreelancer } = useAppStore.getState();

    try {
      toast.loading('Creating endorsement...', { id: 'endorsement' });

      // Create blockchain endorsement
      const endorsement = await this.blockchainService.endorseProof(proofId, message);
      
      // Sign if wallet available
      if (signMessage) {
        try {
          const signatureMessage = `Endorsement: ${proofId} - ${message}`;
          const signature = await signMessage(signatureMessage);
          endorsement.signature = signature;
        } catch (error) {
          console.warn('Failed to sign endorsement:', error as Error);
        }
      }

      // Save to Supabase
      await supabaseService.addEndorsement({
        id: endorsement.signature || `endorsement_${Date.now()}`,
        proof_id: proofId,
        endorser_address: endorserAddress,
        message,
        timestamp: Date.now(),
        signature: endorsement.signature,
        transaction_hash: endorsement.transactionHash,
      });

      // Add to store
      addEndorsement(proofId, endorsement);

      // Update endorser stats (if they're also a freelancer)
      const { freelancers } = useAppStore.getState();
      const endorser = freelancers.find(f => f.walletAddress === endorserAddress);
      if (endorser) {
        updateFreelancer(endorserAddress, {
          totalEndorsements: endorser.totalEndorsements + 1,
        });
      }

      // Save to storage
      this.saveEndorsementToStorage(proofId, endorsement);

      toast.success('Endorsement added successfully!', { id: 'endorsement' });
      return endorsement;

    } catch (error) {
      console.error('Endorsement failed:', error);
      toast.error(`Endorsement failed: ${(error as Error).message}`, { id: 'endorsement' });
      throw error;
    }
  }

  private saveEndorsementToStorage(proofId: string, endorsement: any) {
    try {
      // Update all proof records with new endorsement
      const updateProofInStorage = (storageKey: string) => {
        const proofs = JSON.parse(localStorage.getItem(storageKey) || '[]');
        const updatedProofs = proofs.map((proof: Proof) => 
          proof.id === proofId 
            ? { ...proof, endorsements: [...(proof.endorsements || []), endorsement] }
            : proof
        );
        localStorage.setItem(storageKey, JSON.stringify(updatedProofs));
      };

      updateProofInStorage('all_proofs');
      
      // Update user-specific storage (we need to find which user owns this proof)
      const allProofs = JSON.parse(localStorage.getItem('all_proofs') || '[]');
      const proof = allProofs.find((p: Proof) => p.id === proofId);
      if (proof) {
        updateProofInStorage(`proofs_${proof.walletAddress}`);
      }
      
    } catch (error) {
      console.error('Failed to save endorsement to storage:', error);
    }
  }

  async loadProofsFromStorage() {
    const { setFreelancers, addProof } = useAppStore.getState();
    
    try {
      // Load all proofs
      const allProofs = JSON.parse(localStorage.getItem('all_proofs') || '[]');
      allProofs.forEach((proof: Proof) => addProof(proof));

      // Load freelancers
      const freelancers = JSON.parse(localStorage.getItem('freelancers') || '[]');
      setFreelancers(freelancers);
      
    } catch (error) {
      console.error('Failed to load data from storage:', error);
    }
  }

  async loadProofsFromSupabase(walletAddress?: string) {
    const { setFreelancers, addProof } = useAppStore.getState();
    
    try {
      // Load proofs from Supabase
      const proofs = walletAddress 
        ? await supabaseService.getProofsByWallet(walletAddress)
        : await supabaseService.getAllProofs();
      
      // Convert to store format and add to store
      proofs.forEach((proofRecord: ProofRecord) => {
        const proof: Proof = {
          id: proofRecord.id,
          title: proofRecord.title,
          description: proofRecord.description,
          type: proofRecord.type as any,
          tags: proofRecord.tags,
          attachments: proofRecord.attachments,
          githubRepo: proofRecord.github_repo,
          liveDemo: proofRecord.live_demo,
          clientAddress: proofRecord.client_address,
          walletAddress: proofRecord.wallet_address,
          ipfsHash: proofRecord.ipfs_hash,
          timestamp: proofRecord.timestamp,
          status: proofRecord.status as any,
          blockchainRecord: proofRecord.blockchain_record,
          endorsements: proofRecord.endorsements,
        };
        addProof(proof);
      });

      // Load freelancers from Supabase
      const freelancers = await supabaseService.getAllFreelancers();
      const storeFreelancers = freelancers.map((f: any) => ({
        walletAddress: f.wallet_address,
        name: f.name,
        bio: f.bio,
        avatar: f.avatar,
        specialties: f.specialties,
        rating: f.rating,
        totalProofs: f.total_proofs,
        totalEndorsements: f.total_endorsements,
        joinedAt: f.joined_at,
        social: f.social,
      }));
      setFreelancers(storeFreelancers);
      
    } catch (error) {
      console.error('Failed to load data from Supabase:', error);
      // Fallback to localStorage
      this.loadProofsFromStorage();
    }
  }

  async searchProofs(query: string) {
    try {
      const proofs = await supabaseService.searchProofs(query);
      return proofs.map((proofRecord: ProofRecord) => ({
        id: proofRecord.id,
        title: proofRecord.title,
        description: proofRecord.description,
        type: proofRecord.type as any,
        tags: proofRecord.tags,
        attachments: proofRecord.attachments,
        githubRepo: proofRecord.github_repo,
        liveDemo: proofRecord.live_demo,
        clientAddress: proofRecord.client_address,
        walletAddress: proofRecord.wallet_address,
        ipfsHash: proofRecord.ipfs_hash,
        timestamp: proofRecord.timestamp,
        status: proofRecord.status as any,
        blockchainRecord: proofRecord.blockchain_record,
        endorsements: proofRecord.endorsements,
      }));
    } catch (error) {
      console.error('Failed to search proofs:', error);
      return [];
    }
  }

  async getProofsByWallet(walletAddress: string) {
    try {
      const proofs = await supabaseService.getProofsByWallet(walletAddress);
      return proofs.map((proofRecord: ProofRecord) => ({
        id: proofRecord.id,
        title: proofRecord.title,
        description: proofRecord.description,
        type: proofRecord.type as any,
        tags: proofRecord.tags,
        attachments: proofRecord.attachments,
        githubRepo: proofRecord.github_repo,
        liveDemo: proofRecord.live_demo,
        clientAddress: proofRecord.client_address,
        walletAddress: proofRecord.wallet_address,
        ipfsHash: proofRecord.ipfs_hash,
        timestamp: proofRecord.timestamp,
        status: proofRecord.status as any,
        blockchainRecord: proofRecord.blockchain_record,
        endorsements: proofRecord.endorsements,
      }));
    } catch (error) {
      console.error('Failed to get proofs by wallet:', error);
      return [];
    }
  }
}

// Export singleton instance
export const proofService = new SupabaseProofService();
