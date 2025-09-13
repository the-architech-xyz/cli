/**
 * Shadcn/ui Base Blueprint
 * 
 * Sets up Shadcn/ui with minimal configuration
 * Advanced features are available as separate features
 */

import { Blueprint } from '../../../types/adapter.js';

export const shadcnUiBlueprint: Blueprint = {
  id: 'shadcn-ui-base-setup',
  name: 'Shadcn/ui Base Setup',
  actions: [
    {
      type: 'RUN_COMMAND',
      command: 'npx shadcn@latest init --yes --defaults'
    },
    // Install all components in one command to avoid multiple dependency installations
    {
      type: 'RUN_COMMAND',
      command: 'npx shadcn@latest add button input card dialog form'
    }
  ]
};