/**
 * Unified File System Service
 *
 * Consolidates VirtualFileSystem and FileModificationEngine
 * into a single, cohesive service for file operations
 */
import { VirtualFileSystem } from './file-engine/virtual-file-system.js';
import { FileModificationEngine } from './file-engine/file-modification-engine.js';
import { Logger } from '../infrastructure/logging/index.js';
export class FileSystemService {
    vfs = null;
    modificationEngine = null;
    stats = {
        filesCreated: 0,
        filesModified: 0,
        filesDeleted: 0,
        totalOperations: 0
    };
    /**
     * Initialize VFS for a blueprint
     */
    initializeVFS(blueprintId, projectRoot) {
        this.vfs = new VirtualFileSystem(blueprintId, projectRoot);
        this.modificationEngine = new FileModificationEngine(this.vfs, projectRoot);
        Logger.debug(`🗂️ Created VFS for blueprint: ${blueprintId} in ${projectRoot}`, {
            operation: 'vfs_init'
        });
    }
    /**
     * Create a new file
     */
    async createFile(filePath, content) {
        if (!this.modificationEngine) {
            return {
                success: false,
                error: 'VFS not initialized. Call initializeVFS() first.'
            };
        }
        try {
            const result = await this.modificationEngine.createFile(filePath, content);
            if (result.success) {
                this.stats.filesCreated++;
                this.stats.totalOperations++;
            }
            return result;
        }
        catch (error) {
            Logger.error(`Failed to create file ${filePath}`, {
                operation: 'create_file',
                error: error instanceof Error ? error.message : 'Unknown error'
            });
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Unknown error'
            };
        }
    }
    /**
     * Modify an existing file
     */
    async modifyFile(filePath, content) {
        if (!this.modificationEngine) {
            return {
                success: false,
                error: 'VFS not initialized. Call initializeVFS() first.'
            };
        }
        try {
            const result = await this.modificationEngine.overwriteFile(filePath, content);
            if (result.success) {
                this.stats.filesModified++;
                this.stats.totalOperations++;
            }
            return result;
        }
        catch (error) {
            Logger.error(`Failed to modify file ${filePath}`, {
                operation: 'modify_file',
                error: error instanceof Error ? error.message : 'Unknown error'
            });
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Unknown error'
            };
        }
    }
    /**
     * Append content to a file
     */
    async appendToFile(filePath, content) {
        if (!this.modificationEngine) {
            return {
                success: false,
                error: 'VFS not initialized. Call initializeVFS() first.'
            };
        }
        try {
            const result = await this.modificationEngine.appendToFile(filePath, content);
            if (result.success) {
                this.stats.filesModified++;
                this.stats.totalOperations++;
            }
            return result;
        }
        catch (error) {
            Logger.error(`Failed to append to file ${filePath}`, {
                operation: 'append_file',
                error: error instanceof Error ? error.message : 'Unknown error'
            });
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Unknown error'
            };
        }
    }
    /**
     * Prepend content to a file
     */
    async prependToFile(filePath, content) {
        if (!this.modificationEngine) {
            return {
                success: false,
                error: 'VFS not initialized. Call initializeVFS() first.'
            };
        }
        try {
            const result = await this.modificationEngine.prependToFile(filePath, content);
            if (result.success) {
                this.stats.filesModified++;
                this.stats.totalOperations++;
            }
            return result;
        }
        catch (error) {
            Logger.error(`Failed to prepend to file ${filePath}`, {
                operation: 'prepend_file',
                error: error instanceof Error ? error.message : 'Unknown error'
            });
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Unknown error'
            };
        }
    }
    /**
     * Merge JSON files
     */
    async mergeJsonFile(filePath, jsonData) {
        if (!this.modificationEngine) {
            return {
                success: false,
                error: 'VFS not initialized. Call initializeVFS() first.'
            };
        }
        try {
            const result = await this.modificationEngine.mergeJsonFile(filePath, jsonData);
            if (result.success) {
                this.stats.filesModified++;
                this.stats.totalOperations++;
            }
            return result;
        }
        catch (error) {
            Logger.error(`Failed to merge JSON file ${filePath}`, {
                operation: 'merge_json',
                error: error instanceof Error ? error.message : 'Unknown error'
            });
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Unknown error'
            };
        }
    }
    /**
     * Modify TypeScript file using AST
     */
    async modifyTsFile(filePath, modifications) {
        if (!this.modificationEngine) {
            return {
                success: false,
                error: 'VFS not initialized. Call initializeVFS() first.'
            };
        }
        try {
            const result = await this.modificationEngine.modifyTsFile(filePath, modifications);
            if (result.success) {
                this.stats.filesModified++;
                this.stats.totalOperations++;
            }
            return result;
        }
        catch (error) {
            Logger.error(`Failed to modify TypeScript file ${filePath}`, {
                operation: 'modify_ts',
                error: error instanceof Error ? error.message : 'Unknown error'
            });
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Unknown error'
            };
        }
    }
    /**
     * Read file content
     */
    async readFile(filePath) {
        if (!this.modificationEngine) {
            throw new Error('VFS not initialized. Call initializeVFS() first.');
        }
        return await this.modificationEngine.readFile(filePath);
    }
    /**
     * Check if file exists
     */
    async fileExists(filePath) {
        if (!this.vfs) {
            return false;
        }
        return this.vfs.fileExists(filePath);
    }
    /**
     * Flush VFS to disk
     */
    async flushToDisk() {
        if (!this.vfs) {
            return {
                success: false,
                error: 'VFS not initialized. Call initializeVFS() first.'
            };
        }
        try {
            await this.vfs.flushToDisk();
            const files = this.vfs.getAllFiles().map(f => f.path);
            Logger.info('✅ Blueprint VFS flushed to disk', {
                operation: 'vfs_flush',
                filesWritten: files.length
            });
            return {
                success: true,
                files
            };
        }
        catch (error) {
            Logger.error('Failed to flush VFS to disk', {
                operation: 'vfs_flush',
                error: error instanceof Error ? error.message : 'Unknown error'
            });
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Unknown error'
            };
        }
    }
    /**
     * Get VFS instance
     */
    getVFS() {
        return this.vfs;
    }
    /**
     * Get modification engine instance
     */
    getModificationEngine() {
        return this.modificationEngine;
    }
    /**
     * Get file system statistics
     */
    getStats() {
        return { ...this.stats };
    }
    /**
     * Reset statistics
     */
    resetStats() {
        this.stats = {
            filesCreated: 0,
            filesModified: 0,
            filesDeleted: 0,
            totalOperations: 0
        };
    }
    /**
     * Clean up VFS
     */
    cleanup() {
        this.vfs = null;
        this.modificationEngine = null;
        this.resetStats();
    }
}
//# sourceMappingURL=file-system-service.js.map