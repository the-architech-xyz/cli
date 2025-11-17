import { describe, it, expect, beforeEach, vi } from 'vitest';
import path from 'node:path';
import { PathKeyRegistry } from '../path-key-registry.js';
import { MarketplaceRegistry } from '../../marketplace/marketplace-registry.js';

describe('PathKeyRegistry.validatePathKeyUsage', () => {
  const coreMarketplaceRoot = path.join(
    process.cwd(),
    '..',
    'marketplace'
  );

  beforeEach(() => {
    PathKeyRegistry.clearCache();
    vi.restoreAllMocks();
    vi.spyOn(MarketplaceRegistry, 'getCoreMarketplacePath').mockResolvedValue(coreMarketplaceRoot);
  });

  it('accepts valid core path keys in template placeholders', async () => {
    const template = 'copy ${paths.apps.web.src} to ${paths.packages.shared.src}';
    const result = await PathKeyRegistry.validatePathKeyUsage(template, 'core', 'monorepo');
    expect(result.valid).toBe(true);
    expect(result.errors).toEqual([]);
  });

  it('rejects invalid keys and provides suggestions', async () => {
    const template = 'use ${paths.apps.web.srx} for something';
    const result = await PathKeyRegistry.validatePathKeyUsage(template, 'core', 'monorepo');
    expect(result.valid).toBe(false);
    expect(result.errors.length).toBeGreaterThan(0);
    expect(result.suggestions.length).toBeGreaterThan(0);
  });

  it('accepts UI keys exposed by core schema', async () => {
    const template = 'framework ${paths.ui.framework}';
    const result = await PathKeyRegistry.validatePathKeyUsage(template, 'core', 'monorepo');
    expect(result.valid).toBe(true);
  });
});


