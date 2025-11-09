'use client';

import React, { useState, useCallback, useRef } from 'react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  Download, 
  Upload, 
  FileText, 
  FileJson, 
  FileImage, 
  File,
  CheckCircle,
  AlertCircle,
  X,
  Settings,
  Calendar,
  MessageSquare,
  Database,
  Archive,
  Share2,
  Copy,
  Trash2
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Conversation, ExportOptions, ImportOptions, ExportFormat, ImportFormat } from '@/types/ai-chat';

export interface ExportImportProps {
  className?: string;
  conversations: Conversation[];
  onExport?: (conversations: Conversation[], options: ExportOptions) => Promise<string>;
  onImport?: (file: File, options: ImportOptions) => Promise<Conversation[]>;
  onDeleteConversations?: (conversationIds: string[]) => Promise<void>;
  onClearAll?: () => Promise<void>;
}

export function ExportImport({
  className,
  conversations,
  onExport,
  onImport,
  onDeleteConversations,
  onClearAll,
}: ExportImportProps) {
  const [isExportDialogOpen, setIsExportDialogOpen] = useState(false);
  const [isImportDialogOpen, setIsImportDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isClearDialogOpen, setIsClearDialogOpen] = useState(false);
  
  const [selectedConversations, setSelectedConversations] = useState<Set<string>>(new Set());
  const [exportOptions, setExportOptions] = useState<ExportOptions>({
    format: 'json',
    includeMetadata: true,
    includeAttachments: false,
  });
  const [importOptions, setImportOptions] = useState<ImportOptions>({
    format: 'json',
    mergeWithExisting: true,
    createNewConversation: false,
  });
  
  const [isExporting, setIsExporting] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isClearing, setIsClearing] = useState(false);
  
  const [exportProgress, setExportProgress] = useState(0);
  const [importProgress, setImportProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Handle conversation selection
  const handleConversationSelect = useCallback((conversationId: string, selected: boolean) => {
    setSelectedConversations(prev => {
      const newSet = new Set(prev);
      if (selected) {
        newSet.add(conversationId);
      } else {
        newSet.delete(conversationId);
      }
      return newSet;
    });
  }, []);

  const handleSelectAll = useCallback(() => {
    if (selectedConversations.size === conversations.length) {
      setSelectedConversations(new Set());
    } else {
      setSelectedConversations(new Set(conversations.map(c => c.id)));
    }
  }, [conversations, selectedConversations.size]);

  // Export functionality
  const handleExport = useCallback(async () => {
    if (selectedConversations.size === 0) {
      setError('Please select at least one conversation to export');
      return;
    }

    setIsExporting(true);
    setError(null);
    setExportProgress(0);

    try {
      const conversationsToExport = conversations.filter(c => selectedConversations.has(c.id));
      
      // Simulate progress
      const progressInterval = setInterval(() => {
        setExportProgress(prev => Math.min(prev + 10, 90));
      }, 100);

      const result = await onExport?.(conversationsToExport, exportOptions);
      
      clearInterval(progressInterval);
      setExportProgress(100);
      
      // Download the file
      const blob = new Blob([result], { type: 'application/octet-stream' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `chat-export-${new Date().toISOString().split('T')[0]}.${exportOptions.format}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      setSuccess(`Successfully exported ${conversationsToExport.length} conversation(s)`);
      setIsExportDialogOpen(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Export failed');
    } finally {
      setIsExporting(false);
      setExportProgress(0);
    }
  }, [selectedConversations, conversations, exportOptions, onExport]);

  // Import functionality
  const handleImport = useCallback(async (file: File) => {
    setIsImporting(true);
    setError(null);
    setImportProgress(0);

    try {
      // Simulate progress
      const progressInterval = setInterval(() => {
        setImportProgress(prev => Math.min(prev + 20, 90));
      }, 200);

      const result = await onImport?.(file, importOptions);
      
      clearInterval(progressInterval);
      setImportProgress(100);
      
      setSuccess(`Successfully imported ${result.length} conversation(s)`);
      setIsImportDialogOpen(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Import failed');
    } finally {
      setIsImporting(false);
      setImportProgress(0);
    }
  }, [importOptions, onImport]);

  // Delete functionality
  const handleDelete = useCallback(async () => {
    if (selectedConversations.size === 0) {
      setError('Please select at least one conversation to delete');
      return;
    }

    setIsDeleting(true);
    setError(null);

    try {
      await onDeleteConversations?.(Array.from(selectedConversations));
      setSuccess(`Successfully deleted ${selectedConversations.size} conversation(s)`);
      setSelectedConversations(new Set());
      setIsDeleteDialogOpen(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Delete failed');
    } finally {
      setIsDeleting(false);
    }
  }, [selectedConversations, onDeleteConversations]);

  // Clear all functionality
  const handleClearAll = useCallback(async () => {
    setIsClearing(true);
    setError(null);

    try {
      await onClearAll?.();
      setSuccess('Successfully cleared all conversations');
      setSelectedConversations(new Set());
      setIsClearDialogOpen(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Clear all failed');
    } finally {
      setIsClearing(false);
    }
  }, [onClearAll]);

  // File input handler
  const handleFileInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleImport(file);
    }
  }, [handleImport]);

  const getFormatIcon = (format: ExportFormat | ImportFormat) => {
    switch (format) {
      case 'json':
        return <FileJson className="h-4 w-4" />;
      case 'markdown':
        return <FileText className="h-4 w-4" />;
      case 'pdf':
        return <FileImage className="h-4 w-4" />;
      case 'txt':
        return <FileText className="h-4 w-4" />;
      default:
        return <File className="h-4 w-4" />;
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatDate = (date: string): string => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className={cn('space-y-6', className)}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Export & Import</h2>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={() => setIsExportDialogOpen(true)}
            disabled={conversations.length === 0}
          >
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
          <Button
            variant="outline"
            onClick={() => fileInputRef.current?.click()}
          >
            <Upload className="h-4 w-4 mr-2" />
            Import
          </Button>
          <input
            ref={fileInputRef}
            type="file"
            accept=".json,.md,.txt"
            onChange={handleFileInput}
            className="hidden"
          />
        </div>
      </div>

      {/* Conversations List */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-base">Conversations</CardTitle>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleSelectAll}
              >
                {selectedConversations.size === conversations.length ? 'Deselect All' : 'Select All'}
              </Button>
              {selectedConversations.size > 0 && (
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => setIsDeleteDialogOpen(true)}
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete Selected
                </Button>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {conversations.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-32 text-center">
              <MessageSquare className="h-8 w-8 text-muted-foreground mb-2" />
              <p className="text-muted-foreground">No conversations to export</p>
            </div>
          ) : (
            <div className="space-y-2">
              {conversations.map((conversation) => (
                <div
                  key={conversation.id}
                  className={cn(
                    'flex items-center gap-3 p-3 rounded-lg border transition-colors',
                    selectedConversations.has(conversation.id) && 'bg-primary/5 border-primary'
                  )}
                >
                  <Checkbox
                    checked={selectedConversations.has(conversation.id)}
                    onCheckedChange={(checked) => handleConversationSelect(conversation.id, checked as boolean)}
                  />
                  <div className="flex-1 min-w-0">
                    <h3 className="font-medium text-sm truncate">{conversation.title}</h3>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <MessageSquare className="h-3 w-3" />
                      <span>{conversation.messageCount} messages</span>
                      <Calendar className="h-3 w-3" />
                      <span>{formatDate(conversation.updatedAt)}</span>
                    </div>
                  </div>
                  <Badge variant="secondary" className="text-xs">
                    {conversation.status}
                  </Badge>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Danger Zone */}
      <Card className="border-red-200">
        <CardHeader>
          <CardTitle className="text-base text-red-600">Danger Zone</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-medium">Clear All Conversations</h3>
              <p className="text-sm text-muted-foreground">
                Permanently delete all conversations. This action cannot be undone.
              </p>
            </div>
            <Button
              variant="destructive"
              onClick={() => setIsClearDialogOpen(true)}
              disabled={conversations.length === 0}
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Clear All
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Status Messages */}
      {error && (
        <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700">
          <AlertCircle className="h-4 w-4" />
          <span className="text-sm">{error}</span>
          <Button
            variant="ghost"
            size="sm"
            className="h-6 w-6 p-0 ml-auto"
            onClick={() => setError(null)}
          >
            <X className="h-3 w-3" />
          </Button>
        </div>
      )}

      {success && (
        <div className="flex items-center gap-2 p-3 bg-green-50 border border-green-200 rounded-lg text-green-700">
          <CheckCircle className="h-4 w-4" />
          <span className="text-sm">{success}</span>
          <Button
            variant="ghost"
            size="sm"
            className="h-6 w-6 p-0 ml-auto"
            onClick={() => setSuccess(null)}
          >
            <X className="h-3 w-3" />
          </Button>
        </div>
      )}

      {/* Export Dialog */}
      <Dialog open={isExportDialogOpen} onOpenChange={setIsExportDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Export Conversations</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Export Format</label>
              <Select
                value={exportOptions.format}
                onValueChange={(value: ExportFormat) => 
                  setExportOptions(prev => ({ ...prev, format: value }))
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="json">
                    <div className="flex items-center gap-2">
                      {getFormatIcon('json')}
                      <span>JSON</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="markdown">
                    <div className="flex items-center gap-2">
                      {getFormatIcon('markdown')}
                      <span>Markdown</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="pdf">
                    <div className="flex items-center gap-2">
                      {getFormatIcon('pdf')}
                      <span>PDF</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="txt">
                    <div className="flex items-center gap-2">
                      {getFormatIcon('txt')}
                      <span>Text</span>
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-3">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="includeMetadata"
                  checked={exportOptions.includeMetadata}
                  onCheckedChange={(checked) => 
                    setExportOptions(prev => ({ ...prev, includeMetadata: checked as boolean }))
                  }
                />
                <label htmlFor="includeMetadata" className="text-sm">
                  Include metadata (timestamps, IDs, etc.)
                </label>
              </div>
              
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="includeAttachments"
                  checked={exportOptions.includeAttachments}
                  onCheckedChange={(checked) => 
                    setExportOptions(prev => ({ ...prev, includeAttachments: checked as boolean }))
                  }
                />
                <label htmlFor="includeAttachments" className="text-sm">
                  Include attachments (files, images, etc.)
                </label>
              </div>
            </div>
            
            {exportProgress > 0 && (
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span>Exporting...</span>
                  <span>{exportProgress}%</span>
                </div>
                <Progress value={exportProgress} className="w-full" />
              </div>
            )}
          </div>
          
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsExportDialogOpen(false)}
              disabled={isExporting}
            >
              Cancel
            </Button>
            <Button
              onClick={handleExport}
              disabled={isExporting || selectedConversations.size === 0}
            >
              {isExporting ? 'Exporting...' : 'Export'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Import Dialog */}
      <Dialog open={isImportDialogOpen} onOpenChange={setIsImportDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Import Conversations</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Import Format</label>
              <Select
                value={importOptions.format}
                onValueChange={(value: ImportFormat) => 
                  setImportOptions(prev => ({ ...prev, format: value }))
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="json">
                    <div className="flex items-center gap-2">
                      {getFormatIcon('json')}
                      <span>JSON</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="markdown">
                    <div className="flex items-center gap-2">
                      {getFormatIcon('markdown')}
                      <span>Markdown</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="txt">
                    <div className="flex items-center gap-2">
                      {getFormatIcon('txt')}
                      <span>Text</span>
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-3">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="mergeWithExisting"
                  checked={importOptions.mergeWithExisting}
                  onCheckedChange={(checked) => 
                    setImportOptions(prev => ({ ...prev, mergeWithExisting: checked as boolean }))
                  }
                />
                <label htmlFor="mergeWithExisting" className="text-sm">
                  Merge with existing conversations
                </label>
              </div>
              
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="createNewConversation"
                  checked={importOptions.createNewConversation}
                  onCheckedChange={(checked) => 
                    setImportOptions(prev => ({ ...prev, createNewConversation: checked as boolean }))
                  }
                />
                <label htmlFor="createNewConversation" className="text-sm">
                  Create new conversation for each import
                </label>
              </div>
            </div>
            
            {importProgress > 0 && (
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span>Importing...</span>
                  <span>{importProgress}%</span>
                </div>
                <Progress value={importProgress} className="w-full" />
              </div>
            )}
          </div>
          
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsImportDialogOpen(false)}
              disabled={isImporting}
            >
              Cancel
            </Button>
            <Button
              onClick={() => fileInputRef.current?.click()}
              disabled={isImporting}
            >
              {isImporting ? 'Importing...' : 'Select File'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Conversations</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Are you sure you want to delete {selectedConversations.size} conversation(s)? 
              This action cannot be undone.
            </p>
            
            <div className="space-y-2">
              {Array.from(selectedConversations).map(conversationId => {
                const conversation = conversations.find(c => c.id === conversationId);
                return conversation ? (
                  <div key={conversationId} className="flex items-center gap-2 p-2 bg-muted rounded">
                    <MessageSquare className="h-4 w-4" />
                    <span className="text-sm">{conversation.title}</span>
                  </div>
                ) : null;
              })}
            </div>
          </div>
          
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsDeleteDialogOpen(false)}
              disabled={isDeleting}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={isDeleting}
            >
              {isDeleting ? 'Deleting...' : 'Delete'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Clear All Dialog */}
      <Dialog open={isClearDialogOpen} onOpenChange={setIsClearDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Clear All Conversations</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Are you sure you want to delete ALL {conversations.length} conversations? 
              This action cannot be undone and will permanently remove all your chat history.
            </p>
          </div>
          
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsClearDialogOpen(false)}
              disabled={isClearing}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleClearAll}
              disabled={isClearing}
            >
              {isClearing ? 'Clearing...' : 'Clear All'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default ExportImport;
