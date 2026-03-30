// 7-Layer Memory System for WZRD TUI
// Inspired by human memory architecture

import { Database } from "bun:sqlite";
import { join } from "path";
import { homedir } from "os";
import { existsSync, mkdirSync } from "fs";

const MEMORY_DB_PATH = join(homedir(), ".wzrd", "memory.db");

// Memory layer definitions
export enum MemoryLayer {
  WORKING = 1,      // Current session context
  SHORT_TERM = 2,   // Recent sessions (last hour)
  MEDIUM_TERM = 3,  // Project context (last day)
  LONG_TERM = 4,    // User preferences (last week)
  SEMANTIC = 5,     // Knowledge base (facts, concepts)
  EPISODIC = 6,     // Past experiences (specific events)
  PROCEDURAL = 7,   // How-to knowledge (skills, procedures)
}

export interface Memory {
  id: string;
  content: string;
  layer: MemoryLayer;
  category: string;
  tags: string[];
  relevance: number; // 0-1 score
  timestamp: string;
  lastAccessed: string;
  accessCount: number;
  sessionId?: string;
  source?: string; // Where this memory came from
}

export interface MemorySearchResult {
  memory: Memory;
  score: number;
}

export interface MemoryStats {
  totalMemories: number;
  byLayer: Record<MemoryLayer, number>;
  byCategory: Record<string, number>;
  totalSize: number;
}

// Initialize memory database
function initMemoryDb(): Database {
  const dir = join(homedir(), ".wzrd");
  if (!existsSync(dir)) {
    mkdirSync(dir, { recursive: true });
  }

  const db = new Database(MEMORY_DB_PATH);
  
  db.run(`
    CREATE TABLE IF NOT EXISTS memories (
      id TEXT PRIMARY KEY,
      content TEXT NOT NULL,
      layer INTEGER NOT NULL,
      category TEXT NOT NULL,
      tags TEXT NOT NULL,
      relevance REAL DEFAULT 0.5,
      timestamp TEXT NOT NULL,
      last_accessed TEXT NOT NULL,
      access_count INTEGER DEFAULT 0,
      session_id TEXT,
      source TEXT
    )
  `);

  // Create indexes for faster queries
  db.run(`CREATE INDEX IF NOT EXISTS idx_layer ON memories(layer)`);
  db.run(`CREATE INDEX IF NOT EXISTS idx_category ON memories(category)`);
  db.run(`CREATE INDEX IF NOT EXISTS idx_timestamp ON memories(timestamp)`);
  db.run(`CREATE INDEX IF NOT EXISTS idx_session ON memories(session_id)`);

  return db;
}

let db: Database | null = null;

function getDb(): Database {
  if (!db) {
    db = initMemoryDb();
  }
  return db;
}

// Generate memory ID
function generateMemoryId(): string {
  return `mem-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

// Calculate relevance score based on recency and access
function calculateRelevance(memory: Memory): number {
  const now = Date.now();
  const age = now - new Date(memory.timestamp).getTime();
  const days = age / (1000 * 60 * 60 * 24);
  
  // Recency decay (exponential)
  const recencyScore = Math.exp(-days / 7); // 7-day half-life
  
  // Access frequency
  const accessScore = Math.min(memory.accessCount / 10, 1); // Cap at 10 accesses
  
  // Layer weight (higher layers are more important)
  const layerWeight = memory.layer / 7;
  
  return (recencyScore * 0.4 + accessScore * 0.3 + layerWeight * 0.3);
}

// Add memory to system
export async function addMemory(
  content: string,
  layer: MemoryLayer,
  category: string,
  tags: string[] = [],
  sessionId?: string,
  source?: string
): Promise<Memory> {
  const db = getDb();
  const id = generateMemoryId();
  const now = new Date().toISOString();
  
  const memory: Memory = {
    id,
    content,
    layer,
    category,
    tags,
    relevance: 0.5,
    timestamp: now,
    lastAccessed: now,
    accessCount: 0,
    sessionId,
    source,
  };

  db.run(
    `INSERT INTO memories (id, content, layer, category, tags, relevance, timestamp, last_accessed, access_count, session_id, source)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      memory.id,
      memory.content,
      memory.layer,
      memory.category,
      JSON.stringify(memory.tags),
      memory.relevance,
      memory.timestamp,
      memory.lastAccessed,
      memory.accessCount,
      memory.sessionId || null,
      memory.source || null,
    ]
  );

  return memory;
}

// Get memory by ID
export function getMemory(id: string): Memory | null {
  const db = getDb();
  const row = db.query("SELECT * FROM memories WHERE id = ?").get(id) as {
    id: string;
    content: string;
    layer: number;
    category: string;
    tags: string;
    relevance: number;
    timestamp: string;
    last_accessed: string;
    access_count: number;
    session_id: string | null;
    source: string | null;
  } | null;

  if (!row) return null;

  // Update access stats
  db.run(
    `UPDATE memories SET access_count = access_count + 1, last_accessed = ? WHERE id = ?`,
    [new Date().toISOString(), id]
  );

  return {
    id: row.id,
    content: row.content,
    layer: row.layer as MemoryLayer,
    category: row.category,
    tags: JSON.parse(row.tags),
    relevance: row.relevance,
    timestamp: row.timestamp,
    lastAccessed: new Date().toISOString(),
    accessCount: row.access_count + 1,
    sessionId: row.session_id || undefined,
    source: row.source || undefined,
  };
}

