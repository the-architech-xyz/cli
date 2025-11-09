'use client';

import React, { useRef, useEffect, useState, useMemo } from 'react';
import { useChat } from '@ai-sdk/react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  Bot, 
  User, 
  Copy, 
  Trash2, 
  RotateCcw, 
  Search, 
  Filter,
  MoreVertical,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { Message, MessageRole, MessageStatus } from '@/types/ai-chat';

export interface MessageHistoryProps {
  className?: string;
  showSearch?: boolean;
  showFilters?: boolean;
  maxHeight?: string;
  onMessageAction?: (action: 'copy' | 'delete' | 'regenerate', messageId: string) => void;
  onSearch?: (query: string) => void;
  onFilter?: (filters: MessageFilters) => void;
}

export interface MessageFilters {
  role?: MessageRole;
  status?: MessageStatus;
  dateRange?: {
    start: Date;
    end: Date;
  };
  searchQuery?: string;
}

export function MessageHistory({
  className,
  showSearch = true,
  showFilters = true,
  maxHeight = '600px',
  onMessageAction,
  onSearch,
  onFilter,
}: MessageHistoryProps) {
  const { messages, isLoading, error } = useChat();
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState<MessageFilters>({});
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());
  const [showFiltersPanel, setShowFiltersPanel] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Group messages by date
  const groupedMessages = useMemo(() => {
    const groups: Record<string, Message[]> = {};
    
    messages.forEach((message) => {
      const date = new Date(message.timestamp).toDateString();
      if (!groups[date]) {
        groups[date] = [];
      }
      groups[date].push(message);
    });

    return groups;
  }, [messages]);

  // Filter messages based on search and filters
  const filteredMessages = useMemo(() => {
    let filtered = messages;

    // Apply search filter
    if (searchQuery) {
      filtered = filtered.filter(message =>
        message.content.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Apply role filter
    if (filters.role) {
      filtered = filtered.filter(message => message.role === filters.role);
    }

    // Apply status filter
    if (filters.status) {
      filtered = filtered.filter(message => message.status === filters.status);
    }

    // Apply date range filter
    if (filters.dateRange) {
      filtered = filtered.filter(message => {
        const messageDate = new Date(message.timestamp);
        return messageDate >= filters.dateRange!.start && messageDate <= filters.dateRange!.end;
      });
    }

    return filtered;
  }, [messages, searchQuery, filters]);

  // Group filtered messages by date
  const filteredGroupedMessages = useMemo(() => {
    const groups: Record<string, Message[]> = {};
    
    filteredMessages.forEach((message) => {
      const date = new Date(message.timestamp).toDateString();
      if (!groups[date]) {
        groups[date] = [];
      }
      groups[date].push(message);
    });

    return groups;
  }, [filteredMessages]);

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    onSearch?.(query);
  };

  const handleFilterChange = (newFilters: Partial<MessageFilters>) => {
    const updatedFilters = { ...filters, ...newFilters };
    setFilters(updatedFilters);
    onFilter?.(updatedFilters);
  };

  const toggleGroup = (date: string) => {
    const newExpanded = new Set(expandedGroups);
    if (newExpanded.has(date)) {
      newExpanded.delete(date);
    } else {
      newExpanded.add(date);
    }
    setExpandedGroups(newExpanded);
  };

  const copyMessage = (content: string) => {
    navigator.clipboard.writeText(content);
  };

  const formatTimestamp = (timestamp: string): string => {
    return new Intl.DateTimeFormat('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    }).format(new Date(timestamp));
  };

  const formatDate = (date: string): string => {
    const messageDate = new Date(date);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (messageDate.toDateString() === today.toDateString()) {
      return 'Today';
    } else if (messageDate.toDateString() === yesterday.toDateString()) {
      return 'Yesterday';
    } else {
      return messageDate.toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });
    }
  };

  const getStatusColor = (status: MessageStatus): string => {
    switch (status) {
      case 'sending':
        return 'bg-yellow-500';
      case 'sent':
        return 'bg-green-500';
      case 'failed':
        return 'bg-red-500';
      case 'streaming':
        return 'bg-blue-500';
      default:
        return 'bg-gray-500';
    }
  };

  const getStatusText = (status: MessageStatus): string => {
    switch (status) {
      case 'sending':
        return 'Sending...';
      case 'sent':
        return 'Sent';
      case 'failed':
        return 'Failed';
      case 'streaming':
        return 'Streaming...';
      default:
        return 'Unknown';
    }
  };

  if (error) {
    return (
      <div className={cn('flex items-center justify-center h-32', className)}>
        <Card className="w-full max-w-md">
          <CardContent className="p-6 text-center">
            <div className="text-red-500 mb-2">Error loading messages</div>
            <div className="text-sm text-muted-foreground">{error.message}</div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className={cn('flex flex-col h-full', className)}>
      {/* Search and Filters */}
      {(showSearch || showFilters) && (
        <div className="p-4 border-b space-y-3">
          {showSearch && (
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                ref={searchInputRef}
                placeholder="Search messages..."
                value={searchQuery}
                onChange={(e) => handleSearch(e.target.value)}
                className="pl-10"
              />
            </div>
          )}
          
          {showFilters && (
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowFiltersPanel(!showFiltersPanel)}
              >
                <Filter className="h-4 w-4 mr-2" />
                Filters
                {showFiltersPanel ? (
                  <ChevronUp className="h-4 w-4 ml-2" />
                ) : (
                  <ChevronDown className="h-4 w-4 ml-2" />
                )}
              </Button>
              
              {Object.keys(filters).length > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setFilters({});
                    setSearchQuery('');
                  }}
                >
                  Clear
                </Button>
              )}
            </div>
          )}

          {/* Filters Panel */}
          {showFiltersPanel && (
            <div className="grid grid-cols-2 gap-4 p-4 bg-muted rounded-lg">
              <div>
                <label className="text-sm font-medium mb-2 block">Role</label>
                <select
                  value={filters.role || ''}
                  onChange={(e) => handleFilterChange({ role: e.target.value as MessageRole || undefined })}
                  className="w-full p-2 border rounded"
                >
                  <option value="">All</option>
                  <option value="user">User</option>
                  <option value="assistant">Assistant</option>
                  <option value="system">System</option>
                </select>
              </div>
              
              <div>
                <label className="text-sm font-medium mb-2 block">Status</label>
                <select
                  value={filters.status || ''}
                  onChange={(e) => handleFilterChange({ status: e.target.value as MessageStatus || undefined })}
                  className="w-full p-2 border rounded"
                >
                  <option value="">All</option>
                  <option value="sending">Sending</option>
                  <option value="sent">Sent</option>
                  <option value="failed">Failed</option>
                  <option value="streaming">Streaming</option>
                </select>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Messages */}
      <ScrollArea className="flex-1" style=${ maxHeight }>
        <div className="p-4 space-y-6">
          {Object.keys(filteredGroupedMessages).length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 text-center">
              <Bot className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">
                {searchQuery || Object.keys(filters).length > 0 ? 'No messages found' : 'No messages yet'}
              </h3>
              <p className="text-muted-foreground">
                {searchQuery || Object.keys(filters).length > 0 
                  ? 'Try adjusting your search or filters'
                  : 'Start a conversation to see messages here'
                }
              </p>
            </div>
          ) : (
            Object.entries(filteredGroupedMessages)
              .sort(([a], [b]) => new Date(b).getTime() - new Date(a).getTime())
              .map(([date, messages]) => (
                <div key={date} className="space-y-4">
                  {/* Date Header */}
                  <div className="flex items-center gap-4">
                    <Separator className="flex-1" />
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-muted-foreground">
                        {formatDate(date)}
                      </span>
                      <Badge variant="secondary" className="text-xs">
                        {messages.length} message{messages.length !== 1 ? 's' : ''}
                      </Badge>
                    </div>
                    <Separator className="flex-1" />
                  </div>

                  {/* Messages for this date */}
                  <div className="space-y-4">
                    {messages
                      .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime())
                      .map((message) => (
                        <div
                          key={message.id}
                          className={cn(
                            'flex gap-3',
                            message.role === 'user' ? 'justify-end' : 'justify-start'
                          )}
                        >
                          {message.role === 'assistant' && (
                            <Avatar className="h-8 w-8 flex-shrink-0">
                              <AvatarImage src="/ai-avatar.png" alt="AI Assistant" />
                              <AvatarFallback>
                                <Bot className="h-4 w-4" />
                              </AvatarFallback>
                            </Avatar>
                          )}
                          
                          <div
                            className={cn(
                              'max-w-[80%] space-y-2',
                              message.role === 'user' ? 'order-1' : 'order-2'
                            )}
                          >
                            <Card
                              className={cn(
                                message.role === 'user'
                                  ? 'bg-primary text-primary-foreground'
                                  : 'bg-muted'
                              )}
                            >
                              <CardContent className="p-3">
                                <div className="whitespace-pre-wrap break-words">
                                  {message.content}
                                  {message.status === 'streaming' && (
                                    <span className="inline-block w-2 h-4 bg-current animate-pulse ml-1" />
                                  )}
                                </div>
                                
                                {message.attachments && message.attachments.length > 0 && (
                                  <div className="mt-2 space-y-1">
                                    {message.attachments.map((attachment) => (
                                      <div
                                        key={attachment.id}
                                        className="flex items-center gap-2 p-2 bg-background/50 rounded text-sm"
                                      >
                                        <span className="truncate">{attachment.name}</span>
                                        <Badge variant="secondary" className="text-xs">
                                          {attachment.type}
                                        </Badge>
                                      </div>
                                    ))}
                                  </div>
                                )}
                              </CardContent>
                            </Card>
                            
                            <div className="flex items-center gap-2 text-xs text-muted-foreground">
                              <span>{formatTimestamp(message.timestamp)}</span>
                              
                              {/* Status indicator */}
                              <div className="flex items-center gap-1">
                                <div className={cn('w-2 h-2 rounded-full', getStatusColor(message.status))} />
                                <span className="text-xs">{getStatusText(message.status)}</span>
                              </div>
                              
                              {/* Message actions */}
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                                    <MoreVertical className="h-3 w-3" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  <DropdownMenuItem
                                    onClick={() => copyMessage(message.content)}
                                  >
                                    <Copy className="h-3 w-3 mr-2" />
                                    Copy
                                  </DropdownMenuItem>
                                  {message.role === 'user' && (
                                    <DropdownMenuItem
                                      onClick={() => onMessageAction?.('regenerate', message.id)}
                                    >
                                      <RotateCcw className="h-3 w-3 mr-2" />
                                      Regenerate
                                    </DropdownMenuItem>
                                  )}
                                  <DropdownMenuItem
                                    onClick={() => onMessageAction?.('delete', message.id)}
                                    className="text-red-600"
                                  >
                                    <Trash2 className="h-3 w-3 mr-2" />
                                    Delete
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </div>
                          </div>
                          
                          {message.role === 'user' && (
                            <Avatar className="h-8 w-8 flex-shrink-0">
                              <AvatarImage src="/user-avatar.png" alt="You" />
                              <AvatarFallback>
                                <User className="h-4 w-4" />
                              </AvatarFallback>
                            </Avatar>
                          )}
                        </div>
                      ))}
                  </div>
                </div>
              ))
          )}
          
          <div ref={messagesEndRef} />
        </div>
      </ScrollArea>
    </div>
  );
}

export default MessageHistory;
