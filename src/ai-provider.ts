#!/usr/bin/env node

/**
 * AI Provider wrapper using the new orchestrator pattern
 * Manages multiple AI providers with automatic switching and fallbacks
 */

import * as fs from 'fs';
import { ProviderOrchestrator } from './providers/provider-orchestrator.js';
import { ProviderFactory } from './providers/provider-factory.js';
import { BaseAIProvider } from './providers/base-provider.js';
import { ExecutionResult, AuthenticationCredentials, HealthStatus, ProviderInfo, ProviderName, FullConfig } from './types.js';
import { ClaudeProvider } from './providers/claude-provider.js';

export class AIProvider {

  private readonly factory: ProviderFactory;
  private readonly configuredProviders: readonly BaseAIProvider[];
  private readonly orchestrator: ProviderOrchestrator;
  private readonly configPath: string | undefined;

  constructor(providers: readonly BaseAIProvider[] = [], configPath?: string) {
    this.factory = new ProviderFactory();
    this.configPath = configPath;
    this.configuredProviders = providers.length > 0 ? providers : this.createDefaultProviders();
    this.orchestrator = new ProviderOrchestrator(this.configuredProviders);
  }

  /**
   * Create default provider instances with configuration
   */
  private createDefaultProviders(): readonly BaseAIProvider[] {
    // const config = this.loadConfig();
    const providers: BaseAIProvider[] = [new ClaudeProvider({ dailyLimit: 1000000, weeklyLimit: 5000000, switchThreshold: 0.75 })];

    // // Create all providers with their configurations
    // for (const providerName of this.factory.getAvailableProviders()) {
    //   const providerConfig = config[providerName];
    //   if (providerConfig && 'dailyLimit' in providerConfig) {
    //     const provider = this.factory.createProvider(providerName, providerConfig as any);
    //     providers.push(provider);
    //   }
    // }
    
    return providers;
  }

  /**
   * Load configuration from file
   */
  public loadConfig(): FullConfig {
    const defaultConfig: FullConfig = {
      'claude-code': {
        dailyLimit: 1000000,
        weeklyLimit: 5000000,
        switchThreshold: 0.75
      },
      'codex': {
        dailyLimit: 1000000,
        weeklyLimit: 5000000,
        switchThreshold: 0.75
      },
      'gemini': {
        dailyLimit: 1000000,
        weeklyLimit: 5000000,
        switchThreshold: 0.75
      },
      'cursor': {
        dailyLimit: 1000000,
        weeklyLimit: 5000000,
        switchThreshold: 0.75
      },
      apiKeys: {
        openai: 'your-openai-api-key-here',
        anthropic: 'your-anthropic-api-key-here',
        google: 'your-google-api-key-here',
        cursor: 'your-cursor-api-key-here'
      }
    };

    try {
      // Use custom config path if provided, otherwise use default
      const configPath = this.configPath || './config/usage-config.json';

      if (fs.existsSync(configPath)) {
        const config = JSON.parse(fs.readFileSync(configPath, 'utf8')) as any;
        return { ...defaultConfig, ...config } as FullConfig;
      }
    } catch (error) {
      console.warn('Warning: Could not load config, using defaults');
    }

    return defaultConfig;
  }

  /**
   * Get the recommended provider
   */
  public async getProvider(): Promise<BaseAIProvider | null> {
    return await this.orchestrator.getRecommendedProvider();
  }

  /**
   * Execute a request with automatic provider selection and fallback
   */
  public async execute(input: string, estimatedTokens: number = 1000): Promise<ExecutionResult> {
    return await this.orchestrator.execute(input, { estimatedTokens });
  }

  /**
   * Validate authentication for all providers
   */
  public async validateAuthentication(): Promise<Record<string, boolean>> {
    return await this.orchestrator.validateAllAuthentication();
  }

  /**
   * Get usage status for all providers
   */
  public async getStatus(): Promise<Record<string, any>> {
    return this.orchestrator.getUsageStatus();
  }

  /**
   * Print usage status for all providers
   */
  public printStatus(): void {
    this.orchestrator.printUsageStatus();
  }

