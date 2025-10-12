#!/usr/bin/env node

/**
 * AI Loop Executor - Executes AI provider with prompt from stdin
 * Used by run-loop.sh to avoid inline JavaScript
 */

const AIProvider = require('./ai-provider');

async function executePrompt() {
  try {
    // Read prompt from stdin
    let prompt = '';
    process.stdin.setEncoding('utf8');
    
    process.stdin.on('data', (chunk) => {
      prompt += chunk;
    });
    
    process.stdin.on('end', async () => {
      if (!prompt.trim()) {
        console.error('❌ Error: No prompt provided');
        process.exit(1);
      }
      
      const provider = new AIProvider();
      
      try {
        const result = await provider.execute(prompt.trim());
        
        console.log(`\n🤖 Provider: ${result.provider}${result.fallback ? ' (fallback)' : ''}`);
        console.log(`📊 Tokens: ${result.tokens}`);
        console.log(`\n📝 Response:\n${result.result}`);
        
      } catch (error) {
        console.error('❌ Error:', error.message);
        process.exit(1);
      }
    });
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

// Handle command line arguments
if (process.argv.length > 2 && !process.argv.includes('--validate-only')) {
  const prompt = process.argv.slice(2).join(' ');
  process.stdin.write(prompt);
  process.stdin.end();
} else {
  // Only start reading from stdin if this is not a module validation check
  if (!process.argv.includes('--validate-only')) {
    executePrompt();
  }
}
