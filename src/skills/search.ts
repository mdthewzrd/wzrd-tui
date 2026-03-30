// Search skill for WZRD TUI
// Provides codebase search using grep/ripgrep

import { spawn } from "child_process";
import { existsSync } from "fs";
import { join } from "path";

export interface SearchResult {
  file: string;
  line: number;
  column: number;
  content: string;
  context?: string[];
}

export interface SearchSummary {
  query: string;
  results: SearchResult[];
  totalFiles: number;
  totalMatches: number;
  truncated: boolean;
  error?: string;
}

export class SearchSkill {
  private maxResults = 100;
  private contextLines = 2;

  // Check if ripgrep is available
  private async hasRipgrep(): Promise<boolean> {
    return new Promise((resolve) => {
      const proc = spawn("rg", ["--version"], { shell: true });
      proc.on("error", () => resolve(false));
      proc.on("close", (code) => resolve(code === 0));
    });
  }

  // Search codebase for pattern
  async search(
    query: string,
    options: {
      path?: string;
      caseSensitive?: boolean;
      wholeWord?: boolean;
      filePattern?: string;
      maxResults?: number;
      includeContext?: boolean;
    } = {}
  ): Promise<SearchSummary> {
    const {
      path = ".",
      caseSensitive = false,
      wholeWord = false,
      filePattern,
      maxResults = this.maxResults,
      includeContext = true,
    } = options;

    const useRipgrep = await this.hasRipgrep();

    if (useRipgrep) {
      return this.searchWithRipgrep(query, path, {
        caseSensitive,
        wholeWord,
        filePattern,
        maxResults,
        includeContext,
      });
    } else {
      return this.searchWithGrep(query, path, {
        caseSensitive,
        filePattern,
        maxResults,
      });
    }
  }

  // Search using ripgrep
  private async searchWithRipgrep(
    query: string,
    searchPath: string,
    options: {
      caseSensitive: boolean;
      wholeWord: boolean;
      filePattern?: string;
      maxResults: number;
      includeContext: boolean;
    }
  ): Promise<SearchSummary> {
    return new Promise((resolve) => {
      const args = [
        "--line-number",
        "--column",
        "--color=never",
        "--no-heading",
        "--with-filename",
        "--trim",
        "--max-count",
        String(Math.ceil(options.maxResults / 10)), // Limit per file
        "-C",
        options.includeContext ? String(this.contextLines) : "0",
      ];

      if (!options.caseSensitive) args.push("--ignore-case");
      if (options.wholeWord) args.push("--word-regexp");
      if (options.filePattern) {
        args.push("--glob", options.filePattern);
      }

      // Add excludes for common directories
      args.push(
        "--glob", "!node_modules",
        "--glob", "!.git",
        "--glob", "!dist",
        "--glob", "!build",
        "--glob", "!.next",
        "--glob", "!coverage"
      );

      args.push(query, searchPath);

      const proc = spawn("rg", args, { shell: true });
      let output = "";
      let errorOutput = "";

      proc.stdout.on("data", (data: Buffer) => {
        output += data.toString();
      });

      proc.stderr.on("data", (data: Buffer) => {
        errorOutput += data.toString();
      });

      proc.on("close", () => {
        const results = this.parseRipgrepOutput(output);
        const uniqueFiles = new Set(results.map((r) => r.file));

        resolve({
          query,
          results: results.slice(0, options.maxResults),
          totalFiles: uniqueFiles.size,
          totalMatches: results.length,
          truncated: results.length > options.maxResults,
          error: errorOutput || undefined,
        });
      });

      proc.on("error", () => {
        // Fall back to grep
        this.searchWithGrep(query, searchPath, {
          caseSensitive: options.caseSensitive,
          maxResults: options.maxResults,
        }).then(resolve);
      });
    });
  }

  // Search using grep (fallback)
  private async searchWithGrep(
    query: string,
    searchPath: string,
    options: {
      caseSensitive: boolean;
      filePattern?: string;
      maxResults: number;
    }
  ): Promise<SearchSummary> {
    return new Promise((resolve) => {
      // Escape special regex characters for grep
      const escapedQuery = query.replace(/[[\]{}()*+?.\\^$|]/g, "\\$&");

      const args = [
        "-r",
        "-n",
        "--include",
        options.filePattern || "*",
        "--exclude-dir=node_modules",
        "--exclude-dir=.git",
        "--exclude-dir=dist",
        "--exclude-dir=build",
      ];

      if (!options.caseSensitive) args.push("-i");

      args.push(escapedQuery, searchPath);

      const proc = spawn("grep", args, { shell: true });
      let output = "";
      let errorOutput = "";

      proc.stdout.on("data", (data: Buffer) => {
        output += data.toString();
      });

      proc.stderr.on("data", (data: Buffer) => {
        errorOutput += data.toString();
      });

      proc.on("close", () => {
        const results = this.parseGrepOutput(output);
        const uniqueFiles = new Set(results.map((r) => r.file));

        resolve({
          query,
          results: results.slice(0, options.maxResults),
          totalFiles: uniqueFiles.size,
          totalMatches: results.length,
          truncated: results.length > options.maxResults,
          error: errorOutput || undefined,
        });
      });

      proc.on("error", (err) => {
        resolve({
          query,
          results: [],
          totalFiles: 0,
          totalMatches: 0,
          truncated: false,
          error: `Search failed: ${err.message}`,
        });
      });
    });
  }

