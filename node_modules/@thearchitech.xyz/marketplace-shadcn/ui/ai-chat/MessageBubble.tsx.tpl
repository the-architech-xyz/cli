'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Copy, Check, ThumbsUp, ThumbsDown, MoreVertical, Bot, User, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from '@/hooks/use-toast';

import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { MarkdownRenderer } from '@/components/ai-chat/MarkdownRenderer';

export interface MessageBubbleProps {
  id: string;
  content: string;
  role: 'user' | 'assistant';
  timestamp: Date;
  isStreaming?: boolean;
  attachments?: Attachment[];
  metadata?: {
    model?: string;
    tokens?: number;
    processingTime?: number;
    sources?: Source[];
  };
  onCopy?: (content: string) => void;
  onLike?: (messageId: string) => void;
  onDislike?: (messageId: string) => void;
  onDelete?: (messageId: string) => void;
  onRegenerate?: (messageId: string) => void;
  className?: string;
  showAvatar?: boolean;
  showTimestamp?: boolean;
  showActions?: boolean;
  isLiked?: boolean;
  isDisliked?: boolean;
}

export interface Attachment {
  id: string;
  name: string;
  type: 'image' | 'document' | 'audio' | 'video';
  url: string;
  size: number;
  thumbnail?: string;
}

export interface Source {
  id: string;
  title: string;
  url: string;
  snippet: string;
  relevance: number;
}

