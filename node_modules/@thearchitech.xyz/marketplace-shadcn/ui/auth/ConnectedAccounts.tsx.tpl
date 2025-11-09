'use client';

"use client";

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Github, Google, Apple, Trash2, ExternalLink } from 'lucide-react';

export default function ConnectedAccounts() {
  const [connectedAccounts] = useState([
    {
      id: '1',
      provider: 'Google',
      email: 'user@gmail.com',
      connectedAt: '2024-01-15',
      status: 'active',
      icon: Google
    },
    {
      id: '2',
      provider: 'GitHub',
      username: 'username',
      connectedAt: '2024-01-10',
      status: 'active',
      icon: Github
    }
  ]);

  const handleDisconnect = (accountId: string) => {
    // Handle disconnect logic
    console.log('Disconnect account:', accountId);
  };

  const handleConnect = (provider: string) => {
    // Handle connect logic
    console.log('Connect to:', provider);
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Connected Accounts</h2>
        <p className="text-muted-foreground">
          Manage your connected social accounts and services
        </p>
      </div>

      <div className="grid gap-6">
        {/* Connected Accounts */}
        <Card>
          <CardHeader>
            <CardTitle>Connected Accounts</CardTitle>
            <CardDescription>
              Accounts currently connected to your profile
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {connectedAccounts.map((account, index) => {
                const IconComponent = account.icon;
                return (
                  <div key={account.id}>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <IconComponent className="h-5 w-5" />
                        <div>
                          <p className="font-medium">{account.provider}</p>
                          <p className="text-sm text-muted-foreground">
                            {account.email || account.username}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            Connected on {new Date(account.connectedAt).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Badge variant={account.status === 'active' ? 'default' : 'secondary'}>
                          {account.status}
                        </Badge>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDisconnect(account.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                    {index < connectedAccounts.length - 1 && <Separator className="mt-4" />}
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Available Providers */}
        <Card>
          <CardHeader>
            <CardTitle>Connect New Account</CardTitle>
            <CardDescription>
              Link additional accounts to your profile
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <Google className="h-5 w-5" />
                  <div>
                    <p className="font-medium">Google</p>
                    <p className="text-sm text-muted-foreground">
                      Sign in with Google
                    </p>
                  </div>
                </div>
                <Button variant="outline" onClick={() => handleConnect('Google')}>
                  <ExternalLink className="h-4 w-4 mr-2" />
                  Connect
                </Button>
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <Github className="h-5 w-5" />
                  <div>
                    <p className="font-medium">GitHub</p>
                    <p className="text-sm text-muted-foreground">
                      Sign in with GitHub
                    </p>
                  </div>
                </div>
                <Button variant="outline" onClick={() => handleConnect('GitHub')}>
                  <ExternalLink className="h-4 w-4 mr-2" />
                  Connect
                </Button>
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <Apple className="h-5 w-5" />
                  <div>
                    <p className="font-medium">Apple</p>
                    <p className="text-sm text-muted-foreground">
                      Sign in with Apple
                    </p>
                  </div>
                </div>
                <Button variant="outline" onClick={() => handleConnect('Apple')}>
                  <ExternalLink className="h-4 w-4 mr-2" />
                  Connect
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
