import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Copy, ExternalLink, Clock, CheckCircle, XCircle } from 'lucide-react';

interface TransactionCardProps {
  hash: string;
  status: 'pending' | 'confirmed' | 'failed';
  from: string;
  to: string;
  value: string;
  gasUsed?: string;
  blockNumber?: number;
  confirmations: number;
  chainId: number;
  className?: string;
}

export function TransactionCard({
  hash,
  status,
  from,
  to,
  value,
  gasUsed,
  blockNumber,
  confirmations,
  chainId,
  className = ''
}: TransactionCardProps) {
  const copyHash = () => {
    navigator.clipboard.writeText(hash);
  };

  const openExplorer = () => {
    const explorerUrl = chainId === 1 
      ? \`https://etherscan.io/tx/\${hash}\`
      : \`https://goerli.etherscan.io/tx/\${hash}\`;
    window.open(explorerUrl, '_blank');
  };

  const getStatusIcon = () => {
    switch (status) {
      case 'pending':
        return <Clock className="h-4 w-4 text-yellow-500" />;
      case 'confirmed':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'failed':
        return <XCircle className="h-4 w-4 text-red-500" />;
      default:
        return <Clock className="h-4 w-4 text-gray-500" />;
    }
  };

  const getStatusColor = () => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'confirmed':
        return 'bg-green-100 text-green-800';
      case 'failed':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <Card className={\`w-full \${className}\`}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            {getStatusIcon()}
            Transaction
          </CardTitle>
          <Badge className={getStatusColor()}>
            {status.toUpperCase()}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Hash</span>
            <div className="flex gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={copyHash}
              >
                <Copy className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={openExplorer}
              >
                <ExternalLink className="h-4 w-4" />
              </Button>
            </div>
          </div>
          <code className="text-sm font-mono bg-muted px-2 py-1 rounded block">
            {hash.slice(0, 10)}...{hash.slice(-8)}
          </code>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <span className="text-sm text-muted-foreground">From</span>
            <code className="text-sm font-mono bg-muted px-2 py-1 rounded block">
              {from.slice(0, 6)}...{from.slice(-4)}
            </code>
          </div>
          <div className="space-y-2">
            <span className="text-sm text-muted-foreground">To</span>
            <code className="text-sm font-mono bg-muted px-2 py-1 rounded block">
              {to.slice(0, 6)}...{to.slice(-4)}
            </code>
          </div>
        </div>

        <div className="space-y-2">
          <span className="text-sm text-muted-foreground">Value</span>
          <div className="text-lg font-semibold">
            {parseFloat(value).toFixed(4)} ETH
          </div>
        </div>

        {gasUsed && (
          <div className="space-y-2">
            <span className="text-sm text-muted-foreground">Gas Used</span>
            <div className="text-sm font-mono">
              {parseInt(gasUsed).toLocaleString()}
            </div>
          </div>
        )}

        {blockNumber && (
          <div className="space-y-2">
            <span className="text-sm text-muted-foreground">Block Number</span>
            <div className="text-sm font-mono">
              {blockNumber.toLocaleString()}
            </div>
          </div>
        )}

        <div className="space-y-2">
          <span className="text-sm text-muted-foreground">Confirmations</span>
          <div className="text-sm font-mono">
            {confirmations}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
