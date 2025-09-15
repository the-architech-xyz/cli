import React from 'react';
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
}
