/**
 * File Modification Engine - Layer 1
 *
 * The foundation layer that provides reliable, robust, and secure file modification primitives.
 * All operations go through the Virtual File System (VFS) before writing to disk.
 */
import { SourceFile } from 'ts-morph';
import { VirtualFileSystem, VFSFile } from './virtual-file-system.js';
export interface FileModificationResult {
    success: boolean;
    filePath: string;
    error?: string;
}
export declare class FileModificationEngine {
    private vfs;
    private projectRoot;
    constructor(vfs: VirtualFileSystem, projectRoot: string);
    /**
     * 1. Create File - Creates a new file in the VFS
     */
    createFile(filePath: string, content: string): Promise<FileModificationResult>;
    /**
     * 2. Read File - Reads file content from VFS or disk
     */
    readFile(filePath: string): Promise<string>;
    /**
     * 3. Overwrite File - Overwrites file content in VFS
     */
    overwriteFile(filePath: string, content: string): Promise<FileModificationResult>;
    /**
     * 4. Append to File - Appends content to file in VFS
     */
    appendToFile(filePath: string, content: string): Promise<FileModificationResult>;
    /**
     * 5. Prepend to File - Prepends content to file in VFS
     */
    prependToFile(filePath: string, content: string): Promise<FileModificationResult>;
    /**
     * 6. Merge JSON File - Deep merges JSON content in VFS
     */
    mergeJsonFile(filePath: string, contentToMerge: any): Promise<FileModificationResult>;
    /**
     * 7. Modify TypeScript File - AST modification primitive
     */
    modifyTsFile(filePath: string, modificationFunction: (sourceFile: SourceFile) => void): Promise<FileModificationResult>;
    /**
     * Write all VFS changes to disk
     */
    flushToDisk(): Promise<void>;
    /**
     * Get all files in VFS
     */
    getAllFiles(): VFSFile[];
    /**
     * Get operation history
     */
    getOperations(): never[];
    /**
     * Clear VFS (for testing)
     */
    clear(): void;
    /**
     * Resolve file path relative to project root
     */
    private resolvePath;
    /**
     * Check if file exists in VFS
     */
    fileExists(filePath: string): boolean;
    /**
     * Get the VFS instance
     */
    getVFS(): VirtualFileSystem;
    /**
     * Get the project root
     */
    getProjectRoot(): string;
}
