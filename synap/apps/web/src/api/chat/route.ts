/**
 * AI Chat API Route
 * 
 * Handles chat completions with:
 * - Vercel AI SDK for streaming
 * - Database for persistence
 * - Conversation management
 * - Usage tracking
 */

import { NextRequest } from 'next/server';
import { streamText } from 'ai';
import { getModel } from '@/lib/ai/client';
import { AI_CONFIG } from '@/lib/ai/config';
import { db } from '@/lib/db';
import { aiConversations, aiMessages, aiUsage } from '@/lib/db/schema/ai-chat';
import { eq } from 'drizzle-orm';
import { createId } from '@paralleldrive/cuid2';

// This route should only be accessible to authenticated users
// Add your auth check here
export const runtime = 'edge'; // Optional: Use edge runtime for better performance

export async function POST(req: NextRequest) {
  try {
    // 1. Parse request
    const body = await req.json();
    const {
      messages,
      conversationId,
      userId, // Should come from auth middleware
      model = AI_CONFIG.defaultModel,
      provider = AI_CONFIG.defaultProvider,
      temperature = AI_CONFIG.temperature,
      maxTokens = AI_CONFIG.maxTokens,
      systemPrompt,
    } = body;

    // 2. Validate required fields
    if (!userId) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    if (!messages || messages.length === 0) {
      return new Response(JSON.stringify({ error: 'Messages are required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // 3. Load or create conversation
    let conversation;
    if (conversationId) {
      // Load existing conversation
      conversation = await db.query.aiConversations.findFirst({
        where: eq(aiConversations.id, conversationId),
      });

      if (!conversation) {
        return new Response(JSON.stringify({ error: 'Conversation not found' }), {
          status: 404,
          headers: { 'Content-Type': 'application/json' },
        });
      }

      // Verify ownership
      if (conversation.userId !== userId) {
        return new Response(JSON.stringify({ error: 'Unauthorized' }), {
          status: 403,
          headers: { 'Content-Type': 'application/json' },
        });
      }
    } else {
      // Create new conversation
      const newConversationId = createId();
      const title = messages[0]?.content?.slice(0, 50) || 'New Chat';

      [conversation] = await db.insert(aiConversations).values({
        id: newConversationId,
        userId,
        title,
        model,
        provider,
        temperature: Math.round(temperature * 100), // Store as integer
        maxTokens,
        systemPrompt,
        status: 'active',
      }).returning();
    }

    // 4. Prepare messages for AI
    const chatMessages = [...messages];
    if (systemPrompt) {
      chatMessages.unshift({
        role: 'system',
        content: systemPrompt,
      });
    }

    // 5. Get AI model
    const aiModel = getModel(model);

    // 6. Track response for saving
    let fullResponse = '';
    let promptTokens = 0;
    let completionTokens = 0;

    // 7. Stream from Vercel AI SDK
    const result = await streamText({
      model: aiModel,
      messages: chatMessages,
      temperature,
      maxTokens,
      onFinish: async ({ text, usage }) => {
        fullResponse = text;
        promptTokens = usage?.promptTokens || 0;
        completionTokens = usage?.completionTokens || 0;

        // Save messages to database
        try {
          const userMessage = messages[messages.length - 1];
          
          await db.insert(aiMessages).values([
            {
              id: createId(),
              conversationId: conversation.id,
              role: 'user',
              content: userMessage.content,
              tokens: promptTokens,
            },
            {
              id: createId(),
              conversationId: conversation.id,
              role: 'assistant',
              content: fullResponse,
              tokens: completionTokens,
              model,
            },
          ]);

          // Update conversation stats
          await db.update(aiConversations)
            .set({
              totalMessages: conversation.totalMessages + 2,
              totalTokens: conversation.totalTokens + promptTokens + completionTokens,
              lastMessageAt: new Date(),
              updatedAt: new Date(),
            })
            .where(eq(aiConversations.id, conversation.id));

          // Track usage (optional)
          
          await db.insert(aiUsage).values({
            id: createId(),
            userId,
            conversationId: conversation.id,
            model,
            provider,
            promptTokens,
            completionTokens,
            totalTokens: promptTokens + completionTokens,
            cost: calculateCost(model, promptTokens, completionTokens),
          });
          
        } catch (error) {
          console.error('Error saving messages to database:', error);
          // Don't fail the request if database save fails
        }
      },
    });

    // 8. Return streaming response
    return result.toDataStreamResponse({
      headers: {
        'X-Conversation-Id': conversation.id,
      },
    });
  } catch (error) {
    console.error('Chat API Error:', error);
    return new Response(
      JSON.stringify({
        error: 'Failed to process chat request',
        details: error instanceof Error ? error.message : 'Unknown error',
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
}

/**
 * Calculate cost in cents
 * 
 * Rough estimates - adjust based on actual pricing
 */
function calculateCost(model: string, promptTokens: number, completionTokens: number): number {
  const costs: Record<string, { prompt: number; completion: number }> = {
    'gpt-3.5-turbo': { prompt: 0.0015 / 1000, completion: 0.002 / 1000 },
    'gpt-4': { prompt: 0.03 / 1000, completion: 0.06 / 1000 },
    'gpt-4-turbo': { prompt: 0.01 / 1000, completion: 0.03 / 1000 },
    'claude-3-haiku': { prompt: 0.00025 / 1000, completion: 0.00125 / 1000 },
    'claude-3-sonnet': { prompt: 0.003 / 1000, completion: 0.015 / 1000 },
    'claude-3-opus': { prompt: 0.015 / 1000, completion: 0.075 / 1000 },
  };

  const modelCost = costs[model] || costs['gpt-3.5-turbo'];
  const promptCost = promptTokens * modelCost.prompt;
  const completionCost = completionTokens * modelCost.completion;
  
  // Return in cents
  return Math.round((promptCost + completionCost) * 100);
}
