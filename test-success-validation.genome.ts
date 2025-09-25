/**
 * Test Genome for Success Validation
 * This genome is designed to test the complete success validation system
 */

import { Genome } from '@thearchitech.xyz/marketplace';

const genome: Genome = {
  project: {
    name: 'test-success-app',
    version: '1.0.0',
    framework: 'nextjs',
    path: './test-success-app',
    description: 'Test app for success validation system'
  },
  modules: [
    {
      id: 'framework/nextjs',
      category: 'framework',
      version: '1.0.0',
      parameters: {
        typescript: true,
        tailwind: true,
        eslint: true,
        importAlias: '@/*'
      }
    }
  ],
  options: {
    skipInstall: false // Allow npm install for testing
  }
};

export default genome;
