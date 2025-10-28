import { supabase } from './supabase';
import toast from 'react-hot-toast';

export interface UploadResult {
  success: boolean;
  url?: string;
  path?: string;
  error?: string;
}

export interface FileMetadata {
  name: string;
  size: number;
  type: string;
  lastModified: number;
}

class FileUploadService {
  private static instance: FileUploadService;
  private readonly bucketName = 'proof-attachments';
  private readonly maxFileSize = 10 * 1024 * 1024; // 10MB
  private readonly allowedTypes = [
    'image/jpeg',
    'image/png',
    'image/gif',
    'image/webp',
    'video/mp4',
    'video/webm',
    'video/quicktime',
    'application/pdf',
    'text/plain',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  ];

  public static getInstance(): FileUploadService {
    if (!FileUploadService.instance) {
      FileUploadService.instance = new FileUploadService();
    }
    return FileUploadService.instance;
  }

  /**
   * Upload a single file to Supabase Storage
   */
  async uploadFile(file: File, folder: string = 'proofs'): Promise<UploadResult> {
    try {
      // Validate file
      const validation = this.validateFile(file);
      if (!validation.valid) {
        return {
          success: false,
          error: validation.error
        };
      }

      // Generate unique filename
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}.${fileExt}`;
      const filePath = `${folder}/${fileName}`;

      // Upload file
      const { data, error } = await supabase.storage
        .from(this.bucketName)
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (error) {
        console.error('File upload error:', error);
        return {
          success: false,
          error: `Upload failed: ${error.message}`
        };
      }

      // Get public URL
      const { data: urlData } = supabase.storage
        .from(this.bucketName)
        .getPublicUrl(filePath);

      console.log('✅ File uploaded successfully:', filePath);
      return {
        success: true,
        url: urlData.publicUrl,
        path: filePath
      };
    } catch (error) {
      console.error('File upload failed:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Upload multiple files
   */
  async uploadFiles(files: File[], folder: string = 'proofs'): Promise<UploadResult[]> {
    const uploadPromises = files.map(file => this.uploadFile(file, folder));
    return Promise.all(uploadPromises);
  }

  /**
   * Upload file with progress callback
   */
  async uploadFileWithProgress(
    file: File, 
    folder: string = 'proofs',
    onProgress?: (progress: number) => void
  ): Promise<UploadResult> {
    try {
      // Validate file
      const validation = this.validateFile(file);
      if (!validation.valid) {
        return {
          success: false,
          error: validation.error
        };
      }

      // Generate unique filename
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}.${fileExt}`;
      const filePath = `${folder}/${fileName}`;

      // Simulate progress (Supabase doesn't provide progress callbacks)
      if (onProgress) {
        onProgress(10);
        setTimeout(() => onProgress(50), 100);
        setTimeout(() => onProgress(90), 200);
      }

      // Upload file
      const { data, error } = await supabase.storage
        .from(this.bucketName)
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (onProgress) {
        onProgress(100);
      }

      if (error) {
        console.error('File upload error:', error);
        return {
          success: false,
          error: `Upload failed: ${error.message}`
        };
      }

      // Get public URL
      const { data: urlData } = supabase.storage
        .from(this.bucketName)
        .getPublicUrl(filePath);

      return {
        success: true,
        url: urlData.publicUrl,
        path: filePath
      };
    } catch (error) {
      console.error('File upload failed:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Delete file from storage
   */
  async deleteFile(filePath: string): Promise<boolean> {
    try {
      const { error } = await supabase.storage
        .from(this.bucketName)
        .remove([filePath]);

      if (error) {
        console.error('File deletion error:', error);
        return false;
      }

      console.log('✅ File deleted successfully:', filePath);
      return true;
    } catch (error) {
      console.error('File deletion failed:', error);
      return false;
    }
  }

  /**
   * Get file metadata
   */
  async getFileMetadata(filePath: string): Promise<any> {
    try {
      const { data, error } = await supabase.storage
        .from(this.bucketName)
        .list(filePath.split('/').slice(0, -1).join('/'), {
          search: filePath.split('/').pop()
        });

      if (error) {
        console.error('File metadata error:', error);
        return null;
      }

      return data?.[0] || null;
    } catch (error) {
      console.error('File metadata failed:', error);
      return null;
    }
  }

  /**
   * Validate file before upload
   */
  private validateFile(file: File): { valid: boolean; error?: string } {
    // Check file size
    if (file.size > this.maxFileSize) {
      return {
        valid: false,
        error: `File size exceeds ${this.maxFileSize / (1024 * 1024)}MB limit`
      };
    }

    // Check file type
    if (!this.allowedTypes.includes(file.type)) {
      return {
        valid: false,
        error: `File type ${file.type} is not allowed`
      };
    }

    // Check file name
    if (!file.name || file.name.trim() === '') {
      return {
        valid: false,
        error: 'File name is required'
      };
    }

    return { valid: true };
  }

  /**
   * Get file size in human readable format
   */
  formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  /**
   * Get file type icon
   */
  getFileTypeIcon(fileType: string): string {
    if (fileType.startsWith('image/')) return '🖼️';
    if (fileType.startsWith('video/')) return '🎥';
    if (fileType === 'application/pdf') return '📄';
    if (fileType.includes('word')) return '📝';
    if (fileType === 'text/plain') return '📄';
    return '📁';
  }

  /**
   * Check if Supabase Storage is available
   */
  async isStorageAvailable(): Promise<boolean> {
    try {
      const { data, error } = await supabase.storage
        .from(this.bucketName)
        .list('', { limit: 1 });

      return !error;
    } catch (error) {
      console.error('Storage availability check failed:', error);
      return false;
    }
  }

  /**
   * Create storage bucket if it doesn't exist
   */
  async ensureBucketExists(): Promise<boolean> {
    try {
      const { data, error } = await supabase.storage
        .from(this.bucketName)
        .list('', { limit: 1 });

      if (error && error.message.includes('not found')) {
        // Bucket doesn't exist, create it
        const { error: createError } = await supabase.storage.createBucket(this.bucketName, {
          public: true,
          allowedMimeTypes: this.allowedTypes,
          fileSizeLimit: this.maxFileSize
        });

        if (createError) {
          console.error('Failed to create bucket:', createError);
          return false;
        }

        console.log('✅ Storage bucket created:', this.bucketName);
      }

      return true;
    } catch (error) {
      console.error('Bucket creation failed:', error);
      return false;
    }
  }
}

export const fileUploadService = FileUploadService.getInstance();
