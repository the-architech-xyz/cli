// AI Types and Interfaces

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
  metadata?: {
    tokens?: number;
    model?: string;
    provider?: string;
    cost?: number;
    duration?: number;
  };
}

export interface ChatSession {
  id: string;
  title: string;
  messages: ChatMessage[];
  createdAt: Date;
  updatedAt: Date;
  settings: ChatSettings;
  metadata?: {
    totalTokens?: number;
    totalCost?: number;
    messageCount?: number;
  };
}

export interface ChatSettings {
  model: string;
  provider: string;
  temperature: number;
  maxTokens: number;
  systemPrompt?: string;
  enableMemory: boolean;
  enableStreaming: boolean;
}

export interface AICompletionRequest {
  messages: ChatMessage[];
  settings: ChatSettings;
  stream?: boolean;
}

export interface AICompletionResponse {
  message: ChatMessage;
  usage: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
  cost: number;
  duration: number;
}

export interface AIStreamResponse {
  chunk: string;
  isComplete: boolean;
  usage?: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
  cost?: number;
}

export interface AIError {
  code: string;
  message: string;
  details?: any;
  timestamp: Date;
}

export interface AIProvider {
  id: string;
  name: string;
  baseURL: string;
  models: string[];
  features: string[];
  limits: {
    maxTokens: number;
    rateLimit: number;
    concurrentRequests: number;
  };
}

export interface AIModel {
  id: string;
  name: string;
  provider: string;
  maxTokens: number;
  contextWindow: number;
  capabilities: string[];
  pricing: {
    input: number;
    output: number;
  };
}

export interface AIUsage {
  provider: string;
  model: string;
  tokens: number;
  cost: number;
  requests: number;
  date: Date;
}

export interface AIAnalytics {
  totalTokens: number;
  totalCost: number;
  totalRequests: number;
  averageTokensPerRequest: number;
  averageCostPerRequest: number;
  usageByProvider: Record<string, AIUsage>;
  usageByModel: Record<string, AIUsage>;
  usageByDate: Record<string, AIUsage>;
}

export interface AIFunction {
  name: string;
  description: string;
  parameters: {
    type: 'object';
    properties: Record<string, {
      type: string;
      description: string;
      enum?: string[];
    }>;
    required: string[];
  };
}

export interface AIFunctionCall {
  name: string;
  arguments: Record<string, any>;
}

export interface AIFunctionResult {
  name: string;
  result: any;
  error?: string;
}

export interface AITool {
  type: 'function';
  function: AIFunction;
}

export interface AIEmbedding {
  embedding: number[];
  tokens: number;
  model: string;
}

export interface AIEmbeddingRequest {
  input: string | string[];
  model: string;
  provider: string;
}

export interface AIEmbeddingResponse {
  embeddings: AIEmbedding[];
  usage: {
    promptTokens: number;
    totalTokens: number;
  };
  cost: number;
}

export interface AIImageGenerationRequest {
  prompt: string;
  model: string;
  provider: string;
  size?: '256x256' | '512x512' | '1024x1024';
  quality?: 'standard' | 'hd';
  style?: 'vivid' | 'natural';
  n?: number;
}

export interface AIImageGenerationResponse {
  images: Array<{
    url: string;
    base64?: string;
  }>;
  usage: {
    promptTokens: number;
    totalTokens: number;
  };
  cost: number;
}

export interface AIVisionRequest {
  messages: ChatMessage[];
  images: Array<{
    url?: string;
    base64?: string;
    type: 'image/jpeg' | 'image/png' | 'image/gif' | 'image/webp';
  }>;
  settings: ChatSettings;
}

export interface AIVisionResponse extends AICompletionResponse {
  visionMetadata?: {
    imageCount: number;
    imageTokens: number;
  };
}

export interface AIFineTuningRequest {
  trainingData: Array<{
    prompt: string;
    completion: string;
  }>;
  model: string;
  provider: string;
  hyperparameters?: {
    nEpochs?: number;
    batchSize?: number;
    learningRate?: number;
  };
}

export interface AIFineTuningResponse {
  jobId: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  model: string;
  createdAt: Date;
  completedAt?: Date;
  cost: number;
}

export interface AIFineTuningJob {
  id: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  model: string;
  provider: string;
  createdAt: Date;
  completedAt?: Date;
  cost: number;
  error?: string;
}

export interface AIConversationMemory {
  id: string;
  sessionId: string;
  summary: string;
  keyPoints: string[];
  createdAt: Date;
  updatedAt: Date;
}

export interface AIConversationContext {
  sessionId: string;
  memory?: AIConversationMemory;
  recentMessages: ChatMessage[];
  systemContext?: string;
  userPreferences?: Record<string, any>;
}

export interface AIFeedback {
  messageId: string;
  rating: 'thumbs-up' | 'thumbs-down';
  comment?: string;
  timestamp: Date;
}

export interface AIExportOptions {
  format: 'json' | 'markdown' | 'txt' | 'csv';
  includeMetadata: boolean;
  includeTimestamps: boolean;
  includeCosts: boolean;
}

export interface AIExportResult {
  data: string;
  format: string;
  size: number;
  createdAt: Date;
}

// Utility types
export type ChatRole = 'user' | 'assistant' | 'system';
export type AIProviderType = 'openai' | 'anthropic' | 'google' | 'azure' | 'custom';
export type AIModelType = string;
export type AIStreamCallback = (chunk: AIStreamResponse) => void;
export type AIErrorCallback = (error: AIError) => void;

// Event types
export interface AIEvents {
  'message:created': ChatMessage;
  'message:updated': ChatMessage;
  'message:deleted': string;
  'session:created': ChatSession;
  'session:updated': ChatSession;
  'session:deleted': string;
  'completion:started': AICompletionRequest;
  'completion:completed': AICompletionResponse;
  'completion:error': AIError;
  'stream:chunk': AIStreamResponse;
  'stream:complete': AIStreamResponse;
  'usage:updated': AIUsage;
  'cost:updated': number;
}

// Configuration types
export interface AIConfig {
  providers: Record<string, AIProvider>;
  models: Record<string, AIModel>;
  defaultSettings: ChatSettings;
  features: {
    streaming: boolean;
    functionCalling: boolean;
    vision: boolean;
    embeddings: boolean;
    fineTuning: boolean;
    analytics: boolean;
  };
  limits: {
    maxTokensPerRequest: number;
    maxMessagesPerSession: number;
    maxSessionsPerUser: number;
    rateLimitPerMinute: number;
  };
}