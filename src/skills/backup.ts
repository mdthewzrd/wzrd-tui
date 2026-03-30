// File backup system for WZRD TUI
// Saves file contents before AI edits for undo functionality

import { existsSync, readFileSync, writeFileSync, mkdirSync, readdirSync, statSync, unlinkSync } from "fs";
import { join, dirname, basename } from "path";
import { homedir } from "os";

const BACKUP_DIR = join(homedir(), ".wzrd", "backups");
const MAX_BACKUPS_PER_FILE = 10; // Keep last 10 versions
const MAX_TOTAL_BACKUPS = 1000; // Max total backups

export interface BackupEntry {
  id: string;
  filePath: string;
  originalContent: string;
  timestamp: string;
  messageId: number;
  sessionId: string;
}

export interface BackupResult {
  success: boolean;
  backupId?: string;
  error?: string;
}

export interface RestoreResult {
  success: boolean;
  filePath?: string;
  error?: string;
}

// Ensure backup directory exists
function ensureBackupDir(): void {
  if (!existsSync(BACKUP_DIR)) {
    mkdirSync(BACKUP_DIR, { recursive: true });
  }
}

// Generate backup ID
function generateBackupId(filePath: string, timestamp: string): string {
  const sanitized = filePath.replace(/[^a-zA-Z0-9]/g, "_");
  return `${sanitized}_${timestamp}`;
}

// Get backup file path
export function getBackupPath(backupId: string): string {
  return join(BACKUP_DIR, `${backupId}.backup`);
}

// Get metadata file path
function getMetadataPath(backupId: string): string {
  return join(BACKUP_DIR, `${backupId}.json`);
}

// Create backup before file edit
export async function createBackup(
  filePath: string,
  messageId: number,
  sessionId: string
): Promise<BackupResult> {
  try {
    ensureBackupDir();

    // Read current file content
    if (!existsSync(filePath)) {
      return { success: false, error: `File not found: ${filePath}` };
    }

    const content = readFileSync(filePath, "utf-8");
    const timestamp = Date.now().toString();
    const backupId = generateBackupId(filePath, timestamp);

    // Save backup content
    const backupPath = getBackupPath(backupId);
    writeFileSync(backupPath, content, "utf-8");

    // Save metadata
    const metadata: BackupEntry = {
      id: backupId,
      filePath,
      originalContent: content,
      timestamp: new Date().toISOString(),
      messageId,
      sessionId,
    };
    writeFileSync(getMetadataPath(backupId), JSON.stringify(metadata, null, 2), "utf-8");

    // Clean up old backups for this file
    await cleanupOldBackups(filePath);

    return { success: true, backupId };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

// Restore file from backup
export async function restoreBackup(backupId: string): Promise<RestoreResult> {
  try {
    const metadataPath = getMetadataPath(backupId);
    const backupPath = getBackupPath(backupId);

    if (!existsSync(metadataPath) || !existsSync(backupPath)) {
      return { success: false, error: `Backup not found: ${backupId}` };
    }

    // Read metadata
    const metadata: BackupEntry = JSON.parse(readFileSync(metadataPath, "utf-8"));

    // Read backup content
    const content = readFileSync(backupPath, "utf-8");

    // Ensure directory exists
    const dir = dirname(metadata.filePath);
    if (!existsSync(dir)) {
      mkdirSync(dir, { recursive: true });
    }

    // Restore file
    writeFileSync(metadata.filePath, content, "utf-8");

    return { success: true, filePath: metadata.filePath };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

// Get latest backup for a file
export async function getLatestBackup(filePath: string): Promise<BackupEntry | null> {
  try {
    ensureBackupDir();

    const backups = listBackups().filter(b => b.filePath === filePath);
    if (backups.length === 0) return null;

    // Sort by timestamp (newest first)
    backups.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    return backups[0] || null;
  } catch {
    return null;
  }
}

// List all backups
export function listBackups(): BackupEntry[] {
  try {
    ensureBackupDir();

    const files = readdirSync(BACKUP_DIR);
    const backups: BackupEntry[] = [];

    for (const file of files) {
      if (file.endsWith(".json")) {
        try {
          const metadata: BackupEntry = JSON.parse(
            readFileSync(join(BACKUP_DIR, file), "utf-8")
          );
          backups.push(metadata);
        } catch {
          // Skip invalid metadata files
        }
      }
    }

    return backups;
  } catch {
    return [];
  }
}

// List backups for a specific session
export function listSessionBackups(sessionId: string): BackupEntry[] {
  return listBackups().filter(b => b.sessionId === sessionId);
}

// List backups for a specific message
export function listMessageBackups(messageId: number): BackupEntry[] {
  return listBackups().filter(b => b.messageId === messageId);
}

// Delete backup
export function deleteBackup(backupId: string): boolean {
  try {
    const backupPath = getBackupPath(backupId);
    const metadataPath = getMetadataPath(backupId);

    if (existsSync(backupPath)) unlinkSync(backupPath);
    if (existsSync(metadataPath)) unlinkSync(metadataPath);

    return true;
  } catch {
    return false;
  }
}

// Clean up old backups for a file
async function cleanupOldBackups(filePath: string): Promise<void> {
  const backups = listBackups()
    .filter(b => b.filePath === filePath)
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

  // Keep only the most recent backups
  const toDelete = backups.slice(MAX_BACKUPS_PER_FILE);
  for (const backup of toDelete) {
    deleteBackup(backup.id);
  }
}

// Clean up all old backups (global cleanup)
export function cleanupAllBackups(): void {
  const backups = listBackups().sort(
    (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
  );

  if (backups.length > MAX_TOTAL_BACKUPS) {
    const toDelete = backups.slice(MAX_TOTAL_BACKUPS);
    for (const backup of toDelete) {
      deleteBackup(backup.id);
    }
  }
}

// Get backup stats
export function getBackupStats(): {
  totalBackups: number;
  totalSize: number;
  filesWithBackups: number;
} {
  try {
    const backups = listBackups();
    const uniqueFiles = new Set(backups.map(b => b.filePath));

    let totalSize = 0;
    for (const backup of backups) {
      try {
        const backupPath = getBackupPath(backup.id);
        if (existsSync(backupPath)) {
          totalSize += statSync(backupPath).size;
        }
      } catch {
        // Skip files we can't stat
      }
    }

    return {
      totalBackups: backups.length,
      totalSize,
      filesWithBackups: uniqueFiles.size,
    };
  } catch {
    return { totalBackups: 0, totalSize: 0, filesWithBackups: 0 };
  }
}

// Clear all backups
export function clearAllBackups(): void {
  try {
    const backups = listBackups();
    for (const backup of backups) {
      deleteBackup(backup.id);
    }
  } catch {
    // Ignore errors
  }
}

export default {
  createBackup,
  restoreBackup,
  getLatestBackup,
  listBackups,
  listSessionBackups,
  listMessageBackups,
  deleteBackup,
  cleanupAllBackups,
  getBackupStats,
  clearAllBackups,
};
