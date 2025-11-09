// Payment Method Selector Component

import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { 
  CreditCard, 
  Smartphone, 
  Building2, 
  Wallet,
  Check
} from 'lucide-react';

interface PaymentMethod {
  id: string;
  name: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  enabled: boolean;
  badge?: string;
}

interface PaymentMethodSelectorProps {
  value: string;
  onChange: (value: string) => void;
  methods?: PaymentMethod[];
  className?: string;
}

const defaultMethods: PaymentMethod[] = [
  {
    id: 'card',
    name: 'Credit/Debit Card',
    description: 'Pay with Visa, Mastercard, American Express',
    icon: CreditCard,
    enabled: true,
  },
  {
    id: 'apple_pay',
    name: 'Apple Pay',
    description: 'Pay securely with Apple Pay',
    icon: Smartphone,
    enabled: true,
    badge: 'Recommended',
  },
  {
    id: 'google_pay',
    name: 'Google Pay',
    description: 'Pay securely with Google Pay',
    icon: Smartphone,
    enabled: true,
  },
  {
    id: 'bank_transfer',
    name: 'Bank Transfer',
    description: 'Direct bank transfer (ACH)',
    icon: Building2,
    enabled: true,
  },
  {
    id: 'wallet',
    name: 'Digital Wallet',
    description: 'Pay with your digital wallet',
    icon: Wallet,
    enabled: false,
  },
];

export const PaymentMethodSelector: React.FC<PaymentMethodSelectorProps> = ({
  value,
  onChange,
  methods = defaultMethods,
  className = '',
}) => {
  const enabledMethods = methods.filter(method => method.enabled);

  return (
    <div className={`space-y-4 ${className}`}>
      <RadioGroup value={value} onValueChange={onChange}>
        {enabledMethods.map((method) => {
          const Icon = method.icon;
          const isSelected = value === method.id;

          return (
            <div key={method.id} className="relative">
              <Label
                htmlFor={method.id}
                className={`flex items-center space-x-3 p-4 border rounded-lg cursor-pointer transition-all hover:bg-gray-50 ${
                  isSelected 
                    ? 'border-blue-500 bg-blue-50' 
                    : 'border-gray-200'
                }`}
              >
                <RadioGroupItem value={method.id} id={method.id} className="sr-only" />
                
                <div className={`flex-shrink-0 w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                  isSelected 
                    ? 'border-blue-500 bg-blue-500' 
                    : 'border-gray-300'
                }`}>
                  {isSelected && (
                    <Check className="w-3 h-3 text-white" />
                  )}
                </div>

                <div className="flex-shrink-0">
                  <div className={`p-2 rounded-lg ${
                    isSelected ? 'bg-blue-100' : 'bg-gray-100'
                  }`}>
                    <Icon className={`w-5 h-5 ${
                      isSelected ? 'text-blue-600' : 'text-gray-600'
                    }`} />
                  </div>
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center space-x-2">
                    <p className={`text-sm font-medium ${
                      isSelected ? 'text-blue-900' : 'text-gray-900'
                    }`}>
                      {method.name}
                    </p>
                    {method.badge && (
                      <Badge variant="secondary" className="text-xs">
                        {method.badge}
                      </Badge>
                    )}
                  </div>
                  <p className={`text-sm ${
                    isSelected ? 'text-blue-700' : 'text-gray-600'
                  }`}>
                    {method.description}
                  </p>
                </div>
              </Label>
            </div>
          );
        })}
      </RadioGroup>

      {enabledMethods.length === 0 && (
        <div className="text-center py-8">
          <CreditCard className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No payment methods available</h3>
          <p className="text-gray-600">Please contact support to enable payment methods.</p>
        </div>
      )}
    </div>
  );
};