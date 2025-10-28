'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  User, 
  Edit3, 
  Save, 
  X, 
  Camera,
  Github,
  Twitter,
  Globe,
  Mail,
  Bell,
  Shield,
  Star,
  TrendingUp,
  DollarSign,
  Calendar,
  Award
} from 'lucide-react';
import { Header } from '../components/Header';
import { WalletConnect } from '../components/WalletConnect';
import { useAppStore } from '../../lib/store';
import { userService, User as UserType } from '../../lib/user-service';
import toast from 'react-hot-toast';

export default function ProfilePage() {
  const { currentUser, connectedWallet, setCurrentUser } = useAppStore();
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [userStats, setUserStats] = useState({
    totalTasksCompleted: 0,
    totalEarnings: 0,
    averageRating: 0,
    successRate: 0,
    joinedDaysAgo: 0
  });

  const [formData, setFormData] = useState({
    name: '',
    bio: '',
    specialties: [] as string[],
    social: {
      github: '',
      twitter: '',
      website: '',
      discord: '',
      telegram: ''
    },
    preferences: {
      notifications: true,
      email_updates: false,
      public_profile: true
    }
  });

  useEffect(() => {
    if (currentUser) {
      setFormData({
        name: currentUser.name || '',
        bio: currentUser.bio || '',
        specialties: currentUser.specialties || [],
        social: {
          github: currentUser.social?.github || '',
          twitter: currentUser.social?.twitter || '',
          website: currentUser.social?.website || '',
          discord: currentUser.social?.discord || '',
          telegram: currentUser.social?.telegram || ''
        },
        preferences: {
          notifications: currentUser.preferences?.notifications ?? true,
          email_updates: currentUser.preferences?.email_updates ?? false,
          public_profile: currentUser.preferences?.public_profile ?? true
        }
      });

      // Load user stats
      loadUserStats();
    }
  }, [currentUser]);

  const loadUserStats = async () => {
    if (!connectedWallet) return;
    
    try {
      const stats = await userService.getUserStats(connectedWallet);
      if (stats) {
        setUserStats(stats);
      }
    } catch (error) {
      console.error('Failed to load user stats:', error);
    }
  };

  const handleSave = async () => {
    if (!connectedWallet) {
      toast.error('Please connect your wallet first');
      return;
    }

    setIsLoading(true);
    try {
      const updatedUser = await userService.createOrUpdateUser({
        wallet_address: connectedWallet,
        wallet_type: 'phantom', // This should come from wallet type
        name: formData.name,
        bio: formData.bio,
        specialties: formData.specialties,
        social: formData.social,
        preferences: formData.preferences
      });

      setCurrentUser(updatedUser);
      setIsEditing(false);
      toast.success('Profile updated successfully!');
    } catch (error) {
      console.error('Failed to update profile:', error);
      toast.error('Failed to update profile');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    if (currentUser) {
      setFormData({
        name: currentUser.name || '',
        bio: currentUser.bio || '',
        specialties: currentUser.specialties || [],
        social: {
          github: currentUser.social?.github || '',
          twitter: currentUser.social?.twitter || '',
          website: currentUser.social?.website || '',
          discord: currentUser.social?.discord || '',
          telegram: currentUser.social?.telegram || ''
        },
        preferences: {
          notifications: currentUser.preferences?.notifications ?? true,
          email_updates: currentUser.preferences?.email_updates ?? false,
          public_profile: currentUser.preferences?.public_profile ?? true
        }
      });
    }
    setIsEditing(false);
  };

  const addSpecialty = (specialty: string) => {
    if (specialty.trim() && !formData.specialties.includes(specialty.trim())) {
      setFormData(prev => ({
        ...prev,
        specialties: [...prev.specialties, specialty.trim()]
      }));
    }
  };

  const removeSpecialty = (index: number) => {
    setFormData(prev => ({
      ...prev,
      specialties: prev.specialties.filter((_, i) => i !== index)
    }));
  };

  if (!connectedWallet) {
    return (
      <div className="min-h-screen">
        <Header />
        <main className="pt-20 pb-12 px-4">
          <div className="container mx-auto max-w-4xl">
            <div className="glass-panel p-8 text-center">
              <User className="w-16 h-16 text-purple-400 mx-auto mb-4" />
              <h1 className="text-2xl font-bold text-white mb-4">Connect Your Wallet</h1>
              <p className="text-gray-300 mb-6">
                Connect your wallet to view and manage your profile
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
        <div className="container mx-auto max-w-6xl">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-8"
          >
            <h1 className="text-3xl md:text-4xl font-bold mb-4 text-purple-300">
              Your Profile
            </h1>
            <p className="text-gray-300 text-lg">
              Manage your freelancer profile and preferences
            </p>
          </motion.div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Profile Card */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 }}
              className="lg:col-span-2"
            >
              <div className="glass-panel p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-semibold text-white">Profile Information</h2>
                  {!isEditing ? (
                    <button
                      onClick={() => setIsEditing(true)}
                      className="neon-button inline-flex items-center gap-2"
                    >
                      <Edit3 className="w-4 h-4" />
                      Edit Profile
                    </button>
                  ) : (
                    <div className="flex gap-2">
                      <button
                        onClick={handleSave}
                        disabled={isLoading}
                        className="neon-button-primary inline-flex items-center gap-2"
                      >
                        <Save className="w-4 h-4" />
                        {isLoading ? 'Saving...' : 'Save'}
                      </button>
                      <button
                        onClick={handleCancel}
                        className="neon-button inline-flex items-center gap-2"
                      >
                        <X className="w-4 h-4" />
                        Cancel
                      </button>
                    </div>
                  )}
                </div>

                <div className="space-y-6">
                  {/* Avatar */}
                  <div className="flex items-center gap-4">
                    <div className="w-20 h-20 bg-gradient-to-br from-purple-500 to-blue-500 rounded-lg flex items-center justify-center text-white font-bold text-2xl">
                      {currentUser?.name ? currentUser.name.charAt(0).toUpperCase() : 'U'}
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-white">
                        {currentUser?.name || 'Anonymous User'}
                      </h3>
                      <p className="text-sm text-purple-400 font-mono">
                        {connectedWallet.slice(0, 6)}...{connectedWallet.slice(-4)}
                      </p>
                    </div>
                  </div>

                  {/* Name */}
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Display Name
                    </label>
                    {isEditing ? (
                      <input
                        type="text"
                        value={formData.name}
                        onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                        className="cyber-input w-full"
                        placeholder="Enter your display name"
                      />
                    ) : (
                      <p className="text-white">{currentUser?.name || 'Not set'}</p>
                    )}
                  </div>

                  {/* Bio */}
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Bio
                    </label>
                    {isEditing ? (
                      <textarea
                        value={formData.bio}
                        onChange={(e) => setFormData(prev => ({ ...prev, bio: e.target.value }))}
                        className="cyber-input w-full h-24 resize-none"
                        placeholder="Tell us about yourself..."
                      />
                    ) : (
                      <p className="text-gray-300">{currentUser?.bio || 'No bio provided'}</p>
                    )}
                  </div>

                  {/* Specialties */}
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Specialties
                    </label>
                    {isEditing ? (
                      <div className="space-y-2">
                        <div className="flex flex-wrap gap-2">
                          {formData.specialties.map((specialty, index) => (
                            <span
                              key={index}
                              className="px-3 py-1 bg-purple-500/20 text-purple-300 text-sm rounded-full border border-purple-400/30 flex items-center gap-2"
                            >
                              {specialty}
                              <button
                                onClick={() => removeSpecialty(index)}
                                className="text-purple-400 hover:text-red-400"
                              >
                                <X className="w-3 h-3" />
                              </button>
                            </span>
                          ))}
                        </div>
                        <input
                          type="text"
                          placeholder="Add a specialty and press Enter"
                          className="cyber-input w-full"
                          onKeyPress={(e) => {
                            if (e.key === 'Enter') {
                              addSpecialty(e.currentTarget.value);
                              e.currentTarget.value = '';
                            }
                          }}
                        />
                      </div>
                    ) : (
                      <div className="flex flex-wrap gap-2">
                        {currentUser?.specialties?.length ? (
                          currentUser.specialties.map((specialty, index) => (
                            <span
                              key={index}
                              className="px-3 py-1 bg-purple-500/20 text-purple-300 text-sm rounded-full border border-purple-400/30"
                            >
                              {specialty}
                            </span>
                          ))
                        ) : (
                          <p className="text-gray-400">No specialties added</p>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Social Links */}
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Social Links
                    </label>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {[
                        { key: 'github', icon: Github, label: 'GitHub' },
                        { key: 'twitter', icon: Twitter, label: 'Twitter' },
                        { key: 'website', icon: Globe, label: 'Website' }
                      ].map(({ key, icon: Icon, label }) => (
                        <div key={key}>
                          <div className="flex items-center gap-2 mb-1">
                            <Icon className="w-4 h-4 text-gray-400" />
                            <span className="text-sm text-gray-300">{label}</span>
                          </div>
                          {isEditing ? (
                            <input
                              type="url"
                              value={formData.social[key as keyof typeof formData.social]}
                              onChange={(e) => setFormData(prev => ({
                                ...prev,
                                social: { ...prev.social, [key]: e.target.value }
                              }))}
                              className="cyber-input w-full"
                              placeholder={`https://${key}.com/username`}
                            />
                          ) : (
                            <p className="text-gray-300 text-sm">
                              {currentUser?.social?.[key as keyof typeof currentUser.social] || 'Not provided'}
                            </p>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Preferences */}
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Preferences
                    </label>
                    <div className="space-y-3">
                      {[
                        { key: 'notifications', icon: Bell, label: 'Push Notifications', desc: 'Receive notifications for task updates' },
                        { key: 'email_updates', icon: Mail, label: 'Email Updates', desc: 'Receive email notifications' },
                        { key: 'public_profile', icon: Shield, label: 'Public Profile', desc: 'Make your profile visible to others' }
                      ].map(({ key, icon: Icon, label, desc }) => (
                        <div key={key} className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <Icon className="w-4 h-4 text-gray-400" />
                            <div>
                              <p className="text-white text-sm">{label}</p>
                              <p className="text-gray-400 text-xs">{desc}</p>
                            </div>
                          </div>
                          {isEditing ? (
                            <label className="relative inline-flex items-center cursor-pointer">
                              <input
                                type="checkbox"
                                checked={formData.preferences[key as keyof typeof formData.preferences]}
                                onChange={(e) => setFormData(prev => ({
                                  ...prev,
                                  preferences: { ...prev.preferences, [key]: e.target.checked }
                                }))}
                                className="sr-only peer"
                              />
                              <div className="w-11 h-6 bg-gray-600 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-purple-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600"></div>
                            </label>
                          ) : (
                            <span className={`text-sm ${currentUser?.preferences?.[key as keyof typeof currentUser.preferences] ? 'text-green-400' : 'text-gray-400'}`}>
                              {currentUser?.preferences?.[key as keyof typeof currentUser.preferences] ? 'Enabled' : 'Disabled'}
                            </span>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Stats Sidebar */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
              className="space-y-6"
            >
              {/* Stats Card */}
              <div className="glass-panel p-6">
                <h3 className="text-lg font-semibold text-white mb-4">Your Stats</h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Award className="w-4 h-4 text-purple-400" />
                      <span className="text-gray-300 text-sm">Tasks Completed</span>
                    </div>
                    <span className="text-white font-semibold">{userStats.totalTasksCompleted}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <DollarSign className="w-4 h-4 text-green-400" />
                      <span className="text-gray-300 text-sm">Total Earnings</span>
                    </div>
                    <span className="text-white font-semibold">${userStats.totalEarnings.toLocaleString()}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Star className="w-4 h-4 text-yellow-400" />
                      <span className="text-gray-300 text-sm">Rating</span>
                    </div>
                    <span className="text-white font-semibold">{userStats.averageRating.toFixed(1)}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <TrendingUp className="w-4 h-4 text-blue-400" />
                      <span className="text-gray-300 text-sm">Success Rate</span>
                    </div>
                    <span className="text-white font-semibold">{userStats.successRate}%</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-gray-400" />
                      <span className="text-gray-300 text-sm">Member Since</span>
                    </div>
                    <span className="text-white font-semibold">{userStats.joinedDaysAgo} days</span>
                  </div>
                </div>
              </div>

              {/* Quick Actions */}
              <div className="glass-panel p-6">
                <h3 className="text-lg font-semibold text-white mb-4">Quick Actions</h3>
                <div className="space-y-3">
                  <button className="w-full neon-button-primary text-center py-2 px-4 rounded-lg">
                    View My Tasks
                  </button>
                  <button className="w-full neon-button text-center py-2 px-4 rounded-lg">
                    Browse Available Tasks
                  </button>
                  <button className="w-full neon-button text-center py-2 px-4 rounded-lg">
                    Submit Proof of Work
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </main>
    </div>
  );
}
