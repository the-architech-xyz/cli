/**
 * Test script for PrerequisiteValidator
 * 
 * This script tests the new "Intelligent Prerequisite & Capability" system
 */

import { PrerequisiteValidator } from './dist/core/services/validation/prerequisite-validator.js';
import { ModuleFetcherService } from './dist/core/services/module-management/fetcher/module-fetcher.js';
import { CacheManagerService } from './dist/core/services/infrastructure/cache/cache-manager.js';

// Mock recipe for testing
const testRecipe = {
  version: '1.0.0',
  project: {
    name: 'test-project',
    framework: 'nextjs',
    path: './test-project',
    description: 'Test project'
  },
  modules: [
    {
      id: 'framework/nextjs',
      category: 'framework',
      version: '15.0.0',
      parameters: {}
    },
    {
      id: 'ui/shadcn-ui',
      category: 'ui',
      version: '1.0.0',
      parameters: {}
    }
  ]
};

async function testPrerequisiteValidator() {
  console.log('🧪 Testing PrerequisiteValidator...');
  
  try {
    // Initialize services
    const cacheManager = new CacheManagerService();
    const moduleFetcher = new ModuleFetcherService(cacheManager);
    const validator = new PrerequisiteValidator(moduleFetcher);
    
    // Test validation
    console.log('📋 Testing recipe validation...');
    const result = await validator.validate(testRecipe);
    
    console.log('✅ Validation result:', {
      isValid: result.isValid,
      error: result.error,
      providedCapabilities: result.details?.providedCapabilities?.length || 0,
      missingCapabilities: result.details?.missingCapabilities?.length || 0,
      conflictingCapabilities: result.details?.conflictingCapabilities?.length || 0,
      versionMismatches: result.details?.versionMismatches?.length || 0
    });
    
    if (result.details?.providedCapabilities) {
      console.log('📦 Provided capabilities:');
      result.details.providedCapabilities.forEach(cap => {
        console.log(`  - ${cap.name}@${cap.version} (${cap.description})`);
      });
    }
    
    if (result.details?.missingCapabilities) {
      console.log('❌ Missing capabilities:');
      result.details.missingCapabilities.forEach(cap => {
        console.log(`  - ${cap.name}${cap.version ? ` (${cap.version})` : ''}`);
      });
    }
    
    if (result.details?.conflictingCapabilities) {
      console.log('⚠️  Conflicting capabilities:');
      result.details.conflictingCapabilities.forEach(conflict => {
        console.log(`  - ${conflict.capability}: ${conflict.message}`);
      });
    }
    
    if (result.details?.versionMismatches) {
      console.log('🔢 Version mismatches:');
      result.details.versionMismatches.forEach(mismatch => {
        console.log(`  - ${mismatch.capability}: ${mismatch.message}`);
      });
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

// Run the test
testPrerequisiteValidator();
