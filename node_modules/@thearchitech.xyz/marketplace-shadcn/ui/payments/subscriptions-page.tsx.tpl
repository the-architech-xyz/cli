// Subscriptions Page Component

"use client";

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  CreditCard, 
  Calendar,
  DollarSign,
  Settings,
  Play,
  Pause,
  X,
  CheckCircle,
  XCircle,
  AlertCircle,
  Clock,
  TrendingUp,
  Users
} from 'lucide-react';
import { useSubscriptionsList as useSubscriptions } from '@/lib/payments';
import { SubscriptionCard } from '@/components/payments/SubscriptionCard';

interface SubscriptionsPageProps {
  onSubscriptionClick?: (subscription: any) => void;
  onManage?: (subscription: any) => void;
}

export const SubscriptionsPage: React.FC<SubscriptionsPageProps> = ({
  onSubscriptionClick,
  onManage,
}) => {
  const { 
    subscriptions, 
    isLoading, 
    error, 
    fetchSubscriptions, 
    cancelSubscription, 
    pauseSubscription, 
    resumeSubscription,
    updateSubscription 
  } = useSubscriptions();
  
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedSubscription, setSelectedSubscription] = useState<any>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [isManaging, setIsManaging] = useState(false);

  useEffect(() => {
    fetchSubscriptions();
  }, []);

  const filteredSubscriptions = subscriptions.filter(subscription => {
    return statusFilter === 'all' || subscription.status === statusFilter;
  });

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      active: { color: 'bg-green-100 text-green-800', icon: CheckCircle },
      paused: { color: 'bg-yellow-100 text-yellow-800', icon: Pause },
      cancelled: { color: 'bg-red-100 text-red-800', icon: XCircle },
      past_due: { color: 'bg-orange-100 text-orange-800', icon: AlertCircle },
      trialing: { color: 'bg-blue-100 text-blue-800', icon: Clock },
    };

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.active;
    const Icon = config.icon;

    return (
      <Badge className={`${config.color} flex items-center space-x-1`}>
        <Icon className="w-3 h-3" />
        <span className="capitalize">{status.replace('_', ' ')}</span>
      </Badge>
    );
  };

  const handleSubscriptionClick = (subscription: any) => {
    setSelectedSubscription(subscription);
    setIsDetailOpen(true);
    onSubscriptionClick?.(subscription);
  };

  const handleManage = (subscription: any) => {
    setSelectedSubscription(subscription);
    setIsManaging(true);
    onManage?.(subscription);
  };

  const handleCancel = async (subscription: any) => {
    if (window.confirm('Are you sure you want to cancel this subscription?')) {
      try {
        await cancelSubscription(subscription.id);
        await fetchSubscriptions();
      } catch (error) {
        console.error('Failed to cancel subscription:', error);
      }
    }
  };

  const handlePause = async (subscription: any) => {
    try {
      await pauseSubscription(subscription.id);
      await fetchSubscriptions();
    } catch (error) {
      console.error('Failed to pause subscription:', error);
    }
  };

  const handleResume = async (subscription: any) => {
    try {
      await resumeSubscription(subscription.id);
      await fetchSubscriptions();
    } catch (error) {
      console.error('Failed to resume subscription:', error);
    }
  };

  const totalRevenue = subscriptions
    .filter(sub => sub.status === 'active')
    .reduce((sum, sub) => sum + sub.amount, 0);

  const activeSubscriptions = subscriptions.filter(sub => sub.status === 'active').length;
  const cancelledSubscriptions = subscriptions.filter(sub => sub.status === 'cancelled').length;

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading subscriptions...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Subscriptions</h1>
            <p className="text-gray-600 mt-1">Manage your recurring subscriptions</p>
          </div>
          <Button>
            <CreditCard className="w-4 h-4 mr-2" />
            Create Subscription
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <CreditCard className="w-6 h-6 text-blue-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Total Subscriptions</p>
                  <p className="text-2xl font-bold text-gray-900">{subscriptions.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="p-2 bg-green-100 rounded-lg">
                  <CheckCircle className="w-6 h-6 text-green-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Active</p>
                  <p className="text-2xl font-bold text-gray-900">{activeSubscriptions}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="p-2 bg-red-100 rounded-lg">
                  <XCircle className="w-6 h-6 text-red-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Cancelled</p>
                  <p className="text-2xl font-bold text-gray-900">{cancelledSubscriptions}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="p-2 bg-green-100 rounded-lg">
                  <DollarSign className="w-6 h-6 text-green-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Monthly Revenue</p>
                  <p className="text-2xl font-bold text-gray-900">${totalRevenue.toFixed(2)}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card>
          <CardContent className="p-6">
            <div className="flex flex-col sm:flex-row gap-4">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-full sm:w-48">
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="paused">Paused</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                  <SelectItem value="past_due">Past Due</SelectItem>
                  <SelectItem value="trialing">Trialing</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Error Alert */}
        {error && (
          <Alert>
            <AlertCircle className="w-4 h-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Subscriptions Table */}
        <Card>
          <CardHeader>
            <CardTitle>Subscriptions</CardTitle>
            <CardDescription>
              {filteredSubscriptions.length} subscription{filteredSubscriptions.length !== 1 ? 's' : ''} found
            </CardDescription>
          </CardHeader>
          <CardContent>
            {filteredSubscriptions.length === 0 ? (
              <div className="text-center py-12">
                <CreditCard className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No subscriptions found</h3>
                <p className="text-gray-600">Try adjusting your filter criteria.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Customer</TableHead>
                      <TableHead>Plan</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Next Billing</TableHead>
                      <TableHead>Created</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredSubscriptions.map((subscription) => (
                      <TableRow key={subscription.id}>
                        <TableCell>
                          <div>
                            <p className="font-medium">{subscription.customerName}</p>
                            <p className="text-sm text-gray-600">{subscription.customerEmail}</p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div>
                            <p className="font-medium">{subscription.planName}</p>
                            <p className="text-sm text-gray-600">{subscription.interval}</p>
                          </div>
                        </TableCell>
                        <TableCell className="font-medium">
                          ${subscription.amount.toFixed(2)}
                        </TableCell>
                        <TableCell>
                          {getStatusBadge(subscription.status)}
                        </TableCell>
                        <TableCell>
                          {subscription.nextBillingDate 
                            ? new Date(subscription.nextBillingDate).toLocaleDateString()
                            : 'N/A'
                          }
                        </TableCell>
                        <TableCell>
                          {new Date(subscription.createdAt).toLocaleDateString()}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end space-x-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleSubscriptionClick(subscription)}
                            >
                              <Settings className="w-4 h-4" />
                            </Button>
                            
                            {subscription.status === 'active' && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handlePause(subscription)}
                              >
                                <Pause className="w-4 h-4" />
                              </Button>
                            )}
                            
                            {subscription.status === 'paused' && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleResume(subscription)}
                              >
                                <Play className="w-4 h-4" />
                              </Button>
                            )}
                            
                            {subscription.status === 'active' && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleCancel(subscription)}
                                className="text-red-600 hover:text-red-700"
                              >
                                <X className="w-4 h-4" />
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Subscription Detail Dialog */}
        <Dialog open={isDetailOpen} onOpenChange={setIsDetailOpen}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Subscription Details</DialogTitle>
              <DialogDescription>
                View and manage subscription details
              </DialogDescription>
            </DialogHeader>
            {selectedSubscription && (
              <SubscriptionCard subscription={selectedSubscription} />
            )}
          </DialogContent>
        </Dialog>

        {/* Manage Subscription Dialog */}
        <Dialog open={isManaging} onOpenChange={setIsManaging}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Manage Subscription</DialogTitle>
              <DialogDescription>
                Update subscription settings and billing
              </DialogDescription>
            </DialogHeader>
            {selectedSubscription && (
              <div className="space-y-4">
                <p>Manage subscription for {selectedSubscription.customerName}</p>
                {/* Add subscription management form here */}
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
};