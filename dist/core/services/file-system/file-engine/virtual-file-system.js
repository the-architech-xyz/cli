/**
 * Simple & Robust Virtual File System (VFS)
 *
 * Pragmatic VFS that handles lazy loading, blueprint isolation, and basic conflict resolution.
 * Focuses on reliability over architectural purity.
 */
import * as fs from 'fs/promises';
import { existsSync } from 'fs';
import * as path from 'path';
export class VirtualFileSystem {
    files = new Map();
    projectRoot;
    blueprintId;
    constructor(blueprintId, projectRoot) {
        this.blueprintId = blueprintId;
        this.projectRoot = projectRoot;
    }
    /**
     * Initialize VFS with required files from disk
     */
    async initializeWithFiles(filePaths) {
        // Debug logging removed - use Logger.debug() instead
        for (const filePath of filePaths) {
            try {
                const normalizedPath = this.normalizePath(filePath);
                const fullPath = path.join(this.projectRoot, normalizedPath);
                // Debug logging removed - use Logger.debug() instead
                // Check if file exists on disk
                if (existsSync(fullPath)) {
                    const content = await fs.readFile(fullPath, 'utf-8');
                    this.files.set(normalizedPath, content);
                }
                else {
                    console.log(`⚠️ VFS: File not found on disk: ${normalizedPath} (${fullPath})`);
                }
            }
            catch (error) {
                console.log(`⚠️ VFS: Failed to load ${filePath}: ${error instanceof Error ? error.message : 'Unknown error'}`);
            }
        }
    }
    /**
     * Lazy loading - read file from VFS or load from disk
     */
    async readFile(filePath) {
        const normalizedPath = this.normalizePath(filePath);
        if (!this.files.has(normalizedPath)) {
            // Lazy load from disk
            const fullPath = path.join(this.projectRoot, normalizedPath);
            try {
                const content = await fs.readFile(fullPath, 'utf-8');
                this.files.set(normalizedPath, content);
            }
            catch (error) {
                throw new Error(`File not found: ${normalizedPath} (${error instanceof Error ? error.message : 'Unknown error'})`);
            }
        }
        return this.files.get(normalizedPath);
    }
    /**
     * Write file with smart conflict resolution
     */
    async writeFile(filePath, content) {
        const normalizedPath = this.normalizePath(filePath);
        if (this.files.has(normalizedPath) && normalizedPath.endsWith('.json')) {
            // Smart JSON merge
            try {
                const existing = JSON.parse(this.files.get(normalizedPath));
                const newContent = JSON.parse(content);
                const merged = { ...existing, ...newContent };
                this.files.set(normalizedPath, JSON.stringify(merged, null, 2));
            }
            catch (error) {
                // If JSON merge fails, overwrite
                this.files.set(normalizedPath, content);
            }
        }
        else {
            // Simple overwrite for non-JSON files
            this.files.set(normalizedPath, content);
        }
    }
    /**
     * Create a new file
     */
    async createFile(filePath, content) {
        const normalizedPath = this.normalizePath(filePath);
        if (this.files.has(normalizedPath)) {
            throw new Error(`File already exists: ${normalizedPath}`);
        }
        this.files.set(normalizedPath, content);
    }
    /**
     * Check if file exists in VFS or on disk
     */
    fileExists(filePath) {
        const normalizedPath = this.normalizePath(filePath);
        // First check VFS memory
        if (this.files.has(normalizedPath)) {
            return true;
        }
        // If not in VFS, check disk
        const fullPath = path.join(this.projectRoot, normalizedPath);
        return existsSync(fullPath);
    }
    /**
     * Append content to file
     */
    async appendToFile(filePath, content) {
        const normalizedPath = this.normalizePath(filePath);
        if (!this.files.has(normalizedPath)) {
            await this.createFile(normalizedPath, content);
            return;
        }
        const existingContent = this.files.get(normalizedPath);
        this.files.set(normalizedPath, existingContent + content);
        console.log(`➕ VFS: Appended to ${normalizedPath}`);
    }
    /**
     * Prepend content to file
     */
    async prependToFile(filePath, content) {
        const normalizedPath = this.normalizePath(filePath);
        if (!this.files.has(normalizedPath)) {
            await this.createFile(normalizedPath, content);
            return;
        }
        const existingContent = this.files.get(normalizedPath);
        this.files.set(normalizedPath, content + existingContent);
        console.log(`➕ VFS: Prepended to ${normalizedPath}`);
    }
    /**
     * Get all files in VFS
     */
    getAllFiles() {
        const files = Array.from(this.files.entries()).map(([path, content]) => ({
            path,
            content,
            exists: true,
            lastModified: new Date()
        }));
        console.log(`📋 VFS: Returning ${files.length} files`);
        return files;
    }
    /**
     * Flush all files to disk
     */
    async flushToDisk() {
        for (const [filePath, content] of this.files) {
            try {
                const fullPath = path.join(this.projectRoot, filePath);
                await fs.mkdir(path.dirname(fullPath), { recursive: true });
                await fs.writeFile(fullPath, content, 'utf-8');
            }
            catch (error) {
                throw new Error(`Failed to flush file ${filePath}: ${error instanceof Error ? error.message : 'Unknown error'}`);
            }
        }
    }
    /**
     * Clear VFS (for testing)
     */
    clear() {
        this.files.clear();
    }
    /**
     * Normalize file path to be relative to project root
     */
    normalizePath(filePath) {
        // First normalize the path
        let normalized = filePath.replace(/\\/g, '/').replace(/\/+/g, '/');
        // If the path is absolute and starts with project root, make it relative
        if (normalized.startsWith(this.projectRoot)) {
            normalized = normalized.substring(this.projectRoot.length);
            // Remove leading slash if present
            if (normalized.startsWith('/')) {
                normalized = normalized.substring(1);
            }
        }
        return normalized;
    }
}
//# sourceMappingURL=virtual-file-system.js.map