import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { ProofRecord, EndorsementRecord } from './blockchain';
import { ProofMetadata } from './ipfs';

export interface Attachment {
  id: string;
  type: 'image' | 'document' | 'link';
  name: string;
  file?: File;
  url?: string;
  size?: number;
  preview?: string;
  ipfsHash?: string;
}

export interface Proof {
  id: string;
  title: string;
  description: string;
  type: 'project' | 'design' | 'audit' | 'consultation' | 'other';
  tags: string[];
  attachments: Attachment[];
  githubRepo?: string;
  liveDemo?: string;
  clientAddress?: string;
  walletAddress: string;
  ipfsHash?: string;
  timestamp: number;
  status: 'pending' | 'uploading' | 'completed' | 'failed';
  blockchainRecord?: ProofRecord;
  endorsements: EndorsementRecord[];
}

export interface Freelancer {
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
}

interface AppState {
  // Wallet state
  connectedWallet: string | null;
  walletType: 'phantom' | 'metamask' | 'solflare' | null;
  
  // Proofs
  proofs: Proof[];
  userProofs: Proof[];
  
  // Freelancers
  freelancers: Freelancer[];
  currentFreelancer: Freelancer | null;
  
  // UI state
  isLoading: boolean;
  error: string | null;
  
  // Actions
  setConnectedWallet: (address: string | null, type: 'phantom' | 'metamask' | 'solflare' | null) => void;
  addProof: (proof: Proof) => void;
  updateProof: (id: string, updates: Partial<Proof>) => void;
  removeProof: (id: string) => void;
  addEndorsement: (proofId: string, endorsement: EndorsementRecord) => void;
  setFreelancers: (freelancers: Freelancer[]) => void;
  addFreelancer: (freelancer: Freelancer) => void;
  updateFreelancer: (address: string, updates: Partial<Freelancer>) => void;
  setCurrentFreelancer: (freelancer: Freelancer | null) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  clearError: () => void;
  
  // Data fetching
  loadUserProofs: (walletAddress: string) => Promise<void>;
  loadAllProofs: () => Promise<void>;
  loadFreelancers: () => Promise<void>;
  
