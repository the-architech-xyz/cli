import { Blueprint } from '../../types/adapter.js';

const shadcnZustandIntegrationBlueprint: Blueprint = {
  id: 'shadcn-zustand-integration',
  name: 'Shadcn Zustand Integration',
  description: 'Beautiful Shadcn/ui components integrated with Zustand state management',
  version: '1.0.0',
  actions: [
    // Form Store
    {
      type: 'CREATE_FILE',
      path: 'src/stores/form-store.ts',
      condition: '{{#if integration.features.formComponents}}',
      content: `import { create } from 'zustand';
import { devtools } from 'zustand/middleware';

interface FormField {
  name: string;
  value: any;
  error?: string;
  touched: boolean;
  required: boolean;
}

interface FormState {
  fields: Record<string, FormField>;
  isValid: boolean;
  isSubmitting: boolean;
  isDirty: boolean;
  
  // Actions
  setField: (name: string, value: any) => void;
  setFieldError: (name: string, error: string) => void;
  clearFieldError: (name: string) => void;
  setFieldTouched: (name: string, touched: boolean) => void;
  setSubmitting: (isSubmitting: boolean) => void;
  resetForm: () => void;
  validateForm: () => boolean;
  getFieldValue: (name: string) => any;
  getFieldError: (name: string) => string | undefined;
  isFieldTouched: (name: string) => boolean;
}

export const useFormStore = create<FormState>()(
  devtools(
    (set, get) => ({
      fields: {},
      isValid: true,
      isSubmitting: false,
      isDirty: false,

      setField: (name: string, value: any) => {
        set((state) => ({
          fields: {
            ...state.fields,
            [name]: {
              ...state.fields[name],
              name,
              value,
              touched: true,
            },
          },
          isDirty: true,
        }));
      },

      setFieldError: (name: string, error: string) => {
        set((state) => ({
          fields: {
            ...state.fields,
            [name]: {
              ...state.fields[name],
              error,
            },
          },
        }));
      },

      clearFieldError: (name: string) => {
        set((state) => ({
          fields: {
            ...state.fields,
            [name]: {
              ...state.fields[name],
              error: undefined,
            },
          },
        }));
      },

      setFieldTouched: (name: string, touched: boolean) => {
        set((state) => ({
          fields: {
            ...state.fields,
            [name]: {
              ...state.fields[name],
              touched,
            },
          },
        }));
      },

      setSubmitting: (isSubmitting: boolean) => {
        set({ isSubmitting });
      },

      resetForm: () => {
        set({
          fields: {},
          isValid: true,
          isSubmitting: false,
          isDirty: false,
        });
      },

      validateForm: () => {
        const { fields } = get();
        const hasErrors = Object.values(fields).some(field => field.error);
        const isValid = !hasErrors;
        
        set({ isValid });
        return isValid;
      },

      getFieldValue: (name: string) => {
        return get().fields[name]?.value;
      },

      getFieldError: (name: string) => {
        return get().fields[name]?.error;
      },

      isFieldTouched: (name: string) => {
        return get().fields[name]?.touched || false;
      },
    }),
    {
      name: 'form-store',
    }
  )
);
`
    },
    {
      type: 'CREATE_FILE',
      path: 'src/stores/modal-store.ts',
      condition: '{{#if integration.features.modalComponents}}',
      content: `import { create } from 'zustand';
import { devtools } from 'zustand/middleware';

interface Modal {
  id: string;
  component: React.ComponentType<any>;
  props?: any;
  isOpen: boolean;
  onClose?: () => void;
}

interface ModalState {
  modals: Modal[];
  
  // Actions
  openModal: (modal: Omit<Modal, 'isOpen'>) => string;
  closeModal: (id: string) => void;
  closeAllModals: () => void;
  updateModal: (id: string, updates: Partial<Modal>) => void;
  getModal: (id: string) => Modal | undefined;
  isModalOpen: (id: string) => boolean;
}

export const useModalStore = create<ModalState>()(
  devtools(
    (set, get) => ({
      modals: [],

      openModal: (modal: Omit<Modal, 'isOpen'>) => {
        const id = Math.random().toString(36).substr(2, 9);
        const newModal: Modal = {
          ...modal,
          id,
          isOpen: true,
        };

        set((state) => ({
          modals: [...state.modals, newModal],
        }));

        return id;
      },

      closeModal: (id: string) => {
        set((state) => ({
          modals: state.modals.map(modal =>
            modal.id === id ? { ...modal, isOpen: false } : modal
          ),
        }));

        // Remove modal after animation
        setTimeout(() => {
          set((state) => ({
            modals: state.modals.filter(modal => modal.id !== id),
          }));
        }, 300);
      },

      closeAllModals: () => {
        set((state) => ({
          modals: state.modals.map(modal => ({ ...modal, isOpen: false })),
        }));

        // Remove all modals after animation
        setTimeout(() => {
          set({ modals: [] });
        }, 300);
      },

      updateModal: (id: string, updates: Partial<Modal>) => {
        set((state) => ({
          modals: state.modals.map(modal =>
            modal.id === id ? { ...modal, ...updates } : modal
          ),
        }));
      },

      getModal: (id: string) => {
        return get().modals.find(modal => modal.id === id);
      },

      isModalOpen: (id: string) => {
        return get().modals.some(modal => modal.id === id && modal.isOpen);
      },
    }),
    {
      name: 'modal-store',
    }
  )
);
`
    },
    {
      type: 'CREATE_FILE',
      path: 'src/stores/toast-store.ts',
      condition: '{{#if integration.features.toastComponents}}',
      content: `import { create } from 'zustand';
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
`
    },
    {
      type: 'CREATE_FILE',
      path: 'src/components/forms/FormProvider.tsx',
      condition: '{{#if integration.features.formComponents}}',
      content: `'use client';

import React, { createContext, useContext, ReactNode } from 'react';
import { useFormStore } from '@/stores/form-store';

interface FormContextType {
  formStore: ReturnType<typeof useFormStore>;
}

const FormContext = createContext<FormContextType | undefined>(undefined);

interface FormProviderProps {
  children: ReactNode;
  initialValues?: Record<string, any>;
  validationSchema?: any;
}

export function FormProvider({ 
  children, 
  initialValues = {}, 
  validationSchema 
}: FormProviderProps) {
  const formStore = useFormStore();

  // Initialize form with initial values
  React.useEffect(() => {
    if (Object.keys(initialValues).length > 0) {
      Object.entries(initialValues).forEach(([name, value]) => {
        formStore.setField(name, value);
      });
    }
  }, [initialValues, formStore]);

  return (
    <FormContext.Provider value={{ formStore }}>
      {children}
    </FormContext.Provider>
  );
}

export function useFormContext() {
  const context = useContext(FormContext);
  if (context === undefined) {
    throw new Error('useFormContext must be used within a FormProvider');
  }
  return context;
}
`
    },
    {
      type: 'CREATE_FILE',
      path: 'src/components/forms/FormField.tsx',
      condition: '{{#if integration.features.formComponents}}',
      content: `'use client';

import React from 'react';
import { useFormContext } from './FormProvider';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';

interface FormFieldProps {
  name: string;
  label?: string;
  required?: boolean;
  children: React.ReactNode;
  className?: string;
}

export function FormField({ 
  name, 
  label, 
  required = false, 
  children, 
  className 
}: FormFieldProps) {
  const { formStore } = useFormContext();
  const error = formStore.getFieldError(name);
  const touched = formStore.isFieldTouched(name);

  return (
    <div className={cn('space-y-2', className)}>
      {label && (
        <Label htmlFor={name} className="text-sm font-medium">
          {label}
          {required && <span className="text-destructive ml-1">*</span>}
        </Label>
      )}
      {children}
      {error && touched && (
        <p className="text-sm text-destructive">{error}</p>
      )}
    </div>
  );
}
`
    },
    {
      type: 'CREATE_FILE',
      path: 'src/components/forms/FormInput.tsx',
      condition: '{{#if integration.features.formComponents}}',
      content: `'use client';

import React from 'react';
import { useFormContext } from './FormProvider';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

interface FormInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  name: string;
  label?: string;
  required?: boolean;
}

export function FormInput({ 
  name, 
  label, 
  required = false, 
  className,
  ...props 
}: FormInputProps) {
  const { formStore } = useFormContext();
  const value = formStore.getFieldValue(name) || '';
  const error = formStore.getFieldError(name);
  const touched = formStore.isFieldTouched(name);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    formStore.setField(name, e.target.value);
    if (error) {
      formStore.clearFieldError(name);
    }
  };

  const handleBlur = () => {
    formStore.setFieldTouched(name, true);
  };

  return (
    <div className="space-y-2">
      {label && (
        <label htmlFor={name} className="text-sm font-medium">
          {label}
          {required && <span className="text-destructive ml-1">*</span>}
        </label>
      )}
      <Input
        id={name}
        name={name}
        value={value}
        onChange={handleChange}
        onBlur={handleBlur}
        className={cn(
          error && touched && 'border-destructive focus-visible:ring-destructive',
          className
        )}
        {...props}
      />
      {error && touched && (
        <p className="text-sm text-destructive">{error}</p>
      )}
    </div>
  );
}
`
    },
    {
      type: 'CREATE_FILE',
      path: 'src/components/modals/ModalProvider.tsx',
      condition: '{{#if integration.features.modalComponents}}',
      content: `'use client';

import React, { createContext, useContext, ReactNode } from 'react';
import { useModalStore } from '@/stores/modal-store';
import { Modal } from './Modal';

interface ModalContextType {
  modalStore: ReturnType<typeof useModalStore>;
}

const ModalContext = createContext<ModalContextType | undefined>(undefined);

interface ModalProviderProps {
  children: ReactNode;
}

export function ModalProvider({ children }: ModalProviderProps) {
  const modalStore = useModalStore();

  return (
    <ModalContext.Provider value={{ modalStore }}>
      {children}
      {modalStore.modals.map((modal) => (
        <Modal
          key={modal.id}
          id={modal.id}
          component={modal.component}
          props={modal.props}
          isOpen={modal.isOpen}
          onClose={() => modalStore.closeModal(modal.id)}
        />
      ))}
    </ModalContext.Provider>
  );
}

export function useModalContext() {
  const context = useContext(ModalContext);
  if (context === undefined) {
    throw new Error('useModalContext must be used within a ModalProvider');
  }
  return context;
}
`
    },
    {
      type: 'CREATE_FILE',
      path: 'src/components/modals/Modal.tsx',
      condition: '{{#if integration.features.modalComponents}}',
      content: `'use client';

import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

interface ModalProps {
  id: string;
  component: React.ComponentType<any>;
  props?: any;
  isOpen: boolean;
  onClose: () => void;
}

export function Modal({ 
  id, 
  component: Component, 
  props = {}, 
  isOpen, 
  onClose 
}: ModalProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <Component {...props} onClose={onClose} />
      </DialogContent>
    </Dialog>
  );
}
`
    },
    {
      type: 'CREATE_FILE',
      path: 'src/components/toasts/ToastProvider.tsx',
      condition: '{{#if integration.features.toastComponents}}',
      content: `'use client';

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
`
    },
    {
      type: 'CREATE_FILE',
      path: 'src/components/toasts/Toast.tsx',
      condition: '{{#if integration.features.toastComponents}}',
      content: `'use client';

import React from 'react';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { CheckCircle, XCircle, AlertTriangle, Info } from 'lucide-react';

interface ToastProps {
  id: string;
  title?: string;
  description?: string;
  type?: 'default' | 'success' | 'error' | 'warning' | 'info';
  action?: {
    label: string;
    onClick: () => void;
  };
  onClose: () => void;
}

const icons = {
  success: CheckCircle,
  error: XCircle,
  warning: AlertTriangle,
  info: Info,
  default: Info,
};

const styles = {
  success: 'border-green-200 bg-green-50 text-green-900',
  error: 'border-red-200 bg-red-50 text-red-900',
  warning: 'border-yellow-200 bg-yellow-50 text-yellow-900',
  info: 'border-blue-200 bg-blue-50 text-blue-900',
  default: 'border-gray-200 bg-white text-gray-900',
};

export function Toast({ 
  id, 
  title, 
  description, 
  type = 'default', 
  action, 
  onClose 
}: ToastProps) {
  const Icon = icons[type];

  return (
    <div
      className={cn(
        'pointer-events-auto w-full max-w-sm overflow-hidden rounded-lg border shadow-lg',
        styles[type]
      )}
    >
      <div className="p-4">
        <div className="flex items-start">
          <div className="flex-shrink-0">
            <Icon className="h-5 w-5" />
          </div>
          <div className="ml-3 w-0 flex-1">
            {title && (
              <p className="text-sm font-medium">{title}</p>
            )}
            {description && (
              <p className="mt-1 text-sm opacity-90">{description}</p>
            )}
            {action && (
              <div className="mt-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={action.onClick}
                >
                  {action.label}
                </Button>
              </div>
            )}
          </div>
          <div className="ml-4 flex-shrink-0">
            <Button
              size="sm"
              variant="ghost"
              onClick={onClose}
              className="h-5 w-5 p-0"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
`
    }
  ]
};

export const blueprint = shadcnZustandIntegrationBlueprint;
