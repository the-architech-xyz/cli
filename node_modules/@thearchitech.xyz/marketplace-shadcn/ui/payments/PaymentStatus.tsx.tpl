'use client';

import { motion } from 'framer-motion';
import { CheckCircle, Clock, XCircle, AlertCircle, Loader2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface PaymentStatusProps {
  status: 'completed' | 'pending' | 'failed' | 'processing' | 'cancelled' | 'refunded';
  size?: 'sm' | 'md' | 'lg';
  showIcon?: boolean;
  className?: string;
}

const statusConfig = {
  completed: {
    label: 'Completed',
    icon: CheckCircle,
    className: 'bg-green-100 text-green-800 border-green-200 dark:bg-green-900/20 dark:text-green-400 dark:border-green-800',
    iconClassName: 'text-green-600 dark:text-green-400'
  },
  pending: {
    label: 'Pending',
    icon: Clock,
    className: 'bg-yellow-100 text-yellow-800 border-yellow-200 dark:bg-yellow-900/20 dark:text-yellow-400 dark:border-yellow-800',
    iconClassName: 'text-yellow-600 dark:text-yellow-400'
  },
  processing: {
    label: 'Processing',
    icon: Loader2,
    className: 'bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-900/20 dark:text-blue-400 dark:border-blue-800',
    iconClassName: 'text-blue-600 dark:text-blue-400 animate-spin'
  },
  failed: {
    label: 'Failed',
    icon: XCircle,
    className: 'bg-red-100 text-red-800 border-red-200 dark:bg-red-900/20 dark:text-red-400 dark:border-red-800',
    iconClassName: 'text-red-600 dark:text-red-400'
  },
  cancelled: {
    label: 'Cancelled',
    icon: XCircle,
    className: 'bg-gray-100 text-gray-800 border-gray-200 dark:bg-gray-900/20 dark:text-gray-400 dark:border-gray-800',
    iconClassName: 'text-gray-600 dark:text-gray-400'
  },
  refunded: {
    label: 'Refunded',
    icon: AlertCircle,
    className: 'bg-orange-100 text-orange-800 border-orange-200 dark:bg-orange-900/20 dark:text-orange-400 dark:border-orange-800',
    iconClassName: 'text-orange-600 dark:text-orange-400'
  }
};

const sizeConfig = {
  sm: {
    badge: 'text-xs px-2 py-1',
    icon: 'w-3 h-3'
  },
  md: {
    badge: 'text-sm px-3 py-1',
    icon: 'w-4 h-4'
  },
  lg: {
    badge: 'text-base px-4 py-2',
    icon: 'w-5 h-5'
  }
};

export function PaymentStatus({ 
  status, 
  size = 'md', 
  showIcon = true, 
  className 
}: PaymentStatusProps) {
  const config = statusConfig[status];
  const sizeStyles = sizeConfig[size];
  const Icon = config.icon;

  return (
    <motion.div
      initial=${ opacity: 0, scale: 0.8 }
      animate=${ opacity: 1, scale: 1 }
      transition=${ duration: 0.2 }
    >
      <Badge
        variant="outline"
        className={cn(
          'inline-flex items-center gap-1.5 font-medium border',
          config.className,
          sizeStyles.badge,
          className
        )}
      >
        {showIcon && (
          <Icon className={cn(sizeStyles.icon, config.iconClassName)} />
        )}
        <span>{config.label}</span>
      </Badge>
    </motion.div>
  );
}
