/**
 * Simple & Robust Virtual File System (VFS)
 *
 * Pragmatic VFS that handles lazy loading, blueprint isolation, and basic conflict resolution.
 * Focuses on reliability over architectural purity.
 */
export interface VFSFile {
    path: string;
    content: string;
    exists: boolean;
    lastModified: Date;
}
export declare class VirtualFileSystem {
    private files;
    private projectRoot;
    private contextRoot;
    private blueprintId;
    constructor(blueprintId: string, projectRoot: string, contextRoot?: string);
    /**
     * Initialize VFS with required files from disk
     * filePaths should already be resolved (no ${paths.key} variables)
     * They will be normalized to be relative to contextRoot
     */
    initializeWithFiles(filePaths: string[]): Promise<void>;
    /**
     * Lazy loading - read file from VFS or load from disk
     */
    readFile(filePath: string): Promise<string>;
    /**
     * Write file with smart conflict resolution
     */
    writeFile(filePath: string, content: string): Promise<void>;
    /**
     * Create a new file
     */
    createFile(filePath: string, content: string): Promise<void>;
    /**
     * Check if file exists in VFS or on disk
     */
    fileExists(filePath: string): boolean;
    /**
     * Append content to file
     */
    appendToFile(filePath: string, content: string): Promise<void>;
    /**
     * Prepend content to file
     */
    prependToFile(filePath: string, content: string): Promise<void>;
    /**
     * Get all files in VFS
     */
    getAllFiles(): Array<{
        path: string;
        content: string;
        exists: boolean;
        lastModified: Date;
    }>;
    /**
     * Flush all files to disk
     * Handles both absolute (package-prefixed) and relative paths:
     * - Absolute paths (packages/... or apps/...): projectRoot + filePath
     * - Relative paths: projectRoot + contextRoot + filePath
     */
    flushToDisk(): Promise<void>;
    /**
     * Clear VFS (for testing)
     */
    clear(): void;
    /**
     * Normalize file path to be relative to context root
     * Handles:
     * - Absolute paths (package-prefixed): Keep absolute if different from contextRoot, make relative if matches
     * - Absolute paths (system): resolve relative to context root
     * - Paths with project root prefix: remove it
     * - Paths with context root prefix: remove it
     *
     * CRITICAL: Supports both absolute (package-prefixed) and relative paths
     * - Absolute paths like "packages/shared/src/lib/..." are kept absolute if contextRoot differs
     * - Absolute paths matching contextRoot are normalized to relative
     */
    private normalizePath;
}
