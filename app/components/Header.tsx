'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Menu, X, Search, Plus, User, Shield, Zap, Home } from 'lucide-react';
import Link from 'next/link';
import { WalletConnect } from './WalletConnect';

export function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);

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
          ? 'glass-panel border-b border-purple-500/20 backdrop-blur-md' 
          : 'bg-transparent'
      }`}
    >
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-3 group" onClick={closeMenu}>
            <div className="relative">
              <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-purple-700 rounded-lg flex items-center justify-center transition-all duration-300 hover:scale-105">
                <Shield className="w-5 h-5 text-white" />
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
                className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 lg:hidden"
                onClick={closeMenu}
              />
              
              {/* Mobile Menu Panel */}
              <motion.div
                initial={{ opacity: 0, x: '100%' }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: '100%' }}
                transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                className="fixed top-16 right-0 bottom-0 w-80 max-w-[85vw] bg-dark-800/95 backdrop-blur-md border-l border-purple-500/20 z-50 lg:hidden"
              >
                <div className="flex flex-col h-full">
                  {/* Navigation Links */}
                  <nav className="flex-1 px-6 py-8">
                    <div className="space-y-2">
                      {navigation.map((item, index) => (
                        <motion.div
                          key={item.name}
                          initial={{ opacity: 0, x: 20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: index * 0.1 }}
                        >
                          <Link
                            href={item.href}
                            className="flex items-center gap-4 px-4 py-4 rounded-lg text-base font-medium text-gray-300 hover:text-white hover:bg-purple-500/20 transition-all duration-300 group"
                            onClick={closeMenu}
                          >
                            <div className="w-10 h-10 bg-purple-500/20 border border-purple-400/30 rounded-lg flex items-center justify-center group-hover:bg-purple-500/30 transition-colors">
                              <item.icon className="w-5 h-5 group-hover:text-purple-400 transition-colors" />
                            </div>
                            <span>{item.name}</span>
                          </Link>
                        </motion.div>
                      ))}
                    </div>
                  </nav>
                  
                  {/* Wallet Connection */}
                  <div className="border-t border-purple-500/20 p-6">
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.4 }}
                    >
                      <div className="text-sm text-gray-400 mb-3">Wallet Connection</div>
                      <div className="w-full">
                        <WalletConnect />
                      </div>
                    </motion.div>
                  </div>
                  
                  {/* App Info */}
                  <div className="border-t border-purple-500/20 p-6">
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