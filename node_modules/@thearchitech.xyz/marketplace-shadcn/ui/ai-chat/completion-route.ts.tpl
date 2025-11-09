// AI Completion API Route

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

// Request validation schema
const completionRequestSchema = z.object({
  prompt: z.string().min(1, 'Prompt is required'),
  settings: z.object({
    model: z.string(),
    provider: z.string(),
    temperature: z.number().min(0).max(2).optional(),
    maxTokens: z.number().min(1).max(100000).optional(),
    topP: z.number().min(0).max(1).optional(),
    frequencyPenalty: z.number().min(-2).max(2).optional(),
    presencePenalty: z.number().min(-2).max(2).optional(),
    stop: z.array(z.string()).optional(),
  }),
  stream: z.boolean().optional(),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validatedData = completionRequestSchema.parse(body);
    
    const { prompt, settings, stream = false } = validatedData;
    
    // Validate API key
    const apiKey = request.headers.get('x-api-key') || process.env.AI_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: 'API key required' },
        { status: 401 }
      );
    }
    
    // Get provider configuration
    const provider = await getProviderConfig(settings.provider);
    if (!provider) {
      return NextResponse.json(
        { error: 'Invalid provider' },
        { status: 400 }
      );
    }
    
    // Validate model
    const model = provider.models.find(m => m.id === settings.model);
    if (!model) {
      return NextResponse.json(
        { error: 'Invalid model for provider' },
        { status: 400 }
      );
    }
    
    // Check rate limits
    const rateLimitResult = await checkRateLimit(request);
    if (!rateLimitResult.allowed) {
      return NextResponse.json(
        { error: 'Rate limit exceeded', retryAfter: rateLimitResult.retryAfter },
        { status: 429 }
      );
    }
    
    // Validate prompt length
    const promptTokens = estimateTokens(prompt);
    if (promptTokens > model.maxTokens) {
      return NextResponse.json(
        { error: 'Prompt too long for model' },
        { status: 400 }
      );
    }
    
    // Make API call to AI provider
    const startTime = Date.now();
    let response;
    
    if (stream) {
      response = await streamCompletion({
        provider,
        model: settings.model,
        prompt,
        settings,
        apiKey,
      });
    } else {
      response = await getCompletion({
        provider,
        model: settings.model,
        prompt,
        settings,
        apiKey,
      });
    }
    
    const duration = Date.now() - startTime;
    
    // Log usage
    await logUsage({
      provider: settings.provider,
      model: settings.model,
      tokens: response.usage?.totalTokens || 0,
      cost: response.cost || 0,
      duration,
      userId: request.headers.get('x-user-id'),
    });
    
    // Return response
    return NextResponse.json({
      completion: {
        id: generateId(),
        text: response.text,
        finishReason: response.finishReason,
        timestamp: new Date().toISOString(),
        metadata: {
          tokens: response.usage?.totalTokens,
          model: settings.model,
          provider: settings.provider,
          cost: response.cost,
          duration,
        },
      },
      usage: response.usage,
      cost: response.cost,
      duration,
    });
    
  } catch (error) {
    console.error('Completion API error:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request data', details: error.errors },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

async function getProviderConfig(providerId: string) {
  // This would typically come from a database or configuration
  const providers = {
    openai: {
      baseURL: 'https://api.openai.com/v1',
      models: [
        { id: 'gpt-4', maxTokens: 4096 },
        { id: 'gpt-4-turbo', maxTokens: 128000 },
        { id: 'gpt-3.5-turbo', maxTokens: 4096 },
        { id: 'text-davinci-003', maxTokens: 4096 },
      ],
    },
    anthropic: {
      baseURL: 'https://api.anthropic.com/v1',
      models: [
        { id: 'claude-3-opus', maxTokens: 200000 },
        { id: 'claude-3-sonnet', maxTokens: 200000 },
        { id: 'claude-3-haiku', maxTokens: 200000 },
      ],
    },
    google: {
      baseURL: 'https://generativelanguage.googleapis.com/v1',
      models: [
        { id: 'gemini-pro', maxTokens: 30720 },
        { id: 'gemini-pro-vision', maxTokens: 16384 },
      ],
    },
  };
  
  return providers[providerId as keyof typeof providers] || null;
}

async function getCompletion({
  provider,
  model,
  prompt,
  settings,
  apiKey,
}: {
  provider: any;
  model: string;
  prompt: string;
  settings: any;
  apiKey: string;
}) {
  const requestBody = {
    model,
    prompt,
    temperature: settings.temperature || 0.7,
    max_tokens: settings.maxTokens || 1000,
    top_p: settings.topP || 1,
    frequency_penalty: settings.frequencyPenalty || 0,
    presence_penalty: settings.presencePenalty || 0,
    stop: settings.stop || null,
  };
  
  const response = await fetch(`${provider.baseURL}/completions`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(requestBody),
  });
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(`API error: ${error.error?.message || 'Unknown error'}`);
  }
  
  const data = await response.json();
  
  return {
    text: data.choices[0].text,
    finishReason: data.choices[0].finish_reason,
    usage: {
      promptTokens: data.usage.prompt_tokens,
      completionTokens: data.usage.completion_tokens,
      totalTokens: data.usage.total_tokens,
    },
    cost: calculateCost(data.usage.total_tokens, provider.id, model),
  };
}

