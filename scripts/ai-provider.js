#!/usr/bin/env node

/**
 * AI Provider wrapper that switches between Claude Code and OpenAI Codex
 * based on usage monitoring
 */

const { spawn } = require('child_process');
const UsageMonitor = require('./usage-monitor');

class AIProvider {
  constructor() {
    this.monitor = new UsageMonitor();
    this.currentProvider = null;
  }

  async getProvider() {
    const recommended = this.monitor.getRecommendedProvider();
    
    if (this.currentProvider !== recommended) {
      console.log(`🔄 Switching from ${this.currentProvider || 'none'} to ${recommended}`);
      this.currentProvider = recommended;
    }
    
    return recommended;
  }

  async executeWithClaudeCode(input) {
    return new Promise((resolve, reject) => {
      const claude = spawn('claude', [
        '--dangerously-skip-permissions',
        '--verbose',
        '-p'
      ], {
        stdio: ['pipe', 'pipe', 'pipe']
      });

      let output = '';
      let errorOutput = '';

      claude.stdout.on('data', (data) => {
        output += data.toString();
      });

      claude.stderr.on('data', (data) => {
        errorOutput += data.toString();
      });

      claude.on('close', (code) => {
        if (code === 0) {
          resolve(output);
        } else {
          // Combine stdout and stderr for better error reporting
          const fullError = `${errorOutput}${output}`.trim();
          reject(new Error(`Claude Code failed with code ${code}: ${fullError}`));
        }
      });

      claude.stdin.write(input);
      claude.stdin.end();
    });
  }

  async executeWithCodex(input) {
    return new Promise((resolve, reject) => {
      const codex = spawn('codex', [
        'exec',
        '--skip-git-repo-check',
        input
      ], {
        stdio: ['pipe', 'pipe', 'pipe']
      });

      let output = '';
      let errorOutput = '';

      codex.stdout.on('data', (data) => {
        output += data.toString();
      });

      codex.stderr.on('data', (data) => {
        errorOutput += data.toString();
      });

      codex.on('close', (code) => {
        if (code === 0) {
          resolve(output);
        } else {
          reject(new Error(`Codex failed with code ${code}: ${errorOutput}`));
        }
      });
    });
  }

  async executeWithCursor(input) {
    return new Promise((resolve, reject) => {
      const cursor = spawn('cursor-agent', [
        '--prompt', input
      ], {
        stdio: ['pipe', 'pipe', 'pipe']
      });

      let output = '';
      let errorOutput = '';

      cursor.stdout.on('data', (data) => {
        output += data.toString();
      });

      cursor.stderr.on('data', (data) => {
        errorOutput += data.toString();
      });

      cursor.on('close', (code) => {
        if (code === 0) {
          resolve(output);
        } else {
          reject(new Error(`Cursor failed with code ${code}: ${errorOutput}`));
        }
      });
    });
  }

  async execute(input, estimatedTokens = 1000) {
    const provider = await this.getProvider();
    
    try {
      let result;
      
      if (provider === 'claude-code') {
        result = await this.executeWithClaudeCode(input);
      } else if (provider === 'codex') {
        result = await this.executeWithCodex(input);
      } else if (provider === 'cursor') {
        result = await this.executeWithCursor(input);
      } else {
        throw new Error(`Unknown provider: ${provider}`);
      }
      
      // Record usage (estimate tokens based on input/output length)
      const actualTokens = Math.max(estimatedTokens, Math.ceil((input.length + result.length) / 4));
      this.monitor.recordUsage(provider, actualTokens);
      
      return {
        result,
        provider,
        tokens: actualTokens
      };
      
    } catch (error) {
      console.error(`❌ Error with ${provider}:`, error.message);
      
      // Try fallback provider if primary fails
      let fallbackProvider;
      if (provider === 'claude-code') {
        fallbackProvider = 'codex';
      } else if (provider === 'codex') {
        fallbackProvider = 'cursor';
      } else {
        fallbackProvider = 'claude-code';
      }
      
      console.log(`🔄 Trying fallback provider: ${fallbackProvider}`);
      
      try {
        let fallbackResult;
        
        if (fallbackProvider === 'claude-code') {
          fallbackResult = await this.executeWithClaudeCode(input);
        } else if (fallbackProvider === 'codex') {
          fallbackResult = await this.executeWithCodex(input);
        } else if (fallbackProvider === 'cursor') {
          fallbackResult = await this.executeWithCursor(input);
        }
        
        const actualTokens = Math.max(estimatedTokens, Math.ceil((input.length + fallbackResult.length) / 4));
        this.monitor.recordUsage(fallbackProvider, actualTokens);
        
        return {
          result: fallbackResult,
          provider: fallbackProvider,
          tokens: actualTokens,
          fallback: true
        };
        
      } catch (fallbackError) {
        throw new Error(`Both providers failed. Primary: ${error.message}, Fallback: ${fallbackError.message}`);
      }
    }
  }

