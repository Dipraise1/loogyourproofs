'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  ArrowLeft, 
  Upload, 
  Link as LinkIcon, 
  FileText, 
  Image, 
  Video, 
  CheckCircle, 
  AlertCircle,
  Send,
  X,
  Plus,
  DollarSign,
  Clock,
  User
} from 'lucide-react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { Header } from '../../../components/Header';
import { WalletConnect } from '../../../components/WalletConnect';
import { useAppStore } from '../../../../lib/store';
import { taskService, Task, TaskApplication } from '../../../../lib/task-service';
import { fileUploadService } from '../../../../lib/file-upload-service';
import toast from 'react-hot-toast';

interface ProofFile {
  id: string;
  name: string;
  type: 'image' | 'document' | 'video' | 'link';
  url?: string;
  file?: File;
  size?: number;
}

export default function TaskCompletionPage() {
  const params = useParams();
  const taskId = params?.id as string;
  const { connectedWallet, currentUser } = useAppStore();
  const [task, setTask] = useState<Task | null>(null);
  const [application, setApplication] = useState<TaskApplication | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [completionMessage, setCompletionMessage] = useState('');
  const [proofFiles, setProofFiles] = useState<ProofFile[]>([]);
  const [newLink, setNewLink] = useState('');

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
        
        // Find user's application
        const applications = await taskService.getTaskApplications(taskId);
        const userApplication = applications.find(app => 
          app.applicant_address === connectedWallet && 
          app.status === 'accepted'
        );
        setApplication(userApplication || null);
      }
    } catch (error) {
      console.error('Failed to load task details:', error);
      toast.error('Failed to load task details');
    } finally {
      setIsLoading(false);
    }
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files) return;

    Array.from(files).forEach(file => {
      const fileType = file.type.startsWith('image/') ? 'image' : 
                     file.type.startsWith('video/') ? 'video' : 'document';
      
      const proofFile: ProofFile = {
        id: `file_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        name: file.name,
        type: fileType,
        file: file,
        size: file.size
      };

      setProofFiles(prev => [...prev, proofFile]);
    });
  };

  const addLink = () => {
    if (newLink.trim()) {
      const linkFile: ProofFile = {
        id: `link_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        name: newLink.trim(),
        type: 'link',
        url: newLink.trim()
      };

      setProofFiles(prev => [...prev, linkFile]);
      setNewLink('');
    }
  };

  const removeProofFile = (id: string) => {
    setProofFiles(prev => prev.filter(file => file.id !== id));
  };

  const handleSubmitCompletion = async () => {
    if (!application || !completionMessage.trim()) {
      toast.error('Please provide a completion message');
      return;
    }

    if (proofFiles.length === 0) {
      toast.error('Please provide at least one proof of work');
      return;
    }

    setIsSubmitting(true);
    try {
      // Upload files to Supabase Storage
      const fileUploadPromises = proofFiles
        .filter(file => file.type !== 'link' && file.file)
        .map(file => fileUploadService.uploadFile(file.file!, `task-${taskId}`));

      const uploadResults = await Promise.all(fileUploadPromises);
      
      // Check for upload failures
      const failedUploads = uploadResults.filter(result => !result.success);
      if (failedUploads.length > 0) {
        toast.error(`Failed to upload ${failedUploads.length} file(s)`);
        return;
      }

      // Collect all proof URLs (uploaded files + links)
      const proofUrls: string[] = [];
      
      // Add uploaded file URLs
      uploadResults.forEach(result => {
        if (result.success && result.url) {
          proofUrls.push(result.url);
        }
      });

      // Add link URLs
      proofFiles
        .filter(file => file.type === 'link' && file.url)
        .forEach(file => {
          if (file.url) {
            proofUrls.push(file.url);
          }
        });

      // Submit completion with real proof URLs
      await taskService.completeTask(application.id, {
        proof_urls: proofUrls,
        completion_message: completionMessage.trim()
      });

      toast.success('Task completion submitted successfully!');
      
      // Redirect to task page
      window.location.href = `/task/${taskId}`;
    } catch (error) {
      console.error('Failed to submit completion:', error);
      toast.error('Failed to submit completion');
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getFileIcon = (type: string) => {
    switch (type) {
      case 'image': return <Image className="w-4 h-4" />;
      case 'video': return <Video className="w-4 h-4" />;
      case 'document': return <FileText className="w-4 h-4" />;
      case 'link': return <LinkIcon className="w-4 h-4" />;
      default: return <FileText className="w-4 h-4" />;
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen">
        <Header />
        <main className="pt-20 pb-12 px-4">
          <div className="container mx-auto max-w-4xl">
            <div className="glass-panel p-8 text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-400 mx-auto"></div>
              <p className="text-gray-300 mt-4">Loading task details...</p>
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
              <p className="text-gray-300 mb-6">Connect your wallet to complete tasks</p>
              <WalletConnect />
            </div>
          </div>
        </main>
      </div>
    );
  }

  if (!application) {
    return (
      <div className="min-h-screen">
        <Header />
        <main className="pt-20 pb-12 px-4">
          <div className="container mx-auto max-w-4xl">
            <div className="glass-panel p-8 text-center">
              <AlertCircle className="w-16 h-16 text-yellow-400 mx-auto mb-4" />
              <h1 className="text-2xl font-bold text-white mb-4">No Accepted Application</h1>
              <p className="text-gray-300 mb-6">
                You need to have an accepted application to complete this task.
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
            
            <h1 className="text-3xl font-bold text-white mb-2">Complete Task</h1>
            <p className="text-gray-300">Submit your proof of work to complete this task</p>
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

                  {task.tags.length > 0 && (
                    <div>
                      <p className="text-sm text-gray-400 mb-2">Tags:</p>
                      <div className="flex flex-wrap gap-1">
                        {task.tags.map((tag, index) => (
                          <span key={index} className="px-2 py-1 bg-purple-900/30 text-purple-300 text-xs rounded">
                            {tag}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>

            {/* Completion Form */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
              className="lg:col-span-2"
            >
              <div className="glass-panel p-6">
                <h3 className="text-lg font-semibold text-white mb-6">Submit Completion</h3>

                {/* Completion Message */}
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Completion Message *
                  </label>
                  <textarea
                    value={completionMessage}
                    onChange={(e) => setCompletionMessage(e.target.value)}
                    placeholder="Describe what you've completed and provide any additional details..."
                    className="cyber-input w-full h-32 resize-none"
                    required
                  />
                </div>

                {/* Proof of Work */}
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Proof of Work *
                  </label>
                  
                  {/* File Upload */}
                  <div className="mb-4">
                    <label className="flex items-center justify-center w-full h-32 border-2 border-dashed border-gray-600 rounded-lg cursor-pointer hover:border-purple-400 transition-colors">
                      <div className="text-center">
                        <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                        <p className="text-sm text-gray-300">Upload files or drag and drop</p>
                        <p className="text-xs text-gray-500">Images, videos, documents</p>
                      </div>
                      <input
                        type="file"
                        multiple
                        accept="image/*,video/*,.pdf,.doc,.docx,.txt"
                        onChange={handleFileUpload}
                        className="hidden"
                      />
                    </label>
                  </div>

                  {/* Link Input */}
                  <div className="flex gap-2 mb-4">
                    <input
                      type="url"
                      value={newLink}
                      onChange={(e) => setNewLink(e.target.value)}
                      placeholder="Add a link (GitHub, demo, etc.)"
                      className="cyber-input flex-1"
                    />
                    <button
                      type="button"
                      onClick={addLink}
                      className="btn-secondary px-4"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Proof Files List */}
                  {proofFiles.length > 0 && (
                    <div className="space-y-2">
                      {proofFiles.map((file) => (
                        <div key={file.id} className="flex items-center justify-between p-3 bg-gray-800/50 rounded-lg">
                          <div className="flex items-center gap-3">
                            {getFileIcon(file.type)}
                            <div>
                              <p className="text-white text-sm">{file.name}</p>
                              {file.size && (
                                <p className="text-gray-400 text-xs">{formatFileSize(file.size)}</p>
                              )}
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={() => removeProofFile(file.id)}
                            className="text-red-400 hover:text-red-300 transition-colors"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Submit Button */}
                <button
                  onClick={handleSubmitCompletion}
                  disabled={isSubmitting || !completionMessage.trim() || proofFiles.length === 0}
                  className="btn-primary w-full flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      Submitting...
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4" />
                      Submit Completion
                    </>
                  )}
                </button>

                <p className="text-xs text-gray-500 mt-4 text-center">
                  Once submitted, the task creator will review your work and verify completion.
                </p>
              </div>
            </motion.div>
          </div>
        </div>
      </main>
    </div>
  );
}
