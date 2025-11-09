/**
 * Billing Dashboard Component
 * 
 * Simple billing overview for teams
 */

'use client';

import { useTeamBilling } from '@/lib/teams/hooks';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CreditCard, DollarSign } from 'lucide-react';

export function BillingDashboard({ teamId }: { teamId: string }) {
  const { data: billing, isLoading } = useTeamBilling(teamId);

  if (isLoading) {
    return <div>Loading billing information...</div>;
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Current Plan</CardTitle>
          <CardDescription>Your team's subscription details</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-2xl font-bold">{billing?.planName || 'Free'}</h3>
              <p className="text-sm text-muted-foreground">
                {billing?.seats || 0} seats • {billing?.billingCycle || 'monthly'}
              </p>
            </div>
            <Badge variant={billing?.status === 'active' ? 'default' : 'secondary'}>
              {billing?.status || 'inactive'}
            </Badge>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Current Usage</CardTitle>
          <DollarSign className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            ${billing?.currentUsage?.toFixed(2) || '0.00'}
          </div>
          <p className="text-xs text-muted-foreground">
            This billing period
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Payment Method</CardTitle>
          <CardDescription>Manage your payment information</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CreditCard className="h-4 w-4" />
              <span className="text-sm">
                {billing?.paymentMethod || 'No payment method'}
              </span>
            </div>
            <Button variant="outline" size="sm">
              Update
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
