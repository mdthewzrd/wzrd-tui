// Git operations skill for WZRD TUI
// Provides git status, commit, diff, push, and other operations

import { spawn } from "child_process";
import { existsSync } from "fs";
import { join } from "path";

export interface GitStatus {
  branch: string;
  ahead: number;
  behind: number;
  staged: GitFile[];
  modified: GitFile[];
  untracked: string[];
  clean: boolean;
}

export interface GitFile {
  path: string;
  status: string;
  diff?: string;
}

export interface GitCommit {
  hash: string;
  shortHash: string;
  message: string;
  author: string;
  date: string;
  files: string[];
}

export interface GitResult {
  success: boolean;
  output: string;
  error?: string;
}

export class GitSkill {
  private cwd: string;

  constructor(cwd: string = process.cwd()) {
    this.cwd = cwd;
  }

  // Check if current directory is a git repository
  isRepo(): boolean {
    return existsSync(join(this.cwd, ".git"));
  }

  // Execute git command
  private async exec(args: string[]): Promise<GitResult> {
    return new Promise((resolve) => {
      const proc = spawn("git", args, {
        cwd: this.cwd,
        shell: true,
      });

      let stdout = "";
      let stderr = "";

      proc.stdout.on("data", (data: Buffer) => {
        stdout += data.toString();
      });

      proc.stderr.on("data", (data: Buffer) => {
        stderr += data.toString();
      });

      proc.on("close", (code) => {
        resolve({
          success: code === 0,
          output: stdout.trim(),
          error: stderr.trim() || undefined,
        });
      });

      proc.on("error", (err) => {
        resolve({
          success: false,
          output: stdout.trim(),
          error: err.message,
        });
      });
    });
  }

