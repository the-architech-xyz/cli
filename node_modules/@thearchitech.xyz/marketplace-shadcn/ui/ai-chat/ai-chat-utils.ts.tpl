/**
 * AI Chat Utilities
 * 
 * Utility functions for AI chat functionality.
 * Based on modern Next.js and TypeScript best practices.
 */

import { 
  ChatMessage, 
  ChatSession, 
  ChatConfig, 
  UsageStats, 
  ChatError,
  ChatFile,
  ChatTemplate,
  TemplateVariable,
  ChatExport,
  ChatImport
} from './ai-chat-types';

// Message utilities
export const generateMessageId = (): string => {
  return Math.random().toString(36).substring(2) + Date.now().toString(36);
};

export const createMessage = (
  role: 'user' | 'assistant' | 'system',
  content: string,
  metadata?: any
): ChatMessage => {
  return {
    id: generateMessageId(),
    role,
    content,
    timestamp: new Date(),
    metadata,
  };
};

export const formatMessageContent = (content: string): string => {
  // Convert markdown to HTML for better display
  return content
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.*?)\*/g, '<em>$1</em>')
    .replace(/`(.*?)`/g, '<code>$1</code>')
    .replace(/```([\s\S]*?)```/g, '<pre><code>$1</code></pre>')
    .replace(/\n/g, '<br>');
};

export const extractCodeBlocks = (content: string): Array<{ language: string; code: string }> => {
  const codeBlockRegex = /```(\w+)?\n([\s\S]*?)```/g;
  const blocks: Array<{ language: string; code: string }> = [];
  let match;

  while ((match = codeBlockRegex.exec(content)) !== null) {
    blocks.push({
      language: match[1] || 'text',
      code: match[2].trim(),
    });
  }

  return blocks;
};

