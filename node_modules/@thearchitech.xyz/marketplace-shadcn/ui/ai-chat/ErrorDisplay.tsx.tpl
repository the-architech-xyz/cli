'use client';

import React, { useState, useCallback } from 'react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  AlertCircle, 
  X, 
  RotateCcw, 
  RefreshCw, 
  Info, 
  AlertTriangle,
  Bug,
  Wifi,
  Server,
  Shield,
  Clock,
  CheckCircle
} from 'lucide-react';
import { ChatError } from '@/types/ai-chat';

export interface ErrorDisplayProps {
  className?: string;
  error: Error | ChatError;
  onRetry?: () => void;
  onDismiss?: () => void;
  onReport?: () => void;
  variant?: 'default' | 'minimal' | 'card' | 'inline' | 'toast' | 'modal';
  size?: 'sm' | 'md' | 'lg';
  showIcon?: boolean;
  showActions?: boolean;
  showDetails?: boolean;
  showReport?: boolean;
  showRetry?: boolean;
  showDismiss?: boolean;
  persistent?: boolean;
  autoDismiss?: boolean;
  autoDismissDelay?: number;
  onAutoDismiss?: () => void;
}

export function ErrorDisplay({
  className,
  error,
  onRetry,
  onDismiss,
  onReport,
  variant = 'default',
  size = 'md',
  showIcon = true,
  showActions = true,
  showDetails = false,
  showReport = false,
  showRetry = true,
  showDismiss = true,
  persistent = false,
  autoDismiss = false,
  autoDismissDelay = 5000,
  onAutoDismiss,
}: ErrorDisplayProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isRetrying, setIsRetrying] = useState(false);

  // Get error type
  const getErrorType = (): string => {
    if ('type' in error) {
      return error.type;
    }
    if (error.message.includes('network') || error.message.includes('fetch')) {
      return 'network_error';
    }
    if (error.message.includes('permission') || error.message.includes('denied')) {
      return 'permission_error';
    }
    if (error.message.includes('timeout')) {
      return 'timeout_error';
    }
    if (error.message.includes('quota') || error.message.includes('limit')) {
      return 'quota_error';
    }
    if (error.message.includes('validation') || error.message.includes('invalid')) {
      return 'validation_error';
    }
    return 'unknown_error';
  };

  // Get error icon
  const getErrorIcon = () => {
    const errorType = getErrorType();
    switch (errorType) {
      case 'network_error':
        return <Wifi className="h-5 w-5" />;
      case 'permission_error':
        return <Shield className="h-5 w-5" />;
      case 'timeout_error':
        return <Clock className="h-5 w-5" />;
      case 'quota_error':
        return <AlertTriangle className="h-5 w-5" />;
      case 'validation_error':
        return <Info className="h-5 w-5" />;
      case 'model_error':
        return <Server className="h-5 w-5" />;
      case 'rate_limit_error':
        return <Clock className="h-5 w-5" />;
      default:
        return <AlertCircle className="h-5 w-5" />;
    }
  };

  // Get error color
  const getErrorColor = (): string => {
    const errorType = getErrorType();
    switch (errorType) {
      case 'network_error':
        return 'text-blue-600 bg-blue-50 border-blue-200';
      case 'permission_error':
        return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'timeout_error':
        return 'text-orange-600 bg-orange-50 border-orange-200';
      case 'quota_error':
        return 'text-red-600 bg-red-50 border-red-200';
      case 'validation_error':
        return 'text-purple-600 bg-purple-50 border-purple-200';
      case 'model_error':
        return 'text-indigo-600 bg-indigo-50 border-indigo-200';
      case 'rate_limit_error':
        return 'text-amber-600 bg-amber-50 border-amber-200';
      default:
        return 'text-red-600 bg-red-50 border-red-200';
    }
  };

  // Get error title
  const getErrorTitle = (): string => {
    const errorType = getErrorType();
    switch (errorType) {
      case 'network_error':
        return 'Connection Error';
      case 'permission_error':
        return 'Permission Denied';
      case 'timeout_error':
        return 'Request Timeout';
      case 'quota_error':
        return 'Quota Exceeded';
      case 'validation_error':
        return 'Invalid Input';
      case 'model_error':
        return 'Model Error';
      case 'rate_limit_error':
        return 'Rate Limited';
      default:
        return 'An Error Occurred';
    }
  };

  // Get error description
  const getErrorDescription = (): string => {
    const errorType = getErrorType();
    switch (errorType) {
      case 'network_error':
        return 'Please check your internet connection and try again.';
      case 'permission_error':
        return 'You don\'t have permission to perform this action.';
      case 'timeout_error':
        return 'The request took too long to complete. Please try again.';
      case 'quota_error':
        return 'You\'ve exceeded your usage quota. Please upgrade your plan.';
      case 'validation_error':
        return 'Please check your input and try again.';
      case 'model_error':
        return 'There was an issue with the AI model. Please try again.';
      case 'rate_limit_error':
        return 'Too many requests. Please wait a moment and try again.';
      default:
        return 'Something went wrong. Please try again.';
    }
  };

  // Get retry delay
  const getRetryDelay = (): number => {
    const errorType = getErrorType();
    switch (errorType) {
      case 'rate_limit_error':
        return 5000;
      case 'timeout_error':
        return 2000;
      case 'network_error':
        return 3000;
      default:
        return 1000;
    }
  };

  // Handle retry
  const handleRetry = useCallback(async () => {
    if (isRetrying) return;
    
    setIsRetrying(true);
    try {
      await onRetry?.();
    } finally {
      setIsRetrying(false);
    }
  }, [isRetrying, onRetry]);

  // Handle dismiss
  const handleDismiss = useCallback(() => {
    onDismiss?.();
  }, [onDismiss]);

  // Handle report
  const handleReport = useCallback(() => {
    onReport?.();
  }, [onReport]);

  // Auto dismiss effect
  React.useEffect(() => {
    if (autoDismiss && !persistent) {
      const timer = setTimeout(() => {
        onAutoDismiss?.();
      }, autoDismissDelay);
      return () => clearTimeout(timer);
    }
  }, [autoDismiss, persistent, autoDismissDelay, onAutoDismiss]);

  // Render content
  const renderContent = () => (
    <div className={cn('flex items-start gap-3', className)}>
      {/* Icon */}
      {showIcon && (
        <div className="flex-shrink-0 mt-0.5">
          {getErrorIcon()}
        </div>
      )}

      {/* Content */}
      <div className="flex-1 min-w-0">
        {/* Title and Message */}
        <div className="space-y-1">
          <h3 className="font-medium text-sm">{getErrorTitle()}</h3>
          <p className="text-sm text-muted-foreground">{getErrorDescription()}</p>
          {showDetails && (
            <details className="text-xs text-muted-foreground">
              <summary className="cursor-pointer hover:text-foreground">
                Technical Details
              </summary>
              <pre className="mt-2 p-2 bg-muted rounded text-xs overflow-auto">
                {error.message}
                {error.stack && `\n\nStack Trace:\n${error.stack}`}
              </pre>
            </details>
          )}
        </div>

        {/* Actions */}
        {showActions && (
          <div className="flex items-center gap-2 mt-3">
            {showRetry && onRetry && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleRetry}
                disabled={isRetrying}
              >
                {isRetrying ? (
                  <RefreshCw className="h-3 w-3 mr-1 animate-spin" />
                ) : (
                  <RotateCcw className="h-3 w-3 mr-1" />
                )}
                {isRetrying ? 'Retrying...' : 'Retry'}
              </Button>
            )}
            
            {showReport && onReport && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleReport}
              >
                <Bug className="h-3 w-3 mr-1" />
                Report
              </Button>
            )}
            
            {showDismiss && onDismiss && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleDismiss}
              >
                <X className="h-3 w-3 mr-1" />
                Dismiss
              </Button>
            )}
          </div>
        )}
      </div>
    </div>
  );

  // Render based on variant
  if (variant === 'minimal') {
    return (
      <div className={cn('flex items-center gap-2 text-sm', getErrorColor(), className)}>
        {showIcon && getErrorIcon()}
        <span>{error.message}</span>
        {showDismiss && onDismiss && (
          <Button
            variant="ghost"
            size="sm"
            className="h-4 w-4 p-0"
            onClick={handleDismiss}
          >
            <X className="h-3 w-3" />
          </Button>
        )}
      </div>
    );
  }

  if (variant === 'inline') {
    return (
      <span className={cn('inline-flex items-center gap-1 text-xs', getErrorColor(), className)}>
        {showIcon && getErrorIcon()}
        <span>{error.message}</span>
      </span>
    );
  }

  if (variant === 'toast') {
    return (
      <div className={cn('fixed top-4 right-4 z-50 max-w-sm', className)}>
        <Card className={cn('border-l-4', getErrorColor())}>
          <CardContent className="p-3">
            {renderContent()}
          </CardContent>
        </Card>
      </div>
    );
  }

  if (variant === 'modal') {
    return (
      <div className="fixed inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center z-50">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {showIcon && getErrorIcon()}
              {getErrorTitle()}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              {getErrorDescription()}
            </p>
            {showActions && (
              <div className="flex justify-end gap-2">
                {showRetry && onRetry && (
                  <Button
                    variant="outline"
                    onClick={handleRetry}
                    disabled={isRetrying}
                  >
                    {isRetrying ? 'Retrying...' : 'Retry'}
                  </Button>
                )}
                {showDismiss && onDismiss && (
                  <Button onClick={handleDismiss}>
                    Dismiss
                  </Button>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    );
  }

  // Default variant (card)
  return (
    <Card className={cn('border-l-4', getErrorColor(), className)}>
      <CardContent className="p-4">
        {renderContent()}
      </CardContent>
    </Card>
  );
}

export default ErrorDisplay;
