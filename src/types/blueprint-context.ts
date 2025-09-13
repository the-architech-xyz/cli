/**
 * Blueprint Context
 * 
 * Contains the VFS instance and context for a single blueprint execution.
 * Each blueprint gets its own isolated VFS instance.
 */

import { VirtualFileSystem } from '../core/services/file-engine/virtual-file-system.js';

export interface BlueprintContext {
  vfs: VirtualFileSystem;
  projectRoot: string;
  externalFiles: string[];
}

export interface BlueprintContextOptions {
  projectRoot: string;
  externalFiles?: string[];
}
