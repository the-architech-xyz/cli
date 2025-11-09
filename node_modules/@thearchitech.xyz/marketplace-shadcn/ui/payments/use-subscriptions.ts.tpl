// Subscriptions Hook

import { useState, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

interface Subscription {
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
}

interface CreateSubscriptionData {
  customerId: string;
  planId: string;
  paymentMethodId?: string;
  trialPeriodDays?: number;
  metadata?: Record<string, any>;
}

interface UpdateSubscriptionData {
  planId?: string;
  paymentMethodId?: string;
  metadata?: Record<string, any>;
}

interface UseSubscriptionsReturn {
  subscriptions: Subscription[];
  isLoading: boolean;
  error: string | null;
  fetchSubscriptions: () => Promise<void>;
  createSubscription: (data: CreateSubscriptionData) => Promise<Subscription>;
  updateSubscription: (id: string, data: UpdateSubscriptionData) => Promise<Subscription>;
  cancelSubscription: (id: string) => Promise<void>;
  pauseSubscription: (id: string) => Promise<void>;
  resumeSubscription: (id: string) => Promise<void>;
  isCreating: boolean;
  isUpdating: boolean;
  isCancelling: boolean;
}

export const useSubscriptions = (): UseSubscriptionsReturn => {
  const [error, setError] = useState<string | null>(null);
  const queryClient = useQueryClient();

  // Fetch subscriptions
  const {
    data: subscriptions = [],
    isLoading,
    refetch: fetchSubscriptions,
  } = useQuery({
    queryKey: ['subscriptions'],
    queryFn: async (): Promise<Subscription[]> => {
      const response = await fetch('/api/subscriptions');
      if (!response.ok) {
        throw new Error('Failed to fetch subscriptions');
      }
      return response.json();
    },
  });

  // Create subscription mutation
  const createMutation = useMutation({
    mutationFn: async (data: CreateSubscriptionData): Promise<Subscription> => {
      const response = await fetch('/api/subscriptions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to create subscription');
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['subscriptions'] });
    },
    onError: (error: any) => {
      setError(error.message);
    },
  });

  // Update subscription mutation
  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: UpdateSubscriptionData }): Promise<Subscription> => {
      const response = await fetch(`/api/subscriptions/${id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to update subscription');
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['subscriptions'] });
    },
    onError: (error: any) => {
      setError(error.message);
    },
  });

  // Cancel subscription mutation
  const cancelMutation = useMutation({
    mutationFn: async (id: string): Promise<void> => {
      const response = await fetch(`/api/subscriptions/${id}/cancel`, {
        method: 'POST',
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to cancel subscription');
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['subscriptions'] });
    },
    onError: (error: any) => {
      setError(error.message);
    },
  });

  // Pause subscription mutation
  const pauseMutation = useMutation({
    mutationFn: async (id: string): Promise<void> => {
      const response = await fetch(`/api/subscriptions/${id}/pause`, {
        method: 'POST',
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to pause subscription');
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['subscriptions'] });
    },
    onError: (error: any) => {
      setError(error.message);
    },
  });

  // Resume subscription mutation
  const resumeMutation = useMutation({
    mutationFn: async (id: string): Promise<void> => {
      const response = await fetch(`/api/subscriptions/${id}/resume`, {
        method: 'POST',
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to resume subscription');
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['subscriptions'] });
    },
    onError: (error: any) => {
      setError(error.message);
    },
  });

  const createSubscription = useCallback(async (data: CreateSubscriptionData): Promise<Subscription> => {
    setError(null);
    return createMutation.mutateAsync(data);
  }, [createMutation]);

  const updateSubscription = useCallback(async (id: string, data: UpdateSubscriptionData): Promise<Subscription> => {
    setError(null);
    return updateMutation.mutateAsync({ id, data });
  }, [updateMutation]);

  const cancelSubscription = useCallback(async (id: string): Promise<void> => {
    setError(null);
    return cancelMutation.mutateAsync(id);
  }, [cancelMutation]);

  const pauseSubscription = useCallback(async (id: string): Promise<void> => {
    setError(null);
    return pauseMutation.mutateAsync(id);
  }, [pauseMutation]);

  const resumeSubscription = useCallback(async (id: string): Promise<void> => {
    setError(null);
    return resumeMutation.mutateAsync(id);
  }, [resumeMutation]);

  return {
    subscriptions,
    isLoading,
    error,
    fetchSubscriptions: fetchSubscriptions as () => Promise<void>,
    createSubscription,
    updateSubscription,
    cancelSubscription,
    pauseSubscription,
    resumeSubscription,
    isCreating: createMutation.isPending,
    isUpdating: updateMutation.isPending,
    isCancelling: cancelMutation.isPending,
  };
};