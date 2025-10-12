#!/usr/bin/env node

/**
 * Example usage of the AI Provider system
 */

const AIProvider = require('./ai-provider');

async function example() {
  console.log('🚀 AI Provider Example\n');

  const provider = new AIProvider();

  // Show initial status
  console.log('📊 Initial Status:');
  provider.printStatus();
  console.log('');

  // Example prompts
  const prompts = [
    "What is the capital of France?",
    "Write a simple hello world program in Python",
    "Explain the concept of machine learning in simple terms"
  ];

  for (let i = 0; i < prompts.length; i++) {
    const prompt = prompts[i];
    console.log(`\n🤖 Processing prompt ${i + 1}: "${prompt}"`);
    
    try {
      const result = await provider.execute(prompt, 100); // Estimate 100 tokens
      
      console.log(`✅ Provider: ${result.provider}${result.fallback ? ' (fallback)' : ''}`);
      console.log(`📊 Tokens used: ${result.tokens}`);
      console.log(`📝 Response: ${result.result.substring(0, 100)}...`);
      
    } catch (error) {
      console.error(`❌ Error: ${error.message}`);
    }
    
    // Show status after each request
    console.log('\n📊 Current Status:');
    provider.printStatus();
    
    // Brief pause
    await new Promise(resolve => setTimeout(resolve, 1000));
  }

  console.log('\n🎉 Example completed!');
}

// Run example if called directly
if (require.main === module) {
  example().catch(console.error);
}

module.exports = example;
