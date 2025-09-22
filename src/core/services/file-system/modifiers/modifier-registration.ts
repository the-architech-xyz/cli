/**
 * Modifier Registration Service
 * 
 * Registers all available modifiers in the ModifierRegistry
 */

import { getModifierRegistry } from './modifier-registry.js';
import { tsModuleEnhancerModifier } from './ts-module-enhancer.js';
import { jsExportWrapperModifier } from './js-export-wrapper.js';
import { jsxWrapperModifier } from './jsx-wrapper.js';
import { jsConfigMergerModifier } from './js-config-merger.js';
import { jsonObjectMergerModifier } from './json-object-merger.js';
import { cssEnhancerModifier } from './css-enhancer.js';

/**
 * Register all modifiers in the global registry
 */
export function registerAllModifiers(): void {
  const registry = getModifierRegistry();
  
  // Register all modifiers
  registry.register('ts-module-enhancer', tsModuleEnhancerModifier);
  registry.register('js-export-wrapper', jsExportWrapperModifier);
  registry.register('jsx-wrapper', jsxWrapperModifier);
  registry.register('js-config-merger', jsConfigMergerModifier);
  registry.register('json-object-merger', jsonObjectMergerModifier);
  registry.register('css-enhancer', cssEnhancerModifier);
  
  console.log(`✅ Registered ${registry.size()} modifiers: ${registry.list().join(', ')}`);
}

/**
 * Initialize modifiers (call this at startup)
 */
export function initializeModifiers(): void {
  registerAllModifiers();
}
