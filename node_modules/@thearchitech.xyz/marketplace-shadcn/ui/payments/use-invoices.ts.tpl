// Invoices Hook

import { useState, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

interface Invoice {
  id: string;
  invoiceNumber: string;
  status: 'paid' | 'pending' | 'overdue' | 'cancelled';
  amount: number;
  currency: string;
  customerName: string;
  customerEmail: string;
  customerAddress?: {
    line1: string;
    line2?: string;
    city: string;
    state: string;
    postalCode: string;
    country: string;
  };
  items: Array<{
    id: string;
    name: string;
    description?: string;
    quantity: number;
    unitPrice: number;
    total: number;
  }>;
  subtotal: number;
  tax: number;
  total: number;
  createdAt: string;
  dueDate: string;
  paidAt?: string;
  notes?: string;
}

interface CreateInvoiceData {
  customerId: string;
  items: Array<{
    name: string;
    description?: string;
    quantity: number;
    unitPrice: number;
  }>;
  dueDate: string;
  notes?: string;
  tax?: number;
}

interface UpdateInvoiceData {
  items?: Array<{
    id?: string;
    name: string;
    description?: string;
    quantity: number;
    unitPrice: number;
  }>;
  dueDate?: string;
  notes?: string;
  tax?: number;
}

interface UseInvoicesReturn {
  invoices: Invoice[];
  isLoading: boolean;
  error: string | null;
  fetchInvoices: () => Promise<void>;
  createInvoice: (data: CreateInvoiceData) => Promise<Invoice>;
  updateInvoice: (id: string, data: UpdateInvoiceData) => Promise<Invoice>;
  deleteInvoice: (id: string) => Promise<void>;
  markAsPaid: (id: string) => Promise<void>;
  sendInvoice: (id: string) => Promise<void>;
  downloadInvoice: (id: string) => Promise<void>;
  isCreating: boolean;
  isUpdating: boolean;
  isDeleting: boolean;
}

export const useInvoices = (): UseInvoicesReturn => {
  const [error, setError] = useState<string | null>(null);
  const queryClient = useQueryClient();

  // Fetch invoices
  const {
    data: invoices = [],
    isLoading,
    refetch: fetchInvoices,
  } = useQuery({
    queryKey: ['invoices'],
    queryFn: async (): Promise<Invoice[]> => {
      const response = await fetch('/api/invoices');
      if (!response.ok) {
        throw new Error('Failed to fetch invoices');
      }
      return response.json();
    },
  });

  // Create invoice mutation
  const createMutation = useMutation({
    mutationFn: async (data: CreateInvoiceData): Promise<Invoice> => {
      const response = await fetch('/api/invoices', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to create invoice');
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
    },
    onError: (error: any) => {
      setError(error.message);
    },
  });

  // Update invoice mutation
  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: UpdateInvoiceData }): Promise<Invoice> => {
      const response = await fetch(`/api/invoices/${id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to update invoice');
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
    },
    onError: (error: any) => {
      setError(error.message);
    },
  });

  // Delete invoice mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: string): Promise<void> => {
      const response = await fetch(`/api/invoices/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to delete invoice');
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
    },
    onError: (error: any) => {
      setError(error.message);
    },
  });

  // Mark as paid mutation
  const markAsPaidMutation = useMutation({
    mutationFn: async (id: string): Promise<void> => {
      const response = await fetch(`/api/invoices/${id}/mark-paid`, {
        method: 'POST',
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to mark invoice as paid');
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
    },
    onError: (error: any) => {
      setError(error.message);
    },
  });

  // Send invoice mutation
  const sendInvoiceMutation = useMutation({
    mutationFn: async (id: string): Promise<void> => {
      const response = await fetch(`/api/invoices/${id}/send`, {
        method: 'POST',
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to send invoice');
      }
    },
    onError: (error: any) => {
      setError(error.message);
    },
  });

  // Download invoice mutation
  const downloadInvoiceMutation = useMutation({
    mutationFn: async (id: string): Promise<void> => {
      const response = await fetch(`/api/invoices/${id}/download`, {
        method: 'GET',
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to download invoice');
      }

      // Handle file download
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `invoice-${id}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    },
    onError: (error: any) => {
      setError(error.message);
    },
  });

  const createInvoice = useCallback(async (data: CreateInvoiceData): Promise<Invoice> => {
    setError(null);
    return createMutation.mutateAsync(data);
  }, [createMutation]);

  const updateInvoice = useCallback(async (id: string, data: UpdateInvoiceData): Promise<Invoice> => {
    setError(null);
    return updateMutation.mutateAsync({ id, data });
  }, [updateMutation]);

  const deleteInvoice = useCallback(async (id: string): Promise<void> => {
    setError(null);
    return deleteMutation.mutateAsync(id);
  }, [deleteMutation]);

  const markAsPaid = useCallback(async (id: string): Promise<void> => {
    setError(null);
    return markAsPaidMutation.mutateAsync(id);
  }, [markAsPaidMutation]);

  const sendInvoice = useCallback(async (id: string): Promise<void> => {
    setError(null);
    return sendInvoiceMutation.mutateAsync(id);
  }, [sendInvoiceMutation]);

  const downloadInvoice = useCallback(async (id: string): Promise<void> => {
    setError(null);
    return downloadInvoiceMutation.mutateAsync(id);
  }, [downloadInvoiceMutation]);

  return {
    invoices,
    isLoading,
    error,
    fetchInvoices: fetchInvoices as () => Promise<void>,
    createInvoice,
    updateInvoice,
    deleteInvoice,
    markAsPaid,
    sendInvoice,
    downloadInvoice,
    isCreating: createMutation.isPending,
    isUpdating: updateMutation.isPending,
    isDeleting: deleteMutation.isPending,
  };
};