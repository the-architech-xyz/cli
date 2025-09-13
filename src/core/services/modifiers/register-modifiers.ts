/**
 * Pure Modifier Registration
 * 
 * Registers all pure modifiers with the registry
 */

import { PureModifierRegistry } from './pure-modifier-registry.js';
import { JSExportWrapper } from './js-export-wrapper.js';
import { TSModuleEnhancer } from './ts-module-enhancer.js';
import { JSConfigMerger } from './js-config-merger.js';
import { JSXWrapper } from './jsx-wrapper.js';
import { JSONObjectMerger } from './json-object-merger.js';

/**
 * Register all pure modifiers with the registry
 * @param registry - The modifier registry to register with
 */
export function registerAllPureModifiers(registry: PureModifierRegistry): void {
  // Register all pure modifiers
  registry.register(new JSExportWrapper());
  registry.register(new TSModuleEnhancer());
  registry.register(new JSConfigMerger());
  registry.register(new JSXWrapper());
  registry.register(new JSONObjectMerger());
}

/**
 * Create a new registry with all modifiers registered
 * @returns A new PureModifierRegistry with all modifiers registered
 */
export function createPureModifierRegistry(): PureModifierRegistry {
  const registry = new PureModifierRegistry();
  registerAllPureModifiers(registry);
  return registry;
}