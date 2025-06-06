import { useWallet } from '@solana/wallet-adapter-react';
import { ipfsService, ProofMetadata, IPFSUploadResult } from './ipfs';
import { SolanaService, ProofRecord } from './blockchain';
import { Proof, Attachment, useAppStore } from './store';
import { publicDataService } from './public-data-service';
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

export class ProofSubmissionService {
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
      // Step 1: Upload attachments to IPFS
      toast.loading('Uploading files to IPFS...', { id: proofId });
      const uploadedAttachments = await this.uploadAttachments(submissionData.attachments);
      
      updateProof(proofId, { 
        attachments: uploadedAttachments,
        status: 'uploading' 
      });

      // Step 2: Create and upload metadata to IPFS
      toast.loading('Creating metadata record...', { id: proofId });
      
      let metadataResult: IPFSUploadResult;
      try {
        const metadata: ProofMetadata = {
          title: submissionData.title,
          description: submissionData.description,
          type: submissionData.type,
          tags: submissionData.tags,
          timestamp: new Date().toISOString(),
          walletAddress,
          attachments: uploadedAttachments.map(att => ({
            name: att.name,
            hash: att.ipfsHash || '',
            type: att.type,
            size: att.size || 0,
          })),
          githubRepo: submissionData.githubRepo,
          liveDemo: submissionData.liveDemo,
          clientAddress: submissionData.clientAddress,
        };

        metadataResult = await ipfsService.uploadProofMetadata(metadata);
      } catch (ipfsError) {
        console.warn('IPFS upload failed, using fallback storage:', ipfsError);
        // Fallback: create a mock hash for now
        metadataResult = {
          hash: `fallback_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          url: `#fallback-${proofId}`,
          size: 0
        };
        toast.loading('Using local storage (IPFS unavailable)...', { id: proofId });
      }
      
      updateProof(proofId, { 
        ipfsHash: metadataResult.hash,
        status: 'uploading' 
      });

      // Step 3: Create blockchain record
      toast.loading('Creating blockchain record...', { id: proofId });
      const blockchainRecord = await this.blockchainService.submitProof(
        metadataResult.hash,
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

      // Step 4: Sign the transaction if wallet is available
      if (signMessage) {
        try {
          const message = `Proof submission: ${metadataResult.hash}`;
          const signature = await signMessage(message);
          blockchainRecord.signature = signature;
        } catch (error) {
          console.warn('Failed to sign message:', error as Error);
        }
      }

      // Update proof with final data
      const completedProof: Proof = {
        ...initialProof,
        attachments: uploadedAttachments,
        ipfsHash: metadataResult.hash,
        status: 'completed',
        blockchainRecord,
      };

      updateProof(proofId, completedProof);

      // Update freelancer stats
      this.updateFreelancerStats(walletAddress);

      // Save to localStorage for persistence
      this.saveProofToStorage(completedProof);

      // Store publicly on IPFS for global access
      try {
        toast.loading('Making data publicly accessible...', { id: proofId + '_public' });
        await publicDataService.storeProofPublic(completedProof);
        
        // Also ensure freelancer profile is publicly stored
        const { freelancers } = useAppStore.getState();
        const freelancer = freelancers.find(f => f.walletAddress === walletAddress);
        if (freelancer) {
          await publicDataService.storeFreelancerPublic(freelancer);
        }
        
        toast.success('Data stored publicly on IPFS!', { id: proofId + '_public' });
      } catch (publicError) {
        console.warn('Public storage failed, but proof was saved locally:', publicError);
        toast.error('Public storage failed, but proof was saved locally', { id: proofId + '_public' });
      }

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
        // Links don't need IPFS upload
        return {
          ...attachment,
          ipfsHash: 'link_' + attachment.url,
        };
      }

      if (attachment.file) {
        try {
          // Check if IPFS is available
          if (typeof window !== 'undefined' && ipfsService.isAvailable && ipfsService.isAvailable()) {
            const result = await ipfsService.uploadFile(attachment.file);
            return {
              ...attachment,
              ipfsHash: result.hash,
              url: result.url,
            };
          } else {
            // Fallback: store file reference locally
            console.warn('IPFS not available, using local storage for:', attachment.name);
            return {
              ...attachment,
              ipfsHash: `local_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
              url: URL.createObjectURL(attachment.file),
            };
          }
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

  private updateFreelancerStats(walletAddress: string) {
    const { freelancers, addFreelancer, updateFreelancer } = useAppStore.getState();
    
    const existingFreelancer = freelancers.find(f => f.walletAddress === walletAddress);
    
    if (existingFreelancer) {
      updateFreelancer(walletAddress, {
        totalProofs: existingFreelancer.totalProofs + 1,
      });
    } else {
      // Create new freelancer profile
      const newFreelancer = {
        walletAddress,
        specialties: [],
        rating: 0,
        totalProofs: 1,
        totalEndorsements: 0,
        joinedAt: Date.now(),
      };
      
      addFreelancer(newFreelancer);
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

  async searchProofs(query: string) {
    const { searchProofs } = useAppStore.getState();
    return searchProofs(query);
  }

  async getProofsByWallet(walletAddress: string) {
    const { proofs } = useAppStore.getState();
    return proofs.filter(proof => proof.walletAddress === walletAddress);
  }
}

// Export singleton instance
export const proofService = new ProofSubmissionService(); 