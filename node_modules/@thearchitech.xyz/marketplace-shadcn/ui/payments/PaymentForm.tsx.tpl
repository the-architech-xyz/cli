/**
 * PaymentForm Component
 * 
 * Example component showing how to use the cohesive PaymentService.
 * This demonstrates the new "Cohesive Business Hook Services" pattern.
 */

'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { paymentService } from '@/services/PaymentService';
import { CreatePaymentData, Currency, PaymentMethod } from '@/features/payments/contract';

interface PaymentFormProps {
  onSuccess?: (payment: any) => void;
  onError?: (error: Error) => void;
}

export function PaymentForm({ onSuccess, onError }: PaymentFormProps) {
  const [formData, setFormData] = useState<CreatePaymentData>({
    amount: 0,
    currency: 'USD',
    method: 'card',
    description: '',
    customerId: '',
    saveCard: false
  });

  const { toast } = useToast();

  // Use the cohesive PaymentService
  const { create, list } = paymentService.usePayments();
  const { list: paymentMethods } = paymentService.usePaymentMethods();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const result = await create.mutateAsync(formData);
      
      toast({
        title: "Payment Created",
        description: "Your payment has been processed successfully.",
      });
      
      onSuccess?.(result);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Payment failed';
      
      toast({
        title: "Payment Failed",
        description: errorMessage,
        variant: "destructive",
      });
      
      onError?.(error as Error);
    }
  };

  const handleInputChange = (field: keyof CreatePaymentData, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle>Create Payment</CardTitle>
        <CardDescription>
          Process a new payment using the PaymentService
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Amount */}
          <div className="space-y-2">
            <Label htmlFor="amount">Amount</Label>
            <Input
              id="amount"
              type="number"
              step="0.01"
              min="0"
              value={formData.amount}
              onChange={(e) => handleInputChange('amount', parseFloat(e.target.value))}
              placeholder="0.00"
              required
            />
          </div>

          {/* Currency */}
          <div className="space-y-2">
            <Label htmlFor="currency">Currency</Label>
            <Select
              value={formData.currency}
              onValueChange={(value: Currency) => handleInputChange('currency', value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select currency" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="USD">USD</SelectItem>
                <SelectItem value="EUR">EUR</SelectItem>
                <SelectItem value="GBP">GBP</SelectItem>
                <SelectItem value="CAD">CAD</SelectItem>
                <SelectItem value="AUD">AUD</SelectItem>
                <SelectItem value="JPY">JPY</SelectItem>
                <SelectItem value="CHF">CHF</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Payment Method */}
          <div className="space-y-2">
            <Label htmlFor="method">Payment Method</Label>
            <Select
              value={formData.method}
              onValueChange={(value: PaymentMethod) => handleInputChange('method', value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select payment method" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="card">Card</SelectItem>
                <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                <SelectItem value="paypal">PayPal</SelectItem>
                <SelectItem value="apple_pay">Apple Pay</SelectItem>
                <SelectItem value="google_pay">Google Pay</SelectItem>
                <SelectItem value="crypto">Crypto</SelectItem>
                <SelectItem value="wallet">Wallet</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Input
              id="description"
              value={formData.description}
              onChange={(e) => handleInputChange('description', e.target.value)}
              placeholder="Payment description"
            />
          </div>

          {/* Customer ID */}
          <div className="space-y-2">
            <Label htmlFor="customerId">Customer ID</Label>
            <Input
              id="customerId"
              value={formData.customerId}
              onChange={(e) => handleInputChange('customerId', e.target.value)}
              placeholder="Customer ID (optional)"
            />
          </div>

          {/* Save Card */}
          <div className="flex items-center space-x-2">
            <input
              id="saveCard"
              type="checkbox"
              checked={formData.saveCard}
              onChange={(e) => handleInputChange('saveCard', e.target.checked)}
              className="rounded"
            />
            <Label htmlFor="saveCard">Save payment method</Label>
          </div>

          {/* Submit Button */}
          <Button
            type="submit"
            className="w-full"
            disabled={create.isPending}
          >
            {create.isPending ? 'Processing...' : 'Create Payment'}
          </Button>
        </form>

        {/* Display recent payments */}
        {list.data && list.data.length > 0 && (
          <div className="mt-6">
            <h3 className="text-sm font-medium mb-2">Recent Payments</h3>
            <div className="space-y-2">
              {list.data.slice(0, 3).map((payment) => (
                <div key={payment.id} className="text-xs text-muted-foreground">
                  {payment.amount} {payment.currency} - {payment.status}
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}