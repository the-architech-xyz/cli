/**
 * Project Analyzer
 * 
 * Analyzes project modules and structure for welcome page display.
 * Re-exports functionality from welcome data extractor for UI compatibility.
 */

import { extractProjectData } from './welcome/data-extractor';
import { ProjectData } from './welcome/types';

export interface ProjectStructure {
  directories: Array<{ path: string; description: string }>;
  keyFiles: Array<{ path: string; description: string }>;
}

export function generateProjectStructure(): ProjectStructure {
  return {
    directories: [
      { path: 'src/app', description: 'Next.js App Router pages and layouts' },
      { path: 'src/components', description: 'React components' },
      { path: 'src/lib', description: 'Utility functions and services' },
      { path: 'src/types', description: 'TypeScript type definitions' }
    ],
    keyFiles: [
      { path: 'src/app/page.tsx', description: 'Home page' },
      { path: 'src/app/layout.tsx', description: 'Root layout' },
      { path: 'package.json', description: 'Project dependencies' }
    ]
  };
}

export class ProjectAnalyzer {
  /**
   * Analyze project modules and extract capabilities
   */
  static analyzeProject(modules: any[]): {
    capabilities: string[];
    technologies: string[];
    features: string[];
  } {
    const capabilities: string[] = [];
    const technologies: string[] = [];
    const features: string[] = [];

    for (const module of modules) {
      // Extract feature name
      if (module.id.startsWith('features/')) {
        const featureName = module.id.replace('features/', '').split('/')[0];
        if (!features.includes(featureName)) {
          features.push(featureName);
        }
      }

      // Extract adapter/technology
      if (module.id.startsWith('adapters/')) {
        const adapterName = module.id.replace('adapters/', '').split('/')[0];
        if (!technologies.includes(adapterName)) {
          technologies.push(adapterName);
        }
      }

      // Infer capabilities from module IDs
      if (module.id.includes('auth')) capabilities.push('Authentication');
      if (module.id.includes('payment')) capabilities.push('Payments');
      if (module.id.includes('team')) capabilities.push('Team Management');
      if (module.id.includes('ai-chat')) capabilities.push('AI Chat');
      if (module.id.includes('email')) capabilities.push('Email');
    }

    return { capabilities, technologies, features };
  }

  /**
   * Generate project structure information
   */
  static generateProjectStructure(): ProjectStructure {
    return generateProjectStructure();
  }
}

// Re-export types and functions for convenience
export { extractProjectData, generateProjectStructure };
export type { ProjectData, ProjectStructure };

