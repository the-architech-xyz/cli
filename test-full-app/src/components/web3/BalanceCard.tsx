import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { RefreshCw, TrendingUp, TrendingDown } from 'lucide-react';

interface BalanceCardProps {
  balance: string;
  symbol: string;
  usdValue?: number;
  change24h?: number;
  onRefresh: () => void;
  isLoading?: boolean;
  className?: string;
}

export function BalanceCard({
  balance,
  symbol,
  usdValue,
  change24h,
  onRefresh,
  isLoading = false,
  className = ''
}: BalanceCardProps) {
  const formatBalance = (balance: string) => {
    const num = parseFloat(balance);
    if (num >= 1) {
      return num.toFixed(4);
    } else if (num >= 0.0001) {
      return num.toFixed(6);
    } else {
      return num.toExponential(2);
    }
  };

  const getChangeIcon = () => {
    if (change24h === undefined) return null;
    return change24h >= 0 
      ? <TrendingUp className="h-4 w-4 text-green-500" />
      : <TrendingDown className="h-4 w-4 text-red-500" />;
  };

  const getChangeColor = () => {
    if (change24h === undefined) return 'text-muted-foreground';
    return change24h >= 0 ? 'text-green-500' : 'text-red-500';
  };

  return (
    <Card className={\`w-full max-w-sm \${className}\`}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">Balance</CardTitle>
          <Button
            variant="outline"
            size="sm"
            onClick={onRefresh}
            disabled={isLoading}
          >
            <RefreshCw className={\`h-4 w-4 \${isLoading ? 'animate-spin' : ''}\`} />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <div className="text-3xl font-bold">
            {formatBalance(balance)} {symbol}
          </div>
          {usdValue && (
            <div className="text-lg text-muted-foreground">
              \${usdValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
          )}
        </div>

        {change24h !== undefined && (
          <div className="flex items-center gap-2">
            {getChangeIcon()}
            <span className={\`text-sm font-medium \${getChangeColor()}\`}>
              {change24h >= 0 ? '+' : ''}{change24h.toFixed(2)}%
            </span>
            <Badge variant="outline" className="text-xs">
              24h
            </Badge>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
