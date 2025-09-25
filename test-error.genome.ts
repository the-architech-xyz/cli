/**
 * Test Genome with Intentional Error
 * This genome is designed to test the error handling system
 */

import { Genome } from '@thearchitech.xyz/marketplace';

const genome: Genome = {
  project: {
    name: 'test-error-app',
    version: '1.0.0',
    framework: 'nextjs',
    path: './test-error-app',
    description: 'Test app for error handling validation'
  },
  modules: [
    {
      id: 'framework/nextjs',
      category: 'framework',
      version: '1.0.0',
      parameters: {
        typescript: true,
        tailwind: true
      }
    },
    {
      id: 'ui/shadcn-ui',
      category: 'ui',
      version: '1.0.0',
      parameters: {
        components: ['button', 'card'],
        theme: 'dark'
      }
    },
    {
      id: 'database/drizzle',
      category: 'database',
      version: '1.0.0',
      parameters: {
        databaseType: 'postgresql',
        provider: 'neon',
        migrations: true
      }
    }
  ],
  options: {
    skipInstall: true // Skip npm install for faster testing
  }
};

export default genome;
