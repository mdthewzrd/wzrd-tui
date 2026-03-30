// Message persistence for WZRD TUI
// Saves/loads chat sessions to SQLite database

import { Database } from "bun:sqlite";
import { join } from "path";
import { homedir } from "os";
import { existsSync, mkdirSync } from "fs";

const STORAGE_DIR = join(homedir(), ".wzrd-tui");
const DB_PATH = join(STORAGE_DIR, "sessions.db");

export interface Session {
  id: string;
  title: string;
  createdAt: string;
  updatedAt: string;
  messages: Message[];
  contextTokens: number;
  totalTokens: number;
  cost: number;
  model: string;
  mode: string;
}

export interface Message {
  id: number;
  role: "user" | "assistant" | "system";
  content: string;
  agent?: string;
  agentFullName?: string;
  model?: string;
  timestamp: string;
  responseTime?: string;
  status?: "complete" | "interrupted" | "thinking";
  attachments?: { type: string; label: string; color: string }[];
}

// Ensure storage directory exists
function ensureStorageDir() {
  if (!existsSync(STORAGE_DIR)) {
    mkdirSync(STORAGE_DIR, { recursive: true });
  }
}

// Initialize database
let db: Database | null = null;

function getDb(): Database {
  if (!db) {
    ensureStorageDir();
    db = new Database(DB_PATH);
    db.run(`
      CREATE TABLE IF NOT EXISTS sessions (
        id TEXT PRIMARY KEY,
        title TEXT NOT NULL,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL,
        messages TEXT NOT NULL,
        context_tokens INTEGER DEFAULT 0,
        total_tokens INTEGER DEFAULT 128000,
        cost REAL DEFAULT 0,
        model TEXT DEFAULT 'kimi-k2.5',
        mode TEXT DEFAULT 'remi'
      )
    `);
  }
  return db;
}

// Generate session ID from timestamp
function generateSessionId(): string {
  return `session-${Date.now()}`;
}

// Sanitize filename
function sanitizeFilename(name: string): string {
  return name.replace(/[^a-z0-9]/gi, "_").toLowerCase();
}

// Save session to database
export function saveSession(
  messages: Message[],
  title: string,
  contextTokens: number,
  totalTokens: number,
  cost: number,
  model: string = "kimi-k2.5",
  mode: string = "remi",
  sessionId?: string
): Session {
  const db = getDb();
  const id = sessionId || generateSessionId();
  const now = new Date().toISOString();

  const session: Session = {
    id,
    title: title || "Untitled Session",
    createdAt: now,
    updatedAt: now,
    messages,
    contextTokens,
    totalTokens,
    cost,
    model,
    mode,
  };

  // Check if session exists
  const existing = db.query("SELECT id FROM sessions WHERE id = ?").get(id);

  if (existing) {
    // Update existing
    db.run(
      `UPDATE sessions SET
        title = ?,
        updated_at = ?,
        messages = ?,
        context_tokens = ?,
        total_tokens = ?,
        cost = ?,
        model = ?,
        mode = ?
      WHERE id = ?`,
      [session.title, now, JSON.stringify(messages), contextTokens, totalTokens, cost, model, mode, id]
    );
  } else {
    // Insert new
    db.run(
      `INSERT INTO sessions (id, title, created_at, updated_at, messages, context_tokens, total_tokens, cost, model, mode)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [id, session.title, now, now, JSON.stringify(messages), contextTokens, totalTokens, cost, model, mode]
    );
  }

  console.log(`[Storage] Session saved: ${id}`);
  return session;
}

// Load session from database
export function loadSession(sessionId: string): Session | null {
  const db = getDb();
  const row = db.query("SELECT * FROM sessions WHERE id = ?").get(sessionId) as {
    id: string;
    title: string;
    created_at: string;
    updated_at: string;
    messages: string;
    context_tokens: number;
    total_tokens: number;
    cost: number;
    model: string;
    mode: string;
  } | null;

  if (!row) {
    console.log(`[Storage] Session not found: ${sessionId}`);
    return null;
  }

  return {
    id: row.id,
    title: row.title,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    messages: JSON.parse(row.messages),
    contextTokens: row.context_tokens,
    totalTokens: row.total_tokens,
    cost: row.cost,
    model: row.model,
    mode: row.mode,
  };
}

// List all sessions
export function listSessions(): Session[] {
  const db = getDb();
  const rows = db.query("SELECT * FROM sessions ORDER BY updated_at DESC").all() as {
    id: string;
    title: string;
    created_at: string;
    updated_at: string;
    messages: string;
    context_tokens: number;
    total_tokens: number;
    cost: number;
    model: string;
    mode: string;
  }[];

  return rows.map(row => ({
    id: row.id,
    title: row.title,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    messages: JSON.parse(row.messages),
    contextTokens: row.context_tokens,
    totalTokens: row.total_tokens,
    cost: row.cost,
    model: row.model,
    mode: row.mode,
  }));
}

// Delete session
export function deleteSession(sessionId: string): boolean {
  const db = getDb();
  const result = db.run("DELETE FROM sessions WHERE id = ?", [sessionId]);
  return result.changes > 0;
}

// Get most recent session
export function getMostRecentSession(): Session | null {
  const db = getDb();
  const row = db.query("SELECT * FROM sessions ORDER BY updated_at DESC LIMIT 1").get() as {
    id: string;
    title: string;
    created_at: string;
    updated_at: string;
    messages: string;
    context_tokens: number;
    total_tokens: number;
    cost: number;
    model: string;
    mode: string;
  } | null;

  if (!row) return null;

  return {
    id: row.id,
    title: row.title,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    messages: JSON.parse(row.messages),
    contextTokens: row.context_tokens,
    totalTokens: row.total_tokens,
    cost: row.cost,
    model: row.model,
    mode: row.mode,
  };
}

// Auto-save throttle
let autoSaveTimeout: NodeJS.Timeout | null = null;

export function autoSave(
  messages: Message[],
  title: string,
  contextTokens: number,
  totalTokens: number,
  cost: number,
  model: string = "kimi-k2.5",
  mode: string = "remi",
  sessionId?: string,
  delay = 5000
): void {
  if (autoSaveTimeout) {
    clearTimeout(autoSaveTimeout);
  }

  autoSaveTimeout = setTimeout(() => {
    saveSession(messages, title, contextTokens, totalTokens, cost, model, mode, sessionId);
  }, delay);
}

// Get storage stats
export function getStorageStats(): { sessions: number; totalSize: number } {
  const db = getDb();
  const row = db.query("SELECT COUNT(*) as count FROM sessions").get() as { count: number };
  const stats = { sessions: row.count, totalSize: 0 };

  try {
    const fs = require("fs");
    stats.totalSize = fs.statSync(DB_PATH).size;
  } catch {
    // Ignore
  }

  return stats;
}

// Close database connection
export function closeStorage(): void {
  if (db) {
    db.close();
    db = null;
  }
}

export default {
  saveSession,
  loadSession,
  listSessions,
  deleteSession,
  getMostRecentSession,
  autoSave,
  getStorageStats,
  closeStorage,
};
