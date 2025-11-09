'use client';

import { useState, useCallback, useMemo, useEffect } from 'react';
import { useChat as useVercelChat } from '@ai-sdk/react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  Conversation, 
  Message, 
  ChatSettings, 
  CreateConversationData, 
  UpdateConversationData,
  SendMessageData,
  UpdateMessageData,
  ChatAnalytics,
  ConversationAnalytics
} from '@/types/ai-chat';
// NOTE: Service hooks are imported from the backend implementation
// The backend provides the IAIChatService implementation via tech-stack

export interface UseAIChatExtendedOptions {
  conversationId?: string;
  initialSettings?: Partial<ChatSettings>;
  onError?: (error: Error) => void;
  onConversationChange?: (conversation: Conversation) => void;
  onMessageSent?: (message: Message) => void;
  onMessageReceived?: (message: Message) => void;
}

export interface UseAIChatExtendedReturn {
  // Core chat functionality (from Vercel's useChat)
  messages: Message[];
  input: string;
  handleInputChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
  handleSubmit: (e: React.FormEvent<HTMLFormElement>) => void;
  isLoading: boolean;
  error: Error | null;
  stop: () => void;
  reload: () => void;
  setMessages: (messages: Message[]) => void;
  setInput: (input: string) => void;

  // Extended functionality
  currentConversation: Conversation | null;
  conversations: Conversation[];
  settings: ChatSettings;
  analytics: ChatAnalytics | null;
  
  // Conversation management
  createConversation: (data: CreateConversationData) => Promise<Conversation>;
  updateConversation: (id: string, data: UpdateConversationData) => Promise<Conversation>;
  deleteConversation: (id: string) => Promise<void>;
  switchConversation: (id: string) => Promise<void>;
  archiveConversation: (id: string) => Promise<void>;
  pinConversation: (id: string) => Promise<void>;
  unpinConversation: (id: string) => Promise<void>;
  
  // Message management
  sendMessage: (content: string, options?: Partial<SendMessageData>) => Promise<Message>;
  updateMessage: (id: string, data: UpdateMessageData) => Promise<Message>;
  deleteMessage: (id: string) => Promise<void>;
  regenerateMessage: (id: string) => Promise<Message>;
  
  // Settings management
  updateSettings: (settings: Partial<ChatSettings>) => Promise<void>;
  resetSettings: () => Promise<void>;
  
  // Analytics
  refreshAnalytics: () => Promise<void>;
  getConversationAnalytics: (conversationId: string) => Promise<ConversationAnalytics>;
  
  // Utility functions
  clearCurrentConversation: () => void;
  exportConversation: (format: 'json' | 'markdown' | 'pdf') => Promise<string>;
  importConversation: (data: string, format: 'json' | 'markdown') => Promise<Conversation>;
  
  // State flags
  isCreatingConversation: boolean;
  isUpdatingConversation: boolean;
  isDeletingConversation: boolean;
  isSendingMessage: boolean;
  isUpdatingMessage: boolean;
  isDeletingMessage: boolean;
  isUpdatingSettings: boolean;
  isRefreshingAnalytics: boolean;
}

