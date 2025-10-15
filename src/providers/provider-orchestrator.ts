#!/usr/bin/env node

/**
 * AI Provider Orchestrator
 * Manages multiple AI providers and handles routing, fallbacks, and usage monitoring
 */

import { BaseAIProvider } from './base-provider.js';
import { ExecutionOptions, ExecutionResult, AuthenticationCredentials, HealthStatus, UsageStatus } from '../types.js';

export class ProviderOrchestrator {

  private readonly providers: Map<string, BaseAIProvider>;
  private readonly providerInstances: readonly BaseAIProvider[];
  private currentProvider: string | null = null;

  constructor(providers: readonly BaseAIProvider[] = []) {
    this.providers = new Map();
    this.providerInstances = providers; // Array of configured provider instances
    
    // Register provided instances
    for (const provider of providers) {
      this.registerProvider(provider);
    }
  }


  /**
   * Register a provider with the orchestrator
   */
  private registerProvider(provider: BaseAIProvider): void {
    if (!provider || typeof provider.execute !== 'function') {
      throw new Error('Invalid provider: must implement BaseAIProvider interface');
    }

    this.providers.set(provider.name, provider);
    console.log(`✅ Registered provider: ${provider.name}`);
  }

  /**
   * Get a registered provider by name
   */
  public getProvider(name: string): BaseAIProvider | null {
    return this.providers.get(name) || null;
  }

  /**
   * Get all registered providers
   */
  public getAllProviders(): readonly BaseAIProvider[] {
    return Array.from(this.providers.values());
  }

  /**
   * Get provider instances in array order (priority order)
   */
  public getProviderPriorityOrder(): readonly BaseAIProvider[] {
    // Return providers in the order they were provided to the constructor
    return this.providerInstances;
  }

  /**
   * Get the recommended provider based on usage and availability
   */
  public async getRecommendedProvider(): Promise<BaseAIProvider | null> {
    const priorityOrder = this.getProviderPriorityOrder();
    
    for (const provider of priorityOrder) {
      // Check if provider is available and authenticated
      const isAvailable = await provider.isAvailable();
      if (!isAvailable) {
        console.warn(`⚠️  Provider ${provider.name} is not available`);
        continue;
      }

      const isAuthenticated = await provider.validateAuthentication();
      if (!isAuthenticated) {
        console.warn(`⚠️  Provider ${provider.name} is not authenticated`);
        continue;
      }

      // Check if usage threshold is exceeded
      if (provider.isUsageThresholdExceeded()) {
        console.warn(`⚠️  Provider ${provider.name} usage threshold exceeded`);
        continue;
      }

      // This provider is good to use
      if (this.currentProvider !== provider.name) {
        console.log(`🔄 Switching from ${this.currentProvider || 'none'} to ${provider.name}`);
        this.currentProvider = provider.name;
      }
      
      return provider;
    }

    // No provider is available - try to find any working provider as fallback
    console.warn('⚠️  No provider meets all criteria, attempting fallback...');
    for (const provider of priorityOrder) {
      const isAvailable = await provider.isAvailable();
      const isAuthenticated = await provider.validateAuthentication();
      
      if (isAvailable && isAuthenticated) {
        console.log(`🔄 Using fallback provider: ${provider.name}`);
        this.currentProvider = provider.name;
        return provider;
      }
    }

    console.error('❌ No providers are available and authenticated');
    return null;
  }

  /**
   * Execute a request with automatic provider selection and fallback
   */
  public async execute(input: string, options: ExecutionOptions = {}): Promise<ExecutionResult> {
    const estimatedTokens = options.estimatedTokens || 1000;
    
    // Get the recommended provider
    const provider = await this.getRecommendedProvider();
    if (!provider) {
      throw new Error('No providers are available and authenticated');
    }

    try {
      // Execute with the primary provider
      const result = await provider.execute(input, options);
      
      // Record usage
      const actualTokens = Math.max(estimatedTokens, Math.ceil((input.length + result.length) / 4));
      provider.recordUsage(actualTokens);
      
      return {
        result,
        provider: provider.name,
        tokens: actualTokens,
        fallback: false
      };
      
    } catch (error) {
      console.error(`❌ Error with ${provider.name}:`, (error as Error).message);
      
      // Try fallback providers
      const priorityOrder = this.getProviderPriorityOrder();
      const currentIndex = priorityOrder.findIndex(p => p.name === provider.name);
      
      for (let i = currentIndex + 1; i < priorityOrder.length; i++) {
        const fallbackProvider = priorityOrder[i];
        if (!fallbackProvider) continue;
        
        const isAvailable = await fallbackProvider.isAvailable();
        const isAuthenticated = await fallbackProvider.validateAuthentication();
        
        if (!isAvailable || !isAuthenticated) {
          console.warn(`⚠️  Fallback provider ${fallbackProvider.name} not available or authenticated`);
          continue;
        }
        
        console.log(`🔄 Trying fallback provider: ${fallbackProvider.name}`);
        
        try {
          const fallbackResult = await fallbackProvider.execute(input, options);
          
          const actualTokens = Math.max(estimatedTokens, Math.ceil((input.length + fallbackResult.length) / 4));
          fallbackProvider.recordUsage(actualTokens);
          
          return {
            result: fallbackResult,
            provider: fallbackProvider.name,
            tokens: actualTokens,
            fallback: true
          };
          
        } catch (fallbackError) {
          console.error(`❌ Fallback provider ${fallbackProvider.name} also failed:`, (fallbackError as Error).message);
          continue;
        }
      }
      
      throw new Error(`All providers failed. Last error: ${(error as Error).message}`);
    }
  }

