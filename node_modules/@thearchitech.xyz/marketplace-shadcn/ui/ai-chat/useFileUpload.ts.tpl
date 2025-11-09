'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import { MessageAttachment, UploadFileData, UploadFileResult } from '@/types/ai-chat';
import { AIChatService } from '@/lib/services/AIChatService';

export interface UseFileUploadOptions {
  maxFiles?: number;
  maxFileSize?: number;
  acceptedTypes?: string[];
  onUpload?: (files: File[]) => void;
  onError?: (error: Error) => void;
  onProgress?: (progress: number) => void;
  onSuccess?: (result: UploadFileResult) => void;
  autoUpload?: boolean;
  multiple?: boolean;
}

export interface UseFileUploadReturn {
  // File state
  files: File[];
  attachments: MessageAttachment[];
  isUploading: boolean;
  uploadProgress: number;
  error: Error | null;
  
  // File management
  addFiles: (files: File[]) => void;
  removeFile: (index: number) => void;
  clearFiles: () => void;
  
  // Upload functionality
  uploadFiles: (files?: File[]) => Promise<UploadFileResult[]>;
  uploadSingleFile: (file: File) => Promise<UploadFileResult>;
  
  // Drag and drop
  isDragActive: boolean;
  dragHandlers: {
    onDragEnter: (e: React.DragEvent) => void;
    onDragLeave: (e: React.DragEvent) => void;
    onDragOver: (e: React.DragEvent) => void;
    onDrop: (e: React.DragEvent) => void;
  };
  
  // File validation
  validateFile: (file: File) => { isValid: boolean; error?: string };
  validateFiles: (files: File[]) => { valid: File[]; invalid: { file: File; error: string }[] };
  
  // Utility functions
  formatFileSize: (bytes: number) => string;
  getFileType: (file: File) => string;
  getFileIcon: (file: File) => string;
}

