/**
 * Utility functions for spawning and managing child processes
 */

import { spawn, SpawnOptions } from 'child_process';

export interface SpawnResult {
  stdout: string;
  stderr: string;
  exitCode: number;
}

export interface SpawnConfig {
  command: string;
  args: string[];
  options?: SpawnOptions;
  stdin?: string;
  onStdout?: (data: string) => void;
  onStderr?: (data: string) => void;
}

/**
 * Spawns a child process and returns a promise that resolves with output
 * or rejects with an error message including stderr.
 */
export function spawnProcess(config: SpawnConfig): Promise<string> {
  return new Promise((resolve, reject) => {
    const child = spawn(config.command, config.args, config.options ?? {
      stdio: ['pipe', 'pipe', 'pipe']
    });

    let stdout = '';
    let stderr = '';

    child.stdout?.on('data', (data) => {
      const text = data.toString();
      stdout += text;
      if (config.onStdout) {
        config.onStdout(text);
      }
    });

    child.stderr?.on('data', (data) => {
      const text = data.toString();
      stderr += text;
      if (config.onStderr) {
        config.onStderr(text);
      }
    });

    child.on('error', (error) => {
      reject(new Error(`Failed to spawn ${config.command}: ${error.message}`));
    });

    child.on('close', (code) => {
      if (code === 0) {
        resolve(stdout);
      } else {
        const errorMessage = stderr || stdout || 'No error output available';
        reject(new Error(`${config.command} failed with code ${code}: ${errorMessage.trim()}`));
      }
    });

    // Write stdin if provided
    if (config.stdin !== undefined) {
      try {
        if (child.stdin) {
          child.stdin.write(config.stdin);
          child.stdin.end();
        } else {
          reject(new Error(`Failed to write to ${config.command} stdin`));
        }
      } catch (error) {
        reject(new Error(`Failed to write input to ${config.command}: ${(error as Error).message}`));
      }
    }
  });
}

/**
 * Spawns a child process and returns detailed result including exit code.
 * Does not reject on non-zero exit codes.
 */
export function spawnProcessRaw(config: SpawnConfig): Promise<SpawnResult> {
  return new Promise((resolve, reject) => {
    const child = spawn(config.command, config.args, config.options ?? {
      stdio: ['pipe', 'pipe', 'pipe']
    });

    let stdout = '';
    let stderr = '';

    child.stdout?.on('data', (data) => {
      const text = data.toString();
      stdout += text;
      if (config.onStdout) {
        config.onStdout(text);
      }
    });

    child.stderr?.on('data', (data) => {
      const text = data.toString();
      stderr += text;
      if (config.onStderr) {
        config.onStderr(text);
      }
    });

    child.on('error', (error) => {
      reject(new Error(`Failed to spawn ${config.command}: ${error.message}`));
    });

    child.on('close', (code) => {
      resolve({
        stdout,
        stderr,
        exitCode: code ?? -1
      });
    });

    // Write stdin if provided
    if (config.stdin !== undefined) {
      try {
        if (child.stdin) {
          child.stdin.write(config.stdin);
          child.stdin.end();
        } else {
          reject(new Error(`Failed to write to ${config.command} stdin`));
        }
      } catch (error) {
        reject(new Error(`Failed to write input to ${config.command}: ${(error as Error).message}`));
      }
    }
  });
}
