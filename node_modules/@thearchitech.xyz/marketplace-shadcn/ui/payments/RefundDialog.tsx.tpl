// Refund Dialog Component

"use client";

import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  AlertTriangle, 
  DollarSign, 
  CreditCard, 
  Calendar,
  User,
  FileText
} from 'lucide-react';

interface RefundDialogProps {
  isOpen: boolean;
  onClose: () => void;
  transaction: {
    id: string;
    amount: number;
    currency: string;
    status: string;
    paymentMethod: string;
    customerName: string;
    customerEmail: string;
    date: string;
    description?: string;
  };
  onRefund: (refundData: RefundData) => Promise<void>;
  isLoading?: boolean;
}

interface RefundData {
  amount: number;
  reason: string;
  description?: string;
  notifyCustomer: boolean;
  refundType: 'full' | 'partial';
}

export const RefundDialog: React.FC<RefundDialogProps> = ({
  isOpen,
  onClose,
  transaction,
  onRefund,
  isLoading = false,
}) => {
  const [refundData, setRefundData] = useState<RefundData>({
    amount: transaction.amount,
    reason: '',
    description: '',
    notifyCustomer: true,
    refundType: 'full',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const refundReasons = [
    'Customer requested',
    'Duplicate payment',
    'Fraudulent transaction',
    'Product not delivered',
    'Product defective',
    'Service not provided',
    'Customer changed mind',
    'Other',
  ];

  const formatCurrency = (amount: number, currency: string): string => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
    }).format(amount);
  };

  const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!refundData.reason) {
      newErrors.reason = 'Refund reason is required';
    }

    if (refundData.amount <= 0) {
      newErrors.amount = 'Refund amount must be greater than 0';
    }

    if (refundData.amount > transaction.amount) {
      newErrors.amount = 'Refund amount cannot exceed transaction amount';
    }

    if (refundData.refundType === 'partial' && refundData.amount === transaction.amount) {
      newErrors.amount = 'Partial refund amount must be less than transaction amount';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) {
      return;
    }

    try {
      await onRefund(refundData);
      onClose();
      // Reset form
      setRefundData({
        amount: transaction.amount,
        reason: '',
        description: '',
        notifyCustomer: true,
        refundType: 'full',
      });
      setErrors({});
    } catch (error) {
      console.error('Refund failed:', error);
    }
  };

  const handleRefundTypeChange = (type: 'full' | 'partial') => {
    setRefundData(prev => ({
      ...prev,
      refundType: type,
      amount: type === 'full' ? transaction.amount : prev.amount,
    }));
  };

  const getStatusColor = (status: string): string => {
    switch (status.toLowerCase()) {
      case 'completed':
      case 'succeeded':
        return 'bg-green-100 text-green-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'failed':
      case 'declined':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <AlertTriangle className="w-5 h-5 text-orange-500" />
            <span>Process Refund</span>
          </DialogTitle>
          <DialogDescription>
            Review transaction details and process the refund
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Transaction Details */}
          <div className="bg-gray-50 p-4 rounded-lg space-y-3">
            <h3 className="font-medium text-gray-900">Transaction Details</h3>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div className="flex items-center space-x-2">
                <CreditCard className="w-4 h-4 text-gray-500" />
                <span className="text-gray-600">ID:</span>
                <span className="font-mono">{transaction.id}</span>
              </div>
              <div className="flex items-center space-x-2">
                <DollarSign className="w-4 h-4 text-gray-500" />
                <span className="text-gray-600">Amount:</span>
                <span className="font-semibold">
                  {formatCurrency(transaction.amount, transaction.currency)}
                </span>
              </div>
              <div className="flex items-center space-x-2">
                <User className="w-4 h-4 text-gray-500" />
                <span className="text-gray-600">Customer:</span>
                <span>{transaction.customerName}</span>
              </div>
              <div className="flex items-center space-x-2">
                <Calendar className="w-4 h-4 text-gray-500" />
                <span className="text-gray-600">Date:</span>
                <span>{formatDate(transaction.date)}</span>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <Badge className={getStatusColor(transaction.status)}>
                {transaction.status}
              </Badge>
              <span className="text-sm text-gray-600">
                via {transaction.paymentMethod}
              </span>
            </div>
          </div>

          {/* Refund Configuration */}
          <div className="space-y-4">
            <div>
              <Label htmlFor="refundType">Refund Type</Label>
              <Select
                value={refundData.refundType}
                onValueChange={handleRefundTypeChange}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="full">Full Refund</SelectItem>
                  <SelectItem value="partial">Partial Refund</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="amount">Refund Amount</Label>
              <div className="relative">
                <DollarSign className="absolute left-3 top-3 w-4 h-4 text-gray-500" />
                <Input
                  id="amount"
                  type="number"
                  step="0.01"
                  min="0.01"
                  max={transaction.amount}
                  value={refundData.amount}
                  onChange={(e) => setRefundData(prev => ({
                    ...prev,
                    amount: parseFloat(e.target.value) || 0
                  }))}
                  className="pl-10"
                  disabled={refundData.refundType === 'full'}
                />
              </div>
              {errors.amount && (
                <p className="text-sm text-red-600 mt-1">{errors.amount}</p>
              )}
              <p className="text-xs text-gray-500 mt-1">
                Maximum: {formatCurrency(transaction.amount, transaction.currency)}
              </p>
            </div>

            <div>
              <Label htmlFor="reason">Refund Reason *</Label>
              <Select
                value={refundData.reason}
                onValueChange={(value) => setRefundData(prev => ({ ...prev, reason: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a reason" />
                </SelectTrigger>
                <SelectContent>
                  {refundReasons.map((reason) => (
                    <SelectItem key={reason} value={reason}>
                      {reason}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.reason && (
                <p className="text-sm text-red-600 mt-1">{errors.reason}</p>
              )}
            </div>

            <div>
              <Label htmlFor="description">Additional Notes</Label>
              <Textarea
                id="description"
                placeholder="Optional notes about the refund..."
                value={refundData.description}
                onChange={(e) => setRefundData(prev => ({ ...prev, description: e.target.value }))}
                rows={3}
              />
            </div>

            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="notifyCustomer"
                checked={refundData.notifyCustomer}
                onChange={(e) => setRefundData(prev => ({ ...prev, notifyCustomer: e.target.checked }))}
                className="rounded border-gray-300"
              />
              <Label htmlFor="notifyCustomer" className="text-sm">
                Notify customer via email
              </Label>
            </div>
          </div>

          {/* Warning */}
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              This action cannot be undone. The refund will be processed immediately and may take 3-5 business days to appear in the customer's account.
            </AlertDescription>
          </Alert>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isLoading}>
            Cancel
          </Button>
          <Button 
            onClick={handleSubmit} 
            disabled={isLoading}
            className="bg-red-600 hover:bg-red-700"
          >
            {isLoading ? 'Processing...' : 'Process Refund'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
