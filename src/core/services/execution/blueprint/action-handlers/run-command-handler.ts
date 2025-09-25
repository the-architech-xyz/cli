/**
 * Run Command Handler
 * 
 * Handles RUN_COMMAND actions by executing shell commands.
 * This is a "Specialized Worker" in the Executor-Centric architecture.
 */

import { BlueprintAction, ProjectContext } from '@thearchitech.xyz/types';
import { VirtualFileSystem } from '../../../file-system/file-engine/virtual-file-system.js';
import { BaseActionHandler, ActionResult } from './base-action-handler.js';
import { ArchitechError } from '../../../infrastructure/error/architech-error.js';
import { CommandRunner } from '../../../../cli/command-runner.js';

export class RunCommandHandler extends BaseActionHandler {
  private commandRunner: CommandRunner;

  constructor() {
    super();
    this.commandRunner = new CommandRunner();
  }

  getSupportedActionType(): string {
    return 'RUN_COMMAND';
  }

  async handle(
    action: BlueprintAction, 
    context: ProjectContext, 
    projectRoot: string,
    vfs?: VirtualFileSystem
  ): Promise<ActionResult> {
    const validation = this.validateAction(action);
    if (!validation.valid) {
      return { success: false, error: validation.error };
    }

    if (!action.command) {
      return { success: false, error: 'RUN_COMMAND action missing command' };
    }

    // Process template command
    const command = this.processTemplate(action.command, context);

    try {
      console.log(`  ⚡ Running command: ${command}`);
      
      // Execute the command
      const result = await this.commandRunner.execCommand([command], {
        cwd: projectRoot
      });

      if (result.code === 0) {
        console.log(`  ✅ Command executed successfully`);
        return { 
          success: true, 
          message: `Command executed: ${command}`
        };
      } else {
        return { 
          success: false, 
          error: `Command failed with exit code ${result.code}: ${result.stderr}` 
        };
      }

    } catch (error) {
      const architechError = ArchitechError.internalError(
        `Command execution error: ${error instanceof Error ? error.message : 'Unknown error'}`,
        { operation: 'run_command', command: action.command }
      );
      return { 
        success: false, 
        error: architechError.getUserMessage() 
      };
    }
  }
}