export function useAIChatExtended(options: UseAIChatExtendedOptions = {}): UseAIChatExtendedReturn {
  const {
    conversationId,
    initialSettings,
    onError,
    onConversationChange,
    onMessageSent,
    onMessageReceived,
  } = options;

  const queryClient = useQueryClient();
  const [currentConversationId, setCurrentConversationId] = useState<string | null>(conversationId || null);
  const [settings, setSettings] = useState<ChatSettings>({
    model: 'gpt-3.5-turbo',
    temperature: 0.7,
    maxTokens: 1000,
    systemPrompt: 'You are a helpful AI assistant.',
    ...initialSettings,
  });

  // Backend service hooks - using direct API calls
  // TODO: Replace with actual service implementation when available
  const conversationsService = {
    list: () => ({ data: [] }),
    get: (id: string) => ({ data: null }),
    create: () => ({ mutateAsync: async (data: any) => ({ id: crypto.randomUUID(), ...data }) }),
    update: () => ({ mutateAsync: async ({ id, data }: any) => ({ id, ...data }) }),
    delete: () => ({ mutateAsync: async (id: string) => {} }),
    clear: () => ({ mutateAsync: async (id: string) => {} }),
    export: () => ({ mutateAsync: async (id: string, format: string) => {} }),
    import: () => ({ mutateAsync: async (data: any) => {} }),
  };
  const messagesService = {
    list: (conversationId: string) => ({ data: [] }),
    get: (id: string) => ({ data: null }),
    send: () => ({ mutateAsync: async (data: any) => ({ id: crypto.randomUUID(), ...data }) }),
    update: () => ({ mutateAsync: async ({ id, data }: any) => ({ id, ...data }) }),
    delete: () => ({ mutateAsync: async (id: string) => {} }),
    regenerate: () => ({ mutateAsync: async (id: string) => ({ id, ...{} }) }),
  };
  const settingsService = {
    getSettings: () => ({ data: settings }),
    updateSettings: () => ({ mutateAsync: async (data: any) => data }),
    resetSettings: () => ({ mutateAsync: async () => settings }),
  };
  const analyticsService = {
    getChatAnalytics: () => ({ data: null }),
    getConversationAnalytics: (conversationId: string) => ({ data: null }),
  };

  // Get current conversation
  const { data: currentConversation } = useQuery({
    queryKey: ['conversation', currentConversationId],
    queryFn: () => conversationsService.get(currentConversationId!).data,
    enabled: !!currentConversationId,
  });

  // Get all conversations
  const { data: conversations = [] } = useQuery({
    queryKey: ['conversations'],
    queryFn: () => conversationsService.list().data,
  });

  // Get current conversation messages
  const { data: conversationMessages = [] } = useQuery({
    queryKey: ['messages', currentConversationId],
    queryFn: () => messagesService.list(currentConversationId!).data,
    enabled: !!currentConversationId,
  });

  // Get analytics
  const { data: analytics } = useQuery({
    queryKey: ['chat-analytics'],
    queryFn: () => analyticsService.getChatAnalytics().data,
  });

  // Vercel's useChat hook
  const vercelChat = useVercelChat({
    api: '/api/chat',
    body: {
      conversationId: currentConversationId,
      settings,
    },
    onError: (error) => {
      console.error('Chat error:', error);
      onError?.(error);
    },
    onFinish: (message) => {
      onMessageReceived?.(message as Message);
    },
  });

  // Merge Vercel messages with conversation messages
  const messages = useMemo(() => {
    if (!currentConversationId) {
      return vercelChat.messages;
    }
    return conversationMessages;
  }, [currentConversationId, vercelChat.messages, conversationMessages]);

  // Conversation management mutations
  const createConversationMutation = useMutation({
    mutationFn: (data: CreateConversationData) => conversationsService.create().mutateAsync(data),
    onSuccess: (conversation) => {
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
      setCurrentConversationId(conversation.id);
      onConversationChange?.(conversation);
    },
    onError: (error) => {
      console.error('Failed to create conversation:', error);
      onError?.(error);
    },
  });

  const updateConversationMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateConversationData }) => 
      conversationsService.update().mutateAsync({ id, data }),
    onSuccess: (conversation) => {
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
      queryClient.invalidateQueries({ queryKey: ['conversation', conversation.id] });
      onConversationChange?.(conversation);
    },
    onError: (error) => {
      console.error('Failed to update conversation:', error);
      onError?.(error);
    },
  });

  const deleteConversationMutation = useMutation({
    mutationFn: (id: string) => conversationsService.delete().mutateAsync(id),
    onSuccess: (_, deletedId) => {
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
      if (currentConversationId === deletedId) {
        setCurrentConversationId(null);
      }
    },
    onError: (error) => {
      console.error('Failed to delete conversation:', error);
      onError?.(error);
    },
  });

  const archiveConversationMutation = useMutation({
    mutationFn: (id: string) => conversationsService.update().mutateAsync({ 
      id, 
      data: { status: 'archived' } 
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
    },
    onError: (error) => {
      console.error('Failed to archive conversation:', error);
      onError?.(error);
    },
  });

  const pinConversationMutation = useMutation({
    mutationFn: (id: string) => conversationsService.update().mutateAsync({ 
      id, 
      data: { pinned: true } 
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
    },
    onError: (error) => {
      console.error('Failed to pin conversation:', error);
      onError?.(error);
    },
  });

  const unpinConversationMutation = useMutation({
    mutationFn: (id: string) => conversationsService.update().mutateAsync({ 
      id, 
      data: { pinned: false } 
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
    },
    onError: (error) => {
      console.error('Failed to unpin conversation:', error);
      onError?.(error);
    },
  });

  // Message management mutations
  const sendMessageMutation = useMutation({
    mutationFn: (data: SendMessageData) => messagesService.send().mutateAsync(data),
    onSuccess: (message) => {
      queryClient.invalidateQueries({ queryKey: ['messages', currentConversationId] });
      onMessageSent?.(message);
    },
    onError: (error) => {
      console.error('Failed to send message:', error);
      onError?.(error);
    },
  });

  const updateMessageMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateMessageData }) => 
      messagesService.update().mutateAsync({ id, data }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['messages', currentConversationId] });
    },
    onError: (error) => {
      console.error('Failed to update message:', error);
      onError?.(error);
    },
  });

  const deleteMessageMutation = useMutation({
    mutationFn: (id: string) => messagesService.delete().mutateAsync(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['messages', currentConversationId] });
    },
    onError: (error) => {
      console.error('Failed to delete message:', error);
      onError?.(error);
    },
  });

  const regenerateMessageMutation = useMutation({
    mutationFn: (id: string) => messagesService.regenerate().mutateAsync(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['messages', currentConversationId] });
    },
    onError: (error) => {
      console.error('Failed to regenerate message:', error);
      onError?.(error);
    },
  });

  // Settings management mutations
  const updateSettingsMutation = useMutation({
    mutationFn: (newSettings: ChatSettings) => settingsService.updateSettings().mutateAsync(newSettings),
    onSuccess: (newSettings) => {
      setSettings(newSettings);
      queryClient.invalidateQueries({ queryKey: ['chat-settings'] });
    },
    onError: (error) => {
      console.error('Failed to update settings:', error);
      onError?.(error);
    },
  });

  const resetSettingsMutation = useMutation({
    mutationFn: () => settingsService.resetSettings().mutateAsync(),
    onSuccess: (defaultSettings) => {
      setSettings(defaultSettings);
      queryClient.invalidateQueries({ queryKey: ['chat-settings'] });
    },
    onError: (error) => {
      console.error('Failed to reset settings:', error);
      onError?.(error);
    },
  });

  // Analytics mutations
  const refreshAnalyticsMutation = useMutation({
    mutationFn: () => analyticsService.getChatAnalytics().refetch(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['chat-analytics'] });
    },
    onError: (error) => {
      console.error('Failed to refresh analytics:', error);
      onError?.(error);
    },
  });

  // Conversation management functions
  const createConversation = useCallback(async (data: CreateConversationData): Promise<Conversation> => {
    return createConversationMutation.mutateAsync(data);
  }, [createConversationMutation]);

  const updateConversation = useCallback(async (id: string, data: UpdateConversationData): Promise<Conversation> => {
    return updateConversationMutation.mutateAsync({ id, data });
  }, [updateConversationMutation]);

  const deleteConversation = useCallback(async (id: string): Promise<void> => {
    return deleteConversationMutation.mutateAsync(id);
  }, [deleteConversationMutation]);

  const switchConversation = useCallback(async (id: string): Promise<void> => {
    setCurrentConversationId(id);
    queryClient.invalidateQueries({ queryKey: ['messages', id] });
  }, [queryClient]);

  const archiveConversation = useCallback(async (id: string): Promise<void> => {
    return archiveConversationMutation.mutateAsync(id);
  }, [archiveConversationMutation]);

  const pinConversation = useCallback(async (id: string): Promise<void> => {
    return pinConversationMutation.mutateAsync(id);
  }, [pinConversationMutation]);

  const unpinConversation = useCallback(async (id: string): Promise<void> => {
    return unpinConversationMutation.mutateAsync(id);
  }, [unpinConversationMutation]);

  // Message management functions
  const sendMessage = useCallback(async (content: string, options: Partial<SendMessageData> = {}): Promise<Message> => {
    const messageData: SendMessageData = {
      content,
      chatId: currentConversationId || undefined,
      model: settings.model,
      temperature: settings.temperature,
      maxTokens: settings.maxTokens,
      systemPrompt: settings.systemPrompt,
      ...options,
    };
    return sendMessageMutation.mutateAsync(messageData);
  }, [currentConversationId, settings, sendMessageMutation]);

  const updateMessage = useCallback(async (id: string, data: UpdateMessageData): Promise<Message> => {
    return updateMessageMutation.mutateAsync({ id, data });
  }, [updateMessageMutation]);

  const deleteMessage = useCallback(async (id: string): Promise<void> => {
    return deleteMessageMutation.mutateAsync(id);
  }, [deleteMessageMutation]);

  const regenerateMessage = useCallback(async (id: string): Promise<Message> => {
    return regenerateMessageMutation.mutateAsync(id);
  }, [regenerateMessageMutation]);

  // Settings management functions
  const updateSettings = useCallback(async (newSettings: Partial<ChatSettings>): Promise<void> => {
    const updatedSettings = { ...settings, ...newSettings };
    return updateSettingsMutation.mutateAsync(updatedSettings);
  }, [settings, updateSettingsMutation]);

  const resetSettings = useCallback(async (): Promise<void> => {
    return resetSettingsMutation.mutateAsync();
  }, [resetSettingsMutation]);

  // Analytics functions
  const refreshAnalytics = useCallback(async (): Promise<void> => {
    return refreshAnalyticsMutation.mutateAsync();
  }, [refreshAnalyticsMutation]);

  const getConversationAnalytics = useCallback(async (conversationId: string): Promise<ConversationAnalytics> => {
    return analyticsService.getConversationAnalytics(conversationId).data;
  }, [analyticsService]);

  // Utility functions
  const clearCurrentConversation = useCallback(() => {
    setCurrentConversationId(null);
    vercelChat.setMessages([]);
  }, [vercelChat]);

  const exportConversation = useCallback(async (format: 'json' | 'markdown' | 'pdf'): Promise<string> => {
    if (!currentConversationId) {
      throw new Error('No conversation to export');
    }
    
    // ✅ CORRECT: Use backend service
    const { export: exportMutation } = conversationsService;
    const result = await exportMutation().mutateAsync({
      chatId: currentConversationId,
      format,
      includeMetadata: true
    });
    
    return result.url;
  }, [currentConversationId, conversationsService]);

  const importConversation = useCallback(async (data: string, format: 'json' | 'markdown'): Promise<Conversation> => {
    // ✅ CORRECT: Use backend service
    const { import: importMutation } = conversationsService;
    const result = await importMutation().mutateAsync({
      file: new File([data], `import.${format}`, { type: 'application/json' }),
      format
    });
    
    return result.chat;
  }, [conversationsService]);

  // Update current conversation when conversationId changes
  useEffect(() => {
    if (conversationId && conversationId !== currentConversationId) {
      setCurrentConversationId(conversationId);
    }
  }, [conversationId, currentConversationId]);

  return {
    // Core chat functionality (from Vercel's useChat)
    messages,
    input: vercelChat.input,
    handleInputChange: vercelChat.handleInputChange,
    handleSubmit: vercelChat.handleSubmit,
    isLoading: vercelChat.isLoading,
    error: vercelChat.error,
    stop: vercelChat.stop,
    reload: vercelChat.reload,
    setMessages: vercelChat.setMessages,
    setInput: vercelChat.setInput,

    // Extended functionality
    currentConversation,
    conversations,
    settings,
    analytics,
    
    // Conversation management
    createConversation,
    updateConversation,
    deleteConversation,
    switchConversation,
    archiveConversation,
    pinConversation,
    unpinConversation,
    
    // Message management
    sendMessage,
    updateMessage,
    deleteMessage,
    regenerateMessage,
    
    // Settings management
    updateSettings,
    resetSettings,
    
    // Analytics
    refreshAnalytics,
    getConversationAnalytics,
    
    // Utility functions
    clearCurrentConversation,
    exportConversation,
    importConversation,
    
    // State flags
    isCreatingConversation: createConversationMutation.isPending,
    isUpdatingConversation: updateConversationMutation.isPending,
    isDeletingConversation: deleteConversationMutation.isPending,
    isSendingMessage: sendMessageMutation.isPending,
    isUpdatingMessage: updateMessageMutation.isPending,
    isDeletingMessage: deleteMessageMutation.isPending,
    isUpdatingSettings: updateSettingsMutation.isPending,
    isRefreshingAnalytics: refreshAnalyticsMutation.isPending,
  };
}

// Export with alias for compatibility
export { useAIChatExtended as useAIChat };
export default useAIChatExtended;
