#!/usr/bin/env node

/**
 * Test Genome Resolution Layer
 * 
 * Tests all resolution strategies without running full CLI
 */

import { GenomeResolverFactory } from './dist/core/services/genome-resolution/index.js';

async function testResolution() {
  console.log('🧪 Testing Genome Resolution Layer\n');
  
  const resolver = GenomeResolverFactory.createDefault();
  
  // Test 1: Shorthand resolution
  console.log('📋 Test 1: Shorthand Resolution');
  console.log('Input: "hello-world"');
  
  try {
    const resolved = await resolver.resolve('hello-world', { verbose: true });
    console.log('✅ SUCCESS');
    console.log(`   Name: ${resolved.name}`);
    console.log(`   Path: ${resolved.path}`);
    console.log(`   Source: ${resolved.source}`);
    if (resolved.metadata) {
      console.log(`   Complexity: ${resolved.metadata.complexity}`);
      console.log(`   Modules: ${resolved.metadata.moduleCount}`);
    }
  } catch (error) {
    console.log('❌ FAILED:', error.message);
  }
  
  console.log('\n---\n');
  
  // Test 2: Alias resolution
  console.log('📋 Test 2: Alias Resolution');
  console.log('Input: "saas-starter"');
  
  try {
    const resolved = await resolver.resolve('saas-starter', { verbose: false });
    console.log('✅ SUCCESS');
    console.log(`   Name: ${resolved.name}`);
    console.log(`   Path: ${resolved.path}`);
    console.log(`   Source: ${resolved.source}`);
  } catch (error) {
    console.log('❌ FAILED:', error.message);
  }
  
  console.log('\n---\n');
  
  // Test 3: File path resolution (backward compatibility)
  console.log('📋 Test 3: File Path Resolution');
  console.log('Input: "../marketplace/genomes/official/01-hello-world.genome.ts"');
  
  try {
    const resolved = await resolver.resolve('../marketplace/genomes/official/01-hello-world.genome.ts');
    console.log('✅ SUCCESS');
    console.log(`   Name: ${resolved.name}`);
    console.log(`   Path: ${resolved.path}`);
    console.log(`   Source: ${resolved.source}`);
  } catch (error) {
    console.log('❌ FAILED:', error.message);
  }
  
  console.log('\n---\n');
  
  // Test 4: Non-existent genome (error handling)
  console.log('📋 Test 4: Error Handling (Non-Existent Genome)');
  console.log('Input: "does-not-exist"');
  
  try {
    const resolved = await resolver.resolve('does-not-exist');
    console.log('❌ Should have thrown error but succeeded!');
  } catch (error) {
    console.log('✅ Correctly threw error');
    console.log('Error message preview:');
    const errorMsg = error.message || String(error);
    const lines = errorMsg.split('\n');
    console.log(lines.slice(0, 10).join('\n'));
  }
  
  console.log('\n---\n');
  
  // Test 5: List available genomes
  console.log('📋 Test 5: List Available Genomes');
  
  try {
    const genomes = await resolver.getAvailableGenomes();
    console.log(`✅ Found ${genomes.length} genomes:`);
    genomes.forEach(g => console.log(`   • ${g}`));
  } catch (error) {
    console.log('❌ FAILED:', error.message);
  }
  
  console.log('\n---\n');
  
  // Test 6: Cache test
  console.log('📋 Test 6: Caching');
  
  console.log('Resolving "hello-world" twice...');
  const start1 = Date.now();
  await resolver.resolve('hello-world');
  const time1 = Date.now() - start1;
  
  const start2 = Date.now();
  await resolver.resolve('hello-world');
  const time2 = Date.now() - start2;
  
  console.log(`First resolution: ${time1}ms`);
  console.log(`Second resolution (cached): ${time2}ms`);
  
  if (time2 < time1) {
    console.log('✅ Cache is working (second call faster)');
  } else {
    console.log('⚠️  Cache might not be working (second call not faster)');
  }
  
  const stats = resolver.getCacheStats();
  console.log(`Cache entries: ${stats.size}`);
  
  console.log('\n=====================================');
  console.log('🎉 ALL TESTS COMPLETE');
  console.log('=====================================\n');
}

testResolution().catch(error => {
  console.error('💥 Test script failed:', error);
  process.exit(1);
});