  // Parse ripgrep output
  private parseRipgrepOutput(output: string): SearchResult[] {
    const results: SearchResult[] = [];
    const lines = output.split("\n").filter((l) => l.trim());

    for (const line of lines) {
      // Format: file:line:column:content
      const match = line.match(/^(.+):(\d+):(\d+):(.*)$/);
      if (match) {
        const [, file, lineNum, col, content] = match;
        results.push({
          file: file!,
          line: parseInt(lineNum!, 10),
          column: parseInt(col!, 10),
          content: content!.trim(),
        });
      }
    }

    return results;
  }

  // Parse grep output
  private parseGrepOutput(output: string): SearchResult[] {
    const results: SearchResult[] = [];
    const lines = output.split("\n").filter((l) => l.trim());

    for (const line of lines) {
      // Format: file:line:content
      const match = line.match(/^(.+):(\d+):(.*)$/);
      if (match) {
        const [, file, lineNum, content] = match;
        results.push({
          file: file!,
          line: parseInt(lineNum!, 10),
          column: 0,
          content: content!.trim(),
        });
      }
    }

    return results;
  }

  // Search for symbol (function, class, etc.)
  async searchSymbol(
    symbol: string,
    language?: string
  ): Promise<SearchSummary> {
    const patterns: Record<string, string[]> = {
      typescript: [
        `function ${symbol}`,
        `const ${symbol}`,
        `class ${symbol}`,
        `interface ${symbol}`,
        `type ${symbol}`,
        `export.*${symbol}`,
      ],
      javascript: [
        `function ${symbol}`,
        `const ${symbol}`,
        `class ${symbol}`,
        `export.*${symbol}`,
      ],
      python: [
        `def ${symbol}`,
        `class ${symbol}`,
      ],
      rust: [
        `fn ${symbol}`,
        `struct ${symbol}`,
        `impl.*${symbol}`,
      ],
      go: [
        `func ${symbol}`,
        `type ${symbol}`,
      ],
    };

    const filePatterns: Record<string, string> = {
      typescript: "*.{ts,tsx}",
      javascript: "*.{js,jsx}",
      python: "*.py",
      rust: "*.rs",
      go: "*.go",
    };

    const searchPatterns = language
      ? patterns[language] || [`${symbol}`]
      : Object.values(patterns).flat();

    const filePattern = language ? filePatterns[language] : undefined;

    // Search with first pattern
    return this.search(searchPatterns[0] || symbol, {
      filePattern,
      maxResults: 50,
    });
  }

  // Find files by name
  async findFiles(pattern: string, path: string = "."): Promise<string[]> {
    return new Promise((resolve) => {
      const args = ["-type", "f", "-name", pattern];

      // Exclude common directories
      const excludes = [
        "-not", "-path", "*/node_modules/*",
        "-not", "-path", "*/.git/*",
        "-not", "-path", "*/dist/*",
        "-not", "-path", "*/build/*",
      ];

      const proc = spawn("find", [path, ...args, ...excludes], { shell: true });
      let output = "";

      proc.stdout.on("data", (data: Buffer) => {
        output += data.toString();
      });

      proc.on("close", () => {
        const files = output
          .split("\n")
          .map((f) => f.trim())
          .filter((f) => f && existsSync(f));
        resolve(files);
      });

      proc.on("error", () => {
        resolve([]);
      });
    });
  }

  // Format search results for display
  formatResults(summary: SearchSummary): string {
    if (summary.error) {
      return `Error: ${summary.error}`;
    }

    if (summary.totalMatches === 0) {
      return `No results found for "${summary.query}"`;
    }

    let output = `Found ${summary.totalMatches} matches in ${summary.totalFiles} files:\n\n`;

    // Group by file
    const byFile = new Map<string, SearchResult[]>();
    for (const result of summary.results) {
      if (!byFile.has(result.file)) {
        byFile.set(result.file, []);
      }
      byFile.get(result.file)!.push(result);
    }

    // Format each file
    for (const [file, results] of byFile) {
      output += `${file}:\n`;
      for (const result of results.slice(0, 5)) {
        // Limit to 5 per file in display
        output += `  ${result.line}: ${result.content.slice(0, 80)}\n`;
      }
      if (results.length > 5) {
        output += `  ... and ${results.length - 5} more matches\n`;
      }
      output += "\n";
    }

    if (summary.truncated) {
      output += "(Results truncated, showing first 100 matches)\n";
    }

    return output;
  }
}

// Create singleton instance
export const searchSkill = new SearchSkill();

export default SearchSkill;
