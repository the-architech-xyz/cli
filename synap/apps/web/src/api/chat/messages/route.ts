/**
 * Messages API Route
 * 
 * Manages messages within conversations
 */

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { aiMessages, aiConversations } from '@/lib/db/schema/ai-chat';
import { eq, and, desc } from 'drizzle-orm';

/**
 * GET /api/conversations/[conversationId]/messages
 * 
 * Get all messages for a conversation
 */
export async function GET(
  req: NextRequest,
  { params }: { params: { conversationId: string } }
) {
  try {
    const userId = req.headers.get('x-user-id');
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { conversationId } = params;

    // Verify conversation ownership
    const conversation = await db.query.aiConversations.findFirst({
      where: and(
        eq(aiConversations.id, conversationId),
        eq(aiConversations.userId, userId)
      ),
    });

    if (!conversation) {
      return NextResponse.json({ error: 'Conversation not found' }, { status: 404 });
    }

    // Get messages
    const { searchParams } = new URL(req.url);
    const limit = parseInt(searchParams.get('limit') || '100');
    const offset = parseInt(searchParams.get('offset') || '0');

    const messages = await db.query.aiMessages.findMany({
      where: eq(aiMessages.conversationId, conversationId),
      orderBy: [desc(aiMessages.createdAt)],
      limit,
      offset,
    });

    return NextResponse.json({
      messages,
      count: messages.length,
      offset,
      limit,
    });
  } catch (error) {
    console.error('Error fetching messages:', error);
    return NextResponse.json(
      { error: 'Failed to fetch messages' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/messages/[id]
 * 
 * Get a specific message
 */
export async function GETById(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const userId = req.headers.get('x-user-id');
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = params;

    // Get message
    const message = await db.query.aiMessages.findFirst({
      where: eq(aiMessages.id, id),
    });

    if (!message) {
      return NextResponse.json({ error: 'Message not found' }, { status: 404 });
    }

    // Verify conversation ownership
    const conversation = await db.query.aiConversations.findFirst({
      where: and(
        eq(aiConversations.id, message.conversationId),
        eq(aiConversations.userId, userId)
      ),
    });

    if (!conversation) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    return NextResponse.json(message);
  } catch (error) {
    console.error('Error fetching message:', error);
    return NextResponse.json(
      { error: 'Failed to fetch message' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/messages/[id]
 * 
 * Delete a message
 */
export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const userId = req.headers.get('x-user-id');
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = params;

    // Get message
    const message = await db.query.aiMessages.findFirst({
      where: eq(aiMessages.id, id),
    });

    if (!message) {
      return NextResponse.json({ error: 'Message not found' }, { status: 404 });
    }

    // Verify conversation ownership
    const conversation = await db.query.aiConversations.findFirst({
      where: and(
        eq(aiConversations.id, message.conversationId),
        eq(aiConversations.userId, userId)
      ),
    });

    if (!conversation) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    // Delete message
    await db.delete(aiMessages).where(eq(aiMessages.id, id));

    // Update conversation stats
    await db.update(aiConversations)
      .set({
        totalMessages: Math.max(0, conversation.totalMessages - 1),
        updatedAt: new Date(),
      })
      .where(eq(aiConversations.id, message.conversationId));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting message:', error);
    return NextResponse.json(
      { error: 'Failed to delete message' },
      { status: 500 }
    );
  }
}
