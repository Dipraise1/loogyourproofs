'use client';

import { useState, useEffect } from 'react';
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

  // Update store when Solana wallet connects/disconnects
  useEffect(() => {
    if (connected && publicKey) {
      setConnectedWallet(publicKey.toBase58(), 'phantom');
    } else if (!connected) {
      setConnectedWallet(null, null);
    }
  }, [connected, publicKey, setConnectedWallet]);

  // Check for existing Ethereum connection
  useEffect(() => {
    const checkEthereumConnection = async () => {
      if (typeof window !== 'undefined' && window.ethereum) {
        try {
          const accounts = await window.ethereum.request({ method: 'eth_accounts' });
          if (accounts.length > 0) {
            setIsEthereumConnected(true);
            setConnectedWallet(accounts[0], 'metamask');
          }
        } catch (error) {
          console.error('Error checking Ethereum connection:', error);
        }
      }
    };

    checkEthereumConnection();
  }, [setConnectedWallet]);

  const handleSolanaConnect = () => {
    setVisible(true);
  };

  const handleEthereumConnect = async () => {
    if (typeof window !== 'undefined' && window.ethereum) {
      try {
        const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
        if (accounts.length > 0) {
          setIsEthereumConnected(true);
          setConnectedWallet(accounts[0], 'metamask');
        }
      } catch (error) {
        console.error('Failed to connect to Ethereum wallet:', error);
      }
    } else {
      alert('MetaMask not found. Please install MetaMask to connect.');
    }
  };

  const handleEthereumDisconnect = () => {
    setIsEthereumConnected(false);
    setConnectedWallet(null, null);
  };

  const handleSolanaDisconnect = () => {
    disconnect();
    setConnectedWallet(null, null);
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
            {connected ? wallet?.adapter?.name : 'MetaMask'}
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

  if (connecting) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="flex items-center gap-2 px-4 py-2"
      >
        <div className="w-4 h-4 border-2 border-purple-400 border-t-transparent rounded-full animate-spin"></div>
        <span className="text-sm text-purple-300">Connecting...</span>
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