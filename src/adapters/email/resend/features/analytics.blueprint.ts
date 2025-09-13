/**
 * Resend Analytics Feature
 * 
 * Adds detailed email tracking, open rates, and click analytics
 */

import { Blueprint } from '../../../../types/adapter.js';

const analyticsBlueprint: Blueprint = {
  id: 'resend-analytics',
  name: 'Resend Analytics',
  actions: [
    {
      type: 'CREATE_FILE',
      path: 'src/lib/email/analytics/analytics-manager.ts',
      content: `import { Resend } from 'resend';

// Analytics data interfaces
export interface EmailEvent {
  id: string;
  emailId: string;
  event: 'sent' | 'delivered' | 'opened' | 'clicked' | 'bounced' | 'complained';
  timestamp: Date;
  recipient: string;
  metadata?: Record<string, any>;
}

export interface EmailAnalytics {
  emailId: string;
  subject: string;
  sentAt: Date;
  recipient: string;
  status: 'sent' | 'delivered' | 'bounced' | 'failed';
  events: EmailEvent[];
  openRate: number;
  clickRate: number;
  bounceRate: number;
}

export interface CampaignAnalytics {
  campaignId: string;
  name: string;
  totalSent: number;
  totalDelivered: number;
  totalOpened: number;
  totalClicked: number;
  totalBounced: number;
  openRate: number;
  clickRate: number;
  bounceRate: number;
  startDate: Date;
  endDate?: Date;
}

// Analytics manager
export class AnalyticsManager {
  private resend: Resend;
  private events: EmailEvent[] = [];
  
  constructor(resend: Resend) {
    this.resend = resend;
  }

  async trackEmailSent(emailId: string, recipient: string, subject: string): Promise<void> {
    const event: EmailEvent = {
      id: this.generateEventId(),
      emailId,
      event: 'sent',
      timestamp: new Date(),
      recipient,
      metadata: { subject }
    };
    
    this.events.push(event);
    await this.saveEvent(event);
  }

  async trackEmailOpened(emailId: string, recipient: string, userAgent?: string): Promise<void> {
    const event: EmailEvent = {
      id: this.generateEventId(),
      emailId,
      event: 'opened',
      timestamp: new Date(),
      recipient,
      metadata: { userAgent }
    };
    
    this.events.push(event);
    await this.saveEvent(event);
  }

  async trackEmailClicked(emailId: string, recipient: string, linkUrl: string): Promise<void> {
    const event: EmailEvent = {
      id: this.generateEventId(),
      emailId,
      event: 'clicked',
      timestamp: new Date(),
      recipient,
      metadata: { linkUrl }
    };
    
    this.events.push(event);
    await this.saveEvent(event);
  }

  async trackEmailBounced(emailId: string, recipient: string, reason: string): Promise<void> {
    const event: EmailEvent = {
      id: this.generateEventId(),
      emailId,
      event: 'bounced',
      timestamp: new Date(),
      recipient,
      metadata: { reason }
    };
    
    this.events.push(event);
    await this.saveEvent(event);
  }

  async getEmailAnalytics(emailId: string): Promise<EmailAnalytics | null> {
    const emailEvents = this.events.filter(e => e.emailId === emailId);
    
    if (emailEvents.length === 0) return null;
    
    const sentEvent = emailEvents.find(e => e.event === 'sent');
    const openEvents = emailEvents.filter(e => e.event === 'opened');
    const clickEvents = emailEvents.filter(e => e.event === 'clicked');
    const bounceEvents = emailEvents.filter(e => e.event === 'bounced');
    
    const totalSent = sentEvent ? 1 : 0;
    const totalOpened = openEvents.length;
    const totalClicked = clickEvents.length;
    const totalBounced = bounceEvents.length;
    
    return {
      emailId,
      subject: sentEvent?.metadata?.subject || 'Unknown',
      sentAt: sentEvent?.timestamp || new Date(),
      recipient: sentEvent?.recipient || 'Unknown',
      status: totalBounced > 0 ? 'bounced' : 'delivered',
      events: emailEvents,
      openRate: totalSent > 0 ? (totalOpened / totalSent) * 100 : 0,
      clickRate: totalSent > 0 ? (totalClicked / totalSent) * 100 : 0,
      bounceRate: totalSent > 0 ? (totalBounced / totalSent) * 100 : 0,
    };
  }

  async getCampaignAnalytics(campaignId: string): Promise<CampaignAnalytics | null> {
    const campaignEvents = this.events.filter(e => e.metadata?.campaignId === campaignId);
    
    if (campaignEvents.length === 0) return null;
    
    const sentEvents = campaignEvents.filter(e => e.event === 'sent');
    const openEvents = campaignEvents.filter(e => e.event === 'opened');
    const clickEvents = campaignEvents.filter(e => e.event === 'clicked');
    const bounceEvents = campaignEvents.filter(e => e.event === 'bounced');
    
    const totalSent = sentEvents.length;
    const totalDelivered = totalSent - bounceEvents.length;
    const totalOpened = openEvents.length;
    const totalClicked = clickEvents.length;
    const totalBounced = bounceEvents.length;
    
    return {
      campaignId,
      name: campaignEvents[0]?.metadata?.campaignName || 'Unknown Campaign',
      totalSent,
      totalDelivered,
      totalOpened,
      totalClicked,
      totalBounced,
      openRate: totalSent > 0 ? (totalOpened / totalSent) * 100 : 0,
      clickRate: totalSent > 0 ? (totalClicked / totalSent) * 100 : 0,
      bounceRate: totalSent > 0 ? (totalBounced / totalSent) * 100 : 0,
      startDate: new Date(Math.min(...campaignEvents.map(e => e.timestamp.getTime()))),
      endDate: new Date(Math.max(...campaignEvents.map(e => e.timestamp.getTime()))),
    };
  }

  async getOverallAnalytics(startDate?: Date, endDate?: Date): Promise<{
    totalEmails: number;
    totalOpens: number;
    totalClicks: number;
    totalBounces: number;
    openRate: number;
    clickRate: number;
    bounceRate: number;
  }> {
    let filteredEvents = this.events;
    
    if (startDate || endDate) {
      filteredEvents = this.events.filter(event => {
        if (startDate && event.timestamp < startDate) return false;
        if (endDate && event.timestamp > endDate) return false;
        return true;
      });
    }
    
    const sentEvents = filteredEvents.filter(e => e.event === 'sent');
    const openEvents = filteredEvents.filter(e => e.event === 'opened');
    const clickEvents = filteredEvents.filter(e => e.event === 'clicked');
    const bounceEvents = filteredEvents.filter(e => e.event === 'bounced');
    
    const totalEmails = sentEvents.length;
    const totalOpens = openEvents.length;
    const totalClicks = clickEvents.length;
    const totalBounces = bounceEvents.length;
    
    return {
      totalEmails,
      totalOpens,
      totalClicks,
      totalBounces,
      openRate: totalEmails > 0 ? (totalOpens / totalEmails) * 100 : 0,
      clickRate: totalEmails > 0 ? (totalClicks / totalEmails) * 100 : 0,
      bounceRate: totalEmails > 0 ? (totalBounces / totalEmails) * 100 : 0,
    };
  }

  private generateEventId(): string {
    return 'evt_' + Math.random().toString(36).substr(2, 9);
  }

  private async saveEvent(event: EmailEvent): Promise<void> {
    // In a real implementation, this would save to a database
    console.log('Saving event:', event);
  }
}`
    },
    {
      type: 'CREATE_FILE',
      path: 'src/components/email/analytics-dashboard.tsx',
      content: `{{#if module.parameters.dashboard}}
'use client';

import React, { useState, useEffect } from 'react';
import { AnalyticsManager } from '@/lib/email/analytics/analytics-manager';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

interface AnalyticsDashboardProps {
  analyticsManager: AnalyticsManager;
}

export function AnalyticsDashboard({ analyticsManager }: AnalyticsDashboardProps) {
  const [overallStats, setOverallStats] = useState<any>(null);
  const [campaigns, setCampaigns] = useState<any[]>([]);
  const [selectedCampaign, setSelectedCampaign] = useState<string>('');
  const [campaignDetails, setCampaignDetails] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    loadOverallStats();
    loadCampaigns();
  }, []);

  const loadOverallStats = async () => {
    setIsLoading(true);
    try {
      const stats = await analyticsManager.getOverallAnalytics();
      setOverallStats(stats);
    } catch (error) {
      console.error('Failed to load overall stats:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadCampaigns = async () => {
    // Mock campaign data
    const mockCampaigns = [
      { id: 'camp_1', name: 'Welcome Series', sent: 1000, opened: 750, clicked: 150 },
      { id: 'camp_2', name: 'Newsletter', sent: 500, opened: 300, clicked: 75 },
      { id: 'camp_3', name: 'Product Update', sent: 200, opened: 120, clicked: 30 },
    ];
    setCampaigns(mockCampaigns);
  };

  const loadCampaignDetails = async (campaignId: string) => {
    setIsLoading(true);
    try {
      const details = await analyticsManager.getCampaignAnalytics(campaignId);
      setCampaignDetails(details);
    } catch (error) {
      console.error('Failed to load campaign details:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getRateColor = (rate: number) => {
    if (rate >= 20) return 'text-green-600';
    if (rate >= 10) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getRateBadge = (rate: number) => {
    if (rate >= 20) return 'default';
    if (rate >= 10) return 'secondary';
    return 'destructive';
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Email Analytics</h1>
          <p className="text-muted-foreground">
            Track your email performance and engagement metrics
          </p>
        </div>
        <Button onClick={loadOverallStats} disabled={isLoading}>
          {isLoading ? 'Loading...' : 'Refresh'}
        </Button>
      </div>

      {/* Overall Statistics */}
      {overallStats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Emails</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{overallStats.totalEmails.toLocaleString()}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Open Rate</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                <span className={getRateColor(overallStats.openRate)}>
                  {overallStats.openRate.toFixed(1)}%
                </span>
              </div>
              <p className="text-xs text-muted-foreground">
                {overallStats.totalOpens.toLocaleString()} opens
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Click Rate</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                <span className={getRateColor(overallStats.clickRate)}>
                  {overallStats.clickRate.toFixed(1)}%
                </span>
              </div>
              <p className="text-xs text-muted-foreground">
                {overallStats.totalClicks.toLocaleString()} clicks
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Bounce Rate</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                <span className={getRateColor(100 - overallStats.bounceRate)}>
                  {overallStats.bounceRate.toFixed(1)}%
                </span>
              </div>
              <p className="text-xs text-muted-foreground">
                {overallStats.totalBounces.toLocaleString()} bounces
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Campaign Analytics */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Campaign Performance</CardTitle>
            <CardDescription>Overview of your email campaigns</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {campaigns.map((campaign) => {
                const openRate = (campaign.opened / campaign.sent) * 100;
                const clickRate = (campaign.clicked / campaign.sent) * 100;
                
                return (
                  <div
                    key={campaign.id}
                    className="flex items-center justify-between p-4 border rounded-lg cursor-pointer hover:bg-muted/50"
                    onClick={() => {
                      setSelectedCampaign(campaign.id);
                      loadCampaignDetails(campaign.id);
                    }}
                  >
                    <div>
                      <h3 className="font-semibold">{campaign.name}</h3>
                      <p className="text-sm text-muted-foreground">
                        {campaign.sent.toLocaleString()} sent
                      </p>
                    </div>
                    <div className="text-right">
                      <div className="flex space-x-2">
                        <Badge variant={getRateBadge(openRate)}>
                          {openRate.toFixed(1)}% open
                        </Badge>
                        <Badge variant={getRateBadge(clickRate)}>
                          {clickRate.toFixed(1)}% click
                        </Badge>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Campaign Details */}
        {selectedCampaign && (
          <Card>
            <CardHeader>
              <CardTitle>Campaign Details</CardTitle>
              <CardDescription>
                Detailed analytics for {campaigns.find(c => c.id === selectedCampaign)?.name}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {campaignDetails ? (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-muted-foreground">Total Sent</p>
                      <p className="text-2xl font-bold">{campaignDetails.totalSent}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Delivered</p>
                      <p className="text-2xl font-bold">{campaignDetails.totalDelivered}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Opened</p>
                      <p className="text-2xl font-bold">{campaignDetails.totalOpened}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Clicked</p>
                      <p className="text-2xl font-bold">{campaignDetails.totalClicked}</p>
                    </div>
                  </div>
                  
                  <div className="pt-4 border-t">
                    <div className="flex justify-between items-center">
                      <span>Open Rate</span>
                      <Badge variant={getRateBadge(campaignDetails.openRate)}>
                        {campaignDetails.openRate.toFixed(1)}%
                      </Badge>
                    </div>
                    <div className="flex justify-between items-center">
                      <span>Click Rate</span>
                      <Badge variant={getRateBadge(campaignDetails.clickRate)}>
                        {campaignDetails.clickRate.toFixed(1)}%
                      </Badge>
                    </div>
                    <div className="flex justify-between items-center">
                      <span>Bounce Rate</span>
                      <Badge variant={getRateBadge(100 - campaignDetails.bounceRate)}>
                        {campaignDetails.bounceRate.toFixed(1)}%
                      </Badge>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center text-muted-foreground py-8">
                  {isLoading ? 'Loading details...' : 'Select a campaign to view details'}
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
{{/if}}`
    },
    {
      type: 'CREATE_FILE',
      path: 'src/app/api/email/track/opened/route.ts',
      content: `{{#if module.parameters.track-opens}}
import { NextRequest, NextResponse } from 'next/server';
import { AnalyticsManager } from '@/lib/email/analytics/analytics-manager';
import { resend } from '@/lib/email/config';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const emailId = searchParams.get('emailId');
    const recipient = searchParams.get('recipient');
    const userAgent = request.headers.get('user-agent');

    if (!emailId || !recipient) {
      return NextResponse.json({ error: 'Missing required parameters' }, { status: 400 });
    }

    const analyticsManager = new AnalyticsManager(resend);
    await analyticsManager.trackEmailOpened(emailId, recipient, userAgent || undefined);

    // Return a 1x1 transparent pixel
    const pixel = Buffer.from(
      'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==',
      'base64'
    );

    return new NextResponse(pixel, {
      status: 200,
      headers: {
        'Content-Type': 'image/png',
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0',
      },
    });
  } catch (error) {
    console.error('Error tracking email open:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
{{/if}}`
    },
    {
      type: 'CREATE_FILE',
      path: 'src/app/api/email/track/clicked/route.ts',
      content: `{{#if module.parameters.track-clicks}}
import { NextRequest, NextResponse } from 'next/server';
import { AnalyticsManager } from '@/lib/email/analytics/analytics-manager';
import { resend } from '@/lib/email/config';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const emailId = searchParams.get('emailId');
    const recipient = searchParams.get('recipient');
    const linkUrl = searchParams.get('url');

    if (!emailId || !recipient || !linkUrl) {
      return NextResponse.json({ error: 'Missing required parameters' }, { status: 400 });
    }

    const analyticsManager = new AnalyticsManager(resend);
    await analyticsManager.trackEmailClicked(emailId, recipient, linkUrl);

    // Redirect to the original URL
    return NextResponse.redirect(linkUrl);
  } catch (error) {
    console.error('Error tracking email click:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
{{/if}}`
    }
  ]
};
export default analyticsBlueprint;
