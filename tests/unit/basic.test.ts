/**
 * Basic Test
 * 
 * Simple test to verify the testing infrastructure is working.
 */

import { describe, it, expect } from 'vitest';

describe('Basic Test', () => {
  it('should work', () => {
    expect(1 + 1).toBe(2);
  });

  it('should handle async operations', async () => {
    const result = await Promise.resolve(42);
    expect(result).toBe(42);
  });

  it('should handle objects', () => {
    const obj = { name: 'test', value: 123 };
    expect(obj.name).toBe('test');
    expect(obj.value).toBe(123);
  });
}); 