/**
 * File Modification Engine - Layer 1
 * 
 * The foundation layer that provides reliable, robust, and secure file modification primitives.
 * All operations go through the Virtual File System (VFS) before writing to disk.
 */

import * as fs from 'fs/promises';
import * as path from 'path';
import { Project, SourceFile } from 'ts-morph';
import merge from 'deepmerge';
import { VirtualFileSystem, VFSFile } from './virtual-file-system.js';

export interface FileModificationResult {
  success: boolean;
  filePath: string;
  error?: string;
}

export class FileModificationEngine {
  private vfs: VirtualFileSystem;
  private projectRoot: string;

  constructor(vfs: VirtualFileSystem, projectRoot: string) {
    if (!vfs) {
      throw new Error("FileModificationEngine must be initialized with a VFS instance.");
    }
    this.vfs = vfs;
    this.projectRoot = projectRoot;
  }

  /**
   * 1. Create File - Creates a new file in the VFS
   */
  async createFile(filePath: string, content: string): Promise<FileModificationResult> {
    try {
      const fullPath = this.resolvePath(filePath);
      this.vfs.createFile(fullPath, content);
      
      return {
        success: true,
        filePath: fullPath
      };
    } catch (error) {
      return {
        success: false,
        filePath: filePath,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * 2. Read File - Reads file content from VFS or disk
   * 
   * Note: Pass relative path directly to VFS, which handles normalization.
   * VFS projectRoot is the source of truth for where files should be read from.
   */
  async readFile(filePath: string): Promise<string> {
    // VFS handles path normalization internally, so pass relative path directly
    // If file exists in VFS, read from there
    if (this.vfs.fileExists(filePath)) {
      return await this.vfs.readFile(filePath);
    }
    
    // Fallback: try to read from disk using resolved path
    const fullPath = this.resolvePath(filePath);
    return await fs.readFile(fullPath, 'utf-8');
  }

  /**
   * 3. Overwrite File - Overwrites file content in VFS
   * 
   * Note: Pass relative path directly to VFS, which handles normalization.
   */
  async overwriteFile(filePath: string, content: string): Promise<FileModificationResult> {
    try {
      // VFS handles path normalization internally
      await this.vfs.writeFile(filePath, content);
      
      return {
        success: true,
        filePath: filePath
      };
    } catch (error) {
      return {
        success: false,
        filePath: filePath,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * 4. Append to File - Appends content to file in VFS
   */
  async appendToFile(filePath: string, content: string): Promise<FileModificationResult> {
    try {
      const fullPath = this.resolvePath(filePath);
      await this.vfs.appendToFile(fullPath, content);
      
      return {
        success: true,
        filePath: fullPath
      };
    } catch (error) {
      return {
        success: false,
        filePath: filePath,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * 5. Prepend to File - Prepends content to file in VFS
   */
  async prependToFile(filePath: string, content: string): Promise<FileModificationResult> {
    try {
      const fullPath = this.resolvePath(filePath);
      await this.vfs.prependToFile(fullPath, content);
      
      return {
        success: true,
        filePath: fullPath
      };
    } catch (error) {
      return {
        success: false,
        filePath: filePath,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * 6. Merge JSON File - Deep merges JSON content in VFS
   */
  async mergeJsonFile(filePath: string, contentToMerge: any): Promise<FileModificationResult> {
    try {
      // Read existing content - first from VFS, then from disk if not in VFS
      // VFS handles path normalization, so pass relative path directly
      let existingContent = {};
      if (this.vfs.fileExists(filePath)) {
        const content = this.vfs.readFile(filePath);
        existingContent = JSON.parse(await content);
      } else {
        // File not in VFS, try to read from disk and load into VFS
        try {
          const fullPath = this.resolvePath(filePath);
          const diskContent = await fs.readFile(fullPath, 'utf-8');
          existingContent = JSON.parse(diskContent);
          // Load the file into VFS so future operations can work with it
          await this.vfs.writeFile(filePath, diskContent);
        } catch (diskError) {
          // File doesn't exist on disk either, start with empty object
          existingContent = {};
        }
      }
      
      // Deep merge
      const mergedContent = merge(existingContent, contentToMerge);
      
      // Write back to VFS (VFS handles path normalization)
      await this.vfs.writeFile(filePath, JSON.stringify(mergedContent, null, 2));
      
      return {
        success: true,
        filePath: filePath
      };
    } catch (error) {
      return {
        success: false,
        filePath: filePath,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * 7. Modify TypeScript File - AST modification primitive
   */
  async modifyTsFile(
    filePath: string, 
    modificationFunction: (sourceFile: SourceFile) => void
  ): Promise<FileModificationResult> {
    try {
      // Read existing content
      // VFS handles path normalization, so pass relative path directly
      let existingContent = '';
      if (this.vfs.fileExists(filePath)) {
        existingContent = await this.vfs.readFile(filePath);
      }
      
      // Create ts-morph project
      const project = new Project();
      const sourceFile = project.createSourceFile('temp.ts', existingContent);
      
      // Apply modification function
      modificationFunction(sourceFile);
      
      // Get modified content
      const modifiedContent = sourceFile.getFullText();
      
      // Write back to VFS (VFS handles path normalization)
      await this.vfs.writeFile(filePath, modifiedContent);
      
      return {
        success: true,
        filePath: filePath
      };
    } catch (error) {
      return {
        success: false,
        filePath: filePath,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Write all VFS changes to disk
   */
  async flushToDisk(): Promise<void> {
    const files = this.vfs.getAllFiles();
    
    for (const file of files) {
      const fullPath = this.resolvePath(file.path);
      
      // Ensure directory exists
      const dir = path.dirname(fullPath);
      await fs.mkdir(dir, { recursive: true });
      
      // Write file
      await fs.writeFile(fullPath, file.content, 'utf-8');
    }
  }

  /**
   * Get all files in VFS
   */
  getAllFiles(): VFSFile[] {
    return this.vfs.getAllFiles();
  }

  /**
   * Get operation history
   */
  getOperations() {
    // Return empty array since we removed operations tracking
    return [];
  }

  /**
   * Clear VFS (for testing)
   */
  clear(): void {
    this.vfs.clear();
  }

  /**
   * Resolve file path relative to project root
   */
  private resolvePath(filePath: string): string {
    if (path.isAbsolute(filePath)) {
      return filePath;
    }
    return path.resolve(this.projectRoot, filePath);
  }

  /**
   * Check if file exists in VFS
   * 
   * Note: Pass the relative path directly to VFS, which will normalize it.
   * VFS expects paths relative to its projectRoot, not absolute paths.
   */
  fileExists(filePath: string): boolean {
    // VFS normalizes paths internally, so pass relative path directly
    // If it's absolute and starts with projectRoot, VFS will normalize it
    // If it's relative, pass it as-is (VFS will handle it)
    return this.vfs.fileExists(filePath);
  }

  /**
   * Get the VFS instance
   */
  getVFS(): VirtualFileSystem {
    return this.vfs;
  }

  /**
   * Get the project root
   */
  getProjectRoot(): string {
    return this.projectRoot;
  }
}
