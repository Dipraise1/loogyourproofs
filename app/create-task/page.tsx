'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Plus, 
  Save, 
  X, 
  DollarSign, 
  Clock, 
  MapPin, 
  Tag, 
  AlertCircle,
  CheckCircle,
  Upload,
  Link as LinkIcon,
  Globe,
  MessageSquare
} from 'lucide-react';
import Link from 'next/link';
import { Header } from '../components/Header';
import { WalletConnect } from '../components/WalletConnect';
import { useAppStore } from '../../lib/store';
import { taskService } from '../../lib/task-service';
import toast from 'react-hot-toast';

export default function CreateTaskPage() {
  const { connectedWallet, currentUser } = useAppStore();
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    budget: '',
    duration: '',
    location: 'Remote',
    platform: 'twitter' as 'twitter' | 'discord' | 'tiktok' | 'instagram' | 'youtube' | 'reddit' | 'telegram' | 'other',
    tags: [] as string[],
    requirements: [] as string[],
    payment_method: 'crypto' as 'crypto' | 'fiat' | 'both',
    featured: false,
    urgent: false
  });

  const [newTag, setNewTag] = useState('');
  const [newRequirement, setNewRequirement] = useState('');

  const platforms = [
    { value: 'twitter', label: 'Twitter', icon: '🐦' },
    { value: 'discord', label: 'Discord', icon: '💬' },
    { value: 'tiktok', label: 'TikTok', icon: '🎵' },
    { value: 'instagram', label: 'Instagram', icon: '📸' },
    { value: 'youtube', label: 'YouTube', icon: '📺' },
    { value: 'reddit', label: 'Reddit', icon: '🔗' },
    { value: 'telegram', label: 'Telegram', icon: '✈️' },
    { value: 'other', label: 'Other', icon: '🌐' }
  ];

  const addTag = () => {
    if (newTag.trim() && !formData.tags.includes(newTag.trim())) {
      setFormData(prev => ({
        ...prev,
        tags: [...prev.tags, newTag.trim()]
      }));
      setNewTag('');
    }
  };

  const removeTag = (index: number) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.filter((_, i) => i !== index)
    }));
  };

  const addRequirement = () => {
    if (newRequirement.trim() && !formData.requirements.includes(newRequirement.trim())) {
      setFormData(prev => ({
        ...prev,
        requirements: [...prev.requirements, newRequirement.trim()]
      }));
      setNewRequirement('');
    }
  };

  const removeRequirement = (index: number) => {
    setFormData(prev => ({
      ...prev,
      requirements: prev.requirements.filter((_, i) => i !== index)
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!connectedWallet) {
      toast.error('Please connect your wallet first');
      return;
    }

    if (!formData.title.trim() || !formData.description.trim() || !formData.budget.trim()) {
      toast.error('Please fill in all required fields');
      return;
    }

    setIsLoading(true);
    try {
      await taskService.createTask({
        title: formData.title.trim(),
        description: formData.description.trim(),
        budget: formData.budget.trim(),
        duration: formData.duration.trim(),
        location: formData.location.trim(),
        client_address: connectedWallet,
        client_name: currentUser?.name || 'Anonymous',
        platform: formData.platform,
        tags: formData.tags,
        requirements: formData.requirements,
        payment_method: formData.payment_method,
        status: 'open',
        featured: formData.featured,
        urgent: formData.urgent,
        posted_at: new Date().toISOString()
      });

      toast.success('Task created successfully!');
      
      // Reset form
      setFormData({
        title: '',
        description: '',
        budget: '',
        duration: '',
        location: 'Remote',
        platform: 'twitter',
        tags: [],
        requirements: [],
        payment_method: 'crypto',
        featured: false,
        urgent: false
      });
    } catch (error) {
      console.error('Failed to create task:', error);
      toast.error('Failed to create task');
    } finally {
      setIsLoading(false);
    }
  };

  if (!connectedWallet) {
    return (
      <div className="min-h-screen">
        <Header />
        <main className="pt-20 pb-12 px-4">
          <div className="container mx-auto max-w-4xl">
            <div className="glass-panel p-8 text-center">
              <Plus className="w-16 h-16 text-purple-400 mx-auto mb-4" />
              <h1 className="text-2xl font-bold text-white mb-4">Connect Your Wallet</h1>
              <p className="text-gray-300 mb-6">
                Connect your wallet to create and post tasks
              </p>
              <WalletConnect />
            </div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <Header />
      
      <main className="pt-20 pb-12 px-4">
        <div className="container mx-auto max-w-4xl">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-8"
          >
            <h1 className="text-3xl md:text-4xl font-bold mb-4 text-purple-300">
              Create New Task
            </h1>
            <p className="text-gray-300 text-lg">
              Post a social media task and find freelancers to complete it
            </p>
          </motion.div>

          {/* Form */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="glass-panel p-8"
          >
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Basic Information */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                  <MessageSquare className="w-5 h-5 text-purple-400" />
                  Basic Information
                </h3>
                
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Task Title *
                  </label>
                  <input
                    type="text"
                    value={formData.title}
                    onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                    className="cyber-input w-full"
                    placeholder="e.g., Follow @SolGigsOfficial on Twitter"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Description *
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                    className="cyber-input w-full h-32 resize-none"
                    placeholder="Describe what needs to be done, requirements, and any specific instructions..."
                    required
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Budget *
                    </label>
                    <input
                      type="text"
                      value={formData.budget}
                      onChange={(e) => setFormData(prev => ({ ...prev, budget: e.target.value }))}
                      className="cyber-input w-full"
                      placeholder="e.g., $5 - $15"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Duration
                    </label>
                    <input
                      type="text"
                      value={formData.duration}
                      onChange={(e) => setFormData(prev => ({ ...prev, duration: e.target.value }))}
                      className="cyber-input w-full"
                      placeholder="e.g., 5 minutes, 1 hour, 1 week"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Location
                  </label>
                  <input
                    type="text"
                    value={formData.location}
                    onChange={(e) => setFormData(prev => ({ ...prev, location: e.target.value }))}
                    className="cyber-input w-full"
                    placeholder="e.g., Remote, Global, US Only"
                  />
                </div>
              </div>

              {/* Platform Selection */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                  <Globe className="w-5 h-5 text-purple-400" />
                  Platform
                </h3>
                
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {platforms.map((platform) => (
                    <button
                      key={platform.value}
                      type="button"
                      onClick={() => setFormData(prev => ({ ...prev, platform: platform.value as any }))}
                      className={`p-3 rounded-lg border transition-all duration-200 ${
                        formData.platform === platform.value
                          ? 'border-purple-400 bg-purple-500/20 text-white'
                          : 'border-gray-600 bg-gray-800/50 text-gray-300 hover:border-purple-400/50'
                      }`}
                    >
                      <div className="text-2xl mb-1">{platform.icon}</div>
                      <div className="text-sm font-medium">{platform.label}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Tags */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                  <Tag className="w-5 h-5 text-purple-400" />
                  Tags
                </h3>
                
                <div className="flex flex-wrap gap-2 mb-3">
                  {formData.tags.map((tag, index) => (
                    <span
                      key={index}
                      className="px-3 py-1 bg-purple-500/20 text-purple-300 text-sm rounded-full border border-purple-400/30 flex items-center gap-2"
                    >
                      {tag}
                      <button
                        type="button"
                        onClick={() => removeTag(index)}
                        className="text-purple-400 hover:text-red-400"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  ))}
                </div>
                
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newTag}
                    onChange={(e) => setNewTag(e.target.value)}
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        addTag();
                      }
                    }}
                    className="cyber-input flex-1"
                    placeholder="Add a tag and press Enter"
                  />
                  <button
                    type="button"
                    onClick={addTag}
                    className="neon-button px-4"
                  >
                    Add
                  </button>
                </div>
              </div>

              {/* Requirements */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-purple-400" />
                  Requirements
                </h3>
                
                <div className="space-y-2 mb-3">
                  {formData.requirements.map((requirement, index) => (
                    <div
                      key={index}
                      className="flex items-center gap-2 p-2 bg-gray-800/50 rounded-lg border border-gray-600/30"
                    >
                      <CheckCircle className="w-4 h-4 text-green-400 flex-shrink-0" />
                      <span className="text-gray-300 text-sm flex-1">{requirement}</span>
                      <button
                        type="button"
                        onClick={() => removeRequirement(index)}
                        className="text-gray-400 hover:text-red-400"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                </div>
                
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newRequirement}
                    onChange={(e) => setNewRequirement(e.target.value)}
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        addRequirement();
                      }
                    }}
                    className="cyber-input flex-1"
                    placeholder="Add a requirement and press Enter"
                  />
                  <button
                    type="button"
                    onClick={addRequirement}
                    className="neon-button px-4"
                  >
                    Add
                  </button>
                </div>
              </div>

              {/* Payment & Options */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                  <DollarSign className="w-5 h-5 text-purple-400" />
                  Payment & Options
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Payment Method
                    </label>
                    <select
                      value={formData.payment_method}
                      onChange={(e) => setFormData(prev => ({ ...prev, payment_method: e.target.value as any }))}
                      className="cyber-input w-full"
                    >
                      <option value="crypto">Cryptocurrency</option>
                      <option value="fiat">Fiat Currency</option>
                      <option value="both">Both</option>
                    </select>
                  </div>

                  <div className="space-y-3">
                    <label className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={formData.featured}
                        onChange={(e) => setFormData(prev => ({ ...prev, featured: e.target.checked }))}
                        className="w-4 h-4 text-purple-600 bg-gray-800 border-gray-600 rounded focus:ring-purple-500"
                      />
                      <span className="text-sm text-gray-300">Featured Task</span>
                    </label>
                    
                    <label className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={formData.urgent}
                        onChange={(e) => setFormData(prev => ({ ...prev, urgent: e.target.checked }))}
                        className="w-4 h-4 text-purple-600 bg-gray-800 border-gray-600 rounded focus:ring-purple-500"
                      />
                      <span className="text-sm text-gray-300">Urgent Task</span>
                    </label>
                  </div>
                </div>
              </div>

              {/* Submit Button */}
              <div className="flex gap-4 pt-6">
                <button
                  type="submit"
                  disabled={isLoading}
                  className="flex-1 neon-button-primary inline-flex items-center justify-center gap-2 py-3 px-6"
                >
                  <Save className="w-5 h-5" />
                  {isLoading ? 'Creating Task...' : 'Create Task'}
                </button>
                <Link href="/tasks" className="neon-button inline-flex items-center justify-center gap-2 py-3 px-6">
                  <X className="w-5 h-5" />
                  Cancel
                </Link>
              </div>
            </form>
          </motion.div>
        </div>
      </main>
    </div>
  );
}
