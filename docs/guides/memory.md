# Memory System Guide

## Overview

WZRD TUI features a 7-layer memory system inspired by human memory architecture.

## Memory Layers

| Layer | Name | Retention | Use Case |
|-------|------|-----------|----------|
| 1 | Working | Current session | Temporary context |
| 2 | Short-Term | 1 hour | Recent queries |
| 3 | Medium-Term | 1 day | Project context |
| 4 | Long-Term | 1 week | User preferences |
| 5 | Semantic | Permanent | Facts, concepts |
| 6 | Episodic | Permanent | Events |
| 7 | Procedural | Permanent | Skills, how-to |

## How It Works

### Automatic Saving

Conversations are automatically saved to memory after each interaction.

### Context Injection

Relevant memories are automatically injected into the system prompt based on your current query.

### Relevance Scoring

Memories are scored by:
- Recency (40%)
- Access frequency (30%)
- Layer importance (30%)

## Commands

### View Statistics

```
/memory
```

Shows:
- Total memories
- Distribution by layer
- Categories
- Storage size

### Search Memories

```
/memory search "api key"
```

Searches all layers for matching content.

### View Layer

```
/memory layer 5
```

Shows all memories in a specific layer.

### Add Memory

```
/memory add "Important note about the project"
```

Manually add a memory to long-term storage.

### Save Conversation

```
/remember
```

Explicitly save the current conversation.

### Clear Memories

```
/memory clear
```

**Warning:** Deletes all memories permanently.

## Storage Location

```
~/.wzrd/memory.db
```

SQLite database with full-text search enabled.
