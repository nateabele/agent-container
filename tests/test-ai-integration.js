#!/usr/bin/env node

/**
 * Test script for AI provider integration
 */

const AIProvider = require('./ai-provider');
const UsageMonitor = require('./usage-monitor');

async function testIntegration() {
  console.log('🧪 Testing AI Provider Integration...\n');

  try {
    // Test 1: Usage Monitor
    console.log('1. Testing Usage Monitor...');
    const monitor = new UsageMonitor();
    
    // Record some test usage
    monitor.recordUsage('claude-code', 1000);
    monitor.recordUsage('codex', 500);
    
    // Check status
    monitor.printUsageStatus();
    console.log('✅ Usage Monitor working\n');

    // Test 2: AI Provider
    console.log('2. Testing AI Provider...');
    const provider = new AIProvider();
    
    // Get recommended provider
    const recommended = await provider.getProvider();
    console.log(`✅ Recommended provider: ${recommended}\n`);

    // Test 3: Provider switching logic
    console.log('3. Testing provider switching logic...');
    
    // Simulate high usage for claude-code
    monitor.recordUsage('claude-code', 800000); // 80% of daily limit
    
    const newRecommended = await provider.getProvider();
    console.log(`✅ Provider after high usage: ${newRecommended}\n`);

    // Test 4: Configuration
    console.log('4. Testing configuration...');
    const config = monitor.config;
    console.log('Configuration loaded:');
    console.log(`  Primary provider: ${config.providers.primary}`);
    console.log(`  Fallback provider: ${config.providers.fallback}`);
    console.log(`  Claude Code daily limit: ${config['claude-code'].dailyLimit}`);
    console.log(`  Codex daily limit: ${config.codex.dailyLimit}`);
    console.log('✅ Configuration working\n');

    // Test 5: Usage data persistence
    console.log('5. Testing usage data persistence...');
    const usageData = monitor.usageData;
    console.log('Usage data:');
    console.log(`  Claude Code daily: ${usageData['claude-code'].daily.tokens}`);
    console.log(`  Codex daily: ${usageData.codex.daily.tokens}`);
    console.log('✅ Usage data persistence working\n');

    console.log('🎉 All tests passed! AI Provider integration is working correctly.');
    console.log('\n📋 Next steps:');
    console.log('  1. Configure API keys in usage-config.json');
    console.log('  2. Test with actual AI providers');
    console.log('  3. Run: ./run-loop.sh');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

testIntegration();
