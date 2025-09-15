import React from 'react';
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
}
