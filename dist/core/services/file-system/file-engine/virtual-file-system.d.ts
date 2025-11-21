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
    private blueprintId;
    constructor(blueprintId: string, projectRoot: string);
    /**
     * Initialize VFS with required files from disk
     * filePaths should already be resolved (no ${paths.key} variables)
     * All paths are absolute from project root
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
     * All paths are absolute from project root:
     * - Absolute paths (packages/... or apps/...): projectRoot + filePath
     * - Relative paths: projectRoot + filePath
     */
    flushToDisk(): Promise<void>;
    /**
     * Clear VFS (for testing)
     */
    clear(): void;
    /**
     * Normalize file path - all paths are absolute from project root
     * Handles:
     * - Absolute paths (package-prefixed): Keep as-is (packages/... or apps/...)
     * - Absolute paths (system): resolve relative to project root
     * - Paths with project root prefix: remove it
     */
    private normalizePath;
}
