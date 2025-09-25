/**
 * Error Handler Tests
 * 
 * Tests for the ErrorHandler service
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ErrorHandler } from '../error-handler.js';
import { ErrorCode, ErrorResult } from '../error-types.js';

describe('ErrorHandler', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('handleCriticalError', () => {
    it('should handle Error object with verbose mode', () => {
      const error = new Error('Test error');
      const traceId = 'test-trace-123';
      const operation = 'test-operation';
      const verbose = true;

      const result = ErrorHandler.handleCriticalError(error, traceId, operation, verbose);

      expect(result.success).toBe(false);
      expect(result.error).toContain('Test error');
      expect(result.error).toContain('test-trace-123');
      expect(result.error).toContain('test-operation');
    });

    it('should handle string error with non-verbose mode', () => {
      const error = 'Simple error message';
      const traceId = 'test-trace-456';
      const operation = 'test-operation';
      const verbose = false;

      const result = ErrorHandler.handleCriticalError(error, traceId, operation, verbose);

      expect(result.success).toBe(false);
      expect(result.error).toContain('Simple error message');
      expect(result.error).not.toContain('test-trace-456');
    });

    it('should handle unknown error type', () => {
      const error = { someProperty: 'value' };
      const traceId = 'test-trace-789';
      const operation = 'test-operation';
      const verbose = true;

      const result = ErrorHandler.handleCriticalError(error as any, traceId, operation, verbose);

      expect(result.success).toBe(false);
      expect(result.error).toContain('Unknown error');
    });
  });

  describe('reportModuleFailure', () => {
    it('should format module failure with verbose mode', () => {
      const moduleId = 'framework/nextjs';
      const error = 'Module execution failed';
      const verbose = true;

      const result = ErrorHandler.reportModuleFailure(moduleId, error, verbose);

      expect(result.success).toBe(false);
      expect(result.error).toContain('framework/nextjs');
      expect(result.error).toContain('Module execution failed');
    });

    it('should format module failure without verbose mode', () => {
      const moduleId = 'database/drizzle';
      const error = 'Database connection failed';
      const verbose = false;

      const result = ErrorHandler.reportModuleFailure(moduleId, error, verbose);

      expect(result.success).toBe(false);
      expect(result.error).toContain('database/drizzle');
      expect(result.error).not.toContain('Database connection failed');
    });
  });

  describe('handleBatchFailure', () => {
    it('should format batch failure with multiple errors', () => {
      const batchNumber = 2;
      const errors = ['Error 1', 'Error 2', 'Error 3'];
      const verbose = true;

      const result = ErrorHandler.handleBatchFailure(batchNumber, errors, verbose);

      expect(result.success).toBe(false);
      expect(result.error).toContain('Batch 2');
      expect(result.error).toContain('Error 1');
      expect(result.error).toContain('Error 2');
      expect(result.error).toContain('Error 3');
    });

    it('should format batch failure without verbose mode', () => {
      const batchNumber = 1;
      const errors = ['Critical error'];
      const verbose = false;

      const result = ErrorHandler.handleBatchFailure(batchNumber, errors, verbose);

      expect(result.success).toBe(false);
      expect(result.error).toContain('Batch 1');
      expect(result.error).not.toContain('Critical error');
    });
  });

  describe('handleDependencyFailure', () => {
    it('should format dependency failure with verbose mode', () => {
      const error = new Error('npm install failed');
      const verbose = true;

      const result = ErrorHandler.handleDependencyFailure(error, verbose);

      expect(result.success).toBe(false);
      expect(result.error).toContain('npm install failed');
    });

    it('should format dependency failure without verbose mode', () => {
      const error = new Error('Dependency resolution failed');
      const verbose = false;

      const result = ErrorHandler.handleDependencyFailure(error, verbose);

      expect(result.success).toBe(false);
      expect(result.error).not.toContain('Dependency resolution failed');
    });
  });

  describe('formatUserError', () => {
    it('should format error result for user display with verbose mode', () => {
      const errorResult: ErrorResult = {
        success: false,
        error: 'Test error message',
        code: ErrorCode.CRITICAL_ERROR,
        context: {
          operation: 'test-operation',
          traceId: 'test-trace-123'
        }
      };
      const verbose = true;

      const result = ErrorHandler.formatUserError(errorResult, verbose);

      expect(result).toContain('Test error message');
      expect(result).toContain('test-operation');
      expect(result).toContain('test-trace-123');
    });

    it('should format error result for user display without verbose mode', () => {
      const errorResult: ErrorResult = {
        success: false,
        error: 'Test error message',
        code: ErrorCode.CRITICAL_ERROR,
        context: {
          operation: 'test-operation',
          traceId: 'test-trace-123'
        }
      };
      const verbose = false;

      const result = ErrorHandler.formatUserError(errorResult, verbose);

      expect(result).toContain('Test error message');
      expect(result).not.toContain('test-operation');
      expect(result).not.toContain('test-trace-123');
    });
  });
});
