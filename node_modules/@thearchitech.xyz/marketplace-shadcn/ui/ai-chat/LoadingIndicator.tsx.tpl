'use client';

import React, { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { 
  Loader2, 
  Bot, 
  MessageSquare, 
  Zap, 
  Clock, 
  CheckCircle,
  AlertCircle,
  Info,
  Sparkles,
  Brain,
  Cpu,
  Database,
  Network,
  FileText,
  Image,
  Video,
  Music
} from 'lucide-react';

export interface LoadingIndicatorProps {
  className?: string;
  message?: string;
  showProgress?: boolean;
  progress?: number;
  type?: 'default' | 'message' | 'streaming' | 'upload' | 'processing' | 'thinking' | 'generating' | 'analyzing' | 'saving' | 'loading';
  size?: 'sm' | 'md' | 'lg';
  variant?: 'default' | 'minimal' | 'card' | 'inline';
  animated?: boolean;
  showIcon?: boolean;
  showDots?: boolean;
  showSpinner?: boolean;
  showPulse?: boolean;
  showWave?: boolean;
  showBounce?: boolean;
  showFade?: boolean;
  showSlide?: boolean;
  showScale?: boolean;
  showRotate?: boolean;
  showGlow?: boolean;
  showShimmer?: boolean;
  showGradient?: boolean;
  showPattern?: boolean;
  showText?: boolean;
  showPercentage?: boolean;
  showTime?: boolean;
  showSteps?: boolean;
  steps?: string[];
  currentStep?: number;
  estimatedTime?: number;
  startTime?: number;
  onComplete?: () => void;
  onCancel?: () => void;
  cancellable?: boolean;
  persistent?: boolean;
  overlay?: boolean;
  fullscreen?: boolean;
  position?: 'top' | 'center' | 'bottom' | 'left' | 'right';
  zIndex?: number;
}

export function LoadingIndicator({
  className,
  message = 'Loading...',
  showProgress = false,
  progress = 0,
  type = 'default',
  size = 'md',
  variant = 'default',
  animated = true,
  showIcon = true,
  showDots = true,
  showSpinner = true,
  showPulse = false,
  showWave = false,
  showBounce = false,
  showFade = false,
  showSlide = false,
  showScale = false,
  showRotate = false,
  showGlow = false,
  showShimmer = false,
  showGradient = false,
  showPattern = false,
  showText = true,
  showPercentage = false,
  showTime = false,
  showSteps = false,
  steps = [],
  currentStep = 0,
  estimatedTime = 0,
  startTime = Date.now(),
  onComplete,
  onCancel,
  cancellable = false,
  persistent = false,
  overlay = false,
  fullscreen = false,
  position = 'center',
  zIndex = 50,
}: LoadingIndicatorProps) {
  const [currentProgress, setCurrentProgress] = useState(progress);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [isVisible, setIsVisible] = useState(true);

  // Update progress
  useEffect(() => {
    if (showProgress && progress !== currentProgress) {
      setCurrentProgress(progress);
    }
  }, [progress, currentProgress, showProgress]);

  // Update elapsed time
  useEffect(() => {
    if (showTime && startTime) {
      const interval = setInterval(() => {
        setElapsedTime(Date.now() - startTime);
      }, 100);
      return () => clearInterval(interval);
    }
  }, [showTime, startTime]);

  // Handle completion
  useEffect(() => {
    if (showProgress && currentProgress >= 100 && onComplete) {
      const timer = setTimeout(() => {
        onComplete();
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [currentProgress, onComplete, showProgress]);

  // Get icon based on type
  const getIcon = () => {
    switch (type) {
      case 'message':
        return <MessageSquare className="h-5 w-5" />;
      case 'streaming':
        return <Zap className="h-5 w-5" />;
      case 'upload':
        return <FileText className="h-5 w-5" />;
      case 'processing':
        return <Cpu className="h-5 w-5" />;
      case 'thinking':
        return <Brain className="h-5 w-5" />;
      case 'generating':
        return <Sparkles className="h-5 w-5" />;
      case 'analyzing':
        return <Database className="h-5 w-5" />;
      case 'saving':
        return <CheckCircle className="h-5 w-5" />;
      case 'loading':
        return <Loader2 className="h-5 w-5" />;
      default:
        return <Bot className="h-5 w-5" />;
    }
  };

  // Get size classes
  const getSizeClasses = () => {
    switch (size) {
      case 'sm':
        return 'h-4 w-4';
      case 'lg':
        return 'h-8 w-8';
      default:
        return 'h-6 w-6';
    }
  };

  // Get animation classes
  const getAnimationClasses = () => {
    const classes = [];
    
    if (animated) {
      if (showSpinner) classes.push('animate-spin');
      if (showPulse) classes.push('animate-pulse');
      if (showBounce) classes.push('animate-bounce');
      if (showFade) classes.push('animate-fade-in');
      if (showSlide) classes.push('animate-slide-in');
      if (showScale) classes.push('animate-scale-in');
      if (showRotate) classes.push('animate-rotate');
      if (showGlow) classes.push('animate-glow');
      if (showShimmer) classes.push('animate-shimmer');
      if (showGradient) classes.push('animate-gradient');
      if (showPattern) classes.push('animate-pattern');
    }
    
    return classes.join(' ');
  };

  // Format time
  const formatTime = (ms: number): string => {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  // Get estimated time remaining
  const getEstimatedTimeRemaining = (): string => {
    if (estimatedTime > 0 && currentProgress > 0) {
      const remaining = (estimatedTime * (100 - currentProgress)) / 100;
      return formatTime(remaining);
    }
    return '';
  };

  // Get progress color
  const getProgressColor = (): string => {
    if (currentProgress < 30) return 'bg-red-500';
    if (currentProgress < 70) return 'bg-yellow-500';
    return 'bg-green-500';
  };

  // Get type color
  const getTypeColor = (): string => {
    switch (type) {
      case 'message':
        return 'text-blue-500';
      case 'streaming':
        return 'text-purple-500';
      case 'upload':
        return 'text-orange-500';
      case 'processing':
        return 'text-cyan-500';
      case 'thinking':
        return 'text-pink-500';
      case 'generating':
        return 'text-yellow-500';
      case 'analyzing':
        return 'text-indigo-500';
      case 'saving':
        return 'text-green-500';
      case 'loading':
        return 'text-gray-500';
      default:
        return 'text-primary';
    }
  };

  // Get type badge variant
  const getTypeBadgeVariant = (): "default" | "secondary" | "destructive" | "outline" => {
    switch (type) {
      case 'message':
        return 'default';
      case 'streaming':
        return 'secondary';
      case 'upload':
        return 'outline';
      case 'processing':
        return 'secondary';
      case 'thinking':
        return 'outline';
      case 'generating':
        return 'default';
      case 'analyzing':
        return 'secondary';
      case 'saving':
        return 'default';
      case 'loading':
        return 'outline';
      default:
        return 'default';
    }
  };

  // Get type label
  const getTypeLabel = (): string => {
    switch (type) {
      case 'message':
        return 'Sending Message';
      case 'streaming':
        return 'Streaming Response';
      case 'upload':
        return 'Uploading File';
      case 'processing':
        return 'Processing';
      case 'thinking':
        return 'Thinking';
      case 'generating':
        return 'Generating';
      case 'analyzing':
        return 'Analyzing';
      case 'saving':
        return 'Saving';
      case 'loading':
        return 'Loading';
      default:
        return 'Working';
    }
  };

  // Render dots animation
  const renderDots = () => {
    if (!showDots) return null;
    
    return (
      <div className="flex items-center gap-1">
        {[...Array(3)].map((_, i) => (
          <div
            key={i}
            className={cn(
              'w-1 h-1 rounded-full bg-current',
              animated && 'animate-bounce',
              `delay-${i * 100}`
            )}
          />
        ))}
      </div>
    );
  };

  // Render wave animation
  const renderWave = () => {
    if (!showWave) return null;
    
    return (
      <div className="flex items-center gap-1">
        {[...Array(5)].map((_, i) => (
          <div
            key={i}
            className={cn(
              'w-1 bg-current rounded-full',
              animated && 'animate-pulse',
              `delay-${i * 100}`,
              i === 0 && 'h-2',
              i === 1 && 'h-3',
              i === 2 && 'h-4',
              i === 3 && 'h-3',
              i === 4 && 'h-2'
            )}
          />
        ))}
      </div>
    );
  };

  // Render shimmer effect
  const renderShimmer = () => {
    if (!showShimmer) return null;
    
    return (
      <div className="absolute inset-0 -translate-x-full animate-shimmer bg-gradient-to-r from-transparent via-white/20 to-transparent" />
    );
  };

  // Render gradient effect
  const renderGradient = () => {
    if (!showGradient) return null;
    
    return (
      <div className="absolute inset-0 bg-gradient-to-r from-blue-500/20 via-purple-500/20 to-pink-500/20 animate-gradient" />
    );
  };

  // Render pattern effect
  const renderPattern = () => {
    if (!showPattern) return null;
    
    return (
      <div className="absolute inset-0 opacity-10">
        <div className="h-full w-full bg-[radial-gradient(circle_at_1px_1px,_currentColor_1px,_transparent_0)] bg-[length:20px_20px] animate-pattern" />
      </div>
    );
  };

  // Render steps
  const renderSteps = () => {
    if (!showSteps || steps.length === 0) return null;
    
    return (
      <div className="space-y-2">
        {steps.map((step, index) => (
          <div
            key={index}
            className={cn(
              'flex items-center gap-2 text-sm',
              index < currentStep && 'text-green-600',
              index === currentStep && 'text-blue-600 font-medium',
              index > currentStep && 'text-muted-foreground'
            )}
          >
            {index < currentStep ? (
              <CheckCircle className="h-4 w-4" />
            ) : index === currentStep ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <div className="h-4 w-4 rounded-full border-2 border-muted-foreground" />
            )}
            <span>{step}</span>
          </div>
        ))}
      </div>
    );
  };

  // Render content
  const renderContent = () => {
    const content = (
      <div className={cn('flex items-center gap-3', getAnimationClasses())}>
        {/* Icon */}
        {showIcon && (
          <div className={cn('flex-shrink-0', getTypeColor(), getSizeClasses())}>
            {getIcon()}
          </div>
        )}

        {/* Text and Progress */}
        <div className="flex-1 min-w-0">
          {/* Message */}
          {showText && (
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium">{message}</span>
              {renderDots()}
              {renderWave()}
            </div>
          )}

          {/* Progress Bar */}
          {showProgress && (
            <div className="mt-2 space-y-1">
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>{getTypeLabel()}</span>
                <div className="flex items-center gap-2">
                  {showPercentage && (
                    <span>{Math.round(currentProgress)}%</span>
                  )}
                  {showTime && (
                    <span>{formatTime(elapsedTime)}</span>
                  )}
                  {getEstimatedTimeRemaining() && (
                    <span>~{getEstimatedTimeRemaining()} left</span>
                  )}
                </div>
              </div>
              <Progress 
                value={currentProgress} 
                className="h-2"
              />
            </div>
          )}

          {/* Steps */}
          {renderSteps()}
        </div>

        {/* Type Badge */}
        <Badge variant={getTypeBadgeVariant()}>
          {getTypeLabel()}
        </Badge>
      </div>
    );

    // Apply effects
    if (showShimmer || showGradient || showPattern) {
      return (
        <div className="relative overflow-hidden rounded-lg">
          {content}
          {renderShimmer()}
          {renderGradient()}
          {renderPattern()}
        </div>
      );
    }

    return content;
  };

  // Render based on variant
  if (variant === 'minimal') {
    return (
      <div className={cn('flex items-center gap-2', className)}>
        {showIcon && (
          <div className={cn(getTypeColor(), getSizeClasses())}>
            {getIcon()}
          </div>
        )}
        {showText && <span className="text-sm">{message}</span>}
        {renderDots()}
      </div>
    );
  }

  if (variant === 'inline') {
    return (
      <span className={cn('inline-flex items-center gap-1', className)}>
        {showIcon && (
          <div className={cn(getTypeColor(), 'h-3 w-3')}>
            {getIcon()}
          </div>
        )}
        {showText && <span className="text-xs">{message}</span>}
        {renderDots()}
      </span>
    );
  }

  if (variant === 'card') {
    return (
      <Card className={cn('w-full max-w-md', className)}>
        <CardContent className="p-4">
          {renderContent()}
        </CardContent>
      </Card>
    );
  }

  // Default variant
  const defaultContent = (
    <div className={cn('flex items-center justify-center p-4', className)}>
      {renderContent()}
    </div>
  );

  if (overlay || fullscreen) {
    return (
      <div
        className={cn(
          'fixed inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center',
          position === 'top' && 'items-start pt-20',
          position === 'bottom' && 'items-end pb-20',
          position === 'left' && 'justify-start pl-20',
          position === 'right' && 'justify-end pr-20',
          fullscreen && 'bg-background',
          className
        )}
        style=${ zIndex }
      >
        {defaultContent}
      </div>
    );
  }

  return defaultContent;
}

export default LoadingIndicator;
