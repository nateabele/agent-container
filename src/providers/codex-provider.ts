#!/usr/bin/env node

/**
 * OpenAI Codex Provider Implementation
 */

import { spawn, exec } from 'child_process';
import { BaseAIProvider } from './base-provider.js';
import { ProviderConfig, ExecutionOptions, AuthenticationCredentials, ConfigurationOptions } from '../types.js';

interface TestModeOptions extends ExecutionOptions {
  readonly testMode?: boolean;
}

export class CodexProvider extends BaseAIProvider {
  
  constructor(config: ProviderConfig) {
    super('codex', config);
  }

  /**
   * Check if Codex CLI is available
   */
  public override async isAvailable(): Promise<boolean> {
    return new Promise((resolve) => {
      exec('which codex', (error) => {
        resolve(!error);
      });
    });
  }

  /**
   * Login/authenticate with Codex
   */
  public async login(credentials: AuthenticationCredentials = {}): Promise<boolean> {
    try {
      // Check if already authenticated
      const isAuthenticated = await this.validateAuthentication();
      if (isAuthenticated) {
        this.isAuthenticated = true;
        return true;
      }

      // Codex typically uses API keys, so we just validate
      if (credentials.apiKey) {
        // Set the API key in environment
        process.env['OPENAI_API_KEY'] = credentials.apiKey;
        const isValid = await this.validateAuthentication();
        this.isAuthenticated = isValid;
        return isValid;
      }

      return false;
    } catch (error) {
      console.error('Codex login error:', (error as Error).message);
      return false;
    }
  }

  /**
   * Validate Codex authentication
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
   * Execute a request with Codex
   */
  public async execute(input: string, options: TestModeOptions = {}): Promise<string> {
    if (options.testMode) {
      // For authentication testing, use a minimal request
      return new Promise((resolve, reject) => {
        const codex = spawn('codex', [
          'exec',
          '--skip-git-repo-check',
          'echo "test"'
        ], {
          stdio: ['pipe', 'pipe', 'pipe']
        });

        let output = '';
        let errorOutput = '';

        codex.stdout?.on('data', (data) => {
          output += data.toString();
        });

        codex.stderr?.on('data', (data) => {
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

      codex.stdout?.on('data', (data) => {
        output += data.toString();
      });

      codex.stderr?.on('data', (data) => {
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

  /**
   * Get Codex-specific configuration options
   */
  public override getConfigurationOptions(): ConfigurationOptions {
    return {
      name: this.name,
      description: 'OpenAI Codex - AI code generation and completion',
      supportsUsageLimits: true,
      supportsAuthentication: true,
      requiresApiKey: true,
      requiresOAuth: false,
      supportsStreaming: false
    };
  }
}
