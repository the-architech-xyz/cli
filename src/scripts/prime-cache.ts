/**
 * Prime Cache Script
 * 
 * Post-installation script that primes the cache with essential modules.
 * This ensures the CLI works offline for core functionality.
 * 
 * @author The Architech Team
 * @version 1.0.0
 */

import { CacheManagerService } from '../core/services/infrastructure/cache/cache-manager.js';
import { ModuleFetcherService } from '../core/services/module-management/fetcher/module-fetcher.js';

async function primeCache() {
  
  try {
    // Initialize services
    const cacheManager = new CacheManagerService();
    const fetcher = new ModuleFetcherService(cacheManager);
    
    await fetcher.initialize();
    
    // Prime cache with official modules
    await fetcher.primeCache(['official', 'core']);
    
    // Show cache statistics
    const stats = await fetcher.getCacheStats();
    
  } catch (error) {
    console.error('❌ Failed to prime cache:', error);
    process.exit(1);
  }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  primeCache();
}

export { primeCache };