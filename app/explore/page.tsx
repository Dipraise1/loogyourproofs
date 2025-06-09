'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Search,
  Filter,
  User,
  MapPin,
  Calendar,
  Star,
  ExternalLink,
  Github,
  Globe,
  Twitter,
  CheckCircle,
  Clock,
  Eye,
  TrendingUp,
  Award,
  Shield
} from 'lucide-react';
import Link from 'next/link';
import { Header } from '../components/Header';
import { useAppStore } from '../../lib/store';
import { proofService } from '../../lib/proof-service';

export default function ExplorePage() {
  const { freelancers, proofs, isLoading, loadFreelancers, loadAllProofs } = useAppStore();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSpecialty, setSelectedSpecialty] = useState('all');
  const [sortBy, setSortBy] = useState('rating');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    // Load data from storage when component mounts
    proofService.loadProofsFromStorage();
    loadAllProofs();
    loadFreelancers();
  }, [loadAllProofs, loadFreelancers]);

  if (!mounted) {
    return (
      <div className="min-h-screen bg-dark-900 flex items-center justify-center">
        <div className="spinner"></div>
      </div>
    );
  }

  // Extract specialties from all proofs/freelancers
  const allSpecialties = Array.from(
    new Set([
      ...freelancers.flatMap(f => f.specialties),
      ...proofs.flatMap(p => p.tags)
    ])
  ).sort();

  const filteredFreelancers = freelancers
    .filter(freelancer => {
      const matchesSearch = 
        freelancer.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        freelancer.bio?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        freelancer.specialties.some(skill => 
          skill.toLowerCase().includes(searchTerm.toLowerCase())
        ) ||
        freelancer.walletAddress.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesSpecialty = selectedSpecialty === 'all' || 
        freelancer.specialties.includes(selectedSpecialty);
      
      return matchesSearch && matchesSpecialty;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'rating':
          return b.rating - a.rating;
        case 'proofs':
          return b.totalProofs - a.totalProofs;
        case 'endorsements':
          return b.totalEndorsements - a.totalEndorsements;
        case 'recent':
          return b.joinedAt - a.joinedAt;
        default:
          return 0;
      }
    });

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="w-3 h-3 text-green-400" />;
      case 'pending':
      case 'uploading':
        return <Clock className="w-3 h-3 text-yellow-400" />;
      case 'failed':
        return <ExternalLink className="w-3 h-3 text-red-400" />;
      default:
        return <Clock className="w-3 h-3 text-gray-400" />;
    }
  };

  const formatWalletAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short'
    });
  };

  const getFreelancerProofs = (walletAddress: string) => {
    return proofs.filter(proof => proof.walletAddress === walletAddress);
  };

  const totalStats = {
    totalFreelancers: freelancers.length,
    totalProofs: proofs.length,
    completedProofs: proofs.filter(p => p.status === 'completed').length,
    totalEndorsements: proofs.reduce((sum, p) => sum + p.endorsements.length, 0)
  };

  return (
    <div className="min-h-screen">
      <Header />
      
      <main className="pt-20 pb-12 px-4">
        <div className="container mx-auto max-w-7xl">
          {/* Header with Background */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="relative text-center mb-8 overflow-hidden rounded-lg"
          >
            {/* Background Image */}
            <div className="absolute inset-0 z-0">
              <img 
                src="https://images.unsplash.com/photo-1522071820081-009f0129c71c?q=80&w=2940&auto=format&fit=crop"
                alt="Team collaboration"
                className="w-full h-full object-cover opacity-10"
              />
              <div className="absolute inset-0 bg-gradient-to-br from-dark-900/90 via-dark-800/95 to-purple-900/80"></div>
            </div>
            
            <div className="relative z-10 py-16 px-6">
              <h1 className="text-3xl md:text-4xl font-bold mb-3 text-purple-300">
                Discover Freelancers
              </h1>
              <p className="text-gray-300 text-lg max-w-2xl mx-auto">
                Explore verified freelancers and their decentralized proof-of-work portfolios
              </p>
            </div>
          </motion.div>

          {/* Platform Stats */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8"
          >
            <div className="glass-panel p-4 text-center">
              <div className="text-2xl font-bold text-purple-300">{totalStats.totalFreelancers}</div>
              <div className="text-sm text-gray-400">Freelancers</div>
            </div>
            <div className="glass-panel p-4 text-center">
              <div className="text-2xl font-bold text-green-300">{totalStats.totalProofs}</div>
              <div className="text-sm text-gray-400">Total Proofs</div>
            </div>
            <div className="glass-panel p-4 text-center">
              <div className="text-2xl font-bold text-blue-300">{totalStats.completedProofs}</div>
              <div className="text-sm text-gray-400">Verified</div>
            </div>
            <div className="glass-panel p-4 text-center">
              <div className="text-2xl font-bold text-yellow-300">{totalStats.totalEndorsements}</div>
              <div className="text-sm text-gray-400">Endorsements</div>
            </div>
          </motion.div>

          {/* Search and Filters */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="glass-panel p-6 mb-8"
          >
            <div className="flex flex-col lg:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search by name, skills, wallet address..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="cyber-input pl-10 w-full"
                  />
                </div>
              </div>
              
              <div className="flex gap-3">
                <select
                  value={selectedSpecialty}
                  onChange={(e) => setSelectedSpecialty(e.target.value)}
                  className="cyber-input px-4 py-2"
                >
                  <option value="all">All Skills</option>
                  {allSpecialties.map((specialty) => (
                    <option key={specialty} value={specialty}>
                      {specialty}
                    </option>
                  ))}
                </select>
                
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="cyber-input px-4 py-2"
                >
                  <option value="rating">Rating</option>
                  <option value="proofs">Total Proofs</option>
                  <option value="endorsements">Endorsements</option>
                  <option value="recent">Recently Joined</option>
                </select>
              </div>
            </div>
          </motion.div>

          {/* Freelancers Grid */}
          {isLoading ? (
            <div className="text-center py-12">
              <div className="spinner mx-auto mb-4"></div>
              <p className="text-gray-400">Loading freelancers...</p>
            </div>
          ) : filteredFreelancers.length === 0 ? (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center py-16"
            >
              <div className="glass-panel p-8 max-w-md mx-auto">
                <User className="w-16 h-16 text-purple-400 mx-auto mb-4" />
                <h2 className="text-xl font-semibold text-white mb-4">No Freelancers Found</h2>
                <p className="text-gray-400 mb-6">
                  {freelancers.length === 0 
                    ? "No freelancers have joined the platform yet. Be the first by submitting your proof!"
                    : "No freelancers match your search criteria. Try adjusting your filters."
                  }
                </p>
                <Link href="/submit" className="neon-button-primary inline-flex items-center gap-2">
                  <Award className="w-4 h-4" />
                  Submit Your First Proof
                </Link>
              </div>
            </motion.div>
          ) : (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
            >
              {filteredFreelancers.map((freelancer, index) => {
                const freelancerProofs = getFreelancerProofs(freelancer.walletAddress);
                const completedProofs = freelancerProofs.filter(p => p.status === 'completed');
                const recentProofs = freelancerProofs.slice(0, 3);
                
                return (
                  <motion.div
                    key={freelancer.walletAddress}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="proof-card hover:scale-[1.02] transition-transform duration-300"
                  >
                    {/* Header */}
                    <div className="flex items-start gap-4 mb-4">
                      <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-blue-500 rounded-lg flex items-center justify-center text-white font-bold text-xl">
                        {freelancer.name ? freelancer.name.charAt(0).toUpperCase() : freelancer.walletAddress.charAt(2).toUpperCase()}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="text-lg font-semibold text-white truncate">
                          {freelancer.name || 'Anonymous'}
                        </h3>
                        <p className="text-sm text-purple-400 font-mono">
                          {formatWalletAddress(freelancer.walletAddress)}
                        </p>
                        <div className="flex items-center gap-1 mt-1">
                          <Star className="w-4 h-4 text-yellow-400 fill-current" />
                          <span className="text-sm text-gray-300">
                            {freelancer.rating > 0 ? freelancer.rating.toFixed(1) : 'New'}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Bio */}
                    {freelancer.bio && (
                      <p className="text-gray-300 text-sm mb-4 line-clamp-2">
                        {freelancer.bio}
                      </p>
                    )}

                    {/* Stats */}
                    <div className="grid grid-cols-3 gap-4 mb-4">
                      <div className="text-center">
                        <div className="text-lg font-bold text-purple-300">{freelancer.totalProofs}</div>
                        <div className="text-xs text-gray-400">Proofs</div>
                      </div>
                      <div className="text-center">
                        <div className="text-lg font-bold text-green-300">{completedProofs.length}</div>
                        <div className="text-xs text-gray-400">Completed</div>
                      </div>
                      <div className="text-center">
                        <div className="text-lg font-bold text-yellow-300">{freelancer.totalEndorsements}</div>
                        <div className="text-xs text-gray-400">Endorsed</div>
                      </div>
                    </div>

                    {/* Skills */}
                    {freelancer.specialties.length > 0 && (
                      <div className="mb-4">
                        <div className="flex flex-wrap gap-1">
                          {freelancer.specialties.slice(0, 3).map((skill) => (
                            <span
                              key={skill}
                              className="px-2 py-1 bg-purple-500/20 border border-purple-400/30 rounded text-xs text-purple-200"
                            >
                              {skill}
                            </span>
                          ))}
                          {freelancer.specialties.length > 3 && (
                            <span className="px-2 py-1 bg-gray-500/20 border border-gray-400/30 rounded text-xs text-gray-300">
                              +{freelancer.specialties.length - 3}
                            </span>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Recent Work */}
                    {recentProofs.length > 0 && (
                      <div className="mb-4">
                        <h4 className="text-xs font-medium text-gray-400 mb-2">Recent Work</h4>
                        <div className="space-y-1">
                          {recentProofs.map((proof) => (
                            <div
                              key={proof.id}
                              className="flex items-center gap-2 text-xs"
                            >
                              {getStatusIcon(proof.status)}
                              <span className="text-gray-300 truncate flex-1">
                                {proof.title}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Social Links */}
                    {freelancer.social && (
                      <div className="flex gap-2 mb-4">
                        {freelancer.social.github && (
                          <a
                            href={freelancer.social.github}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-2 bg-gray-800 hover:bg-gray-700 rounded transition-colors"
                          >
                            <Github className="w-4 h-4 text-gray-400" />
                          </a>
                        )}
                        {freelancer.social.twitter && (
                          <a
                            href={freelancer.social.twitter}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-2 bg-gray-800 hover:bg-gray-700 rounded transition-colors"
                          >
                            <Twitter className="w-4 h-4 text-gray-400" />
                          </a>
                        )}
                        {freelancer.social.website && (
                          <a
                            href={freelancer.social.website}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-2 bg-gray-800 hover:bg-gray-700 rounded transition-colors"
                          >
                            <Globe className="w-4 h-4 text-gray-400" />
                          </a>
                        )}
                      </div>
                    )}

                    {/* Footer */}
                    <div className="flex items-center justify-between pt-4 border-t border-purple-500/20">
                      <div className="flex items-center gap-1 text-xs text-gray-400">
                        <Calendar className="w-3 h-3" />
                        <span>Joined {formatDate(freelancer.joinedAt)}</span>
                      </div>
                      <button className="neon-button text-xs px-3 py-1">
                        <Eye className="w-3 h-3 mr-1" />
                        View Profile
                      </button>
                    </div>
                  </motion.div>
                );
              })}
            </motion.div>
          )}
        </div>
      </main>
    </div>
  );
} 