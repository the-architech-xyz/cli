import { create } from 'zustand';
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
