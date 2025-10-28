'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  ArrowLeft, 
  CheckCircle, 
  XCircle, 
  Eye, 
  ExternalLink, 
  Download,
  Star,
  MessageSquare,
  DollarSign,
  Clock,
  User,
  AlertCircle,
  ThumbsUp,
  ThumbsDown
} from 'lucide-react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { Header } from '../../../components/Header';
import { WalletConnect } from '../../../components/WalletConnect';
import { useAppStore } from '../../../../lib/store';
import { taskService, Task, TaskCompletion } from '../../../../lib/task-service';
import { paymentService } from '../../../../lib/payment-service';
import toast from 'react-hot-toast';

export default function TaskVerificationPage() {
  const params = useParams();
  const taskId = params?.id as string;
  const { connectedWallet, currentUser } = useAppStore();
  const [task, setTask] = useState<Task | null>(null);
  const [completion, setCompletion] = useState<TaskCompletion | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isVerifying, setIsVerifying] = useState(false);
  const [rating, setRating] = useState(5);
  const [reviewMessage, setReviewMessage] = useState('');
  const [paymentAmount, setPaymentAmount] = useState('');

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
        
        // Load completion data
        const completions = await taskService.getTaskCompletions(taskId);
        const latestCompletion = completions.find(comp => !comp.verified);
        setCompletion(latestCompletion || null);
        
        // Set default payment amount
        if (latestCompletion && taskData.budget) {
          setPaymentAmount(taskData.budget);
        }
      }
    } catch (error) {
      console.error('Failed to load task details:', error);
      toast.error('Failed to load task details');
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyCompletion = async (approved: boolean) => {
    if (!completion) return;

    if (approved && !paymentAmount.trim()) {
      toast.error('Please enter the payment amount');
      return;
    }

    setIsVerifying(true);
    try {
      if (approved) {
        // Process real payment
        const paymentResult = await paymentService.processPayment({
          taskId: taskId,
          amount: paymentAmount.trim(),
          freelancerAddress: completion.applicant_address,
          clientAddress: connectedWallet!
        }, (currentUser?.wallet_type as 'phantom' | 'metamask' | 'solflare') || 'phantom');

        if (!paymentResult.success) {
          toast.error(`Payment failed: ${paymentResult.error}`);
          return;
        }

        // Verify completion with real payment data
        await taskService.verifyTaskCompletion(completion.id, {
          payment_amount: paymentAmount.trim(),
          payment_hash: paymentResult.transactionHash!
        });

        // Update user stats
        if (completion.applicant_address) {
          const { userService } = await import('../../../../lib/user-service');
          await userService.updateUserStats(completion.applicant_address, {
            tasksCompleted: 1,
            earnings: parseFloat(paymentAmount),
            rating: rating
          });
        }

        toast.success('Task completion verified and payment processed!');
      } else {
        // Reject completion
        await taskService.rejectTaskCompletion(completion.id);
        toast.success('Task completion rejected');
      }

      // Redirect to task page
      window.location.href = `/task/${taskId}`;
    } catch (error) {
      console.error('Failed to verify completion:', error);
      toast.error('Failed to verify completion');
    } finally {
      setIsVerifying(false);
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

  const openProofUrl = (url: string) => {
    window.open(url, '_blank');
  };

  if (isLoading) {
    return (
      <div className="min-h-screen">
        <Header />
        <main className="pt-20 pb-12 px-4">
          <div className="container mx-auto max-w-4xl">
            <div className="glass-panel p-8 text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-400 mx-auto"></div>
              <p className="text-gray-300 mt-4">Loading completion details...</p>
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
              <p className="text-gray-300 mb-6">The task you're looking for doesn't exist.</p>
              <Link href="/tasks" className="btn-primary">
                Browse Tasks
              </Link>
            </div>
          </div>
        </main>
      </div>
    );
  }

  if (!connectedWallet) {
    return (
      <div className="min-h-screen">
        <Header />
        <main className="pt-20 pb-12 px-4">
          <div className="container mx-auto max-w-4xl">
            <div className="glass-panel p-8 text-center">
              <User className="w-16 h-16 text-purple-400 mx-auto mb-4" />
              <h1 className="text-2xl font-bold text-white mb-4">Connect Your Wallet</h1>
              <p className="text-gray-300 mb-6">Connect your wallet to verify task completions</p>
              <WalletConnect />
            </div>
          </div>
        </main>
      </div>
    );
  }

  if (task.client_address !== connectedWallet) {
    return (
      <div className="min-h-screen">
        <Header />
        <main className="pt-20 pb-12 px-4">
          <div className="container mx-auto max-w-4xl">
            <div className="glass-panel p-8 text-center">
              <AlertCircle className="w-16 h-16 text-yellow-400 mx-auto mb-4" />
              <h1 className="text-2xl font-bold text-white mb-4">Access Denied</h1>
              <p className="text-gray-300 mb-6">
                Only the task creator can verify completions.
              </p>
              <Link href={`/task/${taskId}`} className="btn-primary">
                View Task
              </Link>
            </div>
          </div>
        </main>
      </div>
    );
  }

  if (!completion) {
    return (
      <div className="min-h-screen">
        <Header />
        <main className="pt-20 pb-12 px-4">
          <div className="container mx-auto max-w-4xl">
            <div className="glass-panel p-8 text-center">
              <AlertCircle className="w-16 h-16 text-blue-400 mx-auto mb-4" />
              <h1 className="text-2xl font-bold text-white mb-4">No Completion to Verify</h1>
              <p className="text-gray-300 mb-6">
                There are no pending completions for this task.
              </p>
              <Link href={`/task/${taskId}`} className="btn-primary">
                View Task
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
        <div className="container mx-auto max-w-4xl">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8"
          >
            <Link 
              href={`/task/${taskId}`}
              className="inline-flex items-center gap-2 text-gray-400 hover:text-white transition-colors mb-4"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Task
            </Link>
            
            <h1 className="text-3xl font-bold text-white mb-2">Verify Task Completion</h1>
            <p className="text-gray-300">Review the submitted work and verify completion</p>
          </motion.div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Task Details */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 }}
              className="lg:col-span-1"
            >
              <div className="glass-panel p-6 sticky top-24">
                <h3 className="text-lg font-semibold text-white mb-4">Task Details</h3>
                
                <div className="space-y-4">
                  <div>
                    <h4 className="font-semibold text-white mb-2">{task.title}</h4>
                    <p className="text-gray-300 text-sm line-clamp-3">{task.description}</p>
                  </div>

                  <div className="flex items-center gap-2 text-sm">
                    <DollarSign className="w-4 h-4 text-green-400" />
                    <span className="text-white font-semibold">{task.budget}</span>
                  </div>

                  <div className="flex items-center gap-2 text-sm">
                    <Clock className="w-4 h-4 text-blue-400" />
                    <span className="text-gray-300">{task.duration}</span>
                  </div>

                  <div className="flex items-center gap-2 text-sm">
                    <User className="w-4 h-4 text-purple-400" />
                    <span className="text-gray-300">{task.client_name}</span>
                  </div>

                  <div className="pt-4 border-t border-gray-700">
                    <p className="text-sm text-gray-400 mb-2">Completed by:</p>
                    <p className="text-sm text-white font-mono">
                      {completion.applicant_address.slice(0, 6)}...{completion.applicant_address.slice(-4)}
                    </p>
                    <p className="text-xs text-gray-500">
                      {formatDate(completion.completed_at)}
                    </p>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Completion Review */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
              className="lg:col-span-2"
            >
              <div className="space-y-6">
                {/* Completion Message */}
                <div className="glass-panel p-6">
                  <h3 className="text-lg font-semibold text-white mb-4">Completion Message</h3>
                  <div className="bg-gray-800/50 p-4 rounded-lg">
                    <p className="text-gray-300 whitespace-pre-wrap">{completion.completion_message}</p>
                  </div>
                </div>

                {/* Proof of Work */}
                <div className="glass-panel p-6">
                  <h3 className="text-lg font-semibold text-white mb-4">Proof of Work</h3>
                  
                  {completion.proof_urls.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {completion.proof_urls.map((url, index) => (
                        <div key={index} className="bg-gray-800/50 p-4 rounded-lg">
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-sm text-gray-400">Proof #{index + 1}</span>
                            <button
                              onClick={() => openProofUrl(url)}
                              className="text-blue-400 hover:text-blue-300 transition-colors"
                            >
                              <ExternalLink className="w-4 h-4" />
                            </button>
                          </div>
                          <p className="text-sm text-white font-mono truncate">{url}</p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-gray-400 text-center py-8">No proof files provided</p>
                  )}
                </div>

                {/* Verification Form */}
                <div className="glass-panel p-6">
                  <h3 className="text-lg font-semibold text-white mb-4">Verification</h3>

                  {/* Rating */}
                  <div className="mb-6">
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Rating (1-5 stars)
                    </label>
                    <div className="flex items-center gap-1">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <button
                          key={star}
                          type="button"
                          onClick={() => setRating(star)}
                          className={`p-1 ${
                            star <= rating ? 'text-yellow-400' : 'text-gray-600'
                          } hover:text-yellow-400 transition-colors`}
                        >
                          <Star className="w-6 h-6 fill-current" />
                        </button>
                      ))}
                      <span className="ml-2 text-sm text-gray-400">{rating}/5</span>
                    </div>
                  </div>

                  {/* Review Message */}
                  <div className="mb-6">
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Review Message (Optional)
                    </label>
                    <textarea
                      value={reviewMessage}
                      onChange={(e) => setReviewMessage(e.target.value)}
                      placeholder="Add a review or feedback for the freelancer..."
                      className="cyber-input w-full h-24 resize-none"
                    />
                  </div>

                  {/* Payment Amount */}
                  <div className="mb-6">
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Payment Amount *
                    </label>
                    <input
                      type="text"
                      value={paymentAmount}
                      onChange={(e) => setPaymentAmount(e.target.value)}
                      placeholder="Enter payment amount"
                      className="cyber-input w-full"
                      required
                    />
                  </div>

                  {/* Action Buttons */}
                  <div className="flex gap-4">
                    <button
                      onClick={() => handleVerifyCompletion(true)}
                      disabled={isVerifying || !paymentAmount.trim()}
                      className="btn-primary flex-1 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isVerifying ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                          Verifying...
                        </>
                      ) : (
                        <>
                          <CheckCircle className="w-4 h-4" />
                          Approve & Pay
                        </>
                      )}
                    </button>

                    <button
                      onClick={() => handleVerifyCompletion(false)}
                      disabled={isVerifying}
                      className="btn-secondary flex-1 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <XCircle className="w-4 h-4" />
                      Reject
                    </button>
                  </div>

                  <p className="text-xs text-gray-500 mt-4 text-center">
                    Once verified, the payment will be processed and the freelancer will be notified.
                  </p>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </main>
    </div>
  );
}