export const extractInlineCode = (content: string): string[] => {
  const inlineCodeRegex = /`([^`]+)`/g;
  const codes: string[] = [];
  let match;

  while ((match = inlineCodeRegex.exec(content)) !== null) {
    codes.push(match[1]);
  }

  return codes;
};

// Session utilities
export const generateSessionId = (): string => {
  return Math.random().toString(36).substring(2) + Date.now().toString(36);
};

export const createSession = (title: string, messages: ChatMessage[] = []): ChatSession => {
  return {
    id: generateSessionId(),
    title,
    messages,
    createdAt: new Date(),
    updatedAt: new Date(),
  };
};

export const updateSessionTitle = (session: ChatSession, newTitle: string): ChatSession => {
  return {
    ...session,
    title: newTitle,
    updatedAt: new Date(),
  };
};

export const addMessageToSession = (session: ChatSession, message: ChatMessage): ChatSession => {
  return {
    ...session,
    messages: [...session.messages, message],
    updatedAt: new Date(),
  };
};

export const removeMessageFromSession = (session: ChatSession, messageId: string): ChatSession => {
  return {
    ...session,
    messages: session.messages.filter(msg => msg.id !== messageId),
    updatedAt: new Date(),
  };
};

export const clearSessionMessages = (session: ChatSession): ChatSession => {
  return {
    ...session,
    messages: [],
    updatedAt: new Date(),
  };
};

// Token and cost utilities
export const estimateTokens = (text: string): number => {
  // Rough estimation: 1 token ≈ 4 characters for English text
  return Math.ceil(text.length / 4);
};

export const calculateCost = (
  inputTokens: number,
  outputTokens: number,
  inputCostPer1K: number,
  outputCostPer1K: number
): number => {
  const inputCost = (inputTokens / 1000) * inputCostPer1K;
  const outputCost = (outputTokens / 1000) * outputCostPer1K;
  return inputCost + outputCost;
};

export const formatCost = (cost: number): string => {
  if (cost < 0.001) {
    return '< $0.001';
  }
  return `$${cost.toFixed(4)}`;
};

export const formatTokens = (tokens: number): string => {
  if (tokens < 1000) {
    return `${tokens} tokens`;
  }
  return `${(tokens / 1000).toFixed(1)}K tokens`;
};

// Usage statistics utilities
export const calculateUsageStats = (sessions: ChatSession[]): UsageStats => {
  let totalTokens = 0;
  let totalCost = 0;
  let totalRequests = 0;
  let totalMessages = 0;
  const usageByModel: Record<string, any> = {};
  const usageByProvider: Record<string, any> = {};

  sessions.forEach(session => {
    session.messages.forEach(message => {
      if (message.metadata?.tokens) {
        totalTokens += message.metadata.tokens;
        totalMessages++;
      }
      if (message.metadata?.cost) {
        totalCost += message.metadata.cost;
      }
      if (message.role === 'user') {
        totalRequests++;
      }

      // Track by model
      if (message.metadata?.model) {
        const model = message.metadata.model;
        if (!usageByModel[model]) {
          usageByModel[model] = { requests: 0, tokens: 0, cost: 0 };
        }
        usageByModel[model].requests++;
        usageByModel[model].tokens += message.metadata.tokens || 0;
        usageByModel[model].cost += message.metadata.cost || 0;
      }

      // Track by provider
      if (message.metadata?.provider) {
        const provider = message.metadata.provider;
        if (!usageByProvider[provider]) {
          usageByProvider[provider] = { requests: 0, tokens: 0, cost: 0 };
        }
        usageByProvider[provider].requests++;
        usageByProvider[provider].tokens += message.metadata.tokens || 0;
        usageByProvider[provider].cost += message.metadata.cost || 0;
      }
    });
  });

  return {
    totalTokens,
    totalCost,
    totalRequests,
    totalMessages,
    averageTokensPerMessage: totalMessages > 0 ? totalTokens / totalMessages : 0,
    averageCostPerMessage: totalMessages > 0 ? totalCost / totalMessages : 0,
    usageByModel,
    usageByProvider,
    dailyUsage: [], // Would be calculated separately
    monthlyUsage: [], // Would be calculated separately
  };
};

// File utilities
export const validateFile = (file: File, maxSize: number, allowedTypes: string[]): { valid: boolean; error?: string } => {
  if (file.size > maxSize * 1024 * 1024) {
    return { valid: false, error: `File size must be less than ${maxSize}MB` };
  }

  if (!allowedTypes.includes(file.type)) {
    return { valid: false, error: `File type ${file.type} is not allowed` };
  }

  return { valid: true };
};

export const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

export const getFileIcon = (mimeType: string): string => {
  if (mimeType.startsWith('image/')) return '🖼️';
  if (mimeType.startsWith('video/')) return '🎥';
  if (mimeType.startsWith('audio/')) return '🎵';
  if (mimeType.includes('pdf')) return '📄';
  if (mimeType.includes('text/')) return '📝';
  if (mimeType.includes('application/zip') || mimeType.includes('application/x-rar')) return '📦';
  return '📎';
};

// Template utilities
export const processTemplate = (template: ChatTemplate, variables: Record<string, any>): string => {
  let content = template.content;

  template.variables.forEach(variable => {
    const value = variables[variable.name] ?? variable.defaultValue;
    if (value !== undefined) {
      const placeholder = `${${variable.name}}`;
      content = content.replace(new RegExp(placeholder, 'g'), String(value));
    }
  });

  return content;
};

export const extractTemplateVariables = (content: string): string[] => {
  const variableRegex = /\{\{(\w+)\}\}/g;
  const variables: string[] = [];
  let match;

  while ((match = variableRegex.exec(content)) !== null) {
    if (!variables.includes(match[1])) {
      variables.push(match[1]);
    }
  }

  return variables;
};

export const validateTemplate = (template: ChatTemplate): { valid: boolean; errors: string[] } => {
  const errors: string[] = [];

  if (!template.name.trim()) {
    errors.push('Template name is required');
  }

  if (!template.content.trim()) {
    errors.push('Template content is required');
  }

  const contentVariables = extractTemplateVariables(template.content);
  const definedVariables = template.variables.map(v => v.name);

  contentVariables.forEach(variable => {
    if (!definedVariables.includes(variable)) {
      errors.push(`Variable "${variable}" is used in content but not defined`);
    }
  });

  definedVariables.forEach(variable => {
    if (!contentVariables.includes(variable)) {
      errors.push(`Variable "${variable}" is defined but not used in content`);
    }
  });

  return {
    valid: errors.length === 0,
    errors,
  };
};

// Export/Import utilities
export const exportChatData = (sessions: ChatSession[], config: ChatConfig): ChatExport => {
  const allMessages = sessions.flatMap(session => session.messages);
  const dateRange = {
    from: new Date(Math.min(...sessions.map(s => s.createdAt.getTime()))),
    to: new Date(Math.max(...sessions.map(s => s.updatedAt.getTime()))),
  };

  return {
    sessions,
    messages: allMessages,
    config,
    exportedAt: new Date(),
    version: '1.0.0',
    metadata: {
      totalSessions: sessions.length,
      totalMessages: allMessages.length,
      dateRange,
    },
  };
};

export const importChatData = (data: ChatImport): { sessions: ChatSession[]; errors: string[] } => {
  const errors: string[] = [];
  const sessions: ChatSession[] = [];

  try {
    // Validate and process sessions
    data.sessions.forEach((session, index) => {
      if (!session.id || !session.title) {
        errors.push(`Session ${index + 1}: Missing required fields (id, title)`);
        return;
      }

      // Ensure dates are properly parsed
      const processedSession: ChatSession = {
        ...session,
        createdAt: new Date(session.createdAt),
        updatedAt: new Date(session.updatedAt),
        messages: session.messages.map(msg => ({
          ...msg,
          timestamp: new Date(msg.timestamp),
        })),
      };

      sessions.push(processedSession);
    });
  } catch (error) {
    errors.push(`Import failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }

  return { sessions, errors };
};

