#!/usr/bin/env node

/**
 * Base AI Provider Interface
 * Defines the contract that all AI providers must implement
 */

import { ProviderConfig, ExecutionOptions, AuthenticationCredentials, HealthStatus, UsageStatus, ConfigurationOptions } from '../types.js';

export interface UsageData {
  readonly daily: {
    readonly tokens: number;
    readonly resetDate: string;
  };
  readonly weekly: {
    readonly tokens: number;
    readonly resetDate: string;
  };
}

export abstract class BaseAIProvider {
  public readonly name: string;
  public readonly config: ProviderConfig;
  public isAuthenticated: boolean = false;
  private usageData: UsageData;

  constructor(name: string, config: ProviderConfig) {
    this.name = name;
    this.config = config;
    this.usageData = {
      daily: { tokens: 0, resetDate: this.getCurrentDate() },
      weekly: { tokens: 0, resetDate: this.getCurrentWeek() }
    };
  }

  /**
   * Get current date in YYYY-MM-DD format
   */
  private getCurrentDate(): string {
    return new Date().toISOString().split('T')[0]!;
  }

  /**
   * Get current week start date in YYYY-MM-DD format
   */
  private getCurrentWeek(): string {
    const now = new Date();
    const startOfWeek = new Date(now.setDate(now.getDate() - now.getDay()));
    return startOfWeek.toISOString().split('T')[0]!;
  }

  /**
   * Reset usage counters if needed (daily/weekly)
   */
  private resetCountersIfNeeded(): void {
    const currentDate = this.getCurrentDate();
    const currentWeek = this.getCurrentWeek();

    // Reset daily counter if needed
    if (this.usageData.daily.resetDate !== currentDate) {
      this.usageData = {
        ...this.usageData,
        daily: { tokens: 0, resetDate: currentDate }
      };
    }

    // Reset weekly counter if needed
    if (this.usageData.weekly.resetDate !== currentWeek) {
      this.usageData = {
        ...this.usageData,
        weekly: { tokens: 0, resetDate: currentWeek }
      };
    }
  }

  /**
   * Record usage for this provider
   */
  public recordUsage(tokens: number): void {
    this.resetCountersIfNeeded();
    this.usageData = {
      daily: { ...this.usageData.daily, tokens: this.usageData.daily.tokens + tokens },
      weekly: { ...this.usageData.weekly, tokens: this.usageData.weekly.tokens + tokens }
    };
  }

  /**
   * Get usage percentage for a given period
   */
  public getUsagePercentage(period: 'daily' | 'weekly' = 'daily'): number {
    this.resetCountersIfNeeded();
    const limit = period === 'daily' ? this.config.dailyLimit : this.config.weeklyLimit;
    const used = period === 'daily' ? this.usageData.daily.tokens : this.usageData.weekly.tokens;
    return used / limit;
  }

  /**
   * Check if usage threshold is exceeded
   */
  public isUsageThresholdExceeded(): boolean {
    const dailyPercentage = this.getUsagePercentage('daily');
    const weeklyPercentage = this.getUsagePercentage('weekly');
    
    return dailyPercentage >= this.config.switchThreshold || weeklyPercentage >= this.config.switchThreshold;
  }

  /**
   * Get usage status for this provider
   */
  public getUsageStatus(): UsageStatus {
    this.resetCountersIfNeeded();

    return {
      name: this.name,
      isAuthenticated: this.isAuthenticated,
      daily: {
        used: this.usageData.daily.tokens,
        limit: this.config.dailyLimit,
        percentage: this.getUsagePercentage('daily'),
        threshold: this.config.switchThreshold
      },
      weekly: {
        used: this.usageData.weekly.tokens,
        limit: this.config.weeklyLimit,
        percentage: this.getUsagePercentage('weekly'),
        threshold: this.config.switchThreshold
      },
      isThresholdExceeded: this.isUsageThresholdExceeded()
    };
  }

  // Abstract methods that must be implemented by concrete providers

  /**
   * Login/authenticate with the provider
   */
  public abstract login(credentials?: AuthenticationCredentials): Promise<boolean>;

  /**
   * Validate current authentication status
   */
  public abstract validateAuthentication(): Promise<boolean>;

  /**
   * Execute a prompt/request with this provider
   */
  public abstract execute(input: string, options?: ExecutionOptions): Promise<string>;

  /**
   * Get provider-specific configuration options
   */
  public getConfigurationOptions(): ConfigurationOptions {
    return {
      name: this.name,
      description: `${this.name} AI Provider`,
      supportsUsageLimits: true,
      supportsAuthentication: true,
      requiresApiKey: false,
      requiresOAuth: false,
      supportsStreaming: false
    };
  }

  /**
   * Check if provider is available (command exists, package installed, etc.)
   */
  public async isAvailable(): Promise<boolean> {
    return true; // Default implementation - override in concrete providers
  }

  /**
   * Get provider health status
   */
  public async getHealthStatus(): Promise<HealthStatus> {
    const isAvailable = await this.isAvailable();
    const isAuthenticated = await this.validateAuthentication();
    
    return {
      name: this.name,
      isAvailable,
      isAuthenticated,
      isHealthy: isAvailable && isAuthenticated,
      lastChecked: new Date().toISOString()
    };
  }
}
