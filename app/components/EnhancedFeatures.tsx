'use client';

import { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Upload, 
  Image as ImageIcon, 
  Link as LinkIcon,
  FileText,
  Paperclip,
  X,
  Check,
  AlertCircle,
  Info,
  Copy,
  ExternalLink
} from 'lucide-react';
import toast from 'react-hot-toast';

interface EnhancedUploadAreaProps {
  onFilesAdded: (files: File[]) => void;
  onLinkAdded: (url: string) => void;
  accept?: string;
  maxSize?: number; // in MB
  className?: string;
}

export function EnhancedUploadArea({ 
  onFilesAdded, 
  onLinkAdded, 
  accept = "image/*,.pdf,.doc,.docx", 
  maxSize = 10,
  className = ""
}: EnhancedUploadAreaProps) {
  const [isDragActive, setIsDragActive] = useState(false);
  const [linkInput, setLinkInput] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragActive(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.currentTarget.contains(e.relatedTarget as Node)) return;
    setIsDragActive(false);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragActive(false);

    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      handleFiles(files);
    }
  };

  const handleFiles = (files: File[]) => {
    const validFiles = files.filter(file => {
      const sizeInMB = file.size / (1024 * 1024);
      if (sizeInMB > maxSize) {
        toast.error(`File ${file.name} is too large. Maximum size is ${maxSize}MB.`);
        return false;
      }
      return true;
    });

    if (validFiles.length > 0) {
      onFilesAdded(validFiles);
      toast.success(`${validFiles.length} file${validFiles.length > 1 ? 's' : ''} added successfully!`);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      handleFiles(Array.from(e.target.files));
    }
  };

  const handleAddLink = () => {
    const url = linkInput.trim();
    if (url && isValidUrl(url)) {
      onLinkAdded(url);
      setLinkInput('');
      toast.success('Link added successfully!');
    } else {
      toast.error('Please enter a valid URL');
    }
  };

  const isValidUrl = (string: string) => {
    try {
      new URL(string);
      return true;
    } catch (_) {
      return false;
    }
  };

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Paste Information */}
      <motion.div 
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-purple-500/10 border border-purple-400/30 rounded-lg p-4"
      >
        <div className="flex items-start gap-3">
          <Info className="w-5 h-5 text-purple-400 mt-0.5 flex-shrink-0" />
          <div className="space-y-2">
            <p className="text-sm text-purple-300 font-medium">
              Enhanced Paste Support
            </p>
            <div className="text-xs text-gray-400 space-y-1">
              <p>• Paste images directly from clipboard (Ctrl/Cmd + V)</p>
              <p>• Paste links and they'll be automatically detected</p>
              <p>• Drag and drop files from your computer</p>
              <p>• Copy text content and it will auto-populate fields</p>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Drag and Drop Area */}
      <div
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
        className={`
          relative border-2 border-dashed rounded-lg p-8 text-center transition-all duration-300 cursor-pointer
          ${isDragActive 
            ? 'border-purple-400 bg-purple-500/20' 
            : 'border-purple-500/30 bg-dark-800/20 hover:border-purple-400/50 hover:bg-dark-800/40'
          }
        `}
        onClick={() => fileInputRef.current?.click()}
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept={accept}
          onChange={handleFileSelect}
          className="hidden"
        />
        
        <div className="space-y-4">
          <div className="flex justify-center">
            <div className={`
              p-4 rounded-full transition-all duration-300
              ${isDragActive 
                ? 'bg-purple-500/30 border border-purple-400' 
                : 'bg-purple-500/20 border border-purple-500/40'
              }
            `}>
              <Upload className={`w-8 h-8 transition-colors ${isDragActive ? 'text-purple-300' : 'text-purple-400'}`} />
            </div>
          </div>
          
          <div>
            <p className={`text-lg font-medium transition-colors ${isDragActive ? 'text-purple-300' : 'text-gray-300'}`}>
              {isDragActive ? 'Drop files here' : 'Upload Files'}
            </p>
            <p className="text-sm text-gray-400 mt-1">
              Drag & drop files, or click to browse
            </p>
            <p className="text-xs text-gray-500 mt-2">
              Supports: Images, PDFs, Documents (max {maxSize}MB each)
            </p>
          </div>
        </div>
      </div>

      {/* Link Input */}
      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-300">
          Add Link (GitHub, Live Demo, etc.)
        </label>
        <div className="flex gap-2">
          <input
            type="url"
            value={linkInput}
            onChange={(e) => setLinkInput(e.target.value)}
            placeholder="https://github.com/your-repo or https://your-demo.com"
            className="cyber-input flex-1"
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                handleAddLink();
              }
            }}
          />
          <button
            type="button"
            onClick={handleAddLink}
            disabled={!linkInput.trim() || !isValidUrl(linkInput.trim())}
            className="neon-button px-4 flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <LinkIcon className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}

