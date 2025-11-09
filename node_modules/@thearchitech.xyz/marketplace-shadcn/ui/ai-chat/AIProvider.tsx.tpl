// AI Provider Context Component

"use client";

import React, { createContext, useContext, useReducer, useEffect, ReactNode } from 'react';

// Types
interface AIProviderState {
  currentProvider: string;
  currentModel: string;
  settings: {
    temperature: number;
    maxTokens: number;
    topP: number;
    frequencyPenalty: number;
    presencePenalty: number;
  };
  isLoading: boolean;
  error: string | null;
  usage: {
    totalTokens: number;
    totalCost: number;
    totalRequests: number;
  };
}

interface AIProviderContextType extends AIProviderState {
  setProvider: (provider: string) => void;
  setModel: (model: string) => void;
  updateSettings: (settings: Partial<AIProviderState['settings']>) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  updateUsage: (usage: Partial<AIProviderState['usage']>) => void;
  resetUsage: () => void;
}

// Action types
type AIProviderAction =
  | { type: 'SET_PROVIDER'; payload: string }
  | { type: 'SET_MODEL'; payload: string }
  | { type: 'UPDATE_SETTINGS'; payload: Partial<AIProviderState['settings']> }
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'UPDATE_USAGE'; payload: Partial<AIProviderState['usage']> }
  | { type: 'RESET_USAGE' };

// Initial state
const initialState: AIProviderState = {
  currentProvider: 'openai',
  currentModel: 'gpt-3.5-turbo',
  settings: {
    temperature: 0.7,
    maxTokens: 1000,
    topP: 1,
    frequencyPenalty: 0,
    presencePenalty: 0,
  },
  isLoading: false,
  error: null,
  usage: {
    totalTokens: 0,
    totalCost: 0,
    totalRequests: 0,
  },
};

// Reducer
function aiProviderReducer(state: AIProviderState, action: AIProviderAction): AIProviderState {
  switch (action.type) {
    case 'SET_PROVIDER':
      return {
        ...state,
        currentProvider: action.payload,
        error: null,
      };
    case 'SET_MODEL':
      return {
        ...state,
        currentModel: action.payload,
        error: null,
      };
    case 'UPDATE_SETTINGS':
      return {
        ...state,
        settings: {
          ...state.settings,
          ...action.payload,
        },
      };
    case 'SET_LOADING':
      return {
        ...state,
        isLoading: action.payload,
      };
    case 'SET_ERROR':
      return {
        ...state,
        error: action.payload,
        isLoading: false,
      };
    case 'UPDATE_USAGE':
      return {
        ...state,
        usage: {
          ...state.usage,
          ...action.payload,
        },
      };
    case 'RESET_USAGE':
      return {
        ...state,
        usage: {
          totalTokens: 0,
          totalCost: 0,
          totalRequests: 0,
        },
      };
    default:
      return state;
  }
}

// Context
const AIProviderContext = createContext<AIProviderContextType | undefined>(undefined);

// Provider component
interface AIProviderProps {
  children: ReactNode;
  initialProvider?: string;
  initialModel?: string;
  initialSettings?: Partial<AIProviderState['settings']>;
}

export const AIProvider: React.FC<AIProviderProps> = ({
  children,
  initialProvider = 'openai',
  initialModel = 'gpt-3.5-turbo',
  initialSettings = {},
}) => {
  const [state, dispatch] = useReducer(aiProviderReducer, {
    ...initialState,
    currentProvider: initialProvider,
    currentModel: initialModel,
    settings: {
      ...initialState.settings,
      ...initialSettings,
    },
  });

  // Load saved settings from localStorage
  useEffect(() => {
    const savedSettings = localStorage.getItem('ai-provider-settings');
    if (savedSettings) {
      try {
        const parsed = JSON.parse(savedSettings);
        if (parsed.currentProvider) {
          dispatch({ type: 'SET_PROVIDER', payload: parsed.currentProvider });
        }
        if (parsed.currentModel) {
          dispatch({ type: 'SET_MODEL', payload: parsed.currentModel });
        }
        if (parsed.settings) {
          dispatch({ type: 'UPDATE_SETTINGS', payload: parsed.settings });
        }
      } catch (error) {
        console.error('Failed to load AI provider settings:', error);
      }
    }
  }, []);

  // Save settings to localStorage
  useEffect(() => {
    const settingsToSave = {
      currentProvider: state.currentProvider,
      currentModel: state.currentModel,
      settings: state.settings,
    };
    localStorage.setItem('ai-provider-settings', JSON.stringify(settingsToSave));
  }, [state.currentProvider, state.currentModel, state.settings]);

  // Load usage from localStorage
  useEffect(() => {
    const savedUsage = localStorage.getItem('ai-provider-usage');
    if (savedUsage) {
      try {
        const parsed = JSON.parse(savedUsage);
        dispatch({ type: 'UPDATE_USAGE', payload: parsed });
      } catch (error) {
        console.error('Failed to load AI provider usage:', error);
      }
    }
  }, []);

  // Save usage to localStorage
  useEffect(() => {
    localStorage.setItem('ai-provider-usage', JSON.stringify(state.usage));
  }, [state.usage]);

  const contextValue: AIProviderContextType = {
    ...state,
    setProvider: (provider: string) => {
      dispatch({ type: 'SET_PROVIDER', payload: provider });
    },
    setModel: (model: string) => {
      dispatch({ type: 'SET_MODEL', payload: model });
    },
    updateSettings: (settings: Partial<AIProviderState['settings']>) => {
      dispatch({ type: 'UPDATE_SETTINGS', payload: settings });
    },
    setLoading: (loading: boolean) => {
      dispatch({ type: 'SET_LOADING', payload: loading });
    },
    setError: (error: string | null) => {
      dispatch({ type: 'SET_ERROR', payload: error });
    },
    updateUsage: (usage: Partial<AIProviderState['usage']>) => {
      dispatch({ type: 'UPDATE_USAGE', payload: usage });
    },
    resetUsage: () => {
      dispatch({ type: 'RESET_USAGE' });
    },
  };

  return (
    <AIProviderContext.Provider value={contextValue}>
      {children}
    </AIProviderContext.Provider>
  );
};

// Hook to use the AI provider context
export const useAIProvider = (): AIProviderContextType => {
  const context = useContext(AIProviderContext);
  if (context === undefined) {
    throw new Error('useAIProvider must be used within an AIProvider');
  }
  return context;
};

// Hook to get current provider info
export const useCurrentProvider = () => {
  const { currentProvider, currentModel } = useAIProvider();
  
  // This would typically come from a providers configuration
  const providers = {
    openai: {
      name: 'OpenAI',
      models: {
        'gpt-4': { name: 'GPT-4', maxTokens: 4096 },
        'gpt-4-turbo': { name: 'GPT-4 Turbo', maxTokens: 128000 },
        'gpt-3.5-turbo': { name: 'GPT-3.5 Turbo', maxTokens: 4096 },
      },
    },
    anthropic: {
      name: 'Anthropic',
      models: {
        'claude-3-opus': { name: 'Claude 3 Opus', maxTokens: 200000 },
        'claude-3-sonnet': { name: 'Claude 3 Sonnet', maxTokens: 200000 },
        'claude-3-haiku': { name: 'Claude 3 Haiku', maxTokens: 200000 },
      },
    },
    google: {
      name: 'Google AI',
      models: {
        'gemini-pro': { name: 'Gemini Pro', maxTokens: 30720 },
        'gemini-pro-vision': { name: 'Gemini Pro Vision', maxTokens: 16384 },
      },
    },
  };
  
  const provider = providers[currentProvider as keyof typeof providers];
  const model = provider?.models[currentModel as keyof typeof provider.models];
  
  return {
    provider: provider ? { id: currentProvider, ...provider } : null,
    model: model ? { id: currentModel, ...model } : null,
  };
};

// Hook to get usage statistics
export const useUsageStats = () => {
  const { usage } = useAIProvider();
  
  return {
    ...usage,
    averageTokensPerRequest: usage.totalRequests > 0 ? usage.totalTokens / usage.totalRequests : 0,
    averageCostPerRequest: usage.totalRequests > 0 ? usage.totalCost / usage.totalRequests : 0,
  };
};

// Hook to get available providers and models
export const useAvailableProviders = () => {
  const providers = {
    openai: {
      id: 'openai',
      name: 'OpenAI',
      description: 'Leading AI research company with GPT models',
      models: [
        { id: 'gpt-4', name: 'GPT-4', maxTokens: 4096 },
        { id: 'gpt-4-turbo', name: 'GPT-4 Turbo', maxTokens: 128000 },
        { id: 'gpt-3.5-turbo', name: 'GPT-3.5 Turbo', maxTokens: 4096 },
      ],
    },
    anthropic: {
      id: 'anthropic',
      name: 'Anthropic',
      description: 'AI safety company with Claude models',
      models: [
        { id: 'claude-3-opus', name: 'Claude 3 Opus', maxTokens: 200000 },
        { id: 'claude-3-sonnet', name: 'Claude 3 Sonnet', maxTokens: 200000 },
        { id: 'claude-3-haiku', name: 'Claude 3 Haiku', maxTokens: 200000 },
      ],
    },
    google: {
      id: 'google',
      name: 'Google AI',
      description: 'Google\'s AI platform with Gemini models',
      models: [
        { id: 'gemini-pro', name: 'Gemini Pro', maxTokens: 30720 },
        { id: 'gemini-pro-vision', name: 'Gemini Pro Vision', maxTokens: 16384 },
      ],
    },
  };
  
  return Object.values(providers);
};