#!/usr/bin/env node

/**
 * Comprehensive Module Loading Validation Script
 * 
 * This script tests all module types to ensure they can be loaded correctly
 * and catches module loading issues early in development.
 */

import { PathService } from '../src/core/services/path/path-service.js';
import { MarketplaceService } from '../src/core/services/marketplace/marketplace-service.js';
import { ModuleService } from '../src/core/services/module-management/module-service.js';

interface ModuleTest {
  id: string;
  type: 'adapter' | 'connector' | 'integration' | 'feature';
  expectedPath: string;
  description: string;
}

const MODULE_TESTS: ModuleTest[] = [
  // Adapter modules
  {
    id: 'framework/nextjs',
    type: 'adapter',
    expectedPath: 'adapters/framework/nextjs',
    description: 'Framework adapter'
  },
  {
    id: 'ui/shadcn-ui',
    type: 'adapter',
    expectedPath: 'adapters/ui/shadcn-ui',
    description: 'UI adapter'
  },
  {
    id: 'database/drizzle',
    type: 'adapter',
    expectedPath: 'adapters/database/drizzle',
    description: 'Database adapter'
  },
  
  // Connector modules
  {
    id: 'connector:docker-drizzle',
    type: 'connector',
    expectedPath: 'connectors/docker-drizzle',
    description: 'Docker Drizzle connector'
  },
  {
    id: 'connector:tanstack-query-nextjs',
    type: 'connector',
    expectedPath: 'connectors/tanstack-query-nextjs',
    description: 'TanStack Query Next.js connector'
  },
  {
    id: 'connector:better-auth-github',
    type: 'connector',
    expectedPath: 'connectors/better-auth-github',
    description: 'Better Auth GitHub connector'
  },
  
  // Feature modules
  {
    id: 'features/auth',
    type: 'feature',
    expectedPath: 'features/auth',
    description: 'Auth feature'
  },
  {
    id: 'features/architech-welcome',
    type: 'feature',
    expectedPath: 'features/architech-welcome',
    description: 'Architech welcome feature'
  }
];

async function validateModuleLoading() {
  console.log('🔍 Starting comprehensive module loading validation...\n');
  
  const results = {
    passed: 0,
    failed: 0,
    errors: [] as string[]
  };
  
  for (const test of MODULE_TESTS) {
    console.log(`Testing ${test.type}: ${test.id}`);
    
    try {
      // Test 1: Path resolution
      const resolvedPath = await PathService.resolveModuleId(test.id);
      if (resolvedPath !== test.expectedPath) {
        throw new Error(`Path resolution failed. Expected: ${test.expectedPath}, Got: ${resolvedPath}`);
      }
      console.log(`  ✅ Path resolution: ${resolvedPath}`);
      
      // Test 2: Module config loading
      const config = await MarketplaceService.loadModuleConfig(test.id);
      if (!config || !config.id) {
        throw new Error('Module config loading failed - no config or missing id');
      }
      console.log(`  ✅ Config loading: ${config.id}`);
      
      // Test 3: Module blueprint loading
      const blueprint = await MarketplaceService.loadModuleBlueprint(test.id);
      if (!blueprint || !blueprint.version) {
        throw new Error('Module blueprint loading failed - no blueprint or missing version');
      }
      console.log(`  ✅ Blueprint loading: v${blueprint.version}`);
      
      // Test 4: Module service loading
      const moduleService = new ModuleService();
      const module = { id: test.id, parameters: {} };
      const loadResult = await moduleService.loadModuleAdapter(module);
      if (!loadResult.success) {
        throw new Error(`Module service loading failed: ${loadResult.error}`);
      }
      console.log(`  ✅ Module service loading: success`);
      
      results.passed++;
      console.log(`  🎉 ${test.description} - ALL TESTS PASSED\n`);
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      results.failed++;
      results.errors.push(`${test.id}: ${errorMessage}`);
      console.log(`  ❌ ${test.description} - FAILED: ${errorMessage}\n`);
    }
  }
  
  // Summary
  console.log('📊 VALIDATION SUMMARY');
  console.log('==================');
  console.log(`✅ Passed: ${results.passed}`);
  console.log(`❌ Failed: ${results.failed}`);
  console.log(`📈 Success Rate: ${((results.passed / (results.passed + results.failed)) * 100).toFixed(1)}%`);
  
  if (results.errors.length > 0) {
    console.log('\n🚨 ERRORS:');
    results.errors.forEach((error, index) => {
      console.log(`${index + 1}. ${error}`);
    });
  }
  
  if (results.failed > 0) {
    console.log('\n💡 TROUBLESHOOTING TIPS:');
    console.log('- Check that all module directories exist in the marketplace');
    console.log('- Verify that module config files (adapter.json, integration.json, feature.json) are valid');
    console.log('- Ensure that blueprint files are properly exported');
    console.log('- Check that PathService.resolveModuleId() handles all module types correctly');
    process.exit(1);
  } else {
    console.log('\n🎉 All module loading tests passed! The system is ready for generation.');
  }
}

// Run the validation
validateModuleLoading().catch(error => {
  console.error('❌ Validation script failed:', error);
  process.exit(1);
});
