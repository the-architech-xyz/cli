/**
 * Webhook Handler Component
 * 
 * Simple webhook event display and management
 */

'use client';

import { useState } from 'react';
import { useWebhookEvents } from '@/lib/payments/hooks';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { CheckCircle, XCircle, Clock } from 'lucide-react';

export function WebhookHandler() {
  const { data: events, isLoading } = useWebhookEvents();
  const [selectedEvent, setSelectedEvent] = useState<any>(null);

  if (isLoading) {
    return <div>Loading webhook events...</div>;
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Webhook Events</CardTitle>
          <CardDescription>Recent webhook events from your payment provider</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {events?.map((event: any) => (
              <div
                key={event.id}
                className="flex items-center justify-between p-3 border rounded-lg hover:bg-accent cursor-pointer"
                onClick={() => setSelectedEvent(event)}
              >
                <div className="flex items-center gap-3">
                  {event.status === 'succeeded' && (
                    <CheckCircle className="h-4 w-4 text-green-500" />
                  )}
                  {event.status === 'failed' && (
                    <XCircle className="h-4 w-4 text-red-500" />
                  )}
                  {event.status === 'pending' && (
                    <Clock className="h-4 w-4 text-yellow-500" />
                  )}
                  
                  <div>
                    <p className="text-sm font-medium">{event.type}</p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(event.created).toLocaleString()}
                    </p>
                  </div>
                </div>
                
                <Badge variant={
                  event.status === 'succeeded' ? 'default' :
                  event.status === 'failed' ? 'destructive' :
                  'secondary'
                }>
                  {event.status}
                </Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {selectedEvent && (
        <Card>
          <CardHeader>
            <CardTitle>Event Details</CardTitle>
            <CardDescription>Raw event data</CardDescription>
          </CardHeader>
          <CardContent>
            <pre className="text-xs bg-muted p-4 rounded-lg overflow-auto">
              {JSON.stringify(selectedEvent, null, 2)}
            </pre>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
