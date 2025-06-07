'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { motion } from 'framer-motion';
import { Wallet, Zap, AlertTriangle } from 'lucide-react';
import { useWallet } from '@solana/wallet-adapter-react';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import { useWalletModal } from '@solana/wallet-adapter-react-ui';
import { useAppStore } from '../../lib/store';

export function WalletConnect() {
  const { wallet, connecting, connected, disconnect, publicKey } = useWallet();
  const { setVisible } = useWalletModal();
  const { setConnectedWallet } = useAppStore();
  const [isEthereumConnected, setIsEthereumConnected] = useState(false);
  const [isEthConnecting, setIsEthConnecting] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);
  
  // Use refs to prevent stale closures and track initialization
  const ethListenerRef = useRef<((accounts: string[]) => void) | null>(null);
  const hasInitialized = useRef(false);
  const lastSolanaState = useRef<{ connected: boolean; publicKey: string | null }>({ connected: false, publicKey: null });

  // Ethereum event handler with stable reference
  const handleEthAccountsChanged = useCallback((accounts: string[]) => {
    console.log('Ethereum accounts changed:', accounts);
    if (accounts.length > 0) {
      setIsEthereumConnected(true);
      setConnectedWallet(accounts[0], 'metamask');
      localStorage.setItem('lastConnectedWallet', 'ethereum');
      localStorage.setItem('ethAccount', accounts[0]);
    } else {
      setIsEthereumConnected(false);
      setConnectedWallet(null, null);
      localStorage.removeItem('lastConnectedWallet');
      localStorage.removeItem('ethAccount');
    }
  }, [setConnectedWallet]);

  // Single initialization effect - runs once
  useEffect(() => {
    if (typeof window === 'undefined' || hasInitialized.current) return;
    
    hasInitialized.current = true;
    console.log('Initializing wallets...');

    const initializeWallets = async () => {
      try {
        const savedWalletType = localStorage.getItem('lastConnectedWallet');
        const savedEthAccount = localStorage.getItem('ethAccount');
        
        // Check Ethereum connection
        if (window.ethereum && savedWalletType === 'ethereum' && savedEthAccount) {
          try {
            const accounts = await window.ethereum.request({ method: 'eth_accounts' });
            if (accounts.length > 0 && accounts.includes(savedEthAccount)) {
              setIsEthereumConnected(true);
              setConnectedWallet(accounts[0], 'metamask');
              
              // Set up event listener
              if (ethListenerRef.current) {
                window.ethereum.removeListener('accountsChanged', ethListenerRef.current);
              }
              ethListenerRef.current = handleEthAccountsChanged;
              window.ethereum.on('accountsChanged', ethListenerRef.current);
            }
          } catch (error) {
            console.error('Error checking Ethereum connection:', error);
            localStorage.removeItem('lastConnectedWallet');
            localStorage.removeItem('ethAccount');
          }
        }
      } catch (error) {
        console.error('Error initializing wallets:', error);
      } finally {
        setIsInitialized(true);
      }
    };

    initializeWallets();
  }, []); // No dependencies - run once only

  // Handle Solana wallet state changes - with guards to prevent loops
  useEffect(() => {
    if (!isInitialized) return;

    const currentState = {
      connected,
      publicKey: publicKey?.toBase58() || null
    };

    // Only process if state actually changed
    if (
      currentState.connected !== lastSolanaState.current.connected ||
      currentState.publicKey !== lastSolanaState.current.publicKey
    ) {
      console.log('Solana state changed:', { 
        connected, 
        publicKey: currentState.publicKey, 
        isEthereumConnected 
      });

      lastSolanaState.current = currentState;

      if (connected && publicKey && !isEthereumConnected) {
        setConnectedWallet(publicKey.toBase58(), 'phantom');
        localStorage.setItem('lastConnectedWallet', 'solana');
      } else if (!connected && !isEthereumConnected) {
        const savedWalletType = localStorage.getItem('lastConnectedWallet');
        if (savedWalletType === 'solana') {
          setConnectedWallet(null, null);
          localStorage.removeItem('lastConnectedWallet');
        }
      }
    }
  }, [connected, publicKey, isEthereumConnected, isInitialized]); // Remove setConnectedWallet from deps

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (typeof window !== 'undefined' && window.ethereum && ethListenerRef.current) {
        window.ethereum.removeListener('accountsChanged', ethListenerRef.current);
        ethListenerRef.current = null;
      }
    };
  }, []);

  const handleSolanaConnect = useCallback(() => {
    setVisible(true);
  }, [setVisible]);

  const handleEthereumConnect = async () => {
    if (typeof window === 'undefined' || !window.ethereum) {
      alert('MetaMask not found. Please install MetaMask to connect.');
      return;
    }

    setIsEthConnecting(true);
    try {
      // Disconnect Solana wallet first if connected
      if (connected) {
        await disconnect();
      }
      
      const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
      if (accounts.length > 0) {
        setIsEthereumConnected(true);
        setConnectedWallet(accounts[0], 'metamask');
        localStorage.setItem('lastConnectedWallet', 'ethereum');
        localStorage.setItem('ethAccount', accounts[0]);
        
        // Set up event listener
        if (ethListenerRef.current) {
          window.ethereum.removeListener('accountsChanged', ethListenerRef.current);
        }
        ethListenerRef.current = handleEthAccountsChanged;
        window.ethereum.on('accountsChanged', ethListenerRef.current);
      }
    } catch (error) {
      console.error('Failed to connect to Ethereum wallet:', error);
      setIsEthereumConnected(false);
    } finally {
      setIsEthConnecting(false);
    }
  };

  const handleEthereumDisconnect = useCallback(() => {
    setIsEthereumConnected(false);
    setConnectedWallet(null, null);
    localStorage.removeItem('lastConnectedWallet');
    localStorage.removeItem('ethAccount');
    
    // Remove event listener
    if (typeof window !== 'undefined' && window.ethereum && ethListenerRef.current) {
      window.ethereum.removeListener('accountsChanged', ethListenerRef.current);
      ethListenerRef.current = null;
    }
  }, []); // Remove setConnectedWallet from deps

  const handleSolanaDisconnect = async () => {
    try {
      await disconnect();
      setConnectedWallet(null, null);
      localStorage.removeItem('lastConnectedWallet');
    } catch (error) {
      console.error('Error disconnecting Solana wallet:', error);
      // Force cleanup even if disconnect fails
      setConnectedWallet(null, null);
      localStorage.removeItem('lastConnectedWallet');
    }
  };

  if (connected || isEthereumConnected) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="flex items-center gap-3"
      >
        <div className="glass-panel px-4 py-2 flex items-center gap-2">
          <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
          <span className="text-sm text-green-300">Connected</span>
          <span className="text-xs text-gray-400 font-mono">
            {connected ? (wallet?.adapter?.name || 'Solana') : 'MetaMask'}
          </span>
        </div>
        <button
          onClick={connected ? handleSolanaDisconnect : handleEthereumDisconnect}
          className="neon-button text-xs px-3 py-1.5"
        >
          Disconnect
        </button>
      </motion.div>
    );
  }

  if (!isInitialized || connecting || isEthConnecting) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="flex items-center gap-2 px-4 py-2"
      >
        <div className="w-4 h-4 border-2 border-purple-400 border-t-transparent rounded-full animate-spin"></div>
        <span className="text-sm text-purple-300">
          {!isInitialized ? 'Initializing...' : connecting ? 'Connecting to Solana...' : 'Connecting to Ethereum...'}
        </span>
      </motion.div>
    );
  }

  return (
    <div className="flex flex-col gap-2 w-full max-w-xs">
      <motion.div
        whileHover={{ scale: 1.01 }}
        whileTap={{ scale: 0.99 }}
        className="w-full"
      >
        <WalletMultiButton className="!bg-purple-600 !border !border-purple-500 !text-white !font-medium !rounded-lg !px-4 !py-2.5 !text-sm !transition-all !duration-300 hover:!bg-purple-500 !w-full !min-h-[40px] !flex !items-center !justify-center" />
      </motion.div>
      
      <div className="flex items-center gap-2 my-1">
        <div className="h-px bg-purple-500/30 flex-1"></div>
        <span className="text-xs text-gray-500 px-2">OR</span>
        <div className="h-px bg-purple-500/30 flex-1"></div>
      </div>
      
      <motion.button
        whileHover={{ scale: 1.01 }}
        whileTap={{ scale: 0.99 }}
        onClick={handleEthereumConnect}
        className="neon-button-primary inline-flex items-center gap-2 justify-center w-full min-h-[40px] py-2.5 px-4"
      >
        <img 
          src="data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzIiIGhlaWdodD0iMzIiIHZpZXdCb3g9IjAgMCAzMiAzMiIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPGNpcmNsZSBjeD0iMTYiIGN5PSIxNiIgcj0iMTYiIGZpbGw9IiNGNjg1MUIiLz4KPHBhdGggZD0iTTE2LjUgNFYxMi41TDI0IDE2TDE2LjUgNFoiIGZpbGw9IndoaXRlIiBmaWxsLW9wYWNpdHk9IjAuNjAyIi8+CjxwYXRoIGQ9Ik0xNi41IDRMOSAxNkwxNi41IDEyLjVWNFoiIGZpbGw9IndoaXRlIi8+CjxwYXRoIGQ9Ik0xNi41IDE3LjVWMjhMMjQgMTdMMTYuNSAxNy41WiIgZmlsbD0id2hpdGUiIGZpbGwtb3BhY2l0eT0iMC42MDIiLz4KPHBhdGggZD0iTTE2LjUgMjhWMTcuNUw5IDE3TDE2LjUgMjhaIiBmaWxsPSJ3aGl0ZSIvPgo8L3N2Zz4K"
          alt="Ethereum"
          className="w-4 h-4 flex-shrink-0"
        />
        <span className="text-sm">Connect MetaMask</span>
      </motion.button>
      
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-start gap-2 text-xs text-purple-300/80 mt-2 p-2 bg-purple-500/5 rounded-lg border border-purple-500/20"
      >
        <AlertTriangle className="w-3 h-3 flex-shrink-0 mt-0.5" />
        <span className="text-left leading-relaxed">Connect your Web3 wallet to start building your decentralized portfolio</span>
      </motion.div>
    </div>
  );
} 