  // Search and filter
  searchProofs: (query: string) => Proof[];
  searchFreelancers: (query: string) => Freelancer[];
  getProofsByType: (type: string) => Proof[];
  getProofsByTags: (tags: string[]) => Proof[];
}

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      // Initial state
      connectedWallet: null,
      walletType: null,
      proofs: [],
      userProofs: [],
      freelancers: [],
      currentFreelancer: null,
      isLoading: false,
      error: null,

      // Wallet actions
      setConnectedWallet: (address, type) => {
        set({ connectedWallet: address, walletType: type });
        if (address) {
          get().loadUserProofs(address);
        } else {
          set({ userProofs: [], currentFreelancer: null });
        }
      },

      // Proof actions
      addProof: (proof) => {
        set((state) => ({
          proofs: [...state.proofs, proof],
          userProofs: proof.walletAddress === state.connectedWallet 
            ? [...state.userProofs, proof] 
            : state.userProofs
        }));
      },

      updateProof: (id, updates) => {
        set((state) => ({
          proofs: state.proofs.map(p => p.id === id ? { ...p, ...updates } : p),
          userProofs: state.userProofs.map(p => p.id === id ? { ...p, ...updates } : p)
        }));
      },

      removeProof: (id) => {
        set((state) => ({
          proofs: state.proofs.filter(p => p.id !== id),
          userProofs: state.userProofs.filter(p => p.id !== id)
        }));
      },

      addEndorsement: (proofId, endorsement) => {
        set((state) => ({
          proofs: state.proofs.map(p => 
            p.id === proofId 
              ? { ...p, endorsements: [...p.endorsements, endorsement] }
              : p
          ),
          userProofs: state.userProofs.map(p => 
            p.id === proofId 
              ? { ...p, endorsements: [...p.endorsements, endorsement] }
              : p
          )
        }));
      },

      // Freelancer actions
      setFreelancers: (freelancers) => set({ freelancers }),

      addFreelancer: (freelancer) => {
        set((state) => ({
          freelancers: [...state.freelancers.filter(f => f.walletAddress !== freelancer.walletAddress), freelancer]
        }));
      },

      updateFreelancer: (address, updates) => {
        set((state) => ({
          freelancers: state.freelancers.map(f => 
            f.walletAddress === address ? { ...f, ...updates } : f
          ),
          currentFreelancer: state.currentFreelancer?.walletAddress === address 
            ? { ...state.currentFreelancer, ...updates }
            : state.currentFreelancer
        }));
      },

      setCurrentFreelancer: (freelancer) => set({ currentFreelancer: freelancer }),

      // UI actions
      setLoading: (loading) => set({ isLoading: loading }),
      setError: (error) => set({ error }),
      clearError: () => set({ error: null }),

      // Data loading actions
      loadUserProofs: async (walletAddress) => {
        try {
          set({ isLoading: true, error: null });
          
          // Load from localStorage first for instant display
          const stored = localStorage.getItem(`proofs_${walletAddress}`);
          if (stored) {
            const userProofs = JSON.parse(stored);
            set({ userProofs });
          }

          // Then load from blockchain (would be real blockchain calls)
          // For now, we'll simulate the loading
          await new Promise(resolve => setTimeout(resolve, 1000));
          
          set({ isLoading: false });
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
          set({ error: `Failed to load proofs: ${errorMessage}`, isLoading: false });
        }
      },

      loadAllProofs: async () => {
        try {
          set({ isLoading: true, error: null });
          
          // Load cached proofs first
          const stored = localStorage.getItem('all_proofs');
          if (stored) {
            const proofs = JSON.parse(stored);
            set({ proofs });
          }

          // Simulate loading from blockchain
          await new Promise(resolve => setTimeout(resolve, 1000));
          
          set({ isLoading: false });
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
          set({ error: `Failed to load proofs: ${errorMessage}`, isLoading: false });
        }
      },

      loadFreelancers: async () => {
        try {
          set({ isLoading: true, error: null });
          
          // Load cached freelancers
          const stored = localStorage.getItem('freelancers');
          if (stored) {
            const freelancers = JSON.parse(stored);
            set({ freelancers });
          }

          // Simulate loading from blockchain
          await new Promise(resolve => setTimeout(resolve, 1000));
          
          set({ isLoading: false });
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
          set({ error: `Failed to load freelancers: ${errorMessage}`, isLoading: false });
        }
      },

      // Search and filter functions
      searchProofs: (query) => {
        const { proofs } = get();
        const lowerQuery = query.toLowerCase();
        return proofs.filter(proof => 
          proof.title.toLowerCase().includes(lowerQuery) ||
          proof.description.toLowerCase().includes(lowerQuery) ||
          proof.tags.some(tag => tag.toLowerCase().includes(lowerQuery))
        );
      },

      searchFreelancers: (query) => {
        const { freelancers } = get();
        const lowerQuery = query.toLowerCase();
        return freelancers.filter(freelancer => 
          freelancer.name?.toLowerCase().includes(lowerQuery) ||
          freelancer.bio?.toLowerCase().includes(lowerQuery) ||
          freelancer.specialties.some(spec => spec.toLowerCase().includes(lowerQuery)) ||
          freelancer.walletAddress.toLowerCase().includes(lowerQuery)
        );
      },

      getProofsByType: (type) => {
        const { proofs } = get();
        return proofs.filter(proof => proof.type === type);
      },

      getProofsByTags: (tags) => {
        const { proofs } = get();
        return proofs.filter(proof => 
          tags.some(tag => proof.tags.includes(tag))
        );
      },
    }),
    {
      name: 'saveyourproofs-storage',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        connectedWallet: state.connectedWallet,
        walletType: state.walletType,
        proofs: state.proofs,
        userProofs: state.userProofs,
        freelancers: state.freelancers,
        currentFreelancer: state.currentFreelancer,
      }),
    }
  )
); 