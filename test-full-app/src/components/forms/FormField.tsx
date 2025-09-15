'use client';

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
