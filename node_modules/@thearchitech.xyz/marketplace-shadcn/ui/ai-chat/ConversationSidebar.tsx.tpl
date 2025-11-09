'use client';

import React, { useState, useMemo } from 'react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Plus, 
  Search, 
  MoreVertical, 
  MessageSquare, 
  Archive, 
  Trash2, 
  Edit3,
  Pin,
  PinOff,
  Calendar,
  Clock,
  Bot,
  User
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Conversation, CreateConversationData, UpdateConversationData } from '@/types/ai-chat';

export interface ConversationSidebarProps {
  conversations: Conversation[];
  activeConversationId?: string;
  onConversationSelect: (conversationId: string) => void;
  onConversationCreate: (data: CreateConversationData) => void;
  onConversationUpdate: (id: string, data: UpdateConversationData) => void;
  onConversationDelete: (id: string) => void;
  onConversationArchive: (id: string) => void;
  onConversationPin: (id: string) => void;
  onConversationUnpin: (id: string) => void;
  className?: string;
  showSearch?: boolean;
  showCreateButton?: boolean;
  maxHeight?: string;
  isLoading?: boolean;
  error?: string | null;
}

export interface ConversationFilters {
  search?: string;
  status?: 'active' | 'archived';
  pinned?: boolean;
  dateRange?: {
    start: Date;
    end: Date;
  };
}

