import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { ProofRecord, EndorsementRecord } from './blockchain';
import { ProofMetadata } from './ipfs';
import { publicDataService } from './public-data-service';

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
  
  // Auto-onboarding
  autoOnboardFreelancer: (walletAddress: string) => Promise<void>;
  
  // Initialize app data
  initializeAppData: () => Promise<void>;
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
          get().autoOnboardFreelancer(address);
        } else {
          set({ userProofs: [], currentFreelancer: null });
        }
      },

      // Proof actions
      addProof: (proof) => {
        set((state) => {
          const newProofs = [...state.proofs, proof];
          const newUserProofs = proof.walletAddress === state.connectedWallet 
            ? [...state.userProofs, proof] 
            : state.userProofs;
          
          // Save to localStorage immediately
          localStorage.setItem('all_proofs', JSON.stringify(newProofs));
          if (proof.walletAddress === state.connectedWallet) {
            localStorage.setItem(`proofs_${proof.walletAddress}`, JSON.stringify(newUserProofs));
          }
          
          return {
            proofs: newProofs,
            userProofs: newUserProofs
          };
        });
      },

      updateProof: (id, updates) => {
        set((state) => {
          const newProofs = state.proofs.map(p => p.id === id ? { ...p, ...updates } : p);
          const newUserProofs = state.userProofs.map(p => p.id === id ? { ...p, ...updates } : p);
          
          // Save to localStorage immediately
          localStorage.setItem('all_proofs', JSON.stringify(newProofs));
          if (state.connectedWallet) {
            localStorage.setItem(`proofs_${state.connectedWallet}`, JSON.stringify(newUserProofs));
          }
          
          return {
            proofs: newProofs,
            userProofs: newUserProofs
          };
        });
      },

      removeProof: (id) => {
        set((state) => {
          const newProofs = state.proofs.filter(p => p.id !== id);
          const newUserProofs = state.userProofs.filter(p => p.id !== id);
          
          // Save to localStorage immediately
          localStorage.setItem('all_proofs', JSON.stringify(newProofs));
          if (state.connectedWallet) {
            localStorage.setItem(`proofs_${state.connectedWallet}`, JSON.stringify(newUserProofs));
          }
          
          return {
            proofs: newProofs,
            userProofs: newUserProofs
          };
        });
      },

      addEndorsement: (proofId, endorsement) => {
        set((state) => {
          const newProofs = state.proofs.map(p => 
            p.id === proofId 
              ? { ...p, endorsements: [...p.endorsements, endorsement] }
              : p
          );
          const newUserProofs = state.userProofs.map(p => 
            p.id === proofId 
              ? { ...p, endorsements: [...p.endorsements, endorsement] }
              : p
          );
          
          // Save to localStorage immediately
          localStorage.setItem('all_proofs', JSON.stringify(newProofs));
          if (state.connectedWallet) {
            localStorage.setItem(`proofs_${state.connectedWallet}`, JSON.stringify(newUserProofs));
          }
          
          return {
            proofs: newProofs,
            userProofs: newUserProofs
          };
        });
      },

      // Freelancer actions
      setFreelancers: (freelancers) => {
        set({ freelancers });
        localStorage.setItem('freelancers', JSON.stringify(freelancers));
      },

      addFreelancer: (freelancer) => {
        set((state) => {
          const newFreelancers = [...state.freelancers.filter(f => f.walletAddress !== freelancer.walletAddress), freelancer];
          localStorage.setItem('freelancers', JSON.stringify(newFreelancers));
          return { freelancers: newFreelancers };
        });
      },

      updateFreelancer: (address, updates) => {
        set((state) => {
          const newFreelancers = state.freelancers.map(f => 
            f.walletAddress === address ? { ...f, ...updates } : f
          );
          const newCurrentFreelancer = state.currentFreelancer?.walletAddress === address 
            ? { ...state.currentFreelancer, ...updates }
            : state.currentFreelancer;
          
          localStorage.setItem('freelancers', JSON.stringify(newFreelancers));
          
          return {
            freelancers: newFreelancers,
            currentFreelancer: newCurrentFreelancer
          };
        });
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
          
          // Load from public IPFS first, then fallback to localStorage
          let userProofs: Proof[] = [];
          
          try {
            userProofs = await publicDataService.getFreelancerPublicProofs(walletAddress);
            console.log(`Loaded ${userProofs.length} proofs from public IPFS for ${walletAddress}`);
          } catch (publicError) {
            console.warn('Failed to load from public IPFS, using localStorage:', publicError);
            // Fallback to localStorage
            const stored = localStorage.getItem(`proofs_${walletAddress}`);
            if (stored) {
              userProofs = JSON.parse(stored);
            }
          }
          
          set({ userProofs, isLoading: false });
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
          set({ error: `Failed to load proofs: ${errorMessage}`, isLoading: false });
        }
      },

      loadAllProofs: async () => {
        try {
          set({ isLoading: true, error: null });
          
          // Load from public IPFS first, then fallback to localStorage
          let proofs: Proof[] = [];
          
          try {
            proofs = await publicDataService.getAllPublicProofs();
            console.log(`Loaded ${proofs.length} proofs from public IPFS`);
          } catch (publicError) {
            console.warn('Failed to load from public IPFS, using localStorage:', publicError);
            // Fallback to localStorage
            const stored = localStorage.getItem('all_proofs');
            if (stored) {
              proofs = JSON.parse(stored);
            }
          }
          
          set({ proofs, isLoading: false });
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
          set({ error: `Failed to load proofs: ${errorMessage}`, isLoading: false });
        }
      },

      loadFreelancers: async () => {
        try {
          set({ isLoading: true, error: null });
          
          // Load from public IPFS first, then fallback to localStorage
          let freelancers: Freelancer[] = [];
          
          try {
            const publicFreelancers = await publicDataService.getAllPublicFreelancers();
            // Convert public freelancer profiles to store format
            freelancers = publicFreelancers.map(pf => ({
              walletAddress: pf.walletAddress,
              name: pf.name,
              bio: pf.bio,
              avatar: pf.avatar,
              specialties: pf.specialties,
              rating: pf.rating,
              totalProofs: pf.totalProofs,
              totalEndorsements: pf.totalEndorsements,
              joinedAt: pf.joinedAt,
              social: pf.social
            }));
            console.log(`Loaded ${freelancers.length} freelancers from public IPFS`);
          } catch (publicError) {
            console.warn('Failed to load from public IPFS, using localStorage:', publicError);
            // Fallback to localStorage
            const stored = localStorage.getItem('freelancers');
            if (stored) {
              freelancers = JSON.parse(stored);
            }
          }
          
          set({ freelancers, isLoading: false });
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

      // Auto-onboarding function
      autoOnboardFreelancer: async (walletAddress: string) => {
        const { freelancers, addFreelancer, setCurrentFreelancer } = get();
        
        // Check if freelancer already exists
        let freelancer = freelancers.find(f => f.walletAddress === walletAddress);
        
        if (!freelancer) {
          // Create new freelancer
          freelancer = {
            walletAddress,
            name: `Freelancer ${walletAddress.slice(0, 6)}...${walletAddress.slice(-4)}`,
            bio: 'New to SaveYourProofs',
            specialties: [],
            rating: 0,
            totalProofs: 0,
            totalEndorsements: 0,
            joinedAt: Date.now(),
          };
          
          addFreelancer(freelancer);
          console.log('Auto-onboarded new freelancer:', walletAddress);
        }
        
        setCurrentFreelancer(freelancer);
      },

      // Initialize app data
      initializeAppData: async () => {
        try {
          set({ isLoading: true });
          
          // Load all data from localStorage
          const allProofs = JSON.parse(localStorage.getItem('all_proofs') || '[]');
          const freelancers = JSON.parse(localStorage.getItem('freelancers') || '[]');
          
          set({ 
            proofs: allProofs,
            freelancers: freelancers,
            isLoading: false 
          });
          
          console.log(`Loaded ${allProofs.length} proofs and ${freelancers.length} freelancers from storage`);
          
          // If connected wallet exists, load user-specific data
          const { connectedWallet } = get();
          if (connectedWallet) {
            const userProofs = JSON.parse(localStorage.getItem(`proofs_${connectedWallet}`) || '[]');
            const currentFreelancer = freelancers.find((f: Freelancer) => f.walletAddress === connectedWallet);
            
            set({ 
              userProofs,
              currentFreelancer: currentFreelancer || null 
            });
          }
          
        } catch (error) {
          console.error('Failed to initialize app data:', error);
          set({ isLoading: false, error: 'Failed to load application data' });
        }
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