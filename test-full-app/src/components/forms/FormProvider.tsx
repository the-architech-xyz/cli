'use client';

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
