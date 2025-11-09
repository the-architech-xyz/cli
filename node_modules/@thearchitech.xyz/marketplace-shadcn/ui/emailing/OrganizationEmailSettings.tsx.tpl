'use client';

import React, { useState } from 'react';
import { useEmailContext } from '@/hooks/use-email-context';
import { useEmailAnalytics } from '@/hooks/emailing/hooks';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { 
  Mail, 
  BarChart3, 
  Settings, 
  Users, 
  Shield, 
  AlertCircle,
  CheckCircle,
  Clock
} from 'lucide-react';

export function OrganizationEmailSettings() {
  const { 
    userContext, 
    isLoading: authLoading, 
    error: authError,
    canManageOrgSettings,
    canViewAnalytics,
    canManageTemplates,
    canManageCampaigns
  } = useEmailContext();
  
  const { analytics, isLoading: analyticsLoading } = useEmailAnalytics();
  const [isSaving, setIsSaving] = useState(false);

  if (authLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <Clock className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p>Loading email settings...</p>
        </div>
      </div>
    );
  }

  if (authError) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          Failed to load email settings: {authError.message}
        </AlertDescription>
      </Alert>
    );
  }

  if (!userContext) {
    return (
      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          Please sign in to manage email settings.
        </AlertDescription>
      </Alert>
    );
  }

  if (!canManageOrgSettings) {
    return (
      <Alert>
        <Shield className="h-4 w-4" />
        <AlertDescription>
          Only organization owners can manage email settings.
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Email Settings</h1>
          <p className="text-muted-foreground">
            Manage email settings for {userContext.organizationId}
          </p>
        </div>
        <Badge variant="outline" className="flex items-center gap-2">
          <Users className="h-3 w-3" />
          Organization Owner
        </Badge>
      </div>

      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <% if (module.parameters.hasTemplates) { %>
          <TabsTrigger value="templates">Templates</TabsTrigger>
          <% } %>
          <% if (module.parameters.hasBulkEmail) { %>
          <TabsTrigger value="campaigns">Campaigns</TabsTrigger>
          <% } %>
          <% if (module.parameters.hasAnalytics) { %>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
          <% } %>
          <TabsTrigger value="settings">Settings</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Emails Sent</CardTitle>
                <Mail className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {analytics?.totalSent || 0}
                </div>
                <p className="text-xs text-muted-foreground">
                  This month
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Open Rate</CardTitle>
                <BarChart3 className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {analytics?.openRate ? `${(analytics.openRate * 100).toFixed(1)}%` : '0%'}
                </div>
                <p className="text-xs text-muted-foreground">
                  Average open rate
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Click Rate</CardTitle>
                <BarChart3 className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {analytics?.clickRate ? `${(analytics.clickRate * 100).toFixed(1)}%` : '0%'}
                </div>
                <p className="text-xs text-muted-foreground">
                  Average click rate
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Bounce Rate</CardTitle>
                <AlertCircle className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {analytics?.bounceRate ? `${(analytics.bounceRate * 100).toFixed(1)}%` : '0%'}
                </div>
                <p className="text-xs text-muted-foreground">
                  Average bounce rate
                </p>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Recent Activity</CardTitle>
              <CardDescription>
                Latest email activity for your organization
              </CardDescription>
            </CardHeader>
            <CardContent>
              {analytics?.recentActivity && analytics.recentActivity.length > 0 ? (
                <div className="space-y-2">
                  {analytics.recentActivity.slice(0, 5).map((activity) => (
                    <div key={activity.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center gap-3">
                        <Mail className="h-4 w-4 text-muted-foreground" />
                        <div>
                          <p className="font-medium">{activity.subject}</p>
                          <p className="text-sm text-muted-foreground">
                            {new Date(activity.sentAt).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      <Badge variant={activity.status === 'sent' ? 'default' : 'secondary'}>
                        {activity.status}
                      </Badge>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-muted-foreground text-center py-8">
                  No recent email activity
                </p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <% if (module.parameters.hasTemplates) { %>
        <TabsContent value="templates" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Email Templates</CardTitle>
              <CardDescription>
                Manage organization email templates
              </CardDescription>
            </CardHeader>
            <CardContent>
              {canManageTemplates ? (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <p>Organization templates are managed by admins and owners.</p>
                    <Button>Create Template</Button>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Template management functionality will be available here.
                  </p>
                </div>
              ) : (
                <Alert>
                  <Shield className="h-4 w-4" />
                  <AlertDescription>
                    You don't have permission to manage templates.
                  </AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        <% } %>

        <% if (module.parameters.hasBulkEmail) { %>
        <TabsContent value="campaigns" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Email Campaigns</CardTitle>
              <CardDescription>
                Manage organization email campaigns
              </CardDescription>
            </CardHeader>
            <CardContent>
              {canManageCampaigns ? (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <p>Organization campaigns are managed by admins and owners.</p>
                    <Button>Create Campaign</Button>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Campaign management functionality will be available here.
                  </p>
                </div>
              ) : (
                <Alert>
                  <Shield className="h-4 w-4" />
                  <AlertDescription>
                    You don't have permission to manage campaigns.
                  </AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        <% } %>

        <% if (module.parameters.hasAnalytics) { %>
        <TabsContent value="analytics" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Email Analytics</CardTitle>
              <CardDescription>
                Detailed email performance metrics
              </CardDescription>
            </CardHeader>
            <CardContent>
              {canViewAnalytics ? (
                <div className="space-y-4">
                  <p>Detailed analytics will be available here.</p>
                  <p className="text-sm text-muted-foreground">
                    Analytics functionality will be expanded in future updates.
                  </p>
                </div>
              ) : (
                <Alert>
                  <Shield className="h-4 w-4" />
                  <AlertDescription>
                    You don't have permission to view analytics.
                  </AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        <% } %>

        <TabsContent value="settings" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Email Configuration</CardTitle>
              <CardDescription>
                Configure organization email settings
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="from-email">Default From Email</Label>
                <Input
                  id="from-email"
                  placeholder="noreply@yourcompany.com"
                  defaultValue="noreply@yourcompany.com"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="reply-to">Reply-To Email</Label>
                <Input
                  id="reply-to"
                  placeholder="support@yourcompany.com"
                  defaultValue="support@yourcompany.com"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="daily-limit">Daily Email Limit</Label>
                <Select defaultValue="1000">
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="100">100 emails/day</SelectItem>
                    <SelectItem value="500">500 emails/day</SelectItem>
                    <SelectItem value="1000">1,000 emails/day</SelectItem>
                    <SelectItem value="5000">5,000 emails/day</SelectItem>
                    <SelectItem value="unlimited">Unlimited</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="track-opens"
                  className="rounded border-gray-300"
                  defaultChecked
                />
                <Label htmlFor="track-opens">Track email opens</Label>
              </div>

              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="track-clicks"
                  className="rounded border-gray-300"
                  defaultChecked
                />
                <Label htmlFor="track-clicks">Track email clicks</Label>
              </div>

              <Button 
                onClick={() => setIsSaving(true)}
                disabled={isSaving}
                className="w-full"
              >
                {isSaving ? 'Saving...' : 'Save Settings'}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
