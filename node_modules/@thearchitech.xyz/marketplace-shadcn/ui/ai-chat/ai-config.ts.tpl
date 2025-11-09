// AI Configuration

export interface AIConfig {
  // Provider settings
  provider: 'openai' | 'anthropic' | 'google' | 'azure' | 'custom';
  apiKey?: string;
  baseURL?: string;
  
  // Model settings
  model: string;
  temperature: number;
  maxTokens: number;
  topP: number;
  frequencyPenalty: number;
  presencePenalty: number;
  
  // Chat settings
  systemPrompt?: string;
  maxHistoryLength: number;
  enableMemory: boolean;
  enableStreaming: boolean;
  
  // UI settings
  showTokenCount: boolean;
  showModelInfo: boolean;
  enableDarkMode: boolean;
  
  // Advanced settings
  customHeaders?: Record<string, string>;
  timeout: number;
  retryAttempts: number;
  retryDelay: number;
}

export const defaultAIConfig: AIConfig = {
  provider: 'openai',
  model: 'gpt-3.5-turbo',
  temperature: 0.7,
  maxTokens: 1000,
  topP: 1,
  frequencyPenalty: 0,
  presencePenalty: 0,
  maxHistoryLength: 50,
  enableMemory: true,
  enableStreaming: true,
  showTokenCount: true,
  showModelInfo: true,
  enableDarkMode: false,
  timeout: 30000,
  retryAttempts: 3,
  retryDelay: 1000,
};

export const modelConfigs = {
  openai: {
    'gpt-4': {
      maxTokens: 4096,
      costPerToken: 0.00003,
    },
    'gpt-4-turbo': {
      maxTokens: 128000,
      costPerToken: 0.00001,
    },
    'gpt-3.5-turbo': {
      maxTokens: 4096,
      costPerToken: 0.000002,
    },
  },
  anthropic: {
    'claude-3-opus': {
      maxTokens: 200000,
      costPerToken: 0.000015,
    },
    'claude-3-sonnet': {
      maxTokens: 200000,
      costPerToken: 0.000003,
    },
    'claude-3-haiku': {
      maxTokens: 200000,
      costPerToken: 0.00000025,
    },
  },
  google: {
    'gemini-pro': {
      maxTokens: 30720,
      costPerToken: 0.0000005,
    },
    'gemini-pro-vision': {
      maxTokens: 16384,
      costPerToken: 0.0000005,
    },
  },
};

export const systemPrompts = {
  assistant: 'You are a helpful AI assistant. Provide accurate, helpful, and concise responses.',
  creative: 'You are a creative AI assistant. Help with brainstorming, writing, and creative projects.',
  technical: 'You are a technical AI assistant. Provide detailed technical explanations and solutions.',
  casual: 'You are a friendly AI assistant. Keep responses conversational and approachable.',
  professional: 'You are a professional AI assistant. Maintain a formal tone and provide business-focused responses.',
};

export function validateAIConfig(config: Partial<AIConfig>): string[] {
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
  
  if (config.timeout !== undefined && config.timeout < 1000) {
    errors.push('Timeout must be at least 1000ms');
  }
  
  if (config.retryAttempts !== undefined && config.retryAttempts < 0) {
    errors.push('Retry attempts must be non-negative');
  }
  
  return errors;
}

export function getModelInfo(provider: string, model: string) {
  const providerConfigs = modelConfigs[provider as keyof typeof modelConfigs];
  if (!providerConfigs) return null;
  
  return providerConfigs[model as keyof typeof providerConfigs] || null;
}

export function estimateCost(tokens: number, provider: string, model: string): number {
  const modelInfo = getModelInfo(provider, model);
  if (!modelInfo) return 0;
  
  return tokens * modelInfo.costPerToken;
}

export function formatConfigForAPI(config: AIConfig): Record<string, any> {
  const apiConfig: Record<string, any> = {
    model: config.model,
    temperature: config.temperature,
    max_tokens: config.maxTokens,
    top_p: config.topP,
    frequency_penalty: config.frequencyPenalty,
    presence_penalty: config.presencePenalty,
  };
  
  if (config.systemPrompt) {
    apiConfig.messages = [
      { role: 'system', content: config.systemPrompt },
    ];
  }
  
  return apiConfig;
}