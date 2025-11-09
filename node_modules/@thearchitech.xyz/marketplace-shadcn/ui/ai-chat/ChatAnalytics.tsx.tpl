'use client';

import React, { useState, useCallback, useMemo } from 'react';
import { cn } from '@/lib/utils';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  BarChart3, 
  TrendingUp, 
  TrendingDown, 
  MessageSquare, 
  Clock, 
  DollarSign,
  Users,
  Zap,
  RefreshCw,
  Download,
  Calendar,
  Target,
  Award,
  Activity,
  PieChart,
  LineChart,
  BarChart,
  ArrowUp,
  ArrowDown,
  Minus,
  Info
} from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ChatAnalytics, ConversationAnalytics, UsageStats } from '@/types/ai-chat';

export interface ChatAnalyticsProps {
  className?: string;
  analytics: ChatAnalytics;
  conversationAnalytics?: ConversationAnalytics;
  usageStats?: UsageStats;
  onRefresh?: () => void;
  onExport?: () => void;
  onTimeRangeChange?: (range: string) => void;
  timeRange?: '7d' | '30d' | '90d' | '1y' | 'all';
  showConversationDetails?: boolean;
  showUsageStats?: boolean;
  showCharts?: boolean;
  showTrends?: boolean;
  showComparisons?: boolean;
  showExport?: boolean;
  showRefresh?: boolean;
  isLoading?: boolean;
  error?: string | null;
}

