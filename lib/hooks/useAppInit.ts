import { useEffect } from 'react';
import { useAppStore } from '../store';
import { publicDataService } from '../public-data-service';

export function useAppInit() {
  const { initializeAppData, isLoading } = useAppStore();

  useEffect(() => {
    const initializeApp = async () => {
      try {
        console.log('Initializing SaveYourProofs application...');
        
        // Initialize public data service first
        await publicDataService.initialize();
        console.log('Public data service initialized');
        
        // Initialize app data from storage (now includes IPFS)
        await initializeAppData();
        
        console.log('Application initialized successfully');
      } catch (error) {
        console.error('Failed to initialize application:', error);
      }
    };

    initializeApp();
  }, [initializeAppData]);

  return { isLoading };
} 