interface PasteIndicatorProps {
  show: boolean;
  type: 'image' | 'text' | 'link';
  onClose: () => void;
}

export function PasteIndicator({ show, type, onClose }: PasteIndicatorProps) {
  useEffect(() => {
    if (show) {
      const timer = setTimeout(() => {
        onClose();
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [show, onClose]);

  if (!show) return null;

  const getIcon = () => {
    switch (type) {
      case 'image':
        return <ImageIcon className="w-4 h-4" />;
      case 'link':
        return <LinkIcon className="w-4 h-4" />;
      default:
        return <FileText className="w-4 h-4" />;
    }
  };

  const getMessage = () => {
    switch (type) {
      case 'image':
        return 'Image pasted successfully!';
      case 'link':
        return 'Link detected and added!';
      default:
        return 'Content pasted successfully!';
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: -20, scale: 0.9 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -20, scale: 0.9 }}
      className="fixed top-20 right-4 z-50 bg-green-500/20 border border-green-400/40 rounded-lg p-3 flex items-center gap-2 text-green-300 text-sm"
    >
      <Check className="w-4 h-4" />
      {getIcon()}
      <span>{getMessage()}</span>
      <button
        onClick={onClose}
        className="ml-2 text-green-400 hover:text-green-300 transition-colors"
      >
        <X className="w-3 h-3" />
      </button>
    </motion.div>
  );
}

interface AttachmentPreviewProps {
  attachment: {
    id: string;
    type: 'image' | 'document' | 'link';
    name: string;
    url?: string;
    preview?: string;
    size?: number;
  };
  onRemove: (id: string) => void;
}

export function AttachmentPreview({ attachment, onRemove }: AttachmentPreviewProps) {
  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getIcon = () => {
    switch (attachment.type) {
      case 'image':
        return <ImageIcon className="w-4 h-4 text-blue-400" />;
      case 'link':
        return <LinkIcon className="w-4 h-4 text-purple-400" />;
      default:
        return <FileText className="w-4 h-4 text-green-400" />;
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      className="glass-panel p-4 rounded-lg"
    >
      <div className="flex items-start gap-3">
        {attachment.type === 'image' && attachment.preview ? (
          <div className="w-12 h-12 rounded-lg overflow-hidden bg-dark-700 flex-shrink-0">
            <img 
              src={attachment.preview} 
              alt={attachment.name}
              className="w-full h-full object-cover"
            />
          </div>
        ) : (
          <div className="w-12 h-12 rounded-lg bg-dark-700 flex items-center justify-center flex-shrink-0">
            {getIcon()}
          </div>
        )}
        
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-white truncate">
            {attachment.name}
          </p>
          {attachment.size && (
            <p className="text-xs text-gray-400">
              {formatFileSize(attachment.size)}
            </p>
          )}
          {attachment.type === 'link' && attachment.url && (
            <a 
              href={attachment.url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-purple-400 hover:text-purple-300 transition-colors inline-flex items-center gap-1 mt-1"
            >
              View link <ExternalLink className="w-3 h-3" />
            </a>
          )}
        </div>
        
        <button
          onClick={() => onRemove(attachment.id)}
          className="text-gray-400 hover:text-red-400 transition-colors p-1"
          title="Remove attachment"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </motion.div>
  );
}

export function CopyToClipboard({ text, children }: { text: string; children: React.ReactNode }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      toast.success('Copied to clipboard!');
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      toast.error('Failed to copy');
    }
  };

  return (
    <button
      onClick={handleCopy}
      className="inline-flex items-center gap-1 text-purple-400 hover:text-purple-300 transition-colors"
      title="Copy to clipboard"
    >
      {children}
      {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
    </button>
  );
} 