export function ChatAnalytics({
  className,
  analytics,
  conversationAnalytics,
  usageStats,
  onRefresh,
  onExport,
  onTimeRangeChange,
  timeRange = '30d',
  showConversationDetails = true,
  showUsageStats = true,
  showCharts = true,
  showTrends = true,
  showComparisons = true,
  showExport = true,
  showRefresh = true,
  isLoading = false,
  error = null,
}: ChatAnalyticsProps) {
  const [selectedMetric, setSelectedMetric] = useState<string>('overview');
  const [chartType, setChartType] = useState<'line' | 'bar' | 'pie'>('line');

  // Calculate trends
  const trends = useMemo(() => {
    const chatGrowth = analytics.chatGrowth;
    const tokenUsage = analytics.tokenUsage;
    const costTrend = analytics.costTrend;

    const getTrend = (data: Array<{ date: string; count: number }>) => {
      if (data.length < 2) return { direction: 'stable', percentage: 0 };
      const latest = data[data.length - 1].count;
      const previous = data[data.length - 2].count;
      const percentage = ((latest - previous) / previous) * 100;
      return {
        direction: percentage > 0 ? 'up' : percentage < 0 ? 'down' : 'stable',
        percentage: Math.abs(percentage)
      };
    };

    return {
      chats: getTrend(chatGrowth),
      tokens: getTrend(tokenUsage),
      cost: getTrend(costTrend)
    };
  }, [analytics]);

  // Format number
  const formatNumber = (num: number): string => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toString();
  };

  // Format currency
  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 4
    }).format(amount);
  };

  // Format percentage
  const formatPercentage = (num: number): string => {
    return `${num.toFixed(1)}%`;
  };

  // Get trend icon
  const getTrendIcon = (direction: 'up' | 'down' | 'stable') => {
    switch (direction) {
      case 'up':
        return <ArrowUp className="h-4 w-4 text-green-500" />;
      case 'down':
        return <ArrowDown className="h-4 w-4 text-red-500" />;
      default:
        return <Minus className="h-4 w-4 text-gray-500" />;
    }
  };

  // Get trend color
  const getTrendColor = (direction: 'up' | 'down' | 'stable') => {
    switch (direction) {
      case 'up':
        return 'text-green-600';
      case 'down':
        return 'text-red-600';
      default:
        return 'text-gray-600';
    }
  };

  // Render metric card
  const renderMetricCard = (
    title: string,
    value: string | number,
    subtitle?: string,
    trend?: { direction: 'up' | 'down' | 'stable'; percentage: number },
    icon?: React.ReactNode
  ) => (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-muted-foreground">{title}</p>
            <p className="text-2xl font-bold">{value}</p>
            {subtitle && (
              <p className="text-xs text-muted-foreground">{subtitle}</p>
            )}
          </div>
          {icon && (
            <div className="text-muted-foreground">{icon}</div>
          )}
        </div>
        {trend && (
          <div className="flex items-center gap-1 mt-2">
            {getTrendIcon(trend.direction)}
            <span className={cn('text-xs font-medium', getTrendColor(trend.direction))}>
              {formatPercentage(trend.percentage)}
            </span>
            <span className="text-xs text-muted-foreground">vs last period</span>
          </div>
        )}
      </CardContent>
    </Card>
  );

  // Render usage progress
  const renderUsageProgress = (
    label: string,
    used: number,
    limit: number,
    unit: string = ''
  ) => {
    const percentage = (used / limit) * 100;
    const isOverLimit = used > limit;
    
    return (
      <div className="space-y-2">
        <div className="flex items-center justify-between text-sm">
          <span>{label}</span>
          <span className={cn(isOverLimit && 'text-red-600')}>
            {formatNumber(used)} / {formatNumber(limit)} {unit}
          </span>
        </div>
        <Progress 
          value={Math.min(percentage, 100)} 
          className={cn('h-2', isOverLimit && 'bg-red-100')}
        />
        {isOverLimit && (
          <p className="text-xs text-red-600">Over limit by {formatNumber(used - limit)} {unit}</p>
        )}
      </div>
    );
  };

  // Render chart placeholder
  const renderChart = (title: string, data: any[], type: 'line' | 'bar' | 'pie' = 'line') => (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-64 flex items-center justify-center text-muted-foreground">
          <div className="text-center">
            <BarChart3 className="h-12 w-12 mx-auto mb-2" />
            <p className="text-sm">Chart visualization would go here</p>
            <p className="text-xs">Data points: {data.length}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className={cn('space-y-6', className)}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold">Analytics</h2>
          <p className="text-sm text-muted-foreground">
            Insights into your chat usage and performance
          </p>
        </div>
        <div className="flex items-center gap-2">
          {showRefresh && (
            <Button
              variant="outline"
              size="sm"
              onClick={onRefresh}
              disabled={isLoading}
            >
              <RefreshCw className={cn('h-4 w-4 mr-2', isLoading && 'animate-spin')} />
              Refresh
            </Button>
          )}
          {showExport && (
            <Button
              variant="outline"
              size="sm"
              onClick={onExport}
            >
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
          )}
        </div>
      </div>

      {/* Time Range Selector */}
      <div className="flex items-center gap-4">
        <Select value={timeRange} onValueChange={onTimeRangeChange}>
          <SelectTrigger className="w-32">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="7d">Last 7 days</SelectItem>
            <SelectItem value="30d">Last 30 days</SelectItem>
            <SelectItem value="90d">Last 90 days</SelectItem>
            <SelectItem value="1y">Last year</SelectItem>
            <SelectItem value="all">All time</SelectItem>
          </SelectContent>
        </Select>
        
        <div className="flex items-center gap-2">
          <Select value={chartType} onValueChange={(value: 'line' | 'bar' | 'pie') => setChartType(value)}>
            <SelectTrigger className="w-24">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="line">Line</SelectItem>
              <SelectItem value="bar">Bar</SelectItem>
              <SelectItem value="pie">Pie</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Error State */}
      {error && (
        <Card className="border-red-200">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-red-700">
              <Info className="h-4 w-4" />
              <span className="text-sm">{error}</span>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Overview Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {renderMetricCard(
          'Total Chats',
          analytics.totalChats,
          'conversations',
          trends.chats,
          <MessageSquare className="h-5 w-5" />
        )}
        
        {renderMetricCard(
          'Total Messages',
          analytics.totalMessages,
          'messages sent',
          trends.chats,
          <MessageSquare className="h-5 w-5" />
        )}
        
        {renderMetricCard(
          'Total Tokens',
          formatNumber(analytics.totalTokens),
          'tokens used',
          trends.tokens,
          <Zap className="h-5 w-5" />
        )}
        
        {renderMetricCard(
          'Total Cost',
          formatCurrency(analytics.totalCost),
          'spent',
          trends.cost,
          <DollarSign className="h-5 w-5" />
        )}
      </div>

      {/* Usage Stats */}
      {showUsageStats && usageStats && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Usage Limits</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <h4 className="text-sm font-medium mb-3">Daily Usage</h4>
                <div className="space-y-3">
                  {renderUsageProgress(
                    'Chats',
                    usageStats.usage.dailyChats,
                    usageStats.limits.dailyChats
                  )}
                  {renderUsageProgress(
                    'Messages',
                    usageStats.usage.dailyMessages,
                    usageStats.limits.dailyMessages
                  )}
                  {renderUsageProgress(
                    'Tokens',
                    usageStats.usage.dailyTokens,
                    usageStats.limits.dailyTokens
                  )}
                  {renderUsageProgress(
                    'Cost',
                    usageStats.usage.dailyCost,
                    usageStats.limits.dailyCost,
                    'USD'
                  )}
                </div>
              </div>
              
              <div>
                <h4 className="text-sm font-medium mb-3">Weekly Usage</h4>
                <div className="space-y-3">
                  {renderUsageProgress(
                    'Chats',
                    usageStats.weekly.chats,
                    usageStats.limits.dailyChats * 7
                  )}
                  {renderUsageProgress(
                    'Messages',
                    usageStats.weekly.messages,
                    usageStats.limits.dailyMessages * 7
                  )}
                  {renderUsageProgress(
                    'Tokens',
                    usageStats.weekly.tokens,
                    usageStats.limits.dailyTokens * 7
                  )}
                  {renderUsageProgress(
                    'Cost',
                    usageStats.weekly.cost,
                    usageStats.limits.dailyCost * 7,
                    'USD'
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Charts */}
      {showCharts && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {renderChart('Chat Growth', analytics.chatGrowth, chartType)}
          {renderChart('Token Usage', analytics.tokenUsage, chartType)}
          {renderChart('Cost Trend', analytics.costTrend, chartType)}
        </div>
      )}

      {/* Conversation Details */}
      {showConversationDetails && conversationAnalytics && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Conversation Performance</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold">{conversationAnalytics.messageCount}</div>
                <div className="text-sm text-muted-foreground">Messages</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold">{conversationAnalytics.averageResponseTime}ms</div>
                <div className="text-sm text-muted-foreground">Avg Response Time</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold">{conversationAnalytics.userSatisfaction}/10</div>
                <div className="text-sm text-muted-foreground">User Satisfaction</div>
              </div>
            </div>
            
            {conversationAnalytics.topics.length > 0 && (
              <div className="mt-4">
                <h4 className="text-sm font-medium mb-2">Topics Discussed</h4>
                <div className="flex flex-wrap gap-1">
                  {conversationAnalytics.topics.map((topic, index) => (
                    <Badge key={index} variant="secondary" className="text-xs">
                      {topic}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Performance Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {renderMetricCard(
          'Avg Messages per Chat',
          analytics.averageMessagesPerChat.toFixed(1),
          'messages',
          undefined,
          <Target className="h-5 w-5" />
        )}
        
        {renderMetricCard(
          'Avg Tokens per Message',
          analytics.averageTokensPerMessage.toFixed(0),
          'tokens',
          undefined,
          <Activity className="h-5 w-5" />
        )}
        
        {renderMetricCard(
          'Most Used Model',
          analytics.mostUsedModel,
          'primary model',
          undefined,
          <Award className="h-5 w-5" />
        )}
      </div>
    </div>
  );
}

export default ChatAnalytics;
