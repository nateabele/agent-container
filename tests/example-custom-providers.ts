#!/usr/bin/env node

/**
 * Example: Using custom provider array with ProviderOrchestrator
 * Shows how to configure providers in a specific order
 */

import { ProviderOrchestrator } from '../src/providers/provider-orchestrator.js';
import { ProviderFactory } from '../src/providers/provider-factory.js';

async function exampleCustomProviders(): Promise<void> {
  console.log('🔧 Example: Custom Provider Array Configuration\n');

  const factory = new ProviderFactory();
  
  // Create providers in your desired order (array order = priority order)
  const customProviders = [
    factory.createProvider('gemini', { 
      dailyLimit: 2000000, 
      weeklyLimit: 10000000, 
      switchThreshold: 0.8 
    }),
    factory.createProvider('claude-code', { 
      dailyLimit: 1500000, 
      weeklyLimit: 8000000, 
      switchThreshold: 0.7 
    }),
    factory.createProvider('codex', { 
      dailyLimit: 1000000, 
      weeklyLimit: 5000000, 
      switchThreshold: 0.75 
    }),
    factory.createProvider('cursor', { 
      dailyLimit: 500000, 
      weeklyLimit: 2500000, 
      switchThreshold: 0.9 
    })
  ];

  // Create orchestrator with custom provider array
  const orchestrator = new ProviderOrchestrator(customProviders);

  console.log('📋 Provider Order (Priority):');
  const priorityOrder = orchestrator.getProviderPriorityOrder();
  priorityOrder.forEach((provider, index) => {
    console.log(`   ${index + 1}. ${provider.name} (Daily: ${provider.config.dailyLimit}, Threshold: ${provider.config.switchThreshold})`);
  });
  console.log('');

  // Test provider selection
  console.log('🎯 Testing Provider Selection:');
  const recommended = await orchestrator.getRecommendedProvider();
  if (recommended) {
    console.log(`   Recommended: ${recommended.name}`);
  } else {
    console.log('   No providers available');
  }
  console.log('');

  // Show usage status
  console.log('📊 Usage Status:');
  orchestrator.printUsageStatus();

  console.log('\n✨ Key Benefits:');
  console.log('   ✅ Simple array order = priority order');
  console.log('   ✅ Easy to reorder providers');
  console.log('   ✅ Per-provider configuration');
  console.log('   ✅ No complex priority mapping');
}

// Run example if called directly
if (require.main === module) {
  exampleCustomProviders().catch(console.error);
}

export default exampleCustomProviders;
