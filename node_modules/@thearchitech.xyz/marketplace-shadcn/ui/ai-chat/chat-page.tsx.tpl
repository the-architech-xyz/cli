'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { toast } from 'sonner';
import { ChatInterface } from '@/components/ai-chat/ChatInterface';
import { ConversationSidebar } from '@/components/ai-chat/ConversationSidebar';
import { AIProvider } from '@/components/ai-chat/AIProvider';
import { ChatProvider } from '@/components/ai-chat/ChatProvider';
import { Loader2, Menu, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useAIChat } from '@/hooks/useAIChatExtended';

export default function ChatPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const conversationId = searchParams.get('id');
  
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isMobile, setIsMobile] = useState(false);
  
  const {
    conversations,
    currentConversation,
    messages,
    isLoading,
    error,
    sendMessage,
    createConversation,
    selectConversation,
    updateConversation,
    deleteConversation,
    archiveConversation,
    pinConversation,
    unpinConversation,
    clearConversation,
    exportConversation,
    deleteMessage,
  } = useAIChat();

  // Handle responsive sidebar
  useEffect(() => {
    const checkMobile = () => {
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);
      if (!mobile) {
        setIsSidebarOpen(true);
      }
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Load conversation from URL
  useEffect(() => {
    if (conversationId && conversations.length > 0) {
      const conversation = conversations.find(c => c.id === conversationId);
      if (conversation) {
        selectConversation(conversationId);
      }
    }
  }, [conversationId, conversations]);

  const handleConversationSelect = (id: string) => {
    selectConversation(id);
    router.push(`/chat?id=${id}`);
    
    if (isMobile) {
      setIsSidebarOpen(false);
    }
  };

  const handleConversationCreate = async (data: { title?: string }) => {
    try {
      const conversation = await createConversation(data);
      router.push(`/chat?id=${conversation.id}`);
      
      if (isMobile) {
        setIsSidebarOpen(false);
      }
      
      toast({
        title: 'Conversation created',
        description: 'New conversation started successfully',
      });
    } catch (error) {
      toast({
        title: 'Failed to create conversation',
        description: error instanceof Error ? error.message : 'Please try again',
        variant: 'destructive',
      });
    }
  };

  const handleSendMessage = async (content: string, attachments?: File[]) => {
    try {
      await sendMessage({
        content,
        conversationId: currentConversation?.id,
        attachments,
      });
    } catch (error) {
      toast({
        title: 'Failed to send message',
        description: error instanceof Error ? error.message : 'Please try again',
        variant: 'destructive',
      });
      throw error;
    }
  };

  const handleClearChat = async () => {
    if (!currentConversation) return;
    
    try {
      await clearConversation(currentConversation.id);
      
      toast({
        title: 'Chat cleared',
        description: 'All messages have been removed',
      });
    } catch (error) {
      toast({
        title: 'Failed to clear chat',
        description: error instanceof Error ? error.message : 'Please try again',
        variant: 'destructive',
      });
    }
  };

  const handleExportChat = async () => {
    if (!currentConversation) return;
    
    try {
      await exportConversation(currentConversation.id, 'json');
      
      toast({
        title: 'Chat exported',
        description: 'Your conversation has been downloaded',
      });
    } catch (error) {
      toast({
        title: 'Failed to export chat',
        description: error instanceof Error ? error.message : 'Please try again',
        variant: 'destructive',
      });
    }
  };

  if (error) {
    return (
      <AIProvider>
        <div className="flex h-screen items-center justify-center bg-background">
          <div className="text-center space-y-4">
            <h2 className="text-2xl font-bold text-red-600">Error loading chat</h2>
            <p className="text-muted-foreground">{error}</p>
            <Button onClick={() => window.location.reload()}>
              Reload Page
            </Button>
          </div>
        </div>
      </AIProvider>
    );
  }

  return (
    <AIProvider>
      <ChatProvider>
        <div className="flex h-screen bg-background overflow-hidden">
          {/* Mobile Sidebar Toggle */}
          {isMobile && (
            <div className="absolute top-4 left-4 z-50">
              <Button
                variant="outline"
                size="icon"
                onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                className="bg-background"
              >
                {isSidebarOpen ? (
                  <X className="h-4 w-4" />
                ) : (
                  <Menu className="h-4 w-4" />
                )}
              </Button>
            </div>
          )}

          {/* Conversation Sidebar */}
          <aside
            className={cn(
              'border-r bg-background transition-all duration-300 z-40',
              isMobile
                ? isSidebarOpen
                  ? 'absolute left-0 top-0 bottom-0 w-80 shadow-lg'
                  : 'absolute -left-80 top-0 bottom-0 w-80'
                : isSidebarOpen
                ? 'relative w-80'
                : 'relative w-0 overflow-hidden'
            )}
          >
            {(isSidebarOpen || !isMobile) && (
              <ConversationSidebar
                conversations={conversations || []}
                activeConversationId={currentConversation?.id}
                onConversationSelect={handleConversationSelect}
                onConversationCreate={handleConversationCreate}
                onConversationUpdate={updateConversation}
                onConversationDelete={deleteConversation}
                onConversationArchive={archiveConversation}
                onConversationPin={pinConversation}
                onConversationUnpin={unpinConversation}
                showSearch
                showCreateButton
                maxHeight="calc(100vh - 80px)"
              />
            )}
          </aside>

          {/* Main Chat Area */}
          <main className="flex-1 flex flex-col overflow-hidden">
            {!currentConversation && conversations.length === 0 ? (
              <div className="flex-1 flex items-center justify-center text-center p-6">
                <div className="space-y-4">
                  <h2 className="text-2xl font-bold">Welcome to AI Chat</h2>
                  <p className="text-muted-foreground max-w-md">
                    Start a new conversation to begin chatting with AI. Ask questions, get help, or just have a conversation.
                  </p>
                  <Button
                    size="lg"
                    onClick={() => handleConversationCreate({ title: 'New Chat' })}
                  >
                    Start New Conversation
                  </Button>
                </div>
              </div>
            ) : !currentConversation ? (
              <div className="flex-1 flex items-center justify-center">
                <div className="text-center space-y-4">
                  <Loader2 className="h-8 w-8 animate-spin mx-auto text-muted-foreground" />
                  <p className="text-muted-foreground">Loading conversation...</p>
                </div>
              </div>
            ) : (
              <ChatInterface
                messages={messages}
                onSendMessage={handleSendMessage}
                isLoading={isLoading}
                placeholder="Type your message... (Shift+Enter for new line)"
                maxLength={4000}
                onClearChat={handleClearChat}
                onExportChat={handleExportChat}
                onDeleteMessage={deleteMessage}
                showTypingIndicator={isLoading}
                typingUser="AI Assistant"
              />
            )}
          </main>
        </div>
      </ChatProvider>
    </AIProvider>
  );
}
