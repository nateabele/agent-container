#!/usr/bin/env node

/**
 * Google Gemini Provider Implementation
 */

import { exec } from 'child_process';
import { BaseAIProvider } from './base-provider.js';
import { ProviderConfig, ExecutionOptions, AuthenticationCredentials, ConfigurationOptions } from '../types.js';
import { spawnProcess } from './process-utils.js';

interface TestModeOptions extends ExecutionOptions {
  readonly testMode?: boolean;
}

export class GeminiProvider extends BaseAIProvider {
  
  constructor(config: ProviderConfig) {
    super('gemini', config);
  }

  /**
   * Check if Gemini CLI is available
   */
  public override async isAvailable(): Promise<boolean> {
    return new Promise((resolve) => {
      exec('which gemini', (error) => {
        resolve(!error);
      });
    });
  }

  /**
   * Login/authenticate with Gemini
   */
  public async login(credentials: AuthenticationCredentials = {}): Promise<boolean> {
    try {
      // Check if already authenticated
      const isAuthenticated = await this.validateAuthentication();
      if (isAuthenticated) {
        this.isAuthenticated = true;
        return true;
      }

      // Gemini supports multiple auth methods
      if (credentials.apiKey) {
        // Set the API key in environment
        process.env['GEMINI_API_KEY'] = credentials.apiKey;
        const isValid = await this.validateAuthentication();
        this.isAuthenticated = isValid;
        return isValid;
      }

      if (credentials['googleApiKey']) {
        // Set the Google API key in environment
        process.env['GOOGLE_API_KEY'] = credentials['googleApiKey'] as string;
        const isValid = await this.validateAuthentication();
        this.isAuthenticated = isValid;
        return isValid;
      }

      // Try OAuth login flow
      try {
        await spawnProcess({
          command: 'gemini',
          args: ['--login']
        });
        this.isAuthenticated = true;
        return true;
      } catch (error) {
        console.error('Gemini authentication failed:', (error as Error).message);
        return false;
      }
    } catch (error) {
      console.error('Gemini login error:', (error as Error).message);
      return false;
    }
  }

  /**
   * Validate Gemini authentication
   */
  public async validateAuthentication(): Promise<boolean> {
    try {
      const isAvailable = await this.isAvailable();
      if (!isAvailable) {
        return false;
      }

      // Test with a simple command
      await this.execute("test", { testMode: true });
      this.isAuthenticated = true;
      return true;
    } catch (error) {
      this.isAuthenticated = false;
      return false;
    }
  }

  /**
   * Execute a request with Gemini
   */
  public async execute(input: string, options: TestModeOptions = {}): Promise<string> {
    const prompt = options.testMode ? 'Hello' : input;

    return spawnProcess({
      command: 'gemini',
      args: ['-p', prompt, '--output-format', 'text']
    });
  }

  /**
   * Get Gemini-specific configuration options
   */
  public override getConfigurationOptions(): ConfigurationOptions {
    return {
      name: this.name,
      description: 'Google Gemini - Multimodal AI with advanced reasoning capabilities',
      supportsUsageLimits: true,
      supportsAuthentication: true,
      requiresApiKey: false, // Supports multiple auth methods
      requiresOAuth: false, // Optional OAuth
      supportsStreaming: true
    };
  }
}
