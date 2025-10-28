import { supabase } from './supabase';
import { supabaseService } from './supabase';
import { useAppStore } from './store';
import toast from 'react-hot-toast';

export interface User {
  wallet_address: string;
  wallet_type: string;
  name?: string;
  bio?: string;
  avatar?: string;
  specialties: string[];
  rating: number;
  total_tasks_completed: number;
  total_earnings: number;
  joined_at: string;
  last_active: string;
  social: {
    github?: string;
    twitter?: string;
    website?: string;
    discord?: string;
    telegram?: string;
  };
  preferences: {
    notifications: boolean;
    email_updates: boolean;
    public_profile: boolean;
  };
  created_at: string;
  updated_at: string;
}

export interface UserStats {
  totalTasksCompleted: number;
  totalEarnings: number;
  averageRating: number;
  successRate: number;
  joinedDaysAgo: number;
}

export class UserService {
  private static instance: UserService;

  public static getInstance(): UserService {
    if (!UserService.instance) {
      UserService.instance = new UserService();
    }
    return UserService.instance;
  }

  /**
   * Create or update user profile
   */
  async createOrUpdateUser(userData: {
    wallet_address: string;
    wallet_type: string;
    name?: string;
    bio?: string;
    avatar?: string;
    specialties?: string[];
    social?: any;
    preferences?: any;
  }): Promise<User> {
    try {
      // Check if Supabase is properly configured
      if (!supabaseService.isConfigured()) {
        console.log('Supabase not configured, using localStorage fallback');
        return this.createOrUpdateUserLocal(userData);
      }

      const { data, error } = await supabase
        .from('users')
        .upsert({
          ...userData,
          last_active: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        }, {
          onConflict: 'wallet_address'
        })
        .select()
        .single();

      if (error) {
        throw new Error(error.message);
      }

      // Update local store
      const { setCurrentUser } = useAppStore.getState();
      setCurrentUser(data);

      toast.success('Profile updated successfully!');
      return data;
    } catch (error) {
      console.error('Failed to create/update user:', error);
      console.log('Falling back to localStorage');
      return this.createOrUpdateUserLocal(userData);
    }
  }