export function useFileUpload(options: UseFileUploadOptions = {}): UseFileUploadReturn {
  const {
    maxFiles = 5,
    maxFileSize = 10 * 1024 * 1024, // 10MB
    acceptedTypes = ['image/*', 'video/*', 'audio/*', 'application/pdf', '.doc', '.docx', '.txt'],
    onUpload,
    onError,
    onProgress,
    onSuccess,
    autoUpload = false,
    multiple = true,
  } = options;

  const [files, setFiles] = useState<File[]>([]);
  const [attachments, setAttachments] = useState<MessageAttachment[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState<Error | null>(null);
  const [isDragActive, setIsDragActive] = useState(false);
  
  const abortControllerRef = useRef<AbortController | null>(null);

  // File validation
  const validateFile = useCallback((file: File): { isValid: boolean; error?: string } => {
    // Check file size
    if (file.size > maxFileSize) {
      return {
        isValid: false,
        error: `File size exceeds maximum allowed size of ${formatFileSize(maxFileSize)}`,
      };
    }

    // Check file type
    if (acceptedTypes.length > 0) {
      const isAccepted = acceptedTypes.some(type => {
        if (type.startsWith('.')) {
          return file.name.toLowerCase().endsWith(type.toLowerCase());
        }
        return file.type.match(type.replace('*', '.*'));
      });

      if (!isAccepted) {
        return {
          isValid: false,
          error: `File type not supported. Accepted types: ${acceptedTypes.join(', ')}`,
        };
      }
    }

    return { isValid: true };
  }, [maxFileSize, acceptedTypes]);

  const validateFiles = useCallback((filesToValidate: File[]) => {
    const valid: File[] = [];
    const invalid: { file: File; error: string }[] = [];

    filesToValidate.forEach(file => {
      const validation = validateFile(file);
      if (validation.isValid) {
        valid.push(file);
      } else {
        invalid.push({ file, error: validation.error! });
      }
    });

    return { valid, invalid };
  }, [validateFile]);

  // File management
  const addFiles = useCallback((newFiles: File[]) => {
    const validation = validateFiles(newFiles);
    
    if (validation.invalid.length > 0) {
      const errorMessage = validation.invalid
        .map(({ file, error }) => `${file.name}: ${error}`)
        .join('\n');
      const error = new Error(errorMessage);
      setError(error);
      onError?.(error);
      return;
    }

    if (files.length + validation.valid.length > maxFiles) {
      const error = new Error(`Maximum ${maxFiles} files allowed`);
      setError(error);
      onError?.(error);
      return;
    }

    setFiles(prev => [...prev, ...validation.valid]);
    setError(null);
    onUpload?.(validation.valid);
  }, [files.length, maxFiles, validateFiles, onUpload, onError]);

  const removeFile = useCallback((index: number) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
  }, []);

  const clearFiles = useCallback(() => {
    setFiles([]);
    setAttachments([]);
    setError(null);
    setUploadProgress(0);
  }, []);

  // Upload functionality
  const uploadSingleFile = useCallback(async (file: File): Promise<UploadFileResult> => {
    try {
      // ✅ CORRECT: Use backend service
      const { upload } = AIChatService.useFileUpload();
      
      const result = await upload().mutateAsync({
        file,
        type: file.type.startsWith('image/') ? 'image' : 'document',
      });
      
      // Add to attachments
      setAttachments(prev => [...prev, result.attachment]);
      onSuccess?.(result);
      
      return result;
    } catch (error) {
      const uploadError = error instanceof Error ? error : new Error('Upload failed');
      setError(uploadError);
      onError?.(uploadError);
      throw uploadError;
    }
  }, [onSuccess, onError]);

  const uploadFiles = useCallback(async (filesToUpload: File[] = files): Promise<UploadFileResult[]> => {
    if (filesToUpload.length === 0) {
      return [];
    }

    setIsUploading(true);
    setError(null);
    setUploadProgress(0);

    // Create new abort controller
    abortControllerRef.current = new AbortController();

    try {
      const results: UploadFileResult[] = [];
      const totalFiles = filesToUpload.length;

      for (let i = 0; i < totalFiles; i++) {
        const file = filesToUpload[i];
        const result = await uploadSingleFile(file);
        results.push(result);
        
        // Update progress
        const progress = ((i + 1) / totalFiles) * 100;
        setUploadProgress(progress);
        onProgress?.(progress);
      }

      // Remove uploaded files from local state
      setFiles(prev => prev.filter(file => !filesToUpload.includes(file)));
      
      return results;
    } catch (error) {
      const uploadError = error instanceof Error ? error : new Error('Upload failed');
      setError(uploadError);
      onError?.(uploadError);
      throw uploadError;
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
      abortControllerRef.current = null;
    }
  }, [files, uploadSingleFile, onProgress, onError]);

  // Drag and drop handlers
  const handleDragEnter = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragActive(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragActive(false);
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragActive(false);

    const droppedFiles = Array.from(e.dataTransfer.files);
    if (droppedFiles.length > 0) {
      addFiles(droppedFiles);
    }
  }, [addFiles]);

  // Auto-upload effect
  useEffect(() => {
    if (autoUpload && files.length > 0 && !isUploading) {
      uploadFiles();
    }
  }, [autoUpload, files, isUploading, uploadFiles]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  // Utility functions
  const formatFileSize = useCallback((bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }, []);

  const getFileType = useCallback((file: File): string => {
    if (file.type.startsWith('image/')) return 'image';
    if (file.type.startsWith('video/')) return 'video';
    if (file.type.startsWith('audio/')) return 'audio';
    if (file.type === 'application/pdf') return 'document';
    if (file.type.includes('document') || file.type.includes('text')) return 'document';
    if (file.type.includes('zip') || file.type.includes('rar')) return 'archive';
    return 'file';
  }, []);

  const getFileIcon = useCallback((file: File): string => {
    const type = getFileType(file);
    switch (type) {
      case 'image':
        return '🖼️';
      case 'video':
        return '🎥';
      case 'audio':
        return '🎵';
      case 'document':
        return '📄';
      case 'archive':
        return '📦';
      default:
        return '📁';
    }
  }, [getFileType]);

  return {
    // File state
    files,
    attachments,
    isUploading,
    uploadProgress,
    error,
    
    // File management
    addFiles,
    removeFile,
    clearFiles,
    
    // Upload functionality
    uploadFiles,
    uploadSingleFile,
    
    // Drag and drop
    isDragActive,
    dragHandlers: {
      onDragEnter: handleDragEnter,
      onDragLeave: handleDragLeave,
      onDragOver: handleDragOver,
      onDrop: handleDrop,
    },
    
    // File validation
    validateFile,
    validateFiles,
    
    // Utility functions
    formatFileSize,
    getFileType,
    getFileIcon,
  };
}

export default useFileUpload;
