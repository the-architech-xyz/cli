'use client';

import { useState } from 'react';
import { format } from 'date-fns';
import { useEmails, useEmailAnalytics } from '@/lib/emailing';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  Mail, 
  Search, 
  Filter, 
  Calendar, 
  Eye, 
  MousePointer, 
  AlertCircle,
  CheckCircle,
  Clock,
  XCircle,
  Loader2,
  RefreshCw
} from 'lucide-react';
import type { EmailListFilters, EmailStatus } from '@/lib/emailing';

const statusConfig: Record<EmailStatus, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
  draft: { label: 'Draft', variant: 'outline' },
  sending: { label: 'Sending', variant: 'secondary' },
  sent: { label: 'Sent', variant: 'default' },
  delivered: { label: 'Delivered', variant: 'default' },
  opened: { label: 'Opened', variant: 'default' },
  clicked: { label: 'Clicked', variant: 'default' },
  bounced: { label: 'Bounced', variant: 'destructive' },
  failed: { label: 'Failed', variant: 'destructive' },
  scheduled: { label: 'Scheduled', variant: 'outline' },
};

const statusIcons: Record<EmailStatus, React.ComponentType<{ className?: string }>> = {
  draft: Clock,
  sending: Loader2,
  sent: CheckCircle,
  delivered: CheckCircle,
  opened: Eye,
  clicked: MousePointer,
  bounced: XCircle,
  failed: AlertCircle,
  scheduled: Clock,
};

interface EmailListProps {
  className?: string;
}

export function EmailList({ className }: EmailListProps) {
  const [filters, setFilters] = useState<EmailListFilters>({});
  const [searchTerm, setSearchTerm] = useState('');

  const { emails, isLoading, error, refetch, hasMore, loadMore } = useEmails(filters);
  const { analytics } = useEmailAnalytics();

  const handleStatusFilter = (status: string) => {
    setFilters(prev => ({
      ...prev,
      status: status === 'all' ? undefined : status as EmailStatus,
    }));
  };

  const handleSearch = (value: string) => {
    setSearchTerm(value);
    setFilters(prev => ({
      ...prev,
      search: value || undefined,
    }));
  };

  const handleDateFilter = (range: string) => {
    const now = new Date();
    let dateFrom: Date | undefined;
    let dateTo: Date | undefined;

    switch (range) {
      case 'today':
        dateFrom = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        dateTo = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
        break;
      case 'week':
        dateFrom = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case 'month':
        dateFrom = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate());
        break;
      case 'all':
      default:
        dateFrom = undefined;
        dateTo = undefined;
        break;
    }

    setFilters(prev => ({
      ...prev,
      dateFrom,
      dateTo,
    }));
  };

  if (error) {
    return (
      <Card className={className}>
        <CardContent className="p-6">
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Failed to load emails. Please try again.
            </AlertDescription>
          </Alert>
          <Button onClick={() => refetch()} className="mt-4">
            <RefreshCw className="h-4 w-4 mr-2" />
            Retry
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Mail className="h-5 w-5" />
              Email List
            </CardTitle>
            <CardDescription>
              Manage and monitor your email campaigns
            </CardDescription>
          </div>
          <Button onClick={() => refetch()} variant="outline" size="sm">
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>
      </CardHeader>

      <CardContent>
        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                placeholder="Search emails..."
                value={searchTerm}
                onChange={(e) => handleSearch(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
          
          <div className="flex gap-2">
            <Select onValueChange={handleStatusFilter}>
              <SelectTrigger className="w-[140px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                {Object.entries(statusConfig).map(([status, config]) => (
                  <SelectItem key={status} value={status}>
                    {config.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select onValueChange={handleDateFilter}>
              <SelectTrigger className="w-[140px]">
                <SelectValue placeholder="Date Range" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Time</SelectItem>
                <SelectItem value="today">Today</SelectItem>
                <SelectItem value="week">Last 7 Days</SelectItem>
                <SelectItem value="month">Last Month</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Analytics Summary */}
        {analytics && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div className="text-center p-4 bg-muted rounded-lg">
              <div className="text-2xl font-bold">{analytics.totalSent}</div>
              <div className="text-sm text-muted-foreground">Total Sent</div>
            </div>
            <div className="text-center p-4 bg-muted rounded-lg">
              <div className="text-2xl font-bold">{analytics.openRate.toFixed(1)}%</div>
              <div className="text-sm text-muted-foreground">Open Rate</div>
            </div>
            <div className="text-center p-4 bg-muted rounded-lg">
              <div className="text-2xl font-bold">{analytics.clickRate.toFixed(1)}%</div>
              <div className="text-sm text-muted-foreground">Click Rate</div>
            </div>
            <div className="text-center p-4 bg-muted rounded-lg">
              <div className="text-2xl font-bold">{analytics.bounceRate.toFixed(1)}%</div>
              <div className="text-sm text-muted-foreground">Bounce Rate</div>
            </div>
          </div>
        )}

        {/* Email Table */}
        <div className="border rounded-lg">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Recipient</TableHead>
                <TableHead>Subject</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Sent At</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <TableRow key={i}>
                    <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-48" /></TableCell>
                    <TableCell><Skeleton className="h-6 w-16" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                    <TableCell><Skeleton className="h-8 w-16" /></TableCell>
                  </TableRow>
                ))
              ) : emails.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                    No emails found
                  </TableCell>
                </TableRow>
              ) : (
                emails.map((email) => {
                  const StatusIcon = statusIcons[email.status];
                  const statusConfig = statusConfig[email.status];

                  return (
                    <TableRow key={email.id}>
                      <TableCell className="font-medium">{email.to}</TableCell>
                      <TableCell className="max-w-[300px] truncate">{email.subject}</TableCell>
                      <TableCell>
                        <Badge variant={statusConfig.variant} className="flex items-center gap-1 w-fit">
                          <StatusIcon className="h-3 w-3" />
                          {statusConfig.label}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {email.sentAt ? format(new Date(email.sentAt), 'MMM d, yyyy HH:mm') : '-'}
                      </TableCell>
                      <TableCell>
                        <Button variant="ghost" size="sm">
                          View
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>

        {/* Load More */}
        {hasMore && (
          <div className="flex justify-center mt-4">
            <Button onClick={loadMore} variant="outline">
              Load More
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
