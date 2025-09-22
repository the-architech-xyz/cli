/**
 * Simple & Robust Virtual File System (VFS)
 * 
 * Pragmatic VFS that handles lazy loading, blueprint isolation, and basic conflict resolution.
 * Focuses on reliability over architectural purity.
 */

import * as fs from 'fs/promises';
import * as path from 'path';

export interface VFSFile {
  path: string;
  content: string;
  exists: boolean;
  lastModified: Date;
}

export class VirtualFileSystem {
  private files: Map<string, string> = new Map();
  private projectRoot: string;
  private blueprintId: string;

  constructor(blueprintId: string, projectRoot: string) {
    this.blueprintId = blueprintId;
    this.projectRoot = projectRoot;
    console.log(`🗂️ Created VFS for blueprint: ${blueprintId} in ${projectRoot}`);
  }

  /**
   * Lazy loading - read file from VFS or load from disk
   */
  async readFile(filePath: string): Promise<string> {
    const normalizedPath = this.normalizePath(filePath);
    
    if (!this.files.has(normalizedPath)) {
      // Lazy load from disk
      const fullPath = path.join(this.projectRoot, normalizedPath);
      try {
        const content = await fs.readFile(fullPath, 'utf-8');
        this.files.set(normalizedPath, content);
        console.log(`📖 VFS: Lazy loaded ${normalizedPath}`);
      } catch (error) {
        throw new Error(`File not found: ${normalizedPath} (${error instanceof Error ? error.message : 'Unknown error'})`);
      }
    }
    
    return this.files.get(normalizedPath)!;
  }

  /**
   * Write file with smart conflict resolution
   */
  async writeFile(filePath: string, content: string): Promise<void> {
    const normalizedPath = this.normalizePath(filePath);
    
    console.log(`🔍 [VFS.writeFile] Writing to: ${normalizedPath}`);
    console.log(`🔍 [VFS.writeFile] Content:`, content);
    console.log(`🔍 [VFS.writeFile] File already exists: ${this.files.has(normalizedPath)}`);
    
    if (this.files.has(normalizedPath) && normalizedPath.endsWith('.json')) {
      console.log(`🔍 [VFS.writeFile] Performing JSON merge for: ${normalizedPath}`);
      // Smart JSON merge
      try {
        const existing = JSON.parse(this.files.get(normalizedPath)!);
        const newContent = JSON.parse(content);
        console.log(`🔍 [VFS.writeFile] Existing content:`, JSON.stringify(existing, null, 2));
        console.log(`🔍 [VFS.writeFile] New content:`, JSON.stringify(newContent, null, 2));
        const merged = { ...existing, ...newContent };
        console.log(`🔍 [VFS.writeFile] Merged result:`, JSON.stringify(merged, null, 2));
        this.files.set(normalizedPath, JSON.stringify(merged, null, 2));
        console.log(`🔄 VFS: Merged JSON ${normalizedPath}`);
      } catch (error) {
        console.error(`❌ [VFS.writeFile] JSON merge failed:`, error);
        // If JSON merge fails, overwrite
        this.files.set(normalizedPath, content);
        console.log(`⚠️ VFS: JSON merge failed, overwrote ${normalizedPath}`);
      }
    } else {
      // Simple overwrite for non-JSON files
      this.files.set(normalizedPath, content);
      console.log(`✏️ VFS: Wrote ${normalizedPath}`);
    }
    
    // Verify the write
    const verifyContent = this.files.get(normalizedPath);
    console.log(`🔍 [VFS.writeFile] Verification - content in VFS after write:`, verifyContent);
  }

  /**
   * Create a new file
   */
  async createFile(filePath: string, content: string): Promise<void> {
    const normalizedPath = this.normalizePath(filePath);
    
    if (this.files.has(normalizedPath)) {
      throw new Error(`File already exists: ${normalizedPath}`);
    }

    this.files.set(normalizedPath, content);
    console.log(`📝 VFS: Created ${normalizedPath}`);
  }

  /**
   * Check if file exists in VFS
   */
  fileExists(filePath: string): boolean {
    const normalizedPath = this.normalizePath(filePath);
    return this.files.has(normalizedPath);
  }

  /**
   * Append content to file
   */
  async appendToFile(filePath: string, content: string): Promise<void> {
    const normalizedPath = this.normalizePath(filePath);
    
    if (!this.files.has(normalizedPath)) {
      await this.createFile(normalizedPath, content);
      return;
    }

    const existingContent = this.files.get(normalizedPath)!;
    this.files.set(normalizedPath, existingContent + content);
    console.log(`➕ VFS: Appended to ${normalizedPath}`);
  }

  /**
   * Prepend content to file
   */
  async prependToFile(filePath: string, content: string): Promise<void> {
    const normalizedPath = this.normalizePath(filePath);
    
    if (!this.files.has(normalizedPath)) {
      await this.createFile(normalizedPath, content);
      return;
    }

    const existingContent = this.files.get(normalizedPath)!;
    this.files.set(normalizedPath, content + existingContent);
    console.log(`➕ VFS: Prepended to ${normalizedPath}`);
  }

  /**
   * Get all files in VFS
   */
  getAllFiles(): Array<{ path: string; content: string; exists: boolean; lastModified: Date }> {
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
  async flushToDisk(): Promise<void> {
    console.log(`💾 VFS: Flushing ${this.files.size} files to disk...`);
    
    for (const [filePath, content] of this.files) {
      try {
        const fullPath = path.join(this.projectRoot, filePath);
        await fs.mkdir(path.dirname(fullPath), { recursive: true });
        
        // Ensure content ends with newline and remove any trailing % characters
        let cleanContent = content;
        if (cleanContent.endsWith('%')) {
          cleanContent = cleanContent.slice(0, -1);
        }
        if (!cleanContent.endsWith('\n')) {
          cleanContent += '\n';
        }
        
        await fs.writeFile(fullPath, cleanContent, 'utf-8');
        console.log(`✅ Flushed: ${filePath}`);
      } catch (error) {
        console.error(`❌ Failed to flush ${filePath}:`, error);
        throw new Error(`Failed to flush file ${filePath}: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }
    
    console.log(`✅ VFS: Successfully flushed all files to disk`);
  }

  /**
   * Clear VFS (for testing)
   */
  clear(): void {
    this.files.clear();
    console.log(`🧹 VFS: Cleared all files`);
  }

  /**
   * Normalize file path to be relative to project root
   */
  private normalizePath(filePath: string): string {
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