  // Get git status
  async status(): Promise<GitStatus> {
    const result = await this.exec(["status", "--porcelain", "-b"]);

    if (!result.success) {
      return {
        branch: "unknown",
        ahead: 0,
        behind: 0,
        staged: [],
        modified: [],
        untracked: [],
        clean: true,
      };
    }

    const lines = result.output.split("\n").filter((l) => l.trim());
    let branch = "unknown";
    let ahead = 0;
    let behind = 0;
    const staged: GitFile[] = [];
    const modified: GitFile[] = [];
    const untracked: string[] = [];

    for (const line of lines) {
      // Parse branch info from first line
      if (line.startsWith("##")) {
        const branchMatch = line.match(/##\s+(\S+?)(?:\.\.\.|$)/);
        if (branchMatch) {
          branch = branchMatch[1]!;
        }

        // Parse ahead/behind
        const aheadMatch = line.match(/ahead\s+(\d+)/);
        const behindMatch = line.match(/behind\s+(\d+)/);
        if (aheadMatch) ahead = parseInt(aheadMatch[1]!, 10);
        if (behindMatch) behind = parseInt(behindMatch[1]!, 10);
        continue;
      }

      // Parse file status
      const status = line.slice(0, 2);
      const file = line.slice(3).trim();

      if (status[0] !== " " && status[0] !== "?") {
        // Staged
        staged.push({ path: file, status: this.getStatusText(status[0] || "") });
      } else if (status[1] !== " ") {
        // Modified but not staged
        modified.push({ path: file, status: this.getStatusText(status[1] || "") });
      } else if (status === "??") {
        // Untracked
        untracked.push(file);
      }
    }

    return {
      branch,
      ahead,
      behind,
      staged,
      modified,
      untracked,
      clean: staged.length === 0 && modified.length === 0 && untracked.length === 0,
    };
  }

  // Get human-readable status text
  private getStatusText(code: string): string {
    const statusMap: Record<string, string> = {
      M: "modified",
      A: "added",
      D: "deleted",
      R: "renamed",
      C: "copied",
      U: "updated",
      "?": "untracked",
    };
    return statusMap[code] || code;
  }

  // Get diff for staged files
  async diffStaged(): Promise<string> {
    const result = await this.exec(["diff", "--staged"]);
    return result.success ? result.output : "";
  }

  // Get diff for unstaged files
  async diffUnstaged(): Promise<string> {
    const result = await this.exec(["diff"]);
    return result.success ? result.output : "";
  }

  // Get diff for specific file
  async diffFile(file: string): Promise<string> {
    const result = await this.exec(["diff", file]);
    return result.success ? result.output : "";
  }

  // Stage files
  async add(files: string[]): Promise<GitResult> {
    return this.exec(["add", ...files]);
  }

  // Stage all changes
  async addAll(): Promise<GitResult> {
    return this.exec(["add", "."]);
  }

  // Unstage files
  async unstage(files: string[]): Promise<GitResult> {
    return this.exec(["reset", "HEAD", ...files]);
  }

  // Commit staged changes
  async commit(message: string): Promise<GitResult> {
    return this.exec(["commit", "-m", message]);
  }

  // Commit all changes (add + commit)
  async commitAll(message: string): Promise<GitResult> {
    await this.addAll();
    return this.commit(message);
  }

  // Push to remote
  async push(remote: string = "origin", branch?: string): Promise<GitResult> {
    const args = ["push", remote];
    if (branch) args.push(branch);
    return this.exec(args);
  }

  // Pull from remote
  async pull(remote: string = "origin", branch?: string): Promise<GitResult> {
    const args = ["pull", remote];
    if (branch) args.push(branch);
    return this.exec(args);
  }

  // Push current branch
  async pushCurrent(remote: string = "origin"): Promise<GitResult> {
    return this.exec(["push", remote]);
  }

  // Pull current branch
  async pullCurrent(remote: string = "origin"): Promise<GitResult> {
    return this.exec(["pull", remote]);
  }

  // Fetch from remote
  async fetch(remote: string = "origin"): Promise<GitResult> {
    return this.exec(["fetch", remote]);
  }

  // Get recent commits
  async log(count: number = 10): Promise<GitCommit[]> {
    const result = await this.exec([
      "log",
      `--max-count=${count}`,
      "--pretty=format:%H|%h|%s|%an|%ad",
      "--date=short",
    ]);

    if (!result.success) return [];

    const commits: GitCommit[] = [];
    const lines = result.output.split("\n").filter((l) => l.trim());

    for (const line of lines) {
      const parts = line.split("|");
      if (parts.length >= 5) {
        commits.push({
          hash: parts[0]!,
          shortHash: parts[1]!,
          message: parts[2]!,
          author: parts[3]!,
          date: parts[4]!,
          files: [],
        });
      }
    }

    return commits;
  }

  // Get current branch name
  async getBranch(): Promise<string> {
    const result = await this.exec(["rev-parse", "--abbrev-ref", "HEAD"]);
    return result.success ? result.output : "unknown";
  }

  // Get list of branches
  async getBranches(): Promise<{ name: string; current: boolean }[]> {
    const result = await this.exec(["branch", "-a"]);

    if (!result.success) return [];

    const branches: { name: string; current: boolean }[] = [];
    const lines = result.output.split("\n").filter((l) => l.trim());

    for (const line of lines) {
      const trimmed = line.trim();
      const current = trimmed.startsWith("*");
      const name = current ? trimmed.slice(2) : trimmed;
      branches.push({ name, current });
    }

    return branches;
  }

  // Switch branch
  async checkout(branch: string, create: boolean = false): Promise<GitResult> {
    const args = ["checkout"];
    if (create) args.push("-b");
    args.push(branch);
    return this.exec(args);
  }

  // Create new branch
  async createBranch(branch: string): Promise<GitResult> {
    return this.exec(["branch", branch]);
  }

  // Delete branch
  async deleteBranch(branch: string, force: boolean = false): Promise<GitResult> {
    const args = force ? ["branch", "-D", branch] : ["branch", "-d", branch];
    return this.exec(args);
  }

  // Merge branch
  async merge(branch: string): Promise<GitResult> {
    return this.exec(["merge", branch]);
  }

  // Get remote information
  async getRemotes(): Promise<{ name: string; url: string }[]> {
    const result = await this.exec(["remote", "-v"]);

    if (!result.success) return [];

    const remotes: { name: string; url: string }[] = [];
    const lines = result.output.split("\n").filter((l) => l.trim());
    const seen = new Set<string>();

    for (const line of lines) {
      const match = line.match(/^(\S+)\s+(\S+)/);
      if (match && !seen.has(match[1]!)) {
        remotes.push({ name: match[1]!, url: match[2]! });
        seen.add(match[1]!);
      }
    }

    return remotes;
  }

  // Format status for display
  formatStatus(status: GitStatus): string {
    let output = `On branch ${status.branch}\n`;

    if (status.ahead > 0) {
      output += `Your branch is ahead of 'origin/${status.branch}' by ${status.ahead} commit(s)\n`;
    }
    if (status.behind > 0) {
      output += `Your branch is behind 'origin/${status.branch}' by ${status.behind} commit(s)\n`;
    }

    output += "\n";

    if (status.staged.length > 0) {
      output += "Changes to be committed:\n";
      for (const file of status.staged) {
        output += `  ${file.status}:    ${file.path}\n`;
      }
      output += "\n";
    }

    if (status.modified.length > 0) {
      output += "Changes not staged for commit:\n";
      for (const file of status.modified) {
        output += `  ${file.status}:    ${file.path}\n`;
      }
      output += "\n";
    }

    if (status.untracked.length > 0) {
      output += "Untracked files:\n";
      for (const file of status.untracked) {
        output += `  ${file}\n`;
      }
      output += "\n";
    }

    if (status.clean) {
      output += "nothing to commit, working tree clean\n";
    }

    return output;
  }

  // Format log for display
  formatLog(commits: GitCommit[]): string {
    if (commits.length === 0) return "No commits found\n";

    let output = "";
    for (const commit of commits) {
      output += `${commit.shortHash} - ${commit.date} - ${commit.author}\n`;
      output += `    ${commit.message}\n\n`;
    }
    return output;
  }

  // Handle git command with subcommand
  async handleCommand(subcommand: string, args: string[]): Promise<GitResult> {
    switch (subcommand) {
      case "status":
      case "st": {
        const status = await this.status();
        return {
          success: true,
          output: this.formatStatus(status),
        };
      }

      case "diff": {
        const diff = args.length > 0 ? await this.diffFile(args[0]!) : await this.diffUnstaged();
        return {
          success: true,
          output: diff || "No changes to diff",
        };
      }

      case "add": {
        if (args.length === 0) {
          return { success: false, output: "", error: "Usage: /git add <file>" };
        }
        return this.add(args);
      }

      case "commit": {
        if (args.length === 0) {
          return { success: false, output: "", error: "Usage: /git commit <message>" };
        }
        return this.commit(args.join(" "));
      }

      case "push":
        return this.push(args[0] || "origin", args[1]);

      case "pull":
        return this.pull(args[0] || "origin", args[1]);

      case "fetch":
        return this.fetch(args[0]);

      case "log": {
        const commits = await this.log(parseInt(args[0] || "10", 10));
        return {
          success: true,
          output: this.formatLog(commits),
        };
      }

      case "branch": {
        const branches = await this.getBranches();
        return {
          success: true,
          output: branches.map((b) => (b.current ? `* ${b.name}` : `  ${b.name}`)).join("\n"),
        };
      }

      case "checkout": {
        if (args.length === 0 || !args[0]) {
          return { success: false, output: "", error: "Usage: /git checkout <branch>" };
        }
        return this.checkout(args[0], args.includes("-b"));
      }

      default:
        return {
          success: false,
          output: "",
          error: `Unknown git subcommand: ${subcommand}. Try: status, diff, add, commit, push, pull, log, branch, checkout`,
        };
    }
  }
}

// Create singleton instance
export const gitSkill = new GitSkill();

export default GitSkill;
