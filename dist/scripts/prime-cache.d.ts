/**
 * Prime Cache Script
 *
 * Post-installation script that primes the cache with essential modules.
 * This ensures the CLI works offline for core functionality.
 *
 * @author The Architech Team
 * @version 1.0.0
 */
declare function primeCache(): Promise<void>;
export { primeCache };
