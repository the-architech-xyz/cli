/**
 * Architech Configuration Loader
 *
 * Loads and validates Architech configuration from:
 * 1. Project-level: ./architech.config.json
 * 2. User-level: ~/.architechrc
 * 3. Default: Built-in defaults
 */
import { ArchitechConfig } from '../genome-resolution/types.js';
export declare class ArchitechConfigLoader {
    private static DEFAULT_CONFIG;
    /**
     * Load configuration with priority: project > user > defaults
     */
    static load(projectRoot?: string): Promise<ArchitechConfig>;
    /**
     * Load project-level configuration
     */
    private static loadProjectConfig;
    /**
     * Load user-level configuration
     */
    private static loadUserConfig;
    /**
     * Merge user config with defaults
     */
    private static mergeWithDefaults;
    /**
     * Validate configuration structure
     */
    private static validateConfig;
    /**
     * Save configuration
     */
    static save(config: ArchitechConfig, scope?: 'project' | 'user', projectRoot?: string): Promise<void>;
    /**
     * Create default config file
     */
    static createDefault(scope?: 'project' | 'user', projectRoot?: string): Promise<void>;
}
