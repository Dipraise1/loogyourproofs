'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Plus, 
  FileText, 
  Image as ImageIcon, 
  Github, 
  Link as LinkIcon,
  Calendar,
  CheckCircle,
  Clock,
  Star,
  Filter,
  Search,
  Upload,
  Shield,
  Eye,
  ExternalLink
} from 'lucide-react';
import Link from 'next/link';
import { Header } from '../components/Header';
import { WalletConnect } from '../components/WalletConnect';
import { PublicDataStats } from '../components/PublicDataStats';
import { useAppStore } from '../../lib/store';
import { proofService } from '../../lib/proof-service';

export default function DashboardPage() {
  const { userProofs, connectedWallet, isLoading, loadUserProofs } = useAppStore();
  const [filter, setFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    // Load proofs from storage when component mounts
    proofService.loadProofsFromStorage();
  }, []);

  useEffect(() => {
    // Load user-specific proofs when wallet connects
    if (connectedWallet) {
      loadUserProofs(connectedWallet);
    }
  }, [connectedWallet, loadUserProofs]);

  if (!mounted) {
    return (
      <div className="min-h-screen bg-dark-900 flex items-center justify-center">
        <div className="spinner"></div>
      </div>
    );
  }

  const filteredProofs = userProofs.filter(proof => {
    const matchesFilter = filter === 'all' || proof.status === filter;
    const matchesSearch = proof.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         proof.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         proof.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()));
    return matchesFilter && matchesSearch;
  });

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="w-4 h-4 text-green-400" />;
      case 'pending':
      case 'uploading':
        return <Clock className="w-4 h-4 text-yellow-400" />;
      case 'failed':
        return <ExternalLink className="w-4 h-4 text-red-400" />;
      default:
        return <Clock className="w-4 h-4 text-gray-400" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return <span className="status-verified">Completed</span>;
      case 'pending':
        return <span className="status-pending">Pending</span>;
      case 'uploading':
        return <span className="status-pending">Uploading</span>;
      case 'failed':
        return <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs bg-red-500/20 border border-red-400/40 text-red-300">Failed</span>;
      default:
        return <span className="status-pending">Unknown</span>;
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'project':
        return <FileText className="w-4 h-4" />;
      case 'design':
        return <ImageIcon className="w-4 h-4" />;
      case 'audit':
        return <Shield className="w-4 h-4" />;
      default:
        return <FileText className="w-4 h-4" />;
    }
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const verifiedProofs = userProofs.filter(p => p.status === 'completed').length;
  const endorsedProofs = userProofs.filter(p => p.endorsements.length > 0).length;
  const totalEndorsements = userProofs.reduce((sum, p) => sum + p.endorsements.length, 0);

  return (
    <div className="min-h-screen">
      <Header />
      
      <main className="pt-20 pb-12 px-4">
        <div className="container mx-auto max-w-7xl">
          {/* Header Section with Background */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="relative mb-8 overflow-hidden rounded-lg"
          >
            {/* Background Image */}
            <div className="absolute inset-0 z-0">
              <img 
                src="https://images.unsplash.com/photo-1551434678-e076c223a692?q=80&w=2940&auto=format&fit=crop"
                alt="Portfolio workspace"
                className="w-full h-full object-cover opacity-8"
              />
              <div className="absolute inset-0 bg-gradient-to-br from-dark-900/90 via-dark-800/95 to-purple-900/85"></div>
            </div>
            
            <div className="relative z-10 p-8">
              <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
                <div>
                  <h1 className="text-3xl md:text-4xl font-bold mb-2 text-purple-300">
                    Your Portfolio
                  </h1>
                  <p className="text-gray-300 text-lg">
                    Manage your decentralized proof-of-work submissions
                  </p>
                  {connectedWallet && (
                    <p className="text-sm text-purple-400 font-mono mt-2">
                      {connectedWallet.slice(0, 8)}...{connectedWallet.slice(-6)}
                    </p>
                  )}
                </div>
                
                <div className="flex flex-col sm:flex-row gap-3">
                  {!connectedWallet && <WalletConnect />}
                  <Link href="/submit" className="neon-button-primary inline-flex items-center gap-2">
                    <Plus className="w-4 h-4" />
                    Submit New Proof
                  </Link>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Wallet Connection Required */}
          {!connectedWallet ? (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center py-16"
            >
              <div className="glass-panel p-8 max-w-md mx-auto">
                <Shield className="w-16 h-16 text-purple-400 mx-auto mb-4" />
                <h2 className="text-xl font-semibold text-white mb-4">Connect Your Wallet</h2>
                <p className="text-gray-400 mb-6">
                  Connect your Web3 wallet to view and manage your proof submissions.
                </p>
                <WalletConnect />
              </div>
            </motion.div>
          ) : (
            <>
              {/* Stats Cards */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8"
              >
                <div className="glass-panel p-6">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-purple-500/20">
                      <FileText className="w-5 h-5 text-purple-400" />
                    </div>
                    <div>
                      <div className="text-2xl font-bold text-white">{userProofs.length}</div>
                      <div className="text-sm text-gray-400">Total Proofs</div>
                    </div>
                  </div>
                </div>
                
                <div className="glass-panel p-6">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-green-500/20">
                      <CheckCircle className="w-5 h-5 text-green-400" />
                    </div>
                    <div>
                      <div className="text-2xl font-bold text-white">{verifiedProofs}</div>
                      <div className="text-sm text-gray-400">Verified</div>
                    </div>
                  </div>
                </div>
                
                <div className="glass-panel p-6">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-purple-500/20">
                      <Star className="w-5 h-5 text-purple-400" />
                    </div>
                    <div>
                      <div className="text-2xl font-bold text-white">{endorsedProofs}</div>
                      <div className="text-sm text-gray-400">Endorsed</div>
                    </div>
                  </div>
                </div>
                
                <div className="glass-panel p-6">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-yellow-500/20">
                      <Star className="w-5 h-5 text-yellow-400" />
                    </div>
                    <div>
                      <div className="text-2xl font-bold text-white">{totalEndorsements}</div>
                      <div className="text-sm text-gray-400">Total Endorsements</div>
                    </div>
                  </div>
                </div>
              </motion.div>

              {/* Public Data Stats */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.15 }}
                className="grid grid-cols-1 lg:grid-cols-4 gap-6 mb-8"
              >
                <div className="lg:col-span-3">
                  <div className="glass-panel p-6">
                    <h3 className="text-lg font-semibold text-purple-300 mb-4">Public Data Access</h3>
                    <p className="text-gray-400 text-sm mb-4">
                      All user data is stored on IPFS and publicly accessible. Anyone can verify your work history and contributions to the freelancer ecosystem.
                    </p>
                    <div className="flex flex-wrap gap-2 text-xs">
                      <span className="px-2 py-1 bg-purple-500/20 border border-purple-400/30 rounded text-purple-200">
                        Decentralized Storage
                      </span>
                      <span className="px-2 py-1 bg-blue-500/20 border border-blue-400/30 rounded text-blue-200">
                        Immutable Records
                      </span>
                      <span className="px-2 py-1 bg-green-500/20 border border-green-400/30 rounded text-green-200">
                        Publicly Verifiable
                      </span>
                    </div>
                  </div>
                </div>
                <div>
                  <PublicDataStats />
                </div>
              </motion.div>

              {/* Controls */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="glass-panel p-6 mb-8"
              >
                <div className="flex flex-col sm:flex-row gap-4">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Search proofs by title, description, or tags..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="cyber-input pl-10 w-full"
                    />
                  </div>
                  
                  <div className="flex gap-2">
                    <select
                      value={filter}
                      onChange={(e) => setFilter(e.target.value)}
                      className="cyber-input px-4 py-2"
                    >
                      <option value="all">All Status</option>
                      <option value="completed">Completed</option>
                      <option value="uploading">Uploading</option>
                      <option value="pending">Pending</option>
                      <option value="failed">Failed</option>
                    </select>
                  </div>
                </div>
              </motion.div>

              {/* Proofs Grid */}
              {isLoading ? (
                <div className="text-center py-12">
                  <div className="spinner mx-auto mb-4"></div>
                  <p className="text-gray-400">Loading your proofs...</p>
                </div>
              ) : filteredProofs.length === 0 ? (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-center py-16"
                >
                  <div className="glass-panel p-8 max-w-md mx-auto">
                    <Upload className="w-16 h-16 text-purple-400 mx-auto mb-4" />
                    <h2 className="text-xl font-semibold text-white mb-4">No Proofs Found</h2>
                    <p className="text-gray-400 mb-6">
                      {userProofs.length === 0 
                        ? "You haven't submitted any proofs yet. Get started by submitting your first proof!"
                        : "No proofs match your current filter. Try adjusting your search or filter criteria."
                      }
                    </p>
                    <Link href="/submit" className="neon-button-primary inline-flex items-center gap-2">
                      <Plus className="w-4 h-4" />
                      Submit Your First Proof
                    </Link>
                  </div>
                </motion.div>
              ) : (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.3 }}
                  className="grid gap-6"
                >
                  {filteredProofs.map((proof, index) => (
                    <motion.div
                      key={proof.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.1 }}
                      className="proof-card"
                    >
                      <div className="flex flex-col lg:flex-row lg:items-start gap-6">
                        {/* Main Content */}
                        <div className="flex-1">
                          <div className="flex items-start justify-between mb-4">
                            <div className="flex items-center gap-3">
                              <div className="p-2 bg-purple-500/20 border border-purple-400/30 rounded-lg">
                                {getTypeIcon(proof.type)}
                              </div>
                              <div>
                                <h3 className="text-xl font-semibold text-white mb-1">
                                  {proof.title}
                                </h3>
                                <div className="flex items-center gap-2 text-sm text-gray-400">
                                  <Calendar className="w-3 h-3" />
                                  {formatDate(proof.timestamp)}
                                </div>
                              </div>
                            </div>
                            
                            <div className="flex items-center gap-2">
                              {getStatusIcon(proof.status)}
                              {getStatusBadge(proof.status)}
                            </div>
                          </div>
                          
                          <p className="text-gray-300 mb-4 leading-relaxed">
                            {proof.description}
                          </p>
                          
                          {/* Tags */}
                          <div className="flex flex-wrap gap-2 mb-4">
                            {proof.tags.map((tag) => (
                              <span
                                key={tag}
                                className="px-2 py-1 bg-purple-500/20 border border-purple-400/30 rounded text-xs text-purple-200"
                              >
                                {tag}
                              </span>
                            ))}
                          </div>
                          
                          {/* Attachments */}
                          {proof.attachments.length > 0 && (
                            <div className="space-y-2">
                              <h4 className="text-sm font-medium text-gray-300">Attachments:</h4>
                              <div className="flex flex-wrap gap-2">
                                {proof.attachments.map((attachment, idx) => (
                                  <div
                                    key={idx}
                                    className="flex items-center gap-2 px-3 py-1 bg-dark-700/50 border border-purple-500/20 rounded text-xs"
                                  >
                                    {attachment.type === 'link' ? (
                                      <ExternalLink className="w-3 h-3 text-purple-400" />
                                    ) : attachment.type === 'image' ? (
                                      <ImageIcon className="w-3 h-3 text-blue-400" />
                                    ) : (
                                      <FileText className="w-3 h-3 text-orange-400" />
                                    )}
                                    <span className="text-gray-300">{attachment.name}</span>
                                    {attachment.url && (
                                      <a
                                        href={attachment.url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-purple-400 hover:text-purple-300 transition-colors"
                                      >
                                        View
                                      </a>
                                    )}
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                          
                          {/* Additional Links */}
                          {(proof.githubRepo || proof.liveDemo) && (
                            <div className="flex gap-4 mt-4">
                              {proof.githubRepo && (
                                <a
                                  href={proof.githubRepo}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="flex items-center gap-2 text-sm text-purple-400 hover:text-purple-300 transition-colors"
                                >
                                  <Github className="w-4 h-4" />
                                  Repository
                                </a>
                              )}
                              {proof.liveDemo && (
                                <a
                                  href={proof.liveDemo}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="flex items-center gap-2 text-sm text-purple-400 hover:text-purple-300 transition-colors"
                                >
                                  <ExternalLink className="w-4 h-4" />
                                  Live Demo
                                </a>
                              )}
                            </div>
                          )}
                        </div>
                        
                        {/* Sidebar */}
                        <div className="lg:w-64 space-y-4">
                          {/* IPFS Hash */}
                          {proof.ipfsHash && (
                            <div className="glass-panel p-4">
                              <h4 className="text-sm font-medium text-gray-300 mb-2">IPFS Hash</h4>
                              <div className="font-mono text-xs text-purple-300 break-all">
                                {proof.ipfsHash}
                              </div>
                            </div>
                          )}
                          
                          {/* Endorsements */}
                          {proof.endorsements.length > 0 && (
                            <div className="glass-panel p-4">
                              <h4 className="text-sm font-medium text-gray-300 mb-3">
                                Endorsements ({proof.endorsements.length})
                              </h4>
                              <div className="space-y-3">
                                {proof.endorsements.slice(0, 2).map((endorsement, idx) => (
                                  <div key={idx} className="text-xs">
                                    <div className="text-purple-300 font-mono mb-1">
                                      {endorsement.endorserAddress.slice(0, 8)}...{endorsement.endorserAddress.slice(-6)}
                                    </div>
                                    <div className="text-gray-400">
                                      {endorsement.message}
                                    </div>
                                  </div>
                                ))}
                                {proof.endorsements.length > 2 && (
                                  <div className="text-xs text-gray-500">
                                    +{proof.endorsements.length - 2} more
                                  </div>
                                )}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </motion.div>
              )}
            </>
          )}
        </div>
      </main>
    </div>
  );
} 