export function MessageBubble({
  id,
  content,
  role,
  timestamp,
  isStreaming = false,
  attachments = [],
  metadata,
  onCopy,
  onLike,
  onDislike,
  onDelete,
  onRegenerate,
  className,
  showAvatar = true,
  showTimestamp = true,
  showActions = true,
  isLiked = false,
  isDisliked = false,
}: MessageBubbleProps) {
  const [copied, setCopied] = useState(false);
  const [isImageLoading, setIsImageLoading] = useState(false);
  const [imageError, setImageError] = useState(false);
  const contentRef = useRef<HTMLDivElement>(null);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(content);
      setCopied(true);
      onCopy?.(content);
      toast({
        title: 'Copied to clipboard',
        description: 'Message content has been copied.',
      });
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('Failed to copy:', error);
      toast({
        title: 'Copy failed',
        description: 'Failed to copy message content.',
        variant: 'destructive',
      });
    }
  };

  const handleLike = () => {
    onLike?.(id);
  };

  const handleDislike = () => {
    onDislike?.(id);
  };

  const handleDelete = () => {
    onDelete?.(id);
  };

  const handleRegenerate = () => {
    onRegenerate?.(id);
  };

  const formatTimestamp = (timestamp: Date): string => {
    return new Intl.DateTimeFormat('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    }).format(timestamp);
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getAttachmentIcon = (type: string) => {
    switch (type) {
      case 'image':
        return '🖼️';
      case 'document':
        return '📄';
      case 'audio':
        return '🎵';
      case 'video':
        return '🎥';
      default:
        return '📎';
    }
  };

  const isUser = role === 'user';
  const isAssistant = role === 'assistant';

  return (
    <div
      className={cn(
        'flex gap-3 group',
        isUser ? 'justify-end' : 'justify-start',
        className
      )}
    >
      {/* Avatar */}
      {showAvatar && !isUser && (
        <Avatar className="h-8 w-8 flex-shrink-0">
          <AvatarImage src="/ai-avatar.png" alt="AI Assistant" />
          <AvatarFallback>
            <Bot className="h-4 w-4" />
          </AvatarFallback>
        </Avatar>
      )}

      {/* Message Content */}
      <div
        className={cn(
          'max-w-[80%] space-y-2',
          isUser ? 'order-1' : 'order-2'
        )}
      >
        <Card
          className={cn(
            'relative transition-all duration-200',
            isUser
              ? 'bg-primary text-primary-foreground'
              : 'bg-muted hover:bg-muted/80',
            'group-hover:shadow-md'
          )}
        >
          <CardContent className="p-3">
            {/* Message Content */}
            <div ref={contentRef} className="space-y-3">
              {isAssistant ? (
                <MarkdownRenderer content={content} />
              ) : (
                <div className="whitespace-pre-wrap break-words">
                  {content}
                </div>
              )}
              
              {/* Streaming Indicator */}
              {isStreaming && (
                <div className="flex items-center gap-1 text-muted-foreground">
                  <Loader2 className="h-3 w-3 animate-spin" />
                  <span className="text-xs">AI is typing...</span>
                </div>
              )}
            </div>

            {/* Attachments */}
            {attachments.length > 0 && (
              <div className="mt-3 space-y-2">
                <Separator className="bg-border/50" />
                <div className="space-y-2">
                  {attachments.map((attachment) => (
                    <div
                      key={attachment.id}
                      className="flex items-center gap-2 p-2 bg-background/50 rounded text-sm"
                    >
                      <span className="text-lg">
                        {getAttachmentIcon(attachment.type)}
                      </span>
                      <div className="flex-1 min-w-0">
                        <p className="truncate font-medium">{attachment.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {formatFileSize(attachment.size)}
                        </p>
                      </div>
                      <Badge variant="secondary" className="text-xs">
                        {attachment.type}
                      </Badge>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Sources */}
            {metadata?.sources && metadata.sources.length > 0 && (
              <div className="mt-3 space-y-2">
                <Separator className="bg-border/50" />
                <div className="space-y-2">
                  <p className="text-xs font-medium text-muted-foreground">
                    Sources:
                  </p>
                  {metadata.sources.map((source) => (
                    <div
                      key={source.id}
                      className="p-2 bg-background/50 rounded text-sm"
                    >
                      <a
                        href={source.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-primary hover:underline"
                      >
                        {source.title}
                      </a>
                      <p className="text-xs text-muted-foreground mt-1">
                        {source.snippet}
                      </p>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge variant="outline" className="text-xs">
                          {Math.round(source.relevance * 100)}% relevant
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Metadata */}
            {metadata && (metadata.model || metadata.tokens || metadata.processingTime) && (
              <div className="mt-3 pt-2 border-t border-border/50">
                <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
                  {metadata.model && (
                    <Badge variant="outline" className="text-xs">
                      {metadata.model}
                    </Badge>
                  )}
                  {metadata.tokens && (
                    <span>{metadata.tokens} tokens</span>
                  )}
                  {metadata.processingTime && (
                    <span>{metadata.processingTime}ms</span>
                  )}
                </div>
              </div>
            )}
          </CardContent>

          {/* Actions */}
          {showActions && (
            <div className="absolute -right-2 -top-2 opacity-0 group-hover:opacity-100 transition-opacity">
              <div className="flex items-center gap-1 bg-background border rounded-full shadow-lg">
                {/* Copy Button */}
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 w-8 p-0"
                  onClick={handleCopy}
                  title="Copy message"
                >
                  {copied ? (
                    <Check className="h-3 w-3 text-green-500" />
                  ) : (
                    <Copy className="h-3 w-3" />
                  )}
                </Button>

                {/* Like/Dislike Buttons (for assistant messages) */}
                {isAssistant && (
                  <>
                    <Button
                      variant="ghost"
                      size="sm"
                      className={cn(
                        'h-8 w-8 p-0',
                        isLiked && 'text-green-500'
                      )}
                      onClick={handleLike}
                      title="Like message"
                    >
                      <ThumbsUp className="h-3 w-3" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className={cn(
                        'h-8 w-8 p-0',
                        isDisliked && 'text-red-500'
                      )}
                      onClick={handleDislike}
                      title="Dislike message"
                    >
                      <ThumbsDown className="h-3 w-3" />
                    </Button>
                  </>
                )}

                {/* More Actions */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 w-8 p-0"
                      title="More actions"
                    >
                      <MoreVertical className="h-3 w-3" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={handleCopy}>
                      <Copy className="mr-2 h-4 w-4" />
                      Copy
                    </DropdownMenuItem>
                    {isAssistant && onRegenerate && (
                      <DropdownMenuItem onClick={handleRegenerate}>
                        <Loader2 className="mr-2 h-4 w-4" />
                        Regenerate
                      </DropdownMenuItem>
                    )}
                    {onDelete && (
                      <DropdownMenuItem 
                        onClick={handleDelete}
                        className="text-destructive"
                      >
                        <ThumbsDown className="mr-2 h-4 w-4" />
                        Delete
                      </DropdownMenuItem>
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          )}
        </Card>

        {/* Timestamp */}
        {showTimestamp && (
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <span>{formatTimestamp(timestamp)}</span>
            {isAssistant && metadata?.model && (
              <>
                <span>•</span>
                <span>{metadata.model}</span>
              </>
            )}
          </div>
        )}
      </div>

      {/* User Avatar */}
      {showAvatar && isUser && (
        <Avatar className="h-8 w-8 flex-shrink-0">
          <AvatarImage src="/user-avatar.png" alt="You" />
          <AvatarFallback>
            <User className="h-4 w-4" />
          </AvatarFallback>
        </Avatar>
      )}
    </div>
  );
}