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
     */
    flushToDisk(): Promise<void>;
    /**
     * Clear VFS (for testing)
     */
    clear(): void;
    /**
     * Normalize file path to be relative to project root
     */
    private normalizePath;
}
