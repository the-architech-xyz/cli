'use client';

import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';

// Types
export interface ChatProviderState {
  currentConversationId: string | null;
  sidebarOpen: boolean;
  settingsOpen: boolean;
  isTyping: boolean;
  typingUser: string | null;
}

export interface ChatProviderContextType extends ChatProviderState {
  setCurrentConversationId: (id: string | null) => void;
  setSidebarOpen: (open: boolean) => void;
  toggleSidebar: () => void;
  setSettingsOpen: (open: boolean) => void;
  toggleSettings: () => void;
  setTyping: (isTyping: boolean, user?: string) => void;
}

// Initial state
const initialState: ChatProviderState = {
  currentConversationId: null,
  sidebarOpen: true,
  settingsOpen: false,
  isTyping: false,
  typingUser: null,
};

// Context
const ChatProviderContext = createContext<ChatProviderContextType | undefined>(undefined);

// Provider component
interface ChatProviderProps {
  children: ReactNode;
  initialConversationId?: string | null;
  initialSidebarOpen?: boolean;
}

export const ChatProvider: React.FC<ChatProviderProps> = ({
  children,
  initialConversationId = null,
  initialSidebarOpen = true,
}) => {
  const [state, setState] = useState<ChatProviderState>({
    ...initialState,
    currentConversationId: initialConversationId,
    sidebarOpen: initialSidebarOpen,
  });

  const setCurrentConversationId = useCallback((id: string | null) => {
    setState(prev => ({ ...prev, currentConversationId: id }));
  }, []);

  const setSidebarOpen = useCallback((open: boolean) => {
    setState(prev => ({ ...prev, sidebarOpen: open }));
  }, []);

  const toggleSidebar = useCallback(() => {
    setState(prev => ({ ...prev, sidebarOpen: !prev.sidebarOpen }));
  }, []);

  const setSettingsOpen = useCallback((open: boolean) => {
    setState(prev => ({ ...prev, settingsOpen: open }));
  }, []);

  const toggleSettings = useCallback(() => {
    setState(prev => ({ ...prev, settingsOpen: !prev.settingsOpen }));
  }, []);

  const setTyping = useCallback((isTyping: boolean, user?: string) => {
    setState(prev => ({ 
      ...prev, 
      isTyping, 
      typingUser: isTyping ? (user || null) : null 
    }));
  }, []);

  const contextValue: ChatProviderContextType = {
    ...state,
    setCurrentConversationId,
    setSidebarOpen,
    toggleSidebar,
    setSettingsOpen,
    toggleSettings,
    setTyping,
  };

  return (
    <ChatProviderContext.Provider value={contextValue}>
      {children}
    </ChatProviderContext.Provider>
  );
};

// Hook to use the chat provider context
export const useChatProvider = (): ChatProviderContextType => {
  const context = useContext(ChatProviderContext);
  if (context === undefined) {
    throw new Error('useChatProvider must be used within a ChatProvider');
  }
  return context;
};

// Export default for easier importing
export default ChatProvider;
