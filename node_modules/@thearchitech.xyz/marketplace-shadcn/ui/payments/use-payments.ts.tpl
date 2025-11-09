import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  Payment, 
  CreatePaymentData, 
  UpdatePaymentData, 
  PaymentFilters,
  PaymentAnalytics,
  Refund
} from '@/lib/types/payments';

// Mock API functions - replace with actual API calls
const fetchPayments = async (filters?: PaymentFilters): Promise<Payment[]> => {
  // Simulate API call
  return new Promise((resolve) =>
    setTimeout(() => {
      const mockPayments: Payment[] = [
        {
          id: 'pay_001',
          amount: 299.99,
          currency: 'USD',
          status: 'completed',
          method: 'card',
          customer: {
            id: 'cust_001',
            name: 'John Doe',
            email: 'john@example.com'
          },
          description: 'Premium Plan Subscription',
          createdAt: '2024-01-15T10:30:00Z',
          updatedAt: '2024-01-15T10:30:00Z',
          processedAt: '2024-01-15T10:30:00Z'
        },
        {
          id: 'pay_002',
          amount: 149.99,
          currency: 'USD',
          status: 'pending',
          method: 'bank_transfer',
          customer: {
            id: 'cust_002',
            name: 'Jane Smith',
            email: 'jane@example.com'
          },
          description: 'Pro Plan Subscription',
          createdAt: '2024-01-15T09:15:00Z',
          updatedAt: '2024-01-15T09:15:00Z'
        }
      ];
      resolve(mockPayments);
    }, 500)
  );
};

const fetchPayment = async (id: string): Promise<Payment> => {
  return new Promise((resolve, reject) =>
    setTimeout(() => {
      const mockPayment: Payment = {
        id,
        amount: 299.99,
        currency: 'USD',
        status: 'completed',
        method: 'card',
        customer: {
          id: 'cust_001',
          name: 'John Doe',
          email: 'john@example.com'
        },
        description: 'Premium Plan Subscription',
        createdAt: '2024-01-15T10:30:00Z',
        updatedAt: '2024-01-15T10:30:00Z',
        processedAt: '2024-01-15T10:30:00Z'
      };
      resolve(mockPayment);
    }, 300)
  );
};

const createPayment = async (data: CreatePaymentData): Promise<Payment> => {
  return new Promise((resolve, reject) =>
    setTimeout(() => {
      const newPayment: Payment = {
        id: `pay_${Date.now()}`,
        amount: data.amount,
        currency: data.currency,
        status: 'completed',
        method: data.method,
        customer: {
          id: data.customerId || 'cust_new',
          name: 'New Customer',
          email: 'new@example.com'
        },
        description: data.description,
        metadata: data.metadata,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        processedAt: new Date().toISOString()
      };
      resolve(newPayment);
    }, 1000)
  );
};

const updatePayment = async (id: string, data: UpdatePaymentData): Promise<Payment> => {
  return new Promise((resolve, reject) =>
    setTimeout(() => {
      const updatedPayment: Payment = {
        id,
        amount: 299.99,
        currency: 'USD',
        status: 'completed',
        method: 'card',
        customer: {
          id: 'cust_001',
          name: 'John Doe',
          email: 'john@example.com'
        },
        description: data.description,
        metadata: data.metadata,
        createdAt: '2024-01-15T10:30:00Z',
        updatedAt: new Date().toISOString(),
        processedAt: '2024-01-15T10:30:00Z'
      };
      resolve(updatedPayment);
    }, 500)
  );
};

const deletePayment = async (id: string): Promise<void> => {
  return new Promise((resolve) =>
    setTimeout(() => resolve(), 500)
  );
};

const refundPayment = async (paymentId: string, amount?: number): Promise<Refund> => {
  return new Promise((resolve) =>
    setTimeout(() => {
      const refund: Refund = {
        id: `ref_${Date.now()}`,
        paymentId,
        amount: amount || 299.99,
        currency: 'USD',
        status: 'succeeded',
        reason: 'requested_by_customer',
        createdAt: new Date().toISOString(),
        processedAt: new Date().toISOString()
      };
      resolve(refund);
    }, 1000)
  );
};