// Search memories by content (simple text search)
export function searchMemories(
  query: string,
  options: {
    layer?: MemoryLayer;
    category?: string;
    limit?: number;
    minRelevance?: number;
  } = {}
): MemorySearchResult[] {
  const db = getDb();
  const { layer, category, limit = 10, minRelevance = 0.1 } = options;

  let sql = `SELECT * FROM memories WHERE content LIKE ?`;
  const params: (string | number)[] = [`%${query}%`];

  if (layer !== undefined) {
    sql += ` AND layer = ?`;
    params.push(layer);
  }

  if (category) {
    sql += ` AND category = ?`;
    params.push(category);
  }

  sql += ` ORDER BY relevance DESC, last_accessed DESC LIMIT ?`;
  params.push(limit);

  const rows = db.query(sql).all(...params) as {
    id: string;
    content: string;
    layer: number;
    category: string;
    tags: string;
    relevance: number;
    timestamp: string;
    last_accessed: string;
    access_count: number;
    session_id: string | null;
    source: string | null;
  }[];

  return rows
    .map(row => ({
      memory: {
        id: row.id,
        content: row.content,
        layer: row.layer as MemoryLayer,
        category: row.category,
        tags: JSON.parse(row.tags),
        relevance: row.relevance,
        timestamp: row.timestamp,
        lastAccessed: row.last_accessed,
        accessCount: row.access_count,
        sessionId: row.session_id || undefined,
        source: row.source || undefined,
      },
      score: row.relevance,
    }))
    .filter(result => result.score >= minRelevance);
}

// Get memories by layer
export function getMemoriesByLayer(
  layer: MemoryLayer,
  limit: number = 50
): Memory[] {
  const db = getDb();
  const rows = db.query(
    `SELECT * FROM memories WHERE layer = ? ORDER BY last_accessed DESC LIMIT ?`
  ).all(layer, limit) as {
    id: string;
    content: string;
    layer: number;
    category: string;
    tags: string;
    relevance: number;
    timestamp: string;
    last_accessed: string;
    access_count: number;
    session_id: string | null;
    source: string | null;
  }[];

  return rows.map(row => ({
    id: row.id,
    content: row.content,
    layer: row.layer as MemoryLayer,
    category: row.category,
    tags: JSON.parse(row.tags),
    relevance: row.relevance,
    timestamp: row.timestamp,
    lastAccessed: row.last_accessed,
    accessCount: row.access_count,
    sessionId: row.session_id || undefined,
    source: row.source || undefined,
  }));
}

// Get memories by category
export function getMemoriesByCategory(category: string): Memory[] {
  const db = getDb();
  const rows = db.query(
    `SELECT * FROM memories WHERE category = ? ORDER BY last_accessed DESC`
  ).all(category) as {
    id: string;
    content: string;
    layer: number;
    category: string;
    tags: string;
    relevance: number;
    timestamp: string;
    last_accessed: string;
    access_count: number;
    session_id: string | null;
    source: string | null;
  }[];

  return rows.map(row => ({
    id: row.id,
    content: row.content,
    layer: row.layer as MemoryLayer,
    category: row.category,
    tags: JSON.parse(row.tags),
    relevance: row.relevance,
    timestamp: row.timestamp,
    lastAccessed: row.last_accessed,
    accessCount: row.access_count,
    sessionId: row.session_id || undefined,
    source: row.source || undefined,
  }));
}

// Get recent memories (across all layers)
export function getRecentMemories(limit: number = 20): Memory[] {
  const db = getDb();
  const rows = db.query(
    `SELECT * FROM memories ORDER BY timestamp DESC LIMIT ?`
  ).all(limit) as {
    id: string;
    content: string;
    layer: number;
    category: string;
    tags: string;
    relevance: number;
    timestamp: string;
    last_accessed: string;
    access_count: number;
    session_id: string | null;
    source: string | null;
  }[];

  return rows.map(row => ({
    id: row.id,
    content: row.content,
    layer: row.layer as MemoryLayer,
    category: row.category,
    tags: JSON.parse(row.tags),
    relevance: row.relevance,
    timestamp: row.timestamp,
    lastAccessed: row.last_accessed,
    accessCount: row.access_count,
    sessionId: row.session_id || undefined,
    source: row.source || undefined,
  }));
}

// Update memory relevance
export function updateRelevance(id: string, relevance: number): boolean {
  const db = getDb();
  const result = db.run(`UPDATE memories SET relevance = ? WHERE id = ?`, [
    Math.max(0, Math.min(1, relevance)),
    id,
  ]);
  return result.changes > 0;
}

