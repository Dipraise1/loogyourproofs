import { supabase } from './supabase';
import { supabaseService } from './supabase';
import { useAppStore } from './store';
import toast from 'react-hot-toast';

export interface Task {
  id: string;
  title: string;
  description: string;
  budget: string;
  duration: string;
  location: string;
  client_address: string;
  client_name?: string;
  rating?: number;
  tags: string[];
  posted_at: string;
  applicants_count: number;
  featured: boolean;
  urgent: boolean;
  status: 'open' | 'in_progress' | 'completed' | 'cancelled';
  platform: 'twitter' | 'discord' | 'tiktok' | 'instagram' | 'youtube' | 'reddit' | 'telegram' | 'other';
  requirements: string[];
  payment_method: 'crypto' | 'fiat' | 'both';
  created_at: string;
  updated_at: string;
}

export interface TaskApplication {
  id: string;
  task_id: string;
  applicant_address: string;
  applicant_name?: string;
  message: string;
  status: 'pending' | 'accepted' | 'rejected' | 'completed';
  applied_at: string;
  completed_at?: string;
  proof_of_completion?: string;
  payment_hash?: string;
}

export interface TaskCompletion {
  id: string;
  task_id: string;
  application_id: string;
  applicant_address: string;
  proof_urls: string[];
  completion_message: string;
  completed_at: string;
  verified: boolean;
  payment_amount?: string;
  payment_hash?: string;
}

export class TaskService {
  private static instance: TaskService;

  public static getInstance(): TaskService {
    if (!TaskService.instance) {
      TaskService.instance = new TaskService();
    }
    return TaskService.instance;
  }

