/**
 * Welcome Page Data Types
 */

export interface ProjectData {
  name: string;
  description: string;
  modules: ModuleInfo[];
  framework: string;
  techStack: TechStack;
}

export interface ModuleInfo {
  id: string;
  name: string;
  description: string;
}

export interface TechStack {
  frontend: string;
  backend: string;
  database: string;
  styling: string;
  state: string;
}

export interface WelcomePageProps {
  data: ProjectData;
  features?: {
    techStack?: boolean;
    componentShowcase?: boolean;
    projectStructure?: boolean;
    quickStart?: boolean;
    architechBranding?: boolean;
  };
}

