/**
 * Sequelize Query Optimization Feature Blueprint
 * 
 * Advanced query building and optimization tools
 */

import { Blueprint } from '../../../../types/adapter.js';

const queryOptimizationBlueprint: Blueprint = {
  id: 'sequelize-query-optimization',
  name: 'Query Optimization',
  actions: [
    {
      type: 'CREATE_FILE',
      path: 'src/lib/database/query-optimizer.ts',
      content: `import { Sequelize, QueryTypes, Transaction } from 'sequelize';
import sequelize from '../config.js';

export interface QueryMetrics {
  query: string;
  duration: number;
  timestamp: Date;
  type: 'SELECT' | 'INSERT' | 'UPDATE' | 'DELETE';
  table?: string;
  rowsAffected?: number;
}

export interface PerformanceStats {
  totalQueries: number;
  averageDuration: number;
  slowestQuery: QueryMetrics | null;
  queriesByType: Record<string, number>;
  queriesByTable: Record<string, number>;
}

export class QueryOptimizer {
  private sequelize: Sequelize;
  private queryLog: QueryMetrics[] = [];
  private slowQueryThreshold: number = 1000; // 1 second

  constructor(sequelizeInstance?: Sequelize) {
    this.sequelize = sequelizeInstance || sequelize;
    this.setupQueryLogging();
  }

  /**
   * Setup query logging and monitoring
   */
  private setupQueryLogging() {
    this.sequelize.addHook('beforeQuery', (options) => {
      options.startTime = Date.now();
    });

    this.sequelize.addHook('afterQuery', (options) => {
      const duration = Date.now() - (options.startTime || 0);
      const query = options.sql || '';
      const type = this.extractQueryType(query);
      const table = this.extractTableName(query);

      const metrics: QueryMetrics = {
        query: query.substring(0, 200), // Truncate for storage
        duration,
        timestamp: new Date(),
        type,
        table,
        rowsAffected: options.affectedRows
      };

      this.queryLog.push(metrics);

      // Log slow queries
      if (duration > this.slowQueryThreshold) {
        console.warn('🐌 Slow query detected:', {
          duration: duration + 'ms',
          query: query.substring(0, 100) + '...',
          table
        });
      }

      // Keep only last 1000 queries in memory
      if (this.queryLog.length > 1000) {
        this.queryLog = this.queryLog.slice(-1000);
      }
    });
  }

  /**
   * Extract query type from SQL
   */
  private extractQueryType(query: string): QueryMetrics['type'] {
    const upperQuery = query.toUpperCase().trim();
    if (upperQuery.startsWith('SELECT')) return 'SELECT';
    if (upperQuery.startsWith('INSERT')) return 'INSERT';
    if (upperQuery.startsWith('UPDATE')) return 'UPDATE';
    if (upperQuery.startsWith('DELETE')) return 'DELETE';
    return 'SELECT';
  }

  /**
   * Extract table name from SQL
   */
  private extractTableName(query: string): string | undefined {
    const match = query.match(/FROM\\s+([a-zA-Z_][a-zA-Z0-9_]*)/i);
    return match ? match[1] : undefined;
  }

  /**
   * Get performance statistics
   */
  getPerformanceStats(): PerformanceStats {
    const totalQueries = this.queryLog.length;
    const totalDuration = this.queryLog.reduce((sum, q) => sum + q.duration, 0);
    const averageDuration = totalQueries > 0 ? totalDuration / totalQueries : 0;

    const slowestQuery = this.queryLog.reduce((slowest, current) => 
      current.duration > (slowest?.duration || 0) ? current : slowest, 
      null as QueryMetrics | null
    );

    const queriesByType = this.queryLog.reduce((acc, query) => {
      acc[query.type] = (acc[query.type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const queriesByTable = this.queryLog.reduce((acc, query) => {
      if (query.table) {
        acc[query.table] = (acc[query.table] || 0) + 1;
      }
      return acc;
    }, {} as Record<string, number>);

    return {
      totalQueries,
      averageDuration,
      slowestQuery,
      queriesByType,
      queriesByTable
    };
  }

  /**
   * Get slow queries
   */
  getSlowQueries(threshold?: number): QueryMetrics[] {
    const limit = threshold || this.slowQueryThreshold;
    return this.queryLog.filter(query => query.duration > limit);
  }

  /**
   * Clear query log
   */
  clearQueryLog(): void {
    this.queryLog = [];
  }

  /**
   * Set slow query threshold
   */
  setSlowQueryThreshold(threshold: number): void {
    this.slowQueryThreshold = threshold;
  }

  /**
   * Analyze query performance
   */
  async analyzeQuery(sql: string, replacements?: any): Promise<{
    executionPlan: any;
    duration: number;
    rowsAffected: number;
  }> {
    const startTime = Date.now();
    
    try {
      // Get execution plan (PostgreSQL specific)
      const explainQuery = \`EXPLAIN (ANALYZE, BUFFERS, FORMAT JSON) \${sql}\`;
      const [results] = await this.sequelize.query(explainQuery, {
        replacements,
        type: QueryTypes.SELECT
      });

      const duration = Date.now() - startTime;
      const executionPlan = results[0]?.['QUERY PLAN'] || results[0];

      return {
        executionPlan,
        duration,
        rowsAffected: executionPlan?.['Plan']?.['Actual Rows'] || 0
      };
    } catch (error) {
      console.error('Error analyzing query:', error);
      throw error;
    }
  }

  /**
   * Optimize query with indexes
   */
  async suggestIndexes(tableName: string): Promise<{
    suggestedIndexes: Array<{
      columns: string[];
      type: 'btree' | 'hash' | 'gin' | 'gist';
      reason: string;
    }>;
  }> {
    try {
      // Analyze table statistics
      const stats = await this.sequelize.query(
        \`SELECT * FROM pg_stat_user_tables WHERE relname = '\${tableName}'\`,
        { type: QueryTypes.SELECT }
      );

      // Get table columns
      const columns = await this.sequelize.query(
        \`SELECT column_name, data_type FROM information_schema.columns WHERE table_name = '\${tableName}'\`,
        { type: QueryTypes.SELECT }
      );

      // Get existing indexes
      const indexes = await this.sequelize.query(
        \`SELECT indexname, indexdef FROM pg_indexes WHERE tablename = '\${tableName}'\`,
        { type: QueryTypes.SELECT }
      );

      const suggestedIndexes: Array<{
        columns: string[];
        type: 'btree' | 'hash' | 'gin' | 'gist';
        reason: string;
      }> = [];

      // Suggest indexes based on common patterns
      columns.forEach((column: any) => {
        const columnName = column.column_name;
        
        // Suggest index for foreign keys
        if (columnName.endsWith('_id') || columnName.endsWith('Id')) {
          suggestedIndexes.push({
            columns: [columnName],
            type: 'btree',
            reason: 'Foreign key column - improves join performance'
          });
        }

        // Suggest index for commonly searched columns
        if (['email', 'username', 'slug', 'name'].includes(columnName)) {
          suggestedIndexes.push({
            columns: [columnName],
            type: 'btree',
            reason: 'Unique identifier column - improves lookup performance'
          });
        }

        // Suggest index for date columns
        if (columnName.includes('date') || columnName.includes('time') || columnName.includes('created') || columnName.includes('updated')) {
          suggestedIndexes.push({
            columns: [columnName],
            type: 'btree',
            reason: 'Date column - improves range queries and sorting'
          });
        }
      });

      return { suggestedIndexes };
    } catch (error) {
      console.error('Error suggesting indexes:', error);
      return { suggestedIndexes: [] };
    }
  }

  /**
   * Create index
   */
  async createIndex(
    tableName: string,
    columns: string[],
    options: {
      name?: string;
      unique?: boolean;
      type?: 'btree' | 'hash' | 'gin' | 'gist';
    } = {}
  ): Promise<void> {
    const indexName = options.name || \`idx_\${tableName}_\${columns.join('_')}\`;
    const unique = options.unique ? 'UNIQUE ' : '';
    const type = options.type || 'btree';
    
    const sql = \`CREATE \${unique}INDEX \${indexName} ON \${tableName} USING \${type} (\${columns.join(', ')})\`;
    
    try {
      await this.sequelize.query(sql);
      console.log('✅ Index created:', indexName);
    } catch (error) {
      console.error('❌ Error creating index:', error);
      throw error;
    }
  }

  /**
   * Drop index
   */
  async dropIndex(indexName: string): Promise<void> {
    const sql = \`DROP INDEX IF EXISTS \${indexName}\`;
    
    try {
      await this.sequelize.query(sql);
      console.log('✅ Index dropped:', indexName);
    } catch (error) {
      console.error('❌ Error dropping index:', error);
      throw error;
    }
  }

  /**
   * Get table statistics
   */
  async getTableStats(tableName: string): Promise<{
    rowCount: number;
    tableSize: string;
    indexSize: string;
    totalSize: string;
  }> {
    try {
      const [results] = await this.sequelize.query(
        \`SELECT 
          n_tup_ins + n_tup_upd + n_tup_del as row_count,
          pg_size_pretty(pg_total_relation_size('\${tableName}')) as total_size,
          pg_size_pretty(pg_relation_size('\${tableName}')) as table_size,
          pg_size_pretty(pg_total_relation_size('\${tableName}') - pg_relation_size('\${tableName}')) as index_size
        FROM pg_stat_user_tables 
        WHERE relname = '\${tableName}'\`,
        { type: QueryTypes.SELECT }
      );

      const stats = results[0] as any;
      return {
        rowCount: parseInt(stats.row_count) || 0,
        tableSize: stats.table_size || '0 bytes',
        indexSize: stats.index_size || '0 bytes',
        totalSize: stats.total_size || '0 bytes'
      };
    } catch (error) {
      console.error('Error getting table stats:', error);
      return {
        rowCount: 0,
        tableSize: '0 bytes',
        indexSize: '0 bytes',
        totalSize: '0 bytes'
      };
    }
  }

  /**
   * Vacuum and analyze table
   */
  async vacuumTable(tableName: string): Promise<void> {
    try {
      await this.sequelize.query(\`VACUUM ANALYZE \${tableName}\`);
      console.log('✅ Table vacuumed and analyzed:', tableName);
    } catch (error) {
      console.error('❌ Error vacuuming table:', error);
      throw error;
    }
  }
}

// Global query optimizer instance
export const queryOptimizer = new QueryOptimizer();`
    },
    {
      type: 'CREATE_FILE',
      path: 'src/lib/database/cache.ts',
      content: `import { Model, ModelCtor } from 'sequelize';

export interface CacheOptions {
  ttl?: number; // Time to live in seconds
  key?: string;
  tags?: string[];
}

export interface CacheStats {
  hits: number;
  misses: number;
  hitRate: number;
  totalRequests: number;
}

export class QueryCache {
  private cache = new Map<string, { data: any; expires: number; tags: string[] }>();
  private stats = { hits: 0, misses: 0, totalRequests: 0 };

  /**
   * Get cached data
   */
  get<T>(key: string): T | null {
    this.stats.totalRequests++;
    
    const cached = this.cache.get(key);
    if (!cached) {
      this.stats.misses++;
      return null;
    }

    if (Date.now() > cached.expires) {
      this.cache.delete(key);
      this.stats.misses++;
      return null;
    }

    this.stats.hits++;
    return cached.data;
  }

  /**
   * Set cached data
   */
  set<T>(key: string, data: T, options: CacheOptions = {}): void {
    const ttl = options.ttl || 300; // 5 minutes default
    const expires = Date.now() + (ttl * 1000);
    const tags = options.tags || [];

    this.cache.set(key, { data, expires, tags });
  }

  /**
   * Delete cached data
   */
  delete(key: string): boolean {
    return this.cache.delete(key);
  }

  /**
   * Clear cache by tags
   */
  clearByTags(tags: string[]): void {
    for (const [key, value] of this.cache.entries()) {
      if (tags.some(tag => value.tags.includes(tag))) {
        this.cache.delete(key);
      }
    }
  }

  /**
   * Clear all cache
   */
  clear(): void {
    this.cache.clear();
    this.stats = { hits: 0, misses: 0, totalRequests: 0 };
  }

  /**
   * Get cache statistics
   */
  getStats(): CacheStats {
    const hitRate = this.stats.totalRequests > 0 
      ? (this.stats.hits / this.stats.totalRequests) * 100 
      : 0;

    return {
      ...this.stats,
      hitRate: Math.round(hitRate * 100) / 100
    };
  }

  /**
   * Generate cache key
   */
  generateKey(model: string, method: string, params: any): string {
    const paramStr = JSON.stringify(params);
    return \`\${model}:\${method}:\${Buffer.from(paramStr).toString('base64')}\`;
  }
}

// Global cache instance
export const queryCache = new QueryCache();

/**
 * Cache decorator for model methods
 */
export function cached(options: CacheOptions = {}) {
  return function (target: any, propertyName: string, descriptor: PropertyDescriptor) {
    const method = descriptor.value;

    descriptor.value = async function (...args: any[]) {
      const modelName = target.constructor.name;
      const cacheKey = queryCache.generateKey(modelName, propertyName, args);
      
      // Try to get from cache
      const cached = queryCache.get(cacheKey);
      if (cached) {
        return cached;
      }

      // Execute method and cache result
      const result = await method.apply(this, args);
      queryCache.set(cacheKey, result, options);
      
      return result;
    };
  };
}

/**
 * Cache manager for Sequelize models
 */
export class ModelCache {
  private cache: QueryCache;

  constructor() {
    this.cache = new QueryCache();
  }

  /**
   * Cache model find operations
   */
  async findCached<T extends Model>(
    model: ModelCtor<T>,
    options: any,
    cacheOptions: CacheOptions = {}
  ): Promise<T | null> {
    const cacheKey = this.cache.generateKey(
      model.name,
      'findOne',
      options
    );

    const cached = this.cache.get<T>(cacheKey);
    if (cached) {
      return cached;
    }

    const result = await model.findOne(options);
    this.cache.set(cacheKey, result, cacheOptions);
    
    return result;
  }

  /**
   * Cache model findAll operations
   */
  async findAllCached<T extends Model>(
    model: ModelCtor<T>,
    options: any,
    cacheOptions: CacheOptions = {}
  ): Promise<T[]> {
    const cacheKey = this.cache.generateKey(
      model.name,
      'findAll',
      options
    );

    const cached = this.cache.get<T[]>(cacheKey);
    if (cached) {
      return cached;
    }

    const result = await model.findAll(options);
    this.cache.set(cacheKey, result, cacheOptions);
    
    return result;
  }

  /**
   * Cache model count operations
   */
  async countCached<T extends Model>(
    model: ModelCtor<T>,
    options: any,
    cacheOptions: CacheOptions = {}
  ): Promise<number> {
    const cacheKey = this.cache.generateKey(
      model.name,
      'count',
      options
    );

    const cached = this.cache.get<number>(cacheKey);
    if (cached) {
      return cached;
    }

    const result = await model.count(options);
    this.cache.set(cacheKey, result, cacheOptions);
    
    return result;
  }

  /**
   * Invalidate cache for a model
   */
  invalidateModel(modelName: string): void {
    // This is a simplified implementation
    // In production, you'd want more sophisticated cache invalidation
    this.cache.clear();
  }

  /**
   * Get cache statistics
   */
  getStats(): CacheStats {
    return this.cache.getStats();
  }
}

// Global model cache instance
export const modelCache = new ModelCache();`
    }
  ]
};
export default queryOptimizationBlueprint;