  /**
   * Create a new task
   */
  async createTask(taskData: Omit<Task, 'id' | 'applicants_count' | 'created_at' | 'updated_at'>): Promise<Task> {
    try {
      // Check if Supabase is properly configured
      if (!supabaseService.isConfigured()) {
        console.log('Supabase not configured, using localStorage fallback for task creation');
        return this.createTaskLocal(taskData);
      }

      const { data, error } = await supabase
        .from('tasks')
        .insert({
          ...taskData,
          applicants_count: 0,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (error) {
        throw new Error(error.message);
      }

      toast.success('Task created successfully!');
      return data;
    } catch (error) {
      console.error('Failed to create task:', error);
      console.log('Falling back to localStorage');
      return this.createTaskLocal(taskData);
    }
  }

  /**
   * Create task using localStorage fallback
   */
  private createTaskLocal(taskData: Omit<Task, 'id' | 'applicants_count' | 'created_at' | 'updated_at'>): Task {
    try {
      const task: Task = {
        ...taskData,
        id: `task_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        applicants_count: 0,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      // Save to localStorage
      const tasks = JSON.parse(localStorage.getItem('tasks') || '[]');
      tasks.push(task);
      localStorage.setItem('tasks', JSON.stringify(tasks));

      toast.success('Task created successfully!');
      return task;
    } catch (error) {
      console.error('Failed to create task in localStorage:', error);
      throw error;
    }
  }

  /**
   * Get all tasks with optional filtering
   */
  async getTasks(filters?: {
    platform?: string;
    status?: string;
    search?: string;
    sortBy?: string;
  }): Promise<Task[]> {
    try {
      // Check if Supabase is properly configured
      if (!supabaseService.isConfigured()) {
        console.log('Supabase not configured, using localStorage fallback for tasks');
        return this.getTasksLocal(filters);
      }

      let query = supabase.from('tasks').select('*');

      if (filters?.platform && filters.platform !== 'all') {
        query = query.eq('platform', filters.platform);
      }

      if (filters?.status) {
        query = query.eq('status', filters.status);
      }

      if (filters?.search) {
        query = query.or(`title.ilike.%${filters.search}%,description.ilike.%${filters.search}%,tags.cs.{${filters.search}}`);
      }

      // Apply sorting
      switch (filters?.sortBy) {
        case 'newest':
          query = query.order('created_at', { ascending: false });
          break;
        case 'budget':
          query = query.order('budget', { ascending: false });
          break;
        case 'applicants':
          query = query.order('applicants_count', { ascending: false });
          break;
        default:
          query = query.order('created_at', { ascending: false });
      }

      const { data, error } = await query;

      if (error) {
        throw new Error(error.message);
      }

      return data || [];
    } catch (error) {
      console.error('Failed to fetch tasks:', error);
      console.log('Falling back to localStorage');
      return this.getTasksLocal(filters);
    }
  }

  /**
   * Get tasks using localStorage fallback
   */
  private getTasksLocal(filters?: {
    platform?: string;
    status?: string;
    search?: string;
    sortBy?: string;
  }): Task[] {
    try {
      const tasks = JSON.parse(localStorage.getItem('tasks') || '[]');
      
      let filteredTasks = tasks;

      // Apply filters
      if (filters?.platform && filters.platform !== 'all') {
        filteredTasks = filteredTasks.filter((task: Task) => task.platform === filters.platform);
      }

      if (filters?.status) {
        filteredTasks = filteredTasks.filter((task: Task) => task.status === filters.status);
      }

      if (filters?.search) {
        const searchLower = filters.search.toLowerCase();
        filteredTasks = filteredTasks.filter((task: Task) => 
          task.title.toLowerCase().includes(searchLower) ||
          task.description.toLowerCase().includes(searchLower) ||
          task.tags.some(tag => tag.toLowerCase().includes(searchLower))
        );
      }

      // Apply sorting
      switch (filters?.sortBy) {
        case 'newest':
          filteredTasks.sort((a: Task, b: Task) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
          break;
        case 'budget':
          filteredTasks.sort((a: Task, b: Task) => parseFloat(b.budget) - parseFloat(a.budget));
          break;
        case 'applicants':
          filteredTasks.sort((a: Task, b: Task) => b.applicants_count - a.applicants_count);
          break;
        default:
          filteredTasks.sort((a: Task, b: Task) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
      }

      return filteredTasks;
    } catch (error) {
      console.error('Failed to get tasks from localStorage:', error);
      return [];
    }
  }

  /**
   * Get a specific task by ID
   */
  async getTaskById(taskId: string): Promise<Task | null> {
    try {
      const { data, error } = await supabase
        .from('tasks')
        .select('*')
        .eq('id', taskId)
        .single();

      if (error) {
        throw new Error(error.message);
      }

      return data;
    } catch (error) {
      console.error('Failed to fetch task:', error);
      return null;
    }
  }

  /**
   * Apply to a task
   */
  async applyToTask(taskId: string, applicationData: {
    applicant_address: string;
    applicant_name?: string;
    message: string;
  }): Promise<TaskApplication> {
    try {
      const { data, error } = await supabase
        .from('task_applications')
        .insert({
          task_id: taskId,
          ...applicationData,
          status: 'pending',
          applied_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (error) {
        throw new Error(error.message);
      }

      // Update task applicants count
      const { data: currentTask } = await supabase
        .from('tasks')
        .select('applicants_count')
        .eq('id', taskId)
        .single();

      if (currentTask) {
        await supabase
          .from('tasks')
          .update({ 
            applicants_count: currentTask.applicants_count + 1,
            updated_at: new Date().toISOString()
          })
          .eq('id', taskId);
      }

      toast.success('Application submitted successfully!');
      return data;
    } catch (error) {
      console.error('Failed to apply to task:', error);
      toast.error(`Failed to apply to task: ${(error as Error).message}`);
      throw error;
    }
  }

  /**
   * Get applications for a specific task
   */
  async getTaskApplications(taskId: string): Promise<TaskApplication[]> {
    try {
      const { data, error } = await supabase
        .from('task_applications')
        .select('*')
        .eq('task_id', taskId)
        .order('applied_at', { ascending: false });

      if (error) {
        throw new Error(error.message);
      }

      return data || [];
    } catch (error) {
      console.error('Failed to fetch task applications:', error);
      return [];
    }
  }

  /**
   * Get applications by a specific user
   */
  async getUserApplications(userAddress: string): Promise<TaskApplication[]> {
    try {
      const { data, error } = await supabase
        .from('task_applications')
        .select('*')
        .eq('applicant_address', userAddress)
        .order('applied_at', { ascending: false });

      if (error) {
        throw new Error(error.message);
      }

      return data || [];
    } catch (error) {
      console.error('Failed to fetch user applications:', error);
      return [];
    }
  }

  /**
   * Accept an application
   */
  async acceptApplication(applicationId: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('task_applications')
        .update({ 
          status: 'accepted',
          updated_at: new Date().toISOString()
        })
        .eq('id', applicationId);

      if (error) {
        throw new Error(error.message);
      }

      // Update task status to in_progress
      const { data: application } = await supabase
        .from('task_applications')
        .select('task_id')
        .eq('id', applicationId)
        .single();

      if (application) {
        await supabase
          .from('tasks')
          .update({ 
            status: 'in_progress',
            updated_at: new Date().toISOString()
          })
          .eq('id', application.task_id);
      }

      toast.success('Application accepted!');
    } catch (error) {
      console.error('Failed to accept application:', error);
      toast.error(`Failed to accept application: ${(error as Error).message}`);
      throw error;
    }
  }

  /**
   * Complete a task
   */
  async completeTask(applicationId: string, completionData: {
    proof_urls: string[];
    completion_message: string;
  }): Promise<TaskCompletion> {
    try {
      // Check if Supabase is properly configured
      if (!supabaseService.isConfigured()) {
        console.log('Supabase not configured, using localStorage fallback for task completion');
        return this.completeTaskLocal(applicationId, completionData);
      }

      const { data: application } = await supabase
        .from('task_applications')
        .select('*')
        .eq('id', applicationId)
        .single();

      if (!application) {
        throw new Error('Application not found');
      }

      // Create completion record
      const { data: completion, error: completionError } = await supabase
        .from('task_completions')
        .insert({
          task_id: application.task_id,
          application_id: applicationId,
          applicant_address: application.applicant_address,
          ...completionData,
          completed_at: new Date().toISOString(),
          verified: false,
        })
        .select()
        .single();

      if (completionError) {
        throw new Error(completionError.message);
      }

      // Update application status
      await supabase
        .from('task_applications')
        .update({ 
          status: 'completed',
          completed_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', applicationId);

      // Update task status
      await supabase
        .from('tasks')
        .update({ 
          status: 'completed',
          updated_at: new Date().toISOString()
        })
        .eq('id', application.task_id);

      toast.success('Task completed successfully!');
      return completion;
    } catch (error) {
      console.error('Failed to complete task:', error);
      console.log('Falling back to localStorage');
      return this.completeTaskLocal(applicationId, completionData);
    }
  }

  /**
   * Complete task using localStorage fallback
   */
  private completeTaskLocal(applicationId: string, completionData: {
    proof_urls: string[];
    completion_message: string;
  }): TaskCompletion {
    try {
      // Get application from localStorage
      const applications = JSON.parse(localStorage.getItem('task_applications') || '[]');
      const application = applications.find((app: TaskApplication) => app.id === applicationId);
      
      if (!application) {
        throw new Error('Application not found');
      }

      // Create completion record
      const completion: TaskCompletion = {
        id: `completion_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        task_id: application.task_id,
        application_id: applicationId,
        applicant_address: application.applicant_address,
        proof_urls: completionData.proof_urls,
        completion_message: completionData.completion_message,
        completed_at: new Date().toISOString(),
        verified: false
      };

      // Save completion to localStorage
      const completions = JSON.parse(localStorage.getItem('task_completions') || '[]');
      completions.push(completion);
      localStorage.setItem('task_completions', JSON.stringify(completions));

      // Update application status
      const updatedApplications = applications.map((app: TaskApplication) => 
        app.id === applicationId 
          ? { 
              ...app, 
              status: 'completed' as const,
              completed_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            }
          : app
      );
      localStorage.setItem('task_applications', JSON.stringify(updatedApplications));

      // Update task status
      const tasks = JSON.parse(localStorage.getItem('tasks') || '[]');
      const updatedTasks = tasks.map((task: Task) => 
        task.id === application.task_id 
          ? { ...task, status: 'completed' as const, updated_at: new Date().toISOString() }
          : task
      );
      localStorage.setItem('tasks', JSON.stringify(updatedTasks));

      toast.success('Task completed successfully!');
      return completion;
    } catch (error) {
      console.error('Failed to complete task in localStorage:', error);
      throw error;
    }
  }

  /**
   * Verify task completion
   */
  async verifyTaskCompletion(completionId: string, paymentData?: {
    payment_amount: string;
    payment_hash: string;
  }): Promise<void> {
    try {
      // Check if Supabase is properly configured
      if (!supabaseService.isConfigured()) {
        console.log('Supabase not configured, using localStorage fallback for verification');
        return this.verifyTaskCompletionLocal(completionId, paymentData);
      }

      const updateData: any = {
        verified: true,
        updated_at: new Date().toISOString()
      };

      if (paymentData) {
        updateData.payment_amount = paymentData.payment_amount;
        updateData.payment_hash = paymentData.payment_hash;
      }

      const { error } = await supabase
        .from('task_completions')
        .update(updateData)
        .eq('id', completionId);

      if (error) {
        throw new Error(error.message);
      }

      toast.success('Task completion verified!');
    } catch (error) {
      console.error('Failed to verify task completion:', error);
      console.log('Falling back to localStorage');
      return this.verifyTaskCompletionLocal(completionId, paymentData);
    }
  }

  /**
   * Verify task completion using localStorage fallback
   */
  private verifyTaskCompletionLocal(completionId: string, paymentData?: {
    payment_amount: string;
    payment_hash: string;
  }): void {
    try {
      const completions = JSON.parse(localStorage.getItem('task_completions') || '[]');
      const updatedCompletions = completions.map((comp: TaskCompletion) => 
        comp.id === completionId 
          ? { 
              ...comp, 
              verified: true, 
              payment_amount: paymentData?.payment_amount,
              payment_hash: paymentData?.payment_hash,
              updated_at: new Date().toISOString() 
            }
          : comp
      );
      localStorage.setItem('task_completions', JSON.stringify(updatedCompletions));
      toast.success('Task completion verified!');
    } catch (error) {
      console.error('Failed to verify task completion in localStorage:', error);
      throw error;
    }
  }

  /**
   * Get task completions
   */
  async getTaskCompletions(taskId: string): Promise<TaskCompletion[]> {
    try {
      // Check if Supabase is properly configured
      if (!supabaseService.isConfigured()) {
        console.log('Supabase not configured, using localStorage fallback for completions');
        return this.getTaskCompletionsLocal(taskId);
      }

      const { data, error } = await supabase
        .from('task_completions')
        .select('*')
        .eq('task_id', taskId)
        .order('completed_at', { ascending: false });

      if (error) {
        throw new Error(error.message);
      }

      return data || [];
    } catch (error) {
      console.error('Failed to fetch task completions:', error);
      console.log('Falling back to localStorage');
      return this.getTaskCompletionsLocal(taskId);
    }
  }

  /**
   * Get task completions using localStorage fallback
   */
  private getTaskCompletionsLocal(taskId: string): TaskCompletion[] {
    try {
      const completions = JSON.parse(localStorage.getItem('task_completions') || '[]');
      return completions.filter((comp: TaskCompletion) => comp.task_id === taskId);
    } catch (error) {
      console.error('Failed to get task completions from localStorage:', error);
      return [];
    }
  }

  /**
   * Reject task completion
   */
  async rejectTaskCompletion(completionId: string): Promise<void> {
    try {
      // Check if Supabase is properly configured
      if (!supabaseService.isConfigured()) {
        console.log('Supabase not configured, using localStorage fallback for rejection');
        return this.rejectTaskCompletionLocal(completionId);
      }

      const { error } = await supabase
        .from('task_completions')
        .update({ 
          verified: false,
          updated_at: new Date().toISOString()
        })
        .eq('id', completionId);

      if (error) {
        throw new Error(error.message);
      }

      toast.success('Task completion rejected');
    } catch (error) {
      console.error('Failed to reject task completion:', error);
      console.log('Falling back to localStorage');
      return this.rejectTaskCompletionLocal(completionId);
    }
  }

  /**
   * Reject task completion using localStorage fallback
   */
  private rejectTaskCompletionLocal(completionId: string): void {
    try {
      const completions = JSON.parse(localStorage.getItem('task_completions') || '[]');
      const updatedCompletions = completions.map((comp: TaskCompletion) => 
        comp.id === completionId 
          ? { ...comp, verified: false, updated_at: new Date().toISOString() }
          : comp
      );
      localStorage.setItem('task_completions', JSON.stringify(updatedCompletions));
      toast.success('Task completion rejected');
    } catch (error) {
      console.error('Failed to reject task completion in localStorage:', error);
      throw error;
    }
  }

  /**
   * Get task statistics
   */
  async getTaskStats(): Promise<{
    totalTasks: number;
    activeTasks: number;
    completedTasks: number;
    totalEarnings: number;
    totalUsers: number;
  }> {
    try {
      // Check if Supabase is properly configured
      if (!supabaseService.isConfigured()) {
        console.log('Supabase not configured, using localStorage fallback for stats');
        return this.getTaskStatsLocal();
      }

      const { data: tasks } = await supabase
        .from('tasks')
        .select('status');

      const { data: completions } = await supabase
        .from('task_completions')
        .select('payment_amount')
        .eq('verified', true);

      const { data: users } = await supabase
        .from('task_applications')
        .select('applicant_address')
        .not('applicant_address', 'is', null);

      const totalTasks = tasks?.length || 0;
      const activeTasks = tasks?.filter(t => t.status === 'open' || t.status === 'in_progress').length || 0;
      const completedTasks = tasks?.filter(t => t.status === 'completed').length || 0;
      
      const totalEarnings = completions?.reduce((sum, c) => {
        const amount = parseFloat(c.payment_amount || '0');
        return sum + amount;
      }, 0) || 0;

      const uniqueUsers = new Set(users?.map(u => u.applicant_address)).size;

      return {
        totalTasks,
        activeTasks,
        completedTasks,
        totalEarnings,
        totalUsers: uniqueUsers
      };
    } catch (error) {
      console.error('Failed to fetch task stats:', error);
      console.log('Falling back to localStorage');
      return this.getTaskStatsLocal();
    }
  }

  /**
   * Get task stats using localStorage fallback
   */
  private getTaskStatsLocal(): {
    totalTasks: number;
    activeTasks: number;
    completedTasks: number;
    totalEarnings: number;
    totalUsers: number;
  } {
    try {
      const tasks = JSON.parse(localStorage.getItem('tasks') || '[]');
      const applications = JSON.parse(localStorage.getItem('task_applications') || '[]');
      const completions = JSON.parse(localStorage.getItem('task_completions') || '[]');

      const totalTasks = tasks.length;
      const activeTasks = tasks.filter((t: Task) => t.status === 'open' || t.status === 'in_progress').length;
      const completedTasks = tasks.filter((t: Task) => t.status === 'completed').length;
      
      const totalEarnings = completions
        .filter((c: any) => c.verified)
        .reduce((sum: number, c: any) => {
          const amount = parseFloat(c.payment_amount || '0');
          return sum + amount;
        }, 0);

      const uniqueUsers = new Set(applications.map((a: any) => a.applicant_address)).size;

      return {
        totalTasks,
        activeTasks,
        completedTasks,
        totalEarnings,
        totalUsers: uniqueUsers
      };
    } catch (error) {
      console.error('Failed to get task stats from localStorage:', error);
      return {
        totalTasks: 0,
        activeTasks: 0,
        completedTasks: 0,
        totalEarnings: 0,
        totalUsers: 0
      };
    }
  }
}

export const taskService = TaskService.getInstance();
