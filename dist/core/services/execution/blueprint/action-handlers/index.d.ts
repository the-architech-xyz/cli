/**
 * Action Handlers - Main Entry Point
 *
 * Exports all action handlers and the registry for the Executor-Centric architecture.
 */
export { BaseActionHandler } from './base-action-handler.js';
export type { ActionResult } from './base-action-handler.js';
export { CreateFileHandler } from './create-file-handler.js';
export { EnhanceFileHandler } from './enhance-file-handler.js';
export { InstallPackagesHandler } from './install-packages-handler.js';
export { RunCommandHandler } from './run-command-handler.js';
export { AddEnvVarHandler } from './add-env-var-handler.js';
export { AddScriptHandler } from './add-script-handler.js';
export { AddDependencyHandler } from './add-dependency-handler.js';
export { ActionHandlerRegistry } from './action-handler-registry.js';