  /**
   * Create or update user profile using localStorage fallback
   */
  private createOrUpdateUserLocal(userData: {
    wallet_address: string;
    wallet_type: string;
    name?: string;
    bio?: string;
    avatar?: string;
    specialties?: string[];
    social?: any;
    preferences?: any;
  }): User {
    const user: User = {
      wallet_address: userData.wallet_address,
      wallet_type: userData.wallet_type as 'phantom' | 'metamask' | 'solflare',
      name: userData.name || `User_${userData.wallet_address.slice(0, 6)}`,
      bio: userData.bio || '',
      avatar: userData.avatar,
      specialties: userData.specialties || [],
      rating: 0,
      total_tasks_completed: 0,
      total_earnings: 0,
      joined_at: new Date().toISOString(),
      last_active: new Date().toISOString(),
      social: userData.social || {},
      preferences: userData.preferences || {},
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    // Save to localStorage
    const users = JSON.parse(localStorage.getItem('users') || '[]');
    const existingIndex = users.findIndex((u: User) => u.wallet_address === userData.wallet_address);
    
    if (existingIndex >= 0) {
      users[existingIndex] = user;
    } else {
      users.push(user);
    }
    
    localStorage.setItem('users', JSON.stringify(users));

    // Update local store
    const { setCurrentUser } = useAppStore.getState();
    setCurrentUser(user);

    toast.success('Profile updated successfully!');
    return user;
  }

  /**
   * Get user by wallet address
   */
  async getUserByWallet(walletAddress: string): Promise<User | null> {
    try {
      // Check if Supabase is properly configured
      if (!supabaseService.isConfigured()) {
        console.log('Supabase not configured, using localStorage fallback');
        return this.getUserByWalletLocal(walletAddress);
      }

      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('wallet_address', walletAddress)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          return null; // User not found
        }
        throw new Error(error.message);
      }

      return data;
    } catch (error) {
      console.error('Failed to fetch user:', error);
      console.log('Falling back to localStorage');
      return this.getUserByWalletLocal(walletAddress);
    }
  }

  /**
   * Get user by wallet address using localStorage fallback
   */
  private getUserByWalletLocal(walletAddress: string): User | null {
    try {
      const users = JSON.parse(localStorage.getItem('users') || '[]');
      return users.find((u: User) => u.wallet_address === walletAddress) || null;
    } catch (error) {
      console.error('Failed to get user from localStorage:', error);
      return null;
    }
  }

  /**
   * Get all users with optional filtering
   */
  async getAllUsers(filters?: {
    search?: string;
    specialties?: string[];
    sortBy?: string;
    limit?: number;
  }): Promise<User[]> {
    try {
      let query = supabase.from('users').select('*');

      if (filters?.search) {
        query = query.or(`name.ilike.%${filters.search}%,bio.ilike.%${filters.search}%,specialties.cs.{${filters.search}}`);
      }

      if (filters?.specialties && filters.specialties.length > 0) {
        query = query.overlaps('specialties', filters.specialties);
      }

      // Apply sorting
      switch (filters?.sortBy) {
        case 'rating':
          query = query.order('rating', { ascending: false });
          break;
        case 'earnings':
          query = query.order('total_earnings', { ascending: false });
          break;
        case 'tasks':
          query = query.order('total_tasks_completed', { ascending: false });
          break;
        case 'recent':
          query = query.order('joined_at', { ascending: false });
          break;
        default:
          query = query.order('last_active', { ascending: false });
      }

      if (filters?.limit) {
        query = query.limit(filters.limit);
      }

      const { data, error } = await query;

      if (error) {
        throw new Error(error.message);
      }

      return data || [];
    } catch (error) {
      console.error('Failed to fetch users:', error);
      return [];
    }
  }

  /**
   * Update user activity
   */
  async updateUserActivity(walletAddress: string): Promise<void> {
    try {
      await supabase
        .from('users')
        .update({ 
          last_active: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('wallet_address', walletAddress);
    } catch (error) {
      console.error('Failed to update user activity:', error);
    }
  }

  /**
   * Update user stats after task completion
   */
  async updateUserStats(walletAddress: string, stats: {
    tasksCompleted?: number;
    earnings?: number;
    rating?: number;
  }): Promise<void> {
    try {
      const updateData: any = {
        updated_at: new Date().toISOString()
      };

      if (stats.tasksCompleted !== undefined) {
        const { data: currentUser } = await supabase
          .from('users')
          .select('total_tasks_completed')
          .eq('wallet_address', walletAddress)
          .single();
        
        if (currentUser) {
          updateData.total_tasks_completed = currentUser.total_tasks_completed + stats.tasksCompleted;
        }
      }

      if (stats.earnings !== undefined) {
        const { data: currentUser } = await supabase
          .from('users')
          .select('total_earnings')
          .eq('wallet_address', walletAddress)
          .single();
        
        if (currentUser) {
          updateData.total_earnings = currentUser.total_earnings + stats.earnings;
        }
      }

      if (stats.rating !== undefined) {
        updateData.rating = stats.rating;
      }

      const { error } = await supabase
        .from('users')
        .update(updateData)
        .eq('wallet_address', walletAddress);

      if (error) {
        throw new Error(error.message);
      }
    } catch (error) {
      console.error('Failed to update user stats:', error);
      throw error;
    }
  }

  /**
   * Get user statistics
   */
  async getUserStats(walletAddress: string): Promise<UserStats | null> {
    try {
      // Check if Supabase is properly configured
      if (!supabaseService.isConfigured()) {
        console.log('Supabase not configured, using localStorage fallback for stats');
        return this.getUserStatsLocal(walletAddress);
      }

      const { data: user } = await supabase
        .from('users')
        .select('total_tasks_completed, total_earnings, rating, joined_at')
        .eq('wallet_address', walletAddress)
        .single();

      if (!user) {
        return null;
      }

      const joinedDate = new Date(user.joined_at);
      const now = new Date();
      const joinedDaysAgo = Math.floor((now.getTime() - joinedDate.getTime()) / (1000 * 60 * 60 * 24));

      return {
        totalTasksCompleted: user.total_tasks_completed,
        totalEarnings: user.total_earnings,
        averageRating: user.rating,
        successRate: user.total_tasks_completed > 0 ? 95 : 0, // Placeholder calculation
        joinedDaysAgo
      };
    } catch (error) {
      console.error('Failed to fetch user stats:', error);
      console.log('Falling back to localStorage');
      return this.getUserStatsLocal(walletAddress);
    }
  }

  /**
   * Get user stats using localStorage fallback
   */
  private getUserStatsLocal(walletAddress: string): UserStats | null {
    try {
      const user = this.getUserByWalletLocal(walletAddress);
      if (!user) {
        return null;
      }

      const joinedDate = new Date(user.joined_at);
      const now = new Date();
      const joinedDaysAgo = Math.floor((now.getTime() - joinedDate.getTime()) / (1000 * 60 * 60 * 24));

      return {
        totalTasksCompleted: user.total_tasks_completed || 0,
        totalEarnings: user.total_earnings || 0,
        averageRating: user.rating || 0,
        successRate: (user.total_tasks_completed || 0) > 0 ? 95 : 0, // Placeholder calculation
        joinedDaysAgo
      };
    } catch (error) {
      console.error('Failed to get user stats from localStorage:', error);
      return null;
    }
  }

  /**
   * Search users by query
   */
  async searchUsers(query: string): Promise<User[]> {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .or(`name.ilike.%${query}%,bio.ilike.%${query}%,specialties.cs.{${query}},wallet_address.ilike.%${query}%`)
        .order('last_active', { ascending: false });

      if (error) {
        throw new Error(error.message);
      }

      return data || [];
    } catch (error) {
      console.error('Failed to search users:', error);
      return [];
    }
  }

  /**
   * Get top users by different criteria
   */
  async getTopUsers(criteria: 'earnings' | 'tasks' | 'rating' = 'earnings', limit: number = 10): Promise<User[]> {
    try {
      let orderBy: string;
      switch (criteria) {
        case 'earnings':
          orderBy = 'total_earnings';
          break;
        case 'tasks':
          orderBy = 'total_tasks_completed';
          break;
        case 'rating':
          orderBy = 'rating';
          break;
        default:
          orderBy = 'total_earnings';
      }

      const { data, error } = await supabase
        .from('users')
        .select('*')
        .order(orderBy, { ascending: false })
        .limit(limit);

      if (error) {
        throw new Error(error.message);
      }

      return data || [];
    } catch (error) {
      console.error('Failed to fetch top users:', error);
      return [];
    }
  }

  /**
   * Check if user exists
   */
  async userExists(walletAddress: string): Promise<boolean> {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('wallet_address')
        .eq('wallet_address', walletAddress)
        .single();

      return !error && !!data;
    } catch (error) {
      return false;
    }
  }

  /**
   * Initialize user session
   */
  async initializeUserSession(walletAddress: string, walletType: string): Promise<User | null> {
    try {
      // Check if user exists
      let user = await this.getUserByWallet(walletAddress);
      
      if (!user) {
        // Create new user
        user = await this.createOrUpdateUser({
          wallet_address: walletAddress,
          wallet_type: walletType,
          name: `User ${walletAddress.slice(0, 6)}...${walletAddress.slice(-4)}`,
          bio: 'New to SolGigs',
          specialties: [],
          social: {},
          preferences: {
            notifications: true,
            email_updates: false,
            public_profile: true
          }
        });
      } else {
        // Update activity
        await this.updateUserActivity(walletAddress);
      }

      return user;
    } catch (error) {
      console.error('Failed to initialize user session:', error);
      return null;
    }
  }
}

export const userService = UserService.getInstance();
