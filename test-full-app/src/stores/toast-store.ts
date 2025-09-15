import { create } from 'zustand';
import { devtools } from 'zustand/middleware';

export interface Toast {
  id: string;
  title?: string;
  description?: string;
  type?: 'default' | 'success' | 'error' | 'warning' | 'info';
  duration?: number;
  action?: {
    label: string;
    onClick: () => void;
  };
  createdAt: Date;
}

interface ToastState {
  toasts: Toast[];
  
  // Actions
  addToast: (toast: Omit<Toast, 'id' | 'createdAt'>) => string;
  removeToast: (id: string) => void;
  clearToasts: () => void;
  clearToastsByType: (type: Toast['type']) => void;
  success: (title: string, description?: string) => string;
  error: (title: string, description?: string) => string;
  warning: (title: string, description?: string) => string;
  info: (title: string, description?: string) => string;
}

export const useToastStore = create<ToastState>()(
  devtools(
    (set, get) => ({
      toasts: [],

      addToast: (toast) => {
        const id = Math.random().toString(36).substr(2, 9);
        const newToast: Toast = {
          ...toast,
          id,
          createdAt: new Date(),
          duration: toast.duration || 5000,
        };

        set((state) => ({
          toasts: [...state.toasts, newToast],
        }));

        // Auto-remove toast after duration
        if (newToast.duration > 0) {
          setTimeout(() => {
            get().removeToast(id);
          }, newToast.duration);
        }

        return id;
      },

      removeToast: (id: string) => {
        set((state) => ({
          toasts: state.toasts.filter(toast => toast.id !== id),
        }));
      },

      clearToasts: () => {
        set({ toasts: [] });
      },

      clearToastsByType: (type: Toast['type']) => {
        set((state) => ({
          toasts: state.toasts.filter(toast => toast.type !== type),
        }));
      },

      success: (title: string, description?: string) => {
        return get().addToast({
          title,
          description,
          type: 'success',
        });
      },

      error: (title: string, description?: string) => {
        return get().addToast({
          title,
          description,
          type: 'error',
        });
      },

      warning: (title: string, description?: string) => {
        return get().addToast({
          title,
          description,
          type: 'warning',
        });
      },

      info: (title: string, description?: string) => {
        return get().addToast({
          title,
          description,
          type: 'info',
        });
      },
    }),
    {
      name: 'toast-store',
    }
  )
);