export function ConversationSidebar({
  conversations,
  activeConversationId,
  onConversationSelect,
  onConversationCreate,
  onConversationUpdate,
  onConversationDelete,
  onConversationArchive,
  onConversationPin,
  onConversationUnpin,
  className,
  showSearch = true,
  showCreateButton = true,
  maxHeight = '600px',
  isLoading = false,
  error = null,
}: ConversationSidebarProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState<ConversationFilters>({});
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');

  // Filter conversations based on search and filters
  const filteredConversations = useMemo(() => {
    let filtered = conversations;

    // Apply search filter
    if (searchQuery) {
      filtered = filtered.filter(conversation =>
        conversation.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        conversation.description?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Apply status filter
    if (filters.status) {
      filtered = filtered.filter(conversation => conversation.status === filters.status);
    }

    // Apply pinned filter
    if (filters.pinned !== undefined) {
      filtered = filtered.filter(conversation => 
        filters.pinned ? conversation.pinned : !conversation.pinned
      );
    }

    // Apply date range filter
    if (filters.dateRange) {
      filtered = filtered.filter(conversation => {
        const conversationDate = new Date(conversation.updatedAt);
        return conversationDate >= filters.dateRange!.start && conversationDate <= filters.dateRange!.end;
      });
    }

    return filtered;
  }, [conversations, searchQuery, filters]);

  // Group conversations by status and pinned state
  const groupedConversations = useMemo(() => {
    const groups = {
      pinned: [] as Conversation[],
      active: [] as Conversation[],
      archived: [] as Conversation[],
    };

    filteredConversations.forEach(conversation => {
      if (conversation.pinned) {
        groups.pinned.push(conversation);
      } else if (conversation.status === 'active') {
        groups.active.push(conversation);
      } else if (conversation.status === 'archived') {
        groups.archived.push(conversation);
      }
    });

    // Sort each group by updatedAt (most recent first)
    Object.keys(groups).forEach(key => {
      groups[key as keyof typeof groups].sort((a, b) => 
        new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
      );
    });

    return groups;
  }, [filteredConversations]);

  const handleCreateConversation = () => {
    const title = `New Conversation ${conversations.length + 1}`;
    onConversationCreate({ title });
  };

  const handleEditStart = (conversation: Conversation) => {
    setEditingId(conversation.id);
    setEditTitle(conversation.title);
  };

  const handleEditSave = () => {
    if (editingId && editTitle.trim()) {
      onConversationUpdate(editingId, { title: editTitle.trim() });
      setEditingId(null);
      setEditTitle('');
    }
  };

  const handleEditCancel = () => {
    setEditingId(null);
    setEditTitle('');
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleEditSave();
    } else if (e.key === 'Escape') {
      handleEditCancel();
    }
  };

  const formatDate = (date: string): string => {
    const messageDate = new Date(date);
    const now = new Date();
    const diffInHours = (now.getTime() - messageDate.getTime()) / (1000 * 60 * 60);

    if (diffInHours < 1) {
      return 'Just now';
    } else if (diffInHours < 24) {
      return `${Math.floor(diffInHours)}h ago`;
    } else if (diffInHours < 48) {
      return 'Yesterday';
    } else {
      return messageDate.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
      });
    }
  };

  const getConversationIcon = (conversation: Conversation) => {
    if (conversation.pinned) {
      return <Pin className="h-4 w-4 text-yellow-500" />;
    }
    return <MessageSquare className="h-4 w-4" />;
  };

  const ConversationItem = ({ conversation }: { conversation: Conversation }) => {
    const isActive = conversation.id === activeConversationId;
    const isEditing = editingId === conversation.id;

    return (
      <Card
        className={cn(
          'cursor-pointer transition-all duration-200 hover:shadow-md',
          isActive && 'ring-2 ring-primary bg-primary/5',
          conversation.pinned && 'border-yellow-200 bg-yellow-50/50'
        )}
        onClick={() => !isEditing && onConversationSelect(conversation.id)}
      >
        <CardContent className="p-3">
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0 mt-0.5">
              {getConversationIcon(conversation)}
            </div>
            
            <div className="flex-1 min-w-0">
              {isEditing ? (
                <Input
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  onKeyDown={handleKeyDown}
                  onBlur={handleEditSave}
                  className="h-6 text-sm"
                  autoFocus
                />
              ) : (
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <h3 className="font-medium text-sm truncate">
                      {conversation.title}
                    </h3>
                    {conversation.pinned && (
                      <Pin className="h-3 w-3 text-yellow-500" />
                    )}
                  </div>
                  
                  {conversation.description && (
                    <p className="text-xs text-muted-foreground truncate">
                      {conversation.description}
                    </p>
                  )}
                  
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <MessageSquare className="h-3 w-3" />
                      <span>{conversation.messageCount}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      <span>{formatDate(conversation.updatedAt)}</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
            
            {!isEditing && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <MoreVertical className="h-3 w-3" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => handleEditStart(conversation)}>
                    <Edit3 className="h-3 w-3 mr-2" />
                    Rename
                  </DropdownMenuItem>
                  
                  <DropdownMenuItem
                    onClick={() => 
                      conversation.pinned 
                        ? onConversationUnpin(conversation.id)
                        : onConversationPin(conversation.id)
                    }
                  >
                    {conversation.pinned ? (
                      <>
                        <PinOff className="h-3 w-3 mr-2" />
                        Unpin
                      </>
                    ) : (
                      <>
                        <Pin className="h-3 w-3 mr-2" />
                        Pin
                      </>
                    )}
                  </DropdownMenuItem>
                  
                  <DropdownMenuSeparator />
                  
                  <DropdownMenuItem
                    onClick={() => onConversationArchive(conversation.id)}
                    disabled={conversation.status === 'archived'}
                  >
                    <Archive className="h-3 w-3 mr-2" />
                    Archive
                  </DropdownMenuItem>
                  
                  <DropdownMenuItem
                    onClick={() => onConversationDelete(conversation.id)}
                    className="text-red-600"
                  >
                    <Trash2 className="h-3 w-3 mr-2" />
                    Delete
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>
        </CardContent>
      </Card>
    );
  };

  if (error) {
    return (
      <div className={cn('p-4', className)}>
        <Card className="w-full">
          <CardContent className="p-6 text-center">
            <div className="text-red-500 mb-2">Error loading conversations</div>
            <div className="text-sm text-muted-foreground">{error}</div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className={cn('flex flex-col h-full bg-background', className)}>
      {/* Header */}
      <div className="p-4 border-b">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">Conversations</h2>
          {showCreateButton && (
            <Button onClick={handleCreateConversation} size="sm">
              <Plus className="h-4 w-4 mr-2" />
              New Chat
            </Button>
          )}
        </div>
        
        {showSearch && (
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search conversations..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        )}
      </div>

      {/* Conversations List */}
      <ScrollArea className="flex-1" style=${ maxHeight }>
        <div className="p-4 space-y-6">
          {isLoading ? (
            <div className="space-y-3">
              {[...Array(5)].map((_, i) => (
                <Card key={i} className="animate-pulse">
                  <CardContent className="p-3">
                    <div className="flex items-start gap-3">
                      <div className="w-4 h-4 bg-muted rounded" />
                      <div className="flex-1 space-y-2">
                        <div className="h-4 bg-muted rounded w-3/4" />
                        <div className="h-3 bg-muted rounded w-1/2" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <>
              {/* Pinned Conversations */}
              {groupedConversations.pinned.length > 0 && (
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                    <Pin className="h-4 w-4" />
                    Pinned
                  </div>
                  {groupedConversations.pinned.map((conversation) => (
                    <ConversationItem key={conversation.id} conversation={conversation} />
                  ))}
                </div>
              )}

              {/* Active Conversations */}
              {groupedConversations.active.length > 0 && (
                <div className="space-y-3">
                  {groupedConversations.pinned.length > 0 && <Separator />}
                  <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                    <MessageSquare className="h-4 w-4" />
                    Recent
                  </div>
                  {groupedConversations.active.map((conversation) => (
                    <ConversationItem key={conversation.id} conversation={conversation} />
                  ))}
                </div>
              )}

              {/* Archived Conversations */}
              {groupedConversations.archived.length > 0 && (
                <div className="space-y-3">
                  <Separator />
                  <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                    <Archive className="h-4 w-4" />
                    Archived
                  </div>
                  {groupedConversations.archived.map((conversation) => (
                    <ConversationItem key={conversation.id} conversation={conversation} />
                  ))}
                </div>
              )}

              {/* Empty State */}
              {filteredConversations.length === 0 && (
                <div className="flex flex-col items-center justify-center h-64 text-center">
                  <MessageSquare className="h-12 w-12 text-muted-foreground mb-4" />
                  <h3 className="text-lg font-semibold mb-2">
                    {searchQuery ? 'No conversations found' : 'No conversations yet'}
                  </h3>
                  <p className="text-muted-foreground mb-4">
                    {searchQuery 
                      ? 'Try adjusting your search terms'
                      : 'Start a new conversation to get started'
                    }
                  </p>
                  {!searchQuery && showCreateButton && (
                    <Button onClick={handleCreateConversation}>
                      <Plus className="h-4 w-4 mr-2" />
                      Create First Conversation
                    </Button>
                  )}
                </div>
              )}
            </>
          )}
        </div>
      </ScrollArea>
    </div>
  );
}

export default ConversationSidebar;