  async validateClaudeAuthentication() {
    try {
      await this.executeWithClaudeCode("test");
      return true;
    } catch (error) {
      // Check if it's a rate limit vs authentication issue
      if (error.message.includes("limit reached") || error.message.includes("Weekly limit")) {
        console.warn("Claude rate limit reached - authentication is valid but usage is blocked");
        return true; // Authentication is valid, just rate limited
      }
      console.error("Claude authentication failed:", error.message);
      return false;
    }
  }

  async validateCodexAuthentication() {
    try {
      // Check if codex command exists first
      const { exec } = require('child_process');
      const codexExists = await new Promise((resolve) => {
        exec('which codex', (error) => {
          resolve(!error);
        });
      });
      
      if (!codexExists) {
        console.warn("Codex command not found - skipping Codex authentication");
        return false;
      }
      
      await this.executeWithCodex("test");
      return true;
    } catch (error) {
      console.error("Codex authentication failed:", error.message);
      return false;
    }
  }

  async validateCursorAuthentication() {
    try {
      // Check if cursor-agent command exists first
      const { exec } = require('child_process');
      const cursorExists = await new Promise((resolve) => {
        exec('which cursor-agent', (error) => {
          resolve(!error);
        });
      });
      
      if (!cursorExists) {
        console.warn("Cursor CLI command not found - skipping Cursor authentication");
        return false;
      }
      
      await this.executeWithCursor("test");
      return true;
    } catch (error) {
      console.error("Cursor authentication failed:", error.message);
      return false;
    }
  }

  async validateAuthentication() {
    console.log("🔐 Validating authentication for all providers...");
    
    const claudeAuth = await this.validateClaudeAuthentication();
    const codexAuth = await this.validateCodexAuthentication();
    const cursorAuth = await this.validateCursorAuthentication();
    
    if (!claudeAuth && !codexAuth && !cursorAuth) {
      throw new Error("All providers (Claude, Codex, Cursor) authentication failed. Please check your credentials.");
    }
    
    if (!claudeAuth) {
      console.warn("⚠️  Claude authentication failed");
    }
    
    if (!codexAuth) {
      console.warn("⚠️  Codex authentication failed or not available");
    }
    
    if (!cursorAuth) {
      console.warn("⚠️  Cursor authentication failed or not available");
    }
    
    console.log("✅ Authentication validation complete");
    return { claude: claudeAuth, codex: codexAuth, cursor: cursorAuth };
  }

  async getStatus() {
    return this.monitor.getUsageStatus();
  }

  printStatus() {
    this.monitor.printUsageStatus();
  }
}

// CLI interface
if (require.main === module) {
  const command = process.argv[2];
  const args = process.argv.slice(3);
  
  const provider = new AIProvider();
  
  switch (command) {
    case 'status':
      provider.printStatus();
      break;
      
    case 'validate-auth':
      provider.validateAuthentication().then(authStatus => {
        console.log('\n🔐 Authentication Status:');
        console.log(`Claude: ${authStatus.claude ? '✅' : '❌'}`);
        console.log(`Codex: ${authStatus.codex ? '✅' : '❌'}`);
        console.log(`Cursor: ${authStatus.cursor ? '✅' : '❌'}`);
        process.exit(0);
      }).catch(error => {
        console.error('❌ Authentication validation failed:', error.message);
        process.exit(1);
      });
      break;
      
    case 'execute':
      const input = args[0] || process.stdin.read();
      if (!input) {
        console.log('Usage: node scripts/ai-provider.js execute "<input>"');
        process.exit(1);
      }
      
      provider.execute(input).then(result => {
        console.log(`\n🤖 Provider: ${result.provider}${result.fallback ? ' (fallback)' : ''}`);
        console.log(`📊 Tokens: ${result.tokens}`);
        console.log(`\n📝 Response:\n${result.result}`);
      }).catch(error => {
        console.error('❌ Error:', error.message);
        process.exit(1);
      });
      break;
      
    default:
      console.log(`Usage:
  node scripts/ai-provider.js status                    - Show usage status
  node scripts/ai-provider.js validate-auth             - Validate authentication for both providers
  node scripts/ai-provider.js execute "<input>"         - Execute with auto-switching
      `);
  }
}

module.exports = AIProvider;
