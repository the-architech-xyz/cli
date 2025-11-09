// Checkout Form Component

"use client";

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { 
  CreditCard, 
  Lock, 
  Eye, 
  EyeOff,
  CheckCircle,
  AlertCircle
} from 'lucide-react';

interface CheckoutFormProps {
  onSubmit?: (data: PaymentFormData) => void;
  isLoading?: boolean;
  error?: string;
  className?: string;
}

interface PaymentFormData {
  cardNumber: string;
  expiryDate: string;
  cvv: string;
  cardholderName: string;
  billingAddress: {
    line1: string;
    line2?: string;
    city: string;
    state: string;
    postalCode: string;
    country: string;
  };
  saveCard?: boolean;
}

export const CheckoutForm: React.FC<CheckoutFormProps> = ({
  onSubmit,
  isLoading = false,
  error,
  className = '',
}) => {
  const [formData, setFormData] = useState<PaymentFormData>({
    cardNumber: '',
    expiryDate: '',
    cvv: '',
    cardholderName: '',
    billingAddress: {
      line1: '',
      line2: '',
      city: '',
      state: '',
      postalCode: '',
      country: 'US',
    },
    saveCard: false,
  });

  const [showCvv, setShowCvv] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const formatCardNumber = (value: string) => {
    const v = value.replace(/\s+/g, '').replace(/[^0-9]/gi, '');
    const matches = v.match(/\d{4,16}/g);
    const match = matches && matches[0] || '';
    const parts = [];
    for (let i = 0, len = match.length; i < len; i += 4) {
      parts.push(match.substring(i, i + 4));
    }
    if (parts.length) {
      return parts.join(' ');
    } else {
      return v;
    }
  };

  const formatExpiryDate = (value: string) => {
    const v = value.replace(/\s+/g, '').replace(/[^0-9]/gi, '');
    if (v.length >= 2) {
      return v.substring(0, 2) + '/' + v.substring(2, 4);
    }
    return v;
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    // Card number validation
    if (!formData.cardNumber || formData.cardNumber.replace(/\s/g, '').length < 13) {
      newErrors.cardNumber = 'Please enter a valid card number';
    }

    // Expiry date validation
    if (!formData.expiryDate || formData.expiryDate.length !== 5) {
      newErrors.expiryDate = 'Please enter a valid expiry date (MM/YY)';
    } else {
      const [month, year] = formData.expiryDate.split('/');
      const currentDate = new Date();
      const currentYear = currentDate.getFullYear() % 100;
      const currentMonth = currentDate.getMonth() + 1;
      
      if (parseInt(month) < 1 || parseInt(month) > 12) {
        newErrors.expiryDate = 'Please enter a valid month (01-12)';
      } else if (parseInt(year) < currentYear || (parseInt(year) === currentYear && parseInt(month) < currentMonth)) {
        newErrors.expiryDate = 'Card has expired';
      }
    }

    // CVV validation
    if (!formData.cvv || formData.cvv.length < 3) {
      newErrors.cvv = 'Please enter a valid CVV';
    }

    // Cardholder name validation
    if (!formData.cardholderName.trim()) {
      newErrors.cardholderName = 'Please enter the cardholder name';
    }

    // Billing address validation
    if (!formData.billingAddress.line1.trim()) {
      newErrors.billingAddress = 'Please enter a billing address';
    }
    if (!formData.billingAddress.city.trim()) {
      newErrors.city = 'Please enter a city';
    }
    if (!formData.billingAddress.state.trim()) {
      newErrors.state = 'Please enter a state';
    }
    if (!formData.billingAddress.postalCode.trim()) {
      newErrors.postalCode = 'Please enter a postal code';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (validateForm()) {
      onSubmit?.(formData);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
    }));

    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: '',
      }));
    }
  };

  const handleAddressChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      billingAddress: {
        ...prev.billingAddress,
        [field]: value,
      },
    }));

    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: '',
      }));
    }
  };

  return (
    <form onSubmit={handleSubmit} className={`space-y-6 ${className}`}>
      {/* Card Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <CreditCard className="w-5 h-5" />
            <span>Card Information</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="cardNumber">Card Number *</Label>
            <Input
              id="cardNumber"
              type="text"
              placeholder="1234 5678 9012 3456"
              value={formData.cardNumber}
              onChange={(e) => handleInputChange('cardNumber', formatCardNumber(e.target.value))}
              className={errors.cardNumber ? 'border-red-500' : ''}
              maxLength={19}
            />
            {errors.cardNumber && (
              <p className="text-sm text-red-600 mt-1">{errors.cardNumber}</p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="expiryDate">Expiry Date *</Label>
              <Input
                id="expiryDate"
                type="text"
                placeholder="MM/YY"
                value={formData.expiryDate}
                onChange={(e) => handleInputChange('expiryDate', formatExpiryDate(e.target.value))}
                className={errors.expiryDate ? 'border-red-500' : ''}
                maxLength={5}
              />
              {errors.expiryDate && (
                <p className="text-sm text-red-600 mt-1">{errors.expiryDate}</p>
              )}
            </div>

            <div>
              <Label htmlFor="cvv">CVV *</Label>
              <div className="relative">
                <Input
                  id="cvv"
                  type={showCvv ? 'text' : 'password'}
                  placeholder="123"
                  value={formData.cvv}
                  onChange={(e) => handleInputChange('cvv', e.target.value.replace(/\D/g, ''))}
                  className={errors.cvv ? 'border-red-500' : ''}
                  maxLength={4}
                />
                <button
                  type="button"
                  className="absolute right-3 top-1/2 transform -translate-y-1/2"
                  onClick={() => setShowCvv(!showCvv)}
                >
                  {showCvv ? (
                    <EyeOff className="w-4 h-4 text-gray-400" />
                  ) : (
                    <Eye className="w-4 h-4 text-gray-400" />
                  )}
                </button>
              </div>
              {errors.cvv && (
                <p className="text-sm text-red-600 mt-1">{errors.cvv}</p>
              )}
            </div>
          </div>

          <div>
            <Label htmlFor="cardholderName">Cardholder Name *</Label>
            <Input
              id="cardholderName"
              type="text"
              placeholder="John Doe"
              value={formData.cardholderName}
              onChange={(e) => handleInputChange('cardholderName', e.target.value)}
              className={errors.cardholderName ? 'border-red-500' : ''}
            />
            {errors.cardholderName && (
              <p className="text-sm text-red-600 mt-1">{errors.cardholderName}</p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Billing Address */}
      <Card>
        <CardHeader>
          <CardTitle>Billing Address</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="address">Address Line 1 *</Label>
            <Input
              id="address"
              type="text"
              placeholder="123 Main Street"
              value={formData.billingAddress.line1}
              onChange={(e) => handleAddressChange('line1', e.target.value)}
              className={errors.billingAddress ? 'border-red-500' : ''}
            />
            {errors.billingAddress && (
              <p className="text-sm text-red-600 mt-1">{errors.billingAddress}</p>
            )}
          </div>

          <div>
            <Label htmlFor="address2">Address Line 2</Label>
            <Input
              id="address2"
              type="text"
              placeholder="Apartment, suite, etc."
              value={formData.billingAddress.line2}
              onChange={(e) => handleAddressChange('line2', e.target.value)}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="city">City *</Label>
              <Input
                id="city"
                type="text"
                placeholder="New York"
                value={formData.billingAddress.city}
                onChange={(e) => handleAddressChange('city', e.target.value)}
                className={errors.city ? 'border-red-500' : ''}
              />
              {errors.city && (
                <p className="text-sm text-red-600 mt-1">{errors.city}</p>
              )}
            </div>

            <div>
              <Label htmlFor="state">State *</Label>
              <Input
                id="state"
                type="text"
                placeholder="NY"
                value={formData.billingAddress.state}
                onChange={(e) => handleAddressChange('state', e.target.value)}
                className={errors.state ? 'border-red-500' : ''}
              />
              {errors.state && (
                <p className="text-sm text-red-600 mt-1">{errors.state}</p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="postalCode">Postal Code *</Label>
              <Input
                id="postalCode"
                type="text"
                placeholder="10001"
                value={formData.billingAddress.postalCode}
                onChange={(e) => handleAddressChange('postalCode', e.target.value)}
                className={errors.postalCode ? 'border-red-500' : ''}
              />
              {errors.postalCode && (
                <p className="text-sm text-red-600 mt-1">{errors.postalCode}</p>
              )}
            </div>

            <div>
              <Label htmlFor="country">Country *</Label>
              <Input
                id="country"
                type="text"
                value={formData.billingAddress.country}
                onChange={(e) => handleAddressChange('country', e.target.value)}
                disabled
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Security Notice */}
      <div className="flex items-start space-x-3 p-4 bg-green-50 border border-green-200 rounded-lg">
        <CheckCircle className="w-5 h-5 text-green-600 mt-0.5" />
        <div>
          <p className="text-sm font-medium text-green-800">Secure Payment</p>
          <p className="text-sm text-green-700">
            Your payment information is encrypted and secure. We never store your full card details.
          </p>
        </div>
      </div>

      {/* Error Alert */}
      {error && (
        <Alert>
          <AlertCircle className="w-4 h-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Submit Button */}
      <Button
        type="submit"
        disabled={isLoading}
        className="w-full"
        size="lg"
      >
        {isLoading ? (
          <>
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
            Processing...
          </>
        ) : (
          <>
            <Lock className="w-4 h-4 mr-2" />
            Complete Payment
          </>
        )}
      </Button>
    </form>
  );
};