  /**
   * Get health status for all providers
   */
  public async getHealthStatus(): Promise<readonly HealthStatus[]> {
    return await this.orchestrator.getHealthStatus();
  }

  /**
   * Login to a specific provider
   */
  public async loginProvider(providerName: string, credentials: AuthenticationCredentials = {}): Promise<boolean> {
    return await this.orchestrator.loginProvider(providerName, credentials);
  }

  /**
   * Get all registered providers
   */
  public getAllProviders(): readonly BaseAIProvider[] {
    return this.orchestrator.getAllProviders();
  }

  /**
   * Get provider information
   */
  public getProviderInfo(providerName: ProviderName): ProviderInfo | null {
    return this.factory.getProviderInfo(providerName);
  }

  /**
   * Get information for all providers
   */
  public getAllProviderInfo(): readonly ProviderInfo[] {
    return this.factory.getAllProviderInfo();
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
        for (const [providerName, isAuthenticated] of Object.entries(authStatus)) {
          console.log(`${providerName}: ${isAuthenticated ? '✅' : '❌'}`);
        }
        process.exit(0);
      }).catch(error => {
        console.error('❌ Authentication validation failed:', (error as Error).message);
        process.exit(1);
      });
      break;
      
    case 'health':
      provider.getHealthStatus().then(healthStatuses => {
        console.log('\n🏥 Health Status:');
        for (const health of healthStatuses) {
          console.log(`${health.name}: ${health.isHealthy ? '✅' : '❌'} (Available: ${health.isAvailable}, Auth: ${health.isAuthenticated})`);
        }
        process.exit(0);
      }).catch(error => {
        console.error('❌ Health check failed:', (error as Error).message);
        process.exit(1);
      });
      break;
      
    case 'providers':
      const providerInfo = provider.getAllProviderInfo();
      console.log('\n📋 Available Providers:');
      for (const info of providerInfo) {
        console.log(`\n${info.name}:`);
        console.log(`  Description: ${info.configurationOptions.description}`);
        console.log(`  Requires API Key: ${info.configurationOptions.requiresApiKey ? 'Yes' : 'No'}`);
        console.log(`  Requires OAuth: ${info.configurationOptions.requiresOAuth ? 'Yes' : 'No'}`);
        console.log(`  Supports Streaming: ${info.configurationOptions.supportsStreaming ? 'Yes' : 'No'}`);
      }
      break;
      
    case 'login':
      const providerName = args[0];
      if (!providerName) {
        console.log('Usage: node scripts/ai-provider.js login <provider-name>');
        process.exit(1);
      }
      
      provider.loginProvider(providerName).then(success => {
        if (success) {
          console.log(`✅ Successfully logged in to ${providerName}`);
        } else {
          console.error(`❌ Failed to log in to ${providerName}`);
        }
        process.exit(success ? 0 : 1);
      }).catch(error => {
        console.error('❌ Login failed:', (error as Error).message);
        process.exit(1);
      });
      break;
      
    case 'execute':
      const input = args[0] || process.stdin.read();
      if (!input) {
        console.log('Usage: node scripts/ai-provider.js execute "<input>"');
        process.exit(1);
      }
      
      provider.execute(input as string).then(result => {
        console.log(`\n🤖 Provider: ${result.provider}${result.fallback ? ' (fallback)' : ''}`);
        console.log(`📊 Tokens: ${result.tokens}`);
        console.log(`\n📝 Response:\n${result.result}`);
      }).catch(error => {
        console.error('❌ Error:', (error as Error).message);
        process.exit(1);
      });
      break;
      
    default:
      console.log(`Usage:
  node scripts/ai-provider.js status                    - Show usage status
  node scripts/ai-provider.js validate-auth             - Validate authentication for all providers
  node scripts/ai-provider.js health                    - Show health status for all providers
  node scripts/ai-provider.js providers                 - List all available providers
  node scripts/ai-provider.js login <provider>          - Login to a specific provider
  node scripts/ai-provider.js execute "<input>"         - Execute with auto-switching
      `);
  }
}
