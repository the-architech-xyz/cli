'use client';

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
