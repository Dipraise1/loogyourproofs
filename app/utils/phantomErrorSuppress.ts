/**
 * Utility to suppress annoying Phantom wallet service worker errors
 * These errors are harmless but clutter the console
 */

let originalConsoleError: typeof console.error | null = null;
let isSuppressionActive = false;

export function suppressPhantomErrors() {
  if (isSuppressionActive) return;
  
  originalConsoleError = console.error;
  isSuppressionActive = true;
  
  console.error = (...args: any[]) => {
    const message = args.join(' ');
    
    // Check for wallet-specific error patterns
    const walletErrorPatterns = [
      'Failed to send message to service worker',
      'disconnected port object',
      '[PHANTOM]',
      'Attempting to use a disconnected port',
      'The message port closed before a response was received',
      'solflare-detect-metamask',
      'StreamMiddleware - Unknown response id',
      'wallet-standard',
      'wallet detection',
    ];
    
    const isWalletError = walletErrorPatterns.some(pattern => 
      message.toLowerCase().includes(pattern.toLowerCase())
    );
    
    // Only suppress wallet service worker errors, not real errors
    if (isWalletError) {
      // Optionally log a quieter version for debugging
      console.debug('Wallet communication (suppressed):', args[0]);
      return;
    }
    
    // Forward all other errors to original console.error
    if (originalConsoleError) {
      originalConsoleError.apply(console, args);
    }
  };
}

export function restoreConsoleError() {
  if (!isSuppressionActive || !originalConsoleError) return;
  
  console.error = originalConsoleError;
  originalConsoleError = null;
  isSuppressionActive = false;
}

// Also suppress window errors from Phantom extension
let originalWindowError: typeof window.onerror | null = null;

export function suppressPhantomWindowErrors() {
  if (typeof window === 'undefined') return;
  
  originalWindowError = window.onerror;
  
  window.onerror = (message, source, lineno, colno, error) => {
    const msgStr = typeof message === 'string' ? message : '';
    const srcStr = source || '';
    
    // Check if it's a wallet-related error
    const isWalletError = 
      msgStr.includes('Failed to send message to service worker') ||
      msgStr.includes('disconnected port object') ||
      msgStr.includes('[PHANTOM]') ||
      msgStr.includes('solflare-detect-metamask') ||
      msgStr.includes('StreamMiddleware') ||
      msgStr.includes('wallet-standard') ||
      srcStr.includes('phantom') ||
      srcStr.includes('solflare') ||
      srcStr.includes('contentScript');
    
    if (isWalletError) {
      console.debug('🔇 Wallet extension error suppressed:', msgStr);
      return true; // Prevent default error handling
    }
    
    // Forward all other errors
    if (originalWindowError) {
      return originalWindowError(message, source, lineno, colno, error);
    }
    
    return false;
  };
}

export function restoreWindowError() {
  if (typeof window === 'undefined' || !originalWindowError) return;
  
  window.onerror = originalWindowError;
  originalWindowError = null;
}

// Auto-suppress on import (can be disabled by calling restore functions)
if (typeof window !== 'undefined') {
  suppressPhantomErrors();
  suppressPhantomWindowErrors();
} 