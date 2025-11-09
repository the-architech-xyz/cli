// Payment utility functions

export interface PaymentMethod {
  id: string;
  type: 'card' | 'bank_account' | 'digital_wallet';
  brand?: string;
  last4?: string;
  expMonth?: number;
  expYear?: number;
  isDefault: boolean;
}

export interface PaymentIntent {
  id: string;
  amount: number;
  currency: string;
  status: 'requires_payment_method' | 'requires_confirmation' | 'requires_action' | 'processing' | 'succeeded' | 'canceled';
  clientSecret: string;
  metadata?: Record<string, any>;
}

export interface PaymentError {
  code: string;
  message: string;
  type: 'card_error' | 'validation_error' | 'api_error' | 'authentication_error';
  decline_code?: string;
}

// Currency formatting
export const formatCurrency = (amount: number, currency: string = 'USD'): string => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency,
  }).format(amount);
};

// Amount conversion (cents to dollars)
export const centsToDollars = (cents: number): number => {
  return cents / 100;
};

export const dollarsToCents = (dollars: number): number => {
  return Math.round(dollars * 100);
};

// Card number formatting
export const formatCardNumber = (cardNumber: string): string => {
  const cleaned = cardNumber.replace(/\D/g, '');
  const groups = cleaned.match(/.{1,4}/g) || [];
  return groups.join(' ').substring(0, 19);
};

export const maskCardNumber = (cardNumber: string): string => {
  const cleaned = cardNumber.replace(/\D/g, '');
  if (cleaned.length < 8) return cardNumber;
  
  const firstFour = cleaned.substring(0, 4);
  const lastFour = cleaned.substring(cleaned.length - 4);
  const middle = '*'.repeat(cleaned.length - 8);
  
  return `${firstFour} ${middle} ${lastFour}`;
};

// Card validation
export const validateCardNumber = (cardNumber: string): { isValid: boolean; brand?: string } => {
  const cleaned = cardNumber.replace(/\D/g, '');
  
  // Luhn algorithm
  let sum = 0;
  let isEven = false;
  
  for (let i = cleaned.length - 1; i >= 0; i--) {
    let digit = parseInt(cleaned[i]);
    
    if (isEven) {
      digit *= 2;
      if (digit > 9) {
        digit -= 9;
      }
    }
    
    sum += digit;
    isEven = !isEven;
  }
  
  const isValid = sum % 10 === 0;
  
  // Detect card brand
  let brand: string | undefined;
  if (cleaned.startsWith('4')) {
    brand = 'visa';
  } else if (cleaned.startsWith('5') || cleaned.startsWith('2')) {
    brand = 'mastercard';
  } else if (cleaned.startsWith('3')) {
    brand = 'amex';
  } else if (cleaned.startsWith('6')) {
    brand = 'discover';
  }
  
  return { isValid, brand };
};

export const validateExpiryDate = (expiryDate: string): { isValid: boolean; month?: number; year?: number } => {
  const match = expiryDate.match(/^(\d{2})\/(\d{2})$/);
  if (!match) {
    return { isValid: false };
  }
  
  const month = parseInt(match[1]);
  const year = parseInt(match[2]) + 2000;
  
  if (month < 1 || month > 12) {
    return { isValid: false };
  }
  
  const currentDate = new Date();
  const currentYear = currentDate.getFullYear();
  const currentMonth = currentDate.getMonth() + 1;
  
  if (year < currentYear || (year === currentYear && month < currentMonth)) {
    return { isValid: false };
  }
  
  return { isValid: true, month, year };
};

export const validateCVV = (cvv: string, cardBrand?: string): boolean => {
  const cleaned = cvv.replace(/\D/g, '');
  
  if (cardBrand === 'amex') {
    return cleaned.length === 4;
  }
  
  return cleaned.length === 3;
};

// Payment status helpers
export const isPaymentSuccessful = (status: string): boolean => {
  return status === 'succeeded';
};

export const isPaymentPending = (status: string): boolean => {
  return ['requires_payment_method', 'requires_confirmation', 'requires_action', 'processing'].includes(status);
};

export const isPaymentFailed = (status: string): boolean => {
  return status === 'canceled';
};

export const getPaymentStatusColor = (status: string): string => {
  switch (status) {
    case 'succeeded':
      return 'text-green-600';
    case 'processing':
      return 'text-blue-600';
    case 'requires_action':
      return 'text-yellow-600';
    case 'canceled':
      return 'text-red-600';
    default:
      return 'text-gray-600';
  }
};

export const getPaymentStatusLabel = (status: string): string => {
  switch (status) {
    case 'succeeded':
      return 'Paid';
    case 'processing':
      return 'Processing';
    case 'requires_payment_method':
      return 'Payment Required';
    case 'requires_confirmation':
      return 'Confirmation Required';
    case 'requires_action':
      return 'Action Required';
    case 'canceled':
      return 'Canceled';
    default:
      return 'Unknown';
  }
};

// Error handling
export const parsePaymentError = (error: any): PaymentError => {
  if (error.type && error.code && error.message) {
    return error as PaymentError;
  }
  
  // Handle common error types
  if (error.name === 'StripeCardError') {
    return {
      code: error.code || 'card_error',
      message: error.message || 'Card error occurred',
      type: 'card_error',
      decline_code: error.decline_code,
    };
  }
  
  if (error.name === 'StripeInvalidRequestError') {
    return {
      code: error.code || 'invalid_request_error',
      message: error.message || 'Invalid request',
      type: 'validation_error',
    };
  }
  
  if (error.name === 'StripeAPIError') {
    return {
      code: error.code || 'api_error',
      message: error.message || 'API error occurred',
      type: 'api_error',
    };
  }
  
  if (error.name === 'StripeAuthenticationError') {
    return {
      code: error.code || 'authentication_error',
      message: error.message || 'Authentication error',
      type: 'authentication_error',
    };
  }
  
  // Default error
  return {
    code: 'unknown_error',
    message: error.message || 'An unknown error occurred',
    type: 'api_error',
  };
};

export const getErrorMessage = (error: PaymentError): string => {
  switch (error.type) {
    case 'card_error':
      switch (error.decline_code) {
        case 'insufficient_funds':
          return 'Your card has insufficient funds.';
        case 'card_declined':
          return 'Your card was declined.';
        case 'expired_card':
          return 'Your card has expired.';
        case 'incorrect_cvc':
          return 'Your card\'s security code is incorrect.';
        case 'processing_error':
          return 'An error occurred while processing your card.';
        default:
          return error.message;
      }
    case 'validation_error':
      return error.message;
    case 'api_error':
      return 'A server error occurred. Please try again.';
    case 'authentication_error':
      return 'Authentication failed. Please try again.';
    default:
      return error.message;
  }
};

// Payment method helpers
export const getPaymentMethodIcon = (type: string, brand?: string): string => {
  if (type === 'card') {
    switch (brand) {
      case 'visa':
        return '💳';
      case 'mastercard':
        return '💳';
      case 'amex':
        return '💳';
      case 'discover':
        return '💳';
      default:
        return '💳';
    }
  }
  
  if (type === 'bank_account') {
    return '🏦';
  }
  
  if (type === 'digital_wallet') {
    return '📱';
  }
  
  return '💳';
};

export const formatPaymentMethod = (method: PaymentMethod): string => {
  if (method.type === 'card' && method.brand && method.last4) {
    return `${method.brand.toUpperCase()} •••• ${method.last4}`;
  }
  
  if (method.type === 'bank_account' && method.last4) {
    return `Bank Account •••• ${method.last4}`;
  }
  
  if (method.type === 'digital_wallet') {
    return 'Digital Wallet';
  }
  
  return 'Payment Method';
};

// Subscription helpers
export const calculateSubscriptionAmount = (
  baseAmount: number,
  interval: 'month' | 'year' | 'week' | 'day',
  quantity: number = 1
): number => {
  const multipliers = {
    day: 1,
    week: 7,
    month: 30,
    year: 365,
  };
  
  return baseAmount * quantity * multipliers[interval];
};

export const formatSubscriptionInterval = (interval: string): string => {
  switch (interval) {
    case 'day':
      return 'Daily';
    case 'week':
      return 'Weekly';
    case 'month':
      return 'Monthly';
    case 'year':
      return 'Yearly';
    default:
      return interval;
  }
};

// Tax calculation
export const calculateTax = (amount: number, taxRate: number): number => {
  return Math.round(amount * taxRate * 100) / 100;
};

export const calculateTotal = (subtotal: number, tax: number, shipping: number = 0): number => {
  return subtotal + tax + shipping;
};

// Discount calculation
export const calculateDiscount = (amount: number, discountType: 'percentage' | 'fixed', discountValue: number): number => {
  if (discountType === 'percentage') {
    return Math.round(amount * (discountValue / 100) * 100) / 100;
  }
  
  return Math.min(discountValue, amount);
};

// Payment intent helpers
export const createPaymentIntent = async (amount: number, currency: string = 'USD'): Promise<PaymentIntent> => {
  const response = await fetch('/api/payments/create-intent', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ amount, currency }),
  });
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to create payment intent');
  }
  
  return response.json();
};

export const confirmPaymentIntent = async (paymentIntentId: string, paymentMethodId: string): Promise<PaymentIntent> => {
  const response = await fetch('/api/payments/confirm-intent', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ paymentIntentId, paymentMethodId }),
  });
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to confirm payment intent');
  }
  
  return response.json();
};