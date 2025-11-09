/**
 * Project Data Extractor
 * 
 * Extracts project information for the welcome page
 */

import { ProjectData } from './types';

export function extractProjectData(modules: any[], project: any): ProjectData {
  return {
    name: project.name,
    description: project.description || 'A modern application built with The Architech',
    modules: modules.map(m => ({
      id: m.id,
      name: m.name || m.id,
      description: m.description || ''
    })),
    framework: project.framework,
    techStack: {
      frontend: 'React',
      backend: project.framework,
      database: modules.find(m => m.id.includes('database'))?.id || 'None',
      styling: modules.find(m => m.id.includes('ui'))?.id || 'Tailwind CSS',
      state: modules.find(m => m.id.includes('state'))?.id || 'None'
    }
  };
}

export function getAvailableFeatures(modules: any[]): string[] {
  return modules
    .filter(m => m.id.startsWith('features/'))
    .map(m => m.id.replace('features/', ''));
}

