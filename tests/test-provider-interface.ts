#!/usr/bin/env node

/**
 * Test script to demonstrate the new provider interface abstraction
 */

import { AIProvider } from '../src/ai-provider.js';

async function testProviderInterface(): Promise<void> {
  console.log('🧪 Testing AI Provider Interface Abstraction...\n');

  try {
    const provider = new AIProvider();

    // Test 1: List all providers
    console.log('1. Available Providers:');
    const providerInfo = provider.getAllProviderInfo();
    for (const info of providerInfo) {
      console.log(`   - ${info.name}: ${info.configurationOptions.description}`);
    }
    console.log('');

    // Test 2: Check health status
    console.log('2. Provider Health Status:');
    const healthStatuses = await provider.getHealthStatus();
    for (const health of healthStatuses) {
      const status = health.isHealthy ? '✅' : '❌';
      console.log(`   - ${health.name}: ${status} (Available: ${health.isAvailable}, Auth: ${health.isAuthenticated})`);
    }
    console.log('');

    // Test 3: Authentication validation
    console.log('3. Authentication Status:');
    const authStatus = await provider.validateAuthentication();
    for (const [providerName, isAuthenticated] of Object.entries(authStatus)) {
      const status = isAuthenticated ? '✅' : '❌';
      console.log(`   - ${providerName}: ${status}`);
    }
    console.log('');

    // Test 4: Usage status
    console.log('4. Usage Status:');
    provider.printStatus();
    console.log('');

    // Test 5: Provider selection
    console.log('5. Recommended Provider:');
    const recommendedProvider = await provider.getProvider();
    if (recommendedProvider) {
      console.log(`   - Recommended: ${recommendedProvider.name}`);
      console.log(`   - Authenticated: ${recommendedProvider.isAuthenticated ? 'Yes' : 'No'}`);
      console.log(`   - Usage threshold exceeded: ${recommendedProvider.isUsageThresholdExceeded() ? 'Yes' : 'No'}`);
    } else {
      console.log('   - No providers available');
    }
    console.log('');

    // Test 6: Execute with provider switching
    console.log('6. Testing Provider Execution:');
    try {
      const result = await provider.execute("What is 2+2?", 50);
      console.log(`   - Provider used: ${result.provider}`);
      console.log(`   - Fallback used: ${result.fallback ? 'Yes' : 'No'}`);
      console.log(`   - Tokens consumed: ${result.tokens}`);
      console.log(`   - Response: ${result.result.substring(0, 100)}...`);
    } catch (error) {
      console.log(`   - Execution failed: ${(error as Error).message}`);
    }
    console.log('');

    console.log('🎉 Provider interface abstraction test completed!');
    console.log('\n📋 Key Benefits:');
    console.log('   ✅ Extensible provider architecture');
    console.log('   ✅ Automatic provider switching and fallbacks');
    console.log('   ✅ Unified authentication and usage monitoring');
    console.log('   ✅ Health monitoring and status reporting');
    console.log('   ✅ Easy to add new providers');

  } catch (error) {
    console.error('❌ Test failed:', (error as Error).message);
    console.error((error as Error).stack);
    process.exit(1);
  }
}

// Run test if called directly
if (require.main === module) {
  testProviderInterface();
}

export default testProviderInterface;
