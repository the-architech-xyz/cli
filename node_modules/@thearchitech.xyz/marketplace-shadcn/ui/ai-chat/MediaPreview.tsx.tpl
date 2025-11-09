'use client';

import React, { useState, useCallback, useMemo } from 'react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Download, 
  Trash2, 
  Eye, 
  EyeOff, 
  ZoomIn, 
  ZoomOut, 
  RotateCw,
  FileText,
  Image,
  Video,
  Music,
  Archive,
  File,
  X,
  ChevronLeft,
  ChevronRight,
  Maximize2,
  Minimize2
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { MessageAttachment } from '@/types/ai-chat';

export interface MediaPreviewProps {
  attachments: MessageAttachment[];
  className?: string;
  onRemove?: (attachmentId: string) => void;
  onDownload?: (attachmentId: string) => void;
  onView?: (attachmentId: string) => void;
  maxHeight?: string;
  showThumbnails?: boolean;
  allowFullscreen?: boolean;
  allowDownload?: boolean;
  allowRemove?: boolean;
}

export function MediaPreview({
  attachments,
  className,
  onRemove,
  onDownload,
  onView,
  maxHeight = '300px',
  showThumbnails = true,
  allowFullscreen = true,
  allowDownload = true,
  allowRemove = true,
}: MediaPreviewProps) {
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);

  // Group attachments by type
  const groupedAttachments = useMemo(() => {
    const groups = {
      images: [] as MessageAttachment[],
      videos: [] as MessageAttachment[],
      audio: [] as MessageAttachment[],
      documents: [] as MessageAttachment[],
      other: [] as MessageAttachment[],
    };

    attachments.forEach(attachment => {
      switch (attachment.type) {
        case 'image':
          groups.images.push(attachment);
          break;
        case 'video':
          groups.videos.push(attachment);
          break;
        case 'audio':
          groups.audio.push(attachment);
          break;
        case 'document':
          groups.documents.push(attachment);
          break;
        default:
          groups.other.push(attachment);
      }
    });

    return groups;
  }, [attachments]);

  const handleRemove = useCallback((attachmentId: string) => {
    onRemove?.(attachmentId);
  }, [onRemove]);

  const handleDownload = useCallback((attachmentId: string) => {
    onDownload?.(attachmentId);
  }, [onDownload]);

  const handleView = useCallback((attachmentId: string) => {
    onView?.(attachmentId);
    const index = attachments.findIndex(att => att.id === attachmentId);
    if (index !== -1) {
      setSelectedIndex(index);
    }
  }, [onView, attachments]);

  const handleNext = useCallback(() => {
    if (selectedIndex !== null && selectedIndex < attachments.length - 1) {
      setSelectedIndex(selectedIndex + 1);
    }
  }, [selectedIndex, attachments.length]);

  const handlePrevious = useCallback(() => {
    if (selectedIndex !== null && selectedIndex > 0) {
      setSelectedIndex(selectedIndex - 1);
    }
  }, [selectedIndex]);

  const handleZoomIn = useCallback(() => {
    setZoom(prev => Math.min(prev + 0.25, 3));
  }, []);

  const handleZoomOut = useCallback(() => {
    setZoom(prev => Math.max(prev - 0.25, 0.25));
  }, []);

  const handleRotate = useCallback(() => {
    setRotation(prev => (prev + 90) % 360);
  }, []);

  const handleReset = useCallback(() => {
    setZoom(1);
    setRotation(0);
  }, []);

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getFileIcon = (type: string) => {
    switch (type) {
      case 'image':
        return <Image className="h-4 w-4" />;
      case 'video':
        return <Video className="h-4 w-4" />;
      case 'audio':
        return <Music className="h-4 w-4" />;
      case 'document':
        return <FileText className="h-4 w-4" />;
      case 'archive':
        return <Archive className="h-4 w-4" />;
      default:
        return <File className="h-4 w-4" />;
    }
  };

  const getFileColor = (type: string) => {
    switch (type) {
      case 'image':
        return 'text-green-600 bg-green-100';
      case 'video':
        return 'text-purple-600 bg-purple-100';
      case 'audio':
        return 'text-blue-600 bg-blue-100';
      case 'document':
        return 'text-orange-600 bg-orange-100';
      case 'archive':
        return 'text-gray-600 bg-gray-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  const AttachmentThumbnail = ({ attachment, index }: { attachment: MessageAttachment; index: number }) => (
    <Card className="group cursor-pointer hover:shadow-md transition-all duration-200">
      <CardContent className="p-3">
        <div className="flex items-start gap-3">
          <div className={cn('p-2 rounded-lg', getFileColor(attachment.type))}>
            {getFileIcon(attachment.type)}
          </div>
          
          <div className="flex-1 min-w-0">
            <h4 className="font-medium text-sm truncate">{attachment.name}</h4>
            <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
              <Badge variant="secondary" className="text-xs">
                {attachment.type}
              </Badge>
              {attachment.size && (
                <span>{formatFileSize(attachment.size)}</span>
              )}
            </div>
          </div>
          
          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            {allowDownload && (
              <Button
                variant="ghost"
                size="sm"
                className="h-6 w-6 p-0"
                onClick={() => handleDownload(attachment.id)}
              >
                <Download className="h-3 w-3" />
              </Button>
            )}
            
            {allowFullscreen && (attachment.type === 'image' || attachment.type === 'video') && (
              <Button
                variant="ghost"
                size="sm"
                className="h-6 w-6 p-0"
                onClick={() => handleView(attachment.id)}
              >
                <Eye className="h-3 w-3" />
              </Button>
            )}
            
            {allowRemove && (
              <Button
                variant="ghost"
                size="sm"
                className="h-6 w-6 p-0 text-red-600 hover:text-red-700"
                onClick={() => handleRemove(attachment.id)}
              >
                <Trash2 className="h-3 w-3" />
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );

  const ImagePreview = ({ attachment }: { attachment: MessageAttachment }) => (
    <div className="relative w-full h-full flex items-center justify-center bg-black">
      <img
        src={attachment.url}
        alt={attachment.name}
        className="max-w-full max-h-full object-contain"
        style={{
          transform: `scale(${zoom}) rotate(${rotation}deg)`,
          transition: 'transform 0.2s ease-in-out',
        }}
      />
      
      {/* Zoom and rotation controls */}
      <div className="absolute top-4 right-4 flex gap-2">
        <Button
          variant="secondary"
          size="sm"
          onClick={handleZoomOut}
          disabled={zoom <= 0.25}
        >
          <ZoomOut className="h-4 w-4" />
        </Button>
        <Button
          variant="secondary"
          size="sm"
          onClick={handleZoomIn}
          disabled={zoom >= 3}
        >
          <ZoomIn className="h-4 w-4" />
        </Button>
        <Button
          variant="secondary"
          size="sm"
          onClick={handleRotate}
        >
          <RotateCw className="h-4 w-4" />
        </Button>
        <Button
          variant="secondary"
          size="sm"
          onClick={handleReset}
        >
          Reset
        </Button>
      </div>
    </div>
  );

  const VideoPreview = ({ attachment }: { attachment: MessageAttachment }) => (
    <div className="relative w-full h-full flex items-center justify-center bg-black">
      <video
        src={attachment.url}
        controls
        className="max-w-full max-h-full"
        style={{
          transform: `scale(${zoom})`,
          transition: 'transform 0.2s ease-in-out',
        }}
      />
      
      {/* Zoom controls */}
      <div className="absolute top-4 right-4 flex gap-2">
        <Button
          variant="secondary"
          size="sm"
          onClick={handleZoomOut}
          disabled={zoom <= 0.25}
        >
          <ZoomOut className="h-4 w-4" />
        </Button>
        <Button
          variant="secondary"
          size="sm"
          onClick={handleZoomIn}
          disabled={zoom >= 3}
        >
          <ZoomIn className="h-4 w-4" />
        </Button>
        <Button
          variant="secondary"
          size="sm"
          onClick={handleReset}
        >
          Reset
        </Button>
      </div>
    </div>
  );

  const AudioPreview = ({ attachment }: { attachment: MessageAttachment }) => (
    <div className="w-full h-full flex items-center justify-center bg-gray-100">
      <div className="text-center space-y-4">
        <div className={cn('p-4 rounded-full mx-auto w-fit', getFileColor(attachment.type))}>
          {getFileIcon(attachment.type)}
        </div>
        <h3 className="font-medium">{attachment.name}</h3>
        <audio src={attachment.url} controls className="w-full max-w-md" />
      </div>
    </div>
  );

  const DocumentPreview = ({ attachment }: { attachment: MessageAttachment }) => (
    <div className="w-full h-full flex items-center justify-center bg-gray-100">
      <div className="text-center space-y-4">
        <div className={cn('p-4 rounded-full mx-auto w-fit', getFileColor(attachment.type))}>
          {getFileIcon(attachment.type)}
        </div>
        <h3 className="font-medium">{attachment.name}</h3>
        <p className="text-sm text-muted-foreground">
          {attachment.size && formatFileSize(attachment.size)}
        </p>
        <Button onClick={() => handleDownload(attachment.id)}>
          <Download className="h-4 w-4 mr-2" />
          Download
        </Button>
      </div>
    </div>
  );

  const FullscreenPreview = () => {
    if (selectedIndex === null) return null;
    
    const attachment = attachments[selectedIndex];
    
    return (
      <Dialog open={isFullscreen} onOpenChange={setIsFullscreen}>
        <DialogContent className="max-w-7xl w-full h-[90vh] p-0">
          <DialogHeader className="p-4 border-b">
            <DialogTitle className="flex items-center justify-between">
              <span>{attachment.name}</span>
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handlePrevious}
                  disabled={selectedIndex === 0}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <span className="text-sm text-muted-foreground">
                  {selectedIndex + 1} of {attachments.length}
                </span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleNext}
                  disabled={selectedIndex === attachments.length - 1}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsFullscreen(false)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </DialogTitle>
          </DialogHeader>
          
          <div className="flex-1 overflow-hidden">
            {attachment.type === 'image' && <ImagePreview attachment={attachment} />}
            {attachment.type === 'video' && <VideoPreview attachment={attachment} />}
            {attachment.type === 'audio' && <AudioPreview attachment={attachment} />}
            {attachment.type === 'document' && <DocumentPreview attachment={attachment} />}
          </div>
        </DialogContent>
      </Dialog>
    );
  };

  if (attachments.length === 0) {
    return null;
  }

  return (
    <div className={cn('space-y-4', className)}>
      {/* Thumbnails */}
      {showThumbnails && (
        <ScrollArea style=${ maxHeight }>
          <div className="space-y-4">
            {/* Images */}
            {groupedAttachments.images.length > 0 && (
              <div className="space-y-2">
                <h3 className="text-sm font-medium text-muted-foreground">Images</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {groupedAttachments.images.map((attachment, index) => (
                    <AttachmentThumbnail
                      key={attachment.id}
                      attachment={attachment}
                      index={index}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Videos */}
            {groupedAttachments.videos.length > 0 && (
              <div className="space-y-2">
                <h3 className="text-sm font-medium text-muted-foreground">Videos</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {groupedAttachments.videos.map((attachment, index) => (
                    <AttachmentThumbnail
                      key={attachment.id}
                      attachment={attachment}
                      index={index}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Audio */}
            {groupedAttachments.audio.length > 0 && (
              <div className="space-y-2">
                <h3 className="text-sm font-medium text-muted-foreground">Audio</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {groupedAttachments.audio.map((attachment, index) => (
                    <AttachmentThumbnail
                      key={attachment.id}
                      attachment={attachment}
                      index={index}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Documents */}
            {groupedAttachments.documents.length > 0 && (
              <div className="space-y-2">
                <h3 className="text-sm font-medium text-muted-foreground">Documents</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {groupedAttachments.documents.map((attachment, index) => (
                    <AttachmentThumbnail
                      key={attachment.id}
                      attachment={attachment}
                      index={index}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Other files */}
            {groupedAttachments.other.length > 0 && (
              <div className="space-y-2">
                <h3 className="text-sm font-medium text-muted-foreground">Other Files</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {groupedAttachments.other.map((attachment, index) => (
                    <AttachmentThumbnail
                      key={attachment.id}
                      attachment={attachment}
                      index={index}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>
        </ScrollArea>
      )}

      {/* Fullscreen Preview */}
      <FullscreenPreview />
    </div>
  );
}

export default MediaPreview;
