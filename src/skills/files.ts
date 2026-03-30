// File operations skill for WZRD TUI
// Provides read, write, and edit capabilities

import { readFileSync, writeFileSync, existsSync, mkdirSync, readdirSync, statSync } from "fs";
import { join, dirname, relative } from "path";

export interface FileOperation {
  type: "read" | "write" | "edit" | "delete";
  path: string;
  content?: string;
  success: boolean;
  error?: string;
}

export interface FileInfo {
  name: string;
  path: string;
  isDirectory: boolean;
  size: number;
  modified: string;
}

export class FileSkill {
  private basePath: string;

  constructor(basePath: string = process.cwd()) {
    this.basePath = basePath;
  }

  // Read file contents
  async readFile(filePath: string): Promise<FileOperation> {
    try {
      const fullPath = this.resolvePath(filePath);
      if (!existsSync(fullPath)) {
        return {
          type: "read",
          path: filePath,
          success: false,
          error: `File not found: ${filePath}`,
        };
      }

      const content = readFileSync(fullPath, "utf-8");
      return {
        type: "read",
        path: filePath,
        content,
        success: true,
      };
    } catch (error) {
      return {
        type: "read",
        path: filePath,
        success: false,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }

  // Write file contents
  async writeFile(filePath: string, content: string): Promise<FileOperation> {
    try {
      const fullPath = this.resolvePath(filePath);
      const dir = dirname(fullPath);

      // Create directory if it doesn't exist
      if (!existsSync(dir)) {
        mkdirSync(dir, { recursive: true });
      }

      writeFileSync(fullPath, content, "utf-8");
      return {
        type: "write",
        path: filePath,
        content,
        success: true,
      };
    } catch (error) {
      return {
        type: "write",
        path: filePath,
        success: false,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }

  // Edit file (replace content)
  async editFile(filePath: string, oldContent: string, newContent: string): Promise<FileOperation> {
    try {
      const fullPath = this.resolvePath(filePath);
      if (!existsSync(fullPath)) {
        return {
          type: "edit",
          path: filePath,
          success: false,
          error: `File not found: ${filePath}`,
        };
      }

      const currentContent = readFileSync(fullPath, "utf-8");
      if (!currentContent.includes(oldContent)) {
        return {
          type: "edit",
          path: filePath,
          success: false,
          error: "Old content not found in file",
        };
      }

      const updatedContent = currentContent.replace(oldContent, newContent);
      writeFileSync(fullPath, updatedContent, "utf-8");

      return {
        type: "edit",
        path: filePath,
        content: updatedContent,
        success: true,
      };
    } catch (error) {
      return {
        type: "edit",
        path: filePath,
        success: false,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }

  // Edit file with backup (for undo support)
  async editFileWithBackup(
    filePath: string,
    oldContent: string,
    newContent: string,
    messageId: number,
    sessionId: string
  ): Promise<FileOperation & { backupId?: string }> {
    // Import backup module dynamically to avoid circular dependency
    const { createBackup } = await import("./backup");

    // Create backup before editing
    const backupResult = await createBackup(this.resolvePath(filePath), messageId, sessionId);

    // Perform the edit
    const editResult = await this.editFile(filePath, oldContent, newContent);

    return {
      ...editResult,
      backupId: backupResult.success ? backupResult.backupId : undefined,
    };
  }

  // Delete file
  async deleteFile(filePath: string): Promise<FileOperation> {
    try {
      const fullPath = this.resolvePath(filePath);
      if (!existsSync(fullPath)) {
        return {
          type: "delete",
          path: filePath,
          success: false,
          error: `File not found: ${filePath}`,
        };
      }

      // For safety, just rename with .deleted extension
      writeFileSync(fullPath + ".deleted", "", "utf-8");

      return {
        type: "delete",
        path: filePath,
        success: true,
      };
    } catch (error) {
      return {
        type: "delete",
        path: filePath,
        success: false,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }

  // List directory contents
  async listDirectory(dirPath: string = "."): Promise<FileInfo[]> {
    try {
      const fullPath = this.resolvePath(dirPath);
      if (!existsSync(fullPath)) {
        return [];
      }

      const entries = readdirSync(fullPath);
      return entries.map((name) => {
        const entryPath = join(fullPath, name);
        const stats = statSync(entryPath);
        return {
          name,
          path: relative(this.basePath, entryPath),
          isDirectory: stats.isDirectory(),
          size: stats.size,
          modified: stats.mtime.toISOString(),
        };
      });
    } catch {
      return [];
    }
  }

// Get file tree recursively
  async getFileTree(dirPath: string = ".", depth: number = 2): Promise<string> {
    try {
      const fullPath = this.resolvePath(dirPath);
      if (!existsSync(fullPath)) {
        return `Directory not found: ${dirPath}`;
      }

      const entries = readdirSync(fullPath);
      let tree = "";
      let count = 0;
      const maxEntries = 20; // Limit total entries shown

      for (const name of entries) {
        if (count >= maxEntries) {
          tree += "... (more files)\n";
          break;
        }
        // Skip hidden files, node_modules, and common large directories
        if (name.startsWith(".") || name === "node_modules" || name === "dist" || name === "build") continue;

        const entryPath = join(fullPath, name);
        const stats = statSync(entryPath);

        if (stats.isDirectory() && depth > 0) {
          tree += `${name}/\n`;
          const subTree = await this.getFileTree(join(dirPath, name), depth - 1);
          const subLines = subTree.split("\n").filter(l => l.trim());
          // Limit subdirectory entries
          const limitedSub = subLines.slice(0, 5).map((l) => "  " + l).join("\n");
          if (subLines.length > 5) {
            tree += limitedSub + "\n  ...\n";
          } else {
            tree += limitedSub + "\n";
          }
          count += subLines.length + 1;
        } else {
          tree += `${name}\n`;
          count++;
        }
      }

      return tree || "(empty directory)";
    } catch (error) {
      return `Error: ${error instanceof Error ? error.message : String(error)}`;
    }
  }

  // Get compact file tree for sidebar (limited view)
  async getSidebarFileTree(dirPath: string = "."): Promise<string> {
    try {
      const fullPath = this.resolvePath(dirPath);
      if (!existsSync(fullPath)) {
        return "No files";
      }

      const entries = readdirSync(fullPath);
      let tree = "";
      let count = 0;
      const maxEntries = 15;

      for (const name of entries) {
        if (count >= maxEntries) break;
        if (name.startsWith(".") || name === "node_modules" || name === "dist") continue;

        const entryPath = join(fullPath, name);
        const stats = statSync(entryPath);

        if (stats.isDirectory()) {
          // For sidebar, just show top-level directories with file count
          const subEntries = readdirSync(entryPath).filter(n => !n.startsWith(".")).length;
          tree += `${name}/ (${subEntries} items)\n`;
        } else {
          tree += `${name}\n`;
        }
        count++;
      }

      if (entries.length > maxEntries) {
        tree += `... and ${entries.length - maxEntries} more\n`;
      }

      return tree || "No files";
    } catch {
      return "No files";
    }
  }

  // Resolve relative path to absolute
  private resolvePath(filePath: string): string {
    if (filePath.startsWith("/")) {
      return filePath;
    }
    return join(this.basePath, filePath);
  }
}

// Create singleton instance
export const fileSkill = new FileSkill();

export default FileSkill;
