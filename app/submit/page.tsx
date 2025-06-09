'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Upload, 
  Image as ImageIcon, 
  FileText, 
  Link as LinkIcon,
  Github,
  X,
  Check,
  AlertCircle,
  Loader2,
  Plus,
  Trash2,
  Eye,
  Paperclip,
  ExternalLink
} from 'lucide-react';
import Link from 'next/link';
import { useWallet } from '@solana/wallet-adapter-react';
import { Header } from '../components/Header';
import { WalletConnect } from '../components/WalletConnect';
import { proofService } from '../../lib/proof-service';
import { useAppStore } from '../../lib/store';
import toast from 'react-hot-toast';

interface Attachment {
  id: string;
  type: 'image' | 'document' | 'link';
  name: string;
  file?: File;
  url?: string;
  size?: number;
  preview?: string;
}

interface FormData {
  title: string;
  description: string;
  type: 'project' | 'design' | 'audit' | 'consultation' | 'other';
  tags: string[];
  attachments: Attachment[];
  githubRepo?: string;
  liveDemo?: string;
  clientAddress?: string;
}

export default function SubmitPage() {
  const { publicKey, signMessage } = useWallet();
  const { connectedWallet, isLoading } = useAppStore();
  
  const [formData, setFormData] = useState<FormData>({
    title: '',
    description: '',
    type: 'project',
    tags: [],
    attachments: [],
    githubRepo: '',
    liveDemo: '',
    clientAddress: ''
  });
  
  const [currentTag, setCurrentTag] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [linkInput, setLinkInput] = useState('');
  const pasteAreaRef = useRef<HTMLDivElement>(null);

  const workTypes = [
    { value: 'project', label: 'Development Project', icon: FileText },
    { value: 'design', label: 'Design Work', icon: ImageIcon },
    { value: 'audit', label: 'Security Audit', icon: AlertCircle },
    { value: 'consultation', label: 'Consultation', icon: Eye },
    { value: 'other', label: 'Other', icon: Plus }
  ];

  // Handle paste functionality
  useEffect(() => {
    const handlePaste = async (e: ClipboardEvent) => {
      const items = e.clipboardData?.items;
      if (!items) return;

      for (let i = 0; i < items.length; i++) {
        const item = items[i];
        
        // Handle images
        if (item.type.indexOf('image') !== -1) {
          const file = item.getAsFile();
          if (file) {
            handleFiles([file]);
            toast.success('Image pasted successfully!');
          }
        }
        
        // Handle text (URLs and general text)
        if (item.type === 'text/plain') {
          item.getAsString((text) => {
            const trimmedText = text.trim();
            if (isValidUrl(trimmedText)) {
              addLinkAttachment(trimmedText);
              toast.success('Link pasted successfully!');
            } else if (trimmedText.length > 0) {
              // Handle pasted text in description or title
              const focusedElement = document.activeElement as HTMLElement;
              if (focusedElement?.tagName === 'TEXTAREA' || focusedElement?.tagName === 'INPUT') {
                // Let the browser handle normal text pasting
                return;
              }
              // If no input is focused, add as description
              if (!formData.description.trim()) {
                handleInputChange('description', trimmedText);
                toast.success('Text pasted to description!');
              }
            }
          });
        }
        
        // Handle files
        if (item.kind === 'file' && item.type.includes('pdf')) {
          const file = item.getAsFile();
          if (file) {
            handleFiles([file]);
            toast.success('PDF pasted successfully!');
          }
        }
      }
    };

    // Also handle keyboard shortcuts
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'v' && !e.target) {
        // Prevent default paste behavior when not in an input
        e.preventDefault();
      }
    };

    document.addEventListener('paste', handlePaste);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('paste', handlePaste);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [formData.description]);

  const isValidUrl = (string: string) => {
    try {
      new URL(string);
      return true;
    } catch (_) {
      return false;
    }
  };

  const handleInputChange = (field: keyof FormData, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleAddTag = () => {
    const trimmedTag = currentTag.trim();
    if (trimmedTag && !formData.tags.includes(trimmedTag)) {
      handleInputChange('tags', [...formData.tags, trimmedTag]);
      setCurrentTag('');
      toast.success(`Tag "${trimmedTag}" added successfully!`);
    } else if (!trimmedTag) {
      toast.error('Please enter a tag');
    } else {
      toast.error('Tag already exists');
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    handleInputChange('tags', formData.tags.filter(tag => tag !== tagToRemove));
  };

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFiles(Array.from(e.dataTransfer.files));
    }
  }, []);

  const handleFiles = (files: File[]) => {
    const newAttachments: Attachment[] = files.map(file => {
      const isImage = file.type.startsWith('image/');
      const attachment: Attachment = {
        id: Math.random().toString(36).substr(2, 9),
        type: isImage ? 'image' : 'document',
        name: file.name,
        file,
        size: file.size
      };

      // Create preview for images
      if (isImage) {
        const reader = new FileReader();
        reader.onload = (e) => {
          const index = formData.attachments.findIndex(att => att.id === attachment.id);
          if (index !== -1) {
            const updatedAttachments = [...formData.attachments];
            updatedAttachments[index].preview = e.target?.result as string;
            handleInputChange('attachments', updatedAttachments);
          }
        };
        reader.readAsDataURL(file);
      }

      return attachment;
    });

    handleInputChange('attachments', [...formData.attachments, ...newAttachments]);
  };

  const addLinkAttachment = (url: string) => {
    const newAttachment: Attachment = {
      id: Math.random().toString(36).substr(2, 9),
      type: 'link',
      name: new URL(url).hostname || 'Link',
      url
    };
    handleInputChange('attachments', [...formData.attachments, newAttachment]);
  };

  const handleAddLink = () => {
    if (linkInput.trim() && isValidUrl(linkInput.trim())) {
      addLinkAttachment(linkInput.trim());
      setLinkInput('');
    } else {
      toast.error('Please enter a valid URL');
    }
  };

  const handleRemoveAttachment = (id: string) => {
    handleInputChange('attachments', formData.attachments.filter(att => att.id !== id));
  };

  const validateForm = (): boolean => {
    if (!connectedWallet) {
      toast.error('Please connect your wallet first');
      return false;
    }
    if (!formData.title.trim()) {
      toast.error('Please enter a title');
      return false;
    }
    if (!formData.description.trim()) {
      toast.error('Please enter a description');
      return false;
    }
    console.log('Current tags:', formData.tags, 'Length:', formData.tags.length);
    if (formData.tags.length === 0) {
      toast.error('Please add at least one tag');
      return false;
    }
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    if (!connectedWallet) {
      toast.error('Please connect your wallet first');
      return;
    }

    setIsSubmitting(true);
    
    try {
      // Create a message signing function if available
      const messageSigningFunction = signMessage 
        ? async (message: string) => {
            const encodedMessage = new TextEncoder().encode(message);
            const signature = await signMessage(encodedMessage);
            return Buffer.from(signature).toString('base64');
          }
        : undefined;

      // Submit proof using the real service
      await proofService.submitProof(
        {
          title: formData.title,
          description: formData.description,
          type: formData.type,
          tags: formData.tags,
          attachments: formData.attachments,
          githubRepo: formData.githubRepo,
          liveDemo: formData.liveDemo,
          clientAddress: formData.clientAddress,
        },
        connectedWallet,
        messageSigningFunction
      );
      
      // Reset form on success
      setFormData({
        title: '',
        description: '',
        type: 'project',
        tags: [],
        attachments: [],
        githubRepo: '',
        liveDemo: '',
        clientAddress: ''
      });
      
    } catch (error) {
      console.error('Proof submission error:', error);
      // Error is already handled by the service with toast
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

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
            <h1 className="text-3xl md:text-4xl font-bold mb-3">
              Submit Your Proof
            </h1>
            <p className="text-gray-400 text-base max-w-2xl mx-auto">
              Upload your work, add links, and create an immutable record of your achievements. 
              Paste images or links directly, or drag and drop files.
            </p>
            
            {/* Wallet Connection Status */}
            {!connectedWallet && (
              <div className="mt-6 p-4 bg-purple-500/10 border border-purple-400/30 rounded-lg">
                <p className="text-purple-300 mb-4">You need to connect your wallet to submit proofs</p>
                <WalletConnect />
              </div>
            )}
          </motion.div>

          {/* Form */}
          <motion.form
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            onSubmit={handleSubmit}
            className="glass-panel p-6 md:p-8 space-y-6"
          >
            {/* Basic Information */}
            <div className="space-y-4">
              <h2 className="text-xl font-semibold text-purple-300 mb-4">Basic Information</h2>
              
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Project Title *
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => handleInputChange('title', e.target.value)}
                  className="cyber-input w-full"
                  placeholder="Enter your project title..."
                  required
                  disabled={isSubmitting}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Work Type *
                </label>
                <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                  {workTypes.map((type) => (
                    <button
                      key={type.value}
                      type="button"
                      onClick={() => handleInputChange('type', type.value)}
                      disabled={isSubmitting}
                      className={`flex items-center gap-2 p-3 rounded-lg border text-sm font-medium transition-all duration-300 disabled:opacity-50 ${
                        formData.type === type.value
                          ? 'border-purple-400 bg-purple-500/20 text-purple-200'
                          : 'border-purple-500/30 bg-dark-800/40 text-gray-300 hover:border-purple-400/50 hover:bg-purple-500/10'
                      }`}
                    >
                      <type.icon className="w-4 h-4" />
                      <span className="hidden md:block">{type.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Description *
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => handleInputChange('description', e.target.value)}
                  className="cyber-textarea w-full"
                  placeholder="Describe your work in detail..."
                  required
                  disabled={isSubmitting}
                />
              </div>
            </div>

            {/* Tags */}
            <div className="space-y-4">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold text-purple-300">Tags</h2>
                <span className="text-sm text-gray-400">
                  {formData.tags.length} tag{formData.tags.length !== 1 ? 's' : ''} added
                </span>
              </div>
              
              <div className="flex gap-2">
                <input
                  type="text"
                  value={currentTag}
                  onChange={(e) => setCurrentTag(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleAddTag();
                    }
                  }}
                  className="cyber-input flex-1"
                  placeholder="Add tags (e.g., React, DeFi, Smart Contract)..."
                  disabled={isSubmitting}
                />
                <button
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    handleAddTag();
                  }}
                  className="neon-button px-4 flex items-center justify-center"
                  disabled={isSubmitting || !currentTag.trim()}
                  title="Add Tag"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>

              {formData.tags.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {formData.tags.map((tag) => (
                    <span
                      key={tag}
                      className="inline-flex items-center gap-1 px-3 py-1 bg-purple-500/20 border border-purple-400/30 rounded-full text-sm text-purple-200"
                    >
                      {tag}
                      <button
                        type="button"
                        onClick={() => handleRemoveTag(tag)}
                        className="text-purple-400 hover:text-red-400 transition-colors"
                        disabled={isSubmitting}
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* Attachments */}
            <div className="space-y-4">
              <h2 className="text-xl font-semibold text-purple-300 mb-4">Attachments</h2>
              
              {/* Paste Area */}
              <div 
                ref={pasteAreaRef}
                className="border-2 border-dashed border-purple-500/30 rounded-lg p-6 text-center bg-dark-800/20"
              >
                <div className="space-y-3">
                  <div className="text-purple-400 text-sm font-medium">
                    💡 Tip: You can paste images or links directly anywhere on this page!
                  </div>
                  <div className="text-gray-400 text-xs">
                    Or use the options below to add files and links manually
                  </div>
                </div>
              </div>

              {/* Upload Area */}
              <div
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
                className={`border-2 border-dashed rounded-lg p-8 text-center transition-all duration-300 ${
                  dragActive 
                    ? 'border-purple-400 bg-purple-500/10' 
                    : 'border-purple-500/30 bg-dark-800/20 hover:border-purple-400/50'
                }`}
              >
                <div className="space-y-4">
                  <div className="flex justify-center">
                    <Upload className="w-12 h-12 text-purple-400" />
                  </div>
                  <div>
                    <p className="text-lg font-medium text-white mb-2">
                      Drop files here or click to upload
                    </p>
                    <p className="text-sm text-gray-400">
                      Supports images, PDFs, documents (max 10MB each)
                    </p>
                  </div>
                  <input
                    type="file"
                    multiple
                    accept=".png,.jpg,.jpeg,.gif,.webp,.pdf,.doc,.docx,.txt,.md"
                    onChange={(e) => e.target.files && handleFiles(Array.from(e.target.files))}
                    className="hidden"
                    id="file-upload"
                    disabled={isSubmitting}
                  />
                  <label
                    htmlFor="file-upload"
                    className={`neon-button inline-flex items-center gap-2 cursor-pointer ${isSubmitting ? 'opacity-50 cursor-not-allowed' : ''}`}
                  >
                    <Paperclip className="w-4 h-4" />
                    Choose Files
                  </label>
                </div>
              </div>

              {/* Add Link */}
              <div className="flex gap-2">
                <input
                  type="url"
                  value={linkInput}
                  onChange={(e) => setLinkInput(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddLink())}
                  className="cyber-input flex-1"
                  placeholder="Add a link (https://example.com)..."
                  disabled={isSubmitting}
                />
                <button
                  type="button"
                  onClick={handleAddLink}
                  className="neon-button px-4"
                  disabled={isSubmitting}
                >
                  <LinkIcon className="w-4 h-4" />
                </button>
              </div>

              {/* Attachment List */}
              {formData.attachments.length > 0 && (
                <div className="space-y-3">
                  <h3 className="text-sm font-medium text-gray-300">Attached Files & Links</h3>
                  <div className="grid gap-3">
                    {formData.attachments.map((attachment) => (
                      <div
                        key={attachment.id}
                        className="flex items-center gap-3 p-3 bg-dark-700/50 border border-purple-500/20 rounded-lg"
                      >
                        {attachment.type === 'image' && attachment.preview ? (
                          <img 
                            src={attachment.preview} 
                            alt={attachment.name}
                            className="w-12 h-12 object-cover rounded"
                          />
                        ) : (
                          <div className="w-12 h-12 bg-purple-500/20 border border-purple-400/30 rounded flex items-center justify-center">
                            {attachment.type === 'link' ? (
                              <ExternalLink className="w-5 h-5 text-purple-400" />
                            ) : attachment.type === 'image' ? (
                              <ImageIcon className="w-5 h-5 text-purple-400" />
                            ) : (
                              <FileText className="w-5 h-5 text-purple-400" />
                            )}
                          </div>
                        )}
                        
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-white truncate">
                            {attachment.name}
                          </p>
                          <div className="flex items-center gap-2 text-xs text-gray-400">
                            <span className="capitalize">{attachment.type}</span>
                            {attachment.size && (
                              <>
                                <span>•</span>
                                <span>{formatFileSize(attachment.size)}</span>
                              </>
                            )}
                            {attachment.url && (
                              <>
                                <span>•</span>
                                <a 
                                  href={attachment.url} 
                                  target="_blank" 
                                  rel="noopener noreferrer"
                                  className="text-purple-400 hover:text-purple-300 transition-colors"
                                >
                                  Open Link
                                </a>
                              </>
                            )}
                          </div>
                        </div>
                        
                        <button
                          type="button"
                          onClick={() => handleRemoveAttachment(attachment.id)}
                          className="p-2 text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded transition-all duration-200"
                          disabled={isSubmitting}
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Additional Details */}
            <div className="space-y-4">
              <h2 className="text-xl font-semibold text-purple-300 mb-4">Additional Details</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    GitHub Repository
                  </label>
                  <input
                    type="url"
                    value={formData.githubRepo}
                    onChange={(e) => handleInputChange('githubRepo', e.target.value)}
                    className="cyber-input w-full"
                    placeholder="https://github.com/username/repo"
                    disabled={isSubmitting}
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Live Demo URL
                  </label>
                  <input
                    type="url"
                    value={formData.liveDemo}
                    onChange={(e) => handleInputChange('liveDemo', e.target.value)}
                    className="cyber-input w-full"
                    placeholder="https://your-demo.com"
                    disabled={isSubmitting}
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Client Wallet Address (for endorsements)
                </label>
                <input
                  type="text"
                  value={formData.clientAddress}
                  onChange={(e) => handleInputChange('clientAddress', e.target.value)}
                  className="cyber-input w-full"
                  placeholder="Client wallet address (optional)"
                  disabled={isSubmitting}
                />
              </div>
            </div>

            {/* Submit Button */}
            <div className="flex gap-4 pt-6 border-t border-purple-500/20">
              <button
                type="submit"
                disabled={isSubmitting || !connectedWallet}
                className="neon-button-primary flex-1 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Submitting...
                  </>
                ) : (
                  <>
                    <Upload className="w-5 h-5" />
                    Submit Proof
                  </>
                )}
              </button>
              
              <Link
                href="/dashboard"
                className="neon-button px-6 py-3 inline-flex items-center gap-2"
              >
                <Eye className="w-4 h-4" />
                View Dashboard
              </Link>
            </div>
          </motion.form>
        </div>
      </main>
    </div>
  );
} 