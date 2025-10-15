#!/usr/bin/env node

/**
 * Google Gemini Provider Implementation
 */

import { spawn, exec } from 'child_process';
import { BaseAIProvider } from './base-provider.js';
import { ProviderConfig, ExecutionOptions, AuthenticationCredentials, ConfigurationOptions } from '../types.js';

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
      return new Promise((resolve) => {
        const gemini = spawn('gemini', ['--login'], {
          stdio: ['pipe', 'pipe', 'pipe']
        });

        let output = '';
        let errorOutput = '';

        gemini.stdout?.on('data', (data) => {
          output += data.toString();
        });

        gemini.stderr?.on('data', (data) => {
          errorOutput += data.toString();
        });

        gemini.on('close', (code) => {
          if (code === 0) {
            this.isAuthenticated = true;
            resolve(true);
          } else {
            console.error('Gemini authentication failed:', errorOutput);
            resolve(false);
          }
        });
      });
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
    if (options.testMode) {
      // For authentication testing, use a minimal request
      return new Promise((resolve, reject) => {
        const gemini = spawn('gemini', [
          '-p', 'Hello',
          '--output-format', 'text'
        ], {
          stdio: ['pipe', 'pipe', 'pipe']
        });

        let output = '';
        let errorOutput = '';

        gemini.stdout?.on('data', (data) => {
          output += data.toString();
        });

        gemini.stderr?.on('data', (data) => {
          errorOutput += data.toString();
        });

        gemini.on('close', (code) => {
          if (code === 0) {
            resolve(output);
          } else {
            reject(new Error(`Gemini failed with code ${code}: ${errorOutput}`));
          }
        });
      });
    }

    return new Promise((resolve, reject) => {
      const gemini = spawn('gemini', [
        '-p', input,
        '--output-format', 'text'
      ], {
        stdio: ['pipe', 'pipe', 'pipe']
      });

      let output = '';
      let errorOutput = '';

      gemini.stdout?.on('data', (data) => {
        output += data.toString();
      });

      gemini.stderr?.on('data', (data) => {
        errorOutput += data.toString();
      });

      gemini.on('close', (code) => {
        if (code === 0) {
          resolve(output);
        } else {
          reject(new Error(`Gemini failed with code ${code}: ${errorOutput}`));
        }
      });
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
