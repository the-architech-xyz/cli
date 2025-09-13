/**
 * TypeORM Query Builder Feature
 * 
 * Adds advanced query building and optimization tools
 */

import { Blueprint } from '../../../../types/adapter.js';

const queryBuilderBlueprint: Blueprint = {
  id: 'typeorm-query-builder',
  name: 'TypeORM Query Builder',
  actions: [
    {
      type: 'CREATE_FILE',
      path: 'src/lib/db/query-builder.ts',
      content: `import { DataSource, SelectQueryBuilder, QueryRunner } from 'typeorm';

// Query builder utilities
export class QueryBuilder {
  private dataSource: DataSource;
  private queryLog: Array<{
    query: string;
    duration: number;
    timestamp: Date;
  }> = [];

  constructor(dataSource: DataSource) {
    this.dataSource = dataSource;
  }

  // Advanced query building
  createQueryBuilder<T>(entity: string, alias: string): SelectQueryBuilder<T> {
    return this.dataSource.createQueryBuilder(entity, alias);
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
    this.queryLog.push({
      query: queryName,
      duration,
      timestamp: new Date(),
    });

    console.log('Query Performance:', {
      name: queryName,
      duration: duration + 'ms',
      performance,
    });
    {{/if}}

    return { result, duration, performance };
  }

  // Optimized queries
  async findWithRelations<T>(
    entity: string,
    relations: string[],
    where?: any
  ): Promise<T[]> {
    return this.measureQuery('findWithRelations', async () => {
      const queryBuilder = this.createQueryBuilder(entity, 'entity');
      
      relations.forEach(relation => {
        queryBuilder.leftJoinAndSelect('entity.' + relation, relation);
      });
      
      if (where) {
        queryBuilder.where(where);
      }
      
      return queryBuilder.getMany();
    });
  }

  async paginate<T>(
    entity: string,
    page: number = 1,
    limit: number = 10,
    where?: any
  ): Promise<{
    data: T[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    return this.measureQuery('paginate', async () => {
      const queryBuilder = this.createQueryBuilder(entity, 'entity');
      
      if (where) {
        queryBuilder.where(where);
      }
      
      const [data, total] = await queryBuilder
        .skip((page - 1) * limit)
        .take(limit)
        .getManyAndCount();
      
      return {
        data,
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      };
    });
  }

  {{#if module.parameters.query-caching}}
  async findWithCache<T>(
    entity: string,
    cacheKey: string,
    where?: any,
    ttl: number = 300
  ): Promise<T[]> {
    return this.measureQuery('findWithCache', async () => {
      const queryBuilder = this.createQueryBuilder(entity, 'entity');
      
      if (where) {
        queryBuilder.where(where);
      }
      
      return queryBuilder
        .cache(cacheKey, ttl * 1000)
        .getMany();
    });
  }
  {{/if}}

  // Transaction helpers
  async transaction<T>(operations: (queryRunner: QueryRunner) => Promise<T>): Promise<T> {
    return this.measureQuery('transaction', async () => {
      const queryRunner = this.dataSource.createQueryRunner();
      await queryRunner.connect();
      await queryRunner.startTransaction();
      
      try {
        const result = await operations(queryRunner);
        await queryRunner.commitTransaction();
        return result;
      } catch (error) {
        await queryRunner.rollbackTransaction();
        throw error;
      } finally {
        await queryRunner.release();
      }
    });
  }

  // Query analysis
  getQueryStats(): {
    totalQueries: number;
    averageDuration: number;
    slowQueries: number;
    fastQueries: number;
  } {
    const totalQueries = this.queryLog.length;
    const averageDuration = totalQueries > 0 
      ? this.queryLog.reduce((sum, log) => sum + log.duration, 0) / totalQueries 
      : 0;
    
    const slowQueries = this.queryLog.filter(log => log.duration > 500).length;
    const fastQueries = this.queryLog.filter(log => log.duration < 100).length;

    return {
      totalQueries,
      averageDuration,
      slowQueries,
      fastQueries,
    };
  }

  clearQueryLog(): void {
    this.queryLog = [];
  }
}`
    }
  ]
};
export default queryBuilderBlueprint;
