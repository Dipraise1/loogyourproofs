'use client';

import { useState, useEffect, useCallback } from 'react';
import { ipfsService, IPFSUploadResult, ProofMetadata } from '../ipfs';

export interface UseIPFSReturn {
  isAvailable: boolean;
  isInitialized: boolean;
  uploadFile: (file: File) => Promise<IPFSUploadResult>;
  uploadFiles: (files: File[]) => Promise<IPFSUploadResult[]>;
  uploadProofMetadata: (metadata: ProofMetadata) => Promise<IPFSUploadResult>;
  uploadCompleteProof: (
    metadata: Omit<ProofMetadata, 'attachments'>,
    files: File[]
  ) => Promise<{
    metadataHash: string;
    metadataUrl: string;
    attachments: IPFSUploadResult[];
    totalSize: number;
  }>;
  getContent: (hash: string) => Promise<string>;
  getProofMetadata: (hash: string) => Promise<ProofMetadata>;
  isContentAvailable: (hash: string) => Promise<boolean>;
}

export function useIPFS(): UseIPFSReturn {
  const [isAvailable, setIsAvailable] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);

  // Initialize IPFS service only on client side
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const initializeIPFS = async () => {
        try {
          // Check if IPFS is available
          const available = ipfsService.isAvailable();
          setIsAvailable(available);
          setIsInitialized(true);
          
          if (available) {
            console.log('✅ IPFS service is available');
          } else {
            console.warn('⚠️ IPFS service is not available');
          }
        } catch (error) {
          console.error('❌ Failed to initialize IPFS:', error);
          setIsAvailable(false);
          setIsInitialized(true);
        }
      };

      initializeIPFS();
    }
  }, []);

  const uploadFile = useCallback(async (file: File): Promise<IPFSUploadResult> => {
    if (typeof window === 'undefined') {
      throw new Error('IPFS upload can only be used in browser environment');
    }
    
    if (!isAvailable) {
      throw new Error('IPFS service is not available');
    }

    return await ipfsService.uploadFile(file);
  }, [isAvailable]);

  const uploadFiles = useCallback(async (files: File[]): Promise<IPFSUploadResult[]> => {
    if (typeof window === 'undefined') {
      throw new Error('IPFS upload can only be used in browser environment');
    }
    
    if (!isAvailable) {
      throw new Error('IPFS service is not available');
    }

    return await ipfsService.uploadFiles(files);
  }, [isAvailable]);

  const uploadProofMetadata = useCallback(async (metadata: ProofMetadata): Promise<IPFSUploadResult> => {
    if (typeof window === 'undefined') {
      throw new Error('IPFS upload can only be used in browser environment');
    }
    
    if (!isAvailable) {
      throw new Error('IPFS service is not available');
    }

    return await ipfsService.uploadProofMetadata(metadata);
  }, [isAvailable]);

  const uploadCompleteProof = useCallback(async (
    metadata: Omit<ProofMetadata, 'attachments'>,
    files: File[]
  ) => {
    if (typeof window === 'undefined') {
      throw new Error('IPFS upload can only be used in browser environment');
    }
    
    if (!isAvailable) {
      throw new Error('IPFS service is not available');
    }

    return await ipfsService.uploadCompleteProof(metadata, files);
  }, [isAvailable]);

  const getContent = useCallback(async (hash: string): Promise<string> => {
    if (typeof window === 'undefined') {
      throw new Error('IPFS content retrieval can only be used in browser environment');
    }
    
    if (!isAvailable) {
      throw new Error('IPFS service is not available');
    }

    return await ipfsService.getContent(hash);
  }, [isAvailable]);

  const getProofMetadata = useCallback(async (hash: string): Promise<ProofMetadata> => {
    if (typeof window === 'undefined') {
      throw new Error('IPFS metadata retrieval can only be used in browser environment');
    }
    
    if (!isAvailable) {
      throw new Error('IPFS service is not available');
    }

    return await ipfsService.getProofMetadata(hash);
  }, [isAvailable]);

  const isContentAvailable = useCallback(async (hash: string): Promise<boolean> => {
    if (typeof window === 'undefined') {
      return false;
    }
    
    if (!isAvailable) {
      return false;
    }

    return await ipfsService.isContentAvailable(hash);
  }, [isAvailable]);

  return {
    isAvailable,
    isInitialized,
    uploadFile,
    uploadFiles,
    uploadProofMetadata,
    uploadCompleteProof,
    getContent,
    getProofMetadata,
    isContentAvailable,
  };
} 