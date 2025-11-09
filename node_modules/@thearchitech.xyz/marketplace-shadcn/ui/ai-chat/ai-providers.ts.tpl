// AI Providers Configuration

export interface AIProvider {
  id: string;
  name: string;
  description: string;
  baseURL: string;
  models: AIModel[];
  features: string[];
  pricing: {
    input: number;
    output: number;
    currency: string;
  };
  limits: {
    maxTokens: number;
    rateLimit: number;
    concurrentRequests: number;
  };
  authentication: {
    type: 'api-key' | 'oauth' | 'bearer';
    required: boolean;
  };
}

export interface AIModel {
  id: string;
  name: string;
  description: string;
  maxTokens: number;
  contextWindow: number;
  capabilities: string[];
  pricing: {
    input: number;
    output: number;
  };
}

export const providers: Record<string, AIProvider> = {
  openai: {
    id: 'openai',
    name: 'OpenAI',
    description: 'Leading AI research company with GPT models',
    baseURL: 'https://api.openai.com/v1',
    models: [
      {
        id: 'gpt-4',
        name: 'GPT-4',
        description: 'Most capable GPT-4 model',
        maxTokens: 4096,
        contextWindow: 8192,
        capabilities: ['text', 'reasoning', 'analysis'],
        pricing: { input: 0.00003, output: 0.00006 },
      },
      {
        id: 'gpt-4-turbo',
        name: 'GPT-4 Turbo',
        description: 'Faster and more efficient GPT-4',
        maxTokens: 128000,
        contextWindow: 128000,
        capabilities: ['text', 'reasoning', 'analysis', 'long-context'],
        pricing: { input: 0.00001, output: 0.00003 },
      },
      {
        id: 'gpt-3.5-turbo',
        name: 'GPT-3.5 Turbo',
        description: 'Fast and efficient for most tasks',
        maxTokens: 4096,
        contextWindow: 16384,
        capabilities: ['text', 'conversation'],
        pricing: { input: 0.0000015, output: 0.000002 },
      },
    ],
    features: ['streaming', 'function-calling', 'embeddings', 'fine-tuning'],
    pricing: { input: 0.0000015, output: 0.000002, currency: 'USD' },
    limits: {
      maxTokens: 128000,
      rateLimit: 10000,
      concurrentRequests: 50,
    },
    authentication: {
      type: 'api-key',
      required: true,
    },
  },
  
  anthropic: {
    id: 'anthropic',
    name: 'Anthropic',
    description: 'AI safety company with Claude models',
    baseURL: 'https://api.anthropic.com/v1',
    models: [
      {
        id: 'claude-3-opus',
        name: 'Claude 3 Opus',
        description: 'Most powerful Claude model',
        maxTokens: 200000,
        contextWindow: 200000,
        capabilities: ['text', 'reasoning', 'analysis', 'long-context'],
        pricing: { input: 0.000015, output: 0.000075 },
      },
      {
        id: 'claude-3-sonnet',
        name: 'Claude 3 Sonnet',
        description: 'Balanced performance and speed',
        maxTokens: 200000,
        contextWindow: 200000,
        capabilities: ['text', 'reasoning', 'analysis', 'long-context'],
        pricing: { input: 0.000003, output: 0.000015 },
      },
      {
        id: 'claude-3-haiku',
        name: 'Claude 3 Haiku',
        description: 'Fast and efficient for simple tasks',
        maxTokens: 200000,
        contextWindow: 200000,
        capabilities: ['text', 'conversation', 'long-context'],
        pricing: { input: 0.00000025, output: 0.00000125 },
      },
    ],
    features: ['streaming', 'long-context', 'safety'],
    pricing: { input: 0.00000025, output: 0.00000125, currency: 'USD' },
    limits: {
      maxTokens: 200000,
      rateLimit: 5000,
      concurrentRequests: 25,
    },
    authentication: {
      type: 'api-key',
      required: true,
    },
  },
  
  google: {
    id: 'google',
    name: 'Google AI',
    description: 'Google\'s AI platform with Gemini models',
    baseURL: 'https://generativelanguage.googleapis.com/v1',
    models: [
      {
        id: 'gemini-pro',
        name: 'Gemini Pro',
        description: 'Google\'s most capable text model',
        maxTokens: 30720,
        contextWindow: 30720,
        capabilities: ['text', 'reasoning', 'analysis'],
        pricing: { input: 0.0000005, output: 0.0000015 },
      },
      {
        id: 'gemini-pro-vision',
        name: 'Gemini Pro Vision',
        description: 'Multimodal model with vision capabilities',
        maxTokens: 16384,
        contextWindow: 16384,
        capabilities: ['text', 'vision', 'multimodal'],
        pricing: { input: 0.0000005, output: 0.0000015 },
      },
    ],
    features: ['multimodal', 'vision', 'streaming'],
    pricing: { input: 0.0000005, output: 0.0000015, currency: 'USD' },
    limits: {
      maxTokens: 30720,
      rateLimit: 15000,
      concurrentRequests: 100,
    },
    authentication: {
      type: 'api-key',
      required: true,
    },
  },
  
  azure: {
    id: 'azure',
    name: 'Azure OpenAI',
    description: 'Microsoft Azure\'s OpenAI service',
    baseURL: 'https://your-resource.openai.azure.com/openai/deployments',
    models: [
      {
        id: 'gpt-4',
        name: 'GPT-4 (Azure)',
        description: 'GPT-4 via Azure OpenAI',
        maxTokens: 4096,
        contextWindow: 8192,
        capabilities: ['text', 'reasoning', 'analysis'],
        pricing: { input: 0.00003, output: 0.00006 },
      },
      {
        id: 'gpt-35-turbo',
        name: 'GPT-3.5 Turbo (Azure)',
        description: 'GPT-3.5 Turbo via Azure OpenAI',
        maxTokens: 4096,
        contextWindow: 16384,
        capabilities: ['text', 'conversation'],
        pricing: { input: 0.0000015, output: 0.000002 },
      },
    ],
    features: ['streaming', 'function-calling', 'enterprise'],
    pricing: { input: 0.0000015, output: 0.000002, currency: 'USD' },
    limits: {
      maxTokens: 4096,
      rateLimit: 10000,
      concurrentRequests: 50,
    },
    authentication: {
      type: 'api-key',
      required: true,
    },
  },
};