  /**
   * Validate authentication for all providers
   */
  public async validateAllAuthentication(): Promise<Record<string, boolean>> {
    console.log('🔐 Validating authentication for all providers...');
    
    const authStatus: Record<string, boolean> = {};
    const providers = this.getAllProviders();
    
    for (const provider of providers) {
      try {
        const isAuthenticated = await provider.validateAuthentication();
        authStatus[provider.name] = isAuthenticated;
        
        if (!isAuthenticated) {
          console.warn(`⚠️  ${provider.name} authentication failed`);
        }
      } catch (error) {
        console.error(`❌ Error validating ${provider.name}:`, (error as Error).message);
        authStatus[provider.name] = false;
      }
    }
    
    const hasAnyAuth = Object.values(authStatus).some(status => status);
    if (!hasAnyAuth) {
      throw new Error('All providers authentication failed. Please check your credentials.');
    }
    
    console.log('✅ Authentication validation complete');
    return authStatus;
  }

  /**
   * Get usage status for all providers
   */
  public getUsageStatus(): Record<string, UsageStatus> {
    const status: Record<string, UsageStatus> = {};
    
    for (const provider of this.getAllProviders()) {
      status[provider.name] = provider.getUsageStatus();
    }
    
    return status;
  }

  /**
   * Print usage status for all providers
   */
  public printUsageStatus(): void {
    const status = this.getUsageStatus();
    
    console.log('\n📊 Usage Status:');
    console.log('================');
    
    for (const [providerName, data] of Object.entries(status)) {
      console.log(`\n${providerName.toUpperCase()}:`);
      console.log(`  Authenticated: ${data.isAuthenticated ? '✅' : '❌'}`);
      console.log(`  Daily:  ${data.daily.used}/${data.daily.limit} (${(data.daily.percentage * 100).toFixed(1)}%)`);
      console.log(`  Weekly: ${data.weekly.used}/${data.weekly.limit} (${(data.weekly.percentage * 100).toFixed(1)}%)`);
      
      if (data.daily.percentage >= data.daily.threshold) {
        console.log(`  ⚠️  Daily threshold exceeded (${(data.daily.threshold * 100)}%)`);
      }
      if (data.weekly.percentage >= data.weekly.threshold) {
        console.log(`  ⚠️  Weekly threshold exceeded (${(data.weekly.threshold * 100)}%)`);
      }
      if (data.isThresholdExceeded) {
        console.log(`  ⚠️  Usage threshold exceeded`);
      }
    }
    
    // Show recommended provider
    this.getRecommendedProvider().then(provider => {
      if (provider) {
        console.log(`\n🎯 Recommended provider: ${provider.name}`);
      } else {
        console.log(`\n❌ No providers available`);
      }
    }).catch(error => {
      console.log(`\n❌ Error getting recommended provider: ${(error as Error).message}`);
    });
  }

  /**
   * Get health status for all providers
   */
  public async getHealthStatus(): Promise<readonly HealthStatus[]> {
    const healthStatuses: HealthStatus[] = [];
    
    for (const provider of this.getAllProviders()) {
      try {
        const health = await provider.getHealthStatus();
        healthStatuses.push(health);
      } catch (error) {
        healthStatuses.push({
          name: provider.name,
          isAvailable: false,
          isAuthenticated: false,
          isHealthy: false,
          error: (error as Error).message,
          lastChecked: new Date().toISOString()
        });
      }
    }
    
    return healthStatuses;
  }

  /**
   * Login to a specific provider
   */
  public async loginProvider(providerName: string, credentials: AuthenticationCredentials = {}): Promise<boolean> {
    const provider = this.getProvider(providerName);
    if (!provider) {
      throw new Error(`Provider ${providerName} not found`);
    }

    try {
      const success = await provider.login(credentials);
      if (success) {
        console.log(`✅ Successfully logged in to ${providerName}`);
      } else {
        console.error(`❌ Failed to log in to ${providerName}`);
      }
      return success;
    } catch (error) {
      console.error(`❌ Error logging in to ${providerName}:`, (error as Error).message);
      return false;
    }
  }
}
