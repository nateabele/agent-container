#!/usr/bin/env node

/**
 * Cursor AI Provider Implementation
 */

import { spawn, exec } from 'child_process';
import { BaseAIProvider } from './base-provider.js';
import { ProviderConfig, ExecutionOptions, AuthenticationCredentials, ConfigurationOptions } from '../types.js';

interface TestModeOptions extends ExecutionOptions {
  readonly testMode?: boolean;
}

export class CursorProvider extends BaseAIProvider {

  constructor(config: ProviderConfig) {
    super('cursor', config);
  }

  /**
   * Check if Cursor CLI is available
   */
  public override async isAvailable(): Promise<boolean> {
    return new Promise((resolve) => {
      exec('which cursor-agent', (error) => {
        resolve(!error);
      });
    });
  }

  /**
   * Login/authenticate with Cursor
   */
  public async login(credentials: AuthenticationCredentials = {}): Promise<boolean> {
    try {
      // Check if already authenticated
      const isAuthenticated = await this.validateAuthentication();
      if (isAuthenticated) {
        this.isAuthenticated = true;
        return true;
      }

      // Cursor typically uses API keys or OAuth
      if (credentials.apiKey) {
        // Set the API key in environment
        process.env['CURSOR_API_KEY'] = credentials.apiKey;
        const isValid = await this.validateAuthentication();
        this.isAuthenticated = isValid;
        return isValid;
      }

      // Try OAuth login flow
      return new Promise((resolve) => {
        const cursor = spawn('cursor-agent', ['--login'], {
          stdio: ['pipe', 'pipe', 'pipe']
        });

        let output = '';
        let errorOutput = '';

        cursor.stdout?.on('data', (data) => {
          output += data.toString();
        });

        cursor.stderr?.on('data', (data) => {
          errorOutput += data.toString();
        });

        cursor.on('close', (code) => {
          if (code === 0) {
            this.isAuthenticated = true;
            resolve(true);
          } else {
            console.error('Cursor authentication failed:', errorOutput);
            resolve(false);
          }
        });
      });
    } catch (error) {
      console.error('Cursor login error:', (error as Error).message);
      return false;
    }
  }

  /**
   * Validate Cursor authentication
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
   * Execute a request with Cursor
   */
  public async execute(input: string, options: TestModeOptions = {}): Promise<string> {
    if (options.testMode) {
      // For authentication testing, use a minimal request
      return new Promise((resolve, reject) => {
        const cursor = spawn('cursor-agent', [
          '--prompt', 'Hello'
        ], {
          stdio: ['pipe', 'pipe', 'pipe']
        });

        let output = '';
        let errorOutput = '';

        cursor.stdout?.on('data', (data) => {
          output += data.toString();
        });

        cursor.stderr?.on('data', (data) => {
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

    return new Promise((resolve, reject) => {
      const cursor = spawn('cursor-agent', [
        '--prompt', input
      ], {
        stdio: ['pipe', 'pipe', 'pipe']
      });

      let output = '';
      let errorOutput = '';

      cursor.stdout?.on('data', (data) => {
        output += data.toString();
      });

      cursor.stderr?.on('data', (data) => {
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

  /**
   * Get Cursor-specific configuration options
   */
  public override getConfigurationOptions(): ConfigurationOptions {
    return {
      name: this.name,
      description: 'Cursor AI - AI-powered code editor with advanced capabilities',
      supportsUsageLimits: true,
      supportsAuthentication: true,
      requiresApiKey: false, // Supports multiple auth methods
      requiresOAuth: false, // Optional OAuth
      supportsStreaming: true
    };
  }
}
