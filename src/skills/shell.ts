// Shell command execution skill for WZRD TUI
// Provides live command execution with streaming output

import { spawn, type ChildProcess } from "child_process";
import { EventEmitter } from "events";

export interface ShellResult {
  command: string;
  stdout: string;
  stderr: string;
  exitCode: number | null;
  success: boolean;
  error?: string;
}

export interface ShellProgress {
  type: "stdout" | "stderr" | "exit";
  data: string;
  exitCode?: number;
}

export class ShellSkill extends EventEmitter {
  private currentProcess: ChildProcess | null = null;
  private outputBuffer: string[] = [];
  private maxBufferSize = 1000; // Max lines to keep in buffer

  // Execute command with live streaming output
  async execute(
    command: string,
    options: {
      cwd?: string;
      timeout?: number;
      onOutput?: (output: string) => void;
      onError?: (error: string) => void;
    } = {}
  ): Promise<ShellResult> {
    const { cwd = process.cwd(), timeout = 60000, onOutput, onError } = options;

    return new Promise((resolve) => {
      this.outputBuffer = [];

      // Parse command and arguments
      const parts = command.trim().split(/\s+/);
      const cmd = parts[0]!;
      const args = parts.slice(1);

      // Spawn the process
      this.currentProcess = spawn(cmd, args, {
        cwd,
        shell: true,
        env: process.env,
      });

      let stdout = "";
      let stderr = "";
      let timeoutId: NodeJS.Timeout | null = null;

      // Set timeout
      if (timeout > 0) {
        timeoutId = setTimeout(() => {
          if (this.currentProcess) {
            this.currentProcess.kill("SIGTERM");
            stderr += "\n[Command timed out after " + timeout / 1000 + "s]";
          }
        }, timeout);
      }

      // Handle stdout
      this.currentProcess.stdout?.on("data", (data: Buffer) => {
        const chunk = data.toString();
        stdout += chunk;
        this.addToBuffer(chunk, "stdout");
        if (onOutput) onOutput(chunk);
        this.emit("output", chunk);
      });

      // Handle stderr
      this.currentProcess.stderr?.on("data", (data: Buffer) => {
        const chunk = data.toString();
        stderr += chunk;
        this.addToBuffer(chunk, "stderr");
        if (onError) onError(chunk);
        this.emit("error", chunk);
      });

      // Handle process exit
      this.currentProcess.on("close", (code) => {
        if (timeoutId) clearTimeout(timeoutId);
        this.currentProcess = null;

        const result: ShellResult = {
          command,
          stdout: stdout.trim(),
          stderr: stderr.trim(),
          exitCode: code,
          success: code === 0,
        };

        this.emit("complete", result);
        resolve(result);
      });

      // Handle spawn errors
      this.currentProcess.on("error", (error) => {
        if (timeoutId) clearTimeout(timeoutId);
        this.currentProcess = null;

        const result: ShellResult = {
          command,
          stdout: stdout.trim(),
          stderr: stderr.trim(),
          exitCode: -1,
          success: false,
          error: error.message,
        };

        this.emit("error", error.message);
        this.emit("complete", result);
        resolve(result);
      });
    });
  }

  // Execute command and return result (no streaming)
  async executeSimple(
    command: string,
    cwd: string = process.cwd(),
    timeout: number = 30000
  ): Promise<ShellResult> {
    return this.execute(command, { cwd, timeout });
  }

  // Kill current running process
  kill(signal: NodeJS.Signals = "SIGTERM"): boolean {
    if (this.currentProcess) {
      this.currentProcess.kill(signal);
      return true;
    }
    return false;
  }

  // Check if a command is currently running
  isRunning(): boolean {
    return this.currentProcess !== null && !this.currentProcess.killed;
  }

  // Get current output buffer
  getBuffer(): string[] {
    return [...this.outputBuffer];
  }

  // Clear output buffer
  clearBuffer(): void {
    this.outputBuffer = [];
  }

  // Add output to buffer with line limit
  private addToBuffer(chunk: string, type: "stdout" | "stderr"): void {
    const lines = chunk.split("\n").filter((l) => l.trim());
    for (const line of lines) {
      this.outputBuffer.push(`[${type}] ${line}`);
      if (this.outputBuffer.length > this.maxBufferSize) {
        this.outputBuffer.shift();
      }
    }
  }

  // Run npm/bun commands with special handling
  async runPackageCommand(
    script: string,
    cwd: string = process.cwd()
  ): Promise<ShellResult> {
    // Check if package.json exists
    const { existsSync } = await import("fs");
    const { join } = await import("path");

    const hasPackageJson = existsSync(join(cwd, "package.json"));
    if (!hasPackageJson) {
      return {
        command: script,
        stdout: "",
        stderr: "No package.json found in current directory",
        exitCode: 1,
        success: false,
      };
    }

    // Detect package manager
    const packageManager = existsSync(join(cwd, "bun.lock"))
      ? "bun"
      : existsSync(join(cwd, "pnpm-lock.yaml"))
        ? "pnpm"
        : existsSync(join(cwd, "yarn.lock"))
          ? "yarn"
          : "npm";

    const fullCommand = `${packageManager} ${script}`;
    return this.execute(fullCommand, { cwd });
  }
}

// Create singleton instance
export const shellSkill = new ShellSkill();

export default ShellSkill;
