'use client';

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
