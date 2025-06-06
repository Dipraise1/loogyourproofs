'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Globe, Database, Hash, Clock, ExternalLink } from 'lucide-react';
import { publicDataService } from '../../lib/public-data-service';

interface RegistryStats {
  totalFreelancers: number;
  totalProofs: number;
  lastUpdated: string;
}

export function PublicDataStats() {
  const [stats, setStats] = useState<RegistryStats | null>(null);
  const [registryHash, setRegistryHash] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadStats = async () => {
      try {
        const registryStats = await publicDataService.getRegistryStats();
        const hash = publicDataService.getRegistryHash();
        
        setStats(registryStats);
        setRegistryHash(hash);
      } catch (error) {
        console.error('Failed to load public data stats:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadStats();
  }, []);

  if (isLoading) {
    return (
      <div className="glass-panel p-4">
        <div className="animate-pulse">
          <div className="h-4 bg-purple-400/20 rounded mb-2"></div>
          <div className="h-3 bg-purple-400/10 rounded"></div>
        </div>
      </div>
    );
  }

  if (!stats) {
    return null;
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  const getIpfsUrl = (hash: string) => {
    return `https://ipfs.io/ipfs/${hash}`;
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="glass-panel p-4 space-y-3"
    >
      <div className="flex items-center gap-2 mb-3">
        <Globe className="w-4 h-4 text-purple-400" />
        <h3 className="text-sm font-semibold text-purple-300">Public Data Registry</h3>
      </div>

      <div className="grid grid-cols-2 gap-3 text-xs">
        <div className="text-center p-2 bg-purple-500/10 rounded-lg">
          <div className="text-purple-300 font-semibold">{stats.totalFreelancers}</div>
          <div className="text-gray-400">Freelancers</div>
        </div>
        <div className="text-center p-2 bg-blue-500/10 rounded-lg">
          <div className="text-blue-300 font-semibold">{stats.totalProofs}</div>
          <div className="text-gray-400">Proofs</div>
        </div>
      </div>

      <div className="space-y-2 text-xs">
        <div className="flex items-center gap-2 text-gray-400">
          <Clock className="w-3 h-3" />
          <span>Updated: {formatDate(stats.lastUpdated)}</span>
        </div>

        {registryHash && (
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-gray-400">
              <Hash className="w-3 h-3" />
              <span>Registry Hash:</span>
            </div>
            <div className="flex items-center gap-1">
              <code className="text-xs bg-dark-800 px-2 py-1 rounded text-purple-300 font-mono">
                {registryHash.startsWith('registry_') 
                  ? 'Local Storage' 
                  : `${registryHash.substring(0, 12)}...${registryHash.substring(registryHash.length - 8)}`
                }
              </code>
              {!registryHash.startsWith('registry_') && (
                <a
                  href={getIpfsUrl(registryHash)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-purple-400 hover:text-purple-300 transition-colors"
                  title="View on IPFS"
                >
                  <ExternalLink className="w-3 h-3" />
                </a>
              )}
            </div>
          </div>
        )}
      </div>

      <div className="pt-2 border-t border-purple-500/20">
        <div className="text-xs text-gray-500 text-center">
          {registryHash?.startsWith('registry_') ? (
            <span className="flex items-center justify-center gap-1">
              <Database className="w-3 h-3" />
              Stored locally (IPFS unavailable)
            </span>
          ) : (
            <span className="flex items-center justify-center gap-1">
              <Globe className="w-3 h-3" />
              Publicly accessible on IPFS
            </span>
          )}
        </div>
      </div>
    </motion.div>
  );
} 