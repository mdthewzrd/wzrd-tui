// File diff viewer for WZRD TUI
// Shows before/after comparison for file edits

import { existsSync, readFileSync } from "fs";

export interface DiffLine {
  type: "unchanged" | "added" | "removed";
  oldLine?: number;
  newLine?: number;
  content: string;
}

export interface FileDiff {
  filePath: string;
  oldContent: string;
  newContent: string;
  lines: DiffLine[];
  additions: number;
  deletions: number;
}

export interface DiffResult {
  success: boolean;
  diff?: FileDiff;
  error?: string;
}

// Calculate unified diff between two texts
export function calculateDiff(
  filePath: string,
  oldContent: string,
  newContent: string
): FileDiff {
  const oldLines = oldContent.split("\n");
  const newLines = newContent.split("\n");
  
  const diffLines: DiffLine[] = [];
  let additions = 0;
  let deletions = 0;
  
  // Simple line-by-line comparison
  const maxLines = Math.max(oldLines.length, newLines.length);
  let oldLineNum = 1;
  let newLineNum = 1;
  
  for (let i = 0; i < maxLines; i++) {
    const oldLine = oldLines[i];
    const newLine = newLines[i];
    
    if (oldLine === undefined && newLine !== undefined) {
      // Line added
      diffLines.push({
        type: "added",
        newLine: newLineNum,
        content: newLine || "",
      });
      newLineNum++;
      additions++;
    } else if (oldLine !== undefined && newLine === undefined) {
      // Line removed
      diffLines.push({
        type: "removed",
        oldLine: oldLineNum,
        content: oldLine || "",
      });
      oldLineNum++;
      deletions++;
    } else if (oldLine !== undefined && newLine !== undefined && oldLine !== newLine) {
      // Line changed (show as removed + added)
      if (oldLine !== "") {
        diffLines.push({
          type: "removed",
          oldLine: oldLineNum,
          content: oldLine,
        });
        deletions++;
      }
      if (newLine !== "") {
        diffLines.push({
          type: "added",
          newLine: newLineNum,
          content: newLine,
        });
        additions++;
      }
      oldLineNum++;
      newLineNum++;
    } else if (oldLine !== undefined) {
      // Unchanged
      diffLines.push({
        type: "unchanged",
        oldLine: oldLineNum,
        newLine: newLineNum,
        content: oldLine,
      });
      oldLineNum++;
      newLineNum++;
    }
  }
  
  return {
    filePath,
    oldContent,
    newContent,
    lines: diffLines,
    additions,
    deletions,
  };
}

// Get diff for a file edit
export async function getFileDiff(
  filePath: string,
  oldContent: string
): Promise<DiffResult> {
  try {
    if (!existsSync(filePath)) {
      return {
        success: false,
        error: `File not found: ${filePath}`,
      };
    }
    
    const newContent = readFileSync(filePath, "utf-8");
    const diff = calculateDiff(filePath, oldContent, newContent);
    
    return {
      success: true,
      diff,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

// Format diff for terminal display
export function formatDiff(diff: FileDiff, options: {
  maxLines?: number;
  showContext?: number;
} = {}): string {
  const { maxLines = 50, showContext = 3 } = options;
  
  let output = `Diff: ${diff.filePath}\n`;
  output += `+${diff.additions} -${diff.deletions}\n`;
  output += "─".repeat(60) + "\n";
  
  // Find changed line indices
  const changedIndices = diff.lines
    .map((line, index) => ({ line, index }))
    .filter(({ line }) => line.type !== "unchanged")
    .map(({ index }) => index);
  
  if (changedIndices.length === 0) {
    return output + "No changes\n";
  }
  
  // Show context around changes
  const linesToShow = new Set<number>();
  for (const index of changedIndices) {
    for (let i = Math.max(0, index - showContext); 
         i <= Math.min(diff.lines.length - 1, index + showContext); 
         i++) {
      linesToShow.add(i);
    }
  }
  
  // Sort and limit
  const sortedIndices = Array.from(linesToShow).sort((a, b) => a - b);
  const limitedIndices = sortedIndices.slice(0, maxLines);
  
  // Track if we skipped lines
  let lastShown = -1;
  
  for (const index of limitedIndices) {
    if (lastShown >= 0 && index > lastShown + 1) {
      output += "...\n";
    }

    const line = diff.lines[index];
    if (!line) continue;
    
    const prefix = line.type === "added" ? "+ " : 
                   line.type === "removed" ? "- " : "  ";
    const lineNum = line.oldLine !== undefined && line.newLine !== undefined
      ? `${line.oldLine}:${line.newLine}`
      : line.oldLine !== undefined
        ? `${line.oldLine}:`
        : `:${line.newLine}`;
    
    output += `${prefix}${lineNum.padStart(6)} │ ${line.content}\n`;
    lastShown = index;
  }
  
  if (sortedIndices.length > maxLines) {
    output += `... (${sortedIndices.length - maxLines} more lines)\n`;
  }
  
  return output;
}

// Get diff stats only
export function getDiffStats(diff: FileDiff): {
  additions: number;
  deletions: number;
  changes: number;
} {
  return {
    additions: diff.additions,
    deletions: diff.deletions,
    changes: diff.additions + diff.deletions,
  };
}

// Create a summary of changes
export function createDiffSummary(diffs: FileDiff[]): string {
  let totalAdditions = 0;
  let totalDeletions = 0;
  
  for (const diff of diffs) {
    totalAdditions += diff.additions;
    totalDeletions += diff.deletions;
  }
  
  return `Changed ${diffs.length} file(s), +${totalAdditions}/-${totalDeletions}`;
}

export default {
  calculateDiff,
  getFileDiff,
  formatDiff,
  getDiffStats,
  createDiffSummary,
};
