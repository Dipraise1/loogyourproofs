'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Shield, 
  Wallet, 
  Upload, 
  CheckCircle, 
  Search,
  Github,
  Twitter,
  Globe,
  Sparkles,
  ArrowRight,
  Zap,
  Users,
  TrendingUp,
  Code,
  Database
} from 'lucide-react';
import Link from 'next/link';
import { WalletConnect } from './components/WalletConnect';
import { Header } from './components/Header';
import { useAppStore, type Proof } from '../lib/store';
import { useAppInit } from '../lib/hooks/useAppInit';

export default function HomePage() {
  const [mounted, setMounted] = useState(false);
  const { proofs, freelancers } = useAppStore();
  const { isLoading: appInitializing } = useAppInit();

  useEffect(() => {
    setMounted(true);
  }, []);

  // Calculate real statistics from the data
  const calculateStats = () => {
    const activeFreelancers = freelancers.length;
    const totalProofs = proofs.length;
    const totalEndorsements = proofs.reduce((sum: number, proof: Proof) => sum + proof.endorsements.length, 0);
    
    // Calculate success rate based on proofs with endorsements
    const proofsWithEndorsements = proofs.filter((proof: Proof) => proof.endorsements.length > 0).length;
    const successRate = totalProofs > 0 ? Math.round((proofsWithEndorsements / totalProofs) * 100) : 0;

    // Format numbers with K for thousands
    const formatNumber = (num: number) => {
      if (num >= 1000) {
        return `${(num / 1000).toFixed(1)}K+`;
      }
      return num.toString();
    };

    return [
      { label: 'Active Freelancers', value: formatNumber(activeFreelancers), icon: Users },
      { label: 'Proofs Submitted', value: formatNumber(totalProofs), icon: Upload },
      { label: 'Client Endorsements', value: formatNumber(totalEndorsements), icon: CheckCircle },
      { label: 'Success Rate', value: `${successRate}%`, icon: TrendingUp }
    ];
  };

  if (!mounted || appInitializing) {
    return (
      <div className="min-h-screen bg-dark-900 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="spinner"></div>
          <p className="text-gray-400 text-sm">
            {!mounted ? 'Loading...' : 'Initializing data...'}
          </p>
        </div>
      </div>
    );
  }

  const features = [
    {
      icon: Wallet,
      title: 'Connect Web3 Wallet',
      description: 'Link your Phantom, MetaMask, or other Web3 wallets for seamless authentication',
      color: 'purple'
    },
    {
      icon: Upload,
      title: 'Submit Work Proofs',
      description: 'Upload descriptions, images, GitHub repos, or any evidence of completed work',
      color: 'blue'
    },
    {
      icon: Shield,
      title: 'Immutable Storage',
      description: 'Content stored on IPFS with hashes secured by smart contracts on Solana/EVM',
      color: 'green'
    },
    {
      icon: CheckCircle,
      title: 'Client Endorsements',
      description: 'Get verifiable endorsements from clients, adding credibility to your work',
      color: 'yellow'
    },
    {
      icon: Search,
      title: 'Transparent Discovery',
      description: 'Search freelancers by wallet address, ENS names, or browse public portfolios',
      color: 'purple'
    },
    {
      icon: Zap,
      title: 'Cryptographic Proof',
      description: 'Every entry is wallet-signed, timestamped, and cryptographically linked',
      color: 'blue'
    }
  ];

  const stats = calculateStats();

  return (
    <div className="min-h-screen">
      <Header />
      
      {/* Hero Section with Background Image */}
      <section className="relative pt-32 pb-20 px-4 overflow-hidden">
        {/* Background Image */}
        <div className="absolute inset-0 z-0">
          <img 
            src="https://images.unsplash.com/photo-1639762681485-074b7f938ba0?q=80&w=2832&auto=format&fit=crop"
            alt="Blockchain network"
            className="w-full h-full object-cover opacity-10"
          />
          <div className="absolute inset-0 bg-gradient-to-br from-dark-900/90 via-dark-800/95 to-purple-900/90"></div>
        </div>
        
        <div className="container mx-auto max-w-7xl relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-center mb-16"
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-purple-500/30 bg-purple-500/10 mb-8">
              <Sparkles className="w-4 h-4 text-purple-400" />
              <span className="text-sm text-purple-300">Decentralized • Immutable • Verifiable</span>
            </div>
            
            <h1 className="text-5xl md:text-7xl font-bold mb-6 bg-gradient-to-r from-white via-purple-200 to-purple-400 bg-clip-text text-transparent leading-tight">
              Save Your Proofs
            </h1>
            
            <p className="text-xl md:text-2xl text-gray-300 mb-8 max-w-3xl mx-auto leading-relaxed">
              The first decentralized platform for freelancers to log immutable proof-of-work.
              <br />
              <span className="text-purple-300 font-medium">Connect your wallet. Submit evidence. Build trust.</span>
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <WalletConnect />
              <Link href="/explore" className="neon-button-primary inline-flex items-center gap-2">
                <Search className="w-4 h-4" />
                Explore Portfolios
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </motion.div>
          
          {/* Stats Section */}
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-16"
          >
            {stats.map((stat, index) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                className="glass-panel p-6 text-center"
              >
                <stat.icon className="w-8 h-8 text-purple-400 mx-auto mb-2" />
                <div className="text-2xl font-bold text-white mb-1">{stat.value}</div>
                <div className="text-sm text-gray-400">{stat.label}</div>
              </motion.div>
            ))}
          </motion.div>
          
          {/* Feature Grid */}
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.3 }}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
          >
            {features.map((feature, index) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                className="hologram-card p-6"
              >
                <div className="flex items-start gap-4">
                  <div className={`p-3 rounded-lg bg-${feature.color}-500/20 border border-${feature.color}-400/30`}>
                    <feature.icon className={`w-6 h-6 text-${feature.color}-400`} />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-white mb-2 text-lg">{feature.title}</h3>
                    <p className="text-gray-400 text-sm leading-relaxed">{feature.description}</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>
      
      {/* How It Works Section with Visual Elements */}
      <section className="py-20 px-4 relative">
        <div className="absolute inset-0 z-0">
          <img 
            src="https://images.unsplash.com/photo-1451187580459-43490279c0fa?q=80&w=2944&auto=format&fit=crop"
            alt="Digital technology background"
            className="w-full h-full object-cover opacity-5"
          />
        </div>
        
        <div className="container mx-auto max-w-6xl relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl md:text-5xl font-bold mb-6 text-purple-300">How It Works</h2>
            <p className="text-xl text-gray-300 max-w-2xl mx-auto">
              Build your decentralized portfolio in three simple steps
            </p>
          </motion.div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                step: '01',
                title: 'Connect Wallet',
                description: 'Link your Web3 wallet (Phantom, MetaMask, etc.) for secure authentication',
                icon: Wallet,
                image: 'https://images.unsplash.com/photo-1639762681485-074b7f938ba0?q=80&w=400&auto=format&fit=crop'
              },
              {
                step: '02',
                title: 'Submit Proofs',
                description: 'Upload work evidence, descriptions, images, or GitHub links with wallet signature',
                icon: Upload,
                image: 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?q=80&w=400&auto=format&fit=crop'
              },
              {
                step: '03',
                title: 'Build Reputation',
                description: 'Get client endorsements and build your verifiable on-chain reputation',
                icon: Shield,
                image: 'https://images.unsplash.com/photo-1559526324-4b87b5e36e44?q=80&w=400&auto=format&fit=crop'
              }
            ].map((item, index) => (
              <motion.div
                key={item.step}
                initial={{ opacity: 0, x: -30 }}
                whileInView={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.6, delay: index * 0.2 }}
                viewport={{ once: true }}
                className="glass-panel-strong p-8 text-center relative overflow-hidden"
              >
                {/* Background Image */}
                <div className="absolute inset-0 z-0">
                  <img 
                    src={item.image}
                    alt={item.title}
                    className="w-full h-full object-cover opacity-5"
                  />
                </div>
                
                <div className="relative z-10">
                  <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                    <div className="w-8 h-8 rounded-full bg-purple-600 border-2 border-purple-400 flex items-center justify-center">
                      <span className="text-xs font-bold text-white">{item.step}</span>
                    </div>
                  </div>
                  
                  <div className="mt-6 mb-6">
                    <div className="inline-flex p-4 rounded-xl bg-purple-500/20 border border-purple-400/30">
                      <item.icon className="w-8 h-8 text-purple-400" />
                    </div>
                  </div>
                  
                  <h3 className="text-xl font-bold text-white mb-4">{item.title}</h3>
                  <p className="text-gray-300 text-sm leading-relaxed">{item.description}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Technology Stack Section */}
      <section className="py-20 px-4 bg-dark-800/50">
        <div className="container mx-auto max-w-6xl">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl md:text-5xl font-bold mb-6 text-white">Built on Web3</h2>
            <p className="text-xl text-gray-300 max-w-2xl mx-auto">
              Powered by cutting-edge blockchain technology
            </p>
          </motion.div>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {[
              {
                name: 'Solana',
                description: 'Fast & Low-cost',
                image: 'https://cryptologos.cc/logos/solana-sol-logo.png',
                icon: Code
              },
              {
                name: 'IPFS',
                description: 'Decentralized Storage',
                image: 'https://ipfs.tech/ipfs-logo.svg',
                icon: Database
              },
              {
                name: 'Ethereum',
                description: 'Smart Contracts',
                image: 'https://cryptologos.cc/logos/ethereum-eth-logo.png',
                icon: Shield
              },
              {
                name: 'Web3.js',
                description: 'Wallet Integration',
                image: 'https://web3js.org/img/web3js.svg',
                icon: Wallet
              }
            ].map((tech, index) => (
              <motion.div
                key={tech.name}
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                viewport={{ once: true }}
                className="glass-panel p-6 text-center hover:border-purple-400/50 transition-all duration-300"
              >
                <div className="w-16 h-16 mx-auto mb-4 bg-white rounded-full flex items-center justify-center p-3">
                  <tech.icon className="w-8 h-8 text-purple-600" />
                </div>
                <h3 className="text-lg font-semibold text-white mb-2">{tech.name}</h3>
                <p className="text-sm text-gray-400">{tech.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>
      
      {/* CTA Section */}
      <section className="py-20 px-4">
        <div className="container mx-auto max-w-4xl text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            className="glass-panel-strong p-12"
          >
            <h2 className="text-3xl md:text-4xl font-bold mb-6 text-white">
              Ready to Build Your Decentralized Portfolio?
            </h2>
            <p className="text-xl text-gray-300 mb-8 max-w-2xl mx-auto">
              Join thousands of freelancers already using SaveYourProofs to showcase their work and build trust with clients.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/submit" className="neon-button-primary inline-flex items-center gap-2">
                <Upload className="w-5 h-5" />
                Submit Your First Proof
                <ArrowRight className="w-4 h-4" />
              </Link>
              <Link href="/explore" className="neon-button inline-flex items-center gap-2">
                <Search className="w-5 h-5" />
                Browse Freelancers
              </Link>
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  );
} 