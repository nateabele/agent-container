#!/usr/bin/env node

/**
 * AI Provider Factory
 * Creates and configures provider instances
 */

import { BaseAIProvider } from './base-provider.js';
import { ClaudeProvider } from './claude-provider.js';
import { CodexProvider } from './codex-provider.js';
import { GeminiProvider } from './gemini-provider.js';
import { CursorProvider } from './cursor-provider.js';
import { ProviderConfig, ProviderName, ProviderInfo } from '../types.js';

type ProviderConstructor = new (config: ProviderConfig) => BaseAIProvider;

export class ProviderFactory {

  private readonly providerClasses: Map<ProviderName, ProviderConstructor>;

  constructor() {
    this.providerClasses = new Map<ProviderName, ProviderConstructor>([
      ['claude-code', ClaudeProvider],
      ['codex', CodexProvider],
      ['gemini', GeminiProvider],
      ['cursor', CursorProvider]
    ]);
  }

  /**
   * Create a provider instance
   */
  public createProvider(providerName: ProviderName, config: ProviderConfig): BaseAIProvider {
    const ProviderClass = this.providerClasses.get(providerName);
    if (!ProviderClass) {
      throw new Error(`Unknown provider: ${providerName}`);
    }

    return new ProviderClass(config);
  }

  /**
   * Get all available provider names
   */
  public getAvailableProviders(): readonly ProviderName[] {
    return Array.from(this.providerClasses.keys());
  }

  /**
   * Check if a provider is supported
   */
  public isProviderSupported(providerName: string): providerName is ProviderName {
    return this.providerClasses.has(providerName as ProviderName);
  }

  /**
   * Register a new provider class
   */
  public registerProvider(name: ProviderName, ProviderClass: ProviderConstructor): void {
    this.providerClasses.set(name, ProviderClass);
  }

  /**
   * Get provider information
   */
  public getProviderInfo(providerName: ProviderName): ProviderInfo | null {
    if (!this.isProviderSupported(providerName)) {
      return null;
    }

    const ProviderClass = this.providerClasses.get(providerName)!;
    const instance = new ProviderClass({
      dailyLimit: 1000000,
      weeklyLimit: 5000000,
      switchThreshold: 0.75
    });
    
    return {
      name: providerName,
      configurationOptions: instance.getConfigurationOptions()
    };
  }

  /**
   * Get information for all providers
   */
  public getAllProviderInfo(): readonly ProviderInfo[] {
    const providers: ProviderInfo[] = [];
    
    for (const providerName of this.getAvailableProviders()) {
      const info = this.getProviderInfo(providerName);
      if (info) {
        providers.push(info);
      }
    }
    
    return providers;
  }
}
