/**
 * Conversations API Route
 * 
 * Manages chat conversations (CRUD operations)
 */

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { aiConversations, aiMessages } from '@/lib/db/schema/ai-chat';
import { eq, and, desc } from 'drizzle-orm';
import { createId } from '@paralleldrive/cuid2';
import { AI_CONFIG } from '@/lib/ai/config';

/**
 * GET /api/conversations
 * 
 * List all conversations for the authenticated user
 */
export async function GET(req: NextRequest) {
  try {
    // Get userId from auth (replace with your auth solution)
    const userId = req.headers.get('x-user-id'); // Example
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get query params
    const { searchParams } = new URL(req.url);
    const status = searchParams.get('status');
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');

    // Build query
    let query = db.query.aiConversations.findMany({
      where: status
        ? and(
            eq(aiConversations.userId, userId),
            eq(aiConversations.status, status as any)
          )
        : eq(aiConversations.userId, userId),
      orderBy: [desc(aiConversations.lastMessageAt)],
      limit,
      offset,
    });

    const conversations = await query;

    return NextResponse.json({
      conversations,
      count: conversations.length,
      offset,
      limit,
    });
  } catch (error) {
    console.error('Error fetching conversations:', error);
    return NextResponse.json(
      { error: 'Failed to fetch conversations' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/conversations
 * 
 * Create a new conversation
 */
export async function POST(req: NextRequest) {
  try {
    // Get userId from auth
    const userId = req.headers.get('x-user-id'); // Example
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Parse request body
    const body = await req.json();
    const {
      title = 'New Chat',
      model = AI_CONFIG.defaultModel,
      provider = AI_CONFIG.defaultProvider,
      temperature = AI_CONFIG.temperature,
      maxTokens = AI_CONFIG.maxTokens,
      systemPrompt,
    } = body;

    // Create conversation
    const [conversation] = await db.insert(aiConversations).values({
      id: createId(),
      userId,
      title,
      model,
      provider,
      temperature: Math.round(temperature * 100),
      maxTokens,
      systemPrompt,
      status: 'active',
    }).returning();

    return NextResponse.json(conversation, { status: 201 });
  } catch (error) {
    console.error('Error creating conversation:', error);
    return NextResponse.json(
      { error: 'Failed to create conversation' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/conversations/[id]
 * 
 * Get a specific conversation with messages
 */
export async function GETById(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const userId = req.headers.get('x-user-id');
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = params;

    // Get conversation
    const conversation = await db.query.aiConversations.findFirst({
      where: and(
        eq(aiConversations.id, id),
        eq(aiConversations.userId, userId)
      ),
    });

    if (!conversation) {
      return NextResponse.json({ error: 'Conversation not found' }, { status: 404 });
    }

    // Get messages
    const messages = await db.query.aiMessages.findMany({
      where: eq(aiMessages.conversationId, id),
      orderBy: [desc(aiMessages.createdAt)],
    });

    return NextResponse.json({
      conversation,
      messages,
    });
  } catch (error) {
    console.error('Error fetching conversation:', error);
    return NextResponse.json(
      { error: 'Failed to fetch conversation' },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/conversations/[id]
 * 
 * Update a conversation
 */
export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const userId = req.headers.get('x-user-id');
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = params;
    const body = await req.json();
    const { title, status, systemPrompt, temperature, maxTokens } = body;

    // Verify ownership
    const conversation = await db.query.aiConversations.findFirst({
      where: and(
        eq(aiConversations.id, id),
        eq(aiConversations.userId, userId)
      ),
    });

    if (!conversation) {
      return NextResponse.json({ error: 'Conversation not found' }, { status: 404 });
    }

    // Update conversation
    const [updated] = await db.update(aiConversations)
      .set({
        ...(title && { title }),
        ...(status && { status }),
        ...(systemPrompt && { systemPrompt }),
        ...(temperature && { temperature: Math.round(temperature * 100) }),
        ...(maxTokens && { maxTokens }),
        updatedAt: new Date(),
      })
      .where(eq(aiConversations.id, id))
      .returning();

    return NextResponse.json(updated);
  } catch (error) {
    console.error('Error updating conversation:', error);
    return NextResponse.json(
      { error: 'Failed to update conversation' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/conversations/[id]
 * 
 * Delete a conversation (soft delete by setting status to 'deleted')
 */
export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const userId = req.headers.get('x-user-id');
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = params;

    // Verify ownership
    const conversation = await db.query.aiConversations.findFirst({
      where: and(
        eq(aiConversations.id, id),
        eq(aiConversations.userId, userId)
      ),
    });

    if (!conversation) {
      return NextResponse.json({ error: 'Conversation not found' }, { status: 404 });
    }

    // Soft delete
    await db.update(aiConversations)
      .set({
        status: 'deleted',
        updatedAt: new Date(),
      })
      .where(eq(aiConversations.id, id));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting conversation:', error);
    return NextResponse.json(
      { error: 'Failed to delete conversation' },
      { status: 500 }
    );
  }
}
