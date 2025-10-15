#!/usr/bin/env node

/**
 * Claude Code Provider Implementation
 */

import { spawn, exec } from 'child_process';
import { BaseAIProvider } from './base-provider.js';
import { ProviderConfig, ExecutionOptions, AuthenticationCredentials, ConfigurationOptions } from '../types.js';

interface TestModeOptions extends ExecutionOptions {
  readonly testMode?: boolean;
}

export class ClaudeProvider extends BaseAIProvider {

  constructor(config: ProviderConfig) {
    super('claude-code', config);
  }

  /**
   * Check if Claude CLI is available
   */
  public override async isAvailable(): Promise<boolean> {
    return new Promise((resolve) => {
      exec('which claude', (error) => {
        resolve(!error);
      });
    });
  }

  /**
   * Login/authenticate with Claude
   */
  public async login(_credentials: AuthenticationCredentials = {}): Promise<boolean> {
    try {
      // Check if already authenticated
      const isAuthenticated = await this.validateAuthentication();
      if (isAuthenticated) {
        this.isAuthenticated = true;
        return true;
      }

      // Try to authenticate using claude setup-token
      return new Promise((resolve) => {
        const claude = spawn('claude', ['setup-token'], {
          stdio: ['pipe', 'pipe', 'pipe']
        });

        let output = '';
        let errorOutput = '';

        claude.stdout?.on('data', (data) => {
          output += data.toString();
        });

        claude.stderr?.on('data', (data) => {
          errorOutput += data.toString();
        });

        claude.on('close', (code) => {
          if (code === 0) {
            this.isAuthenticated = true;
            resolve(true);
          } else {
            console.error('Claude authentication failed:', errorOutput);
            resolve(false);
          }
        });
      });
    } catch (error) {
      console.error('Claude login error:', (error as Error).message);
      return false;
    }
  }

  /**
   * Validate Claude authentication
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
      const errorMessage = (error as Error).message;
      // Check if it's a rate limit vs authentication issue
      if (errorMessage.includes("limit reached") || errorMessage.includes("Weekly limit")) {
        console.warn("Claude rate limit reached - authentication is valid but usage is blocked");
        this.isAuthenticated = true;
        return true; // Authentication is valid, just rate limited
      }
      this.isAuthenticated = false;
      return false;
    }
  }

  /**
   * Execute a request with Claude
   */
  public async execute(input: string, options: TestModeOptions = {}): Promise<string> {
    if (options.testMode) {
      // For authentication testing, use a minimal request
      return new Promise((resolve, reject) => {
        const claude = spawn('claude', [
          '--dangerously-skip-permissions',
          '-p'
        ], {
          stdio: ['pipe', 'pipe', 'pipe']
        });

        let output = '';
        let errorOutput = '';

        claude.stdout?.on('data', (data) => {
          output += data.toString();
        });

        claude.stderr?.on('data', (data) => {
          errorOutput += data.toString();
        });

        claude.on('close', (code) => {
          if (code === 0) {
            resolve(output);
          } else {
            reject(new Error(`Claude failed with code ${code}: ${errorOutput}`));
          }
        });

        claude.stdin?.write("Hello");
        claude.stdin?.end();
      });
    }

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

      claude.stdout?.on('data', (data) => {
        output += data.toString();
      });

      claude.stderr?.on('data', (data) => {
        errorOutput += data.toString();
      });

      claude.on('close', (code) => {
        if (code === 0) {
          resolve(output);
        } else {
          // Combine stdout and stderr for better error reporting
          const fullError = `${errorOutput}${output}`.trim();
          reject(new Error(`Claude failed with code ${code}: ${fullError}`));
        }
      });

      claude.stdin?.write(input);
      claude.stdin?.end();
    });
  }

  /**
   * Get Claude-specific configuration options
   */
  public override getConfigurationOptions(): ConfigurationOptions {
    return {
      name: this.name,
      description: 'Anthropic Claude Code - Advanced AI assistant with code understanding',
      supportsUsageLimits: true,
      supportsAuthentication: true,
      requiresApiKey: false,
      requiresOAuth: true,
      supportsStreaming: true
    };
  }
}