// Error utilities
export const createChatError = (
  code: string,
  message: string,
  type: ChatError['type'] = 'unknown',
  retryable: boolean = false
): ChatError => {
  return {
    code,
    message,
    type,
    timestamp: new Date(),
    retryable,
  };
};

export const handleChatError = (error: any): ChatError => {
  if (error.code && error.message) {
    return error as ChatError;
  }

  // Handle common error types
  if (error.name === 'NetworkError' || error.message?.includes('network')) {
    return createChatError('NETWORK_ERROR', 'Network connection failed', 'network', true);
  }

  if (error.name === 'RateLimitError' || error.message?.includes('rate limit')) {
    return createChatError('RATE_LIMIT_ERROR', 'Rate limit exceeded', 'rate_limit', true);
  }

  if (error.name === 'QuotaExceededError' || error.message?.includes('quota')) {
    return createChatError('QUOTA_EXCEEDED', 'API quota exceeded', 'quota', false);
  }

  if (error.name === 'AuthenticationError' || error.message?.includes('auth')) {
    return createChatError('AUTH_ERROR', 'Authentication failed', 'auth', false);
  }

  if (error.name === 'ValidationError' || error.message?.includes('validation')) {
    return createChatError('VALIDATION_ERROR', 'Invalid input data', 'validation', false);
  }

  // Default error
  return createChatError('UNKNOWN_ERROR', error.message || 'An unexpected error occurred', 'unknown', false);
};

// Search utilities
export const searchMessages = (messages: ChatMessage[], query: string): ChatMessage[] => {
  const searchTerm = query.toLowerCase();
  return messages.filter(message => 
    message.content.toLowerCase().includes(searchTerm) ||
    message.metadata?.model?.toLowerCase().includes(searchTerm) ||
    message.metadata?.provider?.toLowerCase().includes(searchTerm)
  );
};

export const filterMessagesByDate = (messages: ChatMessage[], from: Date, to: Date): ChatMessage[] => {
  return messages.filter(message => 
    message.timestamp >= from && message.timestamp <= to
  );
};

export const filterMessagesByModel = (messages: ChatMessage[], models: string[]): ChatMessage[] => {
  return messages.filter(message => 
    message.metadata?.model && models.includes(message.metadata.model)
  );
};

// Time utilities
export const formatTimestamp = (timestamp: Date): string => {
  const now = new Date();
  const diff = now.getTime() - timestamp.getTime();
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);

  if (minutes < 1) return 'Just now';
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days < 7) return `${days}d ago`;
  
  return timestamp.toLocaleDateString();
};

export const formatDuration = (milliseconds: number): string => {
  const seconds = Math.floor(milliseconds / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);

  if (hours > 0) {
    return `${hours}h ${minutes % 60}m ${seconds % 60}s`;
  }
  if (minutes > 0) {
    return `${minutes}m ${seconds % 60}s`;
  }
  return `${seconds}s`;
};

// Storage utilities
export const saveToLocalStorage = (key: string, data: any): void => {
  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch (error) {
    console.error('Failed to save to localStorage:', error);
  }
};

export const loadFromLocalStorage = <T>(key: string, defaultValue: T): T => {
  try {
    const item = localStorage.getItem(key);
    return item ? JSON.parse(item) : defaultValue;
  } catch (error) {
    console.error('Failed to load from localStorage:', error);
    return defaultValue;
  }
};

export const removeFromLocalStorage = (key: string): void => {
  try {
    localStorage.removeItem(key);
  } catch (error) {
    console.error('Failed to remove from localStorage:', error);
  }
};

// Validation utilities
export const validateChatConfig = (config: Partial<ChatConfig>): { valid: boolean; errors: string[] } => {
  const errors: string[] = [];

  if (config.temperature !== undefined && (config.temperature < 0 || config.temperature > 2)) {
    errors.push('Temperature must be between 0 and 2');
  }

  if (config.maxTokens !== undefined && config.maxTokens < 1) {
    errors.push('Max tokens must be at least 1');
  }

  if (config.topP !== undefined && (config.topP < 0 || config.topP > 1)) {
    errors.push('Top P must be between 0 and 1');
  }

  if (config.frequencyPenalty !== undefined && (config.frequencyPenalty < -2 || config.frequencyPenalty > 2)) {
    errors.push('Frequency penalty must be between -2 and 2');
  }

  if (config.presencePenalty !== undefined && (config.presencePenalty < -2 || config.presencePenalty > 2)) {
    errors.push('Presence penalty must be between -2 and 2');
  }

  return {
    valid: errors.length === 0,
    errors,
  };
};
