/**
 * Core types for the AI Provider system
 */

export interface ProviderConfig {
  readonly dailyLimit: number;
  readonly weeklyLimit: number;
  readonly switchThreshold: number;
}

export interface UsageData {
  readonly daily: number;
  readonly weekly: number;
  readonly lastReset: {
    readonly daily: string;
    readonly weekly: string;
  };
}

export interface HealthStatus {
  readonly name: string;
  readonly isHealthy: boolean;
  readonly isAvailable: boolean;
  readonly isAuthenticated: boolean;
  readonly error?: string;
  readonly lastChecked?: string;
}

export interface ConfigurationOptions {
  readonly name: string;
  readonly description: string;
  readonly supportsUsageLimits: boolean;
  readonly supportsAuthentication: boolean;
  readonly requiresApiKey: boolean;
  readonly requiresOAuth: boolean;
  readonly supportsStreaming: boolean;
}

export interface ProviderInfo {
  readonly name: string;
  readonly configurationOptions: ConfigurationOptions;
}

export interface UsageStatus {
  readonly name: string;
  readonly isAuthenticated: boolean;
  readonly daily: {
    readonly used: number;
    readonly limit: number;
    readonly percentage: number;
    readonly threshold: number;
  };
  readonly weekly: {
    readonly used: number;
    readonly limit: number;
    readonly percentage: number;
    readonly threshold: number;
  };
  readonly isThresholdExceeded: boolean;
}

export interface ExecutionOptions {
  readonly estimatedTokens?: number;
  readonly stream?: boolean;
  readonly temperature?: number;
  readonly maxTokens?: number;
}

export interface ExecutionResult {
  readonly result: string;
  readonly provider: string;
  readonly tokens: number;
  readonly fallback?: boolean;
}

export interface AuthenticationCredentials {
  readonly apiKey?: string;
  readonly token?: string;
  readonly username?: string;
  readonly password?: string;
  readonly [key: string]: unknown;
}

export interface UsageConfig {
  readonly [providerName: string]: ProviderConfig;
}

export interface ApiKeysConfig {
  readonly openai?: string;
  readonly anthropic?: string;
  readonly google?: string;
  readonly cursor?: string;
  readonly [key: string]: string | undefined;
}

export interface FullConfig {
  readonly [providerName: string]: ProviderConfig | ApiKeysConfig;
  readonly apiKeys: ApiKeysConfig;
}

export type ProviderName = 'claude-code' | 'codex' | 'gemini' | 'cursor';

export type ProviderType = 'claude-code' | 'codex' | 'gemini' | 'cursor';
