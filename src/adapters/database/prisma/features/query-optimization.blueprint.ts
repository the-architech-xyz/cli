/**
 * Prisma Query Optimization Feature
 * 
 * Adds advanced query building and optimization tools
 */

import { Blueprint } from '../../../../types/adapter.js';

const queryOptimizationBlueprint: Blueprint = {
  id: 'prisma-query-optimization',
  name: 'Prisma Query Optimization',
  actions: [
    {
      type: 'CREATE_FILE',
      path: 'src/lib/db/query-optimizer.ts',
      content: `import { PrismaClient } from '@prisma/client';

// Query optimization utilities
export class QueryOptimizer {
  private prisma: PrismaClient;
  private queryLog: Array<{
    query: string;
    duration: number;
    timestamp: Date;
    params: any;
  }> = [];

  constructor(prisma: PrismaClient) {
    this.prisma = prisma;
    this.setupQueryLogging();
  }

  private setupQueryLogging() {
    {{#if module.parameters.query-logging}}
    this.prisma.$on('query', (e) => {
      this.queryLog.push({
        query: e.query,
        duration: e.duration,
        timestamp: new Date(),
        params: e.params,
      });
    });
    {{/if}}
  }

  // Query performance monitoring
  async measureQuery<T>(queryName: string, queryFn: () => Promise<T>): Promise<{
    result: T;
    duration: number;
    performance: 'fast' | 'medium' | 'slow';
  }> {
    const start = Date.now();
    const result = await queryFn();
    const duration = Date.now() - start;

    const performance = duration < 100 ? 'fast' : duration < 500 ? 'medium' : 'slow';

    {{#if module.parameters.performance-monitoring}}
    console.log('Query Performance:', {
      name: queryName,
      duration: duration + 'ms',
      performance,
    });
    {{/if}}

    return { result, duration, performance };
  }

  // Optimized query builders
  async findManyOptimized<T>(
    model: string,
    options: {
      where?: any;
      include?: any;
      select?: any;
      orderBy?: any;
      take?: number;
      skip?: number;
    }
  ): Promise<T[]> {
    return this.measureQuery('findManyOptimized', async () => {
      const queryOptions: any = {};

      if (options.where) queryOptions.where = options.where;
      if (options.include) queryOptions.include = options.include;
      if (options.select) queryOptions.select = options.select;
      if (options.orderBy) queryOptions.orderBy = options.orderBy;
      if (options.take) queryOptions.take = options.take;
      if (options.skip) queryOptions.skip = options.skip;

      return (this.prisma as any)[model].findMany(queryOptions);
    });
  }

  async findUniqueOptimized<T>(
    model: string,
    where: any,
    include?: any
  ): Promise<T | null> {
    return this.measureQuery('findUniqueOptimized', async () => {
      const queryOptions: any = { where };
      if (include) queryOptions.include = include;

      return (this.prisma as any)[model].findUnique(queryOptions);
    });
  }

  async createOptimized<T>(
    model: string,
    data: any,
    include?: any
  ): Promise<T> {
    return this.measureQuery('createOptimized', async () => {
      const queryOptions: any = { data };
      if (include) queryOptions.include = include;

      return (this.prisma as any)[model].create(queryOptions);
    });
  }

  async updateOptimized<T>(
    model: string,
    where: any,
    data: any,
    include?: any
  ): Promise<T> {
    return this.measureQuery('updateOptimized', async () => {
      const queryOptions: any = { where, data };
      if (include) queryOptions.include = include;

      return (this.prisma as any)[model].update(queryOptions);
    });
  }

  async deleteOptimized<T>(
    model: string,
    where: any
  ): Promise<T> {
    return this.measureQuery('deleteOptimized', async () => {
      return (this.prisma as any)[model].delete({ where });
    });
  }

  // Batch operations
  async createManyOptimized(
    model: string,
    data: any[]
  ): Promise<{ count: number }> {
    return this.measureQuery('createManyOptimized', async () => {
      return (this.prisma as any)[model].createMany({ data });
    });
  }

  async updateManyOptimized(
    model: string,
    where: any,
    data: any
  ): Promise<{ count: number }> {
    return this.measureQuery('updateManyOptimized', async () => {
      return (this.prisma as any)[model].updateMany({ where, data });
    });
  }

  async deleteManyOptimized(
    model: string,
    where: any
  ): Promise<{ count: number }> {
    return this.measureQuery('deleteManyOptimized', async () => {
      return (this.prisma as any)[model].deleteMany({ where });
    });
  }

  // Transaction helpers
  async transactionOptimized<T>(
    operations: (tx: PrismaClient) => Promise<T>
  ): Promise<T> {
    return this.measureQuery('transactionOptimized', async () => {
      return this.prisma.$transaction(operations);
    });
  }

  // Query analysis
  getQueryStats(): {
    totalQueries: number;
    averageDuration: number;
    slowQueries: number;
    fastQueries: number;
    mediumQueries: number;
  } {
    const totalQueries = this.queryLog.length;
    const averageDuration = totalQueries > 0 
      ? this.queryLog.reduce((sum, log) => sum + log.duration, 0) / totalQueries 
      : 0;
    
    const slowQueries = this.queryLog.filter(log => log.duration > 500).length;
    const mediumQueries = this.queryLog.filter(log => log.duration >= 100 && log.duration <= 500).length;
    const fastQueries = this.queryLog.filter(log => log.duration < 100).length;

    return {
      totalQueries,
      averageDuration,
      slowQueries,
      fastQueries,
      mediumQueries,
    };
  }

  getSlowQueries(threshold: number = 500): Array<{
    query: string;
    duration: number;
    timestamp: Date;
  }> {
    return this.queryLog
      .filter(log => log.duration > threshold)
      .map(log => ({
        query: log.query,
        duration: log.duration,
        timestamp: log.timestamp,
      }))
      .sort((a, b) => b.duration - a.duration);
  }

  clearQueryLog(): void {
    this.queryLog = [];
  }

  // Connection management
  async connect(): Promise<void> {
    await this.prisma.$connect();
  }

  async disconnect(): Promise<void> {
    await this.prisma.$disconnect();
  }

  // Health check
  async healthCheck(): Promise<{
    isConnected: boolean;
    responseTime: number;
    error?: string;
  }> {
    try {
      const start = Date.now();
      await this.prisma.$queryRaw\`SELECT 1\`;
      const responseTime = Date.now() - start;

      return {
        isConnected: true,
        responseTime,
      };
    } catch (error) {
      return {
        isConnected: false,
        responseTime: 0,
        error: (error as Error).message,
      };
    }
  }
}`
    },
    {
      type: 'CREATE_FILE',
      path: 'src/components/database/query-dashboard.tsx',
      content: `'use client';

import React, { useState, useEffect } from 'react';
import { QueryOptimizer } from '@/lib/db/query-optimizer';
import { prisma } from '@/lib/db/prisma';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

export function QueryDashboard() {
  const [queryOptimizer] = useState(() => new QueryOptimizer(prisma));
  const [stats, setStats] = useState<any>(null);
  const [slowQueries, setSlowQueries] = useState<any[]>([]);
  const [healthStatus, setHealthStatus] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    loadStats();
    loadHealthStatus();
  }, []);

  const loadStats = () => {
    const queryStats = queryOptimizer.getQueryStats();
    setStats(queryStats);
    
    const slow = queryOptimizer.getSlowQueries();
    setSlowQueries(slow);
  };

  const loadHealthStatus = async () => {
    setIsLoading(true);
    try {
      const health = await queryOptimizer.healthCheck();
      setHealthStatus(health);
    } catch (error) {
      console.error('Failed to check health:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const clearLogs = () => {
    queryOptimizer.clearQueryLog();
    loadStats();
  };

  const testQuery = async () => {
    setIsLoading(true);
    try {
      // Simulate a test query
      await queryOptimizer.measureQuery('test-query', async () => {
        // Simulate database operation
        await new Promise(resolve => setTimeout(resolve, Math.random() * 1000));
        return { success: true };
      });
      loadStats();
    } catch (error) {
      console.error('Test query failed:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getPerformanceColor = (performance: string) => {
    switch (performance) {
      case 'fast': return 'text-green-600';
      case 'medium': return 'text-yellow-600';
      case 'slow': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  const getPerformanceBadge = (performance: string) => {
    switch (performance) {
      case 'fast': return 'default';
      case 'medium': return 'secondary';
      case 'slow': return 'destructive';
      default: return 'outline';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Query Optimization</h1>
          <p className="text-muted-foreground">
            Monitor and optimize your database queries
          </p>
        </div>
        <div className="flex space-x-2">
          <Button onClick={testQuery} disabled={isLoading}>
            Test Query
          </Button>
          <Button onClick={clearLogs} variant="outline">
            Clear Logs
          </Button>
        </div>
      </div>

      {/* Health Status */}
      <Card>
        <CardHeader>
          <CardTitle>Database Health</CardTitle>
          <CardDescription>Current database connection status</CardDescription>
        </CardHeader>
        <CardContent>
          {healthStatus ? (
            <div className="flex items-center space-x-4">
              <Badge variant={healthStatus.isConnected ? 'default' : 'destructive'}>
                {healthStatus.isConnected ? 'Connected' : 'Disconnected'}
              </Badge>
              <span className="text-sm text-muted-foreground">
                Response time: {healthStatus.responseTime}ms
              </span>
              {healthStatus.error && (
                <span className="text-sm text-red-600">
                  Error: {healthStatus.error}
                </span>
              )}
            </div>
          ) : (
            <div className="text-sm text-muted-foreground">
              {isLoading ? 'Checking health...' : 'Health status not available'}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Query Statistics */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Queries</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalQueries}</div>
              <p className="text-xs text-muted-foreground">
                Queries executed
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Average Duration</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {stats.averageDuration.toFixed(1)}ms
              </div>
              <p className="text-xs text-muted-foreground">
                Mean response time
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Fast Queries</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                {stats.fastQueries}
              </div>
              <p className="text-xs text-muted-foreground">
                &lt; 100ms
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Slow Queries</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">
                {stats.slowQueries}
              </div>
              <p className="text-xs text-muted-foreground">
                &gt; 500ms
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Slow Queries */}
      <Card>
        <CardHeader>
          <CardTitle>Slow Queries</CardTitle>
          <CardDescription>Queries that took longer than 500ms</CardDescription>
        </CardHeader>
        <CardContent>
          {slowQueries.length > 0 ? (
            <div className="space-y-4">
              {slowQueries.slice(0, 10).map((query, index) => (
                <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex-1">
                    <div className="font-mono text-sm bg-gray-100 p-2 rounded">
                      {query.query.length > 100 
                        ? query.query.substring(0, 100) + '...' 
                        : query.query
                      }
                    </div>
                    <div className="text-xs text-muted-foreground mt-1">
                      {query.timestamp.toLocaleString()}
                    </div>
                  </div>
                  <div className="ml-4">
                    <Badge variant="destructive">
                      {query.duration}ms
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center text-muted-foreground py-8">
              No slow queries detected. Great performance!
            </div>
          )}
        </CardContent>
      </Card>

      {/* Optimization Tips */}
      <Card>
        <CardHeader>
          <CardTitle>Query Optimization Tips</CardTitle>
          <CardDescription>Best practices for database performance</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="flex items-center space-x-2">
              <Badge variant="default">Tip</Badge>
              <span>Use select to fetch only needed fields</span>
            </div>
            <div className="flex items-center space-x-2">
              <Badge variant="default">Tip</Badge>
              <span>Add database indexes for frequently queried fields</span>
            </div>
            <div className="flex items-center space-x-2">
              <Badge variant="default">Tip</Badge>
              <span>Use pagination (take/skip) for large result sets</span>
            </div>
            <div className="flex items-center space-x-2">
              <Badge variant="default">Tip</Badge>
              <span>Consider using transactions for related operations</span>
            </div>
            <div className="flex items-center space-x-2">
              <Badge variant="default">Tip</Badge>
              <span>Monitor and optimize slow queries regularly</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}`
    }
  ]
};
export default queryOptimizationBlueprint;
