import { Blueprint } from '../../types/adapter.js';

export const blueprint: Blueprint = {
  id: 'web3-shadcn-integration',
  name: 'Web3 Shadcn Integration',
  description: 'Beautiful Web3 UI components using Shadcn/ui',
  version: '1.0.0',
  actions: [
    {
      type: 'CREATE_FILE',
      path: 'src/components/web3/WalletCard.tsx',
      content: `import React from 'react';
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
}`
    },
    {
      type: 'CREATE_FILE',
      path: 'src/components/web3/TransactionCard.tsx',
      content: `import React from 'react';
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
}`
    },
    {
      type: 'CREATE_FILE',
      path: 'src/components/web3/NetworkSwitcher.tsx',
      content: `import React from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { NetworkConfig } from '@/lib/web3/network';

interface NetworkSwitcherProps {
  currentChainId: number | null;
  onNetworkChange: (chainId: number) => void;
  supportedNetworks: NetworkConfig[];
  className?: string;
}

export function NetworkSwitcher({
  currentChainId,
  onNetworkChange,
  supportedNetworks,
  className = ''
}: NetworkSwitcherProps) {
  const currentNetwork = supportedNetworks.find(network => network.chainId === currentChainId);

  return (
    <div className={\`flex items-center gap-2 \${className}\`}>
      <Select
        value={currentChainId?.toString() || ''}
        onValueChange={(value) => onNetworkChange(parseInt(value))}
      >
        <SelectTrigger className="w-[200px]">
          <SelectValue placeholder="Select Network" />
        </SelectTrigger>
        <SelectContent>
          {supportedNetworks.map((network) => (
            <SelectItem key={network.chainId} value={network.chainId.toString()}>
              <div className="flex items-center gap-2">
                <span>{network.name}</span>
                <Badge variant="outline" className="text-xs">
                  {network.nativeCurrency.symbol}
                </Badge>
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      
      {currentNetwork && (
        <Badge variant="secondary" className="text-xs">
          {currentNetwork.nativeCurrency.symbol}
        </Badge>
      )}
    </div>
  );
}`
    },
    {
      type: 'CREATE_FILE',
      path: 'src/components/web3/BalanceCard.tsx',
      content: `import React from 'react';
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
}`
    },
    {
      type: 'CREATE_FILE',
      path: 'src/components/web3/Web3Dashboard.tsx',
      content: `import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { WalletCard } from './WalletCard';
import { BalanceCard } from './BalanceCard';
import { TransactionHistory } from './TransactionHistory';
import { NetworkSwitcher } from './NetworkSwitcher';

interface Web3DashboardProps {
  address: string;
  balance: string;
  chainId: number;
  onDisconnect: () => void;
  onRefresh: () => void;
  onNetworkChange: (chainId: number) => void;
  supportedNetworks: any[];
  transactions: any[];
  className?: string;
}

export function Web3Dashboard({
  address,
  balance,
  chainId,
  onDisconnect,
  onRefresh,
  onNetworkChange,
  supportedNetworks,
  transactions,
  className = ''
}: Web3DashboardProps) {
  return (
    <div className={\`w-full max-w-6xl mx-auto p-6 \${className}\`}>
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">Web3 Dashboard</h1>
        <p className="text-muted-foreground">
          Manage your wallet, view transactions, and interact with smart contracts
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-6">
        <WalletCard
          address={address}
          balance={balance}
          chainId={chainId}
          onDisconnect={onDisconnect}
          onRefresh={onRefresh}
        />
        <BalanceCard
          balance={balance}
          symbol="ETH"
          onRefresh={onRefresh}
        />
        <Card>
          <CardHeader>
            <CardTitle>Network</CardTitle>
          </CardHeader>
          <CardContent>
            <NetworkSwitcher
              currentChainId={chainId}
              onNetworkChange={onNetworkChange}
              supportedNetworks={supportedNetworks}
            />
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="transactions" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="transactions">Transactions</TabsTrigger>
          <TabsTrigger value="contracts">Contracts</TabsTrigger>
          <TabsTrigger value="tokens">Tokens</TabsTrigger>
        </TabsList>
        
        <TabsContent value="transactions" className="mt-6">
          <TransactionHistory
            transactions={transactions}
            chainId={chainId}
          />
        </TabsContent>
        
        <TabsContent value="contracts" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Smart Contracts</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                Smart contract interactions will be displayed here
              </p>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="tokens" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Tokens</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                Token balances and management will be displayed here
              </p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}`
    }
  ]
};
