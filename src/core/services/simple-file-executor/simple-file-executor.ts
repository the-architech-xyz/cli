/**
 * Simple File Executor
 * 
 * Handles simple file operations that don't require VFS.
 * Used for adapters that only perform basic operations.
 */

import * as fs from 'fs/promises';
import * as path from 'path';
import { spawn } from 'child_process';
import { BlueprintAction } from '../../../types/adapter.js';
import { ProjectContext } from '../../../types/agent.js';
import { CommandRunner } from '../../cli/command-runner.js';
import { TemplateService } from '../template/index.js';

export interface SimpleExecutionResult {
  success: boolean;
  files: string[];
  error?: string;
}

export class SimpleFileExecutor {
  private projectRoot: string;
  private commandRunner: CommandRunner;

  constructor(projectRoot: string) {
    this.projectRoot = projectRoot;
    this.commandRunner = new CommandRunner();
  }

  /**
   * Execute a simple action directly to disk
   */
  async executeAction(action: BlueprintAction, context: ProjectContext): Promise<SimpleExecutionResult> {
    try {
      const files: string[] = [];

      switch (action.type) {
        case 'CREATE_FILE':
          await this.handleCreateFile(action, context, files);
          break;
        case 'RUN_COMMAND':
          await this.handleRunCommand(action, context);
          break;
        case 'INSTALL_PACKAGES':
          await this.handleInstallPackages(action, context);
          break;
        case 'ADD_SCRIPT':
          await this.handleAddScript(action, context);
          break;
        case 'ADD_ENV_VAR':
          await this.handleAddEnvVar(action, context);
          break;
        default:
          throw new Error(`Unsupported action type for simple execution: ${action.type}`);
      }

      return { success: true, files };
    } catch (error) {
      return {
        success: false,
        files: [],
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  private async handleCreateFile(action: BlueprintAction, context: ProjectContext, files: string[]): Promise<void> {
    if (!action.path || !action.content) {
      throw new Error('CREATE_FILE requires path and content');
    }

    const processedPath = this.processTemplate(action.path, context);
    const processedContent = this.processTemplate(action.content, context);
    
    const fullPath = path.join(this.projectRoot, processedPath);
    
    // Ensure directory exists
    const dir = path.dirname(fullPath);
    await fs.mkdir(dir, { recursive: true });
    
    // Write file
    await fs.writeFile(fullPath, processedContent, 'utf-8');
    files.push(processedPath);
  }

  private async handleRunCommand(action: BlueprintAction, context: ProjectContext): Promise<void> {
    if (!action.command) {
      throw new Error('RUN_COMMAND requires command');
    }

    const processedCommand = this.processTemplate(action.command, context);
    console.log(`🔧 Executing command: ${processedCommand}`);
    console.log(`🔧 Working directory: ${this.projectRoot}`);
    
    try {
      // For complex shell commands, use direct shell execution
      const result = await this.executeShellCommand(processedCommand, this.projectRoot);
      console.log(`✅ Command completed successfully: ${processedCommand}`);
      console.log(`📤 Exit code: ${result.code}`);
      if (result.stdout) {
        console.log(`📤 stdout: ${result.stdout}`);
      }
      if (result.stderr) {
        console.log(`⚠️ stderr: ${result.stderr}`);
      }
      
      if (result.code !== 0) {
        throw new Error(`Command failed with exit code ${result.code}: ${result.stderr || 'No error message'}`);
      }
    } catch (error) {
      console.log(`❌ Command failed: ${processedCommand}`);
      console.log(`❌ Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
      throw error;
    }
  }

  /**
   * Execute a shell command directly
   */
  private async executeShellCommand(command: string, cwd: string): Promise<{ code: number; stdout: string; stderr: string }> {
    return new Promise((resolve, reject) => {
      const child = spawn('sh', ['-c', command], {
        cwd,
        stdio: ['pipe', 'pipe', 'pipe'],
        shell: false
      });

      let stdout = '';
      let stderr = '';

      child.stdout?.on('data', (data) => {
        stdout += data.toString();
      });

      child.stderr?.on('data', (data) => {
        stderr += data.toString();
      });

      child.on('close', (code) => {
        resolve({
          code: code || 0,
          stdout,
          stderr
        });
      });

      child.on('error', (error) => {
        reject(error);
      });
    });
  }

  private async handleInstallPackages(action: BlueprintAction, context: ProjectContext): Promise<void> {
    if (!action.packages || action.packages.length === 0) {
      throw new Error('INSTALL_PACKAGES requires packages array');
    }

    const processedPackages = action.packages.map(pkg => this.processTemplate(pkg, context));
    const packageJsonPath = path.join(this.projectRoot, 'package.json');
    
    // Read existing package.json
    const packageJsonContent = await fs.readFile(packageJsonPath, 'utf-8');
    const packageJson = JSON.parse(packageJsonContent);
    
    // Add packages with proper version resolution
    for (const pkg of processedPackages) {
      // Extract package name and version (same logic as blueprint-orchestrator)
      const parts = pkg.includes('@') && !pkg.startsWith('@') ? pkg.split('@') : [pkg, 'latest'];
      const name = parts[0];
      const version = parts[1] || 'latest';
      
      if (name) {
        if (action.isDev) {
          packageJson.devDependencies = packageJson.devDependencies || {};
          packageJson.devDependencies[name] = version;
        } else {
          packageJson.dependencies = packageJson.dependencies || {};
          packageJson.dependencies[name] = version;
        }
      }
    }
    
    // Write back
    await fs.writeFile(packageJsonPath, JSON.stringify(packageJson, null, 2), 'utf-8');
  }

  private async handleAddScript(action: BlueprintAction, context: ProjectContext): Promise<void> {
    if (!action.name || !action.command) {
      throw new Error('ADD_SCRIPT requires name and command');
    }

    const processedName = this.processTemplate(action.name, context);
    const processedCommand = this.processTemplate(action.command, context);
    const packageJsonPath = path.join(this.projectRoot, 'package.json');
    
    // Read existing package.json
    const packageJsonContent = await fs.readFile(packageJsonPath, 'utf-8');
    const packageJson = JSON.parse(packageJsonContent);
    
    // Add script
    packageJson.scripts = packageJson.scripts || {};
    packageJson.scripts[processedName] = processedCommand;
    
    // Write back
    await fs.writeFile(packageJsonPath, JSON.stringify(packageJson, null, 2), 'utf-8');
  }

  private async handleAddEnvVar(action: BlueprintAction, context: ProjectContext): Promise<void> {
    if (!action.key || !action.value) {
      throw new Error('ADD_ENV_VAR requires key and value');
    }

    const processedKey = this.processTemplate(action.key, context);
    const processedValue = this.processTemplate(action.value, context);
    const envPath = path.join(this.projectRoot, '.env.local');
    
    // Read existing .env.local or create new
    let envContent = '';
    try {
      envContent = await fs.readFile(envPath, 'utf-8');
    } catch {
      // File doesn't exist, start fresh
    }
    
    // Add or update environment variable
    const lines = envContent.split('\n');
    const keyIndex = lines.findIndex(line => line.startsWith(`${processedKey}=`));
    
    const newLine = `${processedKey}=${processedValue}`;
    if (keyIndex >= 0) {
      lines[keyIndex] = newLine;
    } else {
      lines.push(newLine);
    }
    
    // Write back
    await fs.writeFile(envPath, lines.join('\n'), 'utf-8');
  }

  private processTemplate(template: string, context: ProjectContext): string {
    return TemplateService.processTemplate(template, context);
  }
}