export function getProvider(providerId: string): AIProvider | null {
  return providers[providerId] || null;
}

export function getModel(providerId: string, modelId: string): AIModel | null {
  const provider = getProvider(providerId);
  if (!provider) return null;
  
  return provider.models.find(model => model.id === modelId) || null;
}

export function getAllModels(): Array<{ provider: AIProvider; model: AIModel }> {
  const allModels: Array<{ provider: AIProvider; model: AIModel }> = [];
  
  Object.values(providers).forEach(provider => {
    provider.models.forEach(model => {
      allModels.push({ provider, model });
    });
  });
  
  return allModels;
}

export function getModelsByCapability(capability: string): Array<{ provider: AIProvider; model: AIModel }> {
  return getAllModels().filter(({ model }) => 
    model.capabilities.includes(capability)
  );
}

export function estimateCost(
  inputTokens: number,
  outputTokens: number,
  providerId: string,
  modelId: string
): number {
  const model = getModel(providerId, modelId);
  if (!model) return 0;
  
  return (inputTokens * model.pricing.input) + (outputTokens * model.pricing.output);
}

export function formatProviderForAPI(provider: AIProvider, modelId: string): Record<string, any> {
  const model = getModel(provider.id, modelId);
  if (!model) throw new Error(`Model ${modelId} not found for provider ${provider.id}`);
  
  return {
    provider: provider.id,
    model: modelId,
    baseURL: provider.baseURL,
    maxTokens: model.maxTokens,
    capabilities: model.capabilities,
    pricing: model.pricing,
  };
}