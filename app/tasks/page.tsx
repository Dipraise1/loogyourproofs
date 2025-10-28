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
  TrendingUp,
  ExternalLink,
  AlertCircle
} from 'lucide-react';
import Link from 'next/link';
import { Header } from '../components/Header';
import { WalletConnect } from '../components/WalletConnect';
import { useAppStore } from '../../lib/store';
import { useAppInit } from '../../lib/hooks/useAppInit';
import { taskService, Task } from '../../lib/task-service';
import toast from 'react-hot-toast';

export default function TasksPage() {
  const [mounted, setMounted] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [sortBy, setSortBy] = useState('newest');
  const [tasks, setTasks] = useState<Task[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [stats, setStats] = useState({
    totalTasks: 0,
    activeTasks: 0,
    completedTasks: 0,
    totalEarnings: 0,
    totalUsers: 0
  });
  const { freelancers, connectedWallet } = useAppStore();
  const { isLoading: appInitializing } = useAppInit();

  useEffect(() => {
    setMounted(true);
    loadTasks();
    loadStats();
  }, []);

  const loadTasks = async () => {
    try {
      setIsLoading(true);
      const fetchedTasks = await taskService.getTasks({
        platform: selectedCategory === 'all' ? undefined : selectedCategory,
        search: searchTerm || undefined,
        sortBy
      });
      setTasks(fetchedTasks);
    } catch (error) {
      console.error('Failed to load tasks:', error);
      toast.error('Failed to load tasks');
    } finally {
      setIsLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      const taskStats = await taskService.getTaskStats();
      setStats(taskStats);
    } catch (error) {
      console.error('Failed to load stats:', error);
    }
  };

  useEffect(() => {
    if (mounted) {
      loadTasks();
    }
  }, [selectedCategory, sortBy, mounted]);

  useEffect(() => {
    if (mounted && searchTerm !== '') {
      const timeoutId = setTimeout(() => {
        loadTasks();
      }, 500);
      return () => clearTimeout(timeoutId);
    }
  }, [searchTerm, mounted]);

  const categories = [
    { id: 'all', name: 'All Tasks', count: tasks.length },
    { id: 'twitter', name: 'Twitter', count: tasks.filter(t => t.platform === 'twitter').length },
    { id: 'discord', name: 'Discord', count: tasks.filter(t => t.platform === 'discord').length },
    { id: 'tiktok', name: 'TikTok', count: tasks.filter(t => t.platform === 'tiktok').length },
    { id: 'instagram', name: 'Instagram', count: tasks.filter(t => t.platform === 'instagram').length },
    { id: 'youtube', name: 'YouTube', count: tasks.filter(t => t.platform === 'youtube').length },
    { id: 'reddit', name: 'Reddit', count: tasks.filter(t => t.platform === 'reddit').length },
    { id: 'telegram', name: 'Telegram', count: tasks.filter(t => t.platform === 'telegram').length },
    { id: 'other', name: 'Other', count: tasks.filter(t => t.platform === 'other').length }
  ];

  const handleApplyToTask = async (taskId: string) => {
    if (!connectedWallet) {
      toast.error('Please connect your wallet first');
      return;
    }

    try {
      await taskService.applyToTask(taskId, {
        applicant_address: connectedWallet,
        message: 'I am interested in this task and ready to complete it.'
      });
      loadTasks(); // Refresh tasks to update applicant count
    } catch (error) {
      console.error('Failed to apply to task:', error);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 1) return 'Just now';
    if (diffInHours < 24) return `${diffInHours} hours ago`;
    if (diffInHours < 48) return '1 day ago';
    return `${Math.floor(diffInHours / 24)} days ago`;
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
              <Link href="/create-task" className="neon-button inline-flex items-center gap-2">
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
          {isLoading ? (
            <div className="text-center py-12">
              <div className="spinner mx-auto mb-4"></div>
              <p className="text-gray-400">Loading tasks...</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
              {tasks.map((task, index) => (
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
                      <Link href={`/task/${task.id}`}>
                        <h3 className="text-lg font-semibold text-white mb-2 line-clamp-2 hover:text-purple-300 transition-colors cursor-pointer">
                          {task.title}
                        </h3>
                      </Link>
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
                      <span className="text-gray-300">{task.client_name || 'Anonymous'}</span>
                      {task.rating && (
                        <div className="flex items-center gap-1">
                          <Star className="w-3 h-3 text-yellow-400 fill-current" />
                          <span className="text-yellow-400 text-xs">{task.rating}</span>
                        </div>
                      )}
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
                    <span>{task.applicants_count} applicants</span>
                    <span>{formatDate(task.posted_at)}</span>
                  </div>

                  <div className="flex gap-2">
                    <button 
                      onClick={() => handleApplyToTask(task.id)}
                      className="flex-1 neon-button-primary text-center py-2 px-4 rounded-lg"
                      disabled={task.status !== 'open'}
                    >
                      {task.status === 'open' ? 'Apply Now' : 'Closed'}
                    </button>
                    <button className="px-4 py-2 border border-gray-600/30 text-gray-300 rounded-lg hover:border-purple-400/50 transition-colors">
                      Save
                    </button>
                  </div>
                </motion.div>
              ))}
            </div>
          )}

          {!isLoading && tasks.length === 0 && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center py-12"
            >
              <Briefcase className="w-16 h-16 text-gray-600 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-400 mb-2">No tasks found</h3>
              <p className="text-gray-500 mb-6">Try adjusting your search or filters, or be the first to post a task!</p>
              {connectedWallet && (
                <Link href="/create-task" className="neon-button-primary inline-flex items-center gap-2">
                  <Plus className="w-4 h-4" />
                  Post a Task
                </Link>
              )}
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
              { label: 'Active Tasks', value: stats.activeTasks.toString(), icon: Briefcase },
              { label: 'Total Earnings', value: `$${stats.totalEarnings.toLocaleString()}`, icon: DollarSign },
              { label: 'Platform Users', value: stats.totalUsers.toString(), icon: User },
              { label: 'Success Rate', value: stats.totalTasks > 0 ? `${Math.round((stats.completedTasks / stats.totalTasks) * 100)}%` : '0%', icon: TrendingUp }
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
