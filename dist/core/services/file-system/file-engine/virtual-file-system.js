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
    projectRoot; // Always absolute project root
    blueprintId;
    constructor(blueprintId, projectRoot) {
        this.blueprintId = blueprintId;
        this.projectRoot = path.resolve(projectRoot); // Always absolute
    }
    /**
     * Initialize VFS with required files from disk
     * filePaths should already be resolved (no ${paths.key} variables)
     * All paths are absolute from project root
     */
    async initializeWithFiles(filePaths) {
        for (const filePath of filePaths) {
            try {
                const normalizedPath = this.normalizePath(filePath);
                // Build full path - all paths are absolute from project root
                let fullPath;
                if (normalizedPath.startsWith('packages/') || normalizedPath.startsWith('apps/')) {
                    // Absolute path from project root (package-prefixed)
                    fullPath = path.join(this.projectRoot, normalizedPath);
                }
                else if (path.isAbsolute(normalizedPath)) {
                    // System absolute path
                    fullPath = normalizedPath;
                }
                else {
                    // Relative path - treat as relative to project root
                    fullPath = path.join(this.projectRoot, normalizedPath);
                }
                // Check if file exists on disk
                if (existsSync(fullPath)) {
                    // ✅ OPTIMIZATION: Limit file size to prevent memory issues (max 1MB)
                    const MAX_FILE_SIZE = 1024 * 1024; // 1MB
                    const stats = await fs.stat(fullPath);
                    if (stats.size > MAX_FILE_SIZE) {
                        // Skip large files - log warning but don't load
                        // These files should be handled differently (streaming, etc.)
                        continue;
                    }
                    const content = await fs.readFile(fullPath, 'utf-8');
                    this.files.set(normalizedPath, content);
                    // ✅ Logs réduits - seulement en mode debug
                    // Logger.debug() sera utilisé à la place de console.log
                }
                // ✅ Silently skip missing files - they may be created by the blueprint
            }
            catch (error) {
                // ✅ Silently skip files that can't be loaded - they may not exist yet
                // Logger.debug() pour les erreurs si nécessaire
            }
        }
    }
    /**
     * Lazy loading - read file from VFS or load from disk
     */
    async readFile(filePath) {
        const normalizedPath = this.normalizePath(filePath);
        if (!this.files.has(normalizedPath)) {
            // Lazy load from disk - all paths are absolute from project root
            let fullPath;
            if (normalizedPath.startsWith('packages/') || normalizedPath.startsWith('apps/')) {
                // Absolute path from project root (package-prefixed)
                fullPath = path.join(this.projectRoot, normalizedPath);
            }
            else if (path.isAbsolute(normalizedPath)) {
                // System absolute path
                fullPath = normalizedPath;
            }
            else {
                // Relative path - treat as relative to project root
                fullPath = path.join(this.projectRoot, normalizedPath);
            }
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
        // If not in VFS, check disk - all paths are absolute from project root
        let fullPath;
        if (normalizedPath.startsWith('packages/') || normalizedPath.startsWith('apps/')) {
            // Absolute path from project root (package-prefixed)
            fullPath = path.join(this.projectRoot, normalizedPath);
        }
        else if (path.isAbsolute(normalizedPath)) {
            // System absolute path
            fullPath = normalizedPath;
        }
        else {
            // Relative path - treat as relative to project root
            fullPath = path.join(this.projectRoot, normalizedPath);
        }
        const existsOnDisk = existsSync(fullPath);
        return existsOnDisk;
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
        return files;
    }
    /**
     * Flush all files to disk
     * All paths are absolute from project root:
     * - Absolute paths (packages/... or apps/...): projectRoot + filePath
     * - Relative paths: projectRoot + filePath
     */
    async flushToDisk() {
        for (const [filePath, content] of this.files) {
            try {
                let fullPath;
                // Check if filePath is absolute from project root (package-prefixed)
                // These are absolute paths like "packages/shared/src/lib/..." or "apps/web/src/..."
                if (filePath.startsWith('packages/') || filePath.startsWith('apps/')) {
                    // Absolute path from project root (package-prefixed)
                    fullPath = path.join(this.projectRoot, filePath);
                }
                else if (path.isAbsolute(filePath)) {
                    // System absolute path (starts with /)
                    fullPath = filePath;
                }
                else {
                    // Relative path - treat as relative to project root
                    fullPath = path.join(this.projectRoot, filePath);
                }
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
     * Normalize file path - all paths are absolute from project root
     * Handles:
     * - Absolute paths (package-prefixed): Keep as-is (packages/... or apps/...)
     * - Absolute paths (system): resolve relative to project root
     * - Paths with project root prefix: remove it
     */
    normalizePath(filePath) {
        // First normalize the path
        let normalized = filePath.replace(/\\/g, '/').replace(/\/+/g, '/');
        // Check if it's a package-prefixed absolute path (starts with packages/ or apps/)
        // These are absolute paths from project root in monorepo - keep as-is
        if (normalized.startsWith('packages/') || normalized.startsWith('apps/')) {
            return normalized;
        }
        // Handle system absolute paths (starts with /)
        if (path.isAbsolute(normalized)) {
            normalized = path.relative(this.projectRoot, normalized);
            normalized = normalized.replace(/\\/g, '/');
        }
        // If path starts with project root, remove it
        const projectRootNormalized = this.projectRoot.replace(/\\/g, '/');
        if (normalized.startsWith(projectRootNormalized)) {
            normalized = normalized.substring(projectRootNormalized.length);
            if (normalized.startsWith('/')) {
                normalized = normalized.substring(1);
            }
        }
        return normalized;
    }
}
//# sourceMappingURL=virtual-file-system.js.map