'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Menu, X, Search, Plus, User, Shield, Zap, Home } from 'lucide-react';
import Link from 'next/link';
import { WalletConnect } from './WalletConnect';
import Image from 'next/image';

// Fallback logo component
const FallbackLogo = () => (
  <div className="w-full h-full bg-gradient-to-br from-purple-600 to-purple-800 rounded-lg flex items-center justify-center text-white font-bold text-lg shadow-lg">
    S
  </div>
);

export function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [logoError, setLogoError] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const navigation = [
    { name: 'Home', href: '/', icon: Home },
    { name: 'Explore', href: '/explore', icon: Search },
    { name: 'Dashboard', href: '/dashboard', icon: User },
    { name: 'Submit Proof', href: '/submit', icon: Plus },
  ];

  const closeMenu = () => setIsMenuOpen(false);

  return (
    <header 
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        isScrolled 
          ? 'glass-panel border-b border-purple-500/20 backdrop-blur-xl' 
          : 'bg-transparent'
      }`}
      style={isScrolled ? {
        background: 'linear-gradient(180deg, rgba(10, 10, 11, 0.95) 0%, rgba(17, 17, 19, 0.92) 100%)',
        backdropFilter: 'blur(20px) saturate(180%)',
        WebkitBackdropFilter: 'blur(20px) saturate(180%)',
      } : undefined}
    >
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-3 group" onClick={closeMenu}>
            <div className="relative">
              <div className="w-10 h-10 rounded-lg overflow-hidden transition-all duration-300 hover:scale-105 bg-purple-600/20 border border-purple-500/30 relative">
                {logoError ? (
                  <FallbackLogo />
                ) : (
                  <Image 
                    src="/icon.png" 
                    alt="SaveYourProofs Logo" 
                    width={40}
                    height={40}
                    className="w-full h-full object-contain"
                    onLoad={() => console.log('Logo loaded successfully')}
                    onError={(e) => {
                      console.error('Logo failed to load, trying fallback:', e);
                      setLogoError(true);
                    }}
                    priority
                  />
                )}
              </div>
              <div className="absolute -top-1 -right-1 w-3 h-3 bg-purple-400 rounded-full animate-pulse"></div>
            </div>
            <div className="hidden sm:block">
              <span className="text-lg font-bold bg-gradient-to-r from-white to-purple-400 bg-clip-text text-transparent">
                SaveYourProofs
              </span>
              <div className="text-xs text-purple-400 font-mono">v1.0.0</div>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden lg:flex items-center gap-1">
            {navigation.map((item) => (
              <Link
                key={item.name}
                href={item.href}
                className="flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium text-gray-300 hover:text-white hover:bg-purple-500/20 transition-all duration-300 group"
              >
                <item.icon className="w-4 h-4 group-hover:text-purple-400 transition-colors" />
                {item.name}
              </Link>
            ))}
          </nav>

          {/* Right Section */}
          <div className="flex items-center gap-3">
            <div className="hidden md:block">
              <div className="max-w-xs">
                <WalletConnect />
              </div>
            </div>
            
            {/* Mobile menu button */}
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="lg:hidden relative p-2 rounded-md text-gray-400 hover:text-white hover:bg-purple-500/20 transition-colors focus:outline-none focus:ring-2 focus:ring-purple-500"
              aria-label="Toggle menu"
            >
              <AnimatePresence mode="wait">
                {isMenuOpen ? (
                  <motion.div
                    key="close"
                    initial={{ opacity: 0, rotate: -90 }}
                    animate={{ opacity: 1, rotate: 0 }}
                    exit={{ opacity: 0, rotate: 90 }}
                    transition={{ duration: 0.2 }}
                  >
                    <X className="w-5 h-5" />
                  </motion.div>
                ) : (
                  <motion.div
                    key="menu"
                    initial={{ opacity: 0, rotate: 90 }}
                    animate={{ opacity: 1, rotate: 0 }}
                    exit={{ opacity: 0, rotate: -90 }}
                    transition={{ duration: 0.2 }}
                  >
                    <Menu className="w-5 h-5" />
                  </motion.div>
                )}
              </AnimatePresence>
            </button>
          </div>
        </div>

        {/* Mobile Navigation Overlay */}
        <AnimatePresence>
          {isMenuOpen && (
            <>
              {/* Backdrop */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 bg-black/70 backdrop-blur-md z-40 lg:hidden"
                onClick={closeMenu}
                style={{
                  backdropFilter: 'blur(8px) saturate(180%)',
                  WebkitBackdropFilter: 'blur(8px) saturate(180%)',
                }}
              />
              
              {/* Mobile Menu Panel */}
              <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                className="fixed top-16 left-0 right-0 max-h-[calc(100vh-4rem)] overflow-y-auto border-b border-purple-500/30 z-50 lg:hidden shadow-2xl"
                style={{
                  background: 'linear-gradient(180deg, rgb(10, 10, 11) 0%, rgb(17, 17, 19) 100%)',
                  backdropFilter: 'blur(20px) saturate(180%)',
                  WebkitBackdropFilter: 'blur(20px) saturate(180%)',
                }}
              >
                {/* Solid background overlay to prevent transparency */}
                <div className="absolute inset-0 bg-dark-900 opacity-95"></div>
                <div className="relative z-10">
                  {/* Navigation Links */}
                  <nav className="px-4 py-4 bg-dark-900/40">
                    <div className="grid grid-cols-2 gap-3">
                      {navigation.map((item, index) => (
                        <motion.div
                          key={item.name}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: index * 0.05 }}
                        >
                          <Link
                            href={item.href}
                            className="flex flex-col items-center gap-2 px-3 py-4 rounded-lg text-sm font-medium text-gray-300 hover:text-white bg-dark-800/80 hover:bg-purple-500/40 transition-all duration-300 group border border-purple-500/10 hover:border-purple-400/30"
                            onClick={closeMenu}
                          >
                            <div className="w-8 h-8 bg-purple-600/60 border border-purple-400/50 rounded-lg flex items-center justify-center group-hover:bg-purple-500/80 transition-colors">
                              <item.icon className="w-4 h-4 text-purple-300 group-hover:text-purple-200 transition-colors" />
                            </div>
                            <span className="text-xs">{item.name}</span>
                          </Link>
                        </motion.div>
                      ))}
                    </div>
                  </nav>
                  
                  {/* Wallet Connection */}
                  <div className="border-t border-purple-500/30 p-4 bg-dark-800/60">
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.2 }}
                    >
                      <div className="text-xs text-gray-400 mb-2">Wallet Connection</div>
                      <div className="w-full">
                        <WalletConnect />
                      </div>
                    </motion.div>
                  </div>
                  
                  {/* App Info */}
                  <div className="border-t border-purple-500/30 p-6 bg-dark-900/80">
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.5 }}
                      className="text-center"
                    >
                      <div className="text-sm text-gray-400 mb-1">SaveYourProofs</div>
                      <div className="text-xs text-purple-400 font-mono">v1.0.0</div>
                      <div className="text-xs text-gray-500 mt-2">Decentralized Proof of Work</div>
                    </motion.div>
                  </div>
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>
      </div>
    </header>
  );
} 