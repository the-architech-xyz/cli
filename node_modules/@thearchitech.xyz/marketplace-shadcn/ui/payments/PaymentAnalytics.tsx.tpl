// Payment Analytics Component

import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  DollarSign, 
  TrendingUp, 
  TrendingDown,
  CreditCard,
  Users,
  ShoppingCart,
  BarChart3,
  PieChart
} from 'lucide-react';

interface PaymentAnalyticsProps {
  analytics: {
    totalRevenue: number;
    revenueChange: number;
    totalTransactions: number;
    transactionsChange: number;
    averageOrderValue: number;
    aovChange: number;
    conversionRate: number;
    conversionChange: number;
    topPaymentMethods: Array<{
      method: string;
      count: number;
      percentage: number;
    }>;
    revenueByPeriod: Array<{
      period: string;
      revenue: number;
      transactions: number;
    }>;
    refunds: {
      total: number;
      percentage: number;
      change: number;
    };
    chargebacks: {
      total: number;
      percentage: number;
      change: number;
    };
  };
  period: 'day' | 'week' | 'month' | 'year';
  onPeriodChange?: (period: string) => void;
  className?: string;
}

export const PaymentAnalytics: React.FC<PaymentAnalyticsProps> = ({
  analytics,
  period,
  onPeriodChange,
  className = '',
}) => {
  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  const formatPercentage = (value: number): string => {
    return `${value >= 0 ? '+' : ''}${value.toFixed(1)}%`;
  };

  const getChangeIcon = (change: number) => {
    return change >= 0 ? (
      <TrendingUp className="w-4 h-4 text-green-600" />
    ) : (
      <TrendingDown className="w-4 h-4 text-red-600" />
    );
  };

  const getChangeColor = (change: number): string => {
    return change >= 0 ? 'text-green-600' : 'text-red-600';
  };

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="p-2 bg-green-100 rounded-lg">
                <DollarSign className="w-6 h-6 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Revenue</p>
                <p className="text-2xl font-bold text-gray-900">
                  {formatCurrency(analytics.totalRevenue)}
                </p>
                <div className="flex items-center mt-1">
                  {getChangeIcon(analytics.revenueChange)}
                  <span className={`text-sm ml-1 ${getChangeColor(analytics.revenueChange)}`}>
                    {formatPercentage(analytics.revenueChange)}
                  </span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 rounded-lg">
                <CreditCard className="w-6 h-6 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Transactions</p>
                <p className="text-2xl font-bold text-gray-900">
                  {analytics.totalTransactions.toLocaleString()}
                </p>
                <div className="flex items-center mt-1">
                  {getChangeIcon(analytics.transactionsChange)}
                  <span className={`text-sm ml-1 ${getChangeColor(analytics.transactionsChange)}`}>
                    {formatPercentage(analytics.transactionsChange)}
                  </span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="p-2 bg-purple-100 rounded-lg">
                <ShoppingCart className="w-6 h-6 text-purple-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Avg Order Value</p>
                <p className="text-2xl font-bold text-gray-900">
                  {formatCurrency(analytics.averageOrderValue)}
                </p>
                <div className="flex items-center mt-1">
                  {getChangeIcon(analytics.aovChange)}
                  <span className={`text-sm ml-1 ${getChangeColor(analytics.aovChange)}`}>
                    {formatPercentage(analytics.aovChange)}
                  </span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="p-2 bg-orange-100 rounded-lg">
                <Users className="w-6 h-6 text-orange-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Conversion Rate</p>
                <p className="text-2xl font-bold text-gray-900">
                  {analytics.conversionRate.toFixed(1)}%
                </p>
                <div className="flex items-center mt-1">
                  {getChangeIcon(analytics.conversionChange)}
                  <span className={`text-sm ml-1 ${getChangeColor(analytics.conversionChange)}`}>
                    {formatPercentage(analytics.conversionChange)}
                  </span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Payment Methods & Issues */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Payment Methods */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <PieChart className="w-5 h-5" />
              <span>Payment Methods</span>
            </CardTitle>
            <CardDescription>
              Most used payment methods
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {analytics.topPaymentMethods.map((method, index) => (
                <div key={index} className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                    <span className="text-sm font-medium">{method.method}</span>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold">{method.count.toLocaleString()}</p>
                    <p className="text-xs text-gray-600">{method.percentage.toFixed(1)}%</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Refunds & Chargebacks */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <BarChart3 className="w-5 h-5" />
              <span>Issues</span>
            </CardTitle>
            <CardDescription>
              Refunds and chargebacks
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 bg-red-50 rounded-lg">
                <div>
                  <p className="text-sm font-medium text-red-900">Refunds</p>
                  <p className="text-xs text-red-700">
                    {analytics.refunds.total.toLocaleString()} transactions
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-lg font-bold text-red-900">
                    {analytics.refunds.percentage.toFixed(1)}%
                  </p>
                  <div className="flex items-center">
                    {getChangeIcon(analytics.refunds.change)}
                    <span className={`text-xs ml-1 ${getChangeColor(analytics.refunds.change)}`}>
                      {formatPercentage(analytics.refunds.change)}
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between p-3 bg-orange-50 rounded-lg">
                <div>
                  <p className="text-sm font-medium text-orange-900">Chargebacks</p>
                  <p className="text-xs text-orange-700">
                    {analytics.chargebacks.total.toLocaleString()} transactions
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-lg font-bold text-orange-900">
                    {analytics.chargebacks.percentage.toFixed(1)}%
                  </p>
                  <div className="flex items-center">
                    {getChangeIcon(analytics.chargebacks.change)}
                    <span className={`text-xs ml-1 ${getChangeColor(analytics.chargebacks.change)}`}>
                      {formatPercentage(analytics.chargebacks.change)}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Revenue by Period */}
      <Card>
        <CardHeader>
          <CardTitle>Revenue by {period}</CardTitle>
          <CardDescription>
            Revenue and transaction trends
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {analytics.revenueByPeriod.map((item, index) => (
              <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                <div>
                  <p className="text-sm font-medium">{item.period}</p>
                  <p className="text-xs text-gray-600">
                    {item.transactions.toLocaleString()} transactions
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-lg font-bold">{formatCurrency(item.revenue)}</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
