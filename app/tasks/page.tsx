'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Clock, 
  DollarSign, 
  MapPin, 
  User, 
  Filter,
  Search,
  Plus,
  CheckCircle,
  Star,
  Calendar,
  Tag,
  ArrowRight,
  Zap,
  Briefcase,
  TrendingUp
} from 'lucide-react';
import Link from 'next/link';
import { Header } from '../components/Header';
import { WalletConnect } from '../components/WalletConnect';
import { useAppStore } from '../../lib/store';
import { useAppInit } from '../../lib/hooks/useAppInit';

interface Task {
  id: string;
  title: string;
  description: string;
  budget: string;
  duration: string;
  location: string;
  client: string;
  rating: number;
  tags: string[];
  posted: string;
  applicants: number;
  featured: boolean;
  urgent: boolean;
}

export default function TasksPage() {
  const [mounted, setMounted] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [sortBy, setSortBy] = useState('newest');
  const { freelancers } = useAppStore();
  const { isLoading: appInitializing } = useAppInit();

  useEffect(() => {
    setMounted(true);
  }, []);

  // Sample social media engagement tasks data
  const tasks: Task[] = [
    {
      id: '1',
      title: 'Follow @SolGigsOfficial on Twitter',
      description: 'Follow our official Twitter account and engage with our latest posts. Must have active Twitter account with 100+ followers.',
      budget: '$5 - $15',
      duration: '5 minutes',
      location: 'Remote',
      client: 'SolGigs Team',
      rating: 4.9,
      tags: ['Twitter', 'Follow', 'Social Media', 'Engagement'],
      posted: '2 hours ago',
      applicants: 45,
      featured: true,
      urgent: false
    },
    {
      id: '2',
      title: 'Join SolGigs Discord Community',
      description: 'Join our Discord server, introduce yourself, and participate in community discussions. Must be active for at least 1 week.',
      budget: '$10 - $25',
      duration: '1 week',
      location: 'Remote',
      client: 'SolGigs Community',
      rating: 4.7,
      tags: ['Discord', 'Community', 'Social Media', 'Engagement'],
      posted: '4 hours ago',
      applicants: 32,
      featured: false,
      urgent: true
    },
    {
      id: '3',
      title: 'Retweet and Comment on Solana News',
      description: 'Retweet our latest Solana ecosystem updates and leave thoughtful comments. Must have 500+ Twitter followers.',
      budget: '$8 - $20',
      duration: '30 minutes',
      location: 'Remote',
      client: 'Solana Marketing',
      rating: 4.8,
      tags: ['Twitter', 'Retweet', 'Comment', 'Solana'],
      posted: '6 hours ago',
      applicants: 28,
      featured: false,
      urgent: false
    },
    {
      id: '4',
      title: 'Create TikTok Video About Web3',
      description: 'Create a 30-60 second TikTok video explaining Web3 concepts in simple terms. Must have 1000+ TikTok followers.',
      budget: '$25 - $50',
      duration: '2-3 hours',
      location: 'Remote',
      client: 'Web3 Education',
      rating: 4.6,
      tags: ['TikTok', 'Video', 'Web3', 'Education'],
      posted: '1 day ago',
      applicants: 18,
      featured: true,
      urgent: false
    },
    {
      id: '5',
      title: 'Join Telegram Group and Share Updates',
      description: 'Join our Telegram group, share daily crypto market updates, and engage with other members for 1 week.',
      budget: '$15 - $30',
      duration: '1 week',
      location: 'Remote',
      client: 'Crypto Community',
      rating: 4.9,
      tags: ['Telegram', 'Community', 'Crypto', 'Updates'],
      posted: '1 day ago',
      applicants: 22,
      featured: false,
      urgent: false
    },
    {
      id: '6',
      title: 'Instagram Story About SolGigs',
      description: 'Create Instagram stories featuring SolGigs platform and tag us. Must have 500+ Instagram followers.',
      budget: '$12 - $25',
      duration: '1 hour',
      location: 'Remote',
      client: 'SolGigs Marketing',
      rating: 4.5,
      tags: ['Instagram', 'Story', 'Social Media', 'Marketing'],
      posted: '2 days ago',
      applicants: 35,
      featured: true,
      urgent: false
    },
    {
      id: '7',
      title: 'YouTube Comment on Crypto Videos',
      description: 'Find and comment on popular crypto YouTube videos with insightful comments about SolGigs. Must have YouTube account.',
      budget: '$8 - $18',
      duration: '1 hour',
      location: 'Remote',
      client: 'Crypto Outreach',
      rating: 4.4,
      tags: ['YouTube', 'Comment', 'Crypto', 'Outreach'],
      posted: '3 days ago',
      applicants: 15,
      featured: false,
      urgent: false
    },
    {
      id: '8',
      title: 'Reddit Post in Crypto Subreddits',
      description: 'Create engaging posts in r/cryptocurrency and r/solana about SolGigs platform. Must have Reddit account with 100+ karma.',
      budget: '$20 - $40',
      duration: '2 hours',
      location: 'Remote',
      client: 'Reddit Marketing',
      rating: 4.7,
      tags: ['Reddit', 'Post', 'Crypto', 'Solana'],
      posted: '3 days ago',
      applicants: 12,
      featured: true,
      urgent: false
    }
  ];

  const categories = [
    { id: 'all', name: 'All Tasks', count: tasks.length },
    { id: 'twitter', name: 'Twitter', count: 3 },
    { id: 'discord', name: 'Discord', count: 1 },
    { id: 'tiktok', name: 'TikTok', count: 1 },
    { id: 'instagram', name: 'Instagram', count: 1 },
    { id: 'youtube', name: 'YouTube', count: 1 },
    { id: 'reddit', name: 'Reddit', count: 1 }
  ];

  const filteredTasks = tasks.filter(task => {
    const matchesSearch = task.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         task.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         task.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesCategory = selectedCategory === 'all' || 
                           task.tags.some(tag => tag.toLowerCase().includes(selectedCategory.toLowerCase()));
    
    return matchesSearch && matchesCategory;
  });

  const sortedTasks = [...filteredTasks].sort((a, b) => {
    switch (sortBy) {
      case 'newest':
        return new Date(b.posted).getTime() - new Date(a.posted).getTime();
      case 'budget':
        return parseInt(b.budget.replace(/[$,]/g, '')) - parseInt(a.budget.replace(/[$,]/g, ''));
      case 'applicants':
        return b.applicants - a.applicants;
      default:
        return 0;
    }
  });

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

  return (
    <div className="min-h-screen">
      <Header />
      
      {/* Hero Section */}
      <section className="pt-32 pb-16 px-4">
        <div className="container mx-auto max-w-7xl">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-center mb-12"
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-purple-500/30 bg-purple-500/10 mb-8">
              <Zap className="w-4 h-4 text-purple-400" />
              <span className="text-sm text-purple-300">Social Media Tasks • Quick Pay • Easy Money</span>
            </div>
            
            <h1 className="text-4xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-white via-purple-200 to-purple-400 bg-clip-text text-transparent leading-tight">
              Social Media Tasks
            </h1>
            
            <p className="text-xl text-gray-300 mb-8 max-w-3xl mx-auto">
              Earn money by following, commenting, and engaging on social media. 
              <br />
              <span className="text-purple-300 font-medium">Follow. Engage. Get Paid.</span>
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <WalletConnect />
              <Link href="/submit" className="neon-button inline-flex items-center gap-2">
                <Plus className="w-4 h-4" />
                Post a Task
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Search and Filters */}
      <section className="pb-8 px-4">
        <div className="container mx-auto max-w-7xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="glass-panel p-6 mb-8"
          >
            <div className="flex flex-col lg:flex-row gap-4">
              {/* Search */}
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search social media tasks, platforms, or keywords..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 bg-dark-800/50 border border-gray-600/30 rounded-lg text-white placeholder-gray-400 focus:border-purple-400/50 focus:outline-none focus:ring-2 focus:ring-purple-400/20"
                  />
                </div>
              </div>

              {/* Category Filter */}
              <div className="flex gap-2 flex-wrap">
                {categories.map((category) => (
                  <button
                    key={category.id}
                    onClick={() => setSelectedCategory(category.id)}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                      selectedCategory === category.id
                        ? 'bg-purple-500 text-white border border-purple-400'
                        : 'bg-dark-700/50 text-gray-300 border border-gray-600/30 hover:border-purple-400/50'
                    }`}
                  >
                    {category.name} ({category.count})
                  </button>
                ))}
              </div>

              {/* Sort */}
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="px-4 py-3 bg-dark-800/50 border border-gray-600/30 rounded-lg text-white focus:border-purple-400/50 focus:outline-none"
              >
                <option value="newest">Newest First</option>
                <option value="budget">Highest Budget</option>
                <option value="applicants">Most Popular</option>
              </select>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Tasks Grid */}
      <section className="pb-20 px-4">
        <div className="container mx-auto max-w-7xl">
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
            {sortedTasks.map((task, index) => (
              <motion.div
                key={task.id}
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                className={`hologram-card p-6 relative ${
                  task.featured ? 'border-purple-400/50' : ''
                } ${task.urgent ? 'border-red-400/50' : ''}`}
              >
                {task.featured && (
                  <div className="absolute -top-2 -right-2 bg-purple-500 text-white text-xs px-2 py-1 rounded-full">
                    Featured
                  </div>
                )}
                {task.urgent && (
                  <div className="absolute -top-2 -left-2 bg-red-500 text-white text-xs px-2 py-1 rounded-full">
                    Urgent
                  </div>
                )}

                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-white mb-2 line-clamp-2">
                      {task.title}
                    </h3>
                    <p className="text-gray-400 text-sm mb-4 line-clamp-3">
                      {task.description}
                    </p>
                  </div>
                </div>

                <div className="space-y-3 mb-4">
                  <div className="flex items-center gap-2 text-sm">
                    <DollarSign className="w-4 h-4 text-green-400" />
                    <span className="text-green-400 font-medium">{task.budget}</span>
                  </div>
                  
                  <div className="flex items-center gap-2 text-sm">
                    <Clock className="w-4 h-4 text-blue-400" />
                    <span className="text-gray-300">{task.duration}</span>
                  </div>
                  
                  <div className="flex items-center gap-2 text-sm">
                    <MapPin className="w-4 h-4 text-purple-400" />
                    <span className="text-gray-300">{task.location}</span>
                  </div>
                  
                  <div className="flex items-center gap-2 text-sm">
                    <User className="w-4 h-4 text-yellow-400" />
                    <span className="text-gray-300">{task.client}</span>
                    <div className="flex items-center gap-1">
                      <Star className="w-3 h-3 text-yellow-400 fill-current" />
                      <span className="text-yellow-400 text-xs">{task.rating}</span>
                    </div>
                  </div>
                </div>

                <div className="flex flex-wrap gap-2 mb-4">
                  {task.tags.slice(0, 3).map((tag) => (
                    <span
                      key={tag}
                      className="px-2 py-1 bg-purple-500/20 text-purple-300 text-xs rounded-md border border-purple-400/30"
                    >
                      {tag}
                    </span>
                  ))}
                  {task.tags.length > 3 && (
                    <span className="px-2 py-1 bg-gray-600/20 text-gray-400 text-xs rounded-md">
                      +{task.tags.length - 3} more
                    </span>
                  )}
                </div>

                <div className="flex items-center justify-between text-sm text-gray-400 mb-4">
                  <span>{task.applicants} applicants</span>
                  <span>{task.posted}</span>
                </div>

                <div className="flex gap-2">
                  <button className="flex-1 neon-button-primary text-center py-2 px-4 rounded-lg">
                    Apply Now
                  </button>
                  <button className="px-4 py-2 border border-gray-600/30 text-gray-300 rounded-lg hover:border-purple-400/50 transition-colors">
                    Save
                  </button>
                </div>
              </motion.div>
            ))}
          </div>

          {sortedTasks.length === 0 && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center py-12"
            >
              <Briefcase className="w-16 h-16 text-gray-600 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-400 mb-2">No tasks found</h3>
              <p className="text-gray-500">Try adjusting your search or filters</p>
            </motion.div>
          )}
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 px-4 bg-dark-800/30">
        <div className="container mx-auto max-w-6xl">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <h2 className="text-3xl md:text-4xl font-bold mb-6 text-white">Platform Statistics</h2>
            <p className="text-xl text-gray-300 max-w-2xl mx-auto">
              Join thousands of social media users earning money on SolGigs
            </p>
          </motion.div>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {[
              { label: 'Active Tasks', value: '1,247', icon: Briefcase },
              { label: 'Total Earnings', value: '$2.3M+', icon: DollarSign },
              { label: 'Social Media Users', value: '3,456', icon: User },
              { label: 'Success Rate', value: '94%', icon: TrendingUp }
            ].map((stat, index) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                viewport={{ once: true }}
                className="glass-panel p-6 text-center"
              >
                <stat.icon className="w-8 h-8 text-purple-400 mx-auto mb-2" />
                <div className="text-2xl font-bold text-white mb-1">{stat.value}</div>
                <div className="text-sm text-gray-400">{stat.label}</div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
