import { useEffect } from 'react';
import { useAppStore } from '../store';

export function useAppInit() {
  const { initializeAppData, isLoading } = useAppStore();

  useEffect(() => {
    // Initialize app data on mount
    initializeAppData();
  }, [initializeAppData]);

  return { isLoading };
} 