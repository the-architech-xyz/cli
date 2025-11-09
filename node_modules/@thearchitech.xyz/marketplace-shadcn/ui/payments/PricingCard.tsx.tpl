// Pricing Card Component

import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Check, X, Star } from 'lucide-react';

interface PricingCardProps {
  plan: {
    id: string;
    name: string;
    description: string;
    price: number;
    currency: string;
    interval: 'month' | 'year' | 'week' | 'day';
    features: string[];
    limitations?: string[];
    isPopular?: boolean;
    isEnterprise?: boolean;
    buttonText?: string;
    buttonVariant?: 'default' | 'outline' | 'secondary';
    onSelect?: (planId: string) => void;
  };
  selectedPlan?: string;
  onSelect?: (planId: string) => void;
  className?: string;
}

export const PricingCard: React.FC<PricingCardProps> = ({
  plan,
  selectedPlan,
  onSelect,
  className = '',
}) => {
  const isSelected = selectedPlan === plan.id;
  const isPopular = plan.isPopular;
  const isEnterprise = plan.isEnterprise;

  const formatPrice = (price: number, currency: string, interval: string): string => {
    const formattedPrice = new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
    }).format(price);

    const intervalMap = {
      day: '/day',
      week: '/week',
      month: '/month',
      year: '/year',
    };

    return `${formattedPrice}${intervalMap[interval as keyof typeof intervalMap] || ''}`;
  };

  const handleSelect = () => {
    onSelect?.(plan.id);
    plan.onSelect?.(plan.id);
  };

  return (
    <Card className={`relative ${isSelected ? 'ring-2 ring-blue-500' : ''} ${className}`}>
      {isPopular && (
        <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
          <Badge className="bg-blue-600 text-white px-3 py-1">
            <Star className="w-3 h-3 mr-1" />
            Most Popular
          </Badge>
        </div>
      )}

      {isEnterprise && (
        <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
          <Badge className="bg-purple-600 text-white px-3 py-1">
            Enterprise
          </Badge>
        </div>
      )}

      <CardHeader className="text-center pb-4">
        <CardTitle className="text-2xl font-bold">{plan.name}</CardTitle>
        <CardDescription className="text-gray-600">
          {plan.description}
        </CardDescription>
        <div className="mt-4">
          <span className="text-4xl font-bold text-gray-900">
            {formatPrice(plan.price, plan.currency, plan.interval)}
          </span>
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Features */}
        <div className="space-y-3">
          {plan.features.map((feature, index) => (
            <div key={index} className="flex items-start space-x-3">
              <Check className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
              <span className="text-sm text-gray-700">{feature}</span>
            </div>
          ))}
        </div>

        {/* Limitations */}
        {plan.limitations && plan.limitations.length > 0 && (
          <div className="space-y-3">
            <h4 className="text-sm font-medium text-gray-900">Limitations</h4>
            {plan.limitations.map((limitation, index) => (
              <div key={index} className="flex items-start space-x-3">
                <X className="w-5 h-5 text-red-500 mt-0.5 flex-shrink-0" />
                <span className="text-sm text-gray-600">{limitation}</span>
              </div>
            ))}
          </div>
        )}

        {/* Action Button */}
        <Button
          onClick={handleSelect}
          variant={isSelected ? 'default' : (plan.buttonVariant || 'outline')}
          className="w-full"
          size="lg"
        >
          {isSelected 
            ? 'Selected' 
            : (plan.buttonText || `Choose ${plan.name}`)
          }
        </Button>

        {/* Additional Info */}
        {plan.interval === 'year' && (
          <p className="text-xs text-center text-gray-500">
            Save 20% compared to monthly billing
          </p>
        )}
      </CardContent>
    </Card>
  );
};
