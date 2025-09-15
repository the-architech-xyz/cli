import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Copy, ExternalLink, RefreshCw } from 'lucide-react';

interface WalletCardProps {
  address: string;
  balance: string;
  chainId: number;
  onDisconnect: () => void;
  onRefresh: () => void;
  className?: string;
}

export function WalletCard({ 
  address, 
  balance, 
  chainId, 
  onDisconnect, 
  onRefresh,
  className = '' 
}: WalletCardProps) {
  const copyAddress = () => {
    navigator.clipboard.writeText(address);
  };

  const openExplorer = () => {
    const explorerUrl = chainId === 1 
      ? \`https://etherscan.io/address/\${address}\`
      : \`https://goerli.etherscan.io/address/\${address}\`;
    window.open(explorerUrl, '_blank');
  };

  return (
    <Card className={\`w-full max-w-md \${className}\`}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">Wallet</CardTitle>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={onRefresh}
            >
              <RefreshCw className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={onDisconnect}
            >
              Disconnect
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Address</span>
            <Badge variant="secondary">
              {chainId === 1 ? 'Mainnet' : 'Testnet'}
            </Badge>
          </div>
          <div className="flex items-center gap-2">
            <code className="text-sm font-mono bg-muted px-2 py-1 rounded flex-1">
              {address.slice(0, 6)}...{address.slice(-4)}
            </code>
            <Button
              variant="ghost"
              size="sm"
              onClick={copyAddress}
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
        
        <div className="space-y-2">
          <span className="text-sm text-muted-foreground">Balance</span>
          <div className="text-2xl font-bold">
            {parseFloat(balance).toFixed(4)} ETH
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
