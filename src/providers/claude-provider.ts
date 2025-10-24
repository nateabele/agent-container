#!/usr/bin/env node

/**
 * Claude Code Provider Implementation
 */

import { exec } from 'child_process';
import { BaseAIProvider } from './base-provider.js';
import { ProviderConfig, ExecutionOptions, AuthenticationCredentials, ConfigurationOptions } from '../types.js';
import { spawnProcess } from './process-utils.js';

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
      exec('which claude', (error) => resolve(!error));
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
      try {
        await spawnProcess({
          command: 'claude',
          args: ['setup-token']
        });
        this.isAuthenticated = true;
        return true;
      } catch (error) {
        console.error('Claude authentication failed:', (error as Error).message);
        return false;
      }
    } catch (error) {
      console.error('Claude login error:', (error as Error).message);
      return false;
    }
  }

  /**
   * Resolve the path to the claude executable
   */
  private async resolveClaudePath(): Promise<string> {
    return new Promise((resolve, reject) => {
      exec('which claude', (error, stdout) => {
        if (error) {
          reject(new Error(`Claude executable not found: ${error.message}`));
        } else {
          resolve(stdout.trim());
        }
      });
    });
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
    console.error('Executing with Claude with 8GB memory limit...');

    // Resolve the claude path first
    const claudePath = await this.resolveClaudePath();
    const command = 'node';
    const args = ['--max-old-space-size=8192', claudePath, '--dangerously-skip-permissions', '--verbose', '-p'];

    if (options.testMode) {
      // For authentication testing, use a minimal request
      return spawnProcess({ command, args, stdin: 'Hello' });
    }

    // Create a clean environment without OAuth tokens to force native auth
    const env: NodeJS.ProcessEnv = { ...process.env };

    // Remove any OAuth tokens that might interfere with native Claude auth
    delete env['CLAUDE_CODE_OAUTH_TOKEN'];
    delete env['ANTHROPIC_API_KEY'];

    if (!env['HOME']) {
      env['HOME'] = '/home/dev';
    }

    const onStdout = process.stdout.write.bind(process.stdout);
    const onStderr = process.stderr.write.bind(process.stderr);

    return spawnProcess({
      command, args, stdin: input, onStdout, onStderr, options: {
        stdio: ['pipe', 'pipe', 'pipe'],
        env
      }
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
