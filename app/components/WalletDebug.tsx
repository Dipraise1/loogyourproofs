'use client';

import { useWallet } from '@solana/wallet-adapter-react';
import { useAppStore } from '../../lib/store';
import { useState, useEffect, useRef } from 'react';

export function WalletDebug() {
  const { wallet, connecting, connected, publicKey } = useWallet();
  const { connectedWallet, walletType } = useAppStore();
  const [ethereumAccount, setEthereumAccount] = useState<string | null>(null);
  const [isVisible, setIsVisible] = useState(false);
  const updateIntervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const updateEthereumAccount = async () => {
      if (typeof window !== 'undefined' && window.ethereum) {
        try {
          const accounts = await window.ethereum.request({ method: 'eth_accounts' });
          setEthereumAccount(accounts.length > 0 ? accounts[0] : null);
        } catch (error) {
          console.error('Error checking Ethereum account:', error);
          setEthereumAccount(null);
        }
      } else {
        setEthereumAccount(null);
      }
    };

    // Update immediately
    updateEthereumAccount();

    // Then update periodically only when debug panel is visible
    if (isVisible) {
      updateIntervalRef.current = setInterval(updateEthereumAccount, 2000);
    } else if (updateIntervalRef.current) {
      clearInterval(updateIntervalRef.current);
      updateIntervalRef.current = null;
    }

    return () => {
      if (updateIntervalRef.current) {
        clearInterval(updateIntervalRef.current);
      }
    };
  }, [isVisible]);

  // Only show in development
  if (process.env.NODE_ENV !== 'development') {
    return null;
  }

  return (
    <div className="fixed bottom-4 right-4 z-50">
      <button
        onClick={() => setIsVisible(!isVisible)}
        className="bg-purple-600 text-white px-3 py-1 rounded text-xs hover:bg-purple-500"
      >
        {isVisible ? 'Hide' : 'Debug'}
      </button>
      
      {isVisible && (
        <div className="absolute bottom-10 right-0 bg-black/90 border border-purple-500/50 rounded-lg p-4 min-w-80 text-xs text-white">
          <div className="font-bold mb-2">Wallet Debug Info</div>
          
          <div className="space-y-1 font-mono">
            <div><strong>Solana:</strong></div>
            <div>Connected: {connected ? '✅' : '❌'}</div>
            <div>Connecting: {connecting ? '⏳' : '❌'}</div>
            <div>Wallet: {wallet?.adapter?.name || 'None'}</div>
            <div>PublicKey: {publicKey?.toBase58().slice(0, 8) + '...' || 'None'}</div>
            
            <div className="mt-2"><strong>Ethereum:</strong></div>
            <div>Account: {ethereumAccount ? ethereumAccount.slice(0, 8) + '...' : 'None'}</div>
            <div>Available: {typeof window !== 'undefined' && window.ethereum ? '✅' : '❌'}</div>
            
            <div className="mt-2"><strong>Store:</strong></div>
            <div>Connected: {connectedWallet ? connectedWallet.slice(0, 8) + '...' : 'None'}</div>
            <div>Type: {walletType || 'None'}</div>
            
            <div className="mt-2"><strong>LocalStorage:</strong></div>
            <div>Last: {typeof window !== 'undefined' ? localStorage.getItem('lastConnectedWallet') || 'None' : 'N/A'}</div>
            <div>EthAccount: {typeof window !== 'undefined' && localStorage.getItem('ethAccount') ? localStorage.getItem('ethAccount')?.slice(0, 8) + '...' : 'None'}</div>
          </div>
          
          <div className="mt-3 pt-2 border-t border-purple-500/30 flex gap-2">
            <button
              onClick={() => {
                localStorage.clear();
                window.location.reload();
              }}
              className="bg-red-600 text-white px-2 py-1 rounded text-xs hover:bg-red-500"
            >
              Clear & Reload
            </button>
            <button
              onClick={() => {
                console.clear();
                console.log('Console cleared by debug panel');
              }}
              className="bg-blue-600 text-white px-2 py-1 rounded text-xs hover:bg-blue-500"
            >
              Clear Console
            </button>
          </div>
        </div>
      )}
    </div>
  );
} 