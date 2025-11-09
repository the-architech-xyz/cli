// Subscription Card Component

import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  CreditCard, 
  Calendar,
  User,
  Settings,
  Play,
  Pause,
  X,
  CheckCircle,
  Clock,
  AlertCircle,
  XCircle,
  DollarSign,
  TrendingUp
} from 'lucide-react';

interface SubscriptionCardProps {
  subscription: {
    id: string;
    status: 'active' | 'paused' | 'cancelled' | 'past_due' | 'trialing';
    planName: string;
    planDescription?: string;
    amount: number;
    currency: string;
    interval: 'month' | 'year' | 'week' | 'day';
    customerName: string;
    customerEmail: string;
    createdAt: string;
    currentPeriodStart: string;
    currentPeriodEnd: string;
    nextBillingDate?: string;
    trialEnd?: string;
    cancelAtPeriodEnd: boolean;
    cancelledAt?: string;
    metadata?: Record<string, any>;
  };
  onManage?: (subscription: any) => void;
  onCancel?: (subscription: any) => void;
  onPause?: (subscription: any) => void;
  onResume?: (subscription: any) => void;
  className?: string;
}

export const SubscriptionCard: React.FC<SubscriptionCardProps> = ({
  subscription,
  onManage,
  onCancel,
  onPause,
  onResume,
  className = '',
}) => {
  const getStatusBadge = (status: string) => {
    const statusConfig = {
      active: { 
        color: 'bg-green-100 text-green-800', 
        icon: CheckCircle,
        label: 'Active'
      },
      paused: { 
        color: 'bg-yellow-100 text-yellow-800', 
        icon: Pause,
        label: 'Paused'
      },
      cancelled: { 
        color: 'bg-red-100 text-red-800', 
        icon: XCircle,
        label: 'Cancelled'
      },
      past_due: { 
        color: 'bg-orange-100 text-orange-800', 
        icon: AlertCircle,
        label: 'Past Due'
      },
      trialing: { 
        color: 'bg-blue-100 text-blue-800', 
        icon: Clock,
        label: 'Trial'
      },
    };

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.active;
    const Icon = config.icon;

    return (
      <Badge className={`${config.color} flex items-center space-x-1`}>
        <Icon className="w-3 h-3" />
        <span>{config.label}</span>
      </Badge>
    );
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const formatCurrency = (amount: number, currency: string = 'USD') => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
    }).format(amount);
  };

  const getIntervalText = (interval: string) => {
    const intervalMap = {
      day: 'Daily',
      week: 'Weekly',
      month: 'Monthly',
      year: 'Yearly',
    };
    return intervalMap[interval as keyof typeof intervalMap] || interval;
  };

  const isTrialActive = subscription.status === 'trialing' && subscription.trialEnd && new Date(subscription.trialEnd) > new Date();
  const isCancelling = subscription.cancelAtPeriodEnd;

  return (
    <Card className={`w-full ${className}`}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center space-x-2">
              <CreditCard className="w-5 h-5" />
              <span>{subscription.planName}</span>
            </CardTitle>
            <CardDescription>
              {subscription.planDescription || `${getIntervalText(subscription.interval)} subscription`}
            </CardDescription>
          </div>
          {getStatusBadge(subscription.status)}
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Customer Information */}
        <div>
          <h3 className="font-semibold text-gray-900 mb-3 flex items-center space-x-2">
            <User className="w-4 h-4" />
            <span>Customer</span>
          </h3>
          <div className="space-y-1">
            <p className="font-medium">{subscription.customerName}</p>
            <p className="text-sm text-gray-600">{subscription.customerEmail}</p>
          </div>
        </div>

        <Separator />

        {/* Subscription Details */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h3 className="font-semibold text-gray-900 mb-3 flex items-center space-x-2">
              <DollarSign className="w-4 h-4" />
              <span>Billing</span>
            </h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Amount:</span>
                <span className="font-medium">
                  {formatCurrency(subscription.amount, subscription.currency)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Interval:</span>
                <span>{getIntervalText(subscription.interval)}</span>
              </div>
              {subscription.nextBillingDate && (
                <div className="flex justify-between">
                  <span className="text-gray-600">Next Billing:</span>
                  <span>{formatDate(subscription.nextBillingDate)}</span>
                </div>
              )}
            </div>
          </div>

          <div>
            <h3 className="font-semibold text-gray-900 mb-3 flex items-center space-x-2">
              <Calendar className="w-4 h-4" />
              <span>Period</span>
            </h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Current Period:</span>
                <span>
                  {formatDate(subscription.currentPeriodStart)} - {formatDate(subscription.currentPeriodEnd)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Created:</span>
                <span>{formatDate(subscription.createdAt)}</span>
              </div>
              {subscription.cancelledAt && (
                <div className="flex justify-between">
                  <span className="text-gray-600">Cancelled:</span>
                  <span>{formatDate(subscription.cancelledAt)}</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Trial Information */}
        {isTrialActive && subscription.trialEnd && (
          <>
            <Separator />
            <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="flex items-center space-x-2 mb-2">
                <Clock className="w-4 h-4 text-blue-600" />
                <span className="font-medium text-blue-900">Trial Period</span>
              </div>
              <p className="text-sm text-blue-700">
                Trial ends on {formatDate(subscription.trialEnd)}
              </p>
            </div>
          </>
        )}

        {/* Cancellation Notice */}
        {isCancelling && (
          <>
            <Separator />
            <div className="p-4 bg-orange-50 border border-orange-200 rounded-lg">
              <div className="flex items-center space-x-2 mb-2">
                <AlertCircle className="w-4 h-4 text-orange-600" />
                <span className="font-medium text-orange-900">Cancellation Scheduled</span>
              </div>
              <p className="text-sm text-orange-700">
                This subscription will be cancelled at the end of the current billing period.
              </p>
            </div>
          </>
        )}

        {/* Metadata */}
        {subscription.metadata && Object.keys(subscription.metadata).length > 0 && (
          <>
            <Separator />
            <div>
              <h3 className="font-semibold text-gray-900 mb-3">Additional Information</h3>
              <div className="space-y-2 text-sm">
                {Object.entries(subscription.metadata).map(([key, value]) => (
                  <div key={key} className="flex justify-between">
                    <span className="text-gray-600 capitalize">
                      {key.replace(/_/g, ' ')}:
                    </span>
                    <span>{String(value)}</span>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}

        {/* Actions */}
        <div className="flex flex-wrap gap-2 pt-4">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onManage?.(subscription)}
          >
            <Settings className="w-4 h-4 mr-2" />
            Manage
          </Button>
          
          {subscription.status === 'active' && !isCancelling && (
            <>
              <Button
                variant="outline"
                size="sm"
                onClick={() => onPause?.(subscription)}
              >
                <Pause className="w-4 h-4 mr-2" />
                Pause
              </Button>
              
              <Button
                variant="outline"
                size="sm"
                onClick={() => onCancel?.(subscription)}
                className="text-red-600 hover:text-red-700"
              >
                <X className="w-4 h-4 mr-2" />
                Cancel
              </Button>
            </>
          )}
          
          {subscription.status === 'paused' && (
            <Button
              size="sm"
              onClick={() => onResume?.(subscription)}
            >
              <Play className="w-4 h-4 mr-2" />
              Resume
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
};