const fetchPaymentAnalytics = async (): Promise<PaymentAnalytics> => {
  return new Promise((resolve) =>
    setTimeout(() => {
      const analytics: PaymentAnalytics = {
        totalRevenue: 125430.50,
        monthlyRevenue: 28450.75,
        totalTransactions: 1247,
        activeSubscriptions: 89,
        revenueGrowth: 12.5,
        transactionGrowth: 8.3,
        subscriptionGrowth: 15.2,
        invoiceGrowth: -2.1,
        averageTransactionValue: 100.65,
        conversionRate: 3.2,
        churnRate: 2.1,
        mrr: 28450.75,
        arr: 341409.00
      };
      resolve(analytics);
    }, 500)
  );
};

// TanStack Query hooks
export const usePayments = (filters?: PaymentFilters) => {
  return useQuery<Payment[], Error>({
    queryKey: ['payments', filters],
    queryFn: () => fetchPayments(filters),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

export const usePayment = (id: string) => {
  return useQuery<Payment, Error>({
    queryKey: ['payment', id],
    queryFn: () => fetchPayment(id),
    enabled: !!id,
  });
};

export const usePaymentAnalytics = () => {
  return useQuery<PaymentAnalytics, Error>({
    queryKey: ['payment-analytics'],
    queryFn: fetchPaymentAnalytics,
    staleTime: 10 * 60 * 1000, // 10 minutes
  });
};

export const useCreatePayment = () => {
  const queryClient = useQueryClient();
  
  return useMutation<Payment, Error, CreatePaymentData>({
    mutationFn: createPayment,
    onSuccess: (newPayment) => {
      // Invalidate and refetch payments
      queryClient.invalidateQueries({ queryKey: ['payments'] });
      queryClient.invalidateQueries({ queryKey: ['payment-analytics'] });
      
      // Add the new payment to the cache
      queryClient.setQueryData(['payment', newPayment.id], newPayment);
    },
  });
};

export const useUpdatePayment = () => {
  const queryClient = useQueryClient();
  
  return useMutation<Payment, Error, { id: string; data: UpdatePaymentData }>({
    mutationFn: ({ id, data }) => updatePayment(id, data),
    onSuccess: (updatedPayment) => {
      // Update the payment in the cache
      queryClient.setQueryData(['payment', updatedPayment.id], updatedPayment);
      
      // Invalidate payments list to refetch
      queryClient.invalidateQueries({ queryKey: ['payments'] });
    },
  });
};

export const useDeletePayment = () => {
  const queryClient = useQueryClient();
  
  return useMutation<void, Error, string>({
    mutationFn: deletePayment,
    onSuccess: (_, paymentId) => {
      // Remove from cache
      queryClient.removeQueries({ queryKey: ['payment', paymentId] });
      
      // Invalidate payments list
      queryClient.invalidateQueries({ queryKey: ['payments'] });
    },
  });
};

export const useRefundPayment = () => {
  const queryClient = useQueryClient();
  
  return useMutation<Refund, Error, { paymentId: string; amount?: number }>({
    mutationFn: ({ paymentId, amount }) => refundPayment(paymentId, amount),
    onSuccess: (refund, { paymentId }) => {
      // Update the payment status in cache
      queryClient.setQueryData(['payment', paymentId], (old: Payment | undefined) => {
        if (old) {
          return {
            ...old,
            status: 'refunded' as const,
            refundedAmount: refund.amount,
            refundedAt: refund.processedAt,
            updatedAt: new Date().toISOString()
          };
        }
        return old;
      });
      
      // Invalidate payments list
      queryClient.invalidateQueries({ queryKey: ['payments'] });
    },
  });
};
