#!/usr/bin/env node

/**
 * CLI Entry Point for AI Agent Container
 * Reads from stdin and executes with the AI provider
 */

import { AIProvider } from './ai-provider.js';

async function main() {
  console.error('DEBUG: CLI started');

  // Parse command line arguments
  const args = process.argv.slice(2);
  let providerPath: string | undefined;

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (!arg) continue;

    if (arg === '--provider-path' && i + 1 < args.length) {
      providerPath = args[i + 1];
      i++; // Skip next arg
    } else if (arg.startsWith('--provider-path=')) {
      const parts = arg.split('=');
      providerPath = parts[1];
    } else if (arg === '--help' || arg === '-h') {
      console.log('Usage: cat PROMPT.md | node cli.js [OPTIONS]');
      console.log('');
      console.log('Options:');
      console.log('  --provider-path PATH    Path to custom provider configuration');
      console.log('  -h, --help             Show this help message');
      process.exit(0);
    }
  }

  // Read from stdin
  let input = '';

  // Check if stdin is a TTY (interactive) or has data
  if (process.stdin.isTTY) {
    console.error('Error: No input provided. Please pipe input via stdin.');
    console.error('Usage: cat PROMPT.md | node cli.js');
    process.exit(1);
  }

  console.error('DEBUG: Reading from stdin...');

  // Read from stdin
  for await (const chunk of process.stdin) {
    input += chunk;
  }

  console.error(`DEBUG: Read ${input.length} characters from stdin`);

  if (!input || input.trim().length === 0) {
    console.error('Error: Empty input received');
    process.exit(1);
  }

  console.error('DEBUG: Creating AI provider...');
  if (providerPath) {
    console.error(`DEBUG: Using provider path: ${providerPath}`);
  }

  try {
    // Create AI provider with optional custom configuration
    const provider = new AIProvider([], providerPath);

    console.error('DEBUG: Executing with input...');

    // Execute with the input
    const result = await provider.execute(input);

    console.error('DEBUG: Got result, outputting...');

    // Output the result
    console.log(`\n🤖 Provider: ${result.provider}${result.fallback ? ' (fallback)' : ''}`);
    console.log(`📊 Tokens: ${result.tokens}`);
    console.log(`\n📝 Response:\n${result.result}`);

    process.exit(0);
  } catch (error) {
    console.error('❌ CLI Error:', (error as Error).message);
    console.error((error as Error).stack);
    process.exit(1);
  }
}

main();