// Delete memory
export function deleteMemory(id: string): boolean {
  const db = getDb();
  const result = db.run(`DELETE FROM memories WHERE id = ?`, [id]);
  return result.changes > 0;
}

// Clear all memories
export function clearAllMemories(): void {
  const db = getDb();
  db.run(`DELETE FROM memories`);
}

// Get memory statistics
export function getMemoryStats(): MemoryStats {
  const db = getDb();
  
  const totalRow = db.query("SELECT COUNT(*) as count FROM memories").get() as {
    count: number;
  };

  const byLayer: Record<MemoryLayer, number> = {
    [MemoryLayer.WORKING]: 0,
    [MemoryLayer.SHORT_TERM]: 0,
    [MemoryLayer.MEDIUM_TERM]: 0,
    [MemoryLayer.LONG_TERM]: 0,
    [MemoryLayer.SEMANTIC]: 0,
    [MemoryLayer.EPISODIC]: 0,
    [MemoryLayer.PROCEDURAL]: 0,
  };

  const layerRows = db.query(
    `SELECT layer, COUNT(*) as count FROM memories GROUP BY layer`
  ).all() as { layer: number; count: number }[];

  for (const row of layerRows) {
    byLayer[row.layer as MemoryLayer] = row.count;
  }

  const categoryRows = db.query(
    `SELECT category, COUNT(*) as count FROM memories GROUP BY category`
  ).all() as { category: string; count: number }[];

  const byCategory: Record<string, number> = {};
  for (const row of categoryRows) {
    byCategory[row.category] = row.count;
  }

  // Estimate size (rough calculation)
  const sizeRow = db.query(
    "SELECT SUM(LENGTH(content)) as total FROM memories"
  ).get() as { total: number | null };

  return {
    totalMemories: totalRow.count,
    byLayer,
    byCategory,
    totalSize: sizeRow.total || 0,
  };
}

// Auto-save conversation to memory
export async function saveConversationToMemory(
  messages: { role: string; content: string }[],
  sessionId: string,
  mode: string
): Promise<void> {
  // Extract key information from conversation
  const userMessages = messages.filter(m => m.role === "user");
  const assistantMessages = messages.filter(m => m.role === "assistant");

  if (userMessages.length === 0) return;

  // Save as working memory (current session)
  const summary = `Session ${sessionId} (${mode} mode): ${userMessages.length} user messages, ${assistantMessages.length} assistant responses`;
  
  await addMemory(
    summary,
    MemoryLayer.WORKING,
    "conversation",
    [mode, "session"],
    sessionId,
    "auto-save"
  );

  // Save key user queries as short-term memory
  for (const msg of userMessages.slice(-3)) {
    if (msg.content.length > 20) {
      await addMemory(
        msg.content.slice(0, 500),
        MemoryLayer.SHORT_TERM,
        "user-query",
        [mode, "query"],
        sessionId,
        "auto-save"
      );
    }
  }
}

// Get context-relevant memories for injection
export function getRelevantMemories(
  query: string,
  maxMemories: number = 5
): Memory[] {
  const results = searchMemories(query, { limit: maxMemories * 2 });
  
  // Sort by score and return top memories
  return results
    .sort((a, b) => b.score - a.score)
    .slice(0, maxMemories)
    .map(r => r.memory);
}

// Memory layer names for display
export function getLayerName(layer: MemoryLayer): string {
  const names: Record<MemoryLayer, string> = {
    [MemoryLayer.WORKING]: "Working Memory",
    [MemoryLayer.SHORT_TERM]: "Short-Term Memory",
    [MemoryLayer.MEDIUM_TERM]: "Medium-Term Memory",
    [MemoryLayer.LONG_TERM]: "Long-Term Memory",
    [MemoryLayer.SEMANTIC]: "Semantic Memory",
    [MemoryLayer.EPISODIC]: "Episodic Memory",
    [MemoryLayer.PROCEDURAL]: "Procedural Memory",
  };
  return names[layer] || "Unknown";
}

// Memory layer descriptions
export function getLayerDescription(layer: MemoryLayer): string {
  const descriptions: Record<MemoryLayer, string> = {
    [MemoryLayer.WORKING]: "Current session context - temporary",
    [MemoryLayer.SHORT_TERM]: "Recent sessions (last hour)",
    [MemoryLayer.MEDIUM_TERM]: "Project context (last day)",
    [MemoryLayer.LONG_TERM]: "User preferences (last week)",
    [MemoryLayer.SEMANTIC]: "Facts, concepts, knowledge",
    [MemoryLayer.EPISODIC]: "Specific events and experiences",
    [MemoryLayer.PROCEDURAL]: "Skills and procedures",
  };
  return descriptions[layer] || "";
}

export default {
  MemoryLayer,
  addMemory,
  getMemory,
  searchMemories,
  getMemoriesByLayer,
  getMemoriesByCategory,
  getRecentMemories,
  updateRelevance,
  deleteMemory,
  clearAllMemories,
  getMemoryStats,
  saveConversationToMemory,
  getRelevantMemories,
  getLayerName,
  getLayerDescription,
};
