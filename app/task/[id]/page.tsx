'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  ArrowLeft, 
  DollarSign, 
  Clock, 
  MapPin, 
  User, 
  Star, 
  Tag, 
  CheckCircle, 
  AlertCircle,
  Calendar,
  Users,
  ExternalLink,
  MessageSquare,
  Send,
  Eye,
  Award
} from 'lucide-react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { Header } from '../../components/Header';
import { WalletConnect } from '../../components/WalletConnect';
import { useAppStore } from '../../../lib/store';
import { taskService, Task, TaskApplication } from '../../../lib/task-service';
import toast from 'react-hot-toast';

export default function TaskDetailPage() {
  const params = useParams();
  const taskId = params?.id as string;
  const { connectedWallet, currentUser } = useAppStore();
  const [task, setTask] = useState<Task | null>(null);
  const [applications, setApplications] = useState<TaskApplication[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isApplying, setIsApplying] = useState(false);
  const [applicationMessage, setApplicationMessage] = useState('');
  const [showApplications, setShowApplications] = useState(false);

  useEffect(() => {
    if (taskId) {
      loadTaskDetails();
    }
  }, [taskId]);

  const loadTaskDetails = async () => {
    try {
      setIsLoading(true);
      const taskData = await taskService.getTaskById(taskId);
      if (taskData) {
        setTask(taskData);
        
        // Load applications if user is the task creator
        if (connectedWallet && taskData.client_address === connectedWallet) {
          const apps = await taskService.getTaskApplications(taskId);
          setApplications(apps);
        }
      }
    } catch (error) {
      console.error('Failed to load task details:', error);
      toast.error('Failed to load task details');
    } finally {
      setIsLoading(false);
    }
  };

  const handleApply = async () => {
    if (!connectedWallet) {
      toast.error('Please connect your wallet first');
      return;
    }

    if (!applicationMessage.trim()) {
      toast.error('Please enter an application message');
      return;
    }

    setIsApplying(true);
    try {
      await taskService.applyToTask(taskId, {
        applicant_address: connectedWallet,
        applicant_name: currentUser?.name,
        message: applicationMessage.trim()
      });

      toast.success('Application submitted successfully!');
      setApplicationMessage('');
      loadTaskDetails(); // Refresh to update applicant count
    } catch (error) {
      console.error('Failed to apply to task:', error);
      toast.error('Failed to submit application');
    } finally {
      setIsApplying(false);
    }
  };

  const handleAcceptApplication = async (applicationId: string) => {
    try {
      await taskService.acceptApplication(applicationId);
      toast.success('Application accepted!');
      loadTaskDetails();
    } catch (error) {
      console.error('Failed to accept application:', error);
      toast.error('Failed to accept application');
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const isTaskCreator = connectedWallet && task?.client_address === connectedWallet;
  const hasApplied = applications.some(app => app.applicant_address === connectedWallet);
  const hasAcceptedApplication = applications.some(app => 
    app.applicant_address === connectedWallet && app.status === 'accepted'
  );

  if (isLoading) {
    return (
      <div className="min-h-screen">
        <Header />
        <main className="pt-20 pb-12 px-4">
          <div className="container mx-auto max-w-4xl">
            <div className="text-center py-12">
              <div className="spinner mx-auto mb-4"></div>
              <p className="text-gray-400">Loading task details...</p>
            </div>
          </div>
        </main>
      </div>
    );
  }

  if (!task) {
    return (
      <div className="min-h-screen">
        <Header />
        <main className="pt-20 pb-12 px-4">
          <div className="container mx-auto max-w-4xl">
            <div className="glass-panel p-8 text-center">
              <AlertCircle className="w-16 h-16 text-red-400 mx-auto mb-4" />
              <h1 className="text-2xl font-bold text-white mb-4">Task Not Found</h1>
              <p className="text-gray-300 mb-6">
                The task you're looking for doesn't exist or has been removed.
              </p>
              <Link href="/tasks" className="neon-button-primary inline-flex items-center gap-2">
                <ArrowLeft className="w-4 h-4" />
                Back to Tasks
              </Link>
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
          {/* Back Button */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="mb-6"
          >
            <Link href="/tasks" className="neon-button inline-flex items-center gap-2">
              <ArrowLeft className="w-4 h-4" />
              Back to Tasks
            </Link>
          </motion.div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Main Content */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="lg:col-span-2 space-y-6"
            >
              {/* Task Header */}
              <div className="glass-panel p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      {task.featured && (
                        <span className="px-2 py-1 bg-purple-500 text-white text-xs rounded-full">
                          Featured
                        </span>
                      )}
                      {task.urgent && (
                        <span className="px-2 py-1 bg-red-500 text-white text-xs rounded-full">
                          Urgent
                        </span>
                      )}
                      <span className={`px-2 py-1 text-xs rounded-full ${
                        task.status === 'open' ? 'bg-green-500 text-white' :
                        task.status === 'in_progress' ? 'bg-yellow-500 text-white' :
                        task.status === 'completed' ? 'bg-blue-500 text-white' :
                        'bg-gray-500 text-white'
                      }`}>
                        {task.status.replace('_', ' ').toUpperCase()}
                      </span>
                    </div>
                    <h1 className="text-2xl font-bold text-white mb-2">{task.title}</h1>
                    <p className="text-gray-300">{task.description}</p>
                  </div>
                </div>

                {/* Task Details */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                  <div className="flex items-center gap-2">
                    <DollarSign className="w-4 h-4 text-green-400" />
                    <div>
                      <div className="text-sm text-gray-400">Budget</div>
                      <div className="text-white font-semibold">{task.budget}</div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-blue-400" />
                    <div>
                      <div className="text-sm text-gray-400">Duration</div>
                      <div className="text-white font-semibold">{task.duration}</div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-purple-400" />
                    <div>
                      <div className="text-sm text-gray-400">Location</div>
                      <div className="text-white font-semibold">{task.location}</div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Users className="w-4 h-4 text-yellow-400" />
                    <div>
                      <div className="text-sm text-gray-400">Applicants</div>
                      <div className="text-white font-semibold">{task.applicants_count}</div>
                    </div>
                  </div>
                </div>

                {/* Tags */}
                {task.tags.length > 0 && (
                  <div className="mb-6">
                    <h3 className="text-sm font-medium text-gray-300 mb-2">Tags</h3>
                    <div className="flex flex-wrap gap-2">
                      {task.tags.map((tag, index) => (
                        <span
                          key={index}
                          className="px-3 py-1 bg-purple-500/20 text-purple-300 text-sm rounded-full border border-purple-400/30"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Requirements */}
                {task.requirements.length > 0 && (
                  <div className="mb-6">
                    <h3 className="text-sm font-medium text-gray-300 mb-2">Requirements</h3>
                    <div className="space-y-2">
                      {task.requirements.map((requirement, index) => (
                        <div key={index} className="flex items-center gap-2">
                          <CheckCircle className="w-4 h-4 text-green-400 flex-shrink-0" />
                          <span className="text-gray-300 text-sm">{requirement}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Client Info */}
                <div className="border-t border-gray-600/30 pt-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-blue-500 rounded-lg flex items-center justify-center text-white font-bold">
                      {task.client_name ? task.client_name.charAt(0).toUpperCase() : 'A'}
                    </div>
                    <div>
                      <div className="text-white font-semibold">{task.client_name || 'Anonymous'}</div>
                      <div className="text-sm text-gray-400">
                        Posted {formatDate(task.posted_at)}
                      </div>
                    </div>
                    {task.rating && task.rating > 0 && (
                      <div className="flex items-center gap-1 ml-auto">
                        <Star className="w-4 h-4 text-yellow-400 fill-current" />
                        <span className="text-yellow-400 text-sm">{task.rating}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Applications Section (for task creators) */}
              {isTaskCreator && applications.length > 0 && (
                <div className="glass-panel p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-white">Applications ({applications.length})</h3>
                    <button
                      onClick={() => setShowApplications(!showApplications)}
                      className="neon-button text-sm px-3 py-1"
                    >
                      {showApplications ? 'Hide' : 'Show'} Applications
                    </button>
                  </div>

                  {showApplications && (
                    <div className="space-y-4">
                      {applications.map((application) => (
                        <div key={application.id} className="border border-gray-600/30 rounded-lg p-4">
                          <div className="flex items-start justify-between mb-3">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-blue-500 rounded-lg flex items-center justify-center text-white font-bold text-sm">
                                {application.applicant_name ? application.applicant_name.charAt(0).toUpperCase() : 'A'}
                              </div>
                              <div>
                                <div className="text-white font-semibold">
                                  {application.applicant_name || 'Anonymous'}
                                </div>
                                <div className="text-sm text-gray-400">
                                  {application.applicant_address.slice(0, 6)}...{application.applicant_address.slice(-4)}
                                </div>
                              </div>
                            </div>
                            <span className={`px-2 py-1 text-xs rounded-full ${
                              application.status === 'pending' ? 'bg-yellow-500 text-white' :
                              application.status === 'accepted' ? 'bg-green-500 text-white' :
                              application.status === 'rejected' ? 'bg-red-500 text-white' :
                              'bg-blue-500 text-white'
                            }`}>
                              {application.status.toUpperCase()}
                            </span>
                          </div>
                          
                          <p className="text-gray-300 text-sm mb-3">{application.message}</p>
                          
                          <div className="text-xs text-gray-400 mb-3">
                            Applied {formatDate(application.applied_at)}
                          </div>

                          {application.status === 'pending' && (
                            <div className="flex gap-2">
                              <button
                                onClick={() => handleAcceptApplication(application.id)}
                                className="neon-button-primary text-sm px-3 py-1"
                              >
                                Accept
                              </button>
                              <button className="neon-button text-sm px-3 py-1">
                                Reject
                              </button>
                            </div>
                          )}

                          {application.status === 'accepted' && (
                            <div className="flex gap-2">
                              <Link
                                href={`/task/${taskId}/verify`}
                                className="neon-button-primary text-sm px-3 py-1 inline-flex items-center gap-1"
                              >
                                <Eye className="w-3 h-3" />
                                Verify Completion
                              </Link>
                            </div>
                          )}

                          {application.status === 'completed' && (
                            <div className="flex gap-2">
                              <Link
                                href={`/task/${taskId}/verify`}
                                className="neon-button-primary text-sm px-3 py-1 inline-flex items-center gap-1"
                              >
                                <CheckCircle className="w-3 h-3" />
                                Review Completion
                              </Link>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </motion.div>

            {/* Sidebar */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
              className="space-y-6"
            >
              {/* Apply Section */}
              {!isTaskCreator && task.status === 'open' && (
                <div className="glass-panel p-6">
                  <h3 className="text-lg font-semibold text-white mb-4">Apply to Task</h3>
                  
                  {!connectedWallet ? (
                    <div className="text-center">
                      <WalletConnect />
                    </div>
                  ) : hasAcceptedApplication ? (
                    <div className="text-center">
                      <CheckCircle className="w-12 h-12 text-green-400 mx-auto mb-3" />
                      <p className="text-green-400 font-semibold">Application Accepted!</p>
                      <p className="text-gray-400 text-sm mt-1 mb-4">
                        You can now complete this task
                      </p>
                      <Link
                        href={`/task/${taskId}/complete`}
                        className="w-full neon-button-primary inline-flex items-center justify-center gap-2 py-3"
                      >
                        <CheckCircle className="w-4 h-4" />
                        Complete Task
                      </Link>
                    </div>
                  ) : hasApplied ? (
                    <div className="text-center">
                      <CheckCircle className="w-12 h-12 text-green-400 mx-auto mb-3" />
                      <p className="text-green-400 font-semibold">Application Submitted</p>
                      <p className="text-gray-400 text-sm mt-1">
                        You have already applied to this task
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">
                          Application Message
                        </label>
                        <textarea
                          value={applicationMessage}
                          onChange={(e) => setApplicationMessage(e.target.value)}
                          className="cyber-input w-full h-24 resize-none"
                          placeholder="Tell the client why you're the right person for this task..."
                        />
                      </div>
                      
                      <button
                        onClick={handleApply}
                        disabled={isApplying || !applicationMessage.trim()}
                        className="w-full neon-button-primary inline-flex items-center justify-center gap-2 py-3"
                      >
                        <Send className="w-4 h-4" />
                        {isApplying ? 'Submitting...' : 'Submit Application'}
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* Task Stats */}
              <div className="glass-panel p-6">
                <h3 className="text-lg font-semibold text-white mb-4">Task Statistics</h3>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-300 text-sm">Platform</span>
                    <span className="text-white font-semibold capitalize">{task.platform}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-300 text-sm">Payment Method</span>
                    <span className="text-white font-semibold capitalize">{task.payment_method}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-300 text-sm">Status</span>
                    <span className={`font-semibold ${
                      task.status === 'open' ? 'text-green-400' :
                      task.status === 'in_progress' ? 'text-yellow-400' :
                      task.status === 'completed' ? 'text-blue-400' :
                      'text-gray-400'
                    }`}>
                      {task.status.replace('_', ' ').toUpperCase()}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-300 text-sm">Created</span>
                    <span className="text-white font-semibold">{formatDate(task.created_at)}</span>
                  </div>
                </div>
              </div>

              {/* Quick Actions */}
              <div className="glass-panel p-6">
                <h3 className="text-lg font-semibold text-white mb-4">Quick Actions</h3>
                <div className="space-y-3">
                  <button className="w-full neon-button text-center py-2 px-4 rounded-lg">
                    <Eye className="w-4 h-4 mr-2" />
                    View Similar Tasks
                  </button>
                  <button className="w-full neon-button text-center py-2 px-4 rounded-lg">
                    <Award className="w-4 h-4 mr-2" />
                    Browse All Tasks
                  </button>
                  <Link href="/profile" className="w-full neon-button text-center py-2 px-4 rounded-lg block">
                    <User className="w-4 h-4 mr-2" />
                    My Profile
                  </Link>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </main>
    </div>
  );
}
