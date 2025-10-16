/**
 * Unified File System Service
 *
 * Consolidates VirtualFileSystem and FileModificationEngine
 * into a single, cohesive service for file operations
 */
import { VirtualFileSystem } from './file-engine/virtual-file-system.js';
import { FileModificationEngine } from './file-engine/file-modification-engine.js';
export interface FileOperationResult {
    success: boolean;
    files?: string[];
    error?: string;
}
export interface FileSystemStats {
    filesCreated: number;
    filesModified: number;
    filesDeleted: number;
    totalOperations: number;
}
export declare class FileSystemService {
    private vfs;
    private modificationEngine;
    private stats;
    /**
     * Initialize VFS for a blueprint
     */
    initializeVFS(blueprintId: string, projectRoot: string): void;
    /**
     * Create a new file
     */
    createFile(filePath: string, content: string): Promise<FileOperationResult>;
    /**
     * Modify an existing file
     */
    modifyFile(filePath: string, content: string): Promise<FileOperationResult>;
    /**
     * Append content to a file
     */
    appendToFile(filePath: string, content: string): Promise<FileOperationResult>;
    /**
     * Prepend content to a file
     */
    prependToFile(filePath: string, content: string): Promise<FileOperationResult>;
    /**
     * Merge JSON files
     */
    mergeJsonFile(filePath: string, jsonData: any): Promise<FileOperationResult>;
    /**
     * Modify TypeScript file using AST
     */
    modifyTsFile(filePath: string, modifications: any): Promise<FileOperationResult>;
    /**
     * Read file content
     */
    readFile(filePath: string): Promise<string>;
    /**
     * Check if file exists
     */
    fileExists(filePath: string): Promise<boolean>;
    /**
     * Flush VFS to disk
     */
    flushToDisk(): Promise<FileOperationResult>;
    /**
     * Get VFS instance
     */
    getVFS(): VirtualFileSystem | null;
    /**
     * Get modification engine instance
     */
    getModificationEngine(): FileModificationEngine | null;
    /**
     * Get file system statistics
     */
    getStats(): FileSystemStats;
    /**
     * Reset statistics
     */
    resetStats(): void;
    /**
     * Clean up VFS
     */
    cleanup(): void;
}