async function streamCompletion({
  provider,
  model,
  prompt,
  settings,
  apiKey,
}: {
  provider: any;
  model: string;
  prompt: string;
  settings: any;
  apiKey: string;
}) {
  const requestBody = {
    model,
    prompt,
    temperature: settings.temperature || 0.7,
    max_tokens: settings.maxTokens || 1000,
    top_p: settings.topP || 1,
    frequency_penalty: settings.frequencyPenalty || 0,
    presence_penalty: settings.presencePenalty || 0,
    stop: settings.stop || null,
    stream: true,
  };
  
  const response = await fetch(`${provider.baseURL}/completions`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(requestBody),
  });
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(`API error: ${error.error?.message || 'Unknown error'}`);
  }
  
  // For streaming, we'd need to handle the stream differently
  // This is a simplified version
  const reader = response.body?.getReader();
  let text = '';
  let finishReason = 'stop';
  
  if (reader) {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      
      const chunk = new TextDecoder().decode(value);
      const lines = chunk.split('\n');
      
      for (const line of lines) {
        if (line.startsWith('data: ')) {
          const data = line.slice(6);
          if (data === '[DONE]') continue;
          
          try {
            const parsed = JSON.parse(data);
            if (parsed.choices[0]?.text) {
              text += parsed.choices[0].text;
            }
            if (parsed.choices[0]?.finish_reason) {
              finishReason = parsed.choices[0].finish_reason;
            }
          } catch (e) {
            // Ignore parsing errors for streaming
          }
        }
      }
    }
  }
  
  return {
    text,
    finishReason,
    usage: {
      promptTokens: 0, // Would need to calculate from stream
      completionTokens: 0,
      totalTokens: 0,
    },
    cost: 0, // Would need to calculate from stream
  };
}

async function checkRateLimit(request: NextRequest) {
  // Implement rate limiting logic here
  // This is a placeholder
  return { allowed: true, retryAfter: 0 };
}

async function logUsage(usage: {
  provider: string;
  model: string;
  tokens: number;
  cost: number;
  duration: number;
  userId?: string | null;
}) {
  // Log usage to database or analytics service
  console.log('Usage logged:', usage);
}

function calculateCost(tokens: number, provider: string, model: string): number {
  // Implement cost calculation based on provider and model
  // This is a placeholder
  const rates = {
    openai: {
      'gpt-4': 0.00003,
      'gpt-4-turbo': 0.00001,
      'gpt-3.5-turbo': 0.000002,
      'text-davinci-003': 0.00002,
    },
    anthropic: {
      'claude-3-opus': 0.000015,
      'claude-3-sonnet': 0.000003,
      'claude-3-haiku': 0.00000025,
    },
    google: {
      'gemini-pro': 0.0000005,
      'gemini-pro-vision': 0.0000005,
    },
  };
  
  const rate = rates[provider as keyof typeof rates]?.[model as keyof typeof rates[typeof provider]] || 0;
  return tokens * rate;
}

function estimateTokens(text: string): number {
  // Simple token estimation (roughly 4 characters per token)
  return Math.ceil(text.length / 4);
}

function generateId(): string {
  return Math.random().toString(36).substring(2) + Date.now().toString(36);
}