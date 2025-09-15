'use client';

import React, { createContext, useContext, ReactNode } from 'react';
import { useToastStore } from '@/stores/toast-store';
import { Toast } from './Toast';

interface ToastContextType {
  toastStore: ReturnType<typeof useToastStore>;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

interface ToastProviderProps {
  children: ReactNode;
}

export function ToastProvider({ children }: ToastProviderProps) {
  const toastStore = useToastStore();

  return (
    <ToastContext.Provider value={{ toastStore }}>
      {children}
      <div className="fixed top-0 right-0 z-[100] flex flex-col-reverse p-4 sm:flex-col">
        {toastStore.toasts.map((toast) => (
          <Toast
            key={toast.id}
            id={toast.id}
            title={toast.title}
            description={toast.description}
            type={toast.type}
            action={toast.action}
            onClose={() => toastStore.removeToast(toast.id)}
          />
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToastContext() {
  const context = useContext(ToastContext);
  if (context === undefined) {
    throw new Error('useToastContext must be used within a ToastProvider');
  }
  